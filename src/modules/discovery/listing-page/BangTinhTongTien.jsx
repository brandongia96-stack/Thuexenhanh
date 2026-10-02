import { useEffect, useMemo, useState } from 'react'
import { Calculator, Truck, MessageCircle, Loader2, Info } from 'lucide-react'

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
  const [gioNhan, setGioNhan] = useState(gioMacDinh)
  const [gioTra, setGioTra] = useState(() => new Date(gioMacDinh().getTime() + 24 * 60 * 60 * 1000))
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

  if (!conHienThi) return null

  return (
    <Khoi title="Ước tính chi phí thuê">
      <div className="banggia">
        <div className="banggia-nhap">
          <BoChonThoiGian 
            gioNhan={gioNhan} 
            gioTra={gioTra} 
            onChange={(n, t) => { setGioNhan(n); setGioTra(t) }} 
          />
          <label className="field">
            <span className="field-label">Quãng đường dự kiến</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              className="input"
              placeholder="VD: 300"
              value={kmText}
              onChange={(e) => setKmText(e.target.value)}
            />
          </label>
          <label className="banggia-checkbox">
            <input
              type="checkbox"
              checked={canGiaoXe}
              onChange={(e) => setCanGiaoXe(e.target.checked)}
            />
            <Truck size={16} strokeWidth={1.8} />
            Cần giao xe tận nơi
          </label>
        </div>

        {!ketQua ? (
          <p className="t-small banggia-trong">
            <Calculator size={16} strokeWidth={1.8} />
            Chọn giờ nhận và giờ trả hợp lệ để xem ước tính.
          </p>
        ) : (
          <>
            <dl className="banggia-dong">
              {ketQua.dong.map((d) => (
                <div key={d.khoa}>
                  <div className="banggia-dong-dau">
                    <dt>{d.nhan}</dt>
                    <dd>{d.soTien != null ? formatVnd(d.soTien) : <span className="t-small">—</span>}</dd>
                  </div>
                  <span className="t-small">{d.moTa}</span>
                  {d.ghiChu && <span className="t-small banggia-ghichu">{d.ghiChu}</span>}
                </div>
              ))}
            </dl>

            <div className="banggia-tong">
              <span>TỔNG DỰ KIẾN</span>
              <span className="t-price">{formatVnd(ketQua.tongTien)}</span>
            </div>

            {ketQua.coc && (
              <div className="banggia-rieng">
                <span>Cọc (hoàn lại khi trả xe)</span>
                <span>{ketQua.coc.soTien != null ? formatVnd(ketQua.coc.soTien) : ketQua.coc.ghiChu}</span>
              </div>
            )}

            <div className="banggia-rieng">
              <span>Thế chấp</span>
              <span>
                {ketQua.theChap.batBuoc ? (ketQua.theChap.ghiChu ?? 'Có yêu cầu') : 'Không cần'}
              </span>
            </div>

            {/* Luật 6 — dòng miễn trừ bắt buộc đi kèm bảng tính. */}
            <p className="t-small banggia-mienTru">
              <Info size={14} strokeWidth={1.8} />
              {ketQua.disclaimer}
            </p>

            <button
              type="button"
              className="btn btn-zalo btn-block"
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
          </>
        )}
      </div>
    </Khoi>
  )
}
