// trust/complaint/TrangKhieuNaiCuaToi — Tài khoản → Khiếu nại.
//
// Màn CHỨC NĂNG: tạo khiếu nại thật, theo dõi mã hồ sơ + hạn xử lý, nhắn thêm.
// Dữ liệu đọc/ghi bảng `complaints`/`complaint_messages`, RLS đã chặn chỉ thấy
// khiếu nại của chính mình.

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Clock, MessageSquarePlus, Plus, ShieldAlert,
  AlertCircle, CheckCircle2, RefreshCw, X,
} from 'lucide-react'
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
  cho_bo_sung: { label: 'Chờ bổ sung', tone: 'warn' },
  da_giai_quyet: { label: 'Đã giải quyết', tone: 'ok' },
  dong: { label: 'Đã đóng', tone: 'mid' },
}

function NhanTrangThai({ status }) {
  const n = NHAN_TRANG_THAI[status] ?? { label: status, tone: 'mid' }
  return <span className={`kn-nhan kn-nhan-${n.tone}`}>{n.label}</span>
}

function FormTaoMoi({ userId, macDinh, onTao, onHuy, dangGui }) {
  const [kind, setKind] = useState(macDinh.kind || 'nen_tang')
  const [content, setContent] = useState('')
  const [loi, setLoi] = useState(null)

  async function xuLy(e) {
    e.preventDefault()
    setLoi(null)
    const noiDung = content.trim()
    if (noiDung.length < 10) {
      setLoi('Nội dung khiếu nại cần ít nhất 10 ký tự.')
      return
    }

    try {
      let reportId = null
      if (kind === 'bao_cao_sai' && macDinh.listingId) {
        reportId = await layBaoCaoDaXacNhan(macDinh.listingId)
      }
      await onTao({ userId, kind, content: noiDung, listingId: macDinh.listingId ?? null, reportId })
      setContent('')
    } catch (err) {
      setLoi(err?.message || 'Không gửi được khiếu nại, vui lòng thử lại sau.')
    }
  }

  return (
    <form onSubmit={xuLy} className="card card-pad kn-the-form stack" style={{ gap: 'var(--sp-4)' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="t-h3" style={{ margin: 0 }}>Gửi khiếu nại mới</h3>
        {onHuy && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onHuy}
            style={{ padding: '0 8px', height: 32 }}
            disabled={dangGui}
          >
            <X size={16} /> Đóng
          </button>
        )}
      </div>

      {macDinh.listingId && kind === 'bao_cao_sai' && (
        <div
          className="t-small"
          style={{
            color: 'var(--m-subtle)',
            background: 'var(--m-bg)',
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--m-border)',
          }}
        >
          Kháng cáo cho tin đăng: <code>{macDinh.listingId}</code>
        </div>
      )}

      {/* Trường: Loại khiếu nại */}
      <div className="field">
        <label className="field-label" htmlFor="kn-loai" style={{ margin: 0 }}>
          Loại khiếu nại
        </label>
        <select
          id="kn-loai"
          className="select"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {LOAI_KHIEU_NAI.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Trường: Nội dung */}
      <div className="field">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="field-label" htmlFor="kn-noidung" style={{ margin: 0 }}>
            Nội dung khiếu nại
          </label>
          <span className="field-hint" style={{ margin: 0 }}>
            {content.trim().length}/10 ký tự tối thiểu
          </span>
        </div>
        <textarea
          id="kn-noidung"
          className="textarea"
          rows={5}
          placeholder="Mô tả cụ thể sự việc cần đội ngũ Thuê Xe Nhanh hỗ trợ xử lý…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <div className="field-hint" style={{ marginTop: 2 }}>
          Ít nhất 10 ký tự. Vui lòng cung cấp chi tiết ngày giờ, thông tin xe hoặc người liên quan (nếu có).
        </div>
      </div>

      {loi && (
        <div className="loi-he-thong" style={{ margin: 0 }}>
          <AlertCircle size={16} />
          <span>{loi}</span>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
        {onHuy && (
          <button type="button" className="btn btn-ghost" onClick={onHuy} disabled={dangGui}>
            Huỷ
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={dangGui || content.trim().length < 10}
        >
          {dangGui ? (
            <>
              <RefreshCw size={16} className="fdt-quay" />
              Đang gửi…
            </>
          ) : (
            <>
              <Plus size={16} strokeWidth={2} />
              Gửi khiếu nại
            </>
          )}
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
    layChiTietKhieuNai(complaintId)
      .then((kq) => {
        if (!huy) setState(kq)
      })
      .catch(() => {})
    return () => {
      huy = true
    }
  }, [complaintId])

  async function boSung(e) {
    e.preventDefault()
    if (!tinMoi.trim()) return
    setDangGui(true)
    try {
      const dong = await guiBoSung({ complaintId, userId, body: tinMoi })
      if (dong) {
        setState((s) => ({ ...s, tinNhan: [...s.tinNhan, dong] }))
      }
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

      <div className="card card-pad stack kn-the-form" style={{ gap: 'var(--sp-2)' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="t-h3" style={{ margin: 0 }}>{khieuNai.code}</span>
          <NhanTrangThai status={khieuNai.status} />
        </div>
        <div className="t-small" style={{ color: 'var(--m-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={13} strokeWidth={2} /> Hạn xử lý: {formatDate(khieuNai.due_at)}
        </div>
        <p className="t-body" style={{ margin: 'var(--sp-2) 0', whiteSpace: 'pre-wrap' }}>
          {khieuNai.content}
        </p>
        {khieuNai.resolution && (
          <div className="kn-ket-qua">
            <b>Kết quả giải quyết:</b> {khieuNai.resolution}
          </div>
        )}
      </div>

      <div className="stack" style={{ gap: 'var(--sp-2)' }}>
        {tinNhan.map((tn) => (
          <div key={tn.id} className={`kn-tin ${tn.is_staff ? 'kn-tin-staff' : 'kn-tin-minh'}`}>
            <div className="t-small" style={{ color: 'var(--m-subtle)' }}>
              {tn.is_staff ? 'Thuê Xe Nhanh' : 'Bạn'} · {formatDateTime(tn.created_at)}
            </div>
            <div style={{ marginTop: 2, whiteSpace: 'pre-wrap' }}>{tn.body}</div>
          </div>
        ))}
      </div>

      {khieuNai.status !== 'dong' && (
        <form onSubmit={boSung} className="row" style={{ gap: 'var(--sp-2)' }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Bổ sung thông tin trao đổi…"
            value={tinMoi}
            onChange={(e) => setTinMoi(e.target.value)}
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
  const navigate = useNavigate()

  const [danhSach, setDanhSach] = useState([])
  const [dangTai, setDangTai] = useState(true)
  const [dangMo, setDangMo] = useState(null)
  const [dangGuiMoi, setDangGuiMoi] = useState(false)
  const [hienForm, setHienForm] = useState(() => params.get('kind') === 'bao_cao_sai')
  const [thongBaoThanhCong, setThongBaoThanhCong] = useState(null)

  const macDinh = useMemo(() => ({
    kind: params.get('kind') || '',
    listingId: params.get('listing_id') || null,
  }), [params])

  useEffect(() => {
    if (dangKiemTraDangNhap) return
    if (!user?.id) {
      setDangTai(false)
      return
    }

    layDanhSachKhieuNai()
      .then((d) => {
        setDanhSach(d || [])
      })
      .catch(() => {})
      .finally(() => {
        setDangTai(false)
      })
  }, [user?.id, dangKiemTraDangNhap])

  async function taoMoi(payload) {
    setDangGuiMoi(true)
    setThongBaoThanhCong(null)
    try {
      const moi = await taoKhieuNai(payload)
      setDanhSach((d) => [moi, ...(d ?? [])])
      setHienForm(false)
      setThongBaoThanhCong(`Gửi khiếu nại thành công! Mã hồ sơ: ${moi?.code || ''}`)
      setTimeout(() => {
        setThongBaoThanhCong(null)
      }, 5000)
    } finally {
      setDangGuiMoi(false)
    }
  }

  if (dangKiemTraDangNhap || dangTai) return <PageLoading />

  if (!user) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <EmptyState
          icon={ShieldAlert}
          title="Cần đăng nhập để xem khiếu nại"
          hint="Vui lòng đăng nhập vào tài khoản để tạo và theo dõi tiến độ xử lý khiếu nại của bạn."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/dang-nhap')}>
              Đăng nhập
            </button>
          }
        />
      </div>
    )
  }

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
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setHienForm(true)}
          >
            <Plus size={16} strokeWidth={2} /> Khiếu nại mới
          </button>
        )}
      </div>

      {thongBaoThanhCong && (
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--m-green-light)',
            color: 'var(--m-green-hover)',
            borderRadius: 'var(--r-md)',
            fontWeight: 500,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{thongBaoThanhCong}</span>
        </div>
      )}

      {hienForm && (
        <FormTaoMoi
          userId={user.id}
          macDinh={macDinh}
          onTao={taoMoi}
          onHuy={() => setHienForm(false)}
          dangGui={dangGuiMoi}
        />
      )}

      {(!danhSach || danhSach.length === 0) ? (
        <EmptyState
          icon={ShieldAlert}
          title="Chưa có khiếu nại nào"
          hint="Khi có vấn đề cần chúng em hỗ trợ xử lý, bấm nút &quot;Khiếu nại mới&quot; ở trên."
        />
      ) : (
        <div className="stack" style={{ gap: 'var(--sp-3)' }}>
          {danhSach.map((kn) => (
            <button
              key={kn.id}
              type="button"
              className="card card-pad kn-dong"
              onClick={() => setDangMo(kn.id)}
            >
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{kn.code}</span>
                <NhanTrangThai status={kn.status} />
              </div>
              <div className="t-small" style={{ color: 'var(--m-subtle)', marginTop: 2 }}>
                Hạn xử lý: {formatDate(kn.due_at)}
              </div>
              <div className="t-body kn-trich">{kn.content}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
