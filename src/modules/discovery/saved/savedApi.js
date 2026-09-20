// discovery/saved/savedApi — xe đã lưu.
//
// v0.1 hỏng ở đúng chỗ này: bấm tim chỉ đổi state trong React, tải lại trang
// là mất sạch (CLAUDE.md mục 9). Lần này LƯU THẬT vào bảng `saved_listings`.
//
// RLS `saved_own`: mỗi người chỉ đọc/ghi hàng của chính mình → không cần
// (và không được) lọc user_id thủ công cho an toàn, nhưng vẫn lọc để truy vấn
// dùng đúng index.

import { getSupabase } from '../../../lib/supabase'
import { HAS_BACKEND } from '../../../lib/config'

/** Tin này đã được lưu chưa. Trả false khi chưa đăng nhập. */
export async function daLuuChua(userId, listingId) {
  if (!HAS_BACKEND || !userId || !listingId) return false
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('saved_listings')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

/**
 * Lưu xe. Dùng upsert vì bảng có `unique (user_id, listing_id)`: người bỏ lưu
 * rồi lưu lại vẫn là hàng cũ, chỉ cần gỡ `deleted_at`. Insert thường sẽ vỡ
 * ràng buộc unique.
 */
export async function luuXe(userId, listingId) {
  const sb = await getSupabase()
  const { error } = await sb
    .from('saved_listings')
    .upsert(
      { user_id: userId, listing_id: listingId, deleted_at: null },
      { onConflict: 'user_id,listing_id' },
    )
  if (error) throw error
}

/** Bỏ lưu. Xoá mềm — CLAUDE.md mục 1.3, không xoá cứng dữ liệu. */
export async function boLuu(userId, listingId) {
  const sb = await getSupabase()
  const { error } = await sb
    .from('saved_listings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .is('deleted_at', null)
  if (error) throw error
}

// Cột của view `listing_card` mà thẻ xe cần. CẤM `select *`: view có
// `search_tsv` (chỉ để lọc ở luồng 04), kéo về là cõng thêm KB vô ích.
const COT_THE =
  'id,status,brand_text,model_text,year,seats,transmission,fuel,price_per_day,' +
  'province_id,district_id,is_verified,published_at,expires_at,owner_id,' +
  'cover_thumb,cover_blur,cover_width,cover_height'

const TRANG = 20

/**
 * Danh sách xe đã lưu, phân trang KEYSET theo lúc lưu (HIEU-NANG.md mục 2.2).
 *
 * Hai vòng mạng chứ không một: PostgREST không nhúng được view `listing_card`
 * qua khoá ngoại của `saved_listings`. Nhúng bảng `listings` thì lại phải tự
 * gom ảnh bìa — tức là chép lại ruột của `listing_card` ở client, sai nguồn
 * duy nhất. Trang này ít người mở, đổi một vòng mạng lấy đúng nguồn là đáng.
 *
 * @param {{luc: string, id: string}|null} cursor  hàng saved cuối của trang trước
 */
export async function danhSachDaLuu(userId, { cursor = null, limit = TRANG } = {}) {
  if (!HAS_BACKEND || !userId) return { items: [], conNua: false, cursor: null }
  const sb = await getSupabase()

  let q = sb
    .from('saved_listings')
    .select('id,listing_id,created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  if (cursor) {
    q = q.or(
      `created_at.lt.${cursor.luc},and(created_at.eq.${cursor.luc},id.lt.${cursor.id})`,
    )
  }

  const { data: hangLuu, error } = await q
  if (error) throw error
  if (!hangLuu?.length) return { items: [], conNua: false, cursor: null }

  const { data: the, error: loiThe } = await sb
    .from('listing_card')
    .select(COT_THE)
    .in('id', hangLuu.map((h) => h.listing_id))
  if (loiThe) throw loiThe

  const theTheoId = new Map((the ?? []).map((t) => [t.id, t]))
  const cuoi = hangLuu[hangLuu.length - 1]

  return {
    // Giữ nguyên thứ tự "lưu gần nhất trước". Tin nào RLS không cho thấy nữa
    // (chủ xe đã ẩn / xoá) thì bỏ khỏi danh sách, không hiện thẻ rỗng.
    items: hangLuu.map((h) => theTheoId.get(h.listing_id)).filter(Boolean),
    conNua: hangLuu.length === limit,
    cursor: { luc: cuoi.created_at, id: cuoi.id },
  }
}
