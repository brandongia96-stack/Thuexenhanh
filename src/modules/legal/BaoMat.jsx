import LegalLayout, { Muc, DanhSach } from './LegalLayout'
import { VAN_BAN } from './phienBan'

export default function BaoMat() {
  return (
    <LegalLayout title="Chính sách bảo mật" van={VAN_BAN.privacy}>
      <Muc n="1" title="Chúng tôi thu thập gì">
        <DanhSach items={[
          'Từ tài khoản Google: tên, email, ảnh đại diện.',
          'Số điện thoại bạn cung cấp.',
          'Ảnh xe và nội dung tin đăng.',
          'Ảnh giấy tờ xe, nếu bạn gửi để xác minh.',
          'Lịch sử truy cập: xem tin, bấm xem số điện thoại, bấm gọi hoặc Zalo, tìm kiếm.',
        ]} />
      </Muc>
      <Muc n="2" title="Số điện thoại chủ xe hiển thị công khai">
        <p className="t-body">
          Mục đích chính của Thuexenhanh là để khách liên hệ chủ xe. Vì vậy <b>số điện thoại bạn đăng trong tin sẽ hiển thị cho bất kỳ khách nào bấm “Xem số điện thoại”</b>. Nếu không muốn số của mình bị hiển thị, đừng đăng tin.
        </p>
      </Muc>
      <Muc n="3" title="Ảnh giấy tờ">
        <p className="t-body">
          Chỉ dùng để xác minh, không hiển thị công khai, và được xoá sau khi xét duyệt xong.
        </p>
      </Muc>
      <Muc n="4" title="Dùng dữ liệu để làm gì">
        <p className="t-body">
          Vận hành tài khoản và tin đăng, xác minh, chống gian lận, thống kê lượt xem cho chủ xe, và liên hệ khi cần. Chúng tôi không bán dữ liệu cá nhân của bạn.
        </p>
      </Muc>
      <Muc n="5" title="Lưu trữ và quyền của bạn">
        <p className="t-body">
          Dữ liệu được lưu trên hạ tầng đám mây của nhà cung cấp dịch vụ chúng tôi dùng. Bạn có thể yêu cầu xem, sửa hoặc xoá dữ liệu cá nhân qua trang Liên hệ. Một số bản ghi giao dịch ví phải giữ lại để đối soát.
        </p>
      </Muc>
    </LegalLayout>
  )
}
