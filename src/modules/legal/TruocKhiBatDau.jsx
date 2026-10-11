import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { docDongY, dongYHopLe, ghiDongY } from './dongY'
import { VAN_BAN, THAY_DOI } from './phienBan'

// Trên các trang này KHÔNG chặn: người dùng phải đọc được văn bản trước khi tick.
const TRANG_DOC = ['/dieu-khoan', '/quy-che', '/bao-mat', '/hoan-token', '/khieu-nai',
  '/thue', '/an-toan', '/mau-hop-dong', '/gioi-thieu', '/tro-giup', '/lien-he']

/**
 * Màn "Trước khi bắt đầu" — thay cho việc tự ghi đồng ý lúc đăng nhập.
 *
 * Luật (tài liệu pháp lý CEO, contracts/api.md §3e):
 *   · Các ô KHÔNG tick sẵn. Người dùng tự tick từng ô.
 *   · Mỗi ô = một hoặc nhiều dòng `user_consents` có phiên bản + thời điểm.
 *   · Đổi phiên bản văn bản → hiện lại, kèm "Có gì thay đổi".
 *   · "Nhận khuyến mại" là TUỲ CHỌN, không được gộp vào ô bắt buộc.
 *
 * Chỉ hiện khi đã đăng nhập VÀ còn mục bắt buộc chưa hợp lệ. Không đọc được
 * dữ liệu (mạng hỏng) → không hiện gì, không chặn người dùng.
 */
