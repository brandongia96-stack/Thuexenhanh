import { useEffect, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Car, Settings, X, Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { danhSachXeCuaToi } from './ownerApi'
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
  const [lichBan, setLichBan] = useState({}) // Mock dữ liệu lịch bận

  useEffect(() => {
    if (!user) return
    danhSachXeCuaToi(user.id, { limit: 20 })
      .then(res => {
        setXe(res)
        // Tạo dữ liệu lịch bận ảo (mock)
        const mockLich = {}
        res.forEach(x => {
          const soNgayBan = Math.floor(Math.random() * 8) + 2 // 2-10 ngày bận
          mockLich[x.id] = []
          for (let i = 0; i < soNgayBan; i++) {
            const ngay = Math.floor(Math.random() * 28) + 1
            mockLich[x.id].push(ngay)
          }
        })
        setLichBan(mockLich)
      })
      .finally(() => setDangTai(false))
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
      
      <p style={{ color: 'var(--m-subtle)' }}>Quản lý tình trạng xe trống/bận. Bấm vào ô ngày để khóa lịch.</p>

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
                    <img src={x.cover_thumb || 'https://via.placeholder.com/40'} alt="" />
                    <div className="lich-xe-ten">
                      <strong>{x.brand_text} {x.model_text} {x.year}</strong>
                      <span>Biển số: {x.id.charCodeAt(0) * 1234}</span>
                    </div>
                  </div>
                </td>
                {danhSachNgay.map(ngay => {
                  const dayNum = ngay.getDate()
                  const isBan = lichBan[x.id]?.includes(dayNum)
                  return (
                    <td 
                      key={dayNum} 
                      className={`lich-td-ngay ${isBan ? 'ban' : 'trong'}`}
                      title={isBan ? 'Đã có khách thuê' : 'Trống lịch'}
                    >
                      {/* Interactive cell mock */}
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
