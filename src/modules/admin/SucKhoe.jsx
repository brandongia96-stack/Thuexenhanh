// admin/health + báo cáo — sức khoẻ hệ thống và tin bị báo cáo.
//
// Lượt xem / lấy số đọc từ bảng gộp theo ngày (HIEU-NANG.md 2.4). Bảng đó được
// gộp mỗi đêm nên KHÔNG có số của hôm nay — nói rõ ra thay vì để admin tưởng
// hôm nay không ai xem.

import { useState } from 'react'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { formatDate, timeAgo } from '../../lib/format'
import { sucKhoeHeThong, baoCaoChuaXuLy, xuLyBaoCao } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

function BaoCao({ bc, taiLai }) {
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)
  async function xuLy(status) {
    setDangLam(true); setLoi(null)
    try { await xuLyBaoCao(bc.id, status, null); taiLai() } catch (e) { setLoi(thongDiepLoi(e)); setDangLam(false) }
  }
  return (
    <div className="card ad-item">
      <div>
        <b>{bc.listing ? `${bc.listing.brand_text} ${bc.listing.model_text}` : 'Tin không còn'}</b>{' '}
        <span className="t-small">· {bc.reason_code} · {timeAgo(bc.created_at)}</span>
      </div>
      {bc.detail && <p className="t-body" style={{ margin: 0 }}>{bc.detail}</p>}
      {loi && <div className="ad-loi" role="alert">{loi}</div>}
      <div className="ad-hanh-dong">
        <button className="btn btn-primary btn-sm" disabled={dangLam} onClick={() => xuLy('da_xu_ly')}>Đã xử lý</button>
        <button className="btn btn-ghost btn-sm" disabled={dangLam} onClick={() => xuLy('bo_qua')}>Bỏ qua</button>
      </div>
    </div>
  )
}

export default function SucKhoe() {
  const sk = useTai(() => sucKhoeHeThong(14), [])
  const bc = useTai(() => baoCaoChuaXuLy(), [])
  const d = sk.data
  const toiDa = d ? Math.max(1, ...d.theo_ngay.map((n) => n.xem)) : 1

  return (
    <div className="stack" style={{ gap: 'var(--sp-4)' }}>
      {sk.dangTai && !d ? <Skeleton height={160} /> : sk.loi ? (
        <div className="ad-loi">Không tải được số liệu: {thongDiepLoi(sk.loi)}</div>
      ) : (
        <>
          <div className="ad-luoi">
            <div className="card ad-ov"><div className="t-small">Tin chờ duyệt</div><div className="ad-so-lon">{d.tin_cho_duyet}</div></div>
            <div className="card ad-ov"><div className="t-small">Báo cáo chưa xử lý</div><div className="ad-so-lon">{d.bao_cao_chua_xu_ly}</div></div>
          </div>

          <section className="card ad-item">
            <div className="t-h3">Tin đang hiển thị theo tỉnh</div>
            {d.theo_tinh.length === 0 ? <EmptyState title="Chưa có tin nào đang hiển thị" /> : (
              <table className="ad-bang">
                <tbody>{d.theo_tinh.map((t) => (
                  <tr key={t.province_id ?? 'x'}><td>{t.ten}</td><td className="so">{t.so_tin}</td></tr>
                ))}</tbody>
              </table>
            )}
          </section>

          <section className="card ad-item">
            <div className="t-h3">Lượt xem &amp; lấy số — 14 ngày qua</div>
            <p className="t-small" style={{ margin: 0 }}>Số liệu được gộp mỗi đêm, nên chưa có số của hôm nay.</p>
            {d.theo_ngay.length === 0 ? <EmptyState title="Chưa có số liệu" /> : (
              <table className="ad-bang">
                <thead><tr><th>Ngày</th><th>Lượt xem</th><th className="so">Xem</th><th className="so">Lấy số</th></tr></thead>
                <tbody>{d.theo_ngay.map((n) => (
                  <tr key={n.day}>
                    <td>{formatDate(n.day)}</td>
                    <td style={{ width: '40%' }}><div className="ad-thanh"><span style={{ width: `${(n.xem / toiDa) * 100}%` }} /></div></td>
                    <td className="so">{n.xem}</td><td className="so">{n.lay_so}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </section>
        </>
      )}

      <section className="stack" style={{ gap: 'var(--sp-3)' }}>
        <div className="t-h3">Tin bị báo cáo</div>
        {bc.dangTai && !bc.data ? <Skeleton height={80} /> : bc.loi ? (
          <div className="ad-loi">Không tải được báo cáo.</div>
        ) : bc.data.length === 0 ? (
          <EmptyState title="Không có báo cáo nào đang chờ" />
        ) : (
          bc.data.map((b) => <BaoCao key={b.id} bc={b} taiLai={() => { bc.taiLai(); sk.taiLai() }} />)
        )}
      </section>
    </div>
  )
}
