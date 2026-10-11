import { Link } from 'react-router-dom'
import LegalLayout, { Muc, DanhSach } from './LegalLayout'
import { VAN_BAN } from './phienBan'

/**
 * An toàn cho chủ xe.
 *
 * LUẬT CỨNG của trang này: KHÔNG BAO GIỜ khuyên giữ CCCD / bằng lái gốc làm
 * tài sản bảo đảm. Chỉ xem để đối chiếu rồi TRẢ LẠI NGAY. (NĐ 282/2025 —
 * số hiệu cần luật sư xác nhận.) Cọc bằng tiền hoặc xe máy kèm giấy tờ xe.
 * Cấm câu hứa nền tảng không làm được (bảo hiểm, bồi thường, xác thực GPLX).
 */
export default function AnToan() {
  return (
    <LegalLayout
      title="An toàn cho chủ xe"
      van={VAN_BAN.safety}
      moTa="Những việc nên làm trước khi giao chìa khoá cho một người bạn chưa từng gặp. Đây là gợi ý để bạn tự bảo vệ mình, không phải tư vấn pháp lý."
    >
      <Muc n="1" title="Giấy tờ của khách: xem rồi trả lại ngay">
        <p className="t-body">
          Hãy yêu cầu khách đưa <b>căn cước công dân (CCCD)</b> và <b>giấy phép lái xe (bằng lái)</b> bản
          gốc để đối chiếu. Xem xong thì <b>trả lại ngay cho khách</b>.
        </p>
        <DanhSach items={[
          'Đối chiếu ảnh trên giấy tờ với người đứng trước mặt, và xem bằng lái còn hạn, đúng hạng với loại xe bạn cho thuê.',
          'Ghi các thông tin cần thiết (họ tên, số giấy tờ, số điện thoại) vào hợp đồng thuê.',
          'Không giữ lại bản gốc giấy tờ tuỳ thân hoặc bằng lái của khách để làm tài sản bảo đảm.',
        ]} />
        <div className="disclaimer">
          <b>Không nhận giữ CCCD hay bằng lái gốc.</b> Pháp luật hiện hành không cho phép giữ giấy tờ
          tuỳ thân của người khác làm tài sản bảo đảm, và bạn có thể bị xử phạt. Chúng tôi không khuyên
          và không cho phép nội dung khuyên làm điều đó trên nền tảng. (Căn cứ: Nghị định 282/2025 —
          số hiệu và nội dung cần luật sư xác nhận.)
        </div>
      </Muc>

      <Muc n="2" title="Cọc bằng gì">
        <p className="t-body">Hai cách thường dùng, đều không cần giữ giấy tờ tuỳ thân của khách:</p>
        <DanhSach items={[
          'Cọc bằng tiền: chuyển khoản hoặc tiền mặt, có biên nhận ghi rõ số tiền và điều kiện trả lại.',
          'Cọc bằng xe máy kèm giấy tờ xe (đăng ký xe) của chính chiếc xe máy đó, ghi rõ trong biên bản.',
        ]} />
        <p className="t-body">
          Cả hai bên nên ghi vào hợp đồng: số tiền hoặc tài sản cọc, khi nào trả lại, và trường hợp nào
          được trừ cọc. Xem <Link to="/mau-hop-dong">mẫu hợp đồng và biên bản bàn giao</Link>.
        </p>
      </Muc>

      <Muc n="3" title="Trước khi giao xe">
        <DanhSach items={[
          'Lập hợp đồng và biên bản bàn giao, cả hai bên cùng ký.',
          'Cùng đi quanh xe, chụp ảnh các mặt, đồng hồ số km, mức nhiên liệu hoặc mức pin.',
          'Cho khách xem giấy tờ xe của bạn (đăng ký, đăng kiểm, bảo hiểm còn hạn) và ghi số điện thoại hai bên vào biên bản.',
          'Báo cho khách các điều kiện đã đăng: giới hạn km, khu vực đi, phí phát sinh.',
        ]} />
      </Muc>

      <Muc n="4" title="Dấu hiệu nên dừng lại">
        <DanhSach items={[
          'Người thuê từ chối cho xem giấy tờ gốc hoặc không đúng với người đến nhận xe.',
          'Người thuê nhờ người khác đứng ra nhận xe thay mà không có giấy uỷ quyền rõ ràng.',
          'Bị thúc ép đưa xe gấp, hoặc bị yêu cầu bỏ bước kiểm tra, bỏ hợp đồng để “cho nhanh”.',
          'Người thuê nhờ bạn chuyển tiền cho bên thứ ba trước khi nhận xe.',
          'Có dấu hiệu người thuê muốn mang xe đi cầm cố hoặc cho người khác thuê lại.',
        ]} />
        <p className="t-body">
          Trong các trường hợp này, bạn có quyền không giao xe. Nếu đã giao và nghi ngờ bị chiếm đoạt,
          trình báo cơ quan công an ngay — xem thêm <Link to="/dieu-khoan">Điều khoản sử dụng</Link> mục 8
          về việc chúng tôi hỗ trợ khi có yêu cầu hợp pháp.
        </p>
      </Muc>

      <Muc n="5" title="Trong thời gian cho thuê">
        <DanhSach items={[
          'Giữ liên lạc qua số điện thoại đã ghi trong hợp đồng.',
          'Nếu xe có thiết bị định vị của riêng bạn, thông báo cho khách biết trước.',
          'Có sự cố thì ghi lại thời gian, ảnh chụp và lời hai bên, để dùng khi thoả thuận hoặc làm việc với cơ quan có thẩm quyền.',
        ]} />
      </Muc>

      <Muc n="6" title="Chúng tôi không làm gì">
        <p className="t-body">
          Thuê Xe Nhanh không xác thực CCCD hay bằng lái của khách thuê, không bảo hiểm cho chuyến thuê,
          không bồi thường thay cho bên nào, và không có mặt lúc giao xe. Việc đối chiếu giấy tờ và bảo
          vệ chiếc xe là việc của bạn — trang này chỉ gợi ý cách làm an toàn hơn. Khi có tranh chấp, xem{' '}
          <Link to="/khieu-nai">Giải quyết khiếu nại</Link>.
        </p>
      </Muc>
    </LegalLayout>
  )
}
