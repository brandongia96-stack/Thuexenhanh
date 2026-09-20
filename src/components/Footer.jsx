import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--m-border)', background: 'var(--m-surface)', marginTop: 'var(--sp-10)' }}>
      <div className="page stack" style={{ gap: 'var(--sp-3)' }}>
        <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
          <Link to="/dieu-khoan" className="t-small">Điều khoản sử dụng</Link>
          <Link to="/bao-mat" className="t-small">Chính sách bảo mật</Link>
          <Link to="/hoan-token" className="t-small">Chính sách hoàn token</Link>
          <Link to="/gioi-thieu" className="t-small">Về chúng tôi</Link>
          <Link to="/tro-giup" className="t-small">Câu hỏi thường gặp</Link>
          <Link to="/lien-he" className="t-small">Liên hệ</Link>
        </div>
        <p className="t-small">
          Thuexenhanh là nền tảng rao vặt, chỉ cung cấp thông tin và kết nối chủ xe với khách thuê.
          Mọi giao dịch do hai bên tự thoả thuận. Chúng tôi không giữ tiền và không thu hoa hồng giao dịch.
        </p>
      </div>
    </footer>
  )
}
