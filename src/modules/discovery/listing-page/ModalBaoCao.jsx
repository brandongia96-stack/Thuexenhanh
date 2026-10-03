import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { guiBaoCao } from './chiTietApi'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate, useLocation } from 'react-router-dom'

const LY_DO = [
  { id: 'gia_ao', label: 'Giá báo khác với giá đăng' },
  { id: 'xe_ao', label: 'Xe không có thật hoặc đã bán' },
  { id: 'lua_dao', label: 'Dấu hiệu lừa đảo / Đòi cọc trước' },
  { id: 'thong_tin_sai', label: 'Sai thông tin (sai đời xe, sai biển số)' },
  { id: 'khac', label: 'Lý do khác' },
]

export default function ModalBaoCao({ tin, dong }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [lyDo, setLyDo] = useState('')
  const [chiTiet, setChiTiet] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState(null)
  const [thanhCong, setThanhCong] = useState(false)

  // Bắt đăng nhập mới được báo cáo
  if (!user) {
    navigate('/dang-nhap', { state: { quayLai: location.pathname + location.search } })
    return null
  }

  async function xuLyGui(e) {
    e.preventDefault()
    if (!lyDo) {
      setLoi('Vui lòng chọn một lý do.')
      return
    }
    
    setDangGui(true)
    setLoi(null)
    try {
      await guiBaoCao(tin.id, user.id, lyDo, chiTiet)
      setThanhCong(true)
    } catch (err) {
      setLoi(err.message || 'Không thể gửi báo cáo. Vui lòng thử lại.')
    } finally {
      setDangGui(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 'var(--sp-4)'
    }}>
      <div className="card card-pad stack" style={{ maxWidth: 450, width: '100%', background: '#fff', position: 'relative' }}>
        <button 
          className="btn btn-ghost" 
          style={{ position: 'absolute', top: 12, right: 12, padding: 8 }}
          onClick={dong}
        >
          <X size={20} />
        </button>
        
        <h3 className="t-h3 row" style={{ gap: 8 }}>
          <AlertTriangle color="var(--m-red)" size={20} />
          Báo cáo tin đăng
        </h3>

        {thanhCong ? (
          <div className="stack" style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
            <div style={{ color: 'var(--m-green)', marginBottom: 'var(--sp-2)' }}>
              ✓ Gửi báo cáo thành công
            </div>
            <p className="t-body">Cảm ơn anh/chị đã chung tay làm sạch cộng đồng Thuê Xe Nhanh. Quản trị viên sẽ xem xét và xử lý nghiêm.</p>
            <button className="btn btn-primary" onClick={dong} style={{ marginTop: 'var(--sp-4)' }}>Đóng</button>
          </div>
        ) : (
          <form onSubmit={xuLyGui} className="stack" style={{ gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
            <div className="stack" style={{ gap: 12 }}>
              {LY_DO.map(l => (
                <label key={l.id} className="row" style={{ gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="ly_do" 
                    value={l.id} 
                    checked={lyDo === l.id}
                    onChange={(e) => setLyDo(e.target.value)}
                  />
                  <span>{l.label}</span>
                </label>
              ))}
            </div>

            <div className="stack" style={{ gap: 4 }}>
              <label className="t-small" style={{ fontWeight: 500 }}>Chi tiết thêm (tuỳ chọn):</label>
              <textarea 
                className="input" 
                rows={3} 
                placeholder="Ví dụ: Gọi điện thì chủ xe bảo xe giá này nhưng đòi phụ phí..."
                value={chiTiet}
                onChange={e => setChiTiet(e.target.value)}
              />
            </div>

            {loi && <div className="ad-loi" role="alert">{loi}</div>}

            <div className="row" style={{ gap: 'var(--sp-3)', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={dong} disabled={dangGui}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={dangGui || !lyDo} style={{ background: 'var(--m-red)', borderColor: 'var(--m-red)' }}>
                {dangGui ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
