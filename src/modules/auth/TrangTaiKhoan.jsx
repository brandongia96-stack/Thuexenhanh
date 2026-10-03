import { useState } from 'react'
import { 
  User, Phone, Mail, Camera, Save, LogOut, ChevronRight, 
  Gift, Star, Award, Calculator, FileText, BarChart2, 
  CreditCard, Facebook, Users, Settings, ArrowLeft 
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { getSupabase } from '../../lib/supabase'
import './TrangTaiKhoan.css'

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
      setThongBao('Cáº­p nháº­t thÃ´ng tin thÃ nh cÃ´ng.')
    } catch (error) {
      setLoi(error.message || 'KhÃ´ng thá»ƒ lÆ°u thÃ´ng tin. Vui lÃ²ng thá»­ láº¡i.')
    } finally {
      setDangLuu(false)
    }
  }

  // â”€â”€â”€ GIAO DIá»†N Há»’ SÆ  CÃ  NHÃ‚N (CÅ¨) â”€â”€â”€
  if (view === 'profile') {
    return (
      <div className="page" style={{ maxWidth: 600, paddingBottom: 'var(--sp-12)' }}>
        <div className="row" style={{ gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)', alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ padding: 'var(--sp-2)' }} onClick={() => setView('menu')}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="t-h2" style={{ margin: 0 }}>Cáº­p nháº­t thÃ´ng tin</h1>
        </div>

        <div className="stack" style={{ gap: 'var(--sp-6)' }}>
          {/* Avatar */}
          <div className="card card-pad row" style={{ gap: 'var(--sp-5)', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={`https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=E3F2FD&color=1565C0&size=128`} 
                alt="Avatar" 
                style={{ width: 100, height: 100, borderRadius: '50%' }}
              />
              <button className="btn btn-primary" style={{ position: 'absolute', bottom: 0, right: -10, padding: 8, borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }} title="Ä á»•i áº£nh Ä‘áº¡i diá»‡n">
                <Camera size={18} />
              </button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 className="t-h3">{profile?.full_name || 'NgÆ°á» i dÃ¹ng áº©n danh'}</h2>
              <div style={{ color: 'var(--m-subtle)', marginTop: 4 }}>{profile?.email}</div>
            </div>
          </div>

          {/* Form */}
          <div className="card card-pad">
            <h2 className="t-h3" style={{ marginBottom: 'var(--sp-4)' }}>ThÃ´ng tin liÃªn há»‡</h2>
            <form onSubmit={luuThongTin} className="stack">
              {loi && <div className="loi-he-thong">{loi}</div>}
              {thongBao && <div style={{ padding: 'var(--sp-3)', background: 'var(--m-green-light)', color: 'var(--m-green-hover)', borderRadius: 'var(--r-md)', fontWeight: 500 }}>{thongBao}</div>}
              
              <div>
                <label className="truong-nhan">Sá»‘ Ä‘iá»‡n thoáº¡i</label>
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
                <div className="truong-phu">Sá»‘ Ä‘iá»‡n thoáº¡i Ä‘á»ƒ khÃ¡ch thuÃª / chá»§ xe liÃªn há»‡.</div>
              </div>

              <div style={{ marginTop: 'var(--sp-3)' }}>
                <label className="truong-nhan">Sá»‘ Zalo (tuá»³ chá» n)</label>
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
                  {dangLuu ? 'Ä ang lÆ°u...' : 'LÆ°u thay Ä‘á»•i'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // â”€â”€â”€ GIAO DIá»†N MENU CHÃ NH (Má»šI) â”€â”€â”€
  return (
    <div className="tk-container">
      {/* Banner Khuyáº¿n MÃ£i */}
      <div className="tk-banner">
        <div className="tk-banner-content">
          <Gift size={20} className="tk-banner-icon" />
          <span className="tk-banner-text">Má» i báº¡n bÃ¨ ngay, nháº­n quÃ  liá» n tay</span>
        </div>
        <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
      </div>

      <div className="tk-menu-list">
        {/* Info Header as a menu item that opens profile */}
        <div className="tk-menu-item tk-profile-header" onClick={() => setView('profile')}>
          <div className="tk-menu-item-left">
            <img 
              src={`https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=E3F2FD&color=1565C0&size=128`} 
              alt="Avatar" 
              className="tk-avatar"
            />
            <div className="tk-profile-info">
              <h3 className="tk-profile-name">{profile?.full_name || 'NgÆ°á» i dÃ¹ng áº©n danh'}</h3>
              <span className="tk-profile-role">{isOwner ? 'Chá»§ xe & KhÃ¡ch thuÃª' : 'KhÃ¡ch thuÃª'}</span>
            </div>
          </div>
          <ChevronRight size={20} className="tk-chevron" />
        </div>
        
        <div className="tk-divider" />

        {/* CÃ¡c má»¥c nhÆ° yÃªu cáº§u */}
        <div className="tk-menu-item">
          <div className="tk-menu-item-left">
            <div className="tk-icon-box" style={{ color: '#F59E0B' }}>
              <Star size={22} fill="currentColor" />
            </div>
            <span className="tk-menu-text">Ä iá»ƒm thÆ°á»Ÿng</span>
          </div>
          <ChevronRight size={20} className="tk-chevron" />
        </div>
        <div className="tk-menu-item">
          <div className="tk-menu-item-left">
            <div className="tk-icon-box" style={{ color: '#F59E0B' }}>
              <Award size={22} />
            </div>
            <span className="tk-menu-text">Huy hiá»‡u</span>
          </div>
          <ChevronRight size={20} className="tk-chevron" />
        </div>
        
        <div className="tk-divider" />

        {isOwner && (
          <>
            <div className="tk-menu-item">
              <div className="tk-menu-item-left">
                <div className="tk-icon-box" style={{ color: '#F97316' }}>
                  <Calculator size={22} />
                </div>
                <span className="tk-menu-text">CÃ´ng cá»¥ tÃ­nh lá»£i nhuáº­n</span>
              </div>
              <ChevronRight size={20} className="tk-chevron" />
            </div>
            <div className="tk-menu-item">
              <div className="tk-menu-item-left">
                <div className="tk-icon-box" style={{ color: '#3B82F6' }}>
                  <FileText size={22} />
                </div>
                <span className="tk-menu-text">Há»£p Ä‘á»“ng cá»§a tÃ´i</span>
              </div>
              <ChevronRight size={20} className="tk-chevron" />
            </div>
            <div className="tk-menu-item">
              <div className="tk-menu-item-left">
                <div className="tk-icon-box" style={{ color: '#10B981' }}>
                  <BarChart2 size={22} />
                </div>
                <span className="tk-menu-text">BÃ¡o cÃ¡o tÃ i sáº£n</span>
              </div>
              <ChevronRight size={20} className="tk-chevron" />
            </div>
            <div className="tk-menu-item">
              <div className="tk-menu-item-left">
                <div className="tk-icon-box" style={{ color: '#10B981' }}>
                  <CreditCard size={22} fill="#10B981" color="#fff" />
                </div>
                <span className="tk-menu-text">Quáº£n lÃ½ ngÃ¢n hÃ ng rÃºt tiá» n</span>
              </div>
              <ChevronRight size={20} className="tk-chevron" />
            </div>
            <div className="tk-divider" />
          </>
        )}

        <div className="tk-menu-item">
          <div className="tk-menu-item-left">
            <div className="tk-icon-box" style={{ color: '#1877F2' }}>
              <Facebook size={22} fill="currentColor" stroke="none" />
            </div>
            <span className="tk-menu-text">Facebook cá»§a ThuÃª Xe Nhanh</span>
          </div>
          <ChevronRight size={20} className="tk-chevron" />
        </div>
        <div className="tk-menu-item">
          <div className="tk-menu-item-left">
            <div className="tk-icon-box" style={{ color: '#1877F2' }}>
              <Users size={22} />
            </div>
            <span className="tk-menu-text">Cá»™ng Ä‘á»“ng ThuÃª Xe Nhanh trÃªn Facebook</span>
          </div>
          <ChevronRight size={20} className="tk-chevron" />
        </div>
        
        <div className="tk-divider" />

        <div className="tk-menu-item">
          <div className="tk-menu-item-left">
            <div className="tk-icon-box" style={{ color: '#6B7280' }}>
              <Phone size={22} fill="currentColor" />
            </div>
            <span className="tk-menu-text">LiÃªn há»‡</span>
          </div>
          <ChevronRight size={20} className="tk-chevron" />
        </div>
        <div className="tk-menu-item" onClick={() => setView('profile')}>
          <div className="tk-menu-item-left">
            <div className="tk-icon-box" style={{ color: '#6B7280' }}>
              <Settings size={22} />
            </div>
            <span className="tk-menu-text">CÃ i Ä‘áº·t thÃ´ng tin</span>
          </div>
          <ChevronRight size={20} className="tk-chevron" />
        </div>
        <div className="tk-menu-item" onClick={signOut}>
          <div className="tk-menu-item-left">
            <div className="tk-icon-box" style={{ color: '#6B7280' }}>
              <LogOut size={22} />
            </div>
            <span className="tk-menu-text">ThoÃ¡t tÃ i khoáº£n</span>
          </div>
          <ChevronRight size={20} className="tk-chevron" />
        </div>
      </div>

      <div className="tk-version">
        Version: 0.2.0 (100)
      </div>
    </div>
  )
}
