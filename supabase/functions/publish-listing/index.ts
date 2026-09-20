// POST /publish-listing  — contracts/api.md mục 3
//
// Vào:  { listing_id, months, idem_key }
// Ra:   { charge_id, token_charged, expires_at, so_du }
// Lỗi:  { error: 'khong_du_token', so_du, can_co }
//
// Trừ token VÀ bật hiển thị nằm trong một transaction duy nhất — toàn bộ việc
// đó do hàm charge_and_publish() phía Postgres làm (0004_billing.sql mục 5).
// Function này chỉ xác thực người gọi và chuẩn hoá khoá idempotent.
//
// Giá do SERVER tính lại từ số tháng. Client gửi lên số token nào cũng không
// được nhìn tới — đó là cách duy nhất để không ai tự đăng tin giá 1 token.

import { preflight, docBody, json, loi } from '../_shared/http.ts'
import { admin, nguoiGoi } from '../_shared/db.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  const p = preflight(req)
  if (p) return p

  const user = await nguoiGoi(req)
  if (!user) return loi('chua_dang_nhap', 'Bạn cần đăng nhập')

  const body = await docBody<{ listing_id?: string; months?: number; idem_key?: string }>(req)
  const listingId = String(body?.listing_id ?? '')
  const months = Number(body?.months)
  const idemKey = String(body?.idem_key ?? '')

  if (!UUID.test(listingId)) {
    return loi('du_lieu_khong_hop_le', 'Thiếu mã tin đăng',
      { fields: { listing_id: 'khong_hop_le' } })
  }
  if (!Number.isInteger(months) || months < 1 || months > 12) {
    return loi('du_lieu_khong_hop_le', 'Số tháng phải từ 1 đến 12',
      { fields: { months: 'khong_hop_le' } })
  }

  // Khoá phải gắn với ĐÚNG tin này. Không cho gửi khoá của tin khác vào đây —
  // trùng khoá chéo tin là tin A trả tiền cho tin B được hiển thị.
  if (!idemKey.startsWith(`publish:${listingId}:`) || idemKey.length > 120) {
    return loi('du_lieu_khong_hop_le',
      'idem_key phải có dạng publish:<listing_id>:<kỳ>',
      { fields: { idem_key: 'khong_hop_le' } })
  }

  const { data, error } = await admin().rpc('charge_and_publish', {
    p_user_id: user.id,
    p_listing_id: listingId,
    p_months: months,
    p_idem_key: idemKey,
  })

  if (error) {
    console.error('publish-listing', error)
    return loi('loi_he_thong', 'Không thực hiện được, chưa trừ token của bạn')
  }
  return json(data)
})
