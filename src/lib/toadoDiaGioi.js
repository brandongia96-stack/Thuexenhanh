// lib/toadoDiaGioi — toạ độ trung tâm tỉnh/quận và hàm tính khoảng cách.
// Dùng để tính số km từ vị trí người dùng tới các xe cho thuê.

// Toạ độ trung tâm các tỉnh/thành theo province_id
export const TOA_DO_PROVINCE = {
  1: { lat: 10.7769, lng: 106.7009 }, // TP.HCM
  2: { lat: 21.0285, lng: 105.8542 }, // Hà Nội
  3: { lat: 16.0544, lng: 108.2022 }, // Đà Nẵng
  4: { lat: 20.8449, lng: 106.6881 }, // Hải Phòng
  5: { lat: 10.0452, lng: 105.7469 }, // Cần Thơ
  6: { lat: 10.3460, lng: 107.0843 }, // Bà Rịa - Vũng Tàu
  7: { lat: 10.9804, lng: 106.6519 }, // Bình Dương
  8: { lat: 10.9574, lng: 106.8427 }, // Đồng Nai
  9: { lat: 12.2388, lng: 109.1967 }, // Khánh Hòa
  10: { lat: 11.9404, lng: 108.4583 }, // Lâm Đồng
  11: { lat: 20.9505, lng: 107.0734 }, // Quảng Ninh
  12: { lat: 19.8067, lng: 105.7852 }, // Thanh Hóa
  13: { lat: 18.6734, lng: 105.6813 }, // Nghệ An
  14: { lat: 16.4637, lng: 107.5909 }, // Thừa Thiên Huế
  15: { lat: 15.5683, lng: 108.4800 }, // Quảng Nam
  16: { lat: 13.7830, lng: 109.2197 }, // Bình Định
  17: { lat: 13.0882, lng: 109.3175 }, // Phú Yên
  18: { lat: 10.9333, lng: 108.1000 }, // Bình Thuận
  19: { lat: 11.5667, lng: 108.9833 }, // Ninh Thuận
  20: { lat: 13.9833, lng: 108.0000 }, // Gia Lai
  21: { lat: 12.6667, lng: 108.0500 }, // Đắk Lắk
  22: { lat: 22.4833, lng: 103.9667 }, // Lào Cai
  23: { lat: 21.3089, lng: 105.6049 }, // Vĩnh Phúc
  24: { lat: 21.1861, lng: 106.0763 }, // Bắc Ninh
  25: { lat: 20.9372, lng: 106.3150 }, // Hải Dương
  26: { lat: 20.6464, lng: 106.0511 }, // Hưng Yên
  27: { lat: 20.4344, lng: 106.1683 }, // Nam Định
  28: { lat: 20.4464, lng: 106.3364 }, // Thái Bình
  29: { lat: 20.2506, lng: 105.9745 }, // Ninh Bình
  30: { lat: 10.5333, lng: 106.4167 }, // Long An
  31: { lat: 10.3600, lng: 106.3600 }, // Tiền Giang
  32: { lat: 10.0167, lng: 105.0833 }, // Kiên Giang
  33: { lat: 10.3833, lng: 105.4167 }, // An Giang
  34: { lat: 9.6033, lng: 105.9800 }, // Sóc Trăng
  35: { lat: 9.1769, lng: 105.1524 }, // Cà Mau
  36: { lat: 12.0000, lng: 107.6833 }, // Đắk Nông
  37: { lat: 14.3500, lng: 108.0000 }, // Kon Tum
  38: { lat: 11.7500, lng: 106.9000 }, // Bình Phước
  39: { lat: 11.3100, lng: 106.0983 }, // Tây Ninh
}