export default function TruocKhiBatDau() {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()
  const [tt, setTt] = useState(null)
  const [tickDieuKhoan, setTickDieuKhoan] = useState(false)
  const [tickBaoMat, setTickBaoMat] = useState(false)
  const [tick18, setTick18] = useState(false)
  const [tickKhuyenMai, setTickKhuyenMai] = useState(false)
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState(null)

  const userId = user?.id
  useEffect(() => {
    setTt(null)
    if (!userId) return
    let huy = false
    docDongY(userId).then((m) => { if (!huy) setTt(m) })
    return () => { huy = true }
  }, [userId])

  if (!userId || !tt || TRANG_DOC.includes(pathname)) return null

  const canDieuKhoan = !dongYHopLe(tt, 'terms') || !dongYHopLe(tt, 'operation')
  const canBaoMat = !dongYHopLe(tt, 'privacy')
  const can18 = !dongYHopLe(tt, 'age_18')
  if (!canDieuKhoan && !canBaoMat && !can18) return null

  // "Có gì thay đổi": chỉ cho người ĐÃ đồng ý một bản cũ của văn bản đó.
  const daTungDongY = (d) => tt.get(d)?.granted === true
  const thayDoi = []
  if (canDieuKhoan) {
    if (daTungDongY('terms') && !dongYHopLe(tt, 'terms')) thayDoi.push(['Điều khoản sử dụng', THAY_DOI.terms])
    if (daTungDongY('operation') && !dongYHopLe(tt, 'operation')) thayDoi.push(['Quy chế hoạt động', THAY_DOI.operation])
  }
  if (canBaoMat && daTungDongY('privacy')) thayDoi.push(['Chính sách bảo vệ dữ liệu cá nhân', THAY_DOI.privacy])

  const hoiKhuyenMai = !tt.has('marketing')
  const duDieuKien =
    (!canDieuKhoan || tickDieuKhoan) && (!canBaoMat || tickBaoMat) && (!can18 || tick18)

  async function tiepTuc() {
    if (!duDieuKien || dangLuu) return
    setDangLuu(true)
    setLoi(null)
    try {
      const muc = []
      if (canDieuKhoan) {
        if (!dongYHopLe(tt, 'terms')) muc.push({ document: 'terms', granted: true })
        if (!dongYHopLe(tt, 'operation')) muc.push({ document: 'operation', granted: true })
      }
      if (canBaoMat) muc.push({ document: 'privacy', granted: true })
      if (can18) muc.push({ document: 'age_18', granted: true })
      // Ghi cả lựa chọn "không" để lần sau không hỏi lại một việc tuỳ chọn.
      if (hoiKhuyenMai) muc.push({ document: 'marketing', granted: tickKhuyenMai })
      await ghiDongY(userId, muc)
      setTt(await docDongY(userId))
    } catch (e) {
      setLoi(e?.message || 'Chưa lưu được. Bạn thử lại giúp chúng tôi.')
    } finally {
      setDangLuu(false)
    }
  }

  const o = { alignItems: 'flex-start', gap: 'var(--sp-2)' }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tkbd-tieu-de"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, overflowY: 'auto',
        background: 'color-mix(in srgb, var(--m-dark) 55%, transparent)',
        display: 'grid', placeItems: 'center', padding: 'var(--sp-4)',
      }}
    >
      <div className="card card-pad stack" style={{ maxWidth: 480, width: '100%' }}>
        <div className="row" style={{ gap: 'var(--sp-2)', alignItems: 'center' }}>
          <ShieldCheck size={22} strokeWidth={1.8} style={{ color: 'var(--m-green)' }} />
          <h2 id="tkbd-tieu-de" className="t-h2" style={{ margin: 0 }}>Trước khi bắt đầu</h2>
        </div>
        <p className="t-small">
          Vui lòng đọc và xác nhận từng mục. Chúng tôi không tick sẵn thay bạn.
        </p>

        {thayDoi.length > 0 && (
          <div className="disclaimer">
            <b>Có gì thay đổi</b>
            <ul style={{ paddingLeft: '1.2em', marginTop: 4 }}>
              {thayDoi.map(([ten, nd]) => <li key={ten}><b>{ten}:</b> {nd}</li>)}
            </ul>
          </div>
        )}

        {canDieuKhoan && (
          <label className="row t-small" style={o}>
            <input type="checkbox" checked={tickDieuKhoan} style={{ marginTop: 3 }}
              onChange={(e) => setTickDieuKhoan(e.target.checked)} />
            <span>
              Tôi đã đọc và đồng ý với{' '}
              <Link to="/dieu-khoan" target="_blank">Điều khoản sử dụng</Link> (phiên bản {VAN_BAN.terms.phienBan}) và{' '}
              <Link to="/quy-che" target="_blank">Quy chế hoạt động</Link> (phiên bản {VAN_BAN.operation.phienBan}).
              <b> Bắt buộc.</b>
            </span>
          </label>
        )}

        {canBaoMat && (
          <label className="row t-small" style={o}>
            <input type="checkbox" checked={tickBaoMat} style={{ marginTop: 3 }}
              onChange={(e) => setTickBaoMat(e.target.checked)} />
            <span>
              Tôi đã đọc và đồng ý để Thuê Xe Nhanh xử lý dữ liệu cá nhân của tôi theo{' '}
              <Link to="/bao-mat" target="_blank">Chính sách bảo vệ dữ liệu cá nhân</Link> (phiên bản {VAN_BAN.privacy.phienBan}),
              gồm việc lưu dữ liệu ở máy chủ ngoài Việt Nam.
              <b> Bắt buộc.</b>
            </span>
          </label>
        )}

        {can18 && (
          <label className="row t-small" style={o}>
            <input type="checkbox" checked={tick18} style={{ marginTop: 3 }}
              onChange={(e) => setTick18(e.target.checked)} />
            <span>Tôi xác nhận mình <b>đủ 18 tuổi</b>. <b>Bắt buộc.</b></span>
          </label>
        )}

        {hoiKhuyenMai && (
          <label className="row t-small" style={o}>
            <input type="checkbox" checked={tickKhuyenMai} style={{ marginTop: 3 }}
              onChange={(e) => setTickKhuyenMai(e.target.checked)} />
            <span>
              Tôi muốn nhận thông tin khuyến mại. <i>Tuỳ chọn</i> — không tick vẫn dùng đầy đủ,
              và bạn đổi ý được bất cứ lúc nào trong Tài khoản.
            </span>
          </label>
        )}

        {loi && <p className="field-error">{loi}</p>}

        <button className="btn btn-primary btn-block" disabled={!duDieuKien || dangLuu} onClick={tiepTuc}>
          {dangLuu ? 'Đang lưu…' : 'Tiếp tục'}
        </button>
        <button className="btn btn-ghost btn-block" disabled={dangLuu} onClick={signOut}>
          Không đồng ý — đăng xuất
        </button>
      </div>
    </div>
  )
}
