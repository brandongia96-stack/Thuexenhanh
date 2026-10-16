// Edge Function verify-otp — kiểm mã OTP rồi ghi phone_verified_at.
//
// Viết lại 17/10/2026 (rà "anti"). Bản trước chấp nhận mã `123456` cho MỌI số
// (cửa sau) và so mã dạng chữ thường. Bản này:
//   · chỉ so với SHA-256(mã + SĐT) do send-otp lưu, mã chưa dùng, chưa hết hạn;
//   · tối đa 5 lần nhập sai mỗi mã, đúng thì đánh dấu đã dùng (dùng 1 lần);
//   · không cho một SĐT đã xác thực ở tài khoản khác.
// Ghi phone_verified_at bằng service_role (trigger chặn không cho client tự ghi).

import { preflight, docBody, json, loi } from '../_shared/http.ts'
import { admin, nguoiGoi } from '../_shared/db.ts'

const SAI_TOI_DA = 5

async function bamMa(code: string, phone: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${code}|${phone}`))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  const p = preflight(req)
  if (p) return p

  const user = await nguoiGoi(req)
  if (!user) return loi('chua_dang_nhap', 'Bạn cần đăng nhập để xác thực OTP')

  const body = await docBody<{ phone?: string; code?: string }>(req)
  let norm = String(body?.phone ?? '').replace(/\D/g, '')
  if (norm.startsWith('84')) norm = '0' + norm.slice(2)
  if (norm.length === 9 && !norm.startsWith('0')) norm = '0' + norm
  const code = String(body?.code ?? '').trim()
  if (!norm || !/^\d{6}$/.test(code)) {
    return loi('du_lieu_khong_hop_le', 'Vui lòng nhập số điện thoại và mã 6 số')
  }

  const sb = admin()
  const { data: dong } = await sb
    .from('otp_codes')
    .select('id, code_hash, attempts')
    .eq('phone', norm)
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!dong || dong.attempts >= SAI_TOI_DA) {
    return loi('ma_sai', 'Mã đã hết hạn hoặc nhập sai quá nhiều lần. Vui lòng gửi mã mới.')
  }
  if (dong.code_hash !== await bamMa(code, norm)) {
    await sb.from('otp_codes').update({ attempts: dong.attempts + 1 }).eq('id', dong.id)
    return loi('ma_sai', 'Mã xác thực không đúng')
  }
  await sb.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', dong.id)

  const { data: trung } = await sb
    .from('users').select('id')
    .eq('phone', norm).neq('id', user.id).not('phone_verified_at', 'is', null).is('deleted_at', null)
    .limit(1)
  if (trung?.length) {
    return loi('trung_so_dien_thoai', 'Số điện thoại này đã được xác thực ở một tài khoản khác')
  }

  const now = new Date().toISOString()
  const { error } = await sb.from('users')
    .update({ phone: norm, phone_verified_at: now }).eq('id', user.id)
  if (error) {
    console.error('verify-otp update error:', error)
    return loi('loi_he_thong', 'Không thể cập nhật hồ sơ người dùng')
  }

  return json({ ok: true, phone: norm, phone_verified_at: now, message: 'Xác thực số điện thoại thành công' })
})
