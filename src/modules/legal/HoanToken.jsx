import LegalLayout, { Muc } from './LegalLayout'
import { VAN_BAN } from './phienBan'
import { TOKEN_VND, TOKENS_PER_MONTH } from '../../lib/config'
import { formatVnd } from '../../lib/format'

export default function HoanToken() {
  return (
    <LegalLayout title="Chính sách hoàn token" van={VAN_BAN.refund}>
      <p className="t-body">
        Token là số dư trong ví dùng để trả phí hiển thị tin đăng. 1 token = {formatVnd(TOKEN_VND)}. Hiển thị một xe trong 1 tháng tốn {TOKENS_PER_MONTH} token.
      </p>
      <Muc n="1" title="Token đã nạp có đổi lại thành tiền không?">
        <p className="t-body">
          Token còn chưa dùng trong ví có thể được hoàn lại thành tiền nếu bạn yêu cầu. Token đã dùng để hiển thị tin thì không hoàn thành tiền. Cách yêu cầu và thời hạn xử lý sẽ được công bố ở trang Liên hệ trước khi mở nạp tiền.
        </p>
      </Muc>
      <Muc n="2" title="Tin bị từ chối duyệt">
        <p className="t-body">Hoàn toàn bộ token của tin đó về ví ngay khi tin bị từ chối.</p>
      </Muc>
      <Muc n="3" title="Tin bị gỡ do vi phạm">
        <p className="t-body">Không hoàn token đã dùng cho tin bị gỡ vì vi phạm điều khoản.</p>
      </Muc>
      <Muc n="4" title="Tin hết hạn hoặc bạn tự ẩn tin">
        <p className="t-body">Phí đã trả cho thời gian hiển thị đã diễn ra không được hoàn lại.</p>
      </Muc>
      <Muc n="5" title="Token có hết hạn không?">
        <p className="t-body">Không. Token đã nạp không có hạn sử dụng.</p>
      </Muc>
      <Muc n="6" title="Nếu Thuexenhanh ngừng hoạt động">
        <p className="t-body">
          Chúng tôi sẽ thông báo trước và hoàn token chưa dùng thành tiền cho người dùng trong thời hạn thông báo đó.
        </p>
      </Muc>
    </LegalLayout>
  )
}
