import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LayoutDashboard, LogIn, LogOut, Plus, Wallet, Car, Heart, Settings } from 'lucide-react'
import { useAuth } from '../modules/auth/AuthProvider'
import './Header.css'

export default function Header() {
  const { isLoggedIn, isOwner, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
            <div className="hd-account" ref={dropdownRef}>
              <button 
                className="hd-avatar-btn" 
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Tài khoản"
              >
                <img src={`https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=E3F2FD&color=1565C0`} alt="" />
              </button>
              
              {menuOpen && (
                <div className="hd-dropdown">
                  <div className="hd-dropdown-header">
                    <div className="hd-dropdown-name">{profile?.full_name || 'Người dùng'}</div>
                    <div className="hd-dropdown-role">
                      {isOwner ? 'Chủ xe & Khách thuê' : 'Khách thuê'}
                    </div>
                  </div>
                  
                  {isOwner && (
                    <>
                      <Link to="/chu-xe/vi" className="hd-dropdown-item" onClick={() => setMenuOpen(false)}>
                        <Wallet size={16} /> Ví Token
                      </Link>
                      <Link to="/chu-xe" className="hd-dropdown-item" onClick={() => setMenuOpen(false)}>
                        <Car size={16} /> Quản lý xe
                      </Link>
                    </>
                  )}
                  
                  <Link to="/da-luu" className="hd-dropdown-item" onClick={() => setMenuOpen(false)}>
                    <Heart size={16} /> Xe đã lưu
                  </Link>
                  <Link to="/tai-khoan" className="hd-dropdown-item" onClick={() => setMenuOpen(false)}>
                    <Settings size={16} /> Cài đặt tài khoản
                  </Link>
                  
                  <div className="hd-dropdown-divider"></div>
                  
                  <button className="hd-dropdown-item" onClick={() => { setMenuOpen(false); signOut(); }}>
                    <LogOut size={16} /> Thoát
                  </button>
                </div>
              )}
            </div>
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
