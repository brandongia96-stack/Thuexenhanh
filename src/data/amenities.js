// 13 tiện nghi. `code` là thứ lưu vào CSDL (cột listings.amenity_codes),
// `name` là thứ hiển thị. Đổi tên hiển thị không được đổi `code`.

export const AMENITIES = [
  { code: 'ban_do',        name: 'Bản đồ',           icon: 'Map' },
  { code: 'camera_360',    name: 'Camera 360',        icon: 'Aperture' },
  { code: 'cam_hanh_trinh',name: 'Camera hành trình', icon: 'Video' },
  { code: 'cam_lui',       name: 'Camera lùi',        icon: 'CameraOff' },
  { code: 'cam_bien_lop',  name: 'Cảm biến lốp',      icon: 'Gauge' },
  { code: 'gps',           name: 'Định vị GPS',       icon: 'Navigation' },
  { code: 'etc',           name: 'Thu phí không dừng (ETC)', icon: 'CreditCard' },
  { code: 'tui_khi',       name: 'Túi khí an toàn',   icon: 'ShieldCheck' },
  { code: 'lop_du_phong',  name: 'Lốp dự phòng',      icon: 'CircleDot' },
  { code: 'cam_bien_va_cham', name: 'Cảm biến va chạm', icon: 'Radar' },
  { code: 'cua_so_troi',   name: 'Cửa sổ trời',       icon: 'Sun' },
  { code: 'adas',          name: 'Hỗ trợ lái ADAS',   icon: 'Cpu' },
  { code: 'ghe_da',        name: 'Ghế da',            icon: 'Armchair' },
]

export const AMENITY_BY_CODE = Object.fromEntries(AMENITIES.map((a) => [a.code, a]))
