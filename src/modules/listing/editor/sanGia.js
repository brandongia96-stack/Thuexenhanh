// listing/editor/sanGia — chọn giá sàn áp dụng cho một xe.
//
// Cùng quy tắc với trigger listings_kiem_gia_san (0023, contracts/api.md 3d/3e):
// sàn = dòng có số chỗ LỚN NHẤT mà vẫn ≤ số chỗ của xe. Ví dụ bảng chỉ có
// 7 chỗ → xe 9 chỗ và 16 chỗ đều dùng sàn 7 chỗ; xe 5 chỗ không có sàn nào.
//
// Đổi 11/10 (PL-33): sàn giờ chỉ là NGƯỠNG CẢNH BÁO, không còn chặn gửi.
// Hàm thuần, không gọi mạng — form dùng để hiện hộp vàng, không chặn gì.

export function sanChoXe(rows, soCho) {
  const n = Number(soCho)
  if (!Number.isFinite(n) || n <= 0) return null
  let tot = null
  for (const r of rows ?? []) {
    if (r.seats <= n && (tot === null || r.seats > tot.seats)) tot = r
  }
  return tot ? tot.min_price_per_day : null
}
