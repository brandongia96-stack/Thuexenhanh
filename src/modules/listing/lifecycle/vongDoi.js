// listing/lifecycle — vòng đời tin đăng.
//
//   nhap → cho_duyet → dang_hien_thi → sap_het_han → het_han → an
//                   ↘ tu_choi (có lý do)
//
// Luật bất di bất dịch: TIN LUÔN CÓ HẠN. Không có tin sống vĩnh viễn
// (gói "vĩnh viễn 199K" của v0.1 đã bị bỏ — xem CLAUDE.md mục 6).
//
// File này chỉ là logic thuần + lớp hiển thị. Việc đẩy tin sang
// `dang_hien_thi`, ghi `published_at` / `expires_at` là CỦA SERVER
// (contracts/api.md mục 0). Client không được ghi mấy cột đó.

import { LISTING_STATUS } from '../../../data/options'
import { daysUntil } from '../../../lib/format'

export const STATUS = {
  NHAP: 'nhap',
  CHO_DUYET: 'cho_duyet',
  TU_CHOI: 'tu_choi',
  DANG_HIEN_THI: 'dang_hien_thi',
  SAP_HET_HAN: 'sap_het_han',
  HET_HAN: 'het_han',
  AN: 'an',
}

// Còn bao nhiêu ngày thì tin chuyển sang `sap_het_han` và bắn thông báo (luồng 11).
export const NGUONG_SAP_HET_HAN = 3

// Chuyển trạng thái hợp lệ. Dùng để khoá nút trên giao diện — chặn thật nằm ở
// RLS + Edge Function, đây chỉ là lớp tử tế với người dùng.
const CHUYEN_HOP_LE = {
  nhap:          [STATUS.CHO_DUYET, STATUS.AN],
  cho_duyet:     [STATUS.DANG_HIEN_THI, STATUS.TU_CHOI, STATUS.NHAP],
  tu_choi:       [STATUS.NHAP, STATUS.CHO_DUYET, STATUS.AN],
  dang_hien_thi: [STATUS.SAP_HET_HAN, STATUS.HET_HAN, STATUS.AN],
  sap_het_han:   [STATUS.DANG_HIEN_THI, STATUS.HET_HAN, STATUS.AN],
  het_han:       [STATUS.DANG_HIEN_THI, STATUS.AN],
  an:            [STATUS.NHAP],
}

export function coTheChuyen(tu, den) {
  return (CHUYEN_HOP_LE[tu] ?? []).includes(den)
}

// Tin có đang lộ ra ngoài cho khách thuê thấy không.
export function dangHienThi(status) {
  return status === STATUS.DANG_HIEN_THI || status === STATUS.SAP_HET_HAN
}

// Chủ xe còn sửa được nội dung không. Tin đang chờ duyệt thì khoá lại —
// sửa giữa chừng làm kiểm duyệt viên duyệt một đằng, khách thấy một nẻo.
export function coTheSua(status) {
  return status !== STATUS.CHO_DUYET
}

export function coTheGuiDuyet(status) {
  return status === STATUS.NHAP || status === STATUS.TU_CHOI
}

// Gia hạn: chỉ có nghĩa khi tin đã từng được đăng.
export function coTheGiaHan(status) {
  return [STATUS.DANG_HIEN_THI, STATUS.SAP_HET_HAN, STATUS.HET_HAN].includes(status)
}

export function nhanTrangThai(status) {
  return LISTING_STATUS[status] ?? { label: status, tone: 'neutral' }
}

/**
 * Trạng thái THẬT của tin tại thời điểm nhìn.
 *
 * Cột `status` trong CSDL do server cập nhật theo cron — giữa hai lần cron chạy,
 * một tin `dang_hien_thi` có thể đã quá `expires_at` rồi. Hàm này suy ra trạng
 * thái đúng để giao diện khỏi nói dối chủ xe rằng tin vẫn đang chạy.
 * KHÔNG ghi ngược kết quả này vào CSDL — đó là việc của server.
 */
export function trangThaiThuc(listing) {
  if (!listing) return null
  const { status, expires_at } = listing
  if (!dangHienThi(status) || !expires_at) return status

  const conLai = daysUntil(expires_at)
  if (conLai <= 0) return STATUS.HET_HAN
  if (conLai <= NGUONG_SAP_HET_HAN) return STATUS.SAP_HET_HAN
  return STATUS.DANG_HIEN_THI
}

// Số ngày còn lại. null = tin chưa từng đăng nên chưa có hạn.
export function ngayConLai(listing) {
  if (!listing?.expires_at) return null
  return daysUntil(listing.expires_at)
}

/**
 * Câu nhắc hạn dùng cho chủ xe. Trả null khi không có gì để nói —
 * luật graceful degradation: không có dữ liệu thì ẩn cả khối, không hiện ô trống.
 */
export function loiNhacHan(listing) {
  const conLai = ngayConLai(listing)
  if (conLai == null) return null
  if (conLai <= 0) return { tone: 'danger', text: 'Tin đã hết hạn, không còn hiện với khách' }
  if (conLai <= NGUONG_SAP_HET_HAN) return { tone: 'warn', text: `Còn ${conLai} ngày là hết hạn` }
  return { tone: 'neutral', text: `Còn ${conLai} ngày hiển thị` }
}
