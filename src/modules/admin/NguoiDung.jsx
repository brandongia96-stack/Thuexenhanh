// admin/users + admin/wallet-ops — tìm người dùng, xem tin/ví/nhật ký,
// khoá/mở khoá, xét tích xanh, cộng/trừ/hoàn token tay.
//
// Mọi thao tác thay đổi đều BẮT BUỘC ghi lý do (server cũng chặn nếu thiếu).
// Không sửa số dư: điều chỉnh ví = ghi thêm MỘT dòng vào sổ chỉ-ghi-thêm.

import { useState } from 'react'
import { Search, Lock, LockOpen } from 'lucide-react'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { formatDateTime, formatPhone, formatTokens } from '../../lib/format'
import {
  timNguoiDung, choXetTichXanh, tinCuaNguoiDung, nhatKyDoiTuong, viCuaNguoiDung,
  khoaNguoiDung, moKhoaNguoiDung, xetTichXanh, dieuChinhVi,
} from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

const NHAN_LOAI = { nap: 'Nạp', tieu: 'Tiêu', hoan: 'Hoàn', thu_hoi: 'Thu hồi', tang: 'Tặng' }
const NHAN_HANH_DONG = {
  moderate_listing: 'Duyệt / từ chối tin', lock_user: 'Khoá người dùng', unlock_user: 'Mở khoá',
  set_verified: 'Xét tích xanh', adjust_wallet: 'Điều chỉnh ví', handle_report: 'Xử lý báo cáo',
}
const NHAN_XAC_MINH = {
  chua_gui: 'Chưa gửi giấy tờ', cho_xet: 'Chờ xét', da_xac_minh: 'Đã xác minh', tu_choi: 'Bị từ chối',
}

// Một form nhỏ có ô lý do. Dùng chung cho khoá / tích xanh / ví.
function useThaoTac(sauKhiXong) {
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)
  async function chay(fn) {
    setDangLam(true); setLoi(null)
    try { await fn(); sauKhiXong?.() } catch (e) { setLoi(thongDiepLoi(e)) } finally { setDangLam(false) }
  }
  return { dangLam, loi, chay }
}

function KhoaVaTichXanh({ user, taiLai }) {
  const [lyDo, setLyDo] = useState('')
  const { dangLam, loi, chay } = useThaoTac(() => { setLyDo(''); taiLai() })
  const khoa = !!user.deleted_at
  const hopLe = lyDo.trim().length >= 5

  return (
    <div className="stack" style={{ gap: 'var(--sp-2)' }}>
      <label className="field-label" htmlFor="ad-ly-do">Lý do (bắt buộc, được ghi vào nhật ký)</label>
      <input id="ad-ly-do" className="input" value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
      {loi && <div className="ad-loi" role="alert">{loi}</div>}
      <div className="ad-hanh-dong">
        <button className={khoa ? 'btn btn-soft' : 'btn btn-danger'} disabled={dangLam || !hopLe}
          onClick={() => chay(() => (khoa ? moKhoaNguoiDung(user.id, lyDo.trim()) : khoaNguoiDung(user.id, lyDo.trim())))}>
          {khoa ? <LockOpen size={16} strokeWidth={2} /> : <Lock size={16} strokeWidth={2} />}
          {khoa ? 'Mở khoá' : 'Khoá & ẩn tin'}
        </button>
        {user.verify_status !== 'da_xac_minh' && (
          <button className="btn btn-primary" disabled={dangLam}
            onClick={() => chay(() => xetTichXanh(user.id, 'da_xac_minh', null))}>Cấp tích xanh</button>
        )}
        {user.verify_status !== 'tu_choi' && (
          <button className="btn btn-ghost" disabled={dangLam || !hopLe}
            onClick={() => chay(() => xetTichXanh(user.id, 'tu_choi', lyDo.trim()))}>Từ chối giấy tờ</button>
        )}
      </div>
      <p className="t-small" style={{ margin: 0 }}>
        Tích xanh xét theo giấy tờ, miễn phí. Giấy tờ nằm ở Storage bucket <code>verify-docs</code> —
        chưa có màn xem trong app.
      </p>
    </div>
  )
}

