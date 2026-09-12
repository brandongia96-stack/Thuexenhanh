import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, HAS_BACKEND } from './config'

// Chưa có .env thì `supabase` là null. Mọi nơi gọi phải kiểm tra HAS_BACKEND
// hoặc dùng requireSupabase() — không để app trắng trang vì thiếu biến môi trường.
export const supabase = HAS_BACKEND
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Chưa cấu hình Supabase. Tạo file .env từ .env.example.')
  }
  return supabase
}

// Gọi Edge Function. Mọi thao tác đụng tiền BẮT BUỘC đi đường này,
// client không bao giờ ghi thẳng vào bảng ví.
export async function callFunction(name, body) {
  const sb = requireSupabase()
  const { data, error } = await sb.functions.invoke(name, { body })
  if (error) throw error
  if (data?.error) throw Object.assign(new Error(data.message ?? data.error), { code: data.error })
  return data
}
