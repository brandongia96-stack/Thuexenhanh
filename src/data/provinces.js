// Tỉnh/thành + quận/huyện. Bê từ v0.1 (`Web thue xe/src/App.jsx` dòng 84–99).
// Quận/huyện chỉ có sẵn cho 5 thành phố lớn — tỉnh khác nhập tay địa chỉ.

export const MAJOR_CITIES = ['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ']

export const PROVINCES = [
  'TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Bà Rịa - Vũng Tàu', 'Bình Dương', 'Đồng Nai', 'Khánh Hòa', 'Lâm Đồng',
  'Quảng Ninh', 'Thanh Hóa', 'Nghệ An', 'Thừa Thiên Huế', 'Quảng Nam',
  'Bình Định', 'Phú Yên', 'Bình Thuận', 'Ninh Thuận', 'Gia Lai',
  'Đắk Lắk', 'Lào Cai', 'Vĩnh Phúc', 'Bắc Ninh', 'Hải Dương',
  'Hưng Yên', 'Nam Định', 'Thái Bình', 'Ninh Bình', 'Long An',
  'Tiền Giang', 'Kiên Giang', 'An Giang', 'Sóc Trăng', 'Cà Mau',
  'Đắk Nông', 'Kon Tum', 'Bình Phước', 'Tây Ninh',
]

export const DISTRICTS = {
  'TP.HCM': ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Bình Tân', 'Bình Chánh', 'Cần Giờ', 'Củ Chi', 'Hóc Môn', 'Nhà Bè', 'Thủ Đức'],
  'Hà Nội': ['Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Long Biên', 'Tây Hồ', 'Cầu Giấy', 'Thanh Xuân', 'Hà Đông', 'Đông Anh', 'Gia Lâm', 'Sóc Sơn', 'Từ Liêm', 'Thường Tín', 'Mê Linh'],
  'Đà Nẵng': ['Hải Châu', 'Thanh Khê', 'Liên Chiểu', 'Ngũ Hành Sơn', 'Sơn Trà', 'Cẩm Lệ', 'Hòa Vang'],
  'Hải Phòng': ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Kiến An', 'Hải An', 'Đồ Sơn', 'Dương Kinh', 'Thuỷ Nguyên', 'An Dương', 'An Lão', 'Kiến Thụy', 'Tiên Lãng', 'Vĩnh Bảo', 'Cát Hải'],
  'Cần Thơ': ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt', 'Phong Điền', 'Cờ Đỏ', 'Thới Lai', 'Vĩnh Thạnh'],
}

export function districtsOf(province) {
  return DISTRICTS[province] ?? []
}
