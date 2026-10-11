// admin/complaints — hàng đợi khiếu nại (complaints + complaint_messages, 0023).
// Mỗi khiếu nại có mã KN-YYMM-NNNNN + hạn 21 ngày lịch (15 ngày làm việc).
// Đổi trạng thái/kết quả và trả lời đi THẲNG qua RLS (complaints_staff,
// cmsg_insert) — không qua admin-ops, vì 0023 đã mở đường ghi cho kiểm duyệt/admin.

import { useState } from 'react'
import { MessageSquare, Clock } from 'lucide-react'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { useAuth } from '../auth/AuthProvider'
import { formatDateTime } from '../../lib/format'
import { hangDoiKhieuNai, tinNhanKhieuNai, xuLyKhieuNai, traLoiKhieuNai } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

const NHAN_LOAI = {
  nen_tang: 'Nền tảng', tin_dang: 'Tin đăng', bao_cao_sai: 'Báo cáo sai', token: 'Token', du_lieu: 'Dữ liệu', khac: 'Khác',
}
const NHAN_TRANG_THAI = {
  da_nhan: 'Đã nhận', dang_xu_ly: 'Đang xử lý', cho_bo_sung: 'Chờ bổ sung', da_giai_quyet: 'Đã giải quyết', dong: 'Đóng',
}

// Số ngày còn lại tới hạn. Âm = đã quá hạn — hiện đỏ để không ai bỏ sót.
function ConLai({ due }) {
  const ngay = Math.ceil((new Date(due).getTime() - Date.now()) / 86_400_000)
  const qua = ngay < 0
  return (
    <span className="t-small" style={qua ? { color: 'var(--m-red)', fontWeight: 600 } : undefined}>
      <Clock size={12} strokeWidth={2} style={{ verticalAlign: '-2px' }} />{' '}
      {qua ? `Quá hạn ${-ngay} ngày` : ngay === 0 ? 'Hết hạn hôm nay' : `Còn ${ngay} ngày`}
    </span>
  )
}

function TinNhan({ complaintId }) {
  const { data, loi, taiLai } = useTai(() => tinNhanKhieuNai(complaintId), [complaintId])
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [dangLam, setDangLam] = useState(false)
  const [loiGui, setLoiGui] = useState(null)

  async function gui(e) {
    e.preventDefault()
    setDangLam(true); setLoiGui(null)
    try { await traLoiKhieuNai(complaintId, body.trim(), user.id); setBody(''); taiLai() }
    catch (er) { setLoiGui(thongDiepLoi(er)) } finally { setDangLam(false) }
  }

  if (loi) return <div className="ad-loi">Không tải được tin nhắn.</div>
  return (
    <div className="stack" style={{ gap: 'var(--sp-2)' }}>
      {(data ?? []).map((m) => (
        <div key={m.id} className="t-small" style={{ textAlign: m.is_staff ? 'right' : 'left' }}>
          <b>{m.is_staff ? 'Quản trị' : 'Người gửi'}</b> · {formatDateTime(m.created_at)}
          <div>{m.body}</div>
        </div>
      ))}
      <form className="row" style={{ gap: 'var(--sp-2)' }} onSubmit={gui}>
        <input className="input" placeholder="Trả lời..." value={body} onChange={(e) => setBody(e.target.value)} aria-label="Trả lời khiếu nại" />
        <button className="btn btn-sm btn-primary" disabled={dangLam || !body.trim()}>Gửi</button>
      </form>
      {loiGui && <div className="ad-loi" role="alert">{loiGui}</div>}
    </div>
  )
}

function Dong({ kn, taiLai }) {
  const { user } = useAuth()
  const [moTinNhan, setMoTinNhan] = useState(false)
  const [ketQua, setKetQua] = useState(kn.resolution ?? '')
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)

  async function doi(status) {
    setDangLam(true); setLoi(null)
    try { await xuLyKhieuNai(kn.id, { status, resolution: ketQua.trim() || null, actorId: user.id }); taiLai() }
    catch (e) { setLoi(thongDiepLoi(e)) } finally { setDangLam(false) }
  }

  return (
    <article className="card ad-item">
      <div className="row" style={{ justifyContent: 'space-between', gap: 'var(--sp-3)' }}>
        <div>
          <div className="t-h3"><code>{kn.code}</code> · {NHAN_LOAI[kn.kind] ?? kn.kind}</div>
          <div className="t-small">
            {kn.user?.full_name ?? 'Người dùng'} ({kn.user?.phone ?? '—'})
            {kn.listing && <> · xe {kn.listing.brand_text} {kn.listing.model_text}</>}
          </div>
        </div>
        <div className="stack" style={{ gap: 4, alignItems: 'flex-end' }}>
          <Badge tone={kn.status === 'da_giai_quyet' ? 'verified' : 'neutral'}>{NHAN_TRANG_THAI[kn.status]}</Badge>
          <ConLai due={kn.due_at} />
        </div>
      </div>
      <p className="t-body" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{kn.content}</p>

      <textarea className="textarea" rows={2} placeholder="Kết quả xử lý (hiện cho người khiếu nại)"
        value={ketQua} onChange={(e) => setKetQua(e.target.value)} aria-label="Kết quả xử lý" />
      {loi && <div className="ad-loi" role="alert">{loi}</div>}
      <div className="ad-hanh-dong">
        <button className="btn btn-sm btn-ghost" disabled={dangLam} onClick={() => doi('dang_xu_ly')}>Đang xử lý</button>
        <button className="btn btn-sm btn-ghost" disabled={dangLam} onClick={() => doi('cho_bo_sung')}>Chờ bổ sung</button>
        <button className="btn btn-sm btn-primary" disabled={dangLam} onClick={() => doi('da_giai_quyet')}>Đã giải quyết</button>
        <button className="btn btn-sm btn-danger" disabled={dangLam} onClick={() => doi('dong')}>Đóng</button>
        <button className="btn btn-sm btn-ghost" onClick={() => setMoTinNhan((v) => !v)}>
          <MessageSquare size={14} strokeWidth={2} /> {moTinNhan ? 'Ẩn tin nhắn' : 'Xem tin nhắn'}
        </button>
      </div>
      {moTinNhan && <TinNhan complaintId={kn.id} />}
    </article>
  )
}

export default function KhieuNai() {
  const { data, loi, dangTai, taiLai } = useTai(() => hangDoiKhieuNai())

  if (dangTai && !data) return <Skeleton height={200} />
  if (loi) return <div className="ad-loi">Không tải được khiếu nại: {thongDiepLoi(loi)}</div>
  if (data.length === 0) return <EmptyState title="Không có khiếu nại nào đang chờ" />

  return (
    <div>
      {data.map((kn) => <Dong key={kn.id} kn={kn} taiLai={taiLai} />)}
    </div>
  )
}
