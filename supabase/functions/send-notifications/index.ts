// send-notifications — cron gọi mỗi 15 phút (luồng 11).
//
//   1. scan_expiry_reminders()  -> xếp hàng nhắc hạn 3 ngày / 1 ngày / đã hết / thiếu token
//   2. claim_outbox()           -> lấy lô email + zalo chờ gửi
//   3. gửi qua Resend (email) và Zalo ZNS, ghi kết quả bằng mark_outbox()
//
// Chạy lại bao nhiêu lần cũng không gửi trùng: dedupe nằm ở unique của
// notification_outbox, không nằm ở đây.
//
// Bảo vệ: chỉ nhận header `x-cron-secret` khớp biến CRON_SECRET. Không có JWT người dùng.
//
// Biến môi trường (chưa có thì kênh đó đứng yên, dòng vẫn 'cho_gui', KHÔNG mất tin):
//   RESEND_API_KEY, MAIL_FROM
//   ZALO_ACCESS_TOKEN, ZALO_TEMPLATE_ID   (Zalo ZNS cần duyệt template trước)
//   APP_ORIGIN
//
// Cấm: không đưa số điện thoại chủ xe vào email. Nội dung lấy nguyên từ outbox,
// mà outbox do hàm SQL soạn — không có chỗ nào ghép SĐT.

import { admin } from '../_shared/db.ts'
import { json, loi, CORS } from '../_shared/http.ts'

const CRON_SECRET = Deno.env.get('CRON_SECRET')
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
const MAIL_FROM = Deno.env.get('MAIL_FROM') ?? 'Thuexenhanh <thongbao@thuexenhanh.vn>'
const ZALO_TOKEN = Deno.env.get('ZALO_ACCESS_TOKEN')
const ZALO_TEMPLATE = Deno.env.get('ZALO_TEMPLATE_ID')
const ORIGIN = Deno.env.get('APP_ORIGIN') ?? ''

type Dong = {
  id: string; user_id: string; type: string; channel: 'email' | 'zalo'
  title: string; body: string | null; link: string | null
  email: string | null; zalo_phone: string | null; attempts: number
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function guiEmail(d: Dong): Promise<'da_gui' | 'bo_qua' | 'chua_cau_hinh'> {
  if (!RESEND_KEY) return 'chua_cau_hinh'
  if (!d.email) return 'bo_qua'
  const url = d.link ? ORIGIN + d.link : ''
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [d.email],
      subject: d.title,
      html: `<p>${esc(d.body ?? '')}</p>` +
        (url ? `<p><a href="${esc(url)}">Mở Thuexenhanh</a></p>` : '') +
        `<p style="color:#8a8f9a;font-size:12px">Thuexenhanh chỉ kết nối chủ xe và khách, không đứng giữa giao dịch.</p>`,
    }),
  })
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return 'da_gui'
}

function chuanHoaSdt(s: string): string {
  const so = s.replace(/\D/g, '')
  return so.startsWith('0') ? '84' + so.slice(1) : so
}

async function guiZalo(d: Dong): Promise<'da_gui' | 'bo_qua' | 'chua_cau_hinh'> {
  if (!ZALO_TOKEN || !ZALO_TEMPLATE) return 'chua_cau_hinh'
  if (!d.zalo_phone) return 'bo_qua'
  const res = await fetch('https://business.openapi.zalo.me/message/template', {
    method: 'POST',
    headers: { access_token: ZALO_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: chuanHoaSdt(d.zalo_phone),
      template_id: ZALO_TEMPLATE,
      // Tham số theo template đã đăng ký với Zalo: tiêu đề + nội dung.
      template_data: { tieu_de: d.title, noi_dung: d.body ?? '' },
      tracking_id: d.id,
    }),
  })
  const kq = await res.json().catch(() => ({}))
  if (!res.ok || (kq.error && kq.error !== 0)) {
    throw new Error(`zalo ${res.status}: ${JSON.stringify(kq).slice(0, 200)}`)
  }
  return 'da_gui'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return loi('khong_co_quyen', 'Sai hoặc thiếu x-cron-secret')
  }

  const sb = admin()
  const quet = await sb.rpc('scan_expiry_reminders')
  if (quet.error) return loi('loi_may_chu', 'Quét hạn thất bại: ' + quet.error.message)

  const lo = await sb.rpc('claim_outbox', { p_limit: 50 })
  if (lo.error) return loi('loi_may_chu', 'Nhận lô thất bại: ' + lo.error.message)

  const tk = { da_gui: 0, bo_qua: 0, loi: 0, chua_cau_hinh: 0 }
  for (const d of (lo.data ?? []) as Dong[]) {
    try {
      const kq = d.channel === 'email' ? await guiEmail(d) : await guiZalo(d)
      if (kq === 'chua_cau_hinh') {
        // Chưa có khoá nhà cung cấp: trả dòng về hàng đợi, không tính là một lần thử.
        await sb.rpc('mark_outbox', { p_id: d.id, p_ket_qua: 'loi', p_error: 'chua_cau_hinh' })
        await sb.from('notification_outbox').update({ attempts: 0 }).eq('id', d.id)
        tk.chua_cau_hinh++
      } else {
        await sb.rpc('mark_outbox', { p_id: d.id, p_ket_qua: kq })
        tk[kq]++
      }
    } catch (e) {
      await sb.rpc('mark_outbox', { p_id: d.id, p_ket_qua: 'loi', p_error: String(e).slice(0, 300) })
      tk.loi++
    }
  }
  return json({ ok: true, quet: quet.data, gui: tk })
})
