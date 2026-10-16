import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, ReceiptText, Plus, Eye, Sparkles, RotateCcw } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import EmptyState from '../../../components/EmptyState'
import Badge from '../../../components/Badge'
import { Skeleton } from '../../../components/Loading'
import HopNapToken from '../topup/HopNapToken'
import {
  soDuVi,
  soGiaoDich,
  isTokenDemo,
  batTokenDemo,
  tatTokenDemo,
  demoReset,
  demoDieuChinhVi,
  SU_KIEN_DEMO_THAY_DOI,
  SU_KIEN_VI_THAY_DOI,
} from '../billingApi'
import { NHAN_GIAO_DICH, quyDoiVnd } from '../goiNap'
import { formatVnd, formatDateTime } from '../../../lib/format'
import { FLAGS } from '../../../lib/config'
import '../billing.css'

function DongSo({ d }) {
  const nhan = NHAN_GIAO_DICH[d.kind] ?? { label: d.kind, tone: 'neutral' }
  const vao = d.amount > 0
  return (
    <div className="so-dong">
      <div>
        <div className="so-mo-ta">{d.note || nhan.label}</div>
        <div className="so-thoi-gian">{formatDateTime(d.created_at)}</div>
      </div>
      <div>
        <div className={'so-so ' + (vao ? 'so-vao' : 'so-ra')}>
          {vao ? '+' : '−'}{Math.abs(d.amount)} token
        </div>
        <div className="so-du-sau">còn {d.so_du_sau}</div>
      </div>
    </div>
  )
}

/**
 * Ví token của chủ xe.
 *
 * Ba con số, tách bạch cố ý:
 *   · Số dư      — tổng các dòng sổ, do Postgres cộng lại, không lưu rời.
 *   · Đã nạp     — nghĩa vụ của Thuexenhanh với chủ xe. CHƯA phải doanh thu.
 *   · Đã tiêu    — phần đã đổi thành tháng hiển thị. Đây mới là doanh thu.
 *
 * Gộp ba số đó thành một con số "tổng tiền" là cách sổ sách bắt đầu sai.
 */
