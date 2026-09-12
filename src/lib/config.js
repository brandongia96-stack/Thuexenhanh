// Biến môi trường + cờ tính năng. Mọi module đọc từ đây, không đọc thẳng import.meta.env.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
export const APP_ENV = import.meta.env.VITE_APP_ENV ?? 'dev'

// Chưa cấu hình Supabase thì app vẫn chạy được, chỉ là không có dữ liệu.
// Luật graceful degradation: thiếu dữ liệu thì ẩn khối, không vỡ trang.
export const HAS_BACKEND = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// ─── Mô hình giá: ĐÃ CHỐT, không sửa ở luồng khác ───
export const TOKEN_VND = 4000          // 1 token = 4.000đ
export const TOKENS_PER_MONTH = 10     // 10 token / 1 xe / 1 tháng
// Không có gói vĩnh viễn. Giá tuyến tính theo số tháng.

// ─── Cờ tính năng ───
// Bật cờ nào là việc của luồng sở hữu tính năng đó, không phải luồng nền tảng.
export const FLAGS = {
  day_tin: false,        // luồng 07 — hạ tầng sẵn, chưa bật
  tru_theo_lead: false,  // trừ token theo lượt lấy số — hạ tầng sẵn, chưa bật
  danh_gia: false,       // luồng 09 — chỉ bật khi có đánh giá THẬT
  otp_sdt: false,        // luồng 08
}
