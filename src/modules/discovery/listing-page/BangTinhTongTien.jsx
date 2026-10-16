import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calculator, Truck, MessageCircle, Loader2, Info, AlertTriangle } from 'lucide-react'

import { formatVnd } from '../../../lib/format'
import { zaloHref } from '../../../lib/phone'
import { Khoi } from './KhoiThongTin'
import { tinhChiPhi } from './tinhChiPhi'
import { layGiaThamChieu } from './giaThamChieuApi'
import { soanBaoGia } from './baoGia'
import { laySoDienThoai, loiThanhLoiNoi } from '../contact/lienHeApi'
import { ghiBamZalo } from '../ghiSuKien'
import BoChonThoiGian from '../../../components/BoChonThoiGian'

// Giờ hiện tại làm tròn lên giờ chẵn kế tiếp — mốc mặc định hợp lý hơn phút lẻ.
function gioMacDinh() {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d
}

// <input type="datetime-local"> cần "YYYY-MM-DDTHH:mm" theo GIỜ ĐỊA PHƯƠNG —
// toISOString() trả UTC nên không dùng được thẳng.
function dinhDangInput(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * Bảng tính tổng tiền dự kiến — NGHIEN-CUU-XE-DIEN.md mục 4.
 *
 * Hàm tính (`tinhChiPhi`) chạy thuần ở trình duyệt, không gọi server (luật 7).
 * Component này chỉ lo: lấy input từ khách, đọc giá tham chiếu MỘT LẦN, và
 * hiện kết quả — không có logic tính tiền nào nằm ở đây.
 */
export default function BangTinhTongTien({ tin, userId, conHienThi }) {
  const [sp] = useSearchParams()
  const tuParam = sp.get('tu')
  const denParam = sp.get('den')

  const [gioNhan, setGioNhan] = useState(() => {
    if (tuParam && /^\d{4}-\d{2}-\d{2}$/.test(tuParam)) {
      const d = new Date(`${tuParam}T09:00:00`)
      if (!isNaN(d.getTime())) return d
    }
    return gioMacDinh()
  })

  const [gioTra, setGioTra] = useState(() => {
    if (denParam && /^\d{4}-\d{2}-\d{2}$/.test(denParam)) {
      const d = new Date(`${denParam}T21:00:00`)
      if (!isNaN(d.getTime())) return d
    }
    return new Date(gioMacDinh().getTime() + 24 * 60 * 60 * 1000)
  })

  // Cập nhật khi query string thay đổi
  useEffect(() => {
    if (tuParam && /^\d{4}-\d{2}-\d{2}$/.test(tuParam) && denParam && /^\d{4}-\d{2}-\d{2}$/.test(denParam)) {
      const d1 = new Date(`${tuParam}T09:00:00`)
      const d2 = new Date(`${denParam}T21:00:00`)
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
        setGioNhan(d1)
        setGioTra(d2)
      }
    }
  }, [tuParam, denParam])

  const [kmText, setKmText] = useState('')
  const [canGiaoXe, setCanGiaoXe] = useState(false)
  const [giaThamChieu, setGiaThamChieu] = useState(null)

  const [dangGui, setDangGui] = useState(false)
  const [daChep, setDaChep] = useState(false)
  const [loiGui, setLoiGui] = useState(null)

  // Chỉ xe xăng/dầu mới cần giá tham chiếu — không gọi mạng vô ích cho xe điện.
  useEffect(() => {
    let huy = false
    if (tin.fuel !== 'xang' && tin.fuel !== 'dau') return undefined
    layGiaThamChieu(tin.fuel).then((g) => {
      if (!huy) setGiaThamChieu(g)
    })
    return () => {
      huy = true
    }
  }, [tin.fuel])

  const kmDuKien = kmText.trim() === '' ? null : Number(kmText)

  const ketQua = useMemo(
    () =>
      tinhChiPhi({
        tin,
        gioNhan,
        gioTra,
        kmDuKien: Number.isFinite(kmDuKien) && kmDuKien >= 0 ? kmDuKien : null,
        canGiaoXe,
        giaThamChieu,
      }),
    [tin, gioNhan, gioTra, kmDuKien, canGiaoXe, giaThamChieu],
  )

  async function guiBaoGia() {
    if (dangGui || !ketQua) return
    setDangGui(true)
    setLoiGui(null)
    setDaChep(false)

    const ten = `${tin.brand_text} ${tin.model_text}${tin.year ? ` ${tin.year}` : ''}`
    const vanBan = soanBaoGia({ ten, gioNhan, gioTra, ketQua })

    try {
      // Vẫn phải đi qua reveal-phone dù khách chưa bấm "Xem số điện thoại" —
      // đây là một lượt lead, phải đếm (server tự khử trùng lặp trong 1 giờ
      // nếu khách đã lấy số trước đó, nên không sợ tính hai lần).
      const so = await laySoDienThoai(tin.id)

      try {
        await navigator.clipboard.writeText(vanBan)
        setDaChep(true)
      } catch {
        /* Trình duyệt chặn clipboard thì thôi — vẫn mở Zalo, khách tự gõ. */
      }

      ghiBamZalo(tin, userId)
      window.open(zaloHref(so.zalo || so.phone), '_blank', 'noreferrer')
    } catch (err) {
      setLoiGui(loiThanhLoiNoi(err))
    } finally {
      setDangGui(false)
    }
  }

  const trungLichBan = useMemo(() => {
    if (!tin.ngayChan?.length || !gioNhan || !gioTra) return false
    const p = (n) => String(n).padStart(2, '0')
    const nhanYMD = `${gioNhan.getFullYear()}-${p(gioNhan.getMonth() + 1)}-${p(gioNhan.getDate())}`
    const traYMD = `${gioTra.getFullYear()}-${p(gioTra.getMonth() + 1)}-${p(gioTra.getDate())}`

    return tin.ngayChan.some((k) => {
      const tu = k.date_from || k.tu
      const den = k.date_to || k.den
      return tu && den && nhanYMD <= den && traYMD >= tu
    })
  }, [tin.ngayChan, gioNhan, gioTra])

  const phuDeGiaoXe = useMemo(() => {
    if (tin.delivery_fee != null) {
      return tin.delivery_fee === 0 ? 'Miễn phí giao xe' : `+${formatVnd(tin.delivery_fee)}`
    }
    return tin.delivery_fee_note || 'Thỏa thuận theo cự ly'
  }, [tin.delivery_fee, tin.delivery_fee_note])

  if (!conHienThi) return null

  return (
    <Khoi title="Ước tính chi phí thuê">
      <div className="banggia">
        {/* Khung cấu hình thời gian & tùy chọn */}
        <div className="banggia-khung-nhap">
          <BoChonThoiGian 
            gioNhan={gioNhan} 
            gioTra={gioTra} 
            ngayBan={tin.ngayChan}
            onChange={(n, t) => { setGioNhan(n); setGioTra(t) }} 
          />

          {trungLichBan && (
            <div className="banggia-canhbao-ban" role="alert">
              <AlertTriangle size={16} strokeWidth={2} />
              <span>Chủ xe đã báo bận một số ngày bạn chọn</span>
            </div>
          )}

          <div className="banggia-hang-phu">
            <label className="field banggia-field-km">
              <span className="field-label">Quãng đường dự kiến</span>
              <div className="banggia-input-km-wrap">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  className="input banggia-input-km"
                  placeholder="VD: 150"
                  value={kmText}
                  onChange={(e) => setKmText(e.target.value)}
                />
                <span className="banggia-km-donvi">km</span>
              </div>
            </label>

            <label className={`banggia-the-giaoxe ${canGiaoXe ? 'active' : ''}`}>
              <input
                type="checkbox"
                className="banggia-giaoxe-check"
                checked={canGiaoXe}
                onChange={(e) => setCanGiaoXe(e.target.checked)}
              />
              <div className="banggia-giaoxe-noidung">
                <div className="banggia-giaoxe-tieude">
                  <Truck size={16} strokeWidth={2} />
                  <span>Cần giao xe tận nơi</span>
                </div>
                <span className="banggia-giaoxe-phu">{phuDeGiaoXe}</span>
              </div>
            </label>
          </div>
        </div>

        {!ketQua ? (
          <p className="t-small banggia-trong">
            <Calculator size={16} strokeWidth={1.8} />
            Chọn giờ nhận và giờ trả hợp lệ để xem ước tính.
          </p>
        ) : (
          <div className="banggia-chitiet">
            <dl className="banggia-dong">
              {ketQua.dong.map((d) => (
                <div key={d.khoa} className="banggia-khoan-muc">
                  <div className="banggia-dong-dau">
                    <dt>{d.nhan}</dt>
                    <dd>{d.soTien != null ? formatVnd(d.soTien) : <span className="t-small">—</span>}</dd>
                  </div>
                  {d.moTa && <span className="t-small banggia-mota">{d.moTa}</span>}
                  {d.ghiChu && <span className="t-small banggia-ghichu">{d.ghiChu}</span>}
                </div>
              ))}
            </dl>

            <div className="banggia-tong-box">
              <div className="banggia-tong-chu-khoi">
                <span className="banggia-tong-chu">TỔNG DỰ KIẾN</span>
                <span className="banggia-tong-phu">Chưa gồm tiền cọc / thế chấp</span>
              </div>
              <span className="banggia-tong-tien">{formatVnd(ketQua.tongTien)}</span>
            </div>

            <div className="banggia-coc-luoi">
              {ketQua.coc && (
                <div className="banggia-the-coc">
                  <span className="banggia-the-coc-nhan">Cọc giữ xe (hoàn lại khi trả)</span>
                  <strong className="banggia-the-coc-gia">
                    {ketQua.coc.soTien != null ? formatVnd(ketQua.coc.soTien) : ketQua.coc.ghiChu}
                  </strong>
                </div>
              )}

              <div className="banggia-the-coc">
                <span className="banggia-the-coc-nhan">Thế chấp xe máy / CCCD</span>
                <strong className="banggia-the-coc-gia">
                  {ketQua.theChap.batBuoc ? (ketQua.theChap.ghiChu ?? 'Có yêu cầu') : 'Không cần'}
                </strong>
              </div>
            </div>

            {/* Luật 6 — dòng miễn trừ bắt buộc đi kèm bảng tính. */}
            <p className="t-small banggia-mienTru">
              <Info size={15} strokeWidth={1.8} className="banggia-mientru-icon" />
              <span>{ketQua.disclaimer}</span>
            </p>

            <button
              type="button"
              className="btn btn-zalo btn-block banggia-btn-zalo"
              onClick={guiBaoGia}
              disabled={dangGui}
            >
              {dangGui ? (
                <Loader2 size={18} strokeWidth={2} className="xoay" />
              ) : (
                <MessageCircle size={18} strokeWidth={2} />
              )}
              Gửi báo giá cho chủ xe qua Zalo
            </button>
            {daChep && (
              <p className="t-small banggia-dachep">Đã chép báo giá — dán vào khung chat Zalo nhé.</p>
            )}
            {loiGui && (
              <p className="lienhe-loi" role="alert">
                {loiGui}
              </p>
            )}
          </div>
        )}
      </div>
    </Khoi>
  )
}

