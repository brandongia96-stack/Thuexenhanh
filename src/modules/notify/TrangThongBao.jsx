import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import {
  danhSach, danhDauDaDoc, danhDauTatCaDaDoc, docCaiDat, luuCaiDat, PREFS_MAC_DINH,
} from './notifyApi'
import './notify.css'

const fmtNgay = (iso) =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// Loại liên quan tiền / tài khoản KHÔNG tắt được — hiển thị để chủ xe biết, không cho gạt.
const CAI_DAT = [
  { khoa: 'van_hanh_email', ten: 'Email về tin đăng', mota: 'Tin được duyệt, bị từ chối (kèm lý do), bị báo cáo và tạm ẩn.' },
  { khoa: 'tang_truong_email', ten: 'Email thống kê tuần', mota: 'Số lượt xem, lượt lấy số của xe anh.' },
]

export default function TrangThongBao() {
  const { user } = useAuth()
  const [dong, setDong] = useState(null)
  const [tiep, setTiep] = useState(null)
  const [loi, setLoi] = useState('')
  const [prefs, setPrefs] = useState(PREFS_MAC_DINH)
  const [prefsLoi, setPrefsLoi] = useState('')

  const tai = useCallback(async (cursor = null) => {
    try {
      const kq = await danhSach({ cursor })
      setDong((cu) => (cursor && cu ? [...cu, ...kq.dong] : kq.dong))
      setTiep(kq.tiep)
    } catch {
      setLoi('Không tải được thông báo. Thử lại sau.')
    }
  }, [])

  useEffect(() => { tai() }, [tai])
  useEffect(() => {
    if (!user) return
    docCaiDat(user.id).then(setPrefs).catch(() => setPrefsLoi('Không tải được cài đặt.'))
  }, [user])

  const doc = async (n) => {
    if (n.read_at) return
    setDong((cu) => cu.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)))
    danhDauDaDoc(n.id).catch(() => {})
  }
  const docHet = async () => {
    setDong((cu) => cu.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })))
    danhDauTatCaDaDoc().catch(() => {})
  }
  const gat = async (khoa) => {
    const moi = { ...prefs, [khoa]: !prefs[khoa] }
    setPrefs(moi)
    setPrefsLoi('')
    try { await luuCaiDat(user.id, moi) } catch {
      setPrefs(prefs)
      setPrefsLoi('Lưu cài đặt thất bại.')
    }
  }

  const coChuaDoc = dong?.some((n) => !n.read_at)

  return (
    <div className="page stack">
      <div className="tb-dau">
        <h1 className="t-h1">Thông báo</h1>
        {coChuaDoc && (
          <button className="btn btn-sm" onClick={docHet}>
            <CheckCheck size={16} strokeWidth={2} /> Đánh dấu đã đọc hết
          </button>
        )}
      </div>

      {loi && <div className="t-small" role="alert">{loi}</div>}

      {dong === null && !loi && (
        <div className="stack" aria-busy="true">
          {[0, 1, 2].map((i) => <Skeleton key={i} height={68} radius="var(--r-lg)" />)}
        </div>
      )}

      {dong?.length === 0 && (
        <EmptyState icon={Bell} title="Chưa có thông báo" hint="Nhắc gia hạn, kết quả duyệt tin và biên nhận nạp token sẽ hiện ở đây." />
      )}

      {dong?.length > 0 && (
        <ul className="tb-ds">
          {dong.map((n) => {
            const noiDung = (
              <>
                <span className="tb-cham" aria-hidden={!!n.read_at} data-chua-doc={!n.read_at} />
                <span className="tb-chu">
                  <span className="tb-tieu">{n.title}</span>
                  {n.body && <span className="tb-nd">{n.body}</span>}
                  <span className="t-small">{fmtNgay(n.created_at)}</span>
                </span>
              </>
            )
            return (
              <li key={n.id} className="tb-muc" data-chua-doc={!n.read_at}>
                {n.link
                  ? <Link to={n.link} className="tb-lien-ket" onClick={() => doc(n)}>{noiDung}</Link>
                  : <button className="tb-lien-ket" onClick={() => doc(n)}>{noiDung}</button>}
              </li>
            )
          })}
        </ul>
      )}

      {tiep && <button className="btn" onClick={() => tai(tiep)}>Xem thêm</button>}

      <section className="card card-pad stack">
        <h2 className="t-h2">Cài đặt thông báo</h2>
        {CAI_DAT.map((c) => (
          <label key={c.khoa} className="tb-gat">
            <span>
              <span className="tb-tieu">{c.ten}</span>
              <span className="t-small tb-nd">{c.mota}</span>
            </span>
            <input type="checkbox" checked={!!prefs[c.khoa]} onChange={() => gat(c.khoa)} />
          </label>
        ))}
        <div className="t-small">
          Nhắc gia hạn, thiếu token, biên nhận nạp tiền và thông báo tài khoản luôn được gửi — không tắt được, để anh không mất tin vì quên.
        </div>
        {prefsLoi && <div className="t-small" role="alert">{prefsLoi}</div>}
      </section>
    </div>
  )
}
