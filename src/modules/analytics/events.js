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
export async function track(kind, { listingId = null, ownerId = null, meta = {}, dedupe = true } = {}) {
  if (!HAS_BACKEND) return
  if (dedupe && trungLap(kind, listingId)) return

  try {
    const sb = await trySupabase()
    if (!sb) return
    await sb.from('events').insert({
      kind,
      listing_id: listingId,
      owner_id: ownerId,
      session_id: getSessionId(),
      meta,
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
