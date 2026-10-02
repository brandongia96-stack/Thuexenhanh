// Cấu hình dùng chung cho toàn bộ văn bản pháp lý.
//
// Đổi NỘI DUNG văn bản nào thì PHẢI tăng phiên bản của văn bản đó ở đây:
// `terms` và `privacy` được ghi vào bảng `user_consents` lúc đăng nhập, nên
// tăng phiên bản = người dùng mới được hỏi đồng ý lại theo bản mới.
//
// Lịch sử:
//   20/09/2026 — terms 1.0, privacy 1.0, refund 1.0 (bản đầu)
//   02/10/2026 — terms 1.1 (thêm trách nhiệm khách thuê + sự cố nghiêm trọng),
//                privacy 2.0 (viết lại thành Bảo vệ dữ liệu cá nhân),
//                refund 1.1 (chốt thời hạn hoàn tiền),
//                operation/complaint/tax 1.0 (ba văn bản mới)
export const VAN_BAN = {
  terms: { phienBan: '1.1', hieuLuc: '02/10/2026' },
  privacy: { phienBan: '2.0', hieuLuc: '02/10/2026' },
  refund: { phienBan: '1.2', hieuLuc: '02/10/2026' },
  operation: { phienBan: '1.0', hieuLuc: '02/10/2026' },
  complaint: { phienBan: '1.0', hieuLuc: '02/10/2026' },
  tax: { phienBan: '1.0', hieuLuc: '02/10/2026' },
}

// ─────────────────────────────────────────────────────────────
// Thông tin pháp nhân — LUẬT: chưa có thông tin THẬT thì để rỗng.
// Mọi khối hiển thị thông tin này tự ẩn khi rỗng (xem `coPhapNhan`).
// CẤM điền thông tin của doanh nghiệp khác, cấm bịa mã số thuế.
// ─────────────────────────────────────────────────────────────
export const PHAP_NHAN = {
  ten: '',            // tên doanh nghiệp / hộ kinh doanh
  maSo: '',           // mã số doanh nghiệp hoặc mã số thuế
  diaChi: '',
  nguoiDaiDien: '',
  dienThoai: '',
}

// Email hỗ trợ thật. Rỗng → các trang ẩn khối liên hệ, không bịa địa chỉ.
export const EMAIL_HO_TRO = ''

export function coPhapNhan() {
  return Object.values(PHAP_NHAN).some((v) => v.trim() !== '')
}

export function coKenhLienHe() {
  return EMAIL_HO_TRO.trim() !== ''
}

// Đã thông báo website TMĐT với Bộ Công Thương chưa.
// CẤM gắn logo / mã xác thực khi cờ này còn `false` (NGHIEN-CUU-PHAP-LY.md §3A).
export const DA_THONG_BAO_BCT = false

// ─────────────────────────────────────────────────────────────
// Các mốc thời gian cam kết với người dùng.
// Anh chốt 02/10/2026. Sửa ở đây thì mọi trang đổi theo, không sửa rải rác.
// Đừng hứa con số ngắn hơn khả năng trực thật.
// ─────────────────────────────────────────────────────────────
export const THOI_HAN = {
  tiepNhanKhieuNai: '3 ngày làm việc',
  xuLyKhieuNai: '15 ngày làm việc',
  hoanToken: '15 ngày làm việc',
  luuNhatKyChiTiet: '90 ngày',
}
