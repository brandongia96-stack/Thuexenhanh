import { useCallback, useEffect, useState } from 'react'
import { Wallet, ReceiptText, Plus } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import EmptyState from '../../../components/EmptyState'
import Badge from '../../../components/Badge'
import { Skeleton } from '../../../components/Loading'
import HopNapToken from '../topup/HopNapToken'
import { soDuVi, soGiaoDich } from '../billingApi'
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
  const [vi, setVi] = useState(null)
  const [so, setSo] = useState({ items: [], conNua: false, cursor: null })
  const [dangTai, setDangTai] = useState(true)
  const [dangTaiThem, setDangTaiThem] = useState(false)
  const [loi, setLoi] = useState(null)
  const [moNap, setMoNap] = useState(false)

  const tai = useCallback(async () => {
    if (!user?.id) return
    setLoi(null)
    try {
      const [b, s] = await Promise.all([soDuVi(user.id), soGiaoDich(user.id)])
      setVi(b)
      setSo(s)
    } catch (e) {
      setLoi(e?.message ?? 'Không tải được ví')
    } finally {
      setDangTai(false)
    }
  }, [user?.id])

  useEffect(() => { tai() }, [tai])

  const taiThem = async () => {
    if (!so.cursor || dangTaiThem) return
    setDangTaiThem(true)
    try {
      const tiep = await soGiaoDich(user.id, { cursor: so.cursor })
      setSo((cu) => ({ ...tiep, items: [...cu.items, ...tiep.items] }))
    } catch (e) {
      setLoi(e?.message ?? 'Không tải thêm được')
    } finally {
      setDangTaiThem(false)
    }
  }

  if (dangDangNhap || dangTai) {
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
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 className="t-h1">Ví token</h1>
        {FLAGS.nap_tien_that && (
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
      {!FLAGS.nap_tien_that && (
        <div className="hop-nhac">
          Nạp token chưa mở. Em bật ngay khi trang <b>Chính sách hoàn token</b> được
          công bố — thu tiền trước khi nói rõ điều kiện hoàn là không sòng phẳng.
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
        <HopNapToken onDong={() => setMoNap(false)} onXong={tai} />
      )}
    </div>
  )
}
