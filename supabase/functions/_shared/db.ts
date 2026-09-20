// Hai client Supabase, KHÔNG được lẫn lộn:
//
//   nguoiDung(req) — chạy bằng JWT của người gọi, RLS vẫn áp. Dùng để biết
//                    "ai đang gọi", tuyệt đối không dùng để ghi ví.
//   admin()        — chạy bằng service_role, BỎ QUA RLS. Chỉ dùng để gọi các
//                    hàm trong 0004_billing.sql. Mỗi lần gõ chữ `admin()` là
//                    một lần tự hỏi: chỗ này đã kiểm tra quyền chưa?
//
// service_role key chỉ nằm trong biến môi trường của Edge Function,
// không bao giờ có tiền tố VITE_ (contracts/api.md mục 6).

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const URL = Deno.env.get('SUPABASE_URL')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

export function admin(): SupabaseClient {
  return createClient(URL, SERVICE, { auth: { persistSession: false } })
}

/** Người gọi là ai. Trả null nếu thiếu / hết hạn token. */
export async function nguoiGoi(req: Request): Promise<{ id: string } | null> {
  const header = req.headers.get('Authorization') ?? ''
  if (!header.startsWith('Bearer ')) return null

  const sb = createClient(URL, ANON, {
    global: { headers: { Authorization: header } },
    auth: { persistSession: false },
  })
  const { data, error } = await sb.auth.getUser()
  if (error || !data?.user) return null
  return { id: data.user.id }
}
