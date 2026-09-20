// owner/TheXe — một chiếc xe trong bảng điều khiển chủ xe.
//
// Khác thẻ xe của khách thuê (luồng 04): ở đây chủ xe cần thấy TIỀN và HẠN,
// không cần thấy tiện nghi. Ba câu hỏi thẻ này phải trả lời trong một cái liếc:
//   1. Tin còn sống không, còn bao lâu?
//   2. Tháng qua được bao nhiêu lượt xem, bao nhiêu người bấm lấy số?
//   3. Giờ bấm gì tiếp?

import { memo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Car, Pencil, RefreshCw } from 'lucide-react'
import Badge, { VerifiedBadge } from '../../components/Badge'
import { formatVnd, formatDate } from '../../lib/format'
import { coTheGiaHan, coTheSua, loiNhacHan, nhanTrangThai, trangThaiThuc } from '../listing/lifecycle'
import { coSoLieu, dinhDangTyLe, tyLeLaySo } from './soLieu'
import { BieuDoNho } from './BieuDo'
import { DongSo } from './ChiSo'

function Anh({ xe, uuTien }) {
  if (!xe.cover_thumb) {
    // Không có ảnh thì hiện đúng là không có ảnh. Không nhét ảnh mẫu.
    return (
      <div className="the-xe-anh the-xe-anh-trong">
        <Car size={28} strokeWidth={1.5} />
        <span className="t-small">Chưa có ảnh</span>
      </div>
    )
  }
  return (
    <div
      className="the-xe-anh"
      // Ảnh mờ 20px đi kèm JSON, hiện ngay, tốn 0 request (HIEU-NANG.md 1.2).
      style={xe.cover_blur ? { backgroundImage: `url(${xe.cover_blur})` } : undefined}
    >
      <img
        src={xe.cover_thumb}
        alt=""
        width={xe.cover_width ?? 400}
        height={xe.cover_height ?? 250}
        loading={uuTien ? 'eager' : 'lazy'}
        fetchPriority={uuTien ? 'high' : 'low'}
        decoding="async"
      />
    </div>
  )
}

function TheXe({ xe, soLieu, uuTien = false, dangTaiSoLieu = false }) {
  const status = trangThaiThuc(xe)
  const nhan = nhanTrangThai(status)
  const nhacHan = loiNhacHan(xe)

  const tong = soLieu?.tong
  const ty = tong ? tyLeLaySo(tong.view_listing, tong.reveal_phone) : null

  return (
    <article className="card the-xe">
      <Link to={`/chu-xe/so-lieu/${xe.id}`} className="the-xe-tren">
        <Anh xe={xe} uuTien={uuTien} />
        <div className="the-xe-dau">
          <div className="row the-xe-nhan">
            <Badge tone={nhan.tone}>{nhan.label}</Badge>
            <VerifiedBadge verified={xe.is_verified} />
          </div>
          <h3 className="t-h3">
            {xe.brand_text} {xe.model_text}
            {xe.year ? <span className="the-xe-nam"> {xe.year}</span> : null}
          </h3>
          <div className="t-price">{formatVnd(xe.price_per_day)}<span className="the-xe-ngay">/ngày</span></div>
        </div>
      </Link>

      {nhacHan && (
        <div className={`nhac-han nhac-han-${nhacHan.tone}`}>
          {nhacHan.text}
          {xe.expires_at && <span className="t-small"> · {formatDate(xe.expires_at)}</span>}
        </div>
      )}

      <div className="the-xe-so">
        {dangTaiSoLieu && !soLieu ? (
          <div className="t-small">Đang lấy số liệu…</div>
        ) : coSoLieu(tong) ? (
          <>
            <div className="the-xe-bang">
              <DongSo nhan="Lượt xem 30 ngày" giaTri={tong.view_listing} />
              <DongSo nhan="Lượt lấy số" giaTri={tong.reveal_phone} tone="ok" />
              <DongSo nhan="Tỷ lệ lấy số" giaTri={dinhDangTyLe(ty)} />
            </div>
            <BieuDoNho chuoi={soLieu.chuoi} />
          </>
        ) : (
          // CẤM số giả: chưa có lượt nào thì nói thẳng là chưa có.
          <div className="t-small">Chưa có lượt xem nào trong 30 ngày qua</div>
        )}
      </div>

      <div className="the-xe-nut">
        <Link to={`/chu-xe/so-lieu/${xe.id}`} className="btn btn-ghost btn-sm">
          <BarChart3 size={15} strokeWidth={1.8} />
          Số liệu
        </Link>
        {coTheSua(xe.status) && (
          <Link to={`/chu-xe/tin/${xe.id}`} className="btn btn-ghost btn-sm">
            <Pencil size={15} strokeWidth={1.8} />
            Sửa
          </Link>
        )}
        {coTheGiaHan(status) && (
          // Gia hạn = trừ token, việc của luồng 06. Ở đây chỉ chuyển tiếp,
          // màn này tuyệt đối không đụng vào ví.
          <Link to={`/chu-xe/vi?gia-han=${xe.id}`} className="btn btn-soft btn-sm">
            <RefreshCw size={15} strokeWidth={1.8} />
            Gia hạn
          </Link>
        )}
      </div>
    </article>
  )
}

// Đổi bộ lọc không được dựng lại cả danh sách (HIEU-NANG.md mục 4).
export default memo(TheXe)
