import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Search, ShieldCheck } from 'lucide-react'
import { Skeleton } from '../../components/Loading'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import { getSupabase } from '../../lib/supabase'
import { formatPhone } from '../../lib/format'
import { choXetTichXanh, xetTichXanh } from './adminApi'
import { thongDiepLoi } from './useTai'

function PhienDuyet({ user, onXong }) {
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)
  const [lyDo, setLyDo] = useState('')
  const [anhCccdTrai, setAnhCccdTrai] = useState(null)
  const [anhCccdPhai, setAnhCccdPhai] = useState(null)
  
  useEffect(() => {
    // Giả lập việc lấy ảnh từ bucket verify-docs (hoặc thay bằng mock nếu chưa có file)
    async function layAnh() {
      const sb = await getSupabase()
      // Fallback dummy images for UI demonstration
      setAnhCccdTrai(`https://ui-avatars.com/api/?name=${user.full_name}&background=random&size=400&font-size=0.1&rounded=true&text=Mat+Truoc`)
      setAnhCccdPhai(`https://ui-avatars.com/api/?name=${user.full_name}&background=random&size=400&font-size=0.1&rounded=true&text=Mat+Sau`)
    }
    layAnh()
  }, [user])

  async function xuLyDuyet(trangThai) {
    if (trangThai === 'tu_choi' && lyDo.trim().length < 5) {
      setLoi('Phải nhập lý do từ chối (ít nhất 5 ký tự)')
      return
    }
    setDangLam(true)
    setLoi(null)
    try {
      await xetTichXanh(user.id, trangThai, lyDo.trim() || null)
      onXong(user.id)
    } catch (e) {
      setLoi(thongDiepLoi(e))
      setDangLam(false)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', minHeight: '60vh' }}>
      {/* Nửa trái: Ảnh giấy tờ */}
      <div style={{ flex: 1, backgroundColor: 'var(--m-surface-sunken)', borderRight: '1px solid var(--m-border)', padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <h3 className="t-h4">Giấy tờ tùy thân</h3>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', overflowY: 'auto' }}>
          <div className="skeleton" style={{ flex: 1, minHeight: 200, borderRadius: 'var(--r-md)', backgroundImage: `url(${anhCccdTrai})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 12 }}>Mặt trước CCCD</span>
          </div>
          <div className="skeleton" style={{ flex: 1, minHeight: 200, borderRadius: 'var(--r-md)', backgroundImage: `url(${anhCccdPhai})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 12 }}>Mặt sau CCCD / Bằng lái</span>
          </div>
        </div>
      </div>

      {/* Nửa phải: Thông tin đối chiếu & Quyết định */}
      <div style={{ flex: 1, padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column' }}>
        <h3 className="t-h2" style={{ marginBottom: 'var(--sp-2)' }}>{user.full_name || 'Khách chưa có tên'}</h3>
        
        <div className="stack" style={{ gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="t-small">Số điện thoại:</span>
            <b>{formatPhone(user.phone) || '---'}</b>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="t-small">Email:</span>
            <b>{user.email || '---'}</b>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="t-small">Trạng thái hiện tại:</span>
            <Badge tone="warn">Đang chờ xét</Badge>
          </div>
        </div>

        <div className="stack" style={{ marginTop: 'auto', gap: 'var(--sp-4)' }}>
          {loi && <div className="ad-loi" role="alert">{loi}</div>}
          
          <div className="stack" style={{ gap: 'var(--sp-2)' }}>
            <label className="field-label">Ghi chú / Lý do (nếu từ chối)</label>
            <textarea 
              className="input" 
              rows={3} 
              placeholder="Nhập lý do nếu từ chối (ảnh mờ, sai thông tin...)"
              value={lyDo}
              onChange={e => setLyDo(e.target.value)}
            />
          </div>

          <div className="row" style={{ gap: 'var(--sp-3)' }}>
            <button 
              className="btn btn-ghost" 
              style={{ flex: 1, color: 'var(--m-red)' }}
              disabled={dangLam}
              onClick={() => xuLyDuyet('tu_choi')}
            >
              <XCircle size={18} />
              Từ chối
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              disabled={dangLam}
              onClick={() => xuLyDuyet('da_xac_minh')}
            >
              <CheckCircle2 size={18} />
              Cấp Tích Xanh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DuyetGiayTo() {
  const [ds, setDs] = useState(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState(null)

  useEffect(() => {
    let huy = false
    setDangTai(true)
    choXetTichXanh()
      .then((r) => !huy && setDs(r.items ?? []))
      .catch((e) => !huy && setLoi(thongDiepLoi(e)))
      .finally(() => !huy && setDangTai(false))
    return () => { huy = true }
  }, [])

  function bo(id) {
    setDs(ds.filter(u => u.id !== id))
  }

  if (dangTai) {
    return <div className="stack"><Skeleton height={400} /></div>
  }

  if (loi) {
    return <div className="ad-loi">Lỗi tải danh sách: {loi}</div>
  }

  if (!ds || ds.length === 0) {
    return <EmptyState icon={ShieldCheck} title="Không có giấy tờ nào chờ duyệt" hint="Bạn có thể nghỉ ngơi." />
  }

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)' }}>
      <p className="t-body">Có <b>{ds.length}</b> tài khoản đang chờ xét duyệt giấy tờ để cấp Tích Xanh.</p>
      
      {ds.map(user => (
        <PhienDuyet key={user.id} user={user} onXong={bo} />
      ))}
    </div>
  )
}
