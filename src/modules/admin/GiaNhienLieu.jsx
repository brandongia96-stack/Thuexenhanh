// admin/fuel-prices — giá tham chiếu (xăng/dầu) dùng cho bảng tính chi phí.
//
// Xem giá đang áp dụng (reference_price_now, có ngày kiểm tra) và NHẬP TAY khi
// nguồn tự động hỏng. Mỗi lần nhập là một dòng lịch sử mới, không sửa dòng cũ.
// Lệch mã (code) thì khối ước tính ở trang xe tự ẩn không báo lỗi — nên chỉ cho
// chọn hai mã đã chốt trong contracts/api.md mục 2.

import { useState } from 'react'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { formatVnd, formatDate, formatDateTime } from '../../lib/format'
import { giaDangApDung, giaNhienLieu, nhapGiaNhienLieu } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

// Mã đã chốt (CLAUDE.md §0, 01/10). Đừng thêm mã khác mà không báo luồng 05.
const MA_CHOT = {
  xang_ron95: { label: 'Xăng RON 95', unit: 'đ/lít' },
  dau_do: { label: 'Dầu diesel', unit: 'đ/lít' },
}

const homNay = () => {
  const d = new Date()
  const hai = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
}

function Nhap({ taiLai }) {
  const [code, setCode] = useState('xang_ron95')
  const [gia, setGia] = useState('')
  const [nguon, setNguon] = useState('')
  const [url, setUrl] = useState('')
  const [ngay, setNgay] = useState(homNay())
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)
  const meta = MA_CHOT[code]

  async function gui(e) {
    e.preventDefault()
    setDangLam(true); setLoi(null)
    try {
      await nhapGiaNhienLieu({
        code, label: meta.label, unit: meta.unit, price: Number(gia),
        source: nguon, source_url: url, effective_date: ngay,
      })
      setGia(''); setNguon(''); setUrl(''); taiLai()
    } catch (er) { setLoi(thongDiepLoi(er)) } finally { setDangLam(false) }
  }

  return (
    <form className="card ad-item" onSubmit={gui}>
      <div className="t-h3">Nhập giá tay</div>
      <p className="t-small" style={{ margin: 0 }}>Chỉ dùng khi nguồn tự động hỏng. Ghi rõ nguồn — đó là căn cứ để người xem tin tin tưởng con số.</p>
      <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto' }} value={code} onChange={(e) => setCode(e.target.value)} aria-label="Mặt hàng">
          {Object.entries(MA_CHOT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input className="input" style={{ width: 150 }} inputMode="numeric" placeholder="Giá (đ/lít)" value={gia}
          onChange={(e) => setGia(e.target.value.replace(/\D/g, ''))} aria-label="Giá" />
        <input className="input" type="date" value={ngay} onChange={(e) => setNgay(e.target.value)} aria-label="Ngày áp dụng" />
      </div>
      <input className="input" placeholder="Nguồn (ví dụ: Petrolimex vùng 1)" value={nguon} onChange={(e) => setNguon(e.target.value)} aria-label="Nguồn" />
      <input className="input" placeholder="Link nguồn (tuỳ chọn)" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Link nguồn" />
      {loi && <div className="ad-loi" role="alert">{loi}</div>}
      <div><button className="btn btn-primary" disabled={dangLam || !Number(gia) || !nguon.trim()}>Ghi giá</button></div>
    </form>
  )
}

export default function GiaNhienLieu() {
  const now = useTai(() => giaDangApDung())
  const lich = useTai(() => giaNhienLieu())
  const taiLai = () => { now.taiLai(); lich.taiLai() }

  if (now.dangTai && !now.data) return <Skeleton height={160} />
  if (now.loi) return <div className="ad-loi">Không tải được giá: {thongDiepLoi(now.loi)}</div>

  return (
    <div className="stack" style={{ gap: 'var(--sp-4)' }}>
      <section className="card ad-item">
        <div className="t-h3">Đang áp dụng</div>
        {now.data.length === 0 ? (
          <EmptyState title="Chưa có giá tham chiếu nào" hint="Bảng tính chi phí ở trang xe sẽ ẩn dòng xăng/điện cho tới khi có giá." />
        ) : (
          <table className="ad-bang">
            <thead><tr><th>Mặt hàng</th><th className="so">Giá</th><th>Nguồn</th><th>Áp dụng từ</th><th>Kiểm tra lúc</th></tr></thead>
            <tbody>{now.data.map((r) => (
              <tr key={r.code}>
                <td>{r.label}<div className="t-small"><code>{r.code}</code></div></td>
                <td className="so">{formatVnd(r.price)} <span className="t-small">{r.unit}</span></td>
                <td>{r.source}</td>
                <td>{formatDate(r.effective_date)}</td>
                <td className="t-small">{formatDateTime(r.checked_at)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>

      <Nhap taiLai={taiLai} />

      <section className="card ad-item">
        <div className="t-h3">Lịch sử nhập</div>
        {lich.data?.length ? (
          <table className="ad-bang">
            <thead><tr><th>Mã</th><th className="so">Giá</th><th>Nguồn</th><th>Áp dụng từ</th></tr></thead>
            <tbody>{lich.data.map((r) => (
              <tr key={r.id}>
                <td><code>{r.code}</code></td>
                <td className="so">{formatVnd(r.price)}</td>
                <td>{r.source}</td>
                <td>{formatDate(r.effective_date)}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p className="t-small" style={{ margin: 0 }}>Chưa có dòng lịch sử nào.</p>}
      </section>
    </div>
  )
}
