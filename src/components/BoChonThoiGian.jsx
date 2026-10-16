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

function khoaNgay(d) {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dinhDangNgay(val) {
  if (!val) return 'Chọn ngày'
  const d = typeof val === 'string' ? new Date(`${val}T00:00:00`) : val
  if (!d || isNaN(d.getTime())) return 'Chọn ngày'
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

function dinhDangKhoangNgay(tu, den) {
  if (!tu || !den) return ''
  const d1 = typeof tu === 'string' ? new Date(`${tu}T00:00:00`) : tu
  const d2 = typeof den === 'string' ? new Date(`${den}T00:00:00`) : den
  if (!d1 || isNaN(d1.getTime()) || !d2 || isNaN(d2.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  const y1 = d1.getFullYear()
  const y2 = d2.getFullYear()
  if (y1 === y2) {
    return `${p(d1.getDate())}/${p(d1.getMonth() + 1)} – ${p(d2.getDate())}/${p(d2.getMonth() + 1)}/${y1}`
  }
  return `${p(d1.getDate())}/${p(d1.getMonth() + 1)}/${y1} – ${p(d2.getDate())}/${p(d2.getMonth() + 1)}/${y2}`
}

function dinhDangInputString(d) {
  if (!d || isNaN(d.getTime())) return 'Chọn ngày'
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

// Giờ 00:00 -> 23:30 (bước 30 phút)
const GIO_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
  const h = Math.floor(i / 2)
  const m = (i % 2) === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

export default function BoChonThoiGian({
  gioNhan,
  gioTra,
  tu = '',
  den = '',
  chiNgay = false,
  ngayBan = [],
  onChange,
}) {
  const [mo, setMo] = useState(false)

  // Mốc mặc định cho chế độ chỉ ngày
  const defaultNhanDate = useMemo(() => {
    if (chiNgay) {
      if (tu && /^\d{4}-\d{2}-\d{2}$/.test(tu)) {
        const d = new Date(`${tu}T00:00:00`)
        if (!isNaN(d.getTime())) return d
      }
      const homNay = new Date()
      homNay.setHours(0, 0, 0, 0)
      return homNay
    }
    return gioNhan || new Date()
  }, [chiNgay, tu, gioNhan])

  const defaultTraDate = useMemo(() => {
    if (chiNgay) {
      if (den && /^\d{4}-\d{2}-\d{2}$/.test(den)) {
        const d = new Date(`${den}T00:00:00`)
        if (!isNaN(d.getTime())) return d
      }
      const mai = new Date(defaultNhanDate)
      mai.setDate(mai.getDate() + 1)
      return mai
    }
    return gioTra || new Date(defaultNhanDate.getTime() + 24 * 60 * 60 * 1000)
  }, [chiNgay, den, defaultNhanDate, gioTra])

  // State tạm thời trong modal
  const [chonNhan, setChonNhan] = useState(defaultNhanDate)
  const [chonTra, setChonTra] = useState(defaultTraDate)
  const [thangHienTai, setThangHienTai] = useState(() => new Date(defaultNhanDate.getFullYear(), defaultNhanDate.getMonth(), 1))

  // Chế độ chọn: 'nhan' (đang chọn ngày nhận) hoặc 'tra' (đang chọn ngày trả)
  const [buocChon, setBuocChon] = useState('nhan')

  function moModal() {
    setChonNhan(defaultNhanDate)
    setChonTra(defaultTraDate)
    setThangHienTai(new Date(defaultNhanDate.getFullYear(), defaultNhanDate.getMonth(), 1))
    // Luôn luôn tự động bắt đầu từ bước chọn ngày nhận trước
    setBuocChon('nhan')
    setMo(true)
  }

  function xacNhan() {
    if (chiNgay) {
      onChange(khoaNgay(chonNhan), khoaNgay(chonTra))
    } else {
      onChange(chonNhan, chonTra)
    }
    setMo(false)
  }

  function boChon() {
    if (chiNgay) {
      onChange('', '')
    }
    setMo(false)
  }

  function bamNgay(d) {
    const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const nhanTime = new Date(chonNhan.getFullYear(), chonNhan.getMonth(), chonNhan.getDate()).getTime()

    if (buocChon === 'nhan') {
      const newNhan = new Date(d)
      if (!chiNgay) {
        newNhan.setHours(chonNhan.getHours(), chonNhan.getMinutes(), 0, 0)
      } else {
        newNhan.setHours(0, 0, 0, 0)
      }
      setChonNhan(newNhan)

      // Nếu ngày nhận mới >= ngày trả hiện tại, tự động đẩy ngày trả lên +1 ngày
      if (newNhan >= chonTra) {
        const newTra = new Date(newNhan)
        newTra.setDate(newTra.getDate() + 1)
        if (!chiNgay) {
          newTra.setHours(chonTra.getHours(), chonTra.getMinutes(), 0, 0)
        } else {
          newTra.setHours(0, 0, 0, 0)
        }
        setChonTra(newTra)
      }
      // Sau khi chọn ngày nhận xong -> tự động chuyển sang chọn ngày trả
      setBuocChon('tra')
    } else {
      // Đang ở bước chọn ngày trả
      if (dTime < nhanTime) {
        // Nếu lỡ bấm ngày trước ngày nhận, tự động hiểu là chọn lại ngày nhận mới
        const newNhan = new Date(d)
        if (!chiNgay) {
          newNhan.setHours(chonNhan.getHours(), chonNhan.getMinutes(), 0, 0)
        } else {
          newNhan.setHours(0, 0, 0, 0)
        }
        setChonNhan(newNhan)

        const newTra = new Date(newNhan)
        newTra.setDate(newTra.getDate() + 1)
        if (!chiNgay) {
          newTra.setHours(chonTra.getHours(), chonTra.getMinutes(), 0, 0)
        } else {
          newTra.setHours(0, 0, 0, 0)
        }
        setChonTra(newTra)
        setBuocChon('tra')
      } else {
        const newTra = new Date(d)
        if (!chiNgay) {
          newTra.setHours(chonTra.getHours(), chonTra.getMinutes(), 0, 0)
        } else {
          newTra.setHours(0, 0, 0, 0)
        }
        setChonTra(newTra)
        // Đã chọn xong ngày trả, chuyển về 'nhan' để lần click tiếp theo sẽ chọn lại từ ngày nhận
        setBuocChon('nhan')
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
      blocks.push(<div key={`empty-${i}`} className="cal-cell empty" />)
    }

    const homNayMidnight = new Date().setHours(0, 0, 0, 0)
    const max180Days = homNayMidnight + 180 * 86_400_000

    // Các ngày trong tháng
    for (let i = 1; i <= days; i++) {
      const cellDate = new Date(year, month, i)
      const cellTime = cellDate.getTime()
      const cellKhoa = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`

      const nhanTime = new Date(chonNhan.getFullYear(), chonNhan.getMonth(), chonNhan.getDate()).getTime()
      const traTime = new Date(chonTra.getFullYear(), chonTra.getMonth(), chonTra.getDate()).getTime()

      // Đã qua chưa? Không cho chọn ngày quá khứ
      const isPast = cellTime < homNayMidnight
      // Tối đa 180 ngày từ hôm nay
      const isTooFar = cellTime > max180Days

      // Xe đã bận: tô màu nhưng không chặn
      const isBusy = ngayBan && ngayBan.some((b) => {
        const from = b.date_from || b.tu || ''
        const to = b.date_to || b.den || from
        return from && to && cellKhoa >= from && cellKhoa <= to
      })

      const isSelected = cellTime === nhanTime || cellTime === traTime
      const isStart = cellTime === nhanTime
      const isEnd = cellTime === traTime
      const inRange = cellTime > nhanTime && cellTime < traTime

      let className = 'cal-cell'
      if (isPast || isTooFar) className += ' disabled'
      if (isBusy) className += ' is-busy'
      if (isSelected) className += ' selected'
      else if (inRange) className += ' in-range'

      if (isStart) className += ' start-range'
      if (isEnd) className += ' end-range'

      const disabled = isPast || isTooFar

      blocks.push(
        <button
          key={`day-${i}`}
          type="button"
          disabled={disabled}
          className={className}
          onClick={() => bamNgay(cellDate)}
          title={isBusy ? 'Chủ xe đã báo bận ngày này' : undefined}
        >
          {i}
        </button>
      )
    }

    const dTemp = new Date(year, month, 1)
    return (
      <div className="cal-month">
        <div className="cal-title">Tháng {dTemp.getMonth() + 1}, {dTemp.getFullYear()}</div>
        <div className="cal-grid">
          {DAYS.map((d) => <div key={d} className="cal-dow">{d}</div>)}
          {blocks}
        </div>
      </div>
    )
  }

  const thoiGianThueThuc = chiNgay
    ? Math.round((new Date(chonTra.getFullYear(), chonTra.getMonth(), chonTra.getDate()) - new Date(chonNhan.getFullYear(), chonNhan.getMonth(), chonNhan.getDate())) / 86_400_000)
    : (chonTra - chonNhan) / (1000 * 60 * 60)

  const hopLe = chiNgay
    ? (thoiGianThueThuc >= 0 && thoiGianThueThuc <= 180)
    : (thoiGianThueThuc >= 1)

  // Label hiển thị trên trigger button
  const coNgayChon = chiNgay ? Boolean(tu && den) : true
  const nhanText = chiNgay
    ? (coNgayChon ? dinhDangNgay(tu) : 'Chọn ngày')
    : dinhDangInputString(gioNhan)
  const traText = chiNgay
    ? (coNgayChon ? dinhDangNgay(den) : 'Chọn ngày')
    : dinhDangInputString(gioTra)

  const khoangThoiGianText = chiNgay
    ? (coNgayChon ? `${Math.max(1, Math.round((new Date(`${den}T00:00:00`) - new Date(`${tu}T00:00:00`)) / 86_400_000))} ngày` : '')
    : tinhKhoangThoiGian(gioNhan, gioTra)

  return (
    <>
      <div className="banggia-thoigian-nhom">
        {chiNgay ? (
          !coNgayChon ? (
            <button
              type="button"
              className="banggia-trigger-hopnhat banggia-trigger--loc-trong"
              onClick={moModal}
              title="Bấm để chọn ngày nhận và trả xe"
            >
              <div className="banggia-trigger-loc-trai">
                <Calendar size={18} className="banggia-trigger-lich-icon" />
                <span className="banggia-trigger-loc-placeholder">Chọn ngày nhận — trả xe</span>
              </div>
              <ArrowRight size={14} className="banggia-trigger-loc-arrow" />
            </button>
          ) : (
            <div className="banggia-trigger-hopnhat banggia-trigger--loc-dachon">
              <button
                type="button"
                className="banggia-trigger-loc-nut-chinh"
                onClick={moModal}
                title="Bấm để đổi ngày nhận và trả xe"
              >
                <Calendar size={18} className="banggia-trigger-lich-icon" />
                <div className="banggia-trigger-loc-dachon-chu">
                  <span className="banggia-trigger-loc-khoang">
                    {dinhDangKhoangNgay(tu, den)}
                  </span>
                  {khoangThoiGianText && (
                    <span className="banggia-trigger-badge">{khoangThoiGianText}</span>
                  )}
                </div>
              </button>
              <button
                type="button"
                className="banggia-trigger-xoa"
                onClick={(e) => {
                  e.stopPropagation()
                  boChon()
                }}
                title="Xóa bộ lọc ngày"
                aria-label="Xóa bộ lọc ngày"
              >
                <X size={15} />
              </button>
            </div>
          )
        ) : (
          <button
            type="button"
            className="banggia-trigger-hopnhat banggia-trigger--banggia"
            onClick={moModal}
            title="Bấm để chọn thời gian nhận và trả xe"
          >
            <div className="banggia-trigger-khoi">
              <span className="banggia-trigger-nhan">Nhận xe</span>
              <span className="banggia-trigger-giatri">{nhanText}</span>
            </div>

            <div className="banggia-trigger-ngan">
              {khoangThoiGianText && khoangThoiGianText !== '—' && (
                <span className="banggia-trigger-badge">{khoangThoiGianText}</span>
              )}
              <ArrowRight size={14} className="banggia-trigger-arrow" />
            </div>

            <div className="banggia-trigger-khoi banggia-trigger-khoi-tra">
              <span className="banggia-trigger-nhan">Trả xe</span>
              <span className="banggia-trigger-giatri">{traText}</span>
            </div>

            <div className="banggia-trigger-lich">
              <Calendar size={18} />
            </div>
          </button>
        )}
      </div>

      {mo && (
        <div className="modal-overlay" onClick={() => setMo(false)}>
          <div className="modal-box time-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                {chiNgay ? 'Chọn ngày thuê xe' : 'Chọn thời gian thuê'}
              </h3>
              <button type="button" className="btn-close" onClick={() => setMo(false)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body stack">
              <div className="cal-tabs">
                <button
                  type="button"
                  className={`cal-tab ${buocChon === 'nhan' ? 'active' : ''}`}
                  onClick={() => setBuocChon('nhan')}
                >
                  <div className="cal-tab-top">
                    <span className="cal-tab-nhan">1. Ngày nhận xe</span>
                    {buocChon === 'nhan' && <span className="cal-tab-badge">Đang chọn</span>}
                  </div>
                  <span className="cal-tab-val">
                    {chiNgay ? dinhDangNgay(chonNhan) : dinhDangInputString(chonNhan)}
                  </span>
                </button>
                <button
                  type="button"
                  className={`cal-tab ${buocChon === 'tra' ? 'active' : ''}`}
                  onClick={() => setBuocChon('tra')}
                >
                  <div className="cal-tab-top">
                    <span className="cal-tab-nhan">2. Ngày trả xe</span>
                    {buocChon === 'tra' && <span className="cal-tab-badge">Đang chọn</span>}
                  </div>
                  <span className="cal-tab-val">
                    {chiNgay ? dinhDangNgay(chonTra) : dinhDangInputString(chonTra)}
                  </span>
                </button>
              </div>

              <div className="cal-huong-dan">
                {buocChon === 'nhan' ? (
                  <span>👉 Bước 1: <strong>Chọn ngày nhận xe</strong> trên lịch bên dưới</span>
                ) : (
                  <span>👉 Bước 2: <strong>Chọn ngày trả xe</strong> trên lịch bên dưới</span>
                )}
              </div>
              <div className="cal-header-nav">
                <button type="button" className="btn-nav" onClick={() => chuyenThang(-1)}>←</button>
                <div style={{ flex: 1 }} />
                <button type="button" className="btn-nav" onClick={() => chuyenThang(1)}>→</button>
              </div>

              <div className="cal-wrapper">
                {renderThang(thangHienTai.getFullYear(), thangHienTai.getMonth())}
                {renderThang(thangHienTai.getFullYear(), thangHienTai.getMonth() + 1)}
              </div>

              {!chiNgay && (
                <div className="time-selectors">
                  <label className="field" style={{ flex: 1 }}>
                    <span className="field-label">Nhận xe</span>
                    <select
                      className="select"
                      value={layGioTuDate(chonNhan)}
                      onChange={(e) => setChonNhan(taoDateTuGio(chonNhan, e.target.value))}
                    >
                      {GIO_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
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
                      {GIO_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </label>
                </div>
              )}
            </div>

            <div className="modal-foot-cal">
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14 }}>
                  {chiNgay
                    ? `${dinhDangNgay(chonNhan)} – ${dinhDangNgay(chonTra)}`
                    : `${dinhDangInputString(chonNhan)} - ${dinhDangInputString(chonTra)}`}
                </strong>
                <div className="t-small" style={{ color: !hopLe ? 'var(--m-red)' : 'var(--m-mid)' }}>
                  Thời gian thuê:{' '}
                  {chiNgay
                    ? `${Math.max(1, thoiGianThueThuc)} ngày`
                    : thoiGianThueThuc > 0
                      ? thoiGianThueThuc >= 24
                        ? `${+(thoiGianThueThuc / 24).toFixed(1)} ngày`
                        : `${thoiGianThueThuc} giờ`
                      : 'Không hợp lệ'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                {chiNgay && (tu || den) && (
                  <button type="button" className="btn btn-ghost" onClick={boChon}>
                    Bỏ chọn ngày
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={xacNhan}
                  disabled={!hopLe}
                >
                  {chiNgay ? 'Áp dụng' : 'Tiếp tục'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
