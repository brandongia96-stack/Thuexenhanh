import { Link } from 'react-router-dom'
import LegalLayout, { Muc, KhoiPhapNhan, KhoiLienHe } from './LegalLayout'
import { PHAP_NHAN, EMAIL_HO_TRO } from './phienBan'

export default function LienHe() {
  return (
    <LegalLayout title="Liên hệ">
      <Muc title="Đơn vị vận hành">
        <KhoiPhapNhan />
      </Muc>

      <Muc title="Kênh tiếp nhận & Hỗ trợ">
        <KhoiLienHe />
        <p className="t-body" style={{ marginTop: 'var(--sp-2)' }}>
          <strong>Thời gian làm việc:</strong> Thứ Hai – Thứ Sáu (08:00 – 17:30). Các yêu cầu khẩn cấp về gỡ bỏ tin vi phạm bản quyền hoặc dấu hiệu lừa đảo được tiếp nhận tự động 24/7.
        </p>
      </Muc>

      <Muc title="Kênh xử lý theo từng trường hợp">
        <ul className="stack" style={{ paddingLeft: '1.2em' }}>
          <li className="t-body">
            <strong>Báo cáo tin đăng giả mạo / giá sai:</strong> Nhấn nút <em>Báo cáo tin</em> ngay tại trang chi tiết chiếc xe đó để hệ thống đưa thẳng vào hàng chờ kiểm duyệt ưu tiên.
          </li>
          <li className="t-body">
            <strong>Khiếu nại về dịch vụ hoặc nạp token:</strong> Xem trang <Link to="/khieu-nai">Giải quyết khiếu nại</Link> hoặc tạo hồ sơ theo dõi tại <Link to="/tai-khoan/khieu-nai">Khiếu nại của tôi</Link>.
          </li>
          <li className="t-body">
            <strong>Sự cố xe trên đường:</strong> Tra cứu nhanh số điện thoại trạm cứu hộ gần nhất tại <Link to="/cuu-ho">Danh bạ cứu hộ 24/7</Link>.
          </li>
          <li className="t-body">
            <strong>Chủ xe có nhiều xe / đội xe:</strong> Cần hỗ trợ đăng tải hàng loạt theo danh sách hoặc tư vấn quản lý nhiều xe, liên hệ trực tiếp qua số hotline/Zalo {PHAP_NHAN.dienThoai} hoặc gửi email tới {EMAIL_HO_TRO}.
          </li>
          <li className="t-body">
            <strong>Thắc mắc về cách sử dụng:</strong> Xem phần giải đáp nhanh tại <Link to="/tro-giup">Câu hỏi thường gặp (FAQ)</Link>.
          </li>
        </ul>
      </Muc>

      <Muc title="Cam kết bảo mật thông tin liên hệ">
        <p className="t-body">
          Mọi thông tin bạn cung cấp khi liên hệ (email, số điện thoại, nội dung phản ánh) chỉ được sử dụng cho mục đích giải quyết yêu cầu và được bảo vệ theo <Link to="/bao-mat">Chính sách bảo vệ dữ liệu cá nhân</Link> của Thuê Xe Nhanh.
        </p>
      </Muc>
    </LegalLayout>
  )
}
