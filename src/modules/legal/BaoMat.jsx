import { Link } from 'react-router-dom'
import LegalLayout, { Muc, DanhSach, DanhSachNhan, KhoiPhapNhan, KhoiLienHe } from './LegalLayout'
import { VAN_BAN, THOI_HAN } from './phienBan'

/**
 * Chính sách bảo vệ dữ liệu cá nhân (trước đây là "Chính sách bảo mật").
 *
 * Viết theo NGHIEN-CUU-PHAP-LY.md §3B. Mọi câu phải đúng với hệ thống thật:
 * tên bảng, thời hạn lưu, bên thứ ba đều là thứ đang dùng. Không hứa suông.
 */
export default function BaoMat() {
  return (
    <LegalLayout
      title="Chính sách bảo vệ dữ liệu cá nhân"
      van={VAN_BAN.privacy}
      moTa="Trang này nói rõ chúng tôi thu thập dữ liệu gì của bạn, đưa cho ai, giữ bao lâu, và bạn có quyền gì. Có một điểm bạn cần đọc trước khi đăng tin: số điện thoại của chủ xe là thông tin công khai (mục 5)."
    >
      <Muc n="1" title="Ai xử lý dữ liệu của bạn">
        <KhoiPhapNhan />
        <p className="t-body">
          Chúng tôi là bên quyết định việc thu thập và sử dụng dữ liệu của bạn trên nền tảng
          Thuê Xe Nhanh. Các nhà cung cấp hạ tầng nêu ở mục 7 lưu trữ dữ liệu thay chúng tôi
          và chỉ được xử lý theo yêu cầu của chúng tôi.
        </p>
      </Muc>

      <Muc n="2" title="Dữ liệu chúng tôi thu thập">
        <p className="t-body"><b>Dữ liệu cơ bản:</b></p>
        <DanhSach items={[
          'Từ tài khoản Google khi bạn đăng nhập: tên, địa chỉ email, ảnh đại diện.',
          'Số điện thoại bạn nhập, và số Zalo nếu bạn khai thêm.',
          'Nội dung tin đăng: hãng xe, dòng xe, biển số, giá, khu vực, ảnh xe, mô tả, điều kiện thuê.',
          'Nhật ký hoạt động: tin bạn xem, lần bạn bấm xem số điện thoại, bấm gọi hoặc nhắn Zalo, từ khoá bạn tìm, xe bạn lưu.',
          'Giao dịch ví token: số token nạp, số token đã dùng, nội dung chuyển khoản dùng để đối soát.',
          'Dữ liệu kỹ thuật tối thiểu do hạ tầng tự ghi: địa chỉ IP, loại thiết bị và trình duyệt, thời điểm truy cập.',
        ]} />
        <p className="t-body"><b>Dữ liệu nhạy cảm — chỉ khi bạn chủ động gửi:</b></p>
        <DanhSach items={[
          'Ảnh giấy tờ xe (đăng ký, đăng kiểm, bảo hiểm) khi bạn xin xác minh tin đăng.',
          'Ảnh giấy tờ cá nhân, nếu chúng tôi cần đối chiếu để xét xác minh chủ xe. Chúng tôi chỉ yêu cầu khi thật cần và sẽ hỏi riêng sự đồng ý của bạn cho việc này.',
        ]} />
        <p className="t-body">
          Chúng tôi <b>không</b> thu thập vị trí GPS liên tục, không đọc danh bạ, không đọc tin nhắn
          của bạn, và không thu thập dữ liệu về sức khoẻ, tôn giáo hay quan điểm chính trị.
        </p>
      </Muc>

      <Muc n="3" title="Chúng tôi dùng dữ liệu để làm gì">
        <DanhSachNhan items={[
          ['Vận hành tài khoản', 'đăng nhập, phân biệt chủ xe với khách thuê, hiện đúng tin của bạn.'],
          ['Hiển thị tin đăng', 'đưa tin của chủ xe tới khách thuê đang tìm xe trong khu vực.'],
          ['Kết nối hai bên', 'cho khách xem số điện thoại của chủ xe để gọi trực tiếp.'],
          ['Xác minh', 'đối chiếu giấy tờ để xét huy hiệu xác minh (miễn phí, không bán).'],
          ['Chống gian lận', 'phát hiện tin trùng biển số, tài khoản spam, lượt xem bị thổi, lạm dụng việc lấy số điện thoại.'],
          ['Thống kê cho chủ xe', 'đếm lượt xem và lượt lấy số của từng tin để chủ xe biết tin có hiệu quả không.'],
          ['Thu phí hiển thị tin', 'ghi sổ ví token, đối soát chuyển khoản nạp tiền.'],
          ['Liên hệ khi cần', 'thông báo tin sắp hết hạn, tin bị từ chối, kết quả khiếu nại.'],
        ]} />
        <p className="t-body">
          Chúng tôi <b>không bán dữ liệu cá nhân của bạn</b> và không chuyển dữ liệu của bạn cho
          bên quảng cáo.
        </p>
      </Muc>

      <Muc n="4" title="Sự đồng ý và cách rút lại">
        <p className="t-body">
          Khi đăng nhập, bạn tích vào ô đồng ý Điều khoản sử dụng và chính sách này. Chúng tôi lưu
          lại <b>thời điểm và phiên bản</b> bạn đã đồng ý. Khi chúng tôi sửa nội dung, phiên bản
          tăng lên và bạn được hỏi đồng ý lại.
        </p>
        <p className="t-body">
          Bạn rút lại sự đồng ý bất cứ lúc nào bằng cách yêu cầu xoá tài khoản (xem mục 9).
          <b> Hậu quả khi rút:</b> chúng tôi không còn cơ sở để vận hành tài khoản cho bạn, nên
          tài khoản sẽ bị đóng và mọi tin đăng của bạn bị ẩn khỏi trang tìm kiếm. Token chưa dùng
          được xử lý theo <Link to="/hoan-token">Chính sách hoàn token</Link>. Việc rút lại không
          làm mất hiệu lực của những việc đã xử lý hợp pháp trước đó, và không xoá được các bản
          ghi mà pháp luật buộc chúng tôi giữ (mục 8).
        </p>
      </Muc>

      <Muc n="5" title="Số điện thoại chủ xe là thông tin công khai">
        <p className="t-body">
          Đây là điểm quan trọng nhất của trang này. Mục đích của nền tảng là để khách gọi được
          cho chủ xe, vì vậy <b>số điện thoại bạn đăng trong tin sẽ hiện ra cho bất kỳ khách nào
          bấm “Xem số điện thoại”</b> — kể cả người bạn không biết. Chúng tôi che một phần số cho
          tới khi khách bấm, nhưng sau khi bấm thì khách thấy số đầy đủ và có thể lưu lại.
        </p>
        <p className="t-body">
          Hệ quả thực tế bạn nên biết trước: số của bạn có thể bị người khác dùng để gọi quảng
          cáo hoặc gọi làm phiền. Chúng tôi hạn chế bằng cách đặt mức trần số lần lấy số trong
          ngày cho mỗi người và chặn hành vi thu thập hàng loạt, nhưng <b>không thể bảo đảm điều
          đó không bao giờ xảy ra</b>. Nếu bạn không muốn số của mình công khai thì đừng đăng tin —
          bạn vẫn dùng được nền tảng với vai trò khách thuê.
        </p>
      </Muc>

      <Muc n="6" title="Ảnh giấy tờ">
        <p className="t-body">
          Ảnh giấy tờ chỉ dùng để xét xác minh, <b>không bao giờ hiển thị công khai</b> và không
          gắn vào tin đăng. Sau khi xét xong, chúng tôi xoá ảnh và chỉ giữ lại kết quả xét
          (đã xác minh hoặc bị từ chối, kèm lý do). Chúng tôi không dùng ảnh giấy tờ cho mục đích
          nào khác.
        </p>
      </Muc>

      <Muc n="7" title="Bên thứ ba và việc chuyển dữ liệu ra nước ngoài">
        <p className="t-body">
          Chúng tôi không tự dựng máy chủ. Dữ liệu của bạn được lưu và xử lý trên dịch vụ của các
          nhà cung cấp sau, và <b>các dịch vụ này đặt máy chủ ở ngoài Việt Nam</b> — nghĩa là dữ
          liệu của bạn được chuyển ra nước ngoài. Khi đồng ý chính sách này, bạn đồng ý với việc đó.
        </p>
        <DanhSachNhan items={[
          ['Supabase', 'cơ sở dữ liệu, lưu ảnh và hệ thống đăng nhập. Nhận gần như toàn bộ dữ liệu nêu ở mục 2. Máy chủ khu vực Singapore.'],
          ['Cloudflare', 'phân phối trang web và chống tấn công. Nhận dữ liệu kỹ thuật của mỗi lượt truy cập (IP, thiết bị). Máy chủ phân tán nhiều quốc gia.'],
          ['Google', 'chỉ khi bạn chọn đăng nhập bằng Google. Google cho chúng tôi tên, email và ảnh đại diện của bạn; việc Google xử lý dữ liệu của bạn theo chính sách riêng của họ.'],
          ['Ngân hàng và dịch vụ đối soát chuyển khoản', 'khi bạn nạp token. Nhận số tiền, thời điểm và nội dung chuyển khoản để xác nhận bạn đã nạp. Chúng tôi không nhận và không lưu số thẻ của bạn.'],
        ]} />
        <p className="t-body">
          Ngoài các trường hợp trên, chúng tôi chỉ cung cấp dữ liệu của bạn cho bên khác khi có
          <b> yêu cầu hợp pháp</b> của cơ quan nhà nước có thẩm quyền, hoặc khi cần để bảo vệ
          quyền lợi chính đáng trong một tranh chấp liên quan trực tiếp tới bạn.
        </p>
      </Muc>

      <Muc n="8" title="Chúng tôi giữ dữ liệu bao lâu">
        <DanhSachNhan items={[
          ['Tài khoản và số điện thoại', 'giữ trong thời gian bạn còn dùng. Bạn yêu cầu xoá thì chúng tôi xoá hoặc ẩn danh, trừ phần nêu dưới đây.'],
          ['Tin đăng', 'hết hạn hiển thị vẫn giữ ở trạng thái ẩn để bạn đăng lại. Bạn xoá tin thì chúng tôi đánh dấu đã xoá và không hiển thị nữa.'],
          ['Ảnh giấy tờ', 'xoá ngay sau khi xét xác minh xong.'],
          ['Nhật ký chi tiết từng lượt xem và lượt lấy số', `giữ ${THOI_HAN.luuNhatKyChiTiet}, sau đó chỉ còn số đếm theo ngày, không gắn với người cụ thể.`],
          ['Sổ ví và giao dịch token', 'giữ lâu dài và không xoá được, vì đây là sổ sách kế toán và dùng để đối soát khi có khiếu nại về tiền.'],
          ['Bản ghi bạn đã đồng ý điều khoản', 'giữ lâu dài, vì đây là bằng chứng của việc đồng ý.'],
          ['Hồ sơ khiếu nại và xử lý vi phạm', 'giữ lâu dài để xử lý trường hợp tái phạm.'],
        ]} />
      </Muc>

      <Muc n="9" title="Quyền của bạn và cách thực hiện">
        <p className="t-body">Bạn có các quyền sau với dữ liệu cá nhân của mình:</p>
        <DanhSachNhan items={[
          ['Được biết', 'biết chúng tôi xử lý dữ liệu gì của bạn — chính là trang này.'],
          ['Xem và lấy bản sao', 'yêu cầu chúng tôi cho biết chúng tôi đang giữ dữ liệu gì của bạn.'],
          ['Sửa', 'tự sửa phần lớn thông tin ngay trong tài khoản; phần không sửa được thì yêu cầu chúng tôi sửa.'],
          ['Xoá', 'yêu cầu xoá tài khoản và dữ liệu, trừ phần bắt buộc phải giữ ở mục 8.'],
          ['Rút lại sự đồng ý', 'theo mục 4.'],
          ['Phản đối hoặc yêu cầu hạn chế', 'nếu bạn cho rằng chúng tôi dùng dữ liệu sai mục đích đã nêu.'],
          ['Khiếu nại', `gửi khiếu nại cho chúng tôi theo trang Giải quyết khiếu nại, hoặc khiếu nại tới cơ quan nhà nước có thẩm quyền.`],
        ]} />
        <p className="t-body"><b>Cách gửi yêu cầu:</b></p>
        <KhoiLienHe />
        <p className="t-body">
          Chúng tôi xác nhận đã nhận yêu cầu trong <b>{THOI_HAN.tiepNhanKhieuNai}</b> và trả lời
          bạn trong <b>{THOI_HAN.xuLyKhieuNai}</b>. Nếu yêu cầu phức tạp và cần thêm thời gian,
          chúng tôi nói rõ lý do và thời hạn mới. Để bảo vệ chính bạn, chúng tôi cần xác định bạn
          đúng là chủ tài khoản trước khi cung cấp hoặc xoá dữ liệu.
        </p>
      </Muc>

      <Muc n="10" title="Dữ liệu lưu trên máy của bạn">
        <p className="t-body">
          Trang web lưu một ít dữ liệu trong bộ nhớ trình duyệt của bạn để hoạt động đúng: phiên
          đăng nhập, một mã phiên ẩn danh để không đếm trùng lượt xem một tin, và các lựa chọn
          tiện cho bạn như bộ lọc tìm kiếm gần nhất. Bạn xoá dữ liệu trang web trong trình duyệt
          là xoá hết phần này; khi đó bạn chỉ cần đăng nhập lại.
        </p>
      </Muc>

      <Muc n="11" title="Người dưới 18 tuổi">
        <p className="t-body">
          Nền tảng không dành cho người dưới 18 tuổi. Việc thuê xe tự lái đòi hỏi giấy phép lái xe
          và khả năng tự chịu trách nhiệm trong hợp đồng. Nếu phát hiện tài khoản của người dưới
          18 tuổi, chúng tôi đóng tài khoản và xoá dữ liệu.
        </p>
      </Muc>

      <Muc n="12" title="Rủi ro bạn nên biết">
        <p className="t-body">
          Chúng tôi phân quyền truy cập ở tầng cơ sở dữ liệu, hạn chế số lần lấy số điện thoại,
          và không cho người dùng tự sửa huy hiệu xác minh hay sổ ví. Nhưng không hệ thống nào an
          toàn tuyệt đối. Những rủi ro có thể xảy ra: dữ liệu bị truy cập trái phép do lỗi của
          chúng tôi hoặc của nhà cung cấp hạ tầng; số điện thoại công khai bị người khác thu thập
          (mục 5); tài khoản của bạn bị chiếm nếu tài khoản Google của bạn bị chiếm. Nếu xảy ra sự
          cố làm lộ dữ liệu, chúng tôi sẽ thông báo cho người bị ảnh hưởng và cho cơ quan có thẩm
          quyền theo quy định.
        </p>
      </Muc>

      <Muc n="13" title="Khi chính sách này thay đổi">
        <p className="t-body">
          Chúng tôi tăng số phiên bản và ngày hiệu lực ở đầu trang. Với thay đổi ảnh hưởng tới
          quyền của bạn, chúng tôi yêu cầu bạn đồng ý lại trước khi tiếp tục dùng nền tảng.
        </p>
      </Muc>
    </LegalLayout>
  )
}
