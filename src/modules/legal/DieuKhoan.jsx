import { Link } from 'react-router-dom'
import LegalLayout, { Muc, DanhSach } from './LegalLayout'
import { VAN_BAN } from './phienBan'

/**
 * Điều khoản sử dụng.
 *
 * Phiên bản 1.1 (02/10/2026) thêm mục 5 (trách nhiệm khách thuê), mục 6
 * (khuyến nghị lập hợp đồng) và mục 8 (sự cố nghiêm trọng) theo
 * NGHIEN-CUU-PHAP-LY.md §3E, §3F.
 *
 * CẤM thêm câu hứa nền tảng không làm được: bảo hiểm chuyến thuê, xác thực
 * GPLX, bồi thường, tổng đài 24/7, "mẫu hợp đồng tải về" khi chưa có file thật.
 */
export default function DieuKhoan() {
  return (
    <LegalLayout
      title="Điều khoản sử dụng"
      van={VAN_BAN.terms}
      moTa="Khi đăng nhập hoặc sử dụng Thuê Xe Nhanh, bạn đồng ý với các điều khoản dưới đây. Chúng tôi viết ngắn và thẳng để bạn hiểu đúng nền tảng làm gì và không làm gì."
    >
      <Muc n="1" title="Thuê Xe Nhanh là nền tảng thông tin">
        <p className="t-body">
          Thuê Xe Nhanh là trang rao tin: chủ xe đăng tin, khách thuê xem tin và liên hệ trực tiếp
          với chủ xe. Chúng tôi <b>không phải bên cho thuê xe</b>, không phải đại lý, không phải bên
          môi giới đứng giữa hai bên. Cách nền tảng hoạt động được mô tả đầy đủ ở{' '}
          <Link to="/quy-che">Quy chế hoạt động</Link>.
        </p>
      </Muc>

      <Muc n="2" title="Không thu hoa hồng, không giữ tiền">
        <p className="t-body">
          Chúng tôi không nhận, không giữ, không chuyển tiền thuê xe hay tiền cọc. Giá thuê, tiền
          cọc, thời gian và cách giao nhận xe do chủ xe và khách thuê tự thoả thuận với nhau. Chúng
          tôi không thu phần trăm trên giao dịch của hai bên.
        </p>
      </Muc>

      <Muc n="3" title="Phí trên nền tảng">
        <p className="t-body">
          Khoản phí duy nhất là <b>phí hiển thị tin đăng</b> của chủ xe, trả bằng token đã nạp vào
          ví. Đây không phải phí giao dịch và không bảo đảm tin sẽ có khách. Khách thuê không trả
          phí gì cho nền tảng. Việc hoàn token được nêu ở{' '}
          <Link to="/hoan-token">Chính sách hoàn token</Link>.
        </p>
      </Muc>

      <Muc n="4" title="Trách nhiệm của chủ xe">
        <DanhSach items={[
          'Chỉ đăng xe thuộc sở hữu của mình hoặc xe mình có quyền cho thuê hợp pháp. Xe đi thuê lại, xe đang cầm cố hay xe của người khác mà không được uỷ quyền thì không được đăng.',
          'Bảo đảm giấy tờ xe hợp lệ và còn hiệu lực: đăng ký xe, đăng kiểm, bảo hiểm bắt buộc theo quy định.',
          'Chịu trách nhiệm về tính chính xác của mọi thông tin trong tin đăng: ảnh đúng xe thật, giá đúng, tình trạng xe đúng, điều kiện thuê đúng.',
          'Với xe điện, khai đúng chính sách sạc và pin: quãng đường thực tế, mức pin khi giao, ai trả tiền sạc, có được dùng trạm sạc nào.',
          'Khai đúng tiền cọc, phí giao xe và các khoản thu thêm. Không thu thêm khoản mà tin đăng không nêu.',
          'Không đăng trùng một xe thành nhiều tin.',
          'Tự kê khai và nộp thuế phát sinh từ việc cho thuê xe — xem Thông tin thuế.',
        ]} />
      </Muc>

      <Muc n="5" title="Trách nhiệm của khách thuê">
        <DanhSach items={[
          'Có giấy phép lái xe hợp lệ, còn hiệu lực và đúng loại xe mình thuê. Nền tảng không kiểm tra giấy phép lái xe của bạn — chủ xe tự kiểm tra khi giao xe.',
          'Tự kiểm tra xe và giấy tờ xe khi nhận và khi trả. Nên chụp ảnh tình trạng xe, số km và mức nhiên liệu hoặc mức pin ở cả hai thời điểm.',
          'Tuân thủ luật giao thông. Vi phạm giao thông trong thời gian thuê là trách nhiệm của người lái.',
          'Không dùng xe vào việc trái pháp luật, không chở hàng cấm, không dùng xe để đua hoặc chạy thử tốc độ.',
          'Không cầm cố, không bán, không cho người khác thuê lại chiếc xe mình đang thuê.',
          'Trả xe đúng hẹn và đúng tình trạng đã thoả thuận.',
          'Không dùng số điện thoại lấy được trên nền tảng để quảng cáo, quấy rối hay thu thập hàng loạt.',
        ]} />
      </Muc>

      <Muc n="6" title="Chúng tôi khuyên hai bên lập giấy tờ">
        <p className="t-body">
          Vì chúng tôi không đứng giữa giao dịch, giấy tờ giữa hai bên là thứ duy nhất bảo vệ cả hai
          khi có chuyện. Chúng tôi <b>khuyến nghị</b> hai bên lập <b>hợp đồng thuê xe</b> và{' '}
          <b>biên bản bàn giao xe</b> trước khi giao chìa khoá, trong đó ghi rõ:
        </p>
        <DanhSach items={[
          'Thông tin hai bên và giấy phép lái xe của người lái.',
          'Xe, biển số, thời gian thuê, giá thuê và tổng tiền.',
          'Tiền cọc: bao nhiêu, bằng tiền hay xe máy kèm giấy tờ xe, trả lại khi nào.',
          'Giới hạn số km mỗi ngày và phí vượt, nếu có.',
          'Mức nhiên liệu hoặc mức pin khi giao và khi trả.',
          'Ai chịu chi phí gì khi xe hư, khi có tai nạn, khi bị phạt nguội.',
          'Cách xử lý khi một bên huỷ hoặc trả xe trễ.',
          'Ảnh tình trạng xe và số km tại thời điểm giao.',
        ]} />
        <p className="t-body">
          Gợi ý chi tiết hơn ở mục “Gợi ý để hai bên tự thoả thuận” trong{' '}
          <Link to="/tro-giup">Câu hỏi thường gặp</Link>, và <Link to="/mau-hop-dong">mẫu hợp đồng,
          biên bản bàn giao</Link> để tham khảo. Với giấy tờ của khách, chủ xe chỉ xem để đối chiếu rồi
          trả lại ngay, không giữ bản gốc — xem <Link to="/an-toan">An toàn cho chủ xe</Link>. Nền tảng
          không lưu giữ, không chứng thực và không là một bên trong hợp đồng của các bạn.
        </p>
      </Muc>

      <Muc n="7" title="Vai trò và cam kết của nền tảng">
        <p className="t-body">
          Thuê Xe Nhanh <b>không phải bên cho thuê xe</b> và không là một bên của hợp đồng thuê giữa
          chủ xe và khách thuê. Vì vậy chúng tôi không bảo đảm chất lượng xe, không bảo hiểm cho
          chuyến thuê, và không bồi thường thay cho bên nào những thiệt hại phát sinh từ chuyến thuê
          (tai nạn, hư hỏng, mất mát, tiền cọc, tiền phạt). Nhãn “Đã xác minh” chỉ cho biết giấy tờ
          của chủ xe đã được đối chiếu tại thời điểm xét, <b>không phải bảo đảm về chuyến thuê</b>.
        </p>
        <p className="t-body">
          Không phải bên cho thuê <b>không có nghĩa là chúng tôi đứng ngoài</b>. Chúng tôi cam kết:
        </p>
        <DanhSach items={[
          'Kiểm duyệt tin trước khi hiển thị, và kiểm tra lại khi có báo cáo.',
          'Gỡ tin vi phạm trong 24 giờ kể từ khi nhận được yêu cầu hợp lệ.',
          'Tiếp nhận và trả lời khiếu nại theo thời hạn nêu ở trang Giải quyết khiếu nại.',
          'Hợp tác với cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp.',
        ]} />
        <p className="t-body">
          Phần trách nhiệm của chúng tôi do chính nghĩa vụ trên và pháp luật quy định, không rộng hơn.
          Việc giải quyết tranh chấp giữa hai bên theo{' '}
          <Link to="/khieu-nai">Giải quyết khiếu nại</Link>.
        </p>
      </Muc>

      <Muc n="8" title="Sự cố nghiêm trọng">
        <p className="t-body">
          Khi xảy ra việc nghiêm trọng liên quan tới một xe hoặc một tài khoản trên nền tảng — xe bị
          chiếm giữ, bị cầm cố trái phép, bị dùng vào việc phạm pháp, hoặc có tai nạn gây thiệt hại
          lớn — chúng tôi làm những việc sau:
        </p>
        <DanhSach items={[
          'Hợp tác với cơ quan nhà nước có thẩm quyền và cung cấp thông tin tài khoản, tin đăng, lịch sử hoạt động khi có yêu cầu hợp pháp.',
          'Khoá tài khoản và gỡ tin của bên liên quan khi cần thiết để ngăn thiệt hại cho người khác.',
          'Giữ lại nội dung tin đăng và nhật ký hoạt động liên quan để phục vụ việc xác minh.',
        ]} />
        <p className="t-body">
          Chúng tôi <b>không</b> bồi thường thiệt hại, <b>không</b> đứng ra truy tìm xe hay người, và
          <b> không</b> thay cơ quan chức năng điều tra. Nếu có dấu hiệu hình sự, bên bị thiệt hại
          cần trình báo cơ quan công an — đó là việc chúng tôi không làm thay được.
        </p>
      </Muc>

      <Muc n="9" title="Điều cấm">
        <DanhSach items={[
          'Đăng thông tin sai sự thật, ảnh không phải xe thật, hoặc xe không thuộc quyền của mình.',
          'Lừa đảo, thu tiền cọc rồi không giao xe, hoặc yêu cầu chuyển tiền trước một cách bất thường.',
          'Dùng số điện thoại của người khác để spam, quấy rối hoặc thu thập hàng loạt.',
          'Can thiệp kỹ thuật, tự nâng huy hiệu xác minh, thổi lượt xem hoặc gian lận số liệu.',
          'Báo cáo tin sai sự thật nhằm hạ tin của chủ xe khác.',
          'Dùng nền tảng để rao thứ khác ngoài xe cho thuê tự lái.',
        ]} />
      </Muc>

      <Muc n="10" title="Khoá tài khoản và gỡ tin">
        <p className="t-body">
          Chúng tôi có thể ẩn tin, gỡ tin hoặc khoá tài khoản khi tin vi phạm điều cấm, bị báo cáo
          nhiều lần và được xác nhận là sai, hoặc theo yêu cầu của cơ quan có thẩm quyền. Tin vi phạm
          được gỡ trong 24 giờ kể từ khi chúng tôi nhận yêu cầu hợp lệ. Khi gỡ vì
          vi phạm, phí đã dùng cho tin đó không được hoàn. Các mức xử lý và quyền khiếu nại ở{' '}
          <Link to="/quy-che">Quy chế hoạt động</Link> mục 7.
        </p>
      </Muc>

      <Muc n="11" title="Thay đổi điều khoản">
        <p className="t-body">
          Khi điều khoản thay đổi, chúng tôi tăng số phiên bản và ngày hiệu lực ở đầu trang, và có
          thể yêu cầu bạn đồng ý lại. Thời điểm và phiên bản bạn đồng ý được lưu lại.
        </p>
      </Muc>
    </LegalLayout>
  )
}
