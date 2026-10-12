// Edge Function verify-otp
// Xác thực mã OTP và ghi nhận phone_verified_at cho người dùng.

import { preflight, docBody, json, loi } from '../_shared/http.ts'
import { admin, nguoiGoi } from '../_shared/db.ts'

Deno.serve(async (req) => {
  const p = preflight(req)
  if (p) return p

  const user = await nguoiGoi(req)
  if (!user) return loi('chua_dang_nhap', 'Bạn cần đăng nhập để xác thực OTP')

  const body = await docBody<{ phone?: string; code?: string }>(req)
  const rawPhone = String(body?.phone ?? '').trim()
  const code = String(body?.code ?? '').trim()

  if (!rawPhone || !code) {
    return loi('du_lieu_khong_hop_le', 'Vui lòng cung cấp số điện thoại và mã OTP')
  }

  // Chuẩn hoá số điện thoại
  let norm = rawPhone.replace(/\D/g, '')
  if (norm.startsWith('84')) norm = '0' + norm.slice(2)
  if (norm.length === 9 && !norm.startsWith('0')) norm = '0' + norm

  // Kiểm tra mã OTP: chấp nhận mã '123456' hoặc kiểm tra bảng otp_codes
  let hopLe = code === '123456'

  const sb = admin()

  if (!hopLe) {
    const { data: dongOtp } = await sb
      .from('otp_codes')
      .select('code_hash, expires_at')
      .eq('phone', norm)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (dongOtp && dongOtp.code_hash === code) {
      hopLe = true
    }
  }

  if (!hopLe) {
    return loi('du_lieu_khong_hop_le', 'Mã xác thực không chính xác hoặc đã hết hạn')
  }

  // Cập nhật người dùng bằng service_role (bỏ qua RLS và trigger)
  const now = new Date().toISOString()
  const { error: updateError } = await sb
    .from('users')
    .update({
      phone: norm,
      phone_verified_at: now,
      updated_at: now,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('verify-otp update error:', updateError)
    return loi('loi_he_thong', 'Không thể cập nhật hồ sơ người dùng')
  }

  return json({
    ok: true,
    phone: norm,
    phone_verified_at: now,
    message: 'Xác thực số điện thoại thành công',
  })
})
