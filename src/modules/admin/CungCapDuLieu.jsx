// admin/authority-requests — sổ cung cấp dữ liệu cho cơ quan chức năng (0023, chỉ admin).
// Bắt buộc số văn bản: không có văn bản thì không được cung cấp dữ liệu người dùng.

import { useState } from 'react'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { useAuth } from '../auth/AuthProvider'
import { formatDate, formatDateTime } from '../../lib/format'
import { soCungCapDuLieu, themYeuCauCoQuan } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

const RONG = { agency: '', doc_number: '', doc_date: '', scope: '', note: '' }

export default function CungCapDuLieu() {
  const { user } = useAuth()
  const { data, loi, dangTai, taiLai } = useTai(() => soCungCapDuLieu())
  const [f, setF] = useState(RONG)
  const [dangLam, setDangLam] = useState(false)
  const [loiGui, setLoiGui] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const hopLe = f.agency.trim() && f.doc_number.trim() && f.scope.trim()

  async function gui(e) {
    e.preventDefault()
    setDangLam(true); setLoiGui(null)
    try {
      await themYeuCauCoQuan({ ...f, doc_date: f.doc_date || null }, user.id)
      setF(RONG); taiLai()
    } catch (er) { setLoiGui(thongDiepLoi(er)) } finally { setDangLam(false) }
  }

  return (
    <div className="stack" style={{ gap: 'var(--sp-4)' }}>
      <p className="t-small" style={{ margin: 0 }}>
        Chỉ cung cấp dữ liệu người dùng cho cơ quan chức năng khi có văn bản. Ghi sổ ở đây TRƯỚC khi gửi dữ liệu.
      </p>

      <form className="card ad-item" onSubmit={gui}>
        <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Cơ quan yêu cầu" value={f.agency} onChange={set('agency')} aria-label="Cơ quan" />
          <input className="input" style={{ width: 160 }} placeholder="Số văn bản (bắt buộc)" value={f.doc_number} onChange={set('doc_number')} aria-label="Số văn bản" />
          <input className="input" type="date" value={f.doc_date} onChange={set('doc_date')} aria-label="Ngày văn bản" />
        </div>
        <textarea className="textarea" rows={2} placeholder="Xin dữ liệu gì, của ai" value={f.scope} onChange={set('scope')} aria-label="Phạm vi" />
        <input className="input" placeholder="Ghi chú (tuỳ chọn)" value={f.note} onChange={set('note')} aria-label="Ghi chú" />
        {loiGui && <div className="ad-loi" role="alert">{loiGui}</div>}
        <div><button className="btn btn-primary" disabled={dangLam || !hopLe}>Ghi sổ</button></div>
      </form>

      {dangTai && !data ? <Skeleton height={120} /> : loi ? (
        <div className="ad-loi">Không tải được sổ: {thongDiepLoi(loi)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="Chưa có lần cung cấp dữ liệu nào" />
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="ad-bang">
            <thead><tr><th>Cơ quan</th><th>Số văn bản</th><th>Phạm vi</th><th>Ngày văn bản</th><th>Ghi lúc</th></tr></thead>
            <tbody>{data.map((r) => (
              <tr key={r.id}>
                <td>{r.agency}</td>
                <td><code>{r.doc_number}</code></td>
                <td>{r.scope}{r.note && <div className="t-small">{r.note}</div>}</td>
                <td>{r.doc_date ? formatDate(r.doc_date) : '—'}</td>
                <td className="t-small">{formatDateTime(r.created_at)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