function ViTay({ user }) {
  const { data, loi, dangTai, taiLai } = useTai(() => viCuaNguoiDung(user.id), [user.id])
  const [kind, setKind] = useState('tang')
  const [tokens, setTokens] = useState('')
  const [lyDo, setLyDo] = useState('')
  // Khoá idempotent giữ nguyên cho tới khi thành công: bấm đúp = một dòng sổ.
  const [idem, setIdem] = useState(() => crypto.randomUUID())
  const { dangLam, loi: loiGhi, chay } = useThaoTac(() => {
    setTokens(''); setLyDo(''); setIdem(crypto.randomUUID()); taiLai()
  })
  const soToken = Number(tokens)
  const hopLe = Number.isInteger(soToken) && soToken > 0 && lyDo.trim().length >= 5

  if (dangTai && !data) return <Skeleton height={120} />
  if (loi) return <div className="ad-loi">Không tải được ví: {thongDiepLoi(loi)}</div>

  const { so_du: bal, so_giao_dich: ds } = data
  return (
    <div className="stack" style={{ gap: 'var(--sp-3)' }}>
      {bal ? (
        <div className="ad-luoi">
          <div><div className="t-small">Số dư</div><div className="ad-so-lon">{formatTokens(bal.so_du)}</div></div>
          <div><div className="t-small">Đã nạp / tặng</div><div className="t-h3">{formatTokens(bal.token_da_nap)}</div></div>
          <div><div className="t-small">Đã tiêu</div><div className="t-h3">{formatTokens(bal.token_da_tieu)}</div></div>
        </div>
      ) : (
        <p className="t-small" style={{ margin: 0 }}>Người này chưa có ví.</p>
      )}

      <form className="stack" style={{ gap: 'var(--sp-2)' }}
        onSubmit={(e) => { e.preventDefault(); if (hopLe) chay(() => dieuChinhVi({ userId: user.id, kind, tokens: soToken, reason: lyDo.trim(), idemKey: idem })) }}>
        <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <select className="input" style={{ width: 'auto' }} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Loại điều chỉnh">
            <option value="tang">Tặng token</option>
            <option value="hoan">Hoàn token</option>
            <option value="thu_hoi">Thu hồi token</option>
          </select>
          <input className="input" style={{ width: 120 }} inputMode="numeric" placeholder="Số token"
            value={tokens} onChange={(e) => setTokens(e.target.value.replace(/\D/g, ''))} aria-label="Số token" />
        </div>
        <input className="input" placeholder="Lý do (bắt buộc)" value={lyDo} onChange={(e) => setLyDo(e.target.value)} aria-label="Lý do điều chỉnh ví" />
        {loiGhi && <div className="ad-loi" role="alert">{loiGhi}</div>}
        <div><button className="btn btn-primary" disabled={dangLam || !hopLe}>Ghi vào sổ</button></div>
      </form>

      {ds.length > 0 && (
        <table className="ad-bang">
          <thead><tr><th>Lúc</th><th>Loại</th><th className="so">Token</th><th className="so">Số dư sau</th></tr></thead>
          <tbody>
            {ds.map((t) => (
              <tr key={t.id}>
                <td>{formatDateTime(t.created_at)}<div className="t-small">{t.note}</div></td>
                <td>{NHAN_LOAI[t.kind] ?? t.kind}</td>
                <td className="so">{t.amount > 0 ? '+' : ''}{t.amount}</td>
                <td className="so">{t.so_du_sau}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ChiTiet({ user, laAdmin, taiLaiDs }) {
  const tin = useTai(() => tinCuaNguoiDung(user.id), [user.id])
  const nhatKy = useTai(() => nhatKyDoiTuong(user.id), [user.id])
  const lam = () => { taiLaiDs(); nhatKy.taiLai(); tin.taiLai() }

  return (
    <div className="card ad-item">
      <div>
        <div className="t-h3">{user.full_name || 'Chưa đặt tên'}</div>
        <div className="t-small">{formatPhone(user.phone) ?? 'Chưa có SĐT'} · {user.email ?? 'Chưa có email'}</div>
        <div className="row" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
          <Badge tone={user.verify_status === 'da_xac_minh' ? 'verified' : 'neutral'}>{NHAN_XAC_MINH[user.verify_status]}</Badge>
          {user.deleted_at && <Badge tone="danger">Đã khoá</Badge>}
        </div>
      </div>

      {laAdmin && <KhoaVaTichXanh user={user} taiLai={lam} />}

      <div>
        <div className="t-h3">Tin đăng</div>
        {tin.data?.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {tin.data.map((t) => <li key={t.id}>{t.brand_text} {t.model_text} — <span className="t-small">{t.status}</span></li>)}
          </ul>
        ) : <p className="t-small" style={{ margin: 0 }}>Chưa có tin nào.</p>}
      </div>

      {laAdmin && (<div><div className="t-h3">Ví token</div><ViTay user={user} /></div>)}

      {nhatKy.data?.length > 0 && (
        <div>
          <div className="t-h3">Nhật ký thao tác</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {nhatKy.data.map((a) => (
              <li key={a.id} className="t-small">
                {formatDateTime(a.created_at)} · {NHAN_HANH_DONG[a.action] ?? a.action}
                {a.after_data?.reason ? ` — ${a.after_data.reason}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function NguoiDung({ laAdmin = true }) {
  const [tuKhoa, setTuKhoa] = useState('')
  const [dangTim, setDangTim] = useState('')
  const [chon, setChon] = useState(null)
  const ds = useTai(() => timNguoiDung(dangTim), [dangTim])
  const cho = useTai(() => choXetTichXanh(), [])

  const ketQua = ds.data?.items ?? []
  // Sau thao tác, tải lại danh sách và làm tươi bản ghi đang chọn.
  const taiLaiDs = () => { ds.taiLai(); cho.taiLai() }
  const dangChon = ketQua.find((u) => u.id === chon?.id) ?? chon

  return (
    <div className="ad-2cot">
      <div className="stack" style={{ gap: 'var(--sp-3)' }}>
        <form className="row" style={{ gap: 'var(--sp-2)' }} onSubmit={(e) => { e.preventDefault(); setDangTim(tuKhoa) }}>
          <input className="input" placeholder="SĐT, email hoặc tên" value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} aria-label="Tìm người dùng" />
          <button className="btn btn-primary" aria-label="Tìm"><Search size={16} strokeWidth={2} /></button>
        </form>

        {cho.data?.length > 0 && (
          <div className="card ad-item">
            <div className="t-h3">Chờ xét tích xanh ({cho.data.length})</div>
            {cho.data.map((u) => (
              <button key={u.id} className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => setChon(u)}>
                {u.full_name || formatPhone(u.phone) || u.email}
              </button>
            ))}
          </div>
        )}

        {ds.dangTai && !ds.data ? <Skeleton height={160} /> : ds.loi ? (
          <div className="ad-loi">Không tải được danh sách.</div>
        ) : ketQua.length === 0 ? (
          <EmptyState title="Không tìm thấy người dùng nào" />
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="ad-bang">
              <tbody>
                {ketQua.map((u) => (
                  <tr key={u.id} className={dangChon?.id === u.id ? 'chon' : ''}>
                    <td>
                      <button className="btn btn-sm btn-ghost" onClick={() => setChon(u)} style={{ width: '100%', justifyContent: 'flex-start' }}>
                        {u.full_name || formatPhone(u.phone) || u.email || u.id.slice(0, 8)}
                        {u.deleted_at && ' 🔒'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dangChon
        ? <ChiTiet key={dangChon.id} user={dangChon} laAdmin={laAdmin} taiLaiDs={taiLaiDs} />
        : <EmptyState title="Chọn một người dùng để xem chi tiết" />}
    </div>
  )
}
