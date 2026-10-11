import { Link } from 'react-router-dom'
import { PHAP_NHAN, coPhapNhan } from '../modules/legal/phienBan'
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

        {/* <details> thuần: gập trên di động, luôn mở trên máy tính (CSS ép
            hiện, xem Footer.css) — không thêm JS/thư viện, chữ vẫn nằm trong
            DOM nên không ảnh hưởng SEO. */}
        <details className="footer-col">
          <summary><h4>Khách thuê</h4></summary>
          <Link to="/thue-xe">Tìm xe</Link>
          <Link to="/da-luu">Xe đã lưu</Link>
          <Link to="/tro-giup">Câu hỏi thường gặp</Link>
        </details>

        <details className="footer-col">
          <summary><h4>Chủ xe</h4></summary>
          <Link to="/chu-xe/dang-tin">Đăng tin cho thuê</Link>
          <Link to="/chu-xe">Xe của tôi</Link>
          <Link to="/chu-xe/vi">Ví token</Link>
        </details>

        <details className="footer-col">
          <summary><h4>Chính sách</h4></summary>
          <Link to="/quy-che">Quy chế hoạt động</Link>
          <Link to="/dieu-khoan">Điều khoản sử dụng</Link>
          <Link to="/bao-mat">Bảo vệ dữ liệu cá nhân</Link>
          <Link to="/hoan-token">Chính sách hoàn token</Link>
          <Link to="/khieu-nai">Giải quyết khiếu nại</Link>
          <Link to="/thue">Thông tin thuế</Link>
          <Link to="/an-toan">An toàn cho chủ xe</Link>
          <Link to="/mau-hop-dong">Mẫu hợp đồng</Link>
          <Link to="/an-toan">An toàn cho chủ xe</Link>
          <Link to="/mau-hop-dong">Mẫu hợp đồng</Link>
        </details>

        <details className="footer-col">
          <summary><h4>Về chúng tôi</h4></summary>
          <Link to="/gioi-thieu">Giới thiệu</Link>
          <Link to="/lien-he">Liên hệ</Link>
        </details>
      </div>

      <div className="footer-v2-bot page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div className="footer-disclaimer">
          Thuê Xe Nhanh là nền tảng rao vặt, chỉ cung cấp thông tin và kết nối chủ xe với khách thuê.
          Mọi giao dịch do hai bên tự thoả thuận. Chúng tôi không giữ tiền và không thu hoa hồng giao dịch.
        </div>

        {/* Thông tin pháp nhân lấy từ modules/legal/phienBan.js — rỗng thì ẩn cả khối.
            CẤM gõ thẳng thông tin vào đây: mã số / địa chỉ bịa là vi phạm §1.2. */}
        {coPhapNhan() && (
          <div className="footer-legal-info" style={{ color: 'var(--m-subtle)', fontSize: '13px' }}>
            {PHAP_NHAN.ten && <strong>{PHAP_NHAN.ten}</strong>}
            {PHAP_NHAN.maSo && <div>Mã số: {PHAP_NHAN.maSo}</div>}
            {PHAP_NHAN.diaChi && <div>Địa chỉ: {PHAP_NHAN.diaChi}</div>}
            {PHAP_NHAN.dienThoai && <div>Điện thoại: {PHAP_NHAN.dienThoai}</div>}
          </div>
        )}
      </div>
    </footer>
  )
}
