// POST /submit-listing  — contracts/api.md mục 3
//
// Vào:  { listing_id }
// Ra:   { status: 'cho_duyet' }
// Lỗi:  du_lieu_khong_hop_le (kèm fields) · trang_thai_khong_hop_le · khong_co_quyen
//
// Chủ xe không tự đẩy tin sang `cho_duyet` được: trigger guard_listing_submit
// (0005_trust.sql) chặn, vì tin sẽ kẹt ở đó mà không có dòng nào trong hàng đợi
// kiểm duyệt. Đường duy nhất là function này. Toàn bộ kiểm tra và ghi nằm trong
// hàm submit_listing() phía Postgres (0010) để chạy trong MỘT transaction —
// function này chỉ xác thực người gọi.

import { preflight, docBody, json, loi } from '../_shared/http.ts'
import { admin, nguoiGoi } from '../_shared/db.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  const p = preflight(req)
  if (p) return p

  const user = await nguoiGoi(req)
  if (!user) return loi('chua_dang_nhap', 'Bạn cần đăng nhập')

  const body = await docBody<{ listing_id?: string }>(req)
  const listingId = String(body?.listing_id ?? '')
  if (!UUID.test(listingId)) {
    return loi('du_lieu_khong_hop_le', 'Thiếu mã tin đăng',
      { fields: { listing_id: 'khong_hop_le' } })
  }

  // user.id lấy từ JWT đã xác thực, KHÔNG lấy từ body: không ai gửi tin thay người khác.
  const { data, error } = await admin().rpc('submit_listing', {
    p_user_id: user.id,
    p_listing_id: listingId,
  })

  if (error) {
    console.error('submit-listing', error)
    return loi('loi_he_thong', 'Không gửi duyệt được, thử lại nhé')
  }
  return json(data)
})
