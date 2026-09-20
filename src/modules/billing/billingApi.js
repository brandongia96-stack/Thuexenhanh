// billing/billingApi — cửa duy nhất để giao diện chạm vào tiền.
//
// Luật 6 của sổ kế toán: CLIENT KHÔNG BAO GIỜ GHI VÀO BẢNG VÍ.
// Trong file này chỉ có hai loại hàm:
//   · đọc  -> gọi thẳng PostgREST, RLS chặn, chỉ thấy ví của chính mình
//   · ghi  -> gọi Edge Function, chạy bằng service_role ở phía server
// Không có hàm nào `insert`/`update` vào wallets, wallet_transactions, charges.
// Nếu có ai thêm một hàm như vậy, RLS phía Postgres sẽ từ chối — nhưng đừng
// bắt RLS làm việc của người viết code.

import { getSupabase, callFunction } from '../../lib/supabase'
import { publishIdemKey } from '../../lib/pricing'

export const TRANG_SO = 20

/**
 * Số dư ví. Đọc view `wallet_balances` — token đã nạp và token đã tiêu để
 * riêng, vì hai con số đó là hai thứ khác nhau: token nạp chưa tiêu là NỢ PHẢI
 * TRẢ của mình với chủ xe, chỉ phần đã tiêu mới là doanh thu.
 *
 * Trả `null` khi chưa có ví — "chưa có ví" khác "có ví, 0 token".
 */
export async function soDuVi(userId) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('wallet_balances')
    .select('wallet_id,token_da_nap,token_da_tieu,so_du')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

/**
 * Sổ giao dịch, phân trang keyset (HIEU-NANG.md 2.2 — cấm OFFSET).
 *
 * Đọc view `wallet_ledger`: mỗi dòng có sẵn SỐ DƯ SAU tính bằng cửa sổ trượt
 * phía Postgres. Không tự cộng dồn ở client — client chỉ thấy một trang, cộng
 * dồn ở đây là ra số sai ngay từ trang thứ hai.
 */
export async function soGiaoDich(userId, { cursor = null, limit = TRANG_SO } = {}) {
  const sb = await getSupabase()
  let q = sb
    .from('wallet_ledger')
    .select('id,kind,amount,so_du_sau,note,listing_id,charge_kind,created_at')
    .eq('user_id', userId)
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

  const hang = data ?? []
  const conNua = hang.length > limit
  const items = conNua ? hang.slice(0, limit) : hang
  const cuoi = items[items.length - 1]
  return {
    items,
    conNua,
    cursor: cuoi ? { created_at: cuoi.created_at, id: cuoi.id } : null,
  }
}

/** Các yêu cầu nạp gần đây. Dùng để nối lại một lần nạp còn dang dở. */
export async function napGanDay(userId, { limit = 5 } = {}) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('topups')
    .select('id,token_amount,vnd_amount,status,transfer_code,created_at,paid_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

/** Trạng thái một lần nạp. Màn QR hỏi lại định kỳ cho tới khi tiền về. */
export async function trangThaiNap(topupId) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('topups')
    .select('id,status,token_amount,paid_at')
    .eq('id', topupId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

// ─── GHI: chỉ qua Edge Function ───

/**
 * Tạo yêu cầu nạp + sinh QR ngân hàng động.
 * KHÔNG cộng token. Token chỉ vào ví khi tiền thật về và webhook bắn tới.
 */
export function taoYeuCauNap(tokenAmount) {
  return callFunction('create-topup', { token_amount: tokenAmount })
}

/**
 * Trả phí hiển thị cho một tin: trừ token + bật hiển thị trong MỘT transaction
 * phía Postgres. Bấm hai lần, mất mạng rồi bấm lại, hay hai tab cùng bấm —
 * `idem_key` là khoá duy nhất nên chỉ trừ đúng một lần.
 *
 * Giá do server tính lại từ `months`. Ở đây không gửi số token lên.
 */
export function traPhiHienThi({ listingId, months }) {
  return callFunction('publish-listing', {
    listing_id: listingId,
    months,
    idem_key: publishIdemKey(listingId, months),
  })
}
