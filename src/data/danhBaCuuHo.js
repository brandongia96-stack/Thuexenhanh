// data/danhBaCuuHo — Danh bạ cứu hộ giao thông: PHẦN TĨNH, chỉ số khẩn cấp
// chính thức do nhà nước vận hành. KHÔNG chứa số của công ty cứu hộ tư nhân.
//
// ⚠️ Lịch sử: bản trước có ~60 "công ty cứu hộ" tỉnh thành — tên công ty, số
// điện thoại, cả toạ độ lat/lng và thời gian có mặt đều do một phiên AI khác
// (Antigravity/Gemini) TỰ BỊA, không ai gọi thử hay xác minh. Người gặp nạn
// gọi nhầm số bịa là nguy hiểm thật, không phải lỗi hiển thị — đã xoá sạch
// (rà soát 17/10, xem CHANGELOG). Đã thử xác minh 5 số "cao tốc" còn lại qua
// trang web chính thức của đơn vị vận hành: 4/5 không truy cập được để xác
// minh, số còn lại (Hà Nội - Hải Phòng) xác minh được là SAI — số thật do
// VIDIFI công bố là 1900 6989, khác hẳn số bịa trong file. Không giữ lại cái
// nào không xác minh được.
//
// Số cứu hộ TƯ NHÂN (đã gọi thử, admin xác nhận) nằm ở bảng `rescue_contacts`
// (Postgres) — xem `src/modules/owner/DanhBaCuuHoSection.jsx` và
// `src/modules/shell/cuu-ho/TrangCuuHo.jsx`, cả hai đọc thêm từ đó.

export const DANH_BA_CUU_HO = [
  {
    id: 'khan-cap-113',
    ten: 'Công an — An ninh trật tự',
    sdt: '113',
    tinh: 'Toàn quốc',
    province_id: null,
    vung: 'Toàn quốc',
    dichVu: ['KhanCap'],
    dichVuText: 'Báo cáo tội phạm, gây rối trật tự công cộng, cần công an can thiệp khẩn cấp',
    ghiChu: 'Đầu số khẩn cấp quốc gia',
    lat: null,
    lng: null,
    truc247: true,
    uuTien: true,
  },
  {
    id: 'khan-cap-114',
    ten: 'Cảnh sát Phòng cháy chữa cháy & Cứu nạn cứu hộ',
    sdt: '114',
    tinh: 'Toàn quốc',
    province_id: null,
    vung: 'Toàn quốc',
    dichVu: ['KhanCap'],
    dichVuText: 'Cháy nổ, tai nạn giao thông nghiêm trọng cần cứu nạn cứu hộ khẩn cấp',
    ghiChu: 'Đầu số khẩn cấp quốc gia',
    lat: null,
    lng: null,
    truc247: true,
    uuTien: true,
  },
  {
    id: 'khan-cap-115',
    ten: 'Cấp cứu y tế',
    sdt: '115',
    tinh: 'Toàn quốc',
    province_id: null,
    vung: 'Toàn quốc',
    dichVu: ['KhanCap'],
    dichVuText: 'Có người bị thương cần xe cấp cứu y tế',
    ghiChu: 'Đầu số khẩn cấp quốc gia',
    lat: null,
    lng: null,
    truc247: true,
    uuTien: true,
  },
]

// Chỉ còn danh mục còn dữ liệu thật phía sau. Bỏ 'KeoXe'/'VaVo'/'XeDien'/
// 'CaoToc' — không để chip lọc hiện ra như thể có dữ liệu trong khi không có
// (CLAUDE.md 1.2). Số cứu hộ tư nhân từ `rescue_contacts` không gắn danh mục
// này (chỉ có `service` dạng chữ tự do), nên bộ lọc dịch vụ chỉ còn ý nghĩa
// với 3 số khẩn cấp phía trên.
export const LOAI_DICH_VU = [
  { key: 'tat-ca', label: 'Tất cả dịch vụ' },
  { key: 'KhanCap', label: '🚨 Khẩn cấp' },
]

// Chỉ còn 'Toàn quốc' trong dữ liệu tĩnh. Tỉnh/thành thật nạp động từ
// `rescue_contacts` ở nơi dùng (xem `danhSachTinh` trong
// `DanhBaCuuHoSection.jsx`), không liệt kê cứng ở đây nữa.
export const DANH_SACH_VUNG = [
  { key: 'tat-ca', label: 'Tất cả khu vực' },
]
