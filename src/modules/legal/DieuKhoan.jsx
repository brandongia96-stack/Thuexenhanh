import { Link } from 'react-router-dom'
import LegalLayout, { Muc, DanhSach } from './LegalLayout'
import { VAN_BAN } from './phienBan'

export default function DieuKhoan() {
  return (
    <LegalLayout title="Điều khoản sử dụng" van={VAN_BAN.terms}>
      <p className="t-body">
        Khi đăng nhập hoặc sử dụng Thuexenhanh, bạn đồng ý với các điều khoản dưới đây. Chúng tôi viết ngắn và thẳng để bạn hiểu đúng Thuexenhanh làm gì và không làm gì.
      </p>
      <Muc n="1" title="Thuexenhanh là nền tảng thông tin">
        <p className="t-body">
          Thuexenhanh là trang rao vặt: chủ xe đăng tin, khách thuê xem tin và liên hệ trực tiếp với chủ xe. Thuexenhanh <b>không phải bên cho thuê xe</b>, không phải đại lý, không phải bên môi giới đứng giữa hai bên.
        </p>
      </Muc>
      <Muc n="2" title="Không thu hoa hồng, không giữ tiền">
        <p className="t-body">
          Thuexenhanh không nhận, không giữ, không chuyển tiền thuê xe hay tiền cọc. Giá thuê, tiền cọc, thời gian và cách giao nhận xe do chủ xe và khách thuê tự thoả thuận với nhau. Thuexenhanh không thu phần trăm trên giao dịch của hai bên.
        </p>
      </Muc>
      <Muc n="3" title="Phí trên nền tảng">
        <p className="t-body">
          Khoản phí duy nhất là <b>phí hiển thị tin đăng</b> của chủ xe, trả bằng token đã nạp vào ví. Đây không phải phí giao dịch và không bảo đảm có khách thuê. Việc hoàn token được nêu ở <Link to="/hoan-token">Chính sách hoàn token</Link>.
        </p>
      </Muc>
      <Muc n="4" title="Trách nhiệm của chủ xe">
        <DanhSach items={[
          'Chủ xe tự chịu trách nhiệm về tính chính xác của thông tin, hình ảnh và giá trong tin đăng.',
          'Chủ xe tự chịu trách nhiệm về tính pháp lý của xe: đăng ký, đăng kiểm, bảo hiểm, quyền cho thuê và các giấy tờ theo quy định pháp luật.',
          'Chủ xe chỉ đăng xe của mình hoặc xe mình có quyền cho thuê, và không đăng trùng một xe nhiều tin.',
        ]} />
      </Muc>
      <Muc n="5" title="Giới hạn trách nhiệm của Thuexenhanh">
        <p className="t-body">
          Trong phạm vi pháp luật cho phép, Thuexenhanh không chịu trách nhiệm về chất lượng xe, tình trạng xe, tai nạn, hư hỏng, mất mát, mất tiền cọc hay tranh chấp phát sinh giữa chủ xe và khách thuê. Ký hợp đồng thuê, kiểm tra giấy tờ và kiểm tra xe trước khi nhận là việc của hai bên. Nhãn “Đã xác minh” chỉ cho biết giấy tờ của chủ xe đã được đối chiếu tại thời điểm xét, không phải bảo đảm về chuyến thuê.
        </p>
      </Muc>
      <Muc n="6" title="Điều cấm">
        <DanhSach items={[
          'Đăng thông tin sai sự thật, ảnh không phải xe thật, hoặc xe không thuộc quyền của mình.',
          'Lừa đảo, thu tiền cọc rồi không giao xe, hoặc yêu cầu chuyển tiền trước một cách bất thường.',
          'Dùng số điện thoại của người khác để spam, quấy rối hoặc thu thập hàng loạt.',
          'Can thiệp kỹ thuật, tự nâng huy hiệu xác minh hoặc gian lận số liệu.',
        ]} />
      </Muc>
      <Muc n="7" title="Khoá tài khoản và gỡ tin">
        <p className="t-body">
          Thuexenhanh có thể ẩn tin, gỡ tin hoặc khoá tài khoản khi tin vi phạm điều cấm, bị báo cáo nhiều lần và được xác nhận là sai, hoặc theo yêu cầu của cơ quan có thẩm quyền. Khi gỡ vì vi phạm, phí đã dùng cho tin đó không được hoàn.
        </p>
      </Muc>
      <Muc n="8" title="Thay đổi điều khoản">
        <p className="t-body">
          Khi điều khoản thay đổi, chúng tôi tăng số phiên bản và ngày hiệu lực ở đầu trang, và có thể yêu cầu bạn đồng ý lại. Thời điểm và phiên bản bạn đồng ý được lưu lại.
        </p>
      </Muc>
    </LegalLayout>
  )
}
