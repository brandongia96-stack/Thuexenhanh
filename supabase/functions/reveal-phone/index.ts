// Edge Function `reveal-phone` — contracts/api.md mục 3.
//
// Vào:  { listing_id: uuid, session_id: string }
// Ra:   { phone: "0901234567", zalo: "0901234567" | null }
//
// Vì sao việc này phải nằm ở server chứ không phải một câu select ở client:
//
//   1. Số điện thoại không được nằm trong HTML/JSON của trang trước khi khách
//      bấm. Để client đọc thẳng `listings.contact_phone` là bot crawl một vòng
//      lấy sạch danh bạ chủ xe (brief luồng 05, mục "Cấm").
//   2. Lượt lấy số là HÀNG HOÁ đem bán cho chủ xe, và là đơn vị tính tiền nếu
//      sau này bật cờ `tru_theo_lead`. Số đếm ở client thì ai cũng sửa được.
//   3. Khử trùng lặp 1 giờ chỉ làm đúng được ở đây: RLS không cho client ĐỌC
//      bảng `events`, nên client không thể biết mình đã ghi hay chưa.
//
// Chạy bằng `service_role` (bỏ qua RLS). Khoá này CHỈ tồn tại ở đây,
// không bao giờ có tiền tố VITE_.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MOT_GIO = 60 * 60 * 1000
// Giới hạn xem số: 10 xe KHÁC NHAU / 24h (anh chốt 06/10, chống bãi xe cào
// danh bạ chủ xe). Đã đăng nhập → tính theo tài khoản; chưa → theo IP đã băm.
// Bấm lại xe đã xem không tốn lượt. Chủ xe xem tin mình không tính.
const GIOI_HAN_24H = 10
// Khách chưa đăng nhập đếm theo IP — mà 4G Việt Nam dùng chung IP (CGNAT) cho
// rất nhiều máy, để 10 là chặn oan cả xóm. Nới cho IP; muốn hơn thì đăng nhập.
const GIOI_HAN_IP_24H = 30

// Băm IP trước khi lưu: đủ để đếm, không lưu IP thật (Bảo vệ dữ liệu cá nhân).
async function bamIp(ip: string) {
  const muoi = Deno.env.get('IP_SALT') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(muoi + '|' + ip))
  return Array.from(new Uint8Array(buf).slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('')
}
const TRANG_THAI_HIEN = ['dang_hien_thi', 'sap_het_han']

function tra(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function loi(ma: string, message: string, status = 400) {
  return tra({ error: ma, message }, status)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return loi('du_lieu_khong_hop_le', 'Sai phương thức.', 405)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  let listing_id: string | undefined
  let session_id: string | undefined
  try {
    ;({ listing_id, session_id } = await req.json())
  } catch {
    return loi('du_lieu_khong_hop_le', 'Thiếu dữ liệu gửi lên.')
  }
  if (!listing_id) return loi('du_lieu_khong_hop_le', 'Thiếu listing_id.')

  // Khách chưa đăng nhập vẫn được xem số — đó là cả điểm của app rao vặt.
  // Có token thì lấy user id để loại lượt chủ xe tự xem tin mình.
  let actor_id: string | null = null
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (token) {
    const { data } = await admin.auth.getUser(token)
    actor_id = data?.user?.id ?? null
  }

  const { data: tin, error } = await admin
    .from('listings')
    .select('id,owner_id,status,expires_at,deleted_at,contact_phone,contact_zalo')
    .eq('id', listing_id)
    .maybeSingle()

  if (error) return loi('du_lieu_khong_hop_le', 'Không đọc được tin.', 500)
  if (!tin || tin.deleted_at) {
    return loi('trang_thai_khong_hop_le', 'Tin này không còn tồn tại.', 404)
  }

  // Tin hết hạn thì KHÔNG trả số, kể cả khi cron chưa kịp đổi cột `status`.
  // Cột status do cron cập nhật theo chu kỳ; giữa hai lần chạy nó nói dối.
  const hetHan = tin.expires_at != null && new Date(tin.expires_at).getTime() <= Date.now()
  if (!TRANG_THAI_HIEN.includes(tin.status) || hetHan) {
    return loi('trang_thai_khong_hop_le', 'Tin đã hết hạn nên không còn số liên hệ.', 409)
  }

  // ─── Ghi sự kiện: đây mới là con số đem bán được ───
  // Chủ xe tự xem tin mình: trả số bình thường nhưng KHÔNG tính lượt.
  const laChuXe = actor_id != null && actor_id === tin.owner_id

  const ip = (req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]
    ?? '').trim()
  const ipBam = ip ? await bamIp(ip) : null

  if (!laChuXe) {
    const { data: daXem, error: loiDem } = await admin.rpc('reveal_da_xem_24h', {
      p_actor: actor_id, p_ip: ipBam, p_listing: listing_id,
    })
    if (!loiDem && (daXem ?? 0) >= (actor_id ? GIOI_HAN_24H : GIOI_HAN_IP_24H)) {
      return loi('vuot_gioi_han',
        actor_id
          ? `Anh/chị đã xem số của ${GIOI_HAN_24H} xe trong 24 giờ qua. Vui lòng thử lại sau.`
          : 'Mạng của anh/chị đã xem số của rất nhiều xe trong 24 giờ qua. Vui lòng đăng nhập để xem tiếp.',
        // 200 chứ không 429: supabase-js nuốt body khi status >= 400, khách sẽ
        // chỉ thấy "mạng chập chờn" (xem _shared/http.ts).
        200)
    }

    const tu = new Date(Date.now() - MOT_GIO).toISOString()
    // Cùng người + cùng xe trong 1 giờ chỉ tính 1 lần. "Cùng người" nhận diện
    // bằng tài khoản nếu đã đăng nhập, không thì bằng session ẩn danh.
    let q = admin
      .from('events')
      .select('id')
      .eq('kind', 'reveal_phone')
      .eq('listing_id', listing_id)
      .gte('created_at', tu)
      .limit(1)

    q = actor_id ? q.eq('actor_id', actor_id) : q.eq('session_id', session_id ?? '')

    const { data: daCo } = await q
    if (!daCo?.length) {
      await admin.from('events').insert({
        kind: 'reveal_phone',
        listing_id,
        owner_id: tin.owner_id, // lặp lại để dashboard chủ xe khỏi join
        actor_id,
        session_id: session_id ?? null,
        meta: ipBam ? { ip: ipBam } : {},
      })
    }
  }

  return tra({ phone: tin.contact_phone, zalo: tin.contact_zalo ?? null })
})
