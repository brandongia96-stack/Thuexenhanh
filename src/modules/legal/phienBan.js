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
//   11/10/2026 — terms 1.2 (bỏ giọng miễn trừ tuyệt đối → cam kết kiểm duyệt/gỡ 24h/hỗ trợ khiếu nại),
//                privacy 2.1 (dẫn căn cứ luật, ghi nhật ký lấy số / IP băm / vị trí gần đúng,
//                             quyền tải dữ liệu + xoá tài khoản ngay trong Tài khoản),
//                operation 1.1 (thêm hạn gỡ tin vi phạm 24 giờ),
//                safety 1.0 + template 1.0 (hai trang mới)
export const VAN_BAN = {
  terms: { phienBan: '1.2', hieuLuc: '11/10/2026' },
  privacy: { phienBan: '2.1', hieuLuc: '11/10/2026' },
  refund: { phienBan: '1.2', hieuLuc: '02/10/2026' },
  operation: { phienBan: '1.1', hieuLuc: '11/10/2026' },
  complaint: { phienBan: '1.0', hieuLuc: '02/10/2026' },
  tax: { phienBan: '1.0', hieuLuc: '02/10/2026' },
  safety: { phienBan: '1.0', hieuLuc: '11/10/2026' },
  template: { phienBan: '1.0', hieuLuc: '11/10/2026' },
}

// "Có gì thay đổi" — hiện ở màn "Trước khi bắt đầu" cho người đã đồng ý bản cũ.
// Mỗi dòng mô tả phiên bản HIỆN TẠI của văn bản. Tăng phiên bản thì sửa dòng này.
export const THAY_DOI = {
  terms: 'Làm rõ: Thuê Xe Nhanh không phải bên cho thuê xe, nhưng có cam kết kiểm duyệt tin, gỡ tin vi phạm trong 24 giờ và hỗ trợ khiếu nại.',
  operation: 'Thêm hạn gỡ tin vi phạm: 24 giờ kể từ khi nhận yêu cầu hợp lệ.',
  privacy: 'Viết lại theo luật bảo vệ dữ liệu cá nhân mới; ghi rõ nhật ký lấy số, IP băm, vị trí gần đúng; bạn tải dữ liệu và xoá tài khoản được ngay trong Tài khoản.',
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
