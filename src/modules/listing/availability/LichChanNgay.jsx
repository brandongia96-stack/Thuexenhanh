// listing/availability — lịch chặn ngày xe không cho thuê.
//
// Lưu theo KHOẢNG (date_from → date_to) đúng như bảng `listing_blocked_dates`,
// không lưu từng ngày rời. Chủ xe bận cả tuần thì đó là một dòng, không phải bảy.
//
// Không dùng thư viện lịch: một lịch tháng là ~40 dòng tính toán, còn thư viện
// lịch nhẹ nhất cũng 30 KB gzip — HIEU-NANG.md mục 3 bảo cân trước khi thêm.

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react'
import './LichChanNgay.css'

const THU = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// Khoá ngày theo giờ ĐỊA PHƯƠNG. Dùng toISOString() sẽ lệch một ngày
// với múi giờ +07 mỗi khi qua 17h — lỗi kinh điển.
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

function hienNgay(key) {
  const d = tuKhoa(key)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function soNgay(from, to) {
  return Math.round((tuKhoa(to) - tuKhoa(from)) / 86_400_000) + 1
}

// Thứ 2 là cột đầu (lịch Việt Nam), JS trả Chủ nhật = 0.
function cotDau(year, month) {
  return (new Date(year, month, 1).getDay() + 6) % 7
}

function ThangLich({ year, month, ngayBiChan, ngayDangRe, batDau, homNay, onChonNgay, onReNgay, onLui, onToi }) {
  const soNgayTrongThang = new Date(year, month + 1, 0).getDate()
  const trong = cotDau(year, month)

  return (
    <div className="lcn-thang">
      <div className="lcn-dau">
        {onLui ? (
          <button type="button" className="lcn-nut-thang" onClick={onLui} aria-label="Tháng trước">
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
        ) : <span className="lcn-nut-thang lcn-an" />}

        <strong>Tháng {month + 1} / {year}</strong>

        {onToi ? (
          <button type="button" className="lcn-nut-thang" onClick={onToi} aria-label="Tháng sau">
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        ) : <span className="lcn-nut-thang lcn-an" />}
      </div>

      <div className="lcn-luoi lcn-thu">
        {THU.map((t) => <span key={t}>{t}</span>)}
      </div>

      <div className="lcn-luoi">
        {Array.from({ length: trong }, (_, i) => <span key={`t${i}`} />)}
        {Array.from({ length: soNgayTrongThang }, (_, i) => {
          const ngay = i + 1
          const key = khoaNgay(new Date(year, month, ngay))
          const daQua = key < homNay
          const biChan = ngayBiChan.has(key)
          const dangRe = ngayDangRe.has(key)
          const laDauChon = key === batDau

          const lop = [
            'lcn-ngay',
            daQua && 'lcn-qua',
            biChan && 'lcn-chan',
            dangRe && 'lcn-re',
            laDauChon && 'lcn-dau-chon',
          ].filter(Boolean).join(' ')

          return (
            <button
              key={key}
              type="button"
              className={lop}
              disabled={daQua}
              onClick={() => onChonNgay(key)}
              onMouseEnter={() => onReNgay(key)}
              aria-label={`Ngày ${ngay} tháng ${month + 1}${biChan ? ', đang bận' : ''}`}
              aria-pressed={biChan}
            >
              {ngay}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * @param {Array<{date_from:string, date_to:string, note?:string}>} khoang
 * @param {(khoang: Array) => void} onChange
 */
export default function LichChanNgay({ khoang = [], onChange }) {
  const homNay = khoaNgay(new Date())
  const [moc, setMoc] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() }
  })
  const [batDau, setBatDau] = useState(null)
  const [reQua, setReQua] = useState(null)
  const [dangGhiChu, setDangGhiChu] = useState(null) // chỉ số khoảng đang sửa ghi chú
  const [ghiChu, setGhiChu] = useState('')

  // Bản đồ ngày → chỉ số khoảng. Tính lại chỉ khi khoảng đổi.
  const { ngayBiChan, ngayVeKhoang } = useMemo(() => {
    const set = new Set()
    const map = new Map()
    khoang.forEach((k, idx) => {
      let cur = tuKhoa(k.date_from)
      const cuoi = tuKhoa(k.date_to)
      while (cur <= cuoi) {
        const key = khoaNgay(cur)
        set.add(key)
        map.set(key, idx)
        cur.setDate(cur.getDate() + 1)
      }
    })
    return { ngayBiChan: set, ngayVeKhoang: map }
  }, [khoang])

  // Vệt xám xem trước trong lúc rê chuột từ ngày bắt đầu.
  const ngayDangRe = useMemo(() => {
    const set = new Set()
    if (!batDau || !reQua || reQua < batDau) return set
    let cur = tuKhoa(batDau)
    const cuoi = tuKhoa(reQua)
    while (cur <= cuoi) {
      set.add(khoaNgay(cur))
      cur.setDate(cur.getDate() + 1)
    }
    return set
  }, [batDau, reQua])

  const tongNgay = khoang.reduce((acc, k) => acc + soNgay(k.date_from, k.date_to), 0)

  function chonNgay(key) {
    // Bấm vào ngày đã bận = mở khoảng đó ra để sửa ghi chú hoặc bỏ chặn.
    if (ngayBiChan.has(key)) {
      const idx = ngayVeKhoang.get(key)
      setDangGhiChu(idx)
      setGhiChu(khoang[idx]?.note ?? '')
      setBatDau(null)
      return
    }
    if (!batDau) {
      setBatDau(key)
      return
    }
    // Bấm ngược về trước = đổi ý, lấy ngày mới làm điểm bắt đầu.
    if (key < batDau) {
      setBatDau(key)
      return
    }
    const moi = [...khoang, { date_from: batDau, date_to: key, note: '' }]
    onChange(moi)
    setBatDau(null)
    setReQua(null)
    setDangGhiChu(moi.length - 1)
    setGhiChu('')
  }

  function xoaKhoang(idx) {
    onChange(khoang.filter((_, i) => i !== idx))
    setDangGhiChu(null)
  }

  function luuGhiChu() {
    onChange(khoang.map((k, i) => (i === dangGhiChu ? { ...k, note: ghiChu.trim() } : k)))
    setDangGhiChu(null)
  }

  const thangSau = moc.month === 11
    ? { year: moc.year + 1, month: 0 }
    : { year: moc.year, month: moc.month + 1 }

  const now = new Date()
  const coTheLui = moc.year > now.getFullYear() || (moc.year === now.getFullYear() && moc.month > now.getMonth())

  return (
    <div className="lcn">
      <div className="lcn-huong-dan">
        {batDau ? (
          <span className="lcn-dang-chon">
            Đã chọn từ <strong>{hienNgay(batDau)}</strong> — bấm tiếp ngày kết thúc
            <button type="button" className="lcn-huy" onClick={() => { setBatDau(null); setReQua(null) }}>
              huỷ
            </button>
          </span>
        ) : (
          <span className="t-small">
            Bấm ngày bắt đầu rồi ngày kết thúc để đánh dấu xe bận.
            {khoang.length > 0 && (
              <strong className="lcn-dem"> {khoang.length} đợt · {tongNgay} ngày bận.</strong>
            )}
          </span>
        )}
      </div>

      <div className="lcn-hai-thang">
        {/* Cả hai nút chuyển tháng đặt ở lịch đầu: trên điện thoại lịch thứ hai
            bị ẩn, để nút "tháng sau" ở đó thì bấm không tới. */}
        <ThangLich
          year={moc.year} month={moc.month}
          ngayBiChan={ngayBiChan} ngayDangRe={ngayDangRe} batDau={batDau} homNay={homNay}
          onChonNgay={chonNgay} onReNgay={setReQua}
          onLui={coTheLui ? () => setMoc(moc.month === 0 ? { year: moc.year - 1, month: 11 } : { year: moc.year, month: moc.month - 1 }) : null}
          onToi={() => setMoc(thangSau)}
        />
        <ThangLich
          year={thangSau.year} month={thangSau.month}
          ngayBiChan={ngayBiChan} ngayDangRe={ngayDangRe} batDau={batDau} homNay={homNay}
          onChonNgay={chonNgay} onReNgay={setReQua}
          onLui={null}
          onToi={null}
        />
      </div>

      {dangGhiChu != null && khoang[dangGhiChu] && (
        <div className="lcn-sua">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong className="t-h3">
              {hienNgay(khoang[dangGhiChu].date_from)} → {hienNgay(khoang[dangGhiChu].date_to)}
              <span className="t-small"> · {soNgay(khoang[dangGhiChu].date_from, khoang[dangGhiChu].date_to)} ngày</span>
            </strong>
            <button type="button" className="lcn-dong" onClick={() => setDangGhiChu(null)} aria-label="Đóng">
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <input
            className="input"
            value={ghiChu}
            maxLength={80}
            placeholder="Ghi chú (không bắt buộc): khách quen thuê, đi bảo dưỡng…"
            onChange={(e) => setGhiChu(e.target.value)}
          />

          <div className="row">
            <button type="button" className="btn btn-primary btn-sm" onClick={luuGhiChu}>Lưu</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => xoaKhoang(dangGhiChu)}>
              <Trash2 size={15} strokeWidth={1.8} />
              Bỏ chặn đợt này
            </button>
          </div>
        </div>
      )}

      {/* Danh sách các đợt — luật graceful degradation: chưa có đợt nào thì
          ẩn hẳn khối này, không hiện bảng rỗng. */}
      {khoang.length > 0 && (
        <ul className="lcn-ds">
          {khoang.map((k, i) => (
            <li key={`${k.date_from}-${k.date_to}-${i}`}>
              <button type="button" className="lcn-ds-nut" onClick={() => { setDangGhiChu(i); setGhiChu(k.note ?? '') }}>
                <span className="lcn-ds-ngay">{hienNgay(k.date_from)} → {hienNgay(k.date_to)}</span>
                <span className="t-small">{soNgay(k.date_from, k.date_to)} ngày</span>
                {k.note && <span className="lcn-ds-note">{k.note}</span>}
              </button>
              <button type="button" className="lcn-dong" onClick={() => xoaKhoang(i)} aria-label="Bỏ chặn đợt này">
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
