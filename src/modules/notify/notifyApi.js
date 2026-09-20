// notify/notifyApi — cửa duy nhất để giao diện đọc thông báo và cài đặt.
//
// Client CHỈ: đọc `notifications` của mình, đánh dấu đã đọc, đọc/ghi
// `notification_prefs` của mình. Không có hàm gửi — việc gửi chạy ở server
// (Edge Function `send-notifications`), client không tự tạo thông báo được.

import { getSupabase } from '../../lib/supabase'

export const TRANG_SO = 20

/** Danh sách thông báo, phân trang keyset (HIEU-NANG.md 2.2 — cấm OFFSET). */
export async function danhSach({ cursor = null, limit = TRANG_SO } = {}) {
  const sb = await getSupabase()
  let q = sb
    .from('notifications')
    .select('id,kind,title,body,link,read_at,created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    q = q.or(
      `created_at.lt."${cursor.created_at}",` +
        `and(created_at.eq."${cursor.created_at}",id.lt."${cursor.id}")`,
    )
  }
  const { data, error } = await q
  if (error) throw error
  const hetTrang = data.length > limit
  const dong = hetTrang ? data.slice(0, limit) : data
  const cuoi = dong[dong.length - 1]
  return { dong, tiep: hetTrang && cuoi ? { created_at: cuoi.created_at, id: cuoi.id } : null }
}

/** Số chưa đọc cho chuông ở header. Chỉ đếm, không kéo dòng về. */
export async function soChuaDoc() {
  const sb = await getSupabase()
  const { count, error } = await sb
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)
    .is('deleted_at', null)
  if (error) throw error
  return count ?? 0
}

export async function danhDauDaDoc(id) {
  const sb = await getSupabase()
  const { error } = await sb
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null)
  if (error) throw error
}

export async function danhDauTatCaDaDoc() {
  const sb = await getSupabase()
  const { error } = await sb
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error) throw error
}

// Mặc định khi chưa có dòng prefs — phải khớp với default trong 0007_notify.sql.
export const PREFS_MAC_DINH = { van_hanh_email: true, tang_truong_email: false }

export async function docCaiDat(userId) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('notification_prefs')
    .select('van_hanh_email,tang_truong_email')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return { ...PREFS_MAC_DINH, ...(data ?? {}) }
}

export async function luuCaiDat(userId, prefs) {
  const sb = await getSupabase()
  const { error } = await sb
    .from('notification_prefs')
    .upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' })
  if (error) throw error
}
