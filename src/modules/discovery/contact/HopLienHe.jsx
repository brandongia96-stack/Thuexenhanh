import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Phone, MessageCircle, Loader2, AlertCircle, LogIn, ShieldAlert } from 'lucide-react'
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
  // { text, code }: giữ cả mã lỗi để biết có nên mời đăng nhập hay không.
  const [loi, setLoi] = useState(null)
  const [hienCanhBao, setHienCanhBao] = useState(false)
  const { pathname, search } = useLocation()

  if (!conHienThi) {
    return (
      <div className="lienhe-tat">
        <AlertCircle size={18} strokeWidth={1.8} />
        <span>Tin đã hết hạn nên không còn số liên hệ.</span>
      </div>
    )
  }

  function xulyBamXemSo() {
    const daDongY = localStorage.getItem('thuexenhanh_anti_scam_agreed')
    if (daDongY) {
      xemSo()
    } else {
      setHienCanhBao(true)
    }
  }

  function dongYCanhBao() {
    localStorage.setItem('thuexenhanh_anti_scam_agreed', '1')
    setHienCanhBao(false)
    xemSo()
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
      setLoi({ text: loiThanhLoiNoi(err), code: err?.code ?? null })
    } finally {
      setDangLay(false)
    }
  }

  return (
    <div className="lienhe">
      {!so ? (
        <>
          {/* Hộp tĩnh, KHÔNG fixed, KHÔNG chạy chữ — nằm ngay trên nút bấm
              (contracts/api.md mục 3e). */}
          <div className="coc-canhbao" role="note">
            <ShieldAlert size={18} strokeWidth={1.8} />
            <span>
              Không chuyển cọc trước khi xem xe tận nơi. Thuê Xe Nhanh không nhận và không
              bảo lãnh tiền cọc.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={xulyBamXemSo}
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
            <div className="lienhe-loi-khoi">
              <p className="lienhe-loi" role="alert">
                {loi.text}
              </p>
              {/* Hết lượt xem số khi chưa đăng nhập: mời đăng nhập thay vì bỏ khách lại. */}
              {loi.code === 'vuot_gioi_han' && !userId && (
                <Link
                  to="/dang-nhap"
                  state={{ quayLai: pathname + search }}
                  className="btn btn-ghost btn-block"
                >
                  <LogIn size={18} strokeWidth={2} />
                  Đăng nhập để xem tiếp
                </Link>
              )}
            </div>
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

      {/* Modal Cảnh báo lừa đảo */}
      {hienCanhBao && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 'var(--sp-4)'
        }}>
          <div className="card card-pad stack" style={{ maxWidth: 400, background: '#fff' }}>
            <div className="row" style={{ color: 'var(--m-red)', justifyContent: 'center', marginBottom: 8 }}>
              <AlertCircle size={48} strokeWidth={1.5} />
            </div>
            <h3 className="t-h3" style={{ textAlign: 'center', color: 'var(--m-red)' }}>Cảnh báo an toàn</h3>
            <p className="t-body" style={{ textAlign: 'center', marginTop: 8 }}>
              <b>TUYỆT ĐỐI KHÔNG CHUYỂN CỌC TRƯỚC KHI XEM XE TRỰC TIẾP.</b>
              <br/><br/>
              Thuê Xe Nhanh chỉ là nền tảng rao vặt, không chịu trách nhiệm bảo lãnh hay giải quyết tranh chấp tài chính cho giao dịch này.
            </p>
            <div className="row" style={{ marginTop: 'var(--sp-4)', gap: 'var(--sp-3)' }}>
              <button 
                className="btn btn-ghost" 
                style={{ flex: 1 }} 
                onClick={() => setHienCanhBao(false)}
              >
                Hủy bỏ
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, background: 'var(--m-red)', borderColor: 'var(--m-red)' }} 
                onClick={dongYCanhBao}
              >
                Tôi đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
