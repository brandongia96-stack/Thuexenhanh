import LegalLayout, { Muc } from './LegalLayout'

export default function GioiThieu() {
  return (
    <LegalLayout title="Về Thuexenhanh">
      <Muc title="Chúng tôi là gì">
        <p className="t-body">
          Thuexenhanh là nơi chủ xe đăng tin cho thuê xe tự lái và khách thuê tìm xe rồi liên hệ trực tiếp với chủ xe.
        </p>
      </Muc>
      <Muc title="Chúng tôi không làm gì">
        <p className="t-body">
          Không đứng giữa dòng tiền, không giữ cọc, không thu hoa hồng. Giá và thoả thuận do hai bên tự quyết. Chủ xe chỉ trả phí hiển thị tin.
        </p>
      </Muc>
    </LegalLayout>
  )
}
