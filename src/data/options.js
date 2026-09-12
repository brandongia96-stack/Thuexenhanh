// Các lựa chọn cố định của form đăng tin. `value` khớp enum trong contracts/schema.sql.

export const TRANSMISSIONS = [
  { value: 'so_tu_dong', label: 'Số tự động' },
  { value: 'so_san', label: 'Số sàn' },
]

export const FUELS = [
  { value: 'xang', label: 'Xăng' },
  { value: 'dau', label: 'Dầu' },
  { value: 'dien', label: 'Điện' },
  { value: 'hybrid', label: 'Hybrid' },
]

export const SEAT_OPTIONS = [4, 5, 7, 9, 16, 29, 45]

export const COLORS = ['Trắng', 'Đen', 'Bạc', 'Đỏ', 'Xám', 'Xanh lam', 'Vàng', 'Nâu', 'Khác']

export const BODY_STYLES = ['Đô thị', 'Gia đình', 'Gầm cao', 'Du lịch', 'Công tác', 'Dịch vụ']

export const YEARS = Array.from(
  { length: new Date().getFullYear() - 1999 },
  (_, i) => new Date().getFullYear() - i
)

// Vòng đời tin — khớp enum listing_status.
export const LISTING_STATUS = {
  nhap:          { label: 'Bản nháp',       tone: 'neutral' },
  cho_duyet:     { label: 'Chờ duyệt',      tone: 'info' },
  tu_choi:       { label: 'Bị từ chối',     tone: 'danger' },
  dang_hien_thi: { label: 'Đang hiển thị',  tone: 'verified' },
  sap_het_han:   { label: 'Sắp hết hạn',    tone: 'warn' },
  het_han:       { label: 'Đã hết hạn',     tone: 'neutral' },
  an:            { label: 'Đã ẩn',          tone: 'neutral' },
}

export const REPORT_REASONS = [
  { code: 'sai_thong_tin', label: 'Thông tin không đúng thực tế' },
  { code: 'gia_ao',        label: 'Giá ảo, báo giá khác khi gọi' },
  { code: 'khong_lien_lac',label: 'Gọi không liên lạc được' },
  { code: 'lua_dao',       label: 'Có dấu hiệu lừa đảo' },
  { code: 'trung_lap',     label: 'Tin đăng trùng lặp' },
  { code: 'khac',          label: 'Lý do khác' },
]
