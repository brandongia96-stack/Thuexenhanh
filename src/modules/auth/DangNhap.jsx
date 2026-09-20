import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { nhoDongY } from '../legal/GhiNhanDongY'
import { LogIn, Smartphone } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { HAS_BACKEND, FLAGS } from '../../lib/config'

export default function DangNhap() {
  const { signInWithGoogle, isLoggedIn } = useAuth()
  const [loi, setLoi] = useState(null)
  const [dangChay, setDangChay] = useState(false)
  const [dongY, setDongY] = useState(false)
  const navigate = useNavigate()

  if (isLoggedIn) {
    navigate('/', { replace: true })
    return null
  }

  async function dangNhapGoogle() {
    setLoi(null)
    if (!dongY) {
      setLoi('Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo mật để tiếp tục.')
      return
    }
    nhoDongY()
    setDangChay(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      setLoi(e.message)
      setDangChay(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 420 }}>
      <div className="card card-pad stack">
        <div>
          <h1 className="t-h2">Đăng nhập</h1>
          <p className="t-small" style={{ marginTop: 4 }}>
            Đăng nhập để đăng tin cho xe của mình hoặc lưu xe đang quan tâm.
          </p>
        </div>

        {!HAS_BACKEND && (
          <div className="disclaimer">
            Chưa cấu hình Supabase. Tạo file <code>.env</code> từ <code>.env.example</code> rồi chạy lại.
          </div>
        )}

        <label className="row t-small" style={{ alignItems: 'flex-start', gap: 'var(--sp-2)' }}>
          <input
            type="checkbox"
            checked={dongY}
            onChange={(e) => setDongY(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <span>
            Tôi đã đọc và đồng ý với <Link to="/dieu-khoan" target="_blank">Điều khoản sử dụng</Link> và{' '}
            <Link to="/bao-mat" target="_blank">Chính sách bảo mật</Link>.
          </span>
        </label>

        <button
          className="btn btn-primary btn-block"
          onClick={dangNhapGoogle}
          disabled={!HAS_BACKEND || dangChay}
        >
          <LogIn size={18} strokeWidth={1.8} />
          {dangChay ? 'Đang chuyển hướng…' : 'Tiếp tục với Google'}
        </button>

        {FLAGS.otp_sdt && (
          <button className="btn btn-ghost btn-block">
            <Smartphone size={18} strokeWidth={1.8} />
            Đăng nhập bằng số điện thoại
          </button>
        )}

        {loi && <p className="field-error">{loi}</p>}

        <p className="t-small">
          Thuexenhanh chỉ kết nối chủ xe với khách thuê. Giao dịch do hai bên tự thoả thuận.
        </p>
      </div>
    </div>
  )
}
