import { useState } from 'react'
import { Phone, MessageCircle, Loader2, AlertCircle } from 'lucide-react'
import { formatPhone } from '../../../lib/format'
import { telHref, zaloHref } from '../../../lib/phone'
import { laySoDienThoai, loiThanhLoiNoi } from './lienHeApi'
import { ghiBamGoi, ghiBamZalo, ghiXemSo } from '../ghiSuKien'

/**
 * Ba bước liên hệ — ruột của cả sản phẩm.
 *
 *   [ Xem số điện thoại ]  →  [ 09xx xxx xxx ]  →  [ Gọi ] [ Nhắn Zalo ]
 *
 * CẤM tuyệt đối nút "Đặt xe ngay" / "Thuê ngay" / "Đặt lịch" (CLAUDE.md 1.2):
 * app không giữ chỗ được, hứa là lừa kỳ vọng của khách.
 *
 * Số điện thoại KHÔNG nằm trong HTML trước khi khách bấm — nó chỉ tồn tại
 * sau một lượt gọi `reveal-phone`.
 */
export default function HopLienHe({ tin, userId, conHienThi }) {
  const [so, setSo] = useState(null)
  const [dangLay, setDangLay] = useState(false)
  const [loi, setLoi] = useState(null)

  if (!conHienThi) {
    return (
      <div className="lienhe-tat">
        <AlertCircle size={18} strokeWidth={1.8} />
        <span>Tin đã hết hạn nên không còn số liên hệ.</span>
      </div>
    )
  }

  async function xemSo() {
    if (dangLay) return
    setDangLay(true)
    setLoi(null)
    try {
      const kq = await laySoDienThoai(tin.id)
      setSo(kq)
      // Ghi ngầm, không chặn khách. Server đã ghi bản chính thức; dòng này là
      // bản dự phòng khi Edge Function chưa dựng xong, có cửa sổ 1 giờ của
      // ghiSuKien nên không tạo ra lượt trùng.
      ghiXemSo(tin, userId)
    } catch (err) {
      setLoi(loiThanhLoiNoi(err))
    } finally {
      setDangLay(false)
    }
  }

  return (
    <div className="lienhe">
      {!so ? (
        <>
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={xemSo}
            disabled={dangLay}
          >
            {dangLay ? (
              <Loader2 size={18} strokeWidth={2} className="xoay" />
            ) : (
              <Phone size={18} strokeWidth={2} />
            )}
            {dangLay ? 'Đang lấy số…' : 'Xem số điện thoại'}
          </button>
          {loi && (
            <p className="lienhe-loi" role="alert">
              {loi}
            </p>
          )}
        </>
      ) : (
        <div className="lienhe-so">
          <a className="lienhe-sodep" href={telHref(so.phone)} onClick={() => ghiBamGoi(tin, userId)}>
            {formatPhone(so.phone)}
          </a>
          <div className="lienhe-nut">
            <a
              className="btn btn-primary btn-lg"
              href={telHref(so.phone)}
              onClick={() => ghiBamGoi(tin, userId)}
            >
              <Phone size={18} strokeWidth={2} />
              Gọi
            </a>
            {(so.zalo || so.phone) && (
              <a
                className="btn btn-zalo btn-lg"
                href={zaloHref(so.zalo || so.phone)}
                target="_blank"
                rel="noreferrer"
                onClick={() => ghiBamZalo(tin, userId)}
              >
                <MessageCircle size={18} strokeWidth={2} />
                Nhắn Zalo
              </a>
            )}
          </div>
        </div>
      )}

      {/* Dòng này KHÔNG được bỏ — CLAUDE.md mục 1.2. */}
      <p className="disclaimer">
        Thuexenhanh chỉ cung cấp thông tin. Giá cả, cọc và giao nhận do anh/chị và chủ xe tự
        thoả thuận.
      </p>
    </div>
  )
}
