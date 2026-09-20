// listing — cửa duy nhất của module tin đăng.
//
// Luồng khác (03 chủ xe, 04 tìm kiếm, 05 trang xe) import từ đây, không thò
// tay vào file con. Đổi cấu trúc bên trong thì chỉ phải sửa file này.

export { default as TrangDangTin } from './TrangDangTin'
export { default as FormDangTin } from './editor/FormDangTin'
export { default as LichChanNgay } from './availability/LichChanNgay'
export { default as UploadAnh } from './media/UploadAnh'

export { useFormDangTin } from './editor/useFormDangTin'

export {
  STATUS,
  NGUONG_SAP_HET_HAN,
  coTheChuyen,
  dangHienThi,
  coTheSua,
  coTheGuiDuyet,
  coTheGiaHan,
  nhanTrangThai,
  trangThaiThuc,
  ngayConLai,
  loiNhacHan,
} from './lifecycle/vongDoi'

export { GOI, GOI_LABEL, GOI_MO_TA, nhomTruong, tenTruongCuaGoi } from './fieldGroups'

export {
  docTin,
  danhSachTinCuaToi,
  taoNhap,
  capNhatTin,
  xoaTin,
  anTin,
  guiDuyet,
  luuAnhMoi,
  sapXepAnh,
  xoaAnh,
  luuNgayChan,
  formSangHang,
  hangSangForm,
} from './listingApi'

// Dùng ở luồng 04/05 để lấy đúng cỡ ảnh cho từng chỗ hiển thị.
export { nguonAnh } from './media/storage'
export { CO_ANH, xuLyAnh, xuLyNhieuAnh } from './media/imagePipeline'
