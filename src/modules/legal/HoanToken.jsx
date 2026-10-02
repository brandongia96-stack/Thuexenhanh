import { Link } from 'react-router-dom'
import LegalLayout, { Muc, KhoiLienHe } from './LegalLayout'
import { VAN_BAN, THOI_HAN } from './phienBan'
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
          Token còn <b>chưa dùng</b> trong ví được hoàn lại thành tiền nếu bạn yêu cầu. Token đã dùng
          để hiển thị tin thì không hoàn thành tiền.
        </p>
        <p className="t-body">
          <b>Cách yêu cầu:</b> gửi yêu cầu kèm email bạn dùng để đăng nhập và số tài khoản nhận tiền
          trùng tên với chủ tài khoản. <b>Thời hạn:</b> chúng tôi chuyển lại tiền trong{' '}
          <b>{THOI_HAN.hoanToken}</b> kể từ khi nhận đủ thông tin. Tiền được chuyển về đúng người đã
          nạp, không chuyển cho người khác.
        </p>
        <KhoiLienHe />
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
      <Muc n="6" title="Nếu Thuê Xe Nhanh ngừng hoạt động">
        <p className="t-body">
          Chúng tôi sẽ thông báo trước và hoàn token chưa dùng thành tiền cho người dùng trong thời hạn thông báo đó.
        </p>
      </Muc>
      <Muc n="7" title="Bạn cho rằng token bị trừ sai">
        <p className="t-body">
          Mọi lần nạp và mọi lần trừ token đều có một dòng trong sổ ví của bạn, nên bạn đối chiếu
          được. Nếu thấy một dòng không đúng, gửi khiếu nại theo{' '}
          <Link to="/khieu-nai">Giải quyết khiếu nại</Link>. Trừ sai thì chúng tôi hoàn token về ví.
        </p>
      </Muc>
    </LegalLayout>
  )
}
