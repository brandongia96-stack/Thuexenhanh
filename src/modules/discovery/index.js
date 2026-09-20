// discovery — cửa của module khám phá (tìm kiếm + trang xe + xe đã lưu).
//
// Luồng 05 làm: `listing-page`, `contact`, `saved`.
// Luồng 04 làm: `search`, `filter`, `the-xe` — và dùng lại mấy thứ dưới đây, đừng viết lại:
//
//   · napTruocTin(id)        nạp trước tin khi khách rê chuột vào thẻ xe
//   · NutLuu                 nút tim, đã optimistic + ghi thật vào CSDL
//   · nhoDanhSach / useNhoViTriCuon   bấm Quay lại là hiện lại đúng vị trí cũ
//   · taiTenDiaGioi / tenNoi tên tỉnh, quận từ id (có cache localStorage)
//   · anhTin / tiLeKhung     chọn đúng cỡ ảnh, luôn có tỉ lệ khung
//
// ⚠️ App.jsx nạp hai trang dưới bằng `lazy()`, KHÔNG import qua file này —
// đi qua cửa chung là kéo cả module vào gói đầu, vỡ ngân sách JS.

export { default as TrangXe } from './listing-page/TrangXe'
export { default as TrangDaLuu } from './saved/TrangDaLuu'
export { default as HopLienHe } from './contact/HopLienHe'
export { default as NutLuu } from './saved/NutLuu'

// Luồng 04 — dùng chung cho luồng 14 (ô tìm kiếm trang chủ).
// ⚠️ Nơi cần NHẸ (trang chủ, gói đầu) thì import THẲNG file, đừng đi qua cửa này:
//     import OTimKiem from '../discovery/search/OTimKiem'
//     import BoLoc from '../discovery/filter/BoLoc'
//     import { duongDanTimKiem } from '../discovery/filter/loc'
export { default as TheXe } from './the-xe/TheXe'
export { default as BoLoc } from './filter/BoLoc'
export { default as ChipLoc } from './filter/ChipLoc'
export { default as OTimKiem } from './search/OTimKiem'
export {
  duongDanTimKiem, urlSangLoc, locSangUrl, locRong, doanBoLoc, danhSachChip,
} from './filter/loc'

export { docTinChiTiet, napTruocTin, quenTin, conHienThi } from './listing-page/chiTietApi'
export { laySoDienThoai, loiThanhLoiNoi } from './contact/lienHeApi'
export { daLuuChua, luuXe, boLuu, danhSachDaLuu } from './saved/savedApi'
export { useLuuXe } from './saved/useLuuXe'

export { anhTin, tiLeKhung, napTruoc } from './anh'
export { taiTenDiaGioi, tenNoi } from './diaGioi'
export { nhoDanhSach, layDanhSach, quenDanhSach, useNhoViTriCuon } from './boNhoPhien'
export {
  EVENT, ghiSuKienTin, ghiXemTin, ghiXemSo, ghiBamGoi, ghiBamZalo, ghiLuuXe,
} from './ghiSuKien'
