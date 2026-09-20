import LegalLayout from './LegalLayout'
import { TOKEN_VND, TOKENS_PER_MONTH } from '../../lib/config'
import { formatVnd } from '../../lib/format'

const CAU_HOI = [
  ['Làm sao để đăng xe?', 'Đăng nhập bằng Google, vào “Đăng tin xe”, điền thông tin và ảnh xe rồi gửi duyệt. Tin được hiển thị sau khi duyệt và trả phí hiển thị.'],
  ['Token là gì?', `Token là số dư trong ví để trả phí hiển thị tin. 1 token = ${formatVnd(TOKEN_VND)}; một xe hiển thị 1 tháng tốn ${TOKENS_PER_MONTH} token. Chi tiết ở Chính sách hoàn token.`],
  ['Vì sao tin của tôi bị ẩn?', 'Tin có thể bị ẩn khi hết hạn, bị từ chối duyệt, vi phạm điều khoản, hoặc nhận nhiều báo cáo cần kiểm tra.'],
  ['Báo cáo tin sai ở đâu?', 'Trên trang chi tiết của xe có nút báo cáo tin. Bạn cũng có thể liên hệ qua trang Liên hệ.'],
  ['Thuexenhanh có giữ tiền cọc không?', 'Không. Tiền thuê và tiền cọc do bạn và chủ xe tự thoả thuận. Thuexenhanh không tham gia dòng tiền.'],
  ['Tích xanh có mất phí không?', 'Không. Tích xanh xét theo giấy tờ và hoàn toàn miễn phí.'],
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
    </LegalLayout>
  )
}
