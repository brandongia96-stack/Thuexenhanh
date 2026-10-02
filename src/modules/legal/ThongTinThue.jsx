import { Link } from 'react-router-dom'
import LegalLayout, { Muc, DanhSach, KhoiLienHe } from './LegalLayout'
import { VAN_BAN } from './phienBan'

/**
 * Thông tin thuế cho chủ xe — NGHIEN-CUU-PHAP-LY.md §3G.
 *
 * ⚠️ Mục này nhiều điểm chưa chắc. Luật quản lý thuế với kinh doanh qua nền
 * tảng số đặt nghĩa vụ khấu trừ thay lên nền tảng CÓ chức năng thanh toán;
 * mình không thu tiền thuê nên NHIỀU KHẢ NĂNG không khấu trừ — nhưng chưa
 * được kế toán/luật sư xác nhận.
 *
 * LUẬT VIẾT TRANG NÀY: mọi câu chưa chắc phải nói là chưa chắc. Cấm viết
 * như thể đã xác nhận. Cấm hứa xuất hoá đơn khi chưa có pháp nhân.
 */
export default function ThongTinThue() {
  return (
    <LegalLayout
      title="Thông tin thuế cho chủ xe"
      van={VAN_BAN.tax}
      moTa="Trang này giải thích nền tảng có trừ thuế của bạn hay không, và bạn cần tự làm gì. Đây là thông tin tham khảo, không phải tư vấn thuế."
    >
      <div className="disclaimer">
        <b>Bạn phải xác nhận lại với kế toán hoặc cơ quan thuế.</b> Chúng tôi không phải đơn vị tư
        vấn thuế. Quy định về thuế với kinh doanh qua nền tảng số đang thay đổi, và cách áp dụng còn
        tuỳ mức doanh thu cũng như hình thức kinh doanh của từng người. Đừng coi trang này là căn cứ
        để kê khai — hãy coi nó là danh sách việc cần đi hỏi.
      </div>

      <Muc n="1" title="Chúng tôi không trừ thuế của bạn">
        <p className="t-body">
          Nền tảng <b>không thu tiền thuê xe</b> của khách và không chuyển tiền thuê cho bạn — khách
          trả tiền trực tiếp cho bạn. Theo cách hiểu của chúng tôi, nghĩa vụ khấu trừ và nộp thuế
          thay đặt lên các nền tảng <b>có chức năng thanh toán</b>, tức nơi giữ và chuyển tiền của
          giao dịch. Vì vậy chúng tôi <b>không khấu trừ, không nộp thuế thay bạn</b>, và không phát
          hành chứng từ khấu trừ thuế cho bạn.
        </p>
        <p className="t-body">
          Đây là cách hiểu của chúng tôi dựa trên mô hình hoạt động thực tế, <b>chưa được cơ quan
          thuế xác nhận bằng văn bản</b>. Nếu sau này quy định hoặc cách áp dụng khác đi, chúng tôi
          sẽ thông báo và cập nhật trang này trước khi thay đổi điều gì.
        </p>
      </Muc>

      <Muc n="2" title="Bạn tự kê khai doanh thu cho thuê xe">
        <p className="t-body">
          Tiền khách trả cho bạn là doanh thu của bạn. Việc kê khai và nộp thuế với khoản đó là
          trách nhiệm của bạn, không phải của nền tảng. Nghĩa vụ này tồn tại bất kể bạn tìm khách
          qua nền tảng nào hay tự tìm.
        </p>
      </Muc>

      <Muc n="3" title="Chúng tôi có thể phải cung cấp thông tin cho cơ quan thuế">
        <p className="t-body">
          Việc không khấu trừ thuế <b>không</b> có nghĩa là hoạt động của bạn vô hình. Nền tảng có
          thể phải cung cấp thông tin về chủ xe và hoạt động đăng tin khi cơ quan thuế hoặc cơ quan
          nhà nước khác có <b>yêu cầu hợp pháp</b>. Chúng tôi sẽ làm đúng yêu cầu đó. Việc cung cấp
          dữ liệu trong trường hợp này được nêu ở{' '}
          <Link to="/bao-mat">Chính sách bảo vệ dữ liệu cá nhân</Link> mục 7.
        </p>
      </Muc>

      <Muc n="4" title="Phí hiển thị tin bạn trả cho chúng tôi">
        <p className="t-body">
          Phí hiển thị tin là khoản bạn trả cho nền tảng, tách biệt hoàn toàn với tiền thuê xe bạn
          thu từ khách. Mọi lần nạp token và mọi lần trừ token đều có dòng trong sổ ví của bạn, và
          bạn xem lại được bất cứ lúc nào.
        </p>
        <p className="t-body">
          <b>Về hoá đơn:</b> hiện chúng tôi chưa phát hành hoá đơn cho phí hiển thị tin, vì thủ tục
          pháp nhân đang được hoàn tất. Nếu bạn cần hoá đơn để hạch toán chi phí, liên hệ với chúng
          tôi <b>trước khi nạp token</b> để chúng tôi nói rõ hiện trạng, thay vì để bạn nạp rồi mới
          biết là chưa có.
        </p>
        <KhoiLienHe />
      </Muc>

      <Muc n="5" title="Bạn nên giữ lại những gì">
        <p className="t-body">
          Để tự kê khai được và để có bằng chứng khi cần, bạn nên giữ:
        </p>
        <DanhSach items={[
          'Hợp đồng thuê xe và biên bản bàn giao của từng chuyến.',
          'Biên nhận tiền cọc và tiền thuê, hoặc sao kê ngân hàng cho các khoản khách chuyển.',
          'Lịch sử giao dịch ví token của bạn trên nền tảng, làm bằng chứng cho chi phí quảng cáo tin.',
          'Giấy tờ xe và các chi phí liên quan tới xe: bảo hiểm, đăng kiểm, sửa chữa, sạc hoặc nhiên liệu.',
        ]} />
      </Muc>

      <Muc n="6" title="Những câu nên hỏi kế toán">
        <p className="t-body">
          Nếu bạn chỉ có thời gian hỏi một lần, hỏi đúng những câu này:
        </p>
        <DanhSach items={[
          'Doanh thu cho thuê xe của tôi đạt mức nào thì phải kê khai và nộp thuế?',
          'Tôi thuộc diện cá nhân cho thuê tài sản hay phải đăng ký hộ kinh doanh?',
          'Tôi phải nộp những loại thuế nào, tính trên doanh thu hay trên lợi nhuận?',
          'Kê khai theo kỳ nào, ở đâu, và cần giấy tờ gì?',
          'Nền tảng không khấu trừ thuế thì tôi cần làm thêm bước nào không?',
          'Chi phí phí hiển thị tin và chi phí bảo dưỡng xe có được tính trừ không?',
        ]} />
      </Muc>

      <Muc n="7" title="Chúng tôi không làm gì">
        <p className="t-body">
          Chúng tôi không kê khai thuế thay bạn, không tính số thuế bạn phải nộp, không đại diện bạn
          làm việc với cơ quan thuế, và không chịu trách nhiệm nếu bạn kê khai thiếu hoặc kê khai
          sai. Trách nhiệm của bạn theo mục 4 của{' '}
          <Link to="/dieu-khoan">Điều khoản sử dụng</Link>.
        </p>
      </Muc>
    </LegalLayout>
  )
}
