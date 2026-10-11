import { Link } from 'react-router-dom'
import LegalLayout, { Muc, DanhSachNhan } from './LegalLayout'
import { TOKEN_VND, TOKENS_PER_MONTH } from '../../lib/config'
import { formatVnd } from '../../lib/format'

const CAU_HOI = [
  ['Làm sao để đăng xe?', 'Đăng nhập bằng Google, vào “Đăng tin xe”, điền thông tin và ảnh xe rồi gửi duyệt. Tin được hiển thị sau khi duyệt và trả phí hiển thị.'],
  ['Token là gì?', `Token là số dư trong ví để trả phí hiển thị tin. 1 token = ${formatVnd(TOKEN_VND)}; một xe hiển thị 1 tháng tốn ${TOKENS_PER_MONTH} token. Chi tiết ở Chính sách hoàn token.`],
  ['Vì sao tin của tôi bị ẩn?', 'Tin có thể bị ẩn khi hết hạn, bị từ chối duyệt, vi phạm điều khoản, hoặc nhận nhiều báo cáo cần kiểm tra. Lý do được ghi trong bảng điều khiển chủ xe, và bạn có quyền khiếu nại.'],
  ['Báo cáo tin sai ở đâu?', 'Trên trang chi tiết của xe có nút báo cáo tin. Tin nhận nhiều báo cáo sẽ tự động bị ẩn để kiểm tra.'],
  ['Thuê Xe Nhanh có giữ tiền cọc không?', 'Không. Tiền thuê và tiền cọc do bạn và chủ xe tự thoả thuận và trả trực tiếp cho nhau. Chúng tôi không tham gia dòng tiền, nên cũng không hoàn cọc được cho ai.'],
  ['Tích xanh có mất phí không?', 'Không. Tích xanh xét theo giấy tờ và hoàn toàn miễn phí. Chúng tôi không bán huy hiệu này.'],
  ['Khách thuê có phải trả phí cho nền tảng không?', 'Không. Tìm xe và xem số điện thoại chủ xe đều miễn phí. Chỉ chủ xe trả phí hiển thị tin.'],
  ['Chủ xe có được giữ CCCD hay bằng lái gốc của khách không?', 'Không. Bạn xem giấy tờ gốc để đối chiếu rồi trả lại ngay cho khách. Cọc bằng tiền, hoặc xe máy kèm giấy tờ xe. Xem trang An toàn cho chủ xe.'],
  ['Tôi khiếu nại ở đâu?', 'Xem trang Giải quyết khiếu nại. Lưu ý có hai loại việc khác nhau: khiếu nại về nền tảng thì chúng tôi xử lý, còn tranh chấp giữa chủ xe và khách thì chúng tôi không phân xử được.'],
  ['Chủ xe có bị trừ thuế không?', 'Chúng tôi không thu tiền thuê xe nên không khấu trừ thuế của bạn; bạn tự kê khai. Xem trang Thông tin thuế, và nhớ xác nhận lại với kế toán.'],
]

// Gợi ý thay cho các chính sách mình KHÔNG có (huỷ chuyến, phí huỷ, giao nhận).
// NGHIEN-CUU-PHAP-LY.md §3 phần ⚪: đúng mô hình, mà vẫn giúp người thuê tối đa.
const GOI_Y = [
  ['Tiền cọc', 'Bao nhiêu, trả bằng hình thức gì (tiền, hoặc xe máy kèm giấy tờ xe), trả lại lúc nào và trong bao lâu sau khi trả xe. Không nên dùng CCCD hay bằng lái gốc làm vật cọc — xem rồi trả lại ngay.'],
  ['Huỷ hẹn', 'Huỷ trước bao lâu thì không mất gì, huỷ sát giờ thì mất bao nhiêu. Thống nhất cho cả hai chiều: khách huỷ và chủ xe huỷ.'],
  ['Trả xe trễ', 'Trễ bao nhiêu phút thì bắt đầu tính phí, tính theo giờ hay theo ngày, mức bao nhiêu.'],
  ['Nhiên liệu hoặc pin khi trả', 'Xe xăng: giao đầy thì trả đầy, hay giao bao nhiêu trả bao nhiêu. Xe điện: thống nhất mức pin phần trăm khi giao và khi trả, ai trả tiền sạc, có được dùng sạc nhanh không.'],
  ['Giới hạn số km', 'Bao nhiêu km mỗi ngày là trong giá, vượt thì bao nhiêu một km. Đi đường dài nên thống nhất trước, đây là khoản hay tranh cãi nhất sau khi trả xe.'],
  ['Hư hỏng nhỏ và trầy xước', 'Mức nào coi là hao mòn bình thường, mức nào khách phải chịu. Chụp ảnh toàn bộ xe lúc nhận là cách rẻ nhất để khỏi tranh cãi.'],
  ['Tai nạn và bảo hiểm', 'Xe có bảo hiểm gì, phần nào bảo hiểm trả, phần miễn thường ai chịu. Nếu xe chỉ có bảo hiểm bắt buộc thì nói rõ, đừng để khách tưởng có bảo hiểm thân vỏ.'],
  ['Phạt nguội', 'Vi phạm giao thông trong thời gian thuê thì ai nộp, và xử lý thế nào nếu thông báo phạt về sau khi đã trả xe và trả cọc.'],
  ['Giao và nhận xe', 'Địa điểm giao, địa điểm trả, ai trả phí giao xe, trễ hẹn giao thì thế nào.'],
  ['Giấy tờ cần có', 'Khách mang giấy phép lái xe còn hiệu lực. Chủ xe cho khách xem đăng ký, đăng kiểm và bảo hiểm còn hạn. Hai bên lập hợp đồng thuê và biên bản bàn giao có ảnh tình trạng xe, số km, mức nhiên liệu hoặc pin.'],
]

export default function HoiDap() {
  return (
    <LegalLayout title="Câu hỏi thường gặp">
      {CAU_HOI.map(([q, a]) => (
        <section key={q} className="stack">
          <h2 className="t-h3">{q}</h2>
          <p className="t-body">{a}</p>
        </section>
      ))}

      <Muc title="Gợi ý để hai bên tự thoả thuận">
        <p className="t-body">
          Chúng tôi không đặt chỗ, không giữ tiền và không có chính sách huỷ chuyến — hai bên tự
          thoả thuận với nhau. Đổi lại, không ai mất hoa hồng. Để việc tự thoả thuận không thành
          tranh cãi về sau, đây là những điểm nên thống nhất <b>trước khi giao chìa khoá</b>, tốt
          nhất là viết vào hợp đồng thuê và biên bản bàn giao:
        </p>
        <DanhSachNhan items={GOI_Y} />
        <p className="t-body">
          Danh sách các mục nên có trong hợp đồng ở mục 6 của{' '}
          <Link to="/dieu-khoan">Điều khoản sử dụng</Link>. Nếu đã xảy ra tranh chấp, xem{' '}
          <Link to="/khieu-nai">Giải quyết khiếu nại</Link> để biết chúng tôi giúp được gì và không
          giúp được gì.
        </p>
      </Muc>
    </LegalLayout>
  )
}
