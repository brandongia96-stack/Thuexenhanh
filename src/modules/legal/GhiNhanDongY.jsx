import { useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { trySupabase } from '../../lib/supabase'
import { VAN_BAN } from './phienBan'

const KEY = 'tn_dong_y_cho'

/** Gọi lúc bấm đăng nhập: nhớ lại việc đã tích đồng ý (OAuth chuyển trang nên chưa có user). */
export function nhoDongY() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      terms: VAN_BAN.terms.phienBan,
      privacy: VAN_BAN.privacy.phienBan,
      at: new Date().toISOString(),
    }))
  } catch { /* trình duyệt chặn storage: bỏ qua, lần đăng nhập sau sẽ hỏi lại */ }
}

/** Không hiển thị gì. Đăng nhập xong thì ghi thời điểm + phiên bản đồng ý vào bảng user_consents. */
export default function GhiNhanDongY() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    let raw
    try { raw = localStorage.getItem(KEY) } catch { return }
    if (!raw) return
    let cho
    try { cho = JSON.parse(raw) } catch { return }

    ;(async () => {
      const sb = await trySupabase()
      if (!sb) return
      const rows = [
        { user_id: user.id, document: 'terms', version: cho.terms, accepted_at: cho.at },
        { user_id: user.id, document: 'privacy', version: cho.privacy, accepted_at: cho.at },
      ]
      const { error } = await sb.from('user_consents').insert(rows)
      if (!error) {
        try { localStorage.removeItem(KEY) } catch { /* bỏ qua */ }
      }
    })()
  }, [user])

  return null
}
