// trust/complaint/TrangKhieuNaiCuaToi — Tài khoản → Khiếu nại.
//
// Khác /khieu-nai (trang tĩnh giải thích chính sách, pháp lý viết): đây là
// màn CHỨC NĂNG — tạo khiếu nại thật, theo dõi mã hồ sơ + hạn xử lý, nhắn
// thêm. Dữ liệu đọc/ghi thẳng bảng `complaints`/`complaint_messages`, RLS đã
// chặn chỉ thấy khiếu nại của chính mình (migration 0023).
//
// Vào từ "Kháng cáo" trên thẻ xe (owner/TheXe.jsx) có kèm query string
// ?kind=bao_cao_sai&listing_id=<id> để điền sẵn — chủ xe vẫn gửi thủ công,
// không tự động hoá hoàn toàn.

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Clock, MessageSquarePlus, Plus, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import EmptyState from '../../../components/EmptyState'
import { PageLoading } from '../../../components/Loading'
import { formatDate, formatDateTime } from '../../../lib/format'
import {
  LOAI_KHIEU_NAI, layDanhSachKhieuNai, layChiTietKhieuNai,
  taoKhieuNai, guiBoSung, layBaoCaoDaXacNhan,
} from './complaintApi'
import './KhieuNai.css'

const NHAN_TRANG_THAI = {
  da_nhan: { label: 'Đã nhận', tone: 'info' },
  dang_xu_ly: { label: 'Đang xử lý', tone: 'info' },
  cho_bo_sung: { label: 'Chờ anh/chị bổ sung', tone: 'warn' },
  da_giai_quyet: { label: 'Đã giải quyết', tone: 'ok' },
  dong: { label: 'Đã đóng', tone: 'mid' },
}

function NhanTrangThai({ status }) {
  const n = NHAN_TRANG_THAI[status] ?? { label: status, tone: 'mid' }
  return <span className={`kn-nhan kn-nhan-${n.tone}`}>{n.label}</span>
}

