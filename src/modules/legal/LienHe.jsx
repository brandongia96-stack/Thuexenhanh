import LegalLayout, { Muc } from './LegalLayout'
import { EMAIL_HO_TRO } from './phienBan'

export default function LienHe() {
  return (
    <LegalLayout title="Liên hệ">
      {EMAIL_HO_TRO ? (
        <Muc title="Email hỗ trợ">
          <p className="t-body"><a href={`mailto:${EMAIL_HO_TRO}`}>{EMAIL_HO_TRO}</a></p>
        </Muc>
      ) : (
        <p className="t-body">Kênh liên hệ hỗ trợ sẽ được cập nhật tại đây.</p>
      )}
    </LegalLayout>
  )
}
