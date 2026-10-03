// ai-moderator — AI ĐỌC TRƯỚC tin chờ duyệt và GHI GỢI Ý cho người duyệt.
//
// Viết lại 03/10 (rà soát bản phiên ngoài). Bản trước:
//   · AI "APPROVE" là đổi thẳng tin sang `dang_hien_thi` → tin lên sàn KHÔNG trừ
//     token, không có `expires_at` (đi vòng `charge_and_publish`).
//   · AI "APPROVE" còn bật `is_verified = true` → AI phát tích xanh. Trái
//     QUYET-DINH 10: tích xanh chỉ xét theo GIẤY TỜ, do người xét.
//   · Không đặt WEBHOOK_SECRET thì ai cũng gọi được; secret lại ghi cứng trong
//     file .bat trên repo công khai.
//
// Bản này:
//   · BẮT BUỘC có WEBHOOK_SECRET — thiếu là từ chối hết (đóng khi lỗi).
//   · CHỈ ghi một dòng gợi ý vào `moderation_queue.reason`. Không đổi trạng
//     thái tin, không đổi hàng duyệt, không gửi thông báo. Người duyệt quyết.
//   · Chỉ xử lý hàng duyệt còn `cho_duyet` và tin còn `cho_duyet` — gọi giả
//     với listing_id bất kỳ cũng không làm gì được.
//   · Không gửi số điện thoại / biển số cho AI.
//
// Lưu ý pháp lý: gửi mô tả + ảnh xe sang Google (Gemini) là chuyển dữ liệu ra
// nước ngoài — luồng 12 phải ghi vào Chính sách bảo vệ dữ liệu TRƯỚC khi bật.
//
// Bật: secrets GEMINI_API_KEY + WEBHOOK_SECRET, rồi tạo Database Webhook
// INSERT trên `moderation_queue` gửi header `x-webhook-secret`.

import { json, loi } from '../_shared/http.ts'
import { admin } from '../_shared/db.ts'

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
const TOI_DA_ANH = 3
const TOI_DA_BYTE_ANH = 2_000_000

function base64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let s = ''
  // Chia khúc: String.fromCharCode(...mảng lớn) làm tràn stack với ảnh vài trăm KB.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(s)
}

Deno.serve(async (req) => {
  if (!WEBHOOK_SECRET || req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return json({ error: 'khong_co_quyen' }, 401)
  }
  if (!GEMINI_KEY) return loi('chua_cau_hinh', 'Chưa cấu hình GEMINI_API_KEY')

  let payload: { type?: string; record?: { id?: string; listing_id?: string } }
  try {
    payload = await req.json()
  } catch {
    return loi('du_lieu_khong_hop_le', 'Body không phải JSON')
  }
  const queueId = payload.record?.id
  if (payload.type !== 'INSERT' || !queueId) return json({ bo_qua: true })

  const db = admin()

  // Đọc lại từ DB, không tin payload: hàng duyệt phải có thật và còn chờ.
  const { data: hang } = await db
    .from('moderation_queue')
    .select('id, listing_id, status')
    .eq('id', queueId)
    .maybeSingle()
  if (!hang || hang.status !== 'cho_duyet') return json({ bo_qua: true })

  const { data: tin } = await db
    .from('listings')
    .select('id, status, brand_text, model_text, year, seats, fuel, price_per_day, description, delivery_fee_note, listing_images(url_medium, is_cover, sort_order, deleted_at)')
    .eq('id', hang.listing_id)
    .maybeSingle()
  if (!tin || tin.status !== 'cho_duyet') return json({ bo_qua: true })

  // deno-lint-ignore no-explicit-any
  const anh = ((tin.listing_images ?? []) as any[])
    .filter((a) => !a.deleted_at && a.url_medium)
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
    .slice(0, TOI_DA_ANH)

  const phanAnh = []
  for (const a of anh) {
    try {
      const r = await fetch(a.url_medium)
      if (!r.ok) continue
      const buf = await r.arrayBuffer()
      if (buf.byteLength > TOI_DA_BYTE_ANH) continue
      phanAnh.push({ inlineData: { data: base64(buf), mimeType: r.headers.get('content-type') ?? 'image/jpeg' } })
    } catch { /* bỏ ảnh lỗi, vẫn đánh giá phần chữ */ }
  }

  const duLieu = {
    hang_xe: tin.brand_text, dong_xe: tin.model_text, nam: tin.year, so_cho: tin.seats,
    nhien_lieu: tin.fuel, gia_ngay: tin.price_per_day,
    mo_ta: tin.description, ghi_chu_giao_xe: tin.delivery_fee_note,
  }
  const prompt = `Bạn hỗ trợ người kiểm duyệt tin cho thuê xe tự lái. Bạn KHÔNG có quyền duyệt; chỉ gợi ý.
Kiểm:
1. Mô tả/ghi chú có số điện thoại, Zalo, link web lạ không (không được phép — liên hệ đi qua nút "Xem số").
2. Ảnh có phải ô tô thật không; có phải ảnh chụp màn hình, có watermark nền tảng khác không.
3. Giá thuê có bất thường so với dòng xe không.
4. Dấu hiệu lừa đảo (đòi cọc trước, giá quá rẻ...).
Dữ liệu tin:
${JSON.stringify(duLieu)}`

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, ...phanAnh] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              goi_y: { type: 'STRING', enum: ['NEN_DUYET', 'NEN_TU_CHOI', 'CAN_XEM_KY'] },
              ly_do: { type: 'STRING', description: 'Ngắn gọn, tiếng Việt' },
            },
            required: ['goi_y', 'ly_do'],
          },
        },
      }),
    },
  )
  if (!r.ok) {
    console.error('[ai-moderator] Gemini lỗi', r.status)
    return loi('loi_he_thong', 'Gọi AI lỗi')
  }

  let kq: { goi_y?: string; ly_do?: string } = {}
  try {
    const d = await r.json()
    kq = JSON.parse(d.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}')
  } catch { /* để kq rỗng */ }

  const nhan = { NEN_DUYET: 'nên duyệt', NEN_TU_CHOI: 'nên từ chối', CAN_XEM_KY: 'cần xem kỹ' }[kq.goi_y ?? ''] ?? 'không rõ'
  const ghiChu = `[AI gợi ý: ${nhan}] ${(kq.ly_do ?? '').slice(0, 500)}`

  // Chỉ ghi khi hàng vẫn còn chờ — người duyệt có thể đã xử lý trong lúc AI chạy.
  await db.from('moderation_queue').update({ reason: ghiChu }).eq('id', queueId).eq('status', 'cho_duyet')

  return json({ ok: true, goi_y: kq.goi_y ?? null })
})
