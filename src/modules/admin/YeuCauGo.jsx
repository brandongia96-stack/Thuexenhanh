// admin/takedown — yêu cầu gỡ nội dung, hạn 24h kể từ lúc nhận (0023, chỉ admin).
// "Ẩn ngay" ẩn đúng đối tượng VÀ đóng hàng đợi trong một transaction (admin-ops
// action execute_takedown) — xem lý do ở adminApi.js.

import { useState } from 'react'
import { AlertOctagon } from 'lucide-react'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { useAuth } from '../auth/AuthProvider'
import { formatDateTime } from '../../lib/format'
import { hangDoiYeuCauGo, themYeuCauGo, tuChoiYeuCauGo, anNgayYeuCauGo } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

const NHAN_NGUON = { co_quan_chuc_nang: 'Cơ quan chức năng', nguoi_dung: 'Người dùng', chu_so_huu_tri_tue: 'Chủ sở hữu trí tuệ' }
const NHAN_DOI_TUONG = { listing: 'Tin đăng', review: 'Đánh giá', user: 'Người dùng' }
const RONG = { source: 'co_quan_chuc_nang', requester: '', doc_ref: '', target_type: 'listing', target_id: '', reason: '' }

function ConLai({ deadline }) {
  const gio = Math.round((new Date(deadline).getTime() - Date.now()) / 3_600_000)
  const qua = gio < 0
  const gap = gio >= 0 && gio < 4
  return (
    <span className="t-small" style={{ color: qua || gap ? 'var(--m-red)' : undefined, fontWeight: qua || gap ? 600 : undefined }}>
      {qua ? `Quá hạn ${-gio} giờ` : `Còn ${gio} giờ`}
    </span>
  )
}

function ThemForm({ taiLai, huy }) {
  const [f, setF] = useState(RONG)
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const hopLe = f.requester.trim() && f.target_id.trim() && f.reason.trim().length >= 5

  async function gui(e) {
    e.preventDefault()
    setDangLam(true); setLoi(null)
    try { await themYeuCauGo(f); taiLai() } catch (er) { setLoi(thongDiepLoi(er)) } finally { setDangLam(false) }
  }

  return (
    <form className="card ad-item" onSubmit={gui}>
      <div className="t-h3">Nhập yêu cầu gỡ mới</div>
      <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto' }} value={f.source} onChange={set('source')} aria-label="Nguồn yêu cầu">
          {Object.entries(NHAN_NGUON).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={f.target_type} onChange={set('target_type')} aria-label="Loại đối tượng">
          {Object.entries(NHAN_DOI_TUONG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Tên người/cơ quan yêu cầu" value={f.requester} onChange={set('requester')} aria-label="Người yêu cầu" />
        <input className="input" style={{ width: 160 }} placeholder="Số văn bản (nếu có)" value={f.doc_ref} onChange={set('doc_ref')} aria-label="Số văn bản" />
        <input className="input" style={{ width: 280 }} placeholder={`Mã ${NHAN_DOI_TUONG[f.target_type]} (uuid)`} value={f.target_id} onChange={set('target_id')} aria-label="Mã đối tượng" />
      </div>
      <textarea className="textarea" rows={2} placeholder="Lý do yêu cầu gỡ" value={f.reason} onChange={set('reason')} aria-label="Lý do" />
      {loi && <div className="ad-loi" role="alert">{loi}</div>}
      <div className="ad-hanh-dong">
        <button className="btn btn-primary" disabled={dangLam || !hopLe}>Lưu — hạn tính từ lúc này</button>
        <button type="button" className="btn btn-ghost" onClick={huy}>Huỷ</button>
      </div>
    </form>
  )
}

function Dong({ yc, taiLai }) {
  const [tuChoi, setTuChoi] = useState(false)
  const [note, setNote] = useState('')
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)
  const { user } = useAuth()

  async function anNgay() {
    setDangLam(true); setLoi(null)
    try { await anNgayYeuCauGo(yc.id); taiLai() } catch (e) { setLoi(thongDiepLoi(e)); setDangLam(false) }
  }
  async function tuChoiGui() {
    setDangLam(true); setLoi(null)
    try { await tuChoiYeuCauGo(yc.id, note.trim(), user.id); taiLai() } catch (e) { setLoi(thongDiepLoi(e)); setDangLam(false) }
  }

  return (
    <article className="card ad-item">
      <div className="row" style={{ justifyContent: 'space-between', gap: 'var(--sp-3)' }}>
        <div>
          <div className="t-h3">{NHAN_NGUON[yc.source]} — {yc.requester}</div>
          <div className="t-small">{NHAN_DOI_TUONG[yc.target_type]} <code>{yc.target_id.slice(0, 8)}</code> · nhận {formatDateTime(yc.received_at)}</div>
        </div>
        {yc.status === 'cho_xu_ly' ? <ConLai deadline={yc.deadline_at} /> : <Badge tone={yc.status === 'da_go' ? 'danger' : 'neutral'}>{yc.status === 'da_go' ? 'Đã gỡ' : 'Từ chối'}</Badge>}
      </div>
      <p className="t-body" style={{ margin: 0 }}>{yc.reason}</p>
      {yc.doc_ref && <div className="t-small">Văn bản: {yc.doc_ref}</div>}

      {yc.status === 'cho_xu_ly' && (
        tuChoi ? (
          <div className="stack" style={{ gap: 'var(--sp-2)' }}>
            <input className="input" placeholder="Lý do từ chối" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Lý do từ chối" />
            {loi && <div className="ad-loi" role="alert">{loi}</div>}
            <div className="ad-hanh-dong">
              <button className="btn btn-sm btn-ghost" disabled={dangLam || note.trim().length < 5} onClick={tuChoiGui}>Xác nhận từ chối</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setTuChoi(false)}>Thôi</button>
            </div>
          </div>
        ) : (
          <div className="ad-hanh-dong">
            <button className="btn btn-sm btn-danger" disabled={dangLam} onClick={anNgay}>
              <AlertOctagon size={14} strokeWidth={2} /> Ẩn ngay
            </button>
            <button className="btn btn-sm btn-ghost" disabled={dangLam} onClick={() => setTuChoi(true)}>Từ chối</button>
            {loi && <div className="ad-loi" role="alert">{loi}</div>}
          </div>
        )
      )}
      {yc.status !== 'cho_xu_ly' && yc.note && <div className="t-small">Ghi chú: {yc.note}</div>}
    </article>
  )
}

export default function YeuCauGo() {
  const { data, loi, dangTai, taiLai } = useTai(() => hangDoiYeuCauGo())
  const [them, setThem] = useState(false)

  return (
    <div className="stack" style={{ gap: 'var(--sp-3)' }}>
      {them ? <ThemForm taiLai={() => { setThem(false); taiLai() }} huy={() => setThem(false)} />
        : <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => setThem(true)}>Nhập yêu cầu mới</button>}

      {dangTai && !data ? <Skeleton height={160} /> : loi ? (
        <div className="ad-loi">Không tải được: {thongDiepLoi(loi)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="Không có yêu cầu gỡ nào" />
      ) : (
        data.map((yc) => <Dong key={yc.id} yc={yc} taiLai={taiLai} />)
      )}
    </div>
  )
}
