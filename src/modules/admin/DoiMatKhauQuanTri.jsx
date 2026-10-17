// admin — tài khoản quản trị tự đổi mật khẩu (trong phiên quản trị còn hạn).
// Supabase Auth băm và lưu; client không giữ mật khẩu ở đâu cả.

import { useState } from 'react'
import { getSupabase } from '../../lib/supabase'

const DAI_TOI_THIEU = 12

export default function DoiMatKhauQuanTri({ onDong }) {
  const [loi, setLoi] = useState(null)
  const [xong, setXong] = useState(false)
  const [dangChay, setDangChay] = useState(false)

  async function gui(e) {
    e.preventDefault()
    const el = e.currentTarget
    const form = new FormData(el)
    const moi = String(form.get('moi') ?? '')
    const lai = String(form.get('lai') ?? '')
    setLoi(null)
    if (moi.length < DAI_TOI_THIEU) return setLoi(`Mật khẩu mới cần ít nhất ${DAI_TOI_THIEU} ký tự`)
    if (moi !== lai) return setLoi('Hai lần nhập không khớp')
    setDangChay(true)
    try {
      const sb = await getSupabase()
      const { error } = await sb.auth.updateUser({ password: moi })
      if (error) throw error
      el.reset()
      setXong(true)
    } catch (err) {
      setLoi(err?.message || 'Không đổi được mật khẩu, thử lại sau')
    } finally {
      setDangChay(false)
    }
  }

  return (
    <form className="card card-pad stack ad-doi-mk" onSubmit={gui}>
      <div className="row ad-doi-mk-dau">
        <h2 className="t-h3">Đổi mật khẩu quản trị</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDong}>Đóng</button>
      </div>
      {xong && <div className="disclaimer" role="status">Đã đổi mật khẩu. Lần đăng nhập sau dùng mật khẩu mới.</div>}
      <label className="field">
        <span className="field-label">Mật khẩu mới</span>
        <input className="input" name="moi" type="password" autoComplete="new-password"
               required minLength={DAI_TOI_THIEU} maxLength={200} />
        <span className="field-hint">Ít nhất {DAI_TOI_THIEU} ký tự, không dùng lại mật khẩu ở nơi khác.</span>
      </label>
      <label className="field">
        <span className="field-label">Nhập lại mật khẩu mới</span>
        <input className="input" name="lai" type="password" autoComplete="new-password"
               required maxLength={200} />
      </label>
      {loi && <p className="field-error" role="alert">{loi}</p>}
      <button type="submit" className="btn btn-primary" disabled={dangChay}>
        {dangChay ? 'Đang lưu…' : 'Lưu mật khẩu mới'}
      </button>
    </form>
  )
}
