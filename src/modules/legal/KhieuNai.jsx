import { Link } from 'react-router-dom'
import LegalLayout, { Muc, DanhSach, DanhSachNhan, KhoiLienHe } from './LegalLayout'
import { VAN_BAN, THOI_HAN } from './phienBan'

/**
 * Giải quyết khiếu nại — NGHIEN-CUU-PHAP-LY.md §3C.
 *
 * Luật của trang này: phân biệt dứt khoát hai loại việc.
 *   Loại 1 — khiếu nại VỀ NỀN TẢNG: mình xử lý, có thời hạn cam kết.
 *   Loại 2 — TRANH CHẤP GIỮA HAI BÊN: mình KHÔNG phải trọng tài.
 * Cấm hứa phân xử ai đúng ai sai, cấm hứa bồi thường, cấm hứa tổng đài 24/7.
 */
export default function KhieuNai() {
  return (
    <LegalLayout
      title="Giải quyết khiếu nại"
      van={VAN_BAN.complaint}
      moTa="Có hai loại việc rất khác nhau, và chúng tôi xử lý được một loại thôi. Bạn đọc mục 1 để biết việc của mình thuộc loại nào."
    >
      <Muc n="1" title="Việc của bạn thuộc loại nào">
        <DanhSachNhan items={[
          ['Loại 1 — khiếu nại về nền tảng', 'tin của bạn bị gỡ hoặc bị từ chối mà bạn cho là oan; token bị trừ sai; thống kê lượt xem có vấn đề; dữ liệu cá nhân của bạn bị dùng sai; một tin đăng trên nền tảng có dấu hiệu sai sự thật hoặc lừa đảo. Đây là việc của chúng tôi, mục 2.'],
          ['Loại 2 — tranh chấp giữa chủ xe và khách thuê', 'tiền cọc không được trả lại; xe không như tin đăng; xe bị hư hỏng và hai bên không thống nhất ai chịu; khách trả xe trễ; huỷ hẹn. Đây là tranh chấp giữa hai người với nhau, mục 3.'],
        ]} />
      </Muc>

      <Muc n="2" title="Khiếu nại về nền tảng">
        <p className="t-body"><b>Gửi ở đâu:</b></p>
        <KhoiLienHe />
        <p className="t-body"><b>Gửi gì để chúng tôi xử lý được:</b></p>
        <DanhSach items={[
          'Đường dẫn tới tin đăng, hoặc biển số xe trong tin.',
          'Email bạn dùng để đăng nhập, để chúng tôi tìm đúng tài khoản.',
          'Bạn muốn khiếu nại điều gì và mong muốn của bạn là gì.',
          'Ảnh chụp màn hình nếu có — nhất là với khiếu nại về trừ token hoặc về số liệu.',
        ]} />
        <p className="t-body"><b>Thời hạn chúng tôi cam kết:</b></p>
        <DanhSachNhan items={[
          ['Xác nhận đã nhận', `trong ${THOI_HAN.tiepNhanKhieuNai}.`],
          ['Trả lời kết quả', `trong ${THOI_HAN.xuLyKhieuNai} kể từ khi nhận đủ thông tin. Việc cần xác minh với bên thứ ba có thể lâu hơn, khi đó chúng tôi báo bạn lý do và thời hạn mới.`],
        ]} />
        <p className="t-body"><b>Kết quả có thể là:</b> giữ nguyên quyết định cũ và nêu lý do; khôi phục
          tin đã gỡ; hoàn token về ví nếu chúng tôi trừ sai; sửa hoặc xoá dữ liệu theo yêu cầu của
          bạn; xử lý tin hoặc tài khoản bị khiếu nại. Việc hoàn token theo{' '}
          <Link to="/hoan-token">Chính sách hoàn token</Link>.
        </p>
        <p className="t-body">
          Không đồng ý với kết quả, bạn gửi lại một lần nữa kèm thông tin mới. Sau đó, nếu vẫn
          không giải quyết được, bạn có quyền đưa việc ra cơ quan nhà nước có thẩm quyền hoặc toà án.
        </p>
      </Muc>

      <Muc n="3" title="Tranh chấp giữa chủ xe và khách thuê">
        <p className="t-body">
          Nói thẳng để bạn không mất thời gian chờ: <b>chúng tôi không phải trọng tài và không
          phân xử ai đúng ai sai trong chuyến thuê của bạn.</b> Chúng tôi không nhận tiền thuê,
          không giữ cọc, không có mặt lúc giao xe, nên không có cơ sở và cũng không có quyền quyết
          định việc đó.
        </p>
        <p className="t-body"><b>Việc chúng tôi làm được:</b></p>
        <DanhSach items={[
          'Giữ lại nội dung tin đăng tại thời điểm bạn liên hệ (giá, điều kiện thuê, ảnh xe) để bạn dùng làm bằng chứng.',
          'Cung cấp thông tin tài khoản và tin đăng khi có yêu cầu hợp pháp của cơ quan nhà nước có thẩm quyền.',
          'Ẩn tin, gỡ tin hoặc khoá tài khoản nếu qua phản ánh của bạn chúng tôi xác định bên kia vi phạm điều khoản của nền tảng.',
          'Ghi nhận để xử lý tài khoản tái phạm nhiều lần.',
        ]} />
        <p className="t-body"><b>Việc chúng tôi không làm:</b></p>
        <DanhSach items={[
          'Không quyết định ai phải trả lại cọc, ai phải bồi thường hư hỏng, mức bao nhiêu.',
          'Không bồi thường thay cho chủ xe hay khách thuê, vì chúng tôi không là một bên trong hợp đồng thuê và không thu hoa hồng từ chuyến thuê.',
          'Không giữ hộ tiền, không phong toả tiền của bên nào.',
          'Không cung cấp thông tin cá nhân của bên kia cho bạn khi không có yêu cầu hợp pháp — kể cả khi bạn đang là người bị thiệt.',
        ]} />
      </Muc>

      <Muc n="4" title="Hướng đi khi hai bên không tự giải quyết được">
        <DanhSachNhan items={[
          ['Thương lượng trực tiếp', 'dựa trên hợp đồng thuê và biên bản bàn giao xe mà hai bên đã lập. Đây là lý do chúng tôi luôn khuyên lập hai giấy này trước khi giao xe.'],
          ['Hoà giải', 'nhờ một bên thứ ba mà cả hai tin tưởng đứng ra hoà giải.'],
          ['Cơ quan bảo vệ quyền lợi người tiêu dùng', 'với tranh chấp mang tính tiêu dùng.'],
          ['Cơ quan công an', 'khi có dấu hiệu hình sự: chiếm giữ xe, cầm cố xe của người khác, lừa đảo chiếm đoạt tiền cọc.'],
          ['Toà án có thẩm quyền', 'khi các cách trên không xong.'],
        ]} />
      </Muc>

      <Muc n="5" title="Báo cáo một tin đăng cụ thể">
        <p className="t-body">
          Nhanh nhất là dùng nút báo cáo ngay trên trang xe đó — việc đó vào thẳng hàng chờ kiểm
          duyệt của chúng tôi. Một tin nhận nhiều báo cáo sẽ được <b>tự động ẩn để kiểm tra</b>
          trước khi có người xem xét, nên bạn không cần chờ chúng tôi mới ngăn được thiệt hại cho
          người sau. Báo cáo sai sự thật nhằm hạ tin của người khác là hành vi vi phạm điều khoản.
        </p>
      </Muc>

      <Muc n="6" title="Chúng tôi không hứa">
        <p className="t-body">
          Chúng tôi không có tổng đài trực 24/7, không có bảo hiểm cho chuyến thuê, không xác thực
          giấy phép lái xe của khách thuê, và không bảo đảm chất lượng xe. Nếu bạn cần những thứ
          đó, hãy chọn dịch vụ có đặt chỗ và giữ tiền — mô hình của chúng tôi là rao tin và để hai
          bên tự làm việc với nhau, đổi lại không ai mất hoa hồng. Phạm vi trách nhiệm đầy đủ ở{' '}
          <Link to="/dieu-khoan">Điều khoản sử dụng</Link>.
        </p>
      </Muc>
    </LegalLayout>
  )
}
