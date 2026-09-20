// POST /create-topup  — contracts/api.md mục 3
//
// Vào:  { token_amount: number }
// Ra:   { topup_id, vnd_amount, transfer_code, qr_url, ngan_hang }
//
// Hàm này KHÔNG cộng token. Nó chỉ tạo một yêu cầu nạp và một mã đối soát.
// Token chỉ được cộng khi tiền thật về tài khoản và webhook ngân hàng bắn tới.

import { preflight, docBody, json, loi } from '../_shared/http.ts'
import { admin, nguoiGoi } from '../_shared/db.ts'
import { qrUrl, coCauHinhQR, thongTinChuyenKhoan, sinhMaDoiSoat } from '../_shared/vietqr.ts'

const TOKEN_VND = 4000      // CLAUDE.md mục 6 — ĐÃ CHỐT
const TOI_THIEU = 10        // đúng một tháng hiển thị của một xe
const TOI_DA = 2500         // 10 triệu đồng. Trên mức này là phải nói chuyện với người thật.

Deno.serve(async (req) => {
  const p = preflight(req)
  if (p) return p

  // Chưa có trang "Chính sách hoàn token" (luồng 12) thì KHÔNG mở thu tiền thật.
  // LUONG-CHAT/06 mục "Cấm". Cờ này bật bằng tay sau khi trang pháp lý đã lên.
  if (Deno.env.get('NAP_TIEN_THAT') !== 'true') {
    return loi('chua_mo_nap_tien',
      'Tính năng nạp token chưa mở. Chính sách hoàn token phải được công bố trước.')
  }
  if (!coCauHinhQR) {
    return loi('chua_mo_nap_tien', 'Chưa cấu hình tài khoản nhận tiền.')
  }

  const user = await nguoiGoi(req)
  if (!user) return loi('chua_dang_nhap', 'Bạn cần đăng nhập để nạp token')

  const body = await docBody<{ token_amount?: number }>(req)
  const token = Number(body?.token_amount)
  if (!Number.isInteger(token) || token < TOI_THIEU || token > TOI_DA) {
    return loi('du_lieu_khong_hop_le',
      `Số token phải là số nguyên từ ${TOI_THIEU} đến ${TOI_DA}`,
      { fields: { token_amount: 'khong_hop_le' } })
  }

  const sb = admin()
  const vnd = token * TOKEN_VND

  // transfer_code là UNIQUE. Trùng thì sinh lại — đừng tin "ngẫu nhiên thì không trùng".
  for (let lan = 0; lan < 5; lan++) {
    const ma = sinhMaDoiSoat()
    const { data, error } = await sb
      .from('topups')
      .insert({
        user_id: user.id,
        token_amount: token,
        vnd_amount: vnd,
        transfer_code: ma,
        provider: Deno.env.get('BANK_PROVIDER') ?? 'sepay',
      })
      .select('id,token_amount,vnd_amount,transfer_code')
      .single()

    if (!error && data) {
      return json({
        topup_id: data.id,
        token_amount: data.token_amount,
        vnd_amount: data.vnd_amount,
        transfer_code: data.transfer_code,
        qr_url: qrUrl(data.vnd_amount, data.transfer_code),
        ngan_hang: thongTinChuyenKhoan(),
      })
    }
    if (error && error.code !== '23505') {
      console.error('create-topup', error)
      return loi('loi_he_thong', 'Không tạo được yêu cầu nạp, thử lại sau')
    }
  }

  return loi('loi_he_thong', 'Không sinh được mã đối soát, thử lại sau')
})
