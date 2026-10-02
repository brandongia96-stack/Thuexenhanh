// owner/TheXe — một chiếc xe trong bảng điều khiển chủ xe.
//
// Khác thẻ xe của khách thuê (luồng 04): ở đây chủ xe cần thấy TIỀN và HẠN,
// không cần thấy tiện nghi. Ba câu hỏi thẻ này phải trả lời trong một cái liếc:
//   1. Tin còn sống không, còn bao lâu?
//   2. Tháng qua được bao nhiêu lượt xem, bao nhiêu người bấm lấy số?
//   3. Giờ bấm gì tiếp?

import { memo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Car, ChevronDown, Pencil, Phone, RefreshCw } from 'lucide-react'
import Badge, { VerifiedBadge } from '../../components/Badge'
import { formatVnd, formatDate, formatPhone } from '../../lib/format'
import { coTheGiaHan, coTheSua, loiNhacHan, nhanTrangThai, trangThaiThuc } from '../listing/lifecycle'
import { coSoLieu, dinhDangTyLe, tyLeLaySo } from './soLieu'
import { BieuDoNho } from './BieuDo'
import BieuDo, { ChuGiai } from './BieuDo'
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

function TheXe({ xe, soLieu, rieng, uuTien = false, dangTaiSoLieu = false, moRong = false, viTri, onMoRong, onGiaHan }) {
  const status = trangThaiThuc(xe)
  const nhan = nhanTrangThai(status)
  const nhacHan = loiNhacHan(xe)

  const tong = soLieu?.tong
  const ty = tong ? tyLeLaySo(tong.view_listing, tong.reveal_phone) : null

  return (
    <article className="card the-xe">
      <div className="the-xe-tren">
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
      </div>

      {(rieng?.contact_phone || rieng?.plate) && (
        // Lấy qua RPC listing_private_many. Thiếu thì ẩn cả dòng.
        <div className="the-xe-rieng t-small">
          {rieng.contact_phone && <span><Phone size={13} strokeWidth={1.8} /> {formatPhone(rieng.contact_phone)}</span>}
          {rieng.plate && <span>Biển số {rieng.plate}</span>}
        </div>
      )}

      {nhacHan && (
        <div className={`nhac-han nhac-han-${nhacHan.tone}`}>
          {nhacHan.text}
          {xe.expires_at && <span className="t-small"> · {formatDate(xe.expires_at)}</span>}
        </div>
      )}

      <div className="the-xe-so">
        {!soLieu ? (
          // Chưa có `soLieu` = đang tải hoặc tải lỗi. KHÔNG được rơi xuống câu
          // "Chưa có lượt xem nào": đó là khẳng định về dữ liệu, mà lỗi mạng thì chưa biết gì.
          <div className="t-small">{dangTaiSoLieu ? 'Đang lấy số liệu…' : 'Chưa tải được số liệu'}</div>
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
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMoRong?.(xe.id)} aria-expanded={moRong}>
          <BarChart3 size={15} strokeWidth={1.8} />
          Số liệu
          <ChevronDown size={14} strokeWidth={2} className={moRong ? 'xoay' : ''} />
        </button>
        {coTheSua(xe.status) && (
          <Link to={`/chu-xe/tin/${xe.id}`} className="btn btn-ghost btn-sm">
            <Pencil size={15} strokeWidth={1.8} />
            Sửa
          </Link>
        )}
        {coTheGiaHan(status) && (
          // Gia hạn = trừ token, việc của luồng 06: mở HopTraPhi, màn này không đụng vào ví.
          <button type="button" className="btn btn-soft btn-sm" onClick={() => onGiaHan?.(xe)}>
            <RefreshCw size={15} strokeWidth={1.8} />
            Gia hạn
          </button>
        )}
      </div>

      {moRong && (
        <div className="the-xe-mo">
          {coSoLieu(tong) ? (
            <>
              <BieuDo chuoi={soLieu.chuoi} />
              <ChuGiai />
            </>
          ) : (
            <p className="t-small">Chưa có lượt xem nào trong 30 ngày qua, nên chưa có biểu đồ để vẽ.</p>
          )}
          {viTri && (
            <p className="t-small">
              Giá {formatVnd(xe.price_per_day)}/ngày: có {viTri.soXeReHon} trên {viTri.soXeCungTinh - 1} xe
              cùng tỉnh đang rẻ hơn.
            </p>
          )}
          <p className="t-small">Số liệu gộp theo ngày, cập nhật mỗi đêm, chưa gồm hôm nay.</p>
        </div>
      )}
    </article>
  )
}

// Đổi bộ lọc không được dựng lại cả danh sách (HIEU-NANG.md mục 4).
export default memo(TheXe)
