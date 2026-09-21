import { Link, NavLink } from 'react-router-dom'
import { LayoutDashboard, LogIn, LogOut, Plus } from 'lucide-react'
import { useAuth } from '../modules/auth/AuthProvider'
import './Header.css'

export default function Header() {
  const { isLoggedIn, isOwner, profile, signOut } = useAuth()

  return (
    <header className="hd">
      <div className="hd-inner">
        <Link to="/" className="hd-logo" aria-label="Thuê Xe Nhanh — trang chủ">
          {/* Nằm ở màn hình đầu → KHÔNG lazy (HIEU-NANG.md 1.3). width/height giữ chỗ, không gây CLS.
              Nguồn 108×108 hiển thị 36×36 → nét trên màn 3x. Tên nằm ngay cạnh nên alt để trống. */}
          <picture>
            <source srcSet="/logo.webp" type="image/webp" />
            <img
              src="/logo.png"
              alt=""
              width="36"
              height="36"
              className="hd-logo-img"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          <span>Thuê Xe Nhanh</span>
        </Link>

        <nav className="hd-nav">
          <NavLink to="/thue-xe" className="hd-link">Thuê xe</NavLink>
          {isOwner && (
            <NavLink to="/chu-xe" className="hd-link">
              <LayoutDashboard size={16} strokeWidth={1.8} />
              Xe của tôi
            </NavLink>
          )}
        </nav>

        <div className="hd-right">
          <Link to={isLoggedIn ? '/chu-xe/dang-tin' : '/dang-nhap'} className="btn btn-primary btn-sm">
            <Plus size={16} strokeWidth={2} />
            Đăng tin
          </Link>

          {isLoggedIn ? (
            <button className="btn btn-ghost btn-sm" onClick={signOut} title={profile?.full_name ?? ''}>
              <LogOut size={16} strokeWidth={1.8} />
              Thoát
            </button>
          ) : (
            <Link to="/dang-nhap" className="btn btn-ghost btn-sm">
              <LogIn size={16} strokeWidth={1.8} />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
