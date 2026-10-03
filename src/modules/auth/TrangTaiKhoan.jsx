import { useState } from 'react'
import { User, Phone, Mail, Camera, Save, LogOut } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { getSupabase } from '../../lib/supabase'

export default function TrangTaiKhoan() {
  const { profile, user, signOut, isOwner } = useAuth()
  
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

  return (
    <div className="page" style={{ maxWidth: 600, paddingBottom: 'var(--sp-12)' }}>
      <h1 className="t-h1" style={{ marginBottom: 'var(--sp-6)' }}>Cài đặt tài khoản</h1>

      <div className="stack" style={{ gap: 'var(--sp-6)' }}>
        {/* Phần Avatar & Basic Info */}
        <div className="card card-pad row" style={{ gap: 'var(--sp-5)' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={`https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=E3F2FD&color=1565C0&size=128`} 
              alt="Avatar" 
              style={{ width: 80, height: 80, borderRadius: '50%' }}
            />
            <button className="btn btn-ghost" style={{ position: 'absolute', bottom: -5, right: -10, padding: 4, borderRadius: '50%', background: 'var(--m-surface)', boxShadow: 'var(--shadow-sm)' }} title="Đổi ảnh đại diện">
              <Camera size={16} />
            </button>
          </div>
          
          <div style={{ flex: 1 }}>
            <h2 className="t-h3">{profile?.full_name || 'Người dùng ẩn danh'}</h2>
            <div className="row" style={{ marginTop: 4, color: 'var(--m-subtle)', gap: 'var(--sp-4)' }}>
              <span className="row" style={{ gap: 4 }}><Mail size={16} /> {profile?.email || 'Chưa cập nhật'}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="badge" style={{ background: 'var(--m-green-light)', color: 'var(--m-green)' }}>
                {isOwner ? 'Chủ xe & Khách thuê' : 'Khách thuê'}
              </span>
            </div>
          </div>
        </div>

        {/* Cập nhật liên hệ */}
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

        {/* Cài đặt khác & Đăng xuất */}
        <div className="card card-pad stack">
          <h2 className="t-h3" style={{ marginBottom: 'var(--sp-4)' }}>Quản lý tài khoản</h2>
          <button 
            type="button" 
            className="btn btn-ghost" 
            style={{ color: 'var(--m-red)', justifyContent: 'flex-start', paddingLeft: 0 }}
            onClick={signOut}
          >
            <LogOut size={18} /> Đăng xuất khỏi thiết bị này
          </button>
        </div>

      </div>
    </div>
  )
}
