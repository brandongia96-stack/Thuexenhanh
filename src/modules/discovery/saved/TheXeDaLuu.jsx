import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Users, Cog } from 'lucide-react'

import { VerifiedBadge } from '../../../components/Badge'
import { formatVndShort } from '../../../lib/format'
import { TRANSMISSIONS } from '../../../data/options'
import { napTruocTin } from '../listing-page/chiTietApi'
import { tenNoi } from '../diaGioi'
import NutLuu from './NutLuu'

/**
 * Thẻ xe trong trang "Xe đã lưu".
 *
 * Đọc từ view `listing_card` — ảnh là bản `thumb` 400w kèm ảnh mờ base64.
 * CẤM dùng ảnh gốc hay bản `medium` ở danh sách (HIEU-NANG.md mục 1.1).
 *
 * ⚠️ Luồng 04 sẽ có thẻ xe dùng chung cho trang tìm kiếm. Khi đó thay thẻ này
 * bằng thẻ đó và xoá file này — không để hai thẻ xe sống song song.
 *
 * `memo`: đổi một bộ lọc không được dựng lại toàn bộ danh sách
 * (HIEU-NANG.md mục 4).
 */
function TheXeDaLuu({ the, bangDiaGioi }) {
  const ten = `${the.brand_text} ${the.model_text}${the.year ? ` ${the.year}` : ''}`
  const noi = tenNoi(bangDiaGioi, the.province_id, the.district_id)
  const hopSo = TRANSMISSIONS.find((x) => x.value === the.transmission)?.label

  return (
    <article className="card card-hover thexe">
      {/* Rê chuột / chạm là nạp trước tin → bấm vào mở gần như tức thì
          (HIEU-NANG.md mục 3). */}
      <Link
        to={`/xe/${the.id}`}
        onMouseEnter={() => napTruocTin(the.id)}
        onTouchStart={() => napTruocTin(the.id)}
      >
        <div
          className="thexe-anh"
          style={{
            aspectRatio: the.cover_width && the.cover_height
              ? `${the.cover_width} / ${the.cover_height}`
              : '4 / 3',
            backgroundImage: the.cover_blur ? `url(${the.cover_blur})` : undefined,
          }}
        >
          {the.cover_thumb && (
            <img
              src={the.cover_thumb}
              alt={ten}
              width={the.cover_width ?? undefined}
              height={the.cover_height ?? undefined}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
      </Link>

      <div className="card-pad thexe-than">
        <div className="thexe-dong">
          <Link to={`/xe/${the.id}`} className="t-h3">{ten}</Link>
          <NutLuu tin={the} kieu="tron" />
        </div>

        <div className="thexe-meta t-small">
          {the.seats && (
            <span><Users size={14} strokeWidth={1.8} />{the.seats} chỗ</span>
          )}
          {hopSo && (
            <span><Cog size={14} strokeWidth={1.8} />{hopSo}</span>
          )}
          {noi && (
            <span><MapPin size={14} strokeWidth={1.8} />{noi}</span>
          )}
        </div>

        <div className="thexe-chan">
          <span className="t-price">{formatVndShort(the.price_per_day)}</span>
          <span className="t-small">/ ngày</span>
          <VerifiedBadge verified={the.is_verified} />
        </div>
        {/* Cố ý KHÔNG có "5.0 · 15+ chuyến" — v0.1 bịa con số đó.
            Chưa có đánh giá thật (luồng 09) thì không hiện gì cả. */}
      </div>
    </article>
  )
}

export default memo(TheXeDaLuu)
