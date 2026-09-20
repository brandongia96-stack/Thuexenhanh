// Tiện ích HTTP dùng chung cho mọi Edge Function của luồng 06.
// Dạng lỗi bám đúng contracts/api.md mục 4: { error, message, fields? }

const ORIGIN = Deno.env.get('APP_ORIGIN') ?? '*'

export const CORS = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

/**
 * Lỗi nghiệp vụ trả HTTP 200 kèm { error }.
 *
 * Lý do: supabase-js `functions.invoke` nuốt mất body khi status >= 400 —
 * client sẽ chỉ thấy "Edge Function returned a non-2xx status code" và không
 * biết là thiếu token hay sai trạng thái. `callFunction` ở src/lib/supabase.js
 * đã bắt sẵn `data.error` rồi ném ra Error có `code`.
 */
export function loi(error: string, message: string, extra: Record<string, unknown> = {}) {
  return json({ error, message, ...extra })
}

export function preflight(req: Request) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return loi('du_lieu_khong_hop_le', 'Chỉ nhận POST')
  return null
}

export async function docBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}
