// discovery/anh — chọn đúng cỡ ảnh cho từng chỗ hiển thị.
//
// HIEU-NANG.md mục 1.1: mỗi ảnh có 4 bản. Luật cứng:
//   · danh sách  → `thumb` (400w)
//   · ảnh bìa trang chi tiết → `medium` (800w)
//   · `full` (1600w) CHỈ khi khách bấm phóng to
//   · ảnh gốc TUYỆT ĐỐI không phục vụ
//
// Vì sao không dùng thẳng `nguonAnh()` của luồng 02: file đó đang đọc cột
// `blur_data_url`, còn `contracts/schema.sql` (luồng 01 chốt sau) đặt tên cột là
// `blur_base64`. Hai tên khác nhau → ảnh mờ về null, trang nhấp nháy ô xám.
// Ở đây chấp cả hai tên để trang xe chạy đúng dù luồng 02 sửa hay chưa.
// ⚠️ Nợ kỹ thuật của luồng 02, đã báo lại — xem CHANGELOG.

const BAN_HOP_LE = ['thumb', 'medium', 'full']

/**
 * Đổi một hàng `listing_images` thành thứ render được.
 * @param {object} hang  hàng listing_images
 * @param {'thumb'|'medium'|'full'} ban
 * @returns {{url:string, blur:string|null, width:number|null, height:number|null}|null}
 */
export function anhTin(hang, ban = 'medium') {
  if (!hang) return null

  // Lùi dần về bản nhỏ hơn nếu bản mong muốn chưa có (tin cũ, upload dở).
  // Không bao giờ lùi về `url_original`.
  const thu = BAN_HOP_LE.slice(0, BAN_HOP_LE.indexOf(ban) + 1).reverse()
  const url = thu.map((b) => hang[`url_${b}`]).find(Boolean) ?? hang.url ?? null
  if (!url) return null

  return {
    url,
    blur: hang.blur_base64 ?? hang.blur_data_url ?? null,
    width: hang.width ?? null,
    height: hang.height ?? null,
  }
}

/** Tỉ lệ khung ảnh. Luôn phải có để không vỡ CLS (HIEU-NANG.md mục 1.3). */
export function tiLeKhung(anh, macDinh = '4 / 3') {
  if (!anh?.width || !anh?.height) return macDinh
  return `${anh.width} / ${anh.height}`
}

/**
 * Nạp sẵn một ảnh vào cache trình duyệt.
 * Dùng để prefetch đúng MỘT ảnh kế tiếp của slider (HIEU-NANG.md mục 1.4),
 * không bao giờ nạp cả album.
 * @returns {() => void} huỷ — vuốt nhanh qua thì bỏ request không còn cần
 */
export function napTruoc(url) {
  if (!url) return () => {}
  const img = new Image()
  img.decoding = 'async'
  img.src = url
  return () => {
    img.src = ''
  }
}
