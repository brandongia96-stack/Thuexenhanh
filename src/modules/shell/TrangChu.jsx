import { Link } from 'react-router-dom'
import { Phone, ShieldCheck, Wallet } from 'lucide-react'

/**
 * Trang chủ tối giản của khung nền tảng.
 *
 * Cố ý KHÔNG có danh sách xe, không có số liệu, không có đánh giá —
 * chưa có dữ liệu thật thì không bịa. Danh sách xe thuộc luồng 04.
 */
export default function TrangChu() {
  return (
    <div className="page stack" style={{ gap: 'var(--sp-8)' }}>
      <section className="stack" style={{ gap: 'var(--sp-3)', paddingTop: 'var(--sp-6)' }}>
        <h1 className="t-h1">Thuê xe tự lái, gọi thẳng chủ xe</h1>
        <p className="t-body" style={{ maxWidth: 560 }}>
          Thuexenhanh là nơi chủ xe đăng tin và khách thuê tìm xe. Bạn xem số điện thoại,
          gọi trực tiếp, tự thoả thuận. Không qua trung gian, không mất hoa hồng.
        </p>
        <div className="row" style={{ marginTop: 'var(--sp-2)' }}>
          <Link to="/thue-xe" className="btn btn-primary">Tìm xe</Link>
          <Link to="/dang-nhap" className="btn btn-ghost">Tôi có xe cho thuê</Link>
        </div>
      </section>

      <section className="grid-cards">
        <Diem
          icon={Phone}
          title="Liên hệ trực tiếp"
          desc="Bấm xem số điện thoại rồi gọi cho chủ xe. Chúng tôi không đứng giữa."
        />
        <Diem
          icon={Wallet}
          title="Không ăn hoa hồng"
          desc="Chủ xe chỉ trả phí hiển thị tin. Tiền thuê xe là chuyện của hai bên."
        />
        <Diem
          icon={ShieldCheck}
          title="Tích xanh miễn phí"
          desc="Xác minh xét theo giấy tờ, không bán bằng tiền."
        />
      </section>
    </div>
  )
}

function Diem({ icon: Icon, title, desc }) {
  return (
    <div className="card card-pad stack" style={{ gap: 'var(--sp-2)' }}>
      <Icon size={22} strokeWidth={1.8} color="var(--m-green)" />
      <div className="t-h3">{title}</div>
      <p className="t-small">{desc}</p>
    </div>
  )
}
