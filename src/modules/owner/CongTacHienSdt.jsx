// owner/CongTacHienSdt — công tắc "Cho phép khách xem số điện thoại".
//
// Đồng ý là hành động của người dùng, ghi vào `user_consents` (bảng chỉ ghi
// thêm). Component này chỉ trình bày; việc đọc/ghi do trang cha làm.
// `bat === null` = chưa biết (lỗi đọc) → ẩn cả khối, không đoán.

import { PhoneOff, Phone } from 'lucide-react'

export default function CongTacHienSdt({ bat, dangGhi, loi, onDoi }) {
  if (bat == null) return null

  return (
    <section className="cx-sdt card card-pad" aria-label="Hiển thị số điện thoại">
      <div className="cx-sdt-chu">
        <div className="row cx-sdt-tieu">
          {bat ? <Phone size={18} strokeWidth={1.8} /> : <PhoneOff size={18} strokeWidth={1.8} />}
          <strong className="t-h3">Cho phép khách xem số điện thoại</strong>
        </div>
        <p className="t-small">
          {bat
            ? 'Khách bấm "Xem số điện thoại" trên tin của anh sẽ thấy số liên hệ.'
            : 'Anh đã tắt. Tin của anh được đánh dấu "Tạm ẩn liên hệ". Bật lại bất cứ lúc nào.'}
        </p>
        {loi && <p className="field-error" role="alert">{loi}</p>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={bat}
        aria-label="Cho phép khách xem số điện thoại"
        className={`cx-cong-tac${bat ? ' bat' : ''}`}
        disabled={dangGhi}
        onClick={() => onDoi(!bat)}
      >
        <span className="cx-cong-tac-nut" />
      </button>
    </section>
  )
}
