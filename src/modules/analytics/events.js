// analytics/events — ghi sự kiện.
//
// Vì sao nằm ở lõi chứ không phải tính năng phụ: lượt xem và lượt lấy số là
// HÀNG HOÁ đem bán cho chủ xe. Không đếm được thì không có gì để bán.
// Bảng điều khiển đọc số này làm ở luồng 03 (chủ xe) và luồng 10 (admin).

import { trySupabase } from '../../lib/supabase'
import { HAS_BACKEND } from '../../lib/config'

export const EVENT = {
  VIEW_LISTING: 'view_listing',
  REVEAL_PHONE: 'reveal_phone',
  CLICK_CALL: 'click_call',
  CLICK_ZALO: 'click_zalo',
  SEARCH: 'search',
  TOPUP: 'topup',
  RENEW: 'renew',
  SAVE_LISTING: 'save_listing',
}

const SESSION_KEY = 'txn_session_id'

// Phiên ẩn danh, chỉ để khử trùng lặp lượt xem. Không phải danh tính người dùng.
export function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return 'no-storage'
  }
}

// Khử trùng lặp trong phiên: cùng người xem cùng tin nhiều lần trong 30 phút
// chỉ tính một lượt. Bán số liệu thì số liệu phải sạch.
const CUA_SO_MS = 30 * 60 * 1000
const daGhi = new Map()

function trungLap(kind, listingId) {
  const key = `${kind}:${listingId ?? ''}`
  const truoc = daGhi.get(key)
  if (truoc && Date.now() - truoc < CUA_SO_MS) return true
  daGhi.set(key, Date.now())
  return false
}

/**
 * Ghi một sự kiện. Không bao giờ ném lỗi ra ngoài — mất một dòng thống kê
 * không được phép làm hỏng thao tác của người dùng.
 */
//
// Ghi qua hàm server `track_event` (0016), KHÔNG insert thẳng bảng `events`:
// server tự tra chủ xe, tự lấy người xem từ phiên đăng nhập, bỏ qua chủ xe tự
// xem, khử trùng lặp 1 giờ. `ownerId` vẫn nhận cho khỏi vỡ chỗ gọi cũ nhưng
// không gửi đi — client khai chủ xe là chỗ để bơm số giả.
export async function track(kind, { listingId = null, ownerId = null, meta = {}, dedupe = true } = {}) { // eslint-disable-line no-unused-vars
  if (!HAS_BACKEND) return
  // Lượt lấy số do Edge Function `reveal-phone` ghi — đó là con số đem tính tiền.
  if (kind === EVENT.REVEAL_PHONE) return
  if (dedupe && trungLap(kind, listingId)) return

  try {
    const sb = await trySupabase()
    if (!sb) return
    await sb.rpc('track_event', {
      p_kind: kind,
      p_listing_id: listingId,
      p_session_id: getSessionId(),
      p_meta: meta,
    })
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[events] không ghi được:', err?.message)
  }
}

export const trackViewListing = (listingId, ownerId) =>
  track(EVENT.VIEW_LISTING, { listingId, ownerId })

export const trackRevealPhone = (listingId, ownerId) =>
  track(EVENT.REVEAL_PHONE, { listingId, ownerId, dedupe: false })

export const trackSearch = (filters) =>
  track(EVENT.SEARCH, { meta: filters, dedupe: false })
