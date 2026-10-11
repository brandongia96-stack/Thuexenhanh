import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone, Save, LogOut, ChevronRight, Heart, Car, CalendarDays, Wallet,
  MessageCircle, Settings, ArrowLeft, ShieldAlert, ShieldCheck,
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { getSupabase } from '../../lib/supabase'
import './TrangTaiKhoan.css'

// Ảnh đại diện: dùng ảnh Google của chính người dùng nếu có, không thì chữ cái
// đầu. KHÔNG dùng dịch vụ tạo ảnh bên ngoài (ui-avatars...) — gửi tên người
// dùng sang bên thứ ba mà chính sách bảo vệ dữ liệu không khai.
function AnhDaiDien({ profile, size }) {
  const ten = profile?.full_name?.trim() || ''
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" width={size} height={size} className="tk-avatar" style={{ width: size, height: size, borderRadius: '50%' }} referrerPolicy="no-referrer" />
  }
  return (
    <div className="tk-avatar" style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--m-green-light)', color: 'var(--m-green-hover)', fontWeight: 700, fontSize: size / 2.5 }}>
      {(ten[0] || '?').toUpperCase()}
    </div>
  )
}

function MucMenu({ to, onClick, icon: Icon, chu }) {
  const noiDung = (
    <>
      <div className="tk-menu-item-left">
        <div className="tk-icon-box" style={{ color: 'var(--m-mid)' }}>
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <span className="tk-menu-text">{chu}</span>
      </div>
      <ChevronRight size={20} className="tk-chevron" />
    </>
  )
  return to
    ? <Link to={to} className="tk-menu-item" style={{ color: 'inherit', textDecoration: 'none' }}>{noiDung}</Link>
    : <div className="tk-menu-item" role="button" tabIndex={0} onClick={onClick}>{noiDung}</div>
}

export default function TrangTaiKhoan() {
  const { profile, user, signOut, isOwner } = useAuth()
  
  const [view, setView] = useState('menu') // 'menu' | 'profile'

  const [sdt, setSdt] = useState(profile?.phone || '')
  const [zalo, setZalo] = useState(profile?.zalo_phone || '')
  
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState(null)
  const [thongBao, setThongBao] = useState(null)

  const luuThongTin = async (e) => {
    e.preventDefault()
    setLoi(null)
    setThongBao(null)
    setDangLuu(true)
    
    try {
      const sb = await getSupabase()
      const { error } = await sb
        .from('users')
        .update({
          phone: sdt || null,
          zalo_phone: zalo || null,
        })
        .eq('id', user.id)
        
      if (error) throw error
      setThongBao('Cập nhật thông tin thành công.')
    } catch (error) {
      setLoi(error.message || 'Không thể lưu thông tin. Vui lòng thử lại.')
    } finally {
      setDangLuu(false)
    }
  }

  // ─── GIAO DIỆN HỒ SƠ CÁ NHÂN (CŨ) ───
  if (view === 'profile') {
    return (
      <div className="page" style={{ maxWidth: 600, paddingBottom: 'var(--sp-12)' }}>
        <div className="row" style={{ gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)', alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ padding: 'var(--sp-2)' }} onClick={() => setView('menu')}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="t-h2" style={{ margin: 0 }}>Cập nhật thông tin</h1>
        </div>

        <div className="stack" style={{ gap: 'var(--sp-6)' }}>
          {/* Avatar */}
          <div className="card card-pad row" style={{ gap: 'var(--sp-5)', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <AnhDaiDien profile={profile} size={100} />
            <div style={{ textAlign: 'center' }}>
              <h2 className="t-h3">{profile?.full_name || 'Người dùng ẩn danh'}</h2>
              <div style={{ color: 'var(--m-subtle)', marginTop: 4 }}>{profile?.email}</div>
            </div>
          </div>

          {/* Form */}
          <div className="card card-pad">
            <h2 className="t-h3" style={{ marginBottom: 'var(--sp-4)' }}>Thông tin liên hệ</h2>
            <form onSubmit={luuThongTin} className="stack">
              {loi && <div className="loi-he-thong">{loi}</div>}
              {thongBao && <div style={{ padding: 'var(--sp-3)', background: 'var(--m-green-light)', color: 'var(--m-green-hover)', borderRadius: 'var(--r-md)', fontWeight: 500 }}>{thongBao}</div>}
              
              <div>
                <label className="truong-nhan">Số điện thoại</label>
                <div className="row" style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: 12, color: 'var(--m-subtle)' }} />
                  <input 
                    type="tel" 
                    className="truong-o" 
                    style={{ paddingLeft: 40 }}
                    value={sdt} 
                    onChange={(e) => setSdt(e.target.value)} 
                    placeholder="09xx xxx xxx"
                  />
                </div>
                <div className="truong-phu">Số điện thoại để khách thuê / chủ xe liên hệ.</div>
              </div>

              <div style={{ marginTop: 'var(--sp-3)' }}>
                <label className="truong-nhan">Số Zalo (tuỳ chọn)</label>
                <div className="row" style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: 12, color: 'var(--m-subtle)' }} />
                  <input 
                    type="tel" 
                    className="truong-o" 
                    style={{ paddingLeft: 40 }}
                    value={zalo} 
                    onChange={(e) => setZalo(e.target.value)} 
                    placeholder="09xx xxx xxx"
                  />
                </div>
              </div>

              <div className="row" style={{ marginTop: 'var(--sp-4)', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={dangLuu}>
                  <Save size={18} />
                  {dangLuu ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ─── GIAO DIỆN MENU CHÍNH (MỚI) ───
  return (
    <div className="tk-container">
      <div className="tk-menu-list">
        <div className="tk-menu-item tk-profile-header" onClick={() => setView('profile')}>
          <div className="tk-menu-item-left">
            <AnhDaiDien profile={profile} size={56} />
            <div className="tk-profile-info">
              <h3 className="tk-profile-name">{profile?.full_name || 'Người dùng ẩn danh'}</h3>
              <span className="tk-profile-role">{isOwner ? 'Chủ xe & Khách thuê' : 'Khách thuê'}</span>
            </div>
          </div>
          <ChevronRight size={20} className="tk-chevron" />
        </div>

        <div className="tk-divider" />
        <MucMenu to="/da-luu" icon={Heart} chu="Xe đã lưu" />

        {isOwner && (
          <>
            <div className="tk-divider" />
            <MucMenu to="/chu-xe" icon={Car} chu="Xe của tôi" />
            <MucMenu to="/chu-xe/lich" icon={CalendarDays} chu="Lịch xe" />
            <MucMenu to="/chu-xe/vi" icon={Wallet} chu="Ví token" />
          </>
        )}

        <div className="tk-divider" />
        <MucMenu to="/tai-khoan/khieu-nai" icon={ShieldAlert} chu="Khiếu nại của tôi" />
        <MucMenu to="/lien-he" icon={MessageCircle} chu="Liên hệ" />
        <MucMenu onClick={() => setView('profile')} icon={Settings} chu="Cài đặt thông tin" />
        <MucMenu to="/tai-khoan/du-lieu" icon={ShieldCheck} chu="Dữ liệu & Quyền riêng tư" />
        <MucMenu onClick={signOut} icon={LogOut} chu="Thoát tài khoản" />
      </div>

      <div className="tk-version">
        Version: 0.2.0 (100)
      </div>
    </div>
  )
}
