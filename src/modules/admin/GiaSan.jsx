// admin/price-floors — sửa giá sàn theo số chỗ (bảng price_floors).
// Sàn = dòng có số chỗ lớn nhất ≤ số chỗ xe. Server (trigger 0021) chặn tin dưới sàn.

import { useState } from 'react'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { formatVnd, formatDateTime } from '../../lib/format'
import { giaSan, suaGiaSan } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

function Dong({ row, taiLai }) {
  const [gia, setGia] = useState(String(row.min_price_per_day))
  const [note, setNote] = useState(row.note ?? '')
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)
  const doi = gia !== String(row.min_price_per_day) || note !== (row.note ?? '')

  async function luu() {
    setDangLam(true); setLoi(null)
    try {
      await suaGiaSan({ seats: row.seats, minPricePerDay: Number(gia), note })
      taiLai()
    } catch (e) { setLoi(thongDiepLoi(e)) } finally { setDangLam(false) }
  }

  return (
    <tr>
      <td>{row.seats} chỗ</td>
      <td>
        <input className="input" style={{ width: 140 }} inputMode="numeric" value={gia}
          onChange={(e) => setGia(e.target.value.replace(/\D/g, ''))} aria-label={`Giá sàn ${row.seats} chỗ`} />
        <div className="t-small">{formatVnd(Number(gia) || 0)} / ngày</div>
      </td>
      <td><input className="input" value={note} onChange={(e) => setNote(e.target.value)} aria-label={`Ghi chú ${row.seats} chỗ`} /></td>
      <td>
        <button className="btn btn-sm btn-primary" disabled={!doi || dangLam || !Number(gia)} onClick={luu}>Lưu</button>
        {loi && <div className="ad-loi" role="alert">{loi}</div>}
      </td>
      <td className="t-small">{formatDateTime(row.updated_at)}</td>
    </tr>
  )
}

export default function GiaSan() {
  const { data, loi, dangTai, taiLai } = useTai(() => giaSan())
  const [seats, setSeats] = useState('')
  const [gia, setGia] = useState('')
  const [note, setNote] = useState('')
  const [dangLam, setDangLam] = useState(false)
  const [loiThem, setLoiThem] = useState(null)

  async function them(e) {
    e.preventDefault()
    setDangLam(true); setLoiThem(null)
    try {
      await suaGiaSan({ seats: Number(seats), minPricePerDay: Number(gia), note })
      setSeats(''); setGia(''); setNote(''); taiLai()
    } catch (er) { setLoiThem(thongDiepLoi(er)) } finally { setDangLam(false) }
  }

  if (dangTai && !data) return <Skeleton height={200} />
  if (loi) return <div className="ad-loi">Không tải được giá sàn: {thongDiepLoi(loi)}</div>

  return (
    <div className="stack" style={{ gap: 'var(--sp-4)' }}>
      <p className="t-small" style={{ margin: 0 }}>
        Tin xe dưới giá sàn của số chỗ tương ứng sẽ không gửi duyệt được. Sàn áp dụng theo dòng có số chỗ lớn nhất ≤ số chỗ của xe.
      </p>
      {data.length === 0 ? <EmptyState title="Chưa có mức giá sàn nào" /> : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="ad-bang">
            <thead><tr><th>Số chỗ</th><th>Giá sàn / ngày</th><th>Ghi chú</th><th /><th>Cập nhật</th></tr></thead>
            <tbody>{data.map((r) => <Dong key={r.seats} row={r} taiLai={taiLai} />)}</tbody>
          </table>
        </div>
      )}

      <form className="card ad-item" onSubmit={them}>
        <div className="t-h3">Thêm hoặc sửa một mức</div>
        <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <input className="input" style={{ width: 110 }} inputMode="numeric" placeholder="Số chỗ (2–50)" value={seats}
            onChange={(e) => setSeats(e.target.value.replace(/\D/g, ''))} aria-label="Số chỗ" />
          <input className="input" style={{ width: 160 }} inputMode="numeric" placeholder="Giá sàn / ngày" value={gia}
            onChange={(e) => setGia(e.target.value.replace(/\D/g, ''))} aria-label="Giá sàn" />
          <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Ghi chú (tuỳ chọn)" value={note}
            onChange={(e) => setNote(e.target.value)} aria-label="Ghi chú giá sàn" />
        </div>
        {loiThem && <div className="ad-loi" role="alert">{loiThem}</div>}
        <div><button className="btn btn-primary" disabled={dangLam || !seats || !gia}>Lưu mức giá</button></div>
      </form>
    </div>
  )
}
