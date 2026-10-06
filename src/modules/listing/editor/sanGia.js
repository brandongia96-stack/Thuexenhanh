// listing/editor/sanGia — chọn giá sàn áp dụng cho một xe.
//
// Cùng quy tắc với trigger listings_kiem_gia_san (0021): sàn = dòng có số chỗ
// LỚN NHẤT mà vẫn ≤ số chỗ của xe. Ví dụ bảng chỉ có 7 chỗ → xe 9 chỗ và 16 chỗ
// đều dùng sàn 7 chỗ; xe 5 chỗ không có sàn nào.
//
// Hàm thuần, không gọi mạng: form dùng để hiện "Tối thiểu" và chặn trước khi
// gửi. Server vẫn kiểm lại — đây chỉ là lớp báo sớm.

export function sanChoXe(rows, soCho) {
  const n = Number(soCho)
  if (!Number.isFinite(n) || n <= 0) return null
  let tot = null
  for (const r of rows ?? []) {
    if (r.seats <= n && (tot === null || r.seats > tot.seats)) tot = r
  }
  return tot ? tot.min_price_per_day : null
}

// "500.000" — cùng kiểu ghi số với thông báo server.
export const dinhDangDong = (v) => Number(v).toLocaleString('vi-VN')
