import { useEffect, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { danhSachXeCuaToi } from './ownerApi'
import { getSupabase } from '../../lib/supabase'
import { Skeleton } from '../../components/Loading'
import { luuNgayChan } from '../listing/listingApi'
import './LichXeTong.css'

// Helper tạo lịch tháng
function layNgayTrongThang(nam, thang) {
  const soNgay = new Date(nam, thang, 0).getDate()
  return Array.from({ length: soNgay }, (_, i) => new Date(nam, thang - 1, i + 1))
}

function khoaNgay(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const n = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${n}`
}

function tuKhoa(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
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
  const [dangLuu, setDangLuu] = useState({})

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
  const homNayKhoa = khoaNgay(homNay)
  const laThangNay = homNay.getMonth() === thang - 1 && homNay.getFullYear() === nam

  function chuyenThang(delta) {
    const d = new Date(thangHienTai)
    d.setMonth(d.getMonth() + delta)
    setThangHienTai(d)
  }

  // Chạm ô ngày để bật/tắt bận trực tiếp, tự động gộp các ngày liền nhau thành một khoảng
  async function toggleNgay(listingId, khoa) {
    if (khoa < homNayKhoa) return // Không cho sửa ngày đã qua
    if (dangLuu[listingId]) return

    // 1. Mở rộng tất cả khoảng hiện có của xe thành Set các ngày
    const dsNgay = new Set()
    const cacKhoang = lichBan[listingId] ?? []
    for (const k of cacKhoang) {
      const cur = tuKhoa(k.tu)
      const end = tuKhoa(k.den)
      while (cur <= end) {
        dsNgay.add(khoaNgay(cur))
        cur.setDate(cur.getDate() + 1)
      }
    }

    // 2. Đảo trạng thái ngày được chạm
    if (dsNgay.has(khoa)) {
      dsNgay.delete(khoa)
    } else {
      dsNgay.add(khoa)
    }

    // 3. Gộp các ngày liền nhau thành các khoảng [date_from, date_to]
    const mangNgay = Array.from(dsNgay).sort()
    const cacKhoangMoi = []
    let batDau = null
    let ketThuc = null

    for (const dStr of mangNgay) {
      if (!batDau) {
        batDau = dStr
        ketThuc = dStr
      } else {
        const prevD = tuKhoa(ketThuc)
        const currD = tuKhoa(dStr)
        const diffDays = Math.round((currD - prevD) / 86_400_000)
        if (diffDays === 1) {
          ketThuc = dStr
        } else {
          cacKhoangMoi.push({ date_from: batDau, date_to: ketThuc })
          batDau = dStr
          ketThuc = dStr
        }
      }
    }
    if (batDau) {
      cacKhoangMoi.push({ date_from: batDau, date_to: ketThuc })
    }

    // 4. Cập nhật state trước (optimistic)
    const stateMoi = cacKhoangMoi.map((k) => ({ tu: k.date_from, den: k.date_to }))
    const stateCu = lichBan[listingId] ?? []
    setLichBan((prev) => ({ ...prev, [listingId]: stateMoi }))
    setDangLuu((prev) => ({ ...prev, [listingId]: true }))

    // 5. Ghi vào database qua luuNgayChan
    try {
      await luuNgayChan(listingId, cacKhoangMoi)
    } catch (err) {
      // Khôi phục lại nếu lỗi
      setLichBan((prev) => ({ ...prev, [listingId]: stateCu }))
      alert('Không thể cập nhật lịch bận: ' + (err.message || 'Lỗi kết nối'))
    } finally {
      setDangLuu((prev) => ({ ...prev, [listingId]: false }))
    }
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
      
      <p style={{ color: 'var(--m-subtle)' }}>
        Chạm trực tiếp vào ô ngày để bật / tắt lịch bận cho từng xe. Hệ thống tự động gộp các ngày liền nhau thành một khoảng.
      </p>

      <div className="lich-bang-wrap">
        <table className="lich-bang">
          <thead>
            <tr>
              <th className="lich-th-xe">Danh sách xe ({xe.length})</th>
              {danhSachNgay.map((ngay) => {
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
            {xe.map((x) => (
              <tr key={x.id}>
                <td className="lich-td-xe">
                  <div className="lich-xe-info">
                    {x.cover_thumb && <img src={x.cover_thumb} alt="" width={40} height={40} />}
                    <div className="lich-xe-ten">
                      <strong>{x.brand_text} {x.model_text} {x.year}</strong>
                    </div>
                  </div>
                </td>
                {danhSachNgay.map((ngay) => {
                  const dayNum = ngay.getDate()
                  const khoa = `${nam}-${String(thang).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                  const daQua = khoa < homNayKhoa
                  const isBan = (lichBan[x.id] ?? []).some((k) => k.tu <= khoa && khoa <= k.den)
                  const dangLuuXe = Boolean(dangLuu[x.id])

                  return (
                    <td 
                      key={dayNum} 
                      className={`lich-td-ngay ${isBan ? 'ban' : 'trong'}${daQua ? ' qua-khu' : ''}${dangLuuXe ? ' dang-luu' : ''}`}
                      onClick={() => !daQua && toggleNgay(x.id, khoa)}
                      role={daQua ? undefined : 'button'}
                      tabIndex={daQua ? undefined : 0}
                      onKeyDown={(e) => {
                        if (!daQua && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          toggleNgay(x.id, khoa)
                        }
                      }}
                      title={daQua ? 'Ngày đã qua' : isBan ? 'Bấm để bỏ bận ngày này' : 'Bấm để đánh dấu xe bận'}
                    >
                      <div className="lich-cell-content" />
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