// Toạ độ trung tâm các quận/huyện theo district_id
export const TOA_DO_DISTRICT = {
  // TP.HCM (1..22)
  1: { lat: 10.7756, lng: 106.7019 }, // Quận 1
  2: { lat: 10.7844, lng: 106.6843 }, // Quận 3
  3: { lat: 10.7578, lng: 106.7013 }, // Quận 4
  4: { lat: 10.7540, lng: 106.6634 }, // Quận 5
  5: { lat: 10.7481, lng: 106.6352 }, // Quận 6
  6: { lat: 10.7340, lng: 106.7218 }, // Quận 7
  7: { lat: 10.7241, lng: 106.6286 }, // Quận 8
  8: { lat: 10.7716, lng: 106.6672 }, // Quận 10
  9: { lat: 10.7629, lng: 106.6504 }, // Quận 11
  10: { lat: 10.8672, lng: 106.6413 }, // Quận 12
  11: { lat: 10.8106, lng: 106.7091 }, // Bình Thạnh
  12: { lat: 10.8388, lng: 106.6653 }, // Gò Vấp
  13: { lat: 10.7992, lng: 106.6803 }, // Phú Nhuận
  14: { lat: 10.8015, lng: 106.6526 }, // Tân Bình
  15: { lat: 10.7901, lng: 106.6280 }, // Tân Phú
  16: { lat: 10.7654, lng: 106.6038 }, // Bình Tân
  17: { lat: 10.6874, lng: 106.5939 }, // Bình Chánh
  18: { lat: 10.4114, lng: 106.9547 }, // Cần Giờ
  19: { lat: 11.0067, lng: 106.4946 }, // Củ Chi
  20: { lat: 10.8841, lng: 106.5916 }, // Hóc Môn
  21: { lat: 10.6953, lng: 106.7327 }, // Nhà Bè
  22: { lat: 10.8494, lng: 106.7537 }, // Thủ Đức

  // Hà Nội (23..38)
  23: { lat: 21.0285, lng: 105.8542 }, // Hoàn Kiếm
  24: { lat: 21.0352, lng: 105.8239 }, // Ba Đình
  25: { lat: 21.0181, lng: 105.8256 }, // Đống Đa
  26: { lat: 21.0056, lng: 105.8576 }, // Hai Bà Trưng
  27: { lat: 20.9754, lng: 105.8458 }, // Hoàng Mai
  28: { lat: 21.0362, lng: 105.8942 }, // Long Biên
  29: { lat: 21.0718, lng: 105.8239 }, // Tây Hồ
  30: { lat: 21.0362, lng: 105.7906 }, // Cầu Giấy
  31: { lat: 20.9937, lng: 105.8118 }, // Thanh Xuân
  32: { lat: 20.9719, lng: 105.7728 }, // Hà Đông
  33: { lat: 21.1372, lng: 105.8456 }, // Đông Anh
  34: { lat: 21.0219, lng: 105.9408 }, // Gia Lâm
  35: { lat: 21.2583, lng: 105.8500 }, // Sóc Sơn
  36: { lat: 21.0450, lng: 105.7500 }, // Từ Liêm
  37: { lat: 20.8700, lng: 105.8600 }, // Thường Tín
  38: { lat: 21.1800, lng: 105.7100 }, // Mê Linh

  // Đà Nẵng (39..45)
  39: { lat: 16.0594, lng: 108.2208 }, // Hải Châu
  40: { lat: 16.0642, lng: 108.1884 }, // Thanh Khê
  41: { lat: 16.0967, lng: 108.1432 }, // Liên Chiểu
  42: { lat: 16.0125, lng: 108.2575 }, // Ngũ Hành Sơn
  43: { lat: 16.0886, lng: 108.2435 }, // Sơn Trà
  44: { lat: 16.0175, lng: 108.1994 }, // Cẩm Lệ
  45: { lat: 16.0245, lng: 108.1132 }, // Hòa Vang

  // Hải Phòng (46..59)
  46: { lat: 20.8653, lng: 106.6664 }, // Hồng Bàng
  47: { lat: 20.8529, lng: 106.7001 }, // Ngô Quyền
  48: { lat: 20.8471, lng: 106.6782 }, // Lê Chân
  49: { lat: 20.8033, lng: 106.6267 }, // Kiến An
  50: { lat: 20.8358, lng: 106.7267 }, // Hải An
  51: { lat: 20.7067, lng: 106.7900 }, // Đồ Sơn
  52: { lat: 20.7850, lng: 106.7117 }, // Dương Kinh
  53: { lat: 20.9333, lng: 106.6833 }, // Thuỷ Nguyên
  54: { lat: 20.8667, lng: 106.6000 }, // An Dương
  55: { lat: 20.8000, lng: 106.5500 }, // An Lão
  56: { lat: 20.7667, lng: 106.6500 }, // Kiến Thụy
  57: { lat: 20.7167, lng: 106.5500 }, // Tiên Lãng
  58: { lat: 20.6833, lng: 106.4833 }, // Vĩnh Bảo
  59: { lat: 20.7250, lng: 107.0500 }, // Cát Hải

  // Cần Thơ (60..68)
  60: { lat: 10.0342, lng: 105.7797 }, // Ninh Kiều
  61: { lat: 10.0708, lng: 105.7483 }, // Bình Thủy
  62: { lat: 10.0033, lng: 105.7663 }, // Cái Răng
  63: { lat: 10.1167, lng: 105.6333 }, // Ô Môn
  64: { lat: 10.2833, lng: 105.5333 }, // Thốt Nốt
  65: { lat: 9.9833, lng: 105.6833 }, // Phong Điền
  66: { lat: 10.1000, lng: 105.4500 }, // Cờ Đỏ
  67: { lat: 10.0667, lng: 105.5500 }, // Thới Lai
  68: { lat: 10.2167, lng: 105.4000 }, // Vĩnh Thạnh
}

