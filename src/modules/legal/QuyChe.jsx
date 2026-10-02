import { Link } from 'react-router-dom'
import LegalLayout, { Muc, DanhSach, DanhSachNhan, KhoiPhapNhan } from './LegalLayout'
import { VAN_BAN, DA_THONG_BAO_BCT, THOI_HAN } from './phienBan'
import { TOKEN_VND, TOKENS_PER_MONTH } from '../../lib/config'
import { formatVnd } from '../../lib/format'

/**
 * Quy chế hoạt động — NGHIEN-CUU-PHAP-LY.md §3A.
 *
 * Văn bản mà quy định về thương mại điện tử đòi hỏi sàn phải công bố.
 * CẤM gắn logo / mã xác thực Bộ Công Thương khi DA_THONG_BAO_BCT còn false.
 */
export default function QuyChe() {
  return (
    <LegalLayout
      title="Quy chế hoạt động"
      van={VAN_BAN.operation}
      moTa="Quy chế này mô tả cách nền tảng Thuê Xe Nhanh hoạt động: ai được làm gì, tin đăng đi qua những bước nào, vi phạm thì xử lý ra sao."
    >
      <Muc n="1" title="Đơn vị vận hành và phạm vi">
        <KhoiPhapNhan />
        <p className="t-body">
          Thuê Xe Nhanh là nền tảng rao tin cho thuê xe tự lái. Nền tảng cung cấp <b>chỗ đăng tin
          và công cụ tìm tin</b>; việc thuê xe do chủ xe và khách thuê trực tiếp thoả thuận và thực
          hiện với nhau. Nền tảng không cho thuê xe, không nhận tiền thuê, không giữ tiền cọc, không
          thu hoa hồng trên giao dịch của hai bên.
        </p>
      </Muc>

      <Muc n="2" title="Các từ dùng trong quy chế">
        <DanhSachNhan items={[
          ['Nền tảng', 'website và ứng dụng Thuê Xe Nhanh, do đơn vị vận hành nêu ở mục 1 quản lý.'],
          ['Chủ xe', 'người đăng ký tài khoản để đăng tin cho thuê xe của mình.'],
          ['Khách thuê', 'người dùng nền tảng để tìm xe và liên hệ chủ xe.'],
          ['Tin đăng', 'một mục rao của một chiếc xe cụ thể, gắn với một biển số.'],
          ['Token', `đơn vị tính phí hiển thị tin trong ví của chủ xe. 1 token = ${formatVnd(TOKEN_VND)}.`],
          ['Huy hiệu xác minh', 'nhãn cho biết giấy tờ chủ xe đã được đối chiếu. Xét theo giấy tờ, miễn phí, không bán.'],
        ]} />
      </Muc>

      <Muc n="3" title="Quyền và nghĩa vụ của nền tảng">
        <p className="t-body"><b>Nền tảng có quyền:</b></p>
        <DanhSach items={[
          'Duyệt tin trước khi cho hiển thị, và từ chối tin không đạt kèm lý do.',
          'Ẩn tin, gỡ tin, thu hồi huy hiệu xác minh hoặc khoá tài khoản khi phát hiện vi phạm.',
          'Yêu cầu chủ xe cung cấp giấy tờ để đối chiếu khi có dấu hiệu tin không đúng sự thật.',
          'Quy định và thay đổi mức phí hiển thị tin, có thông báo trước khi áp dụng.',
          'Tạm dừng một phần hoặc toàn bộ dịch vụ để bảo trì, có thông báo khi có thể.',
        ]} />
        <p className="t-body"><b>Nền tảng có nghĩa vụ:</b></p>
        <DanhSach items={[
          'Công bố công khai quy chế này, điều khoản sử dụng, chính sách bảo vệ dữ liệu cá nhân và chính sách hoàn token.',
          'Duyệt tin và nêu lý do rõ ràng khi từ chối, để chủ xe sửa được.',
          'Bảo vệ dữ liệu cá nhân của người dùng theo chính sách đã công bố.',
          'Ghi sổ ví token minh bạch: mọi lần nạp và mọi lần trừ đều có dòng trong sổ, chủ xe xem được.',
          `Tiếp nhận và trả lời khiếu nại theo thời hạn đã cam kết (${THOI_HAN.tiepNhanKhieuNai} để xác nhận, ${THOI_HAN.xuLyKhieuNai} để trả lời).`,
          'Hợp tác với cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp.',
        ]} />
        <p className="t-body">
          Nền tảng <b>không</b> bảo đảm chất lượng xe, không bảo đảm chủ xe sẽ giao xe, không bảo
          đảm tin đăng sẽ có khách, và không tham gia giải quyết tranh chấp giữa hai bên với tư cách
          trọng tài (xem <Link to="/khieu-nai">Giải quyết khiếu nại</Link>).
        </p>
      </Muc>

      <Muc n="4" title="Quyền và nghĩa vụ của chủ xe">
        <p className="t-body"><b>Chủ xe có quyền:</b></p>
        <DanhSach items={[
          'Đăng tin cho xe mình có quyền cho thuê, tự đặt giá và điều kiện thuê.',
          'Xem thống kê lượt xem và lượt lấy số của từng tin.',
          'Sửa, ẩn hoặc xoá tin của mình bất cứ lúc nào.',
          'Xin xét huy hiệu xác minh miễn phí.',
          'Khiếu nại khi tin bị từ chối hoặc bị gỡ, hoặc khi token bị trừ sai.',
        ]} />
        <p className="t-body"><b>Chủ xe có nghĩa vụ:</b></p>
        <DanhSach items={[
          'Chỉ đăng xe thuộc sở hữu của mình hoặc xe mình có quyền cho thuê hợp pháp.',
          'Bảo đảm xe có đăng ký, đăng kiểm và bảo hiểm còn hiệu lực theo quy định.',
          'Đăng thông tin và ảnh đúng xe thật, đúng giá, đúng điều kiện thuê. Với xe điện, khai đúng chính sách sạc và pin.',
          'Không đăng trùng một xe thành nhiều tin.',
          'Trả phí hiển thị tin theo mức đã công bố.',
          'Tự kê khai và nộp thuế phát sinh từ việc cho thuê xe (xem Thông tin thuế).',
          'Giữ liên lạc với khách qua số điện thoại đã đăng, và tự chịu trách nhiệm trong giao dịch thuê với khách.',
        ]} />
      </Muc>

      <Muc n="5" title="Quyền và nghĩa vụ của khách thuê">
        <p className="t-body"><b>Khách thuê có quyền:</b></p>
        <DanhSach items={[
          'Tìm và xem tin đăng miễn phí; xem số điện thoại chủ xe miễn phí.',
          'Lưu lại xe mình quan tâm.',
          'Báo cáo tin có dấu hiệu sai sự thật hoặc lừa đảo.',
          'Yêu cầu chủ xe cho xem giấy tờ xe và lập hợp đồng trước khi nhận xe.',
        ]} />
        <p className="t-body"><b>Khách thuê có nghĩa vụ:</b></p>
        <DanhSach items={[
          'Có giấy phép lái xe hợp lệ và còn hiệu lực với loại xe mình thuê.',
          'Tự kiểm tra xe và giấy tờ xe khi nhận, và tự thoả thuận các điều kiện với chủ xe.',
          'Dùng xe đúng pháp luật: không chở hàng cấm, không dùng xe vào việc trái pháp luật, không cầm cố hay chuyển cho người khác thuê lại.',
          'Không dùng số điện thoại lấy từ nền tảng để quảng cáo, quấy rối hay thu thập hàng loạt.',
          'Không báo cáo tin sai sự thật nhằm hạ tin của chủ xe khác.',
        ]} />
      </Muc>

      <Muc n="6" title="Quy trình đăng tin và kiểm duyệt">
        <p className="t-body">Một tin đăng đi qua các trạng thái sau:</p>
        <DanhSachNhan items={[
          ['Nháp', 'chủ xe đang điền, chưa ai thấy.'],
          ['Chờ duyệt', 'chủ xe đã gửi. Nền tảng đối chiếu thông tin, ảnh và biển số.'],
          ['Bị từ chối', 'không đạt. Nền tảng nêu rõ lý do để chủ xe sửa và gửi lại. Token của tin bị từ chối được hoàn toàn bộ về ví.'],
          ['Đang hiển thị', 'đã duyệt và đã trả phí hiển thị. Khách tìm thấy được.'],
          ['Sắp hết hạn', 'gần tới ngày hết hạn. Nền tảng nhắc chủ xe gia hạn.'],
          ['Hết hạn', 'không còn hiển thị. Tin vẫn được giữ để chủ xe gia hạn hoặc đăng lại.'],
          ['Ẩn', 'chủ xe tự ẩn, hoặc nền tảng ẩn để kiểm tra, hoặc gỡ do vi phạm.'],
        ]} />
        <p className="t-body">
          Tin không thể tự nhảy sang trạng thái đang hiển thị: việc duyệt do nền tảng thực hiện ở
          phía máy chủ, không phụ thuộc thao tác của người đăng. Một biển số chỉ có một tin đang
          hiển thị tại một thời điểm.
        </p>
      </Muc>

      <Muc n="7" title="Xử lý vi phạm">
        <p className="t-body">Tuỳ mức độ và số lần tái phạm, nền tảng áp dụng:</p>
        <DanhSachNhan items={[
          ['Nhắc và yêu cầu sửa', 'với lỗi nhẹ: ảnh mờ, mô tả thiếu, sai thông tin không trọng yếu.'],
          ['Tự động ẩn để kiểm tra', 'khi một tin nhận nhiều báo cáo. Tin được mở lại nếu kiểm tra cho thấy báo cáo không đúng.'],
          ['Gỡ tin', 'với tin sai sự thật, xe không có quyền cho thuê, hoặc ảnh không phải xe thật. Phí đã dùng cho tin bị gỡ do vi phạm không được hoàn.'],
          ['Thu hồi huy hiệu xác minh', 'khi giấy tờ đã hết hiệu lực hoặc phát hiện giấy tờ không đúng.'],
          ['Khoá tài khoản', 'với hành vi lừa đảo, tái phạm nhiều lần, hoặc theo yêu cầu của cơ quan có thẩm quyền.'],
        ]} />
        <p className="t-body">
          Người bị xử lý có quyền khiếu nại theo{' '}
          <Link to="/khieu-nai">Giải quyết khiếu nại</Link>.
        </p>
      </Muc>

      <Muc n="8" title="Phí và cách thanh toán">
        <p className="t-body">
          Khoản phí duy nhất trên nền tảng là <b>phí hiển thị tin đăng</b>, do chủ xe trả:{' '}
          <b>{TOKENS_PER_MONTH} token cho một xe trong một tháng</b>, tức{' '}
          {formatVnd(TOKEN_VND * TOKENS_PER_MONTH)}. Nhiều tháng thì tính tuyến tính theo số tháng.
          Khách thuê <b>không trả phí gì</b> cho nền tảng.
        </p>
        <p className="t-body">
          Chủ xe nạp token bằng chuyển khoản vào ví của mình, rồi dùng token để trả phí hiển thị.
          Nền tảng không nhận tiền thuê xe và không nhận tiền cọc. Việc hoàn token theo{' '}
          <Link to="/hoan-token">Chính sách hoàn token</Link>.
        </p>
      </Muc>

      <Muc n="9" title="Bảo vệ thông tin cá nhân">
        <p className="t-body">
          Theo <Link to="/bao-mat">Chính sách bảo vệ dữ liệu cá nhân</Link>. Điểm cần biết trước khi
          đăng tin: <b>số điện thoại của chủ xe hiển thị công khai</b> cho khách bấm xem — đó là
          cách nền tảng kết nối hai bên.
        </p>
      </Muc>

      <Muc n="10" title="Tình trạng đăng ký với cơ quan quản lý">
        {DA_THONG_BAO_BCT ? (
          <p className="t-body">
            Website đã được thông báo với cơ quan quản lý nhà nước về thương mại điện tử.
          </p>
        ) : (
          <p className="t-body">
            Nền tảng <b>chưa hoàn tất thủ tục thông báo website thương mại điện tử</b> với cơ quan
            quản lý nhà nước. Việc này đang được thực hiện, và cho tới khi xong, nền tảng chưa mở
            cho người dùng thật. Chúng tôi <b>không</b> gắn logo hay mã xác thực của cơ quan quản lý
            khi chưa được cấp.
          </p>
        )}
      </Muc>

      <Muc n="11" title="Sửa đổi quy chế">
        <p className="t-body">
          Khi quy chế thay đổi, chúng tôi tăng số phiên bản và ngày hiệu lực ở đầu trang. Thay đổi
          làm tăng nghĩa vụ của người dùng sẽ được thông báo trước khi áp dụng.
        </p>
      </Muc>
    </LegalLayout>
  )
}
