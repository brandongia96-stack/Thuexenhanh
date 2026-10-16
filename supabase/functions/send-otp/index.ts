// send-otp — gửi mã OTP 6 số tới SĐT để xác thực chính chủ.
//
// Viết lại 17/10/2026 (rà "anti"). Bản trước:
//   · trả `dev_code` (chính mã OTP) trong phản hồi → người dùng tự đọc mã,
//     "xác thực" được số của người khác mà không cần cầm điện thoại đó;
//   · lưu mã dạng chữ thường vào cột tên `code_hash`;
//   · không giới hạn số lần gửi.
//
// Bản này:
//   · CHƯA có nhà cung cấp SMS (eSMS / Zalo ZNS…) → từ chối với `chua_cau_hinh`.
//     Không bao giờ trả mã về cho client.
//   · Chỉ khi đặt secret OTP_DEV=1 (máy dev, KHÔNG đặt trên production) mới trả
//     `dev_code` để thử giao diện.
//   · Lưu SHA-256(mã + SĐT), hết hạn 5 phút, tối đa 5 lần gửi / số / ngày.
//
// Bật thật: nối nhà cung cấp SMS ở hàm guiSms() + đặt secret SMS_PROVIDER.

import { preflight, docBody, json, loi } from '../_shared/http.ts'
import { admin, nguoiGoi } from '../_shared/db.ts'

const DEV = Deno.env.get('OTP_DEV') === '1'
const SMS_PROVIDER = Deno.env.get('SMS_PROVIDER') ?? ''

export async function bamMa(code: string, phone: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${code}|${phone}`))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Chỗ nối nhà cung cấp SMS. Chưa có thì trả false.
async function guiSms(_phone: string, _code: string): Promise<boolean> {
  if (!SMS_PROVIDER) return false
  // TODO khi anh chọn nhà cung cấp: gọi API eSMS / Zalo ZNS ở đây.
  return false
}

Deno.serve(async (req) => {
  const p = preflight(req)
  if (p) return p

  const user = await nguoiGoi(req)
  if (!user) return loi('chua_dang_nhap', 'Bạn cần đăng nhập để gửi OTP')

  const body = await docBody<{ phone?: string }>(req)
  let norm = String(body?.phone ?? '').replace(/\D/g, '')
  if (norm.startsWith('84')) norm = '0' + norm.slice(2)
  if (norm.length === 9 && !norm.startsWith('0')) norm = '0' + norm
  if (!/^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(norm)) {
    return loi('du_lieu_khong_hop_le', 'Số điện thoại không đúng định dạng')
  }

  if (!SMS_PROVIDER && !DEV) {
    return loi('chua_cau_hinh', 'Chưa bật gửi tin nhắn xác thực. Vui lòng thử lại sau.')
  }

  const sb = admin()
  const { data: daGui } = await sb.rpc('otp_sends_today', { p_phone: norm })
  if ((daGui ?? 0) >= 5) {
    return loi('qua_nhieu_yeu_cau', 'Số này đã nhận 5 mã hôm nay. Vui lòng thử lại ngày mai.')
  }

  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  const code = String(100000 + (buf[0] % 900000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error } = await sb.from('otp_codes').insert({
    phone: norm, code_hash: await bamMa(code, norm), expires_at: expiresAt,
  })
  if (error) return loi('loi_he_thong', 'Không tạo được mã xác thực')

  if (!DEV) {
    const ok = await guiSms(norm, code)
    if (!ok) return loi('loi_he_thong', 'Không gửi được tin nhắn. Vui lòng thử lại.')
  }

  return json({
    ok: true, phone: norm, expires_at: expiresAt,
    ...(DEV ? { dev_code: code } : {}),
    message: 'Mã xác thực đã được gửi',
  })
})