/**
 * Tính khoảng cách (km) giữa 2 toạ độ theo công thức Haversine
 */
export function tinhKhoangCachKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null
  const numLat1 = Number(lat1)
  const numLon1 = Number(lon1)
  const numLat2 = Number(lat2)
  const numLon2 = Number(lon2)
  if (Number.isNaN(numLat1) || Number.isNaN(numLon1) || Number.isNaN(numLat2) || Number.isNaN(numLon2)) return null

  const R = 6371 // Bán kính trái đất tính bằng km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Định dạng khoảng cách hiển thị thân thiện (VD: "800m", "3.2 km", "25 km")
 */
export function dinhDangKhoangCach(km) {
  if (km == null || Number.isNaN(km)) return null
  const n = Number(km)
  if (n < 1) {
    const m = Math.round(n * 1000)
    return `${m}m`
  }
  if (n < 10) {
    return `${n.toFixed(1)}km`
  }
  return `${Math.round(n)}km`
}

/**
 * Tính khoảng cách từ toạ độ người dùng tới một chiếc xe
 * Ưu tiên: toạ độ xe (lat, lng) -> toạ độ quận (district_id) -> toạ độ tỉnh (province_id)
 */
export function tinhKhoangCachToiXe(viTriUser, the) {
  if (!viTriUser?.lat || !viTriUser?.lng || !the) return null

  // 1. Nếu xe có toạ độ riêng
  if (the.lat != null && the.lng != null) {
    return tinhKhoangCachKm(viTriUser.lat, viTriUser.lng, the.lat, the.lng)
  }

  // 2. Tra theo quận/huyện
  if (the.district_id != null && TOA_DO_DISTRICT[the.district_id]) {
    const td = TOA_DO_DISTRICT[the.district_id]
    return tinhKhoangCachKm(viTriUser.lat, viTriUser.lng, td.lat, td.lng)
  }

  // 3. Tra theo tỉnh/thành phố
  if (the.province_id != null && TOA_DO_PROVINCE[the.province_id]) {
    const td = TOA_DO_PROVINCE[the.province_id]
    return tinhKhoangCachKm(viTriUser.lat, viTriUser.lng, td.lat, td.lng)
  }

  return null
}
