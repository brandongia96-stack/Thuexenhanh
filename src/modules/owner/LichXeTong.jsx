import { useEffect, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { danhSachXeCuaToi } from './ownerApi'
import { getSupabase } from '../../lib/supabase'
import { Skeleton } from '../../components/Loading'
import './LichXeTong.css'

// Helper tạo lịch tháng
function layNgayTrongThang(nam, thang) {
  const soNgay = new Date(nam, thang, 0).getDate()
  return Array.from({ length: soNgay }, (_, i) => new Date(nam, thang - 1, i + 1))
}

export default function LichXeTong() {
  const { user } = useAuth()
  const [xe, setXe] = useState([])
  const [dangTai, setDangTai] = useState(true)
  const [thangHienTai, setThangHienTai] = useState(new Date())
  // { [listing_id]: [{ tu: 'YYYY-MM-DD', den: 'YYYY-MM-DD' }] } — ngày chủ xe TỰ CHẶN
  // trong từng tin (bảng listing_blocked_dates). Không có booking nên đây là
  // nguồn duy nhất; cấm bịa ngày bận.
  const [lichBan, setLichBan] = useState({})

  useEffect(() => {
    if (!user) return
    let huy = false
    ;(async () => {
      try {
        const res = await danhSachXeCuaToi(user.id, { limit: 20 })
        if (huy) return
        setXe(res)
        const ids = res.map((x) => x.id)
        if (!ids.length) return
        const sb = await getSupabase()
        const { data, error } = await sb
          .from('listing_blocked_dates')
          .select('listing_id, date_from, date_to')
          .in('listing_id', ids)
          .is('deleted_at', null)
        if (error) throw error
        const theoXe = {}
        for (const d of data ?? []) {
          ;(theoXe[d.listing_id] ??= []).push({ tu: d.date_from, den: d.date_to })
        }
        if (!huy) setLichBan(theoXe)
      } catch {
        /* lỗi mạng: hiện lịch trống thay vì vỡ trang */
      } finally {
        if (!huy) setDangTai(false)
      }
    })()
    return () => { huy = true }
  }, [user])

  const nam = thangHienTai.getFullYear()
  const thang = thangHienTai.getMonth() + 1
  const danhSachNgay = layNgayTrongThang(nam, thang)
  
  const homNay = new Date()
  const laThangNay = homNay.getMonth() === thang - 1 && homNay.getFullYear() === nam

  function chuyenThang(delta) {
    const d = new Date(thangHienTai)
    d.setMonth(d.getMonth() + delta)
    setThangHienTai(d)
  }

  if (dangTai) return <div className="page"><Skeleton height={400} /></div>

  return (
    <div className="page lich-page stack">
      <div className="lich-header row">
        <h1 className="t-h1"><Calendar size={28} /> Lịch xe tổng</h1>
        <div className="lich-controls row">
          <button className="btn btn-ghost" onClick={() => chuyenThang(-1)}><ChevronLeft size={20} /></button>
          <span className="lich-thang">Tháng {thang} / {nam}</span>
          <button className="btn btn-ghost" onClick={() => chuyenThang(1)}><ChevronRight size={20} /></button>
        </div>
      </div>
      
      <p style={{ color: 'var(--m-subtle)' }}>Ô tô màu là ngày anh đã chặn trong tin. Muốn đổi thì vào sửa từng tin.</p>

      <div className="lich-bang-wrap">
        <table className="lich-bang">
          <thead>
            <tr>
              <th className="lich-th-xe">Danh sách xe ({xe.length})</th>
              {danhSachNgay.map(ngay => {
                const laHomNay = laThangNay && ngay.getDate() === homNay.getDate()
                return (
                  <th key={ngay.getDate()} className={`lich-th-ngay ${laHomNay ? 'hom-nay' : ''}`}>
                    <div className="ngay-thu">{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][ngay.getDay()]}</div>
                    <div className="ngay-so">{ngay.getDate()}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {xe.map(x => (
              <tr key={x.id}>
                <td className="lich-td-xe">
                  <div className="lich-xe-info">
                    {x.cover_thumb && <img src={x.cover_thumb} alt="" width={40} height={40} />}
                    <div className="lich-xe-ten">
                      <strong>{x.brand_text} {x.model_text} {x.year}</strong>
                    </div>
                  </div>
                </td>
                {danhSachNgay.map(ngay => {
                  const dayNum = ngay.getDate()
                  const khoa = `${nam}-${String(thang).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                  const isBan = (lichBan[x.id] ?? []).some((k) => k.tu <= khoa && khoa <= k.den)
                  return (
                    <td 
                      key={dayNum} 
                      className={`lich-td-ngay ${isBan ? 'ban' : 'trong'}`}
                      title={isBan ? 'Chủ xe đã chặn ngày này' : 'Trống lịch'}
                    >
                      <div className="lich-cell-content"></div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
