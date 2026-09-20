// admin/listings — hàng đợi duyệt tin. Dùng chung cho admin và kiem_duyet
// (luồng 08 có thể nhúng component này vào /kiem-duyet).
//
// Người duyệt thấy ĐỦ thông tin + ảnh, và cảnh báo nếu biển số trùng tin khác.
// Từ chối bắt buộc có lý do — chủ xe nhận đúng lý do đó.

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { formatVnd, timeAgo, formatPhone } from '../../lib/format'
import { hangDuyet, duyetTin, tuChoiTin, canhBaoTrungBienSo } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

function TrungBienSo({ listingId, bienSo }) {
  const [ds, setDs] = useState(null)
  useEffect(() => {
    if (!bienSo) return
    let huy = false
    canhBaoTrungBienSo(listingId).then((r) => !huy && setDs(r.items ?? [])).catch(() => {})
    return () => { huy = true }
  }, [listingId, bienSo])

  // Không có biển số, hoặc không trùng → ẩn cả khối.
  if (!ds || ds.length === 0) return null
  return (
    <div className="ad-canh-bao" role="alert">
      Biển số <b>{bienSo}</b> trùng với {ds.length} tin khác:{' '}
      {ds.map((t) => `${t.brand_text} ${t.model_text} (${t.status})`).join(', ')}.
    </div>
  )
}

function TinCho({ tin, onXong }) {
  const [tuChoi, setTuChoi] = useState(false)
  const [lyDo, setLyDo] = useState('')
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)

  const anh = (tin.listing_images ?? [])
    .filter((a) => !a.deleted_at).sort((a, b) => a.sort_order - b.sort_order)
  const chu = tin.owner

  async function chay(fn) {
    setDangLam(true); setLoi(null)
    try { await fn(); onXong(tin.id) } catch (e) { setLoi(thongDiepLoi(e)); setDangLam(false) }
  }

  return (
    <article className="card ad-item">
      <div className="row" style={{ justifyContent: 'space-between', gap: 'var(--sp-3)' }}>
        <div>
          <div className="t-h3">{tin.brand_text} {tin.model_text} {tin.year ?? ''}</div>
          <div className="t-small">Gửi {timeAgo(tin.created_at)}</div>
        </div>
        {chu?.verify_status === 'da_xac_minh' && <Badge tone="verified" icon={ShieldCheck}>Chủ xe đã xác minh</Badge>}
      </div>

      {anh.length > 0 ? (
        <div className="ad-anh">
          {anh.map((a) => (
            <a key={a.url_medium ?? a.url_thumb} href={a.url_medium ?? a.url_thumb} target="_blank" rel="noreferrer">
              <img src={a.url_thumb} height={96} width={128} loading="lazy" decoding="async" alt="" />
            </a>
          ))}
        </div>
      ) : (
        <div className="ad-canh-bao">Tin này chưa có ảnh nào.</div>
      )}

      <dl className="ad-kv">
        <div><dt>Giá / ngày</dt><dd>{formatVnd(tin.price_per_day)}</dd></div>
        {tin.plate && <div><dt>Biển số</dt><dd>{tin.plate}</dd></div>}
        {tin.seats && <div><dt>Số chỗ</dt><dd>{tin.seats}</dd></div>}
        {tin.address_text && <div><dt>Địa chỉ</dt><dd>{tin.address_text}</dd></div>}
        <div><dt>SĐT liên hệ</dt><dd>{formatPhone(tin.contact_phone)}</dd></div>
        {chu?.full_name && <div><dt>Chủ xe</dt><dd>{chu.full_name}</dd></div>}
      </dl>
      {tin.description && <p className="t-body" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{tin.description}</p>}

      <TrungBienSo listingId={tin.id} bienSo={tin.plate} />
      {loi && <div className="ad-loi" role="alert">{loi}</div>}

      {tuChoi ? (
        <div className="stack" style={{ gap: 'var(--sp-2)' }}>
          <label className="field-label" htmlFor={`ly-do-${tin.id}`}>Lý do từ chối (chủ xe sẽ đọc dòng này)</label>
          <textarea id={`ly-do-${tin.id}`} className="textarea" rows={3} value={lyDo}
            onChange={(e) => setLyDo(e.target.value)} placeholder="Ví dụ: Ảnh mờ, chưa thấy biển số xe" />
          <div className="ad-hanh-dong">
            <button className="btn btn-danger" disabled={dangLam || lyDo.trim().length < 5}
              onClick={() => chay(() => tuChoiTin(tin.id, lyDo.trim()))}>Xác nhận từ chối</button>
            <button className="btn btn-ghost" disabled={dangLam} onClick={() => setTuChoi(false)}>Huỷ</button>
          </div>
        </div>
      ) : (
        <div className="ad-hanh-dong">
          <button className="btn btn-primary" disabled={dangLam} onClick={() => chay(() => duyetTin(tin.id))}>
            <CheckCircle2 size={16} strokeWidth={2} /> Duyệt
          </button>
          <button className="btn btn-ghost" disabled={dangLam} onClick={() => setTuChoi(true)}>
            <XCircle size={16} strokeWidth={2} /> Từ chối
          </button>
        </div>
      )}
    </article>
  )
}

export default function HangDuyet() {
  const { data, loi, dangTai, taiLai } = useTai(() => hangDuyet())
  const [daXong, setDaXong] = useState(() => new Set())

  if (dangTai && !data) return <Skeleton height={220} />
  if (loi) {
    return (
      <div className="ad-loi">
        Không tải được hàng đợi. <button className="btn btn-sm btn-ghost" onClick={taiLai}>Thử lại</button>
      </div>
    )
  }

  const con = data.items.filter((t) => !daXong.has(t.id))
  if (con.length === 0) {
    return (
      <EmptyState title="Không có tin nào chờ duyệt"
        action={data.conNua ? <button className="btn btn-soft" onClick={taiLai}>Tải tiếp</button> : null} />
    )
  }

  return (
    <div>
      {con.map((t) => (
        <TinCho key={t.id} tin={t} onXong={(id) => setDaXong((s) => new Set(s).add(id))} />
      ))}
      {data.conNua && (
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <button className="btn btn-soft" onClick={taiLai}>Còn tin nữa — tải lại danh sách</button>
        </div>
      )}
    </div>
  )
}
