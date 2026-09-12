import { SUPABASE_URL, SUPABASE_ANON_KEY, HAS_BACKEND } from './config'

// @supabase/supabase-js nặng ~100KB gzip — bằng 2/3 ngân sách JS lần đầu của
// cả app (HIEU-NANG.md mục 0). Nên nó được TẢI TRỄ: gói đầu chỉ có HTML,
// CSS và React; thư viện Supabase tải song song sau khi trang đã hiện.
//
// Hệ quả cho mọi luồng: KHÔNG import client trực tiếp, luôn `await getSupabase()`.
//
//   const sb = await getSupabase()
//   const { data } = await sb.from('listing_card').select('*')

let clientPromise = null

export function getSupabase() {
  if (!HAS_BACKEND) {
    return Promise.reject(new Error('Chưa cấu hình Supabase. Tạo file .env từ .env.example.'))
  }
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    )
  }
  return clientPromise
}

// Dùng ở chỗ không được phép hỏng khi thiếu backend (ví dụ ghi sự kiện).
// Trả về null thay vì ném lỗi.
export async function trySupabase() {
  if (!HAS_BACKEND) return null
  try {
    return await getSupabase()
  } catch {
    return null
  }
}

// Gọi Edge Function. Mọi thao tác đụng tiền BẮT BUỘC đi đường này,
// client không bao giờ ghi thẳng vào bảng ví.
export async function callFunction(name, body) {
  const sb = await getSupabase()
  const { data, error } = await sb.functions.invoke(name, { body })
  if (error) throw error
  if (data?.error) throw Object.assign(new Error(data.message ?? data.error), { code: data.error })
  return data
}
