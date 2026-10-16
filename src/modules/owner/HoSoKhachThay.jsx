// owner/HoSoKhachThay — xem trước hồ sơ đúng như khách thấy (contracts/api.md §3g).
// Dữ liệu từ view `owner_public`; null thì ẩn cả khối (chưa có tin hiển thị).

import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { VerifiedBadge } from '../../components/Badge'

export default function HoSoKhachThay({ hoSo }) {
  if (!hoSo) return null
  const chuDau = (hoSo.ten_hien_thi || '?').charAt(0).toUpperCase()

  return (
    <section className="card card-pad hs" aria-label="Hồ sơ khách thấy">
      <strong className="t-h3">Hồ sơ khách thấy</strong>
      <div className="hs-the">
        {hoSo.avatar_url ? (
          <img className="hs-anh" src={hoSo.avatar_url} alt="" width="56" height="56"
            loading="lazy" decoding="async" />
        ) : (
          <div className="hs-anh hs-chu" aria-hidden="true">{chuDau}</div>
        )}
        <div className="hs-thong-tin">
          <div className="row hs-ten">
            <strong>{hoSo.ten_hien_thi}</strong>
            <VerifiedBadge verified={hoSo.da_xac_minh} />
          </div>
          <span className="t-small">{hoSo.so_xe_dang_cho_thue} xe cho thuê</span>
        </div>
        <Link to={`/chu/${hoSo.id}`} className="btn btn-ghost btn-sm">
          <ExternalLink size={15} strokeWidth={1.8} />
          Xem trang của tôi
        </Link>
      </div>
      <p className="t-small">
        Khách chỉ thấy tên gọi và ảnh đại diện. Số điện thoại chỉ hiện khi khách bấm Xem số.
      </p>
      {!hoSo.avatar_url && (
        <p className="t-small">
          Anh chưa có ảnh đại diện. <Link to="/tai-khoan" className="cx-lien-ket">Cập nhật ảnh ở trang Tài khoản</Link>
        </p>
      )}
    </section>
  )
}
