// discovery/ghiSuKien — luật ghi nhận sự kiện của trang xe.
//
// Vì sao có file này thay vì gọi thẳng `analytics/events`:
// lượt xem và lượt lấy số là HÀNG HOÁ đem bán cho chủ xe, nên phải sạch.
// Brief luồng 05 bắt hai luật mà module analytics chung chưa làm:
//
//   1. Cùng người + cùng xe trong 1 GIỜ chỉ tính 1 lần.
//      `analytics/events` khử trùng lặp bằng Map trong bộ nhớ, cửa sổ 30 phút —
//      tải lại trang là mất sạch, khách F5 mười lần thành mười lượt xem.
//      Ở đây ghi mốc vào localStorage nên sống qua reload.
//   2. Chủ xe xem tin của chính mình KHÔNG tính.
//
// Đây vẫn là lớp phòng vệ phía client, chống nhiễu thật thà chứ không chống
// gian lận. Chốt chặn thật nằm ở Edge Function `reveal-phone` (service_role,
// đọc được bảng `events`) — đó là sự kiện đem ra tính tiền.

import { track, EVENT, getSessionId } from '../analytics/events'

const KHOA = 'txn_su_kien_v1'
const MOT_GIO = 60 * 60 * 1000
// Giữ tối đa chừng này mốc rồi dọn — localStorage có 5MB, đừng ăn hết vì thống kê.
const TOI_DA_MOC = 300

function doSo() {
  try {
    const o = JSON.parse(localStorage.getItem(KHOA) || '{}')
    return o && typeof o === 'object' ? o : {}
  } catch {
    return {}
  }
}

function ghiSo(o) {
  try {
    localStorage.setItem(KHOA, JSON.stringify(o))
  } catch {
    /* hết chỗ hoặc chế độ riêng tư: thôi không khử trùng lặp, không được vỡ trang */
  }
}

/**
 * Đã ghi sự kiện này trong 1 giờ qua chưa? Chưa thì đánh dấu là đã ghi.
 * Trả true = TRÙNG, bỏ qua.
 */
function trungTrongMotGio(kind, listingId) {
  const so = doSo()
  const bayGio = Date.now()
  const key = `${kind}:${listingId}`

  if (so[key] && bayGio - so[key] < MOT_GIO) return true

  // Dọn mốc cũ trước khi thêm mốc mới.
  for (const k of Object.keys(so)) {
    if (bayGio - so[k] >= MOT_GIO) delete so[k]
  }
  if (Object.keys(so).length > TOI_DA_MOC) {
    Object.keys(so)
      .sort((a, b) => so[a] - so[b])
      .slice(0, Object.keys(so).length - TOI_DA_MOC)
      .forEach((k) => delete so[k])
  }

  so[key] = bayGio
  ghiSo(so)
  return false
}

/**
 * Ghi một sự kiện của trang xe.
 *
 * @param {string} kind        EVENT.*
 * @param {object} tin         tin đang xem — cần `id` và `owner_id`
 * @param {string|null} userId người đang đăng nhập (null = khách vãng lai)
 * @param {object} meta
 */
export function ghiSuKienTin(kind, tin, userId, meta = {}) {
  if (!tin?.id) return
  // Luật 2: chủ xe tự xem tin mình thì không tính. Không thì số liệu bán cho
  // chủ xe chính là số lần chủ xe bấm vào tin của mình — vô nghĩa.
  if (userId && tin.owner_id && userId === tin.owner_id) return
  // Luật 1.
  if (trungTrongMotGio(kind, tin.id)) return

  // dedupe: false vì cửa sổ 1 giờ ở trên đã chặt hơn cửa sổ 30 phút mặc định.
  track(kind, {
    listingId: tin.id,
    ownerId: tin.owner_id ?? null,
    meta: { ...meta, session_id: getSessionId() },
    dedupe: false,
  })
}

export const ghiXemTin = (tin, userId) => ghiSuKienTin(EVENT.VIEW_LISTING, tin, userId)
export const ghiXemSo = (tin, userId) => ghiSuKienTin(EVENT.REVEAL_PHONE, tin, userId)
export const ghiBamGoi = (tin, userId) => ghiSuKienTin(EVENT.CLICK_CALL, tin, userId)
export const ghiBamZalo = (tin, userId) => ghiSuKienTin(EVENT.CLICK_ZALO, tin, userId)
export const ghiLuuXe = (tin, userId) => ghiSuKienTin(EVENT.SAVE_LISTING, tin, userId)

export { EVENT }
