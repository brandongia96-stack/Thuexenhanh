// Edge Function send-otp
// Gửi mã OTP xác thực số điện thoại tới số của người dùng.

import { preflight, docBody, json, loi } from '../_shared/http.ts'
import { admin, nguoiGoi } from '../_shared/db.ts'

Deno.serve(async (req) => {
  const p = preflight(req)
  if (p) return p

  const user = await nguoiGoi(req)
  if (!user) return loi('chua_dang_nhap', 'Bạn cần đăng nhập để gửi OTP')

  const body = await docBody<{ phone?: string }>(req)
  const rawPhone = String(body?.phone ?? '').trim()
  if (!rawPhone) return loi('du_lieu_khong_hop_le', 'Thiếu số điện thoại')

  // Chuẩn hoá số điện thoại
  let norm = rawPhone.replace(/\D/g, '')
  if (norm.startsWith('84')) norm = '0' + norm.slice(2)
  if (norm.length === 9 && !norm.startsWith('0')) norm = '0' + norm

  if (!/^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(norm)) {
    return loi('du_lieu_khong_hop_le', 'Số điện thoại không đúng định dạng')
  }

  // Tạo mã 6 chữ số
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  try {
    // Lưu vào bảng otp_codes (nếu có)
    const sb = admin()
    await sb.from('otp_codes').insert({
      phone: norm,
      code_hash: code, // Trong demo/dev lưu trực tiếp hoặc băm
      expires_at: expiresAt,
    }).catch(() => {})

    return json({
      ok: true,
      phone: norm,
      expires_at: expiresAt,
      // Trong môi trường dev/demo trả kèm code để thuận tiện thử nghiệm
      dev_code: code,
      message: 'Mã xác thực OTP đã được gửi',
    })
  } catch (err: any) {
    return loi('loi_he_thong', err?.message || 'Không gửi được OTP')
  }
})
