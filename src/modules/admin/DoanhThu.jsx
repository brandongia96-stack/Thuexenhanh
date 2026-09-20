// admin/revenue — doanh thu.
//
// Hai con số này KHÁC NHAU và không bao giờ được cộng dồn hay gọi lẫn:
//   · Token đã TIÊU  = DOANH THU (chủ xe đã trả phí hiển thị)
//   · Token chưa tiêu = NỢ PHẢI TRẢ (tiền chủ xe đã nạp, mình chưa cung cấp dịch vụ)
// Tiền nạp trong kỳ KHÔNG phải doanh thu.

import { useState } from 'react'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { formatVnd, formatTokens } from '../../lib/format'
import { TOKEN_VND } from '../../lib/config'
import { doanhThu } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

// Ngày theo GIỜ ĐỊA PHƯƠNG. toISOString() đổi sang UTC, ở UTC+7 sẽ lùi mất một ngày.
const hai = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
const KY = {
  thang_nay: () => { const n = new Date(); return [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(new Date(n.getFullYear(), n.getMonth() + 1, 1))] },
  thang_truoc: () => { const n = new Date(); return [iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)), iso(new Date(n.getFullYear(), n.getMonth(), 1))] },
  '30_ngay': () => { const n = new Date(); return [iso(new Date(n.getTime() - 30 * 86_400_000)), iso(new Date(n.getTime() + 86_400_000))] },
}
const NHAN_KY = { thang_nay: 'Tháng này', thang_truoc: 'Tháng trước', '30_ngay': '30 ngày qua' }

function O({ nhan, so, phu, tone }) {
  return (
    <div className="card ad-ov" style={tone === 'no' ? { background: 'var(--m-amber-bg)' } : undefined}>
      <div className="t-small">{nhan}</div>
      <div className="ad-so-lon">{so}</div>
      {phu && <div className="t-small">{phu}</div>}
    </div>
  )
}

export default function DoanhThu() {
  const [ky, setKy] = useState('thang_nay')
  const [tu, den] = KY[ky]()
  const { data: d, loi, dangTai } = useTai(() => doanhThu(tu, den), [tu, den])

  return (
    <div className="stack" style={{ gap: 'var(--sp-4)' }}>
      <div className="ad-tabs" style={{ marginBottom: 0 }} role="group" aria-label="Kỳ báo cáo">
        {Object.keys(KY).map((k) => (
          <button key={k} className={`ad-tab${k === ky ? ' active' : ''}`} onClick={() => setKy(k)}>{NHAN_KY[k]}</button>
        ))}
      </div>

      {dangTai && !d ? <Skeleton height={180} /> : loi ? (
        <div className="ad-loi">Không tải được doanh thu: {thongDiepLoi(loi)}</div>
      ) : (
        <>
          <div className="ad-luoi">
            <O nhan="Doanh thu (token đã tiêu)" so={formatVnd(d.vnd_doanh_thu_ky)} phu={formatTokens(d.token_tieu_ky)} />
            <O nhan="Nợ token (đã nạp, chưa tiêu)" so={formatVnd(d.vnd_no_token)} phu={`${formatTokens(d.no_token)} · toàn hệ thống, không theo kỳ`} tone="no" />
            <O nhan="Tiền nạp trong kỳ" so={formatVnd(d.vnd_nap_ky)} phu={`${formatTokens(d.token_nap_ky)} · chưa phải doanh thu`} />
            <O nhan="Chủ xe đã trả phí" so={d.chu_xe_tra_tien} phu="số chủ xe khác nhau trong kỳ" />
            {d.ty_le_gia_han != null && (
              <O nhan="Tỷ lệ gia hạn" so={`${Math.round(d.ty_le_gia_han * 100)}%`}
                phu={`${d.gia_han_da_gia_han}/${d.gia_han_mau} khoản phí hết hạn trong kỳ đã được gia hạn`} />
            )}
          </div>

          <section className="card ad-item">
            <div className="t-h3">Doanh thu theo tỉnh</div>
            {d.theo_tinh.length === 0 ? (
              <EmptyState title="Chưa có khoản thu nào trong kỳ này" />
            ) : (
              <table className="ad-bang">
                <thead><tr><th>Tỉnh</th><th className="so">Token</th><th className="so">Doanh thu</th></tr></thead>
                <tbody>
                  {d.theo_tinh.map((t) => (
                    <tr key={t.province_id}>
                      <td>{t.ten}</td>
                      <td className="so">{t.token}</td>
                      <td className="so">{formatVnd(t.token * TOKEN_VND)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}
