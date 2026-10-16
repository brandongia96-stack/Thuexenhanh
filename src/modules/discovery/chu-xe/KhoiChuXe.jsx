import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../../../components/Badge'
import { thangNamThamGia } from './chuXeApi'
import './ChuXe.css'

/**
 * Khối "Chủ xe" — avatar + tên gọi + tích xanh + ngày tham gia + số xe đang
 * cho thuê. Dùng chung ở hai chỗ:
 *   · Trang chi tiết xe (`TrangXe.jsx`), ngay trên hộp liên hệ — bấm được,
 *     đưa sang `/chu/:id`.
 *   · Đầu trang `/chu/:id` chính nó — không bấm (đang đứng sẵn ở đó).
 *
 * contracts/api.md mục 3g: CHỈ hiện `ten_hien_thi` (tên gọi, không phải họ
 * tên đầy đủ) — không bao giờ thêm email/SĐT/CCCD vào khối này.
 *
 * @param {object} chuXe       một hàng của view `owner_public`, null thì ẩn cả khối
 * @param {string} [to]        có thì cả khối là <Link>, không thì là <div> tĩnh
 * @param {'nho'|'lon'} [kichThuoc]
 */
export default function KhoiChuXe({ chuXe, to, kichThuoc = 'nho' }) {
  if (!chuXe) return null

  const thang = thangNamThamGia(chuXe.tham_gia_tu)
  const meta = [
    thang && `Tham gia từ ${thang}`,
    `${chuXe.so_xe_dang_cho_thue} xe đang cho thuê`,
  ].filter(Boolean)

  const noiDung = (
    <>
      <AvatarChuXe ten={chuXe.ten_hien_thi} url={chuXe.avatar_url} kichThuoc={kichThuoc} />
      <div className="chuxe-than">
        <div className="chuxe-ten">
          {chuXe.ten_hien_thi}
          <VerifiedBadge verified={chuXe.da_xac_minh} />
        </div>
        <div className="chuxe-meta t-small">{meta.join(' · ')}</div>
      </div>
    </>
  )

  const className = `chuxe-khoi chuxe-${kichThuoc}` + (to ? ' chuxe-bam' : '')

  // Cả khối bấm được, nhưng KHÔNG lồng nút/link con bên trong — tránh lặp
  // <a> trong <a> (xem ghi chú tương tự ở the-xe/TheXe.jsx).
  return to ? (
    <Link to={to} className={className}>
      {noiDung}
    </Link>
  ) : (
    <div className={className}>{noiDung}</div>
  )
}

function AvatarChuXe({ ten, url, kichThuoc }) {
  const co = kichThuoc === 'lon' ? 64 : 48
  if (url) {
    return (
      <img
        className={`chuxe-avatar chuxe-avatar-${kichThuoc}`}
        src={url}
        alt=""
        width={co}
        height={co}
        loading="lazy"
        decoding="async"
      />
    )
  }
  // Không có ảnh thì chữ cái đầu của tên gọi — không dùng ảnh mẫu (CLAUDE.md 1.2).
  const chuCai = ten?.trim()?.[0]?.toUpperCase() ?? '?'
  return (
    <div
      className={`chuxe-avatar chuxe-avatar-chu chuxe-avatar-${kichThuoc}`}
      style={{ width: co, height: co }}
      aria-hidden="true"
    >
      {chuCai}
    </div>
  )
}
