import { Link } from 'react-router-dom'
import { Printer } from 'lucide-react'
import LegalLayout, { Muc } from './LegalLayout'
import { VAN_BAN } from './phienBan'

const CHO = '........................................'

function Dong({ nhan, children }) {
  return <p className="t-body"><b>{nhan}</b> {children ?? CHO}</p>
}

/**
 * Mẫu hợp đồng thuê xe + biên bản bàn giao.
 *
 * Nhãn BẮT BUỘC, luôn hiện: "Mẫu tham khảo, các bên tự chịu trách nhiệm về
 * nội dung thoả thuận". Thuê Xe Nhanh không là một bên của hợp đồng, không
 * lưu, không chứng thực. Không có điều khoản bảo lãnh/bảo hiểm nào ở đây.
 * KHÔNG có ô "giữ CCCD/bằng lái gốc" — xem trang An toàn cho chủ xe.
 */
export default function MauHopDong() {
  return (
    <LegalLayout
      title="Mẫu hợp đồng và biên bản bàn giao"
      van={VAN_BAN.template}
      moTa="Hai mẫu để hai bên điền khi thuê xe tự lái. Bấm “In trang này” để in hoặc lưu thành tệp PDF."
    >
      <div className="disclaimer">
        <b>Mẫu tham khảo, các bên tự chịu trách nhiệm về nội dung thoả thuận.</b> Thuê Xe Nhanh không là
        một bên của hợp đồng, không lưu giữ và không chứng thực giấy tờ giữa hai bên. Bạn nên sửa mẫu
        cho đúng thoả thuận thực tế, và hỏi người có chuyên môn pháp lý nếu giá trị lớn.
      </div>

      <div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={18} strokeWidth={1.8} />
          In trang này
        </button>
      </div>

      <Muc title="Mẫu 1 — Hợp đồng thuê xe tự lái">
        <Dong nhan="Ngày lập:" />
        <p className="t-body"><b>Bên cho thuê (chủ xe)</b></p>
        <Dong nhan="Họ và tên:" />
        <Dong nhan="Số điện thoại:" />
        <Dong nhan="Số giấy tờ tuỳ thân:" />
        <p className="t-body"><b>Bên thuê (khách thuê)</b></p>
        <Dong nhan="Họ và tên:" />
        <Dong nhan="Số điện thoại:" />
        <Dong nhan="Số giấy tờ tuỳ thân:" />
        <Dong nhan="Số giấy phép lái xe, hạng, ngày hết hạn:" />

        <p className="t-body"><b>Điều 1. Xe cho thuê</b></p>
        <Dong nhan="Loại xe, biển số:" />
        <Dong nhan="Tình trạng xe, số km lúc giao:" />

        <p className="t-body"><b>Điều 2. Thời gian và giá thuê</b></p>
        <Dong nhan="Nhận xe lúc, tại:" />
        <Dong nhan="Trả xe lúc, tại:" />
        <Dong nhan="Giá thuê (đồng/ngày), tổng tiền:" />
        <Dong nhan="Giới hạn km mỗi ngày, phí vượt (đồng/km):" />
        <Dong nhan="Phí trả xe trễ:" />

        <p className="t-body"><b>Điều 3. Tiền cọc</b></p>
        <Dong nhan="Hình thức cọc (tiền hoặc xe máy kèm giấy tờ xe), giá trị:" />
        <Dong nhan="Thời điểm và cách hoàn trả cọc:" />
        <Dong nhan="Trường hợp được trừ cọc:" />

        <p className="t-body"><b>Điều 4. Nhiên liệu hoặc pin</b></p>
        <Dong nhan="Mức nhiên liệu hoặc phần trăm pin lúc giao, lúc trả; ai trả tiền sạc/đổ thêm:" />

        <p className="t-body"><b>Điều 5. Trách nhiệm của hai bên</b></p>
        <Dong nhan="Bên thuê dùng xe đúng pháp luật, giữ gìn xe, không cho người khác thuê lại hoặc cầm cố:">
          Đồng ý ☐
        </Dong>
        <Dong nhan="Hư hỏng, tai nạn, phạt giao thông trong thời gian thuê do ai chịu và xử lý thế nào:" />
        <Dong nhan="Bảo hiểm xe đang có (nếu có), phần miễn thường:" />

        <p className="t-body"><b>Điều 6. Huỷ và thay đổi</b></p>
        <Dong nhan="Huỷ trước bao lâu không mất phí; huỷ sát giờ mất bao nhiêu (áp dụng cho cả hai bên):" />

        <p className="t-body"><b>Điều 7. Giải quyết tranh chấp</b></p>
        <p className="t-body">Hai bên ưu tiên thương lượng. Không thương lượng được thì đưa ra cơ quan có thẩm quyền.</p>

        <p className="t-body">Chữ ký bên cho thuê: {CHO}</p>
        <p className="t-body">Chữ ký bên thuê: {CHO}</p>
      </Muc>

      <Muc title="Mẫu 2 — Biên bản bàn giao xe">
        <Dong nhan="Xe, biển số:" />
        <Dong nhan="Thời điểm bàn giao:" />
        <Dong nhan="Số km trên đồng hồ:" />
        <Dong nhan="Mức nhiên liệu hoặc phần trăm pin:" />
        <Dong nhan="Tình trạng ngoại thất (trầy xước, móp, nứt kính; đánh dấu trên ảnh chụp):" />
        <Dong nhan="Tình trạng nội thất (ghế, sàn, bảng điều khiển):" />
        <Dong nhan="Đèn, lốp, lốp dự phòng, kích, bộ đồ nghề:" />
        <Dong nhan="Giấy tờ xe đã giao kèm (đăng ký, đăng kiểm, bảo hiểm):" />
        <Dong nhan="Số ảnh đã chụp và nơi lưu:" />
        <Dong nhan="Ghi chú khác:" />

        <p className="t-body"><b>Khi trả xe:</b></p>
        <Dong nhan="Thời điểm trả:" />
        <Dong nhan="Số km, mức nhiên liệu hoặc pin lúc trả:" />
        <Dong nhan="Hư hỏng phát sinh (nếu có), hai bên thống nhất xử lý:" />
        <Dong nhan="Tiền cọc đã hoàn trả lúc:" />

        <p className="t-body">Chữ ký bên giao: {CHO}</p>
        <p className="t-body">Chữ ký bên nhận: {CHO}</p>
      </Muc>

      <p className="t-small">
        Mẫu này không yêu cầu và không khuyến khích giữ CCCD hay bằng lái gốc của khách. Xem{' '}
        <Link to="/an-toan">An toàn cho chủ xe</Link>.
      </p>
    </LegalLayout>
  )
}