function FormTaoMoi({ userId, macDinh, onTao, dangGui }) {
  const [kind, setKind] = useState(macDinh.kind || 'nen_tang')
  const [content, setContent] = useState('')
  const [loi, setLoi] = useState(null)

  async function xuLy(e) {
    e.preventDefault()
    setLoi(null)
    try {
      let reportId = null
      if (kind === 'bao_cao_sai' && macDinh.listingId) {
        reportId = await layBaoCaoDaXacNhan(macDinh.listingId)
      }
      await onTao({ userId, kind, content, listingId: macDinh.listingId ?? null, reportId })
      setContent('')
    } catch (err) {
      setLoi(err.message || 'Không gửi được, thử lại sau.')
    }
  }

  return (
    <form onSubmit={xuLy} className="card card-pad stack" style={{ gap: 'var(--sp-3)' }}>
      <h3 className="t-h3">Gửi khiếu nại mới</h3>
      {macDinh.listingId && kind === 'bao_cao_sai' && (
        <div className="t-small" style={{ color: 'var(--m-subtle)' }}>
          Kháng cáo cho tin <code>{macDinh.listingId}</code>.
        </div>
      )}
      <div>
        <label className="truong-nhan">Loại khiếu nại</label>
        <select className="truong-o" value={kind} onChange={e => setKind(e.target.value)}>
          {LOAI_KHIEU_NAI.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      <div>
        <label className="truong-nhan">Nội dung</label>
        <textarea
          className="truong-o" rows={4}
          placeholder="Mô tả cụ thể việc anh/chị cần chúng em xử lý…"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="truong-phu">Ít nhất 10 ký tự.</div>
      </div>
      {loi && <div className="loi-he-thong">{loi}</div>}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={dangGui || content.trim().length < 10}>
          <Plus size={16} strokeWidth={2} />
          {dangGui ? 'Đang gửi…' : 'Gửi khiếu nại'}
        </button>
      </div>
    </form>
  )
}

function ChiTiet({ complaintId, userId, onDong }) {
  const [state, setState] = useState(null)
  const [tinMoi, setTinMoi] = useState('')
  const [dangGui, setDangGui] = useState(false)

  useEffect(() => {
    let huy = false
    layChiTietKhieuNai(complaintId).then(kq => { if (!huy) setState(kq) })
    return () => { huy = true }
  }, [complaintId])

  async function boSung(e) {
    e.preventDefault()
    if (!tinMoi.trim()) return
    setDangGui(true)
    try {
      const dong = await guiBoSung({ complaintId, userId, body: tinMoi })
      setState(s => ({ ...s, tinNhan: [...s.tinNhan, dong] }))
      setTinMoi('')
    } finally {
      setDangGui(false)
    }
  }

  if (!state) return <PageLoading />
  const { khieuNai, tinNhan } = state

  return (
    <div className="stack" style={{ gap: 'var(--sp-4)' }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onDong}>
        <ArrowLeft size={16} strokeWidth={2} /> Quay lại danh sách
      </button>

      <div className="card card-pad stack" style={{ gap: 'var(--sp-2)' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="t-h3">{khieuNai.code}</span>
          <NhanTrangThai status={khieuNai.status} />
        </div>
        <div className="t-small" style={{ color: 'var(--m-subtle)' }}>
          <Clock size={13} strokeWidth={2} /> Hạn xử lý {formatDate(khieuNai.due_at)}
        </div>
        <p className="t-body">{khieuNai.content}</p>
        {khieuNai.resolution && (
          <div className="kn-ket-qua">
            <b>Kết quả:</b> {khieuNai.resolution}
          </div>
        )}
      </div>

      <div className="stack" style={{ gap: 'var(--sp-2)' }}>
        {tinNhan.map(tn => (
          <div key={tn.id} className={`kn-tin ${tn.is_staff ? 'kn-tin-staff' : 'kn-tin-minh'}`}>
            <div className="t-small" style={{ color: 'var(--m-subtle)' }}>
              {tn.is_staff ? 'Thuê Xe Nhanh' : 'Anh/chị'} · {formatDateTime(tn.created_at)}
            </div>
            <div>{tn.body}</div>
          </div>
        ))}
      </div>

      {khieuNai.status !== 'dong' && (
        <form onSubmit={boSung} className="row" style={{ gap: 'var(--sp-2)' }}>
          <input
            className="truong-o" style={{ flex: 1 }}
            placeholder="Bổ sung thông tin…"
            value={tinMoi}
            onChange={e => setTinMoi(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={dangGui || !tinMoi.trim()}>
            <MessageSquarePlus size={16} strokeWidth={2} />
            Bổ sung
          </button>
        </form>
      )}
    </div>
  )
}

export default function TrangKhieuNaiCuaToi() {
  const { user, loading: dangKiemTraDangNhap } = useAuth()
  const [params] = useSearchParams()
  const [danhSach, setDanhSach] = useState(null)
  const [dangTai, setDangTai] = useState(true)
  const [dangMo, setDangMo] = useState(null) // id khiếu nại đang xem chi tiết, hoặc null
  const [dangGuiMoi, setDangGuiMoi] = useState(false)
  const [hienForm, setHienForm] = useState(() => params.get('kind') === 'bao_cao_sai')

  const macDinh = useMemo(() => ({
    kind: params.get('kind') || '',
    listingId: params.get('listing_id') || null,
  }), [params])

  useEffect(() => {
    if (!user?.id) return
    layDanhSachKhieuNai().then(d => { setDanhSach(d); setDangTai(false) }).catch(() => setDangTai(false))
  }, [user?.id])

  async function taoMoi(payload) {
    setDangGuiMoi(true)
    try {
      const moi = await taoKhieuNai(payload)
      setDanhSach(d => [moi, ...(d ?? [])])
      setHienForm(false)
    } finally {
      setDangGuiMoi(false)
    }
  }

  if (dangKiemTraDangNhap || dangTai) return <PageLoading />

  if (dangMo) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <ChiTiet complaintId={dangMo} userId={user.id} onDong={() => setDangMo(null)} />
      </div>
    )
  }

  return (
    <div className="page stack" style={{ maxWidth: 640, gap: 'var(--sp-4)' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="t-h2" style={{ margin: 0 }}>Khiếu nại của tôi</h1>
        {!hienForm && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setHienForm(true)}>
            <Plus size={16} strokeWidth={2} /> Khiếu nại mới
          </button>
        )}
      </div>

      {hienForm && (
        <FormTaoMoi userId={user.id} macDinh={macDinh} onTao={taoMoi} dangGui={dangGuiMoi} />
      )}

      {(!danhSach || danhSach.length === 0) ? (
        <EmptyState
          icon={ShieldAlert}
          title="Chưa có khiếu nại nào"
          hint="Khi có việc cần chúng em xử lý, anh/chị bấm &quot;Khiếu nại mới&quot; ở trên."
        />
      ) : (
        <div className="stack" style={{ gap: 'var(--sp-2)' }}>
          {danhSach.map(kn => (
            <button
              key={kn.id} type="button" className="card card-pad kn-dong"
              onClick={() => setDangMo(kn.id)}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{kn.code}</span>
                <NhanTrangThai status={kn.status} />
              </div>
              <div className="t-small" style={{ color: 'var(--m-subtle)' }}>
                Hạn xử lý {formatDate(kn.due_at)}
              </div>
              <div className="t-body kn-trich">{kn.content}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
