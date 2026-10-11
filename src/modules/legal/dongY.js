// Đọc/ghi sự đồng ý của người dùng — bảng `user_consents` (contracts/api.md §3e).
//
// Bảng CHỈ GHI THÊM. Trạng thái hiện tại của một mục = dòng MỚI NHẤT của mục đó.
// Rút đồng ý = thêm dòng `granted: false`, không sửa dòng cũ.
//
// Cố ý KHÔNG dùng `rpc('da_dong_y')`: hàm đó không trả về PHIÊN BẢN đã đồng ý,
// mà màn "Trước khi bắt đầu" cần so phiên bản để biết có hỏi lại hay không.
import { trySupabase } from '../../lib/supabase'
import { VAN_BAN } from './phienBan'

/** Phiên bản của từng mục tại thời điểm hiện tại. Lệch dòng đã lưu → hỏi lại. */
export const PHIEN_BAN_MUC = {
  terms: VAN_BAN.terms.phienBan,
  operation: VAN_BAN.operation.phienBan,
  privacy: VAN_BAN.privacy.phienBan,
  age_18: '1.0',
  marketing: '1.0',
}

/** Bốn mục bắt buộc để dùng nền tảng. `marketing` là tuỳ chọn. */
export const BAT_BUOC = ['terms', 'operation', 'privacy', 'age_18']

/**
 * Trạng thái đồng ý hiện tại của người dùng.
 * Trả `Map<document, { version, granted, luc }>`, hoặc `null` nếu không đọc được
 * (khi đó màn hình tự ẩn, không chặn người dùng chỉ vì mạng hỏng).
 */
export async function docDongY(userId) {
  try {
    const sb = await trySupabase()
    if (!sb || !userId) return null
    const { data, error } = await sb
      .from('user_consents')
      .select('document, version, granted, accepted_at')
      .eq('user_id', userId)
      .order('accepted_at', { ascending: false })
    if (error) throw error
    const ra = new Map()
    for (const r of data ?? []) {
      // Đã sắp mới → cũ, nên dòng đầu tiên gặp của mỗi mục là dòng quyết định.
      if (!ra.has(r.document)) ra.set(r.document, { version: r.version, granted: r.granted === true, luc: r.accepted_at })
    }
    return ra
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[legal] không đọc được user_consents:', e?.message)
    return null
  }
}

/** Mục này đang hợp lệ: đã đồng ý, và đúng phiên bản hiện hành. */
export function dongYHopLe(trangThai, document) {
  const r = trangThai?.get(document)
  return Boolean(r && r.granted && r.version === PHIEN_BAN_MUC[document])
}

/**
 * Ghi các lựa chọn. Mỗi phần tử = MỘT dòng `user_consents`.
 * `muc`: [{ document, granted }]. Ném lỗi để giao diện báo và cho thử lại.
 */
export async function ghiDongY(userId, muc) {
  const sb = await trySupabase()
  if (!sb) throw new Error('Chưa kết nối được máy chủ.')
  const rows = muc.map((m) => ({
    user_id: userId,
    document: m.document,
    version: PHIEN_BAN_MUC[m.document],
    granted: m.granted === true,
  }))
  const { error } = await sb.from('user_consents').insert(rows)
  if (error) throw error
}
