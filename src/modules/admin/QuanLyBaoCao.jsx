import { useEffect, useState } from 'react'
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react'
import { Skeleton } from '../../components/Loading'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import { getSupabase } from '../../lib/supabase'
import { thongDiepLoi } from './useTai'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'

export default function QuanLyBaoCao() {
  const [ds, setDs] = useState(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState(null)

  useEffect(() => {
    let huy = false
    async function tai() {
      setDangTai(true)
      const sb = await getSupabase()
      
      const { data, error } = await sb
        .from('reports')
        .select(`
          id, reason_code, detail, status, created_at,
          reporter:users!reports_reporter_id_fkey(full_name, phone),
          listing:listings(id, brand_text, model_text, owner_id)
        `)
        .eq('status', 'moi')
        .order('created_at', { ascending: false })

      if (huy) return
      if (error) {
        setLoi(error.message)
      } else {
        setDs(data || [])
      }
      setDangTai(false)
    }
    tai()
    return () => { huy = true }
  }, [])

  async function xuLy(id, hanhDong) {
    const sb = await getSupabase()
    const { data: { session } } = await sb.auth.getSession()
    
    // Nếu hợp lệ (da_xu_ly), chúng ta cần đếm lại số lượng report thật của xe
    // (Bằng trigger hoặc function. Ở đây chỉ cập nhật trạng thái tạm).
    
    const { error } = await sb
      .from('reports')
      .update({
        status: hanhDong,
        handled_by: session?.user?.id,
        handled_at: new Date().toISOString()
      })
      .eq('id', id)
      
    if (!error) {
      setDs(ds => ds.filter(r => r.id !== id))
    } else {
      alert('Lỗi xử lý: ' + error.message)
    }
  }

  if (dangTai) return <Skeleton height={400} />
  if (loi) return <div className="ad-loi">Lỗi: {loi}</div>
  if (!ds?.length) return <EmptyState icon={ShieldAlert} title="Tuyệt vời! Không có báo cáo mới nào." />

  return (
    <div className="stack" style={{ gap: 'var(--sp-4)' }}>
      <p>Có <b>{ds.length}</b> báo cáo mới chờ xử lý.</p>
      
      {ds.map(r => (
        <div key={r.id} className="card card-pad stack" style={{ gap: 'var(--sp-3)', background: 'var(--m-red-bg)' }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 className="t-h3" style={{ color: 'var(--m-red)' }}>Lý do: {r.reason_code}</h3>
              <div className="t-small" style={{ color: 'var(--m-subtle)' }}>
                Người báo: <b>{r.reporter?.full_name}</b> ({r.reporter?.phone}) lúc {formatDateTime(r.created_at)}
              </div>
            </div>
            <Link to={`/xe/${r.listing?.id}`} target="_blank" className="btn btn-ghost btn-sm">Xem xe bị báo cáo</Link>
          </div>
          
          <div className="t-body" style={{ background: '#fff', padding: 'var(--sp-3)', borderRadius: 'var(--r-md)' }}>
            <b>Chi tiết:</b> {r.detail || 'Không có ghi chú thêm.'}
          </div>
          
          <div className="row" style={{ gap: 'var(--sp-3)', justifyContent: 'flex-end', marginTop: 'var(--sp-2)' }}>
            <button className="btn btn-ghost" onClick={() => xuLy(r.id, 'bo_qua')} style={{ color: 'var(--m-subtle)' }}>
              <X size={16} /> Bỏ qua (Report ảo)
            </button>
            <button className="btn btn-primary" onClick={() => xuLy(r.id, 'da_xu_ly')} style={{ background: 'var(--m-red)', borderColor: 'var(--m-red)' }}>
              <Check size={16} /> Xác nhận (Khóa xe hoặc cảnh cáo)
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
