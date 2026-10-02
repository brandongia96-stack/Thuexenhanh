import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { nhoDongY } from '../legal/GhiNhanDongY'
import { LogIn, Smartphone } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { HAS_BACKEND, FLAGS } from '../../lib/config'

export default function DangNhap() {
  const { signInWithGoogle, signInWithEmail, isLoggedIn } = useAuth()
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

        <form className="stack" style={{ gap: 'var(--sp-3)' }} onSubmit={async (e) => {
          e.preventDefault();
          setLoi(null);
          if (!dongY) { setLoi('Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo mật để tiếp tục.'); return; }
          const form = new FormData(e.target);
          try {
            nhoDongY();
            setDangChay(true);
            await signInWithEmail(form.get('email'), form.get('password'));
          } catch(err) {
            setLoi(err.message);
            setDangChay(false);
          }
        }}>
          <div>
            <input type="email" name="email" placeholder="Email đăng nhập" required className="input" />
          </div>
          <div>
            <input type="password" name="password" placeholder="Mật khẩu" required className="input" />
          </div>
          <button type="submit" disabled={!HAS_BACKEND || dangChay} className="btn btn-primary btn-block">
            {dangChay ? 'Đang xử lý…' : 'Đăng nhập'}
          </button>
        </form>

        <div className="row" style={{ color: 'var(--m-subtle)', fontSize: 13, gap: '12px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--m-border)' }} />
          <span>Hoặc tiếp tục với</span>
          <div style={{ flex: 1, height: 1, background: 'var(--m-border)' }} />
        </div>

        <button
          className="btn btn-ghost btn-block"
          onClick={dangNhapGoogle}
          disabled={!HAS_BACKEND || dangChay}
        >
          <LogIn size={18} strokeWidth={1.8} />
          Google
        </button>

        {loi && <p className="field-error">{loi}</p>}

        <p className="t-small">
          Thuexenhanh chỉ kết nối chủ xe với khách thuê. Giao dịch do hai bên tự thoả thuận.
        </p>
      </div>
    </div>
  )
}
