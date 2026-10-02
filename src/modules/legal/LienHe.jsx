import { Link } from 'react-router-dom'
import LegalLayout, { Muc, KhoiPhapNhan, KhoiLienHe } from './LegalLayout'

export default function LienHe() {
  return (
    <LegalLayout title="Liên hệ">
      <Muc title="Đơn vị vận hành">
        <KhoiPhapNhan />
      </Muc>
      <Muc title="Gửi yêu cầu cho chúng tôi">
        <KhoiLienHe />
      </Muc>
      <Muc title="Tuỳ việc, có chỗ nhanh hơn">
        <p className="t-body">
          Phản ánh về một tin đăng cụ thể: dùng nút báo cáo ngay trên trang xe đó, việc sẽ vào thẳng
          hàng chờ kiểm duyệt. Khiếu nại về nền tảng hoặc tranh chấp với bên kia: xem{' '}
          <Link to="/khieu-nai">Giải quyết khiếu nại</Link> để biết chúng tôi xử lý loại nào và
          trong bao lâu.
        </p>
      </Muc>
    </LegalLayout>
  )
}
