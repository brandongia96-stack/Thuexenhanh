// discovery/contact/lienHeApi — đổi lấy số điện thoại chủ xe.
//
// Đây là THỨ DUY NHẤT app này tạo ra. Cả sản phẩm quy về một lượt bấm này,
// nên nó phải đi đường chuẩn và phải đếm được.
//
// Vì sao không đọc thẳng `listings.contact_phone` bằng PostgREST cho nhanh:
//   1. Đọc thẳng là số nằm sẵn trong JSON của trang → bot quét một vòng là có
//      sạch danh bạ chủ xe, khỏi cần bấm nút. Brief luồng 05 cấm.
//   2. Lượt lấy số là hàng hoá đem bán cho chủ xe (và là đơn vị tính tiền nếu
//      sau này bật `tru_theo_lead`). Đếm ở client thì ai cũng sửa được.
// Nên: contracts/api.md mục 3 → `POST /reveal-phone`, chạy bằng service_role.

import { callFunction } from '../../../lib/supabase'
import { HAS_BACKEND } from '../../../lib/config'
import { getSessionId } from '../../analytics/events'

export const LOI = {
  CHUA_CAU_HINH: 'chua_cau_hinh',
  KHONG_CON_HIEN_THI: 'khong_con_hien_thi',
  MANG: 'mang',
}

const THONG_BAO = {
  [LOI.CHUA_CAU_HINH]: 'Chưa kết nối máy chủ nên chưa lấy được số. Thử lại sau nhé.',
  [LOI.KHONG_CON_HIEN_THI]: 'Tin này không còn hiển thị nên không có số liên hệ.',
  [LOI.MANG]: 'Mạng đang chập chờn, chưa lấy được số. Bấm thử lại giúp em.',
  trang_thai_khong_hop_le: 'Tin này không còn hiển thị nên không có số liên hệ.',
  qua_nhieu_yeu_cau: 'Anh/chị bấm hơi nhanh, đợi một chút rồi thử lại.',
}

export function loiThanhLoiNoi(err) {
  return THONG_BAO[err?.code] ?? THONG_BAO[err?.message] ?? THONG_BAO[LOI.MANG]
}

/**
 * Lấy số điện thoại + Zalo của chủ xe.
 * Server ghi luôn sự kiện `reveal_phone` (đó mới là con số đem bán được).
 *
 * @returns {Promise<{phone: string, zalo: string|null}>}
 */
export async function laySoDienThoai(listingId) {
  if (!HAS_BACKEND) {
    throw Object.assign(new Error(THONG_BAO[LOI.CHUA_CAU_HINH]), { code: LOI.CHUA_CAU_HINH })
  }

  const data = await callFunction('reveal-phone', {
    listing_id: listingId,
    session_id: getSessionId(),
  })

  if (!data?.phone) {
    throw Object.assign(new Error(THONG_BAO[LOI.KHONG_CON_HIEN_THI]), {
      code: LOI.KHONG_CON_HIEN_THI,
    })
  }
  return { phone: data.phone, zalo: data.zalo ?? null }
}
