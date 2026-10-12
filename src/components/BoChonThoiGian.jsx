import { useState, useMemo } from 'react'
import { X, ArrowRight, Calendar } from 'lucide-react'
import './BoChonThoiGian.css'

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  // 0 is Sunday, 1 is Monday. We want 0 to be Monday.
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function layGioTuDate(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function taoDateTuGio(dateTruoc, gioString) {
  const [h, m] = gioString.split(':')
  const d = new Date(dateTruoc)
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0)
  return d
}

// Giờ 00:00 -> 23:30 (bước 30 phút)
const GIO_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
  const h = Math.floor(i / 2)
  const m = (i % 2) === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

export default function BoChonThoiGian({ gioNhan, gioTra, onChange }) {
  const [mo, setMo] = useState(false)

  // State tạm thời trong modal
  const [chonNhan, setChonNhan] = useState(gioNhan)
  const [chonTra, setChonTra] = useState(gioTra)
  
  const [thangHienTai, setThangHienTai] = useState(() => new Date(gioNhan.getFullYear(), gioNhan.getMonth(), 1))

  // Chế độ chọn: 'nhan' (đang chọn ngày nhận) hoặc 'tra' (đang chọn ngày trả)
  const [buocChon, setBuocChon] = useState('nhan')

  function moModal() {
    setChonNhan(gioNhan)
    setChonTra(gioTra)
    setThangHienTai(new Date(gioNhan.getFullYear(), gioNhan.getMonth(), 1))
    setBuocChon('nhan')
    setMo(true)
  }

  function xacNhan() {
    onChange(chonNhan, chonTra)
    setMo(false)
  }

  function bamNgay(d) {
    const dTime = d.getTime()
    if (buocChon === 'nhan') {
      const newNhan = new Date(d)
      newNhan.setHours(chonNhan.getHours(), chonNhan.getMinutes(), 0, 0)
      setChonNhan(newNhan)
      
      // Nếu ngày nhận vượt ngày trả, đẩy ngày trả lên +1 ngày
      if (newNhan >= chonTra) {
        const newTra = new Date(newNhan)
        newTra.setDate(newTra.getDate() + 1)
        newTra.setHours(chonTra.getHours(), chonTra.getMinutes(), 0, 0)
        setChonTra(newTra)
      }
      setBuocChon('tra')
    } else {
      const newTra = new Date(d)
      newTra.setHours(chonTra.getHours(), chonTra.getMinutes(), 0, 0)
      
      if (newTra <= chonNhan) {
        // Nếu lỡ bấm ngày trả bé hơn ngày nhận, coi như bấm lại ngày nhận
        setChonNhan(newTra)
        setBuocChon('tra')
      } else {
        setChonTra(newTra)
        // setBuocChon('nhan') // Giữ nguyên ở 'tra' để khách sửa lại nếu muốn
      }
    }
  }

  function chuyenThang(delta) {
    setThangHienTai(new Date(thangHienTai.getFullYear(), thangHienTai.getMonth() + delta, 1))
  }

  function renderThang(year, month) {
    const firstDay = getFirstDayOfMonth(year, month)
    const days = getDaysInMonth(year, month)
    const blocks = []
    
    // Ngày trống đầu tháng
    for (let i = 0; i < firstDay; i++) {
      blocks.push(<div key={`empty-${i}`} className="cal-cell empty"></div>)
    }

    // Các ngày trong tháng
    for (let i = 1; i <= days; i++) {
      const cellDate = new Date(year, month, i)
      const cellTime = cellDate.getTime()
      
      const nhanTime = new Date(chonNhan.getFullYear(), chonNhan.getMonth(), chonNhan.getDate()).getTime()
      const traTime = new Date(chonTra.getFullYear(), chonTra.getMonth(), chonTra.getDate()).getTime()
      
      // Đã qua chưa? Không cho chọn ngày quá khứ
      const isPast = cellTime < new Date(new Date().setHours(0,0,0,0)).getTime()
      
      const isSelected = cellTime === nhanTime || cellTime === traTime
      const isStart = cellTime === nhanTime
      const isEnd = cellTime === traTime
      const inRange = cellTime > nhanTime && cellTime < traTime

      let className = 'cal-cell'
      if (isPast) className += ' disabled'
      else if (isSelected) className += ' selected'
      else if (inRange) className += ' in-range'

      if (isStart) className += ' start-range'
      if (isEnd) className += ' end-range'

      blocks.push(
        <button
          key={`day-${i}`}
          type="button"
          disabled={isPast}
          className={className}
          onClick={() => bamNgay(cellDate)}
        >
          {i}
        </button>
      )
    }

    // Nếu tháng < 0 hoặc > 11, js Date tự fix year, nhưng ở đây render name month phải cẩn thận
    const dTemp = new Date(year, month, 1)
    return (
      <div className="cal-month">
        <div className="cal-title">Tháng {dTemp.getMonth() + 1}, {dTemp.getFullYear()}</div>
        <div className="cal-grid">
          {DAYS.map(d => <div key={d} className="cal-dow">{d}</div>)}
          {blocks}
        </div>
      </div>
    )
  }

  const thoiGianThueThuc = (chonTra - chonNhan) / (1000 * 60 * 60)
  const hopLe = thoiGianThueThuc >= 1 // Thuê ít nhất 1 tiếng

  const khoangThoiGianText = tinhKhoangThoiGian(gioNhan, gioTra)

  // Render 1 ô kích hoạt duy nhất
  return (
    <>
      <div className="banggia-thoigian-nhom">
        <span className="field-label">Thời gian nhận – trả xe</span>
        <button
          type="button"
          className="banggia-trigger-hopnhat"
          onClick={moModal}
          title="Bấm để chọn thời gian nhận và trả xe"
        >
          <div className="banggia-trigger-khoi">
            <span className="banggia-trigger-nhan">Nhận xe</span>
            <span className="banggia-trigger-giatri">{dinhDangInputString(gioNhan)}</span>
          </div>

          <div className="banggia-trigger-ngan">
            <span className="banggia-trigger-badge">{khoangThoiGianText}</span>
            <ArrowRight size={14} className="banggia-trigger-arrow" />
          </div>

          <div className="banggia-trigger-khoi banggia-trigger-khoi-tra">
            <span className="banggia-trigger-nhan">Trả xe</span>
            <span className="banggia-trigger-giatri">{dinhDangInputString(gioTra)}</span>
          </div>

          <div className="banggia-trigger-lich">
            <Calendar size={18} />
          </div>
        </button>
      </div>

      {mo && (
        <div className="modal-overlay" onClick={() => setMo(false)}>
          <div className="modal-box time-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Chọn thời gian thuê</h3>
              <button type="button" className="btn-close" onClick={() => setMo(false)} aria-label="Đóng"><X size={20}/></button>
            </div>
            
            <div className="modal-body stack">
              <div className="cal-tabs">
                <button
                  type="button"
                  className={`cal-tab ${buocChon === 'nhan' ? 'active' : ''}`}
                  onClick={() => setBuocChon('nhan')}
                >
                  <span className="cal-tab-nhan">1. Nhận xe</span>
                  <span className="cal-tab-val">{dinhDangInputString(chonNhan)}</span>
                </button>
                <button
                  type="button"
                  className={`cal-tab ${buocChon === 'tra' ? 'active' : ''}`}
                  onClick={() => setBuocChon('tra')}
                >
                  <span className="cal-tab-nhan">2. Trả xe</span>
                  <span className="cal-tab-val">{dinhDangInputString(chonTra)}</span>
                </button>
              </div>
              <div className="cal-header-nav">
                <button type="button" className="btn-nav" onClick={() => chuyenThang(-1)}>←</button>
                <div style={{flex: 1}}></div>
                <button type="button" className="btn-nav" onClick={() => chuyenThang(1)}>→</button>
              </div>

              <div className="cal-wrapper">
                {renderThang(thangHienTai.getFullYear(), thangHienTai.getMonth())}
                {renderThang(thangHienTai.getFullYear(), thangHienTai.getMonth() + 1)}
              </div>

              <div className="time-selectors">
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Nhận xe</span>
                  <select 
                    className="select" 
                    value={layGioTuDate(chonNhan)}
                    onChange={(e) => setChonNhan(taoDateTuGio(chonNhan, e.target.value))}
                  >
                    {GIO_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
                <ArrowRight size={16} color="var(--m-mid)" style={{ marginTop: 24 }} />
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Trả xe</span>
                  <select 
                    className="select" 
                    value={layGioTuDate(chonTra)}
                    onChange={(e) => setChonTra(taoDateTuGio(chonTra, e.target.value))}
                  >
                    {GIO_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="modal-foot-cal">
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14 }}>{dinhDangInputString(chonNhan)} - {dinhDangInputString(chonTra)}</strong>
                <div className="t-small" style={{color: !hopLe ? 'var(--m-red)' : 'var(--m-mid)'}}>
                  Thời gian thuê: {thoiGianThueThuc > 0 ? (thoiGianThueThuc >= 24 ? `${+(thoiGianThueThuc/24).toFixed(1)} ngày` : `${thoiGianThueThuc} giờ`) : 'Không hợp lệ'}
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={xacNhan}
                disabled={!hopLe}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function dinhDangInputString(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())} · ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

function tinhKhoangThoiGian(nhan, tra) {
  const gio = (tra - nhan) / (1000 * 60 * 60)
  if (gio <= 0) return '0 giờ'
  if (gio < 24) return `${+(gio.toFixed(1))} giờ`
  const ngay = +(gio / 24).toFixed(1)
  return `${ngay % 1 === 0 ? Math.round(ngay) : ngay} ngày`
}
