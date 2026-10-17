// admin — form đăng nhập quản trị ở /admin. Tách khỏi /dang-nhap (Google/email
// của người dùng): tên đăng nhập + mật khẩu, kiểm ở server (admin-login).

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { HAS_BACKEND } from '../../lib/config'
import { dangNhapQuanTri } from './adminAuth'
import './admin.css'

export default function DangNhapQuanTri({ dangCoPhienThuong, thongBao, onXong }) {
  const [loi, setLoi] = useState(null)
  const [dangChay, setDangChay] = useState(false)

  async function gui(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setLoi(null)
    setDangChay(true)
    try {
      await dangNhapQuanTri(String(form.get('username') ?? ''), String(form.get('password') ?? ''))
      await onXong()
    } catch (err) {
      // Server đã trả câu chung chung (không nói sai tên hay sai mật khẩu).
      setLoi(err?.code ? err.message : 'Không kết nối được máy chủ, thử lại sau')
    } finally {
      setDangChay(false)
    }
  }

  return (
    <div className="page ad-dn">
      <form className="card card-pad stack ad-dn-hop" onSubmit={gui} autoComplete="on">
        <div className="ad-dn-dau">
          <span className="ad-dn-icon"><ShieldCheck size={22} strokeWidth={1.8} /></span>
          <div>
            <h1 className="t-h2">Đăng nhập quản trị</h1>
            <p className="t-small">Chỉ dành cho người vận hành Thuê Xe Nhanh.</p>
          </div>
        </div>

        {thongBao && <div className="disclaimer">{thongBao}</div>}
        {dangCoPhienThuong && (
          <p className="t-small ad-dn-chu">
            Tài khoản bạn đang đăng nhập không có quyền quản trị. Đăng nhập quản trị sẽ thay
            phiên hiện tại trên trình duyệt này.
          </p>
        )}

        <label className="field">
          <span className="field-label">Tên đăng nhập</span>
          <input className="input" name="username" autoComplete="username" required
                 autoCapitalize="none" spellCheck={false} maxLength={64} />
        </label>
        <label className="field">
          <span className="field-label">Mật khẩu</span>
          <input className="input" name="password" type="password" autoComplete="current-password"
                 required maxLength={200} />
        </label>

        {loi && <p className="field-error" role="alert">{loi}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={!HAS_BACKEND || dangChay}>
          {dangChay ? 'Đang kiểm tra…' : 'Đăng nhập'}
        </button>
        <p className="field-hint">
          Sai nhiều lần sẽ bị tạm khoá 15 phút. Phiên quản trị tự hết hạn sau 8 giờ, hoặc sau 30 phút
          không thao tác.
        </p>
      </form>
    </div>
  )
}
