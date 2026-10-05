import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Phone, Save, LogOut, ChevronRight, Heart, Car, CalendarDays, Wallet,
  MessageCircle, Settings, ArrowLeft, Loader2, Gift
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

function MucMenu({ to, onClick, icon: Icon, chu, iconTruoc = null }) {
  const noiDung = (
    <>
      <div className="tk-menu-item-left">
        <div className="tk-icon-box" style={{ color: 'var(--m-mid)' }}>
          {iconTruoc ? iconTruoc : <Icon size={22} strokeWidth={1.8} />}
        </div>
        <span className="tk-menu-text">{chu}</span>
      </div>
      {!iconTruoc && <ChevronRight size={20} className="tk-chevron" />}
    </>
  )
  return to
    ? <Link to={to} className="tk-menu-item" style={{ color: 'inherit', textDecoration: 'none' }}>{noiDung}</Link>
    : <div className="tk-menu-item" role="button" tabIndex={0} onClick={onClick}>{noiDung}</div>
}

export default function TrangTaiKhoan() {
  const { profile, user, signOut, isOwner } = useAuth()
  const navigate = useNavigate()
  const [dangThoat, setDangThoat] = useState(false)
  const handleSignOut = async () => {
    if (window.confirm('Bạn có chắc chắn muốn thoát tài khoản?')) {
      setDangThoat(true)
      try {
        await signOut()
        navigate('/')
      } catch (error) {
        console.error('Lỗi đăng xuất:', error)
        setDangThoat(false)
      }
    }
  }
  
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
  if (view === 'referral') {
    const daNhapMa = profile?.referred_by_id != null
    const [maNhap, setMaNhap] = useState('')
    const [dangXuLy, setDangXuLy] = useState(false)
    const [loiGT, setLoiGT] = useState(null)
    const [thanhCongGT, setThanhCongGT] = useState(false)

    async function submitReferral(e) {
      e.preventDefault()
      if (!maNhap.trim()) return
      setDangXuLy(true)
      setLoiGT(null)
      try {
        const { getSupabase } = await import('../../lib/supabase')
        const sb = await getSupabase()
        const { data, error } = await sb.rpc('apply_referral', { ref_phone: maNhap.trim() })
        if (error) throw error
        if (data.error) throw new Error(data.error)
        setThanhCongGT(true)
        const { data: { session } } = await sb.auth.getSession()
        const { data: u } = await sb.from('users').select('*').eq('id', session.user.id).single()
        setProfile(u)
      } catch (err) {
        setLoiGT(err.message)
      } finally {
        setDangXuLy(false)
      }
    }

    return (
      <div className="tk-container">
        <div className="tk-header">
          <button className="btn btn-ghost" onClick={() => setView('menu')} style={{ padding: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="t-h3" style={{ margin: 0, flex: 1, textAlign: 'center', paddingRight: 36 }}>Mã giới thiệu</h2>
        </div>
        
        <div className="tk-content stack" style={{ gap: 'var(--sp-6)' }}>
          <div className="card card-pad stack" style={{ gap: 'var(--sp-3)', background: 'var(--m-green-bg)' }}>
            <h3 className="t-h3" style={{ color: 'var(--m-green)' }}>Chia sẻ cho bạn bè</h3>
            <p className="t-body">Khi bạn bè nhập mã giới thiệu của bạn, cả hai sẽ nhận được <strong>10 Token (Tương đương 1 lượt đăng xe miễn phí)</strong>.</p>
            <div className="stack" style={{ gap: 4 }}>
              <label className="t-small">Mã giới thiệu của bạn (SĐT):</label>
              <div className="row" style={{ gap: 'var(--sp-2)' }}>
                <input className="input" value={profile?.phone || 'Vui lòng cập nhật số điện thoại trước'} readOnly style={{ fontWeight: 'bold', flex: 1, background: '#fff' }} />
                <button className="btn btn-soft" onClick={() => navigator.clipboard.writeText(profile?.phone || '')}>Copy</button>
              </div>
            </div>
          </div>

          <div className="card card-pad stack" style={{ gap: 'var(--sp-3)' }}>
            <h3 className="t-h4">Bạn có mã giới thiệu?</h3>
            {daNhapMa ? (
              <div style={{ color: 'var(--m-green)', padding: 'var(--sp-3)', background: 'var(--m-green-light)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                ✓ Bạn đã nhập mã giới thiệu thành công.
              </div>
            ) : thanhCongGT ? (
              <div style={{ color: 'var(--m-green)', padding: 'var(--sp-3)', background: 'var(--m-green-light)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                🎉 Chúc mừng! Bạn và người giới thiệu vừa nhận được 10 Token.
              </div>
            ) : (
              <form onSubmit={submitReferral} className="stack" style={{ gap: 'var(--sp-3)' }}>
                <p className="t-small">Nhập mã (số điện thoại) của người đã giới thiệu bạn để nhận 10 Token.</p>
                <div className="row" style={{ gap: 'var(--sp-2)' }}>
                  <input className="input" style={{ flex: 1 }} value={maNhap} onChange={e => setMaNhap(e.target.value)} placeholder="Nhập số điện thoại người giới thiệu..." required />
                  <button type="submit" className="btn btn-primary" disabled={dangXuLy || !maNhap.trim()}>
                    {dangXuLy ? 'Đang gửi...' : 'Nhận Quà'}
                  </button>
                </div>
                {loiGT && <div className="ad-loi" style={{ marginTop: 0 }}>{loiGT}</div>}
              </form>
            )}
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
          {!iconTruoc && <ChevronRight size={20} className="tk-chevron" />}
        </div>

        <div className="tk-divider" />
        <MucMenu to="/da-luu" icon={Heart} chu="Xe đã lưu" />
        <MucMenu onClick={() => setView('referral')} icon={Gift} chu="Quà tặng giới thiệu" />

        {isOwner && (
          <>
            <div className="tk-divider" />
            <MucMenu to="/chu-xe" icon={Car} chu="Xe của tôi" />
            <MucMenu to="/chu-xe/lich" icon={CalendarDays} chu="Lịch xe" />
            <MucMenu to="/chu-xe/vi" icon={Wallet} chu="Ví token" />
          </>
        )}

        <div className="tk-divider" />
        <MucMenu to="/lien-he" icon={MessageCircle} chu="Liên hệ" />
        <MucMenu onClick={() => setView('profile')} icon={Settings} chu="Cài đặt thông tin" />
        <MucMenu onClick={dangThoat ? undefined : handleSignOut} icon={LogOut} chu={dangThoat ? "Đang thoát..." : "Thoát tài khoản"} iconTruoc={dangThoat ? <Loader2 size={22} className="lucide-spin" /> : null} />
      </div>

      <div className="tk-version">
        Version: 0.2.0 (100)
      </div>
    </div>
  )
}


