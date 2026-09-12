import { Link, NavLink } from 'react-router-dom'
import { Car, LayoutDashboard, LogIn, LogOut, Plus } from 'lucide-react'
import { useAuth } from '../modules/auth/AuthProvider'
import './Header.css'

export default function Header() {
  const { isLoggedIn, isOwner, profile, signOut } = useAuth()

  return (
    <header className="hd">
      <div className="hd-inner">
        <Link to="/" className="hd-logo">
          <Car size={22} strokeWidth={2} />
          <span>Thuexenhanh</span>
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