export default function TrangVi() {
  const { user, loading: dangDangNhap } = useAuth()
  const [demoMode, setDemoMode] = useState(() => isTokenDemo())
  const [vi, setVi] = useState(null)
  const [so, setSo] = useState({ items: [], conNua: false, cursor: null })
  const [dangTai, setDangTai] = useState(true)
  const [dangTaiThem, setDangTaiThem] = useState(false)
  const [loi, setLoi] = useState(null)
  const [moNap, setMoNap] = useState(false)

  const tai = useCallback(async () => {
    const uid = user?.id || (isTokenDemo() ? 'demo-user-01' : null)
    if (!uid) {
      setDangTai(false)
      return
    }
    setLoi(null)
    try {
      const [b, s] = await Promise.all([soDuVi(uid), soGiaoDich(uid)])
      setVi(b)
      setSo(s)
    } catch (e) {
      setLoi(e?.message ?? 'Không tải được ví')
    } finally {
      setDangTai(false)
    }
  }, [user?.id])

  useEffect(() => {
    tai()
  }, [tai, demoMode])

  // Lắng nghe thay đổi chế độ demo hoặc biến động số dư demo từ các màn khác
  useEffect(() => {
    const handleDemoChange = (e) => {
      setDemoMode(Boolean(e.detail?.enabled))
      tai()
    }
    const handleWalletChange = () => {
      tai()
    }
    window.addEventListener(SU_KIEN_DEMO_THAY_DOI, handleDemoChange)
    window.addEventListener(SU_KIEN_VI_THAY_DOI, handleWalletChange)
    return () => {
      window.removeEventListener(SU_KIEN_DEMO_THAY_DOI, handleDemoChange)
      window.removeEventListener(SU_KIEN_VI_THAY_DOI, handleWalletChange)
    }
  }, [tai])

  const taiThem = async () => {
    const uid = user?.id || (isTokenDemo() ? 'demo-user-01' : null)
    if (!so.cursor || dangTaiThem || !uid) return
    setDangTaiThem(true)
    try {
      const tiep = await soGiaoDich(uid, { cursor: so.cursor })
      setSo((cu) => ({ ...tiep, items: [...cu.items, ...tiep.items] }))
    } catch (e) {
      setLoi(e?.message ?? 'Không tải thêm được')
    } finally {
      setDangTaiThem(false)
    }
  }

  if ((dangDangNhap && !demoMode) || dangTai) {
    return (
      <div className="page stack">
        <Skeleton height={28} width="30%" />
        <Skeleton height={120} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (loi) {
    return (
      <div className="page">
        <EmptyState icon={Wallet} title="Chưa tải được ví" hint={loi} />
      </div>
    )
  }

  // Chưa có ví khác với có ví 0 token. Nhưng với người dùng thì cả hai đều là
  // "chưa có token nào", nên hiển thị 0 và nói thật ở dòng phụ.
  const soDu = vi?.so_du ?? 0
  const daNap = vi?.token_da_nap ?? 0
  const daTieu = vi?.token_da_tieu ?? 0

  return (
    <div className="page stack">
      {/* Thanh điều khiển Chế độ Thử nghiệm Token (token-demo) */}
      {demoMode ? (
        <div className="hop-demo stack" style={{ gap: 'var(--sp-2)' }}>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              <Sparkles size={16} strokeWidth={2} />
              <b>Chế độ Thử nghiệm Token (token-demo: ĐANG BẬT)</b>
            </div>
            <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={async () => {
                  await demoDieuChinhVi({ kind: 'tang', tokens: 30, reason: 'Nạp nhanh thử nghiệm' })
                  tai()
                }}
              >
                +30 token nhanh
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  demoReset()
                  tai()
                }}
              >
                <RotateCcw size={14} /> Đặt lại 50 token
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--m-red)' }}
                onClick={() => {
                  tatTokenDemo()
                  setDemoMode(false)
                }}
              >
                Tắt demo (dùng số thật)
              </button>
            </div>
          </div>
          <div className="t-small">
            Mọi thao tác nạp, trả phí đăng tin, gia hạn hoặc hoàn token đang chạy trên kho demo lưu trong trình duyệt.
            Dữ liệu không mất khi tải lại trang và không ảnh hưởng CSDL thật.
          </div>
        </div>
      ) : (
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--m-subtle)' }}
            onClick={() => {
              batTokenDemo()
              setDemoMode(true)
            }}
          >
            <Sparkles size={14} /> Bật chế độ thử nghiệm (token-demo)
          </button>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 className="t-h1">Ví token</h1>
        {(FLAGS.nap_tien_that || demoMode) && (
          <button type="button" className="btn btn-primary" onClick={() => setMoNap(true)}>
            <Plus size={18} strokeWidth={2} /> Nạp token
          </button>
        )}
      </div>

      <div className="vi-tomtat">
        <div className="vi-o vi-o-chinh">
          <span className="vi-nhan">Số dư</span>
          <span className="vi-so">{soDu} token</span>
          <span className="vi-phu">tương đương {formatVnd(quyDoiVnd(soDu))}</span>
        </div>
        <div className="vi-o">
          <span className="vi-nhan">Đã nạp</span>
          <span className="vi-so-phu">{daNap} token</span>
          <span className="vi-phu">tổng từ trước tới nay</span>
        </div>
        <div className="vi-o">
          <span className="vi-nhan">Đã dùng</span>
          <span className="vi-so-phu">{daTieu} token</span>
          <span className="vi-phu">đổi thành tháng hiển thị</span>
        </div>
      </div>

      {/* Chưa mở nạp tiền thì nói thẳng là chưa mở, KHÔNG để một nút bấm vào
          không làm gì. Nút hứa hẹn thứ app chưa làm được là thứ bị cấm
          (CLAUDE.md mục 1.2). */}
      {!FLAGS.nap_tien_that && !demoMode && (
        <div className="hop-nhac stack" style={{ gap: 'var(--sp-3)' }}>
          <span>
            Nạp token chưa mở — đang chờ tài khoản ngân hàng nhận tiền. Trong thời
            gian này token được cấp thủ công, anh <Link to="/lien-he">nhắn cho bên em</Link>.
          </span>
          {/* Nút này KHÔNG hứa nạp được tiền. Hộp mở ra hiện đúng bảng giá thật
              và ba cách nạp ở trạng thái "Sắp mở" — không gọi backend, không
              dựng mã QR giả. */}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMoNap(true)}>
            <Eye size={16} strokeWidth={1.8} /> Xem trước màn nạp token
          </button>
        </div>
      )}

      <div className="card card-pad stack" style={{ gap: 0 }}>
        <div className="row" style={{ justifyContent: 'space-between', paddingBottom: 'var(--sp-3)' }}>
          <h2 className="t-h3">Sổ giao dịch</h2>
          {so.items.length > 0 && <Badge tone="neutral">{so.items.length} dòng gần nhất</Badge>}
        </div>

        {so.items.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Chưa có giao dịch nào"
            hint="Mọi lần nạp và mọi lần trừ token đều được ghi lại ở đây, không xoá được."
          />
        ) : (
          <>
            {so.items.map((d) => <DongSo key={d.id} d={d} />)}
            {so.conNua && (
              <button
                type="button"
                className="btn btn-ghost btn-block"
                style={{ marginTop: 'var(--sp-4)' }}
                onClick={taiThem}
                disabled={dangTaiThem}
              >
                {dangTaiThem ? 'Đang tải…' : 'Xem thêm'}
              </button>
            )}
          </>
        )}
      </div>

      <p className="disclaimer">
        Token chỉ dùng để trả phí hiển thị tin đăng. Thuexenhanh không thu hoa hồng,
        không giữ tiền thuê xe — mọi giao dịch thuê xe do hai bên tự thoả thuận.
      </p>

      {moNap && (
        /* `demo` CHỈ bật theo token-demo, không bật theo `!nap_tien_that` nữa.
           Cờ tắt mà cho chạy luồng QR giả trong app thật là dựng một đường
           thanh toán không có thật — giờ 3 nút hiện "Sắp mở". Muốn bấm hết
           luồng thì bật token-demo hoặc mở /thu-luong-06.html. */
        <HopNapToken demo={demoMode} onDong={() => setMoNap(false)} onXong={tai} />
      )}
    </div>
  )
}

