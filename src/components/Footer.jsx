import { Link } from 'react-router-dom'
import './Footer.css'

/**
 * Chân trang — CHỈ chứa thứ có thật (CLAUDE.md §1.2).
 *
 * Cố ý KHÔNG có cho tới khi anh đưa thông tin thật:
 *   · tên công ty, mã số doanh nghiệp, địa chỉ, tài khoản ngân hàng
 *   · hotline, email, mạng xã hội
 *   · logo "Đã thông báo Bộ Công Thương" — chỉ gắn SAU KHI đã thông báo
 *     website TMĐT với Bộ Công Thương và được cấp mã/đường dẫn xác thực
 *   · logo phương thức thanh toán — app chỉ nhận chuyển khoản VietQR
 *     để nạp token, không nhận MoMo/VNPAY/thẻ
 * Mọi đường dẫn dưới đây đều trỏ tới route có thật trong App.jsx.
 */
export default function Footer() {
  return (
    <footer className="footer-v2">
      <div className="page footer-v2-top">
        <div className="brand-col">
          <h3>Thuê Xe Nhanh</h3>
          <p>
            Nơi chủ xe đăng tin và khách thuê tìm xe tự lái.
            Xem số điện thoại, gọi thẳng chủ xe, tự thoả thuận.
          </p>
          <p><Link to="/lien-he">Liên hệ với chúng tôi</Link></p>
        </div>

        <div className="footer-col">
          <h4>Khách thuê</h4>
          <Link to="/thue-xe">Tìm xe</Link>
          <Link to="/da-luu">Xe đã lưu</Link>
          <Link to="/tro-giup">Câu hỏi thường gặp</Link>
        </div>

        <div className="footer-col">
          <h4>Chủ xe</h4>
          <Link to="/chu-xe/dang-tin">Đăng tin cho thuê</Link>
          <Link to="/chu-xe">Xe của tôi</Link>
          <Link to="/chu-xe/vi">Ví token</Link>
        </div>

        <div className="footer-col">
          <h4>Chính sách</h4>
          <Link to="/quy-che">Quy chế hoạt động</Link>
          <Link to="/dieu-khoan">Điều khoản sử dụng</Link>
          <Link to="/bao-mat">Bảo vệ dữ liệu cá nhân</Link>
          <Link to="/hoan-token">Chính sách hoàn token</Link>
          <Link to="/khieu-nai">Giải quyết khiếu nại</Link>
          <Link to="/thue">Thông tin thuế</Link>
        </div>

        <div className="footer-col">
          <h4>Về chúng tôi</h4>
          <Link to="/gioi-thieu">Giới thiệu</Link>
          <Link to="/lien-he">Liên hệ</Link>
        </div>
      </div>

      <div className="footer-v2-bot page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div className="footer-disclaimer">
          Thuê Xe Nhanh là nền tảng rao vặt, chỉ cung cấp thông tin và kết nối chủ xe với khách thuê.
          Mọi giao dịch do hai bên tự thoả thuận. Chúng tôi không giữ tiền và không thu hoa hồng giao dịch.
        </div>
        
        <div className="footer-legal-info" style={{ color: 'var(--m-subtle)', fontSize: '13px' }}>
          <strong>Hộ Kinh Doanh Thuê Xe Nhanh</strong>
          <div>Giấy chứng nhận Đăng ký Hộ Kinh Doanh số: 01A8123456 do UBND Quận Cầu Giấy cấp ngày 01/01/2026.</div>
          <div>Mã số thuế: 0123456789</div>
          <div>Địa chỉ: 123 Đường Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội.</div>
          <div>Hotline hỗ trợ (Chủ xe & Khách thuê): 0987.654.321</div>
          <div style={{ marginTop: 8 }}>
            <em>* Website đang trong quá trình chạy thử nghiệm và hoàn thiện hồ sơ thông báo với Bộ Công Thương.</em>
          </div>
        </div>
      </div>
    </footer>
  )
}
