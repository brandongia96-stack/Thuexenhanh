import { X } from 'lucide-react'
import { danhSachChip, locRong } from './loc'
import './BoLoc.css'

/**
 * Hàng chip các bộ lọc đang bật, mỗi chip có nút X.
 * Không có bộ lọc nào thì ẩn CẢ hàng (không render ô trống).
 */
export default function ChipLoc({ loc, onDoi }) {
  const chips = danhSachChip(loc)
  if (!chips.length) return null

  return (
    <ul className="chiploc" aria-label="Bộ lọc đang bật">
      {chips.map((c) => (
        <li key={c.key}>
          <button
            type="button"
            className="chiploc-nut"
            onClick={() => onDoi(c.xoa(loc))}
            aria-label={`Bỏ bộ lọc ${c.label}`}
          >
            <span>{c.label}</span>
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </li>
      ))}
      {chips.length > 1 && (
        <li>
          {/* Giữ lại cách sắp xếp — đó là cách xem chứ không phải bộ lọc. */}
          <button type="button" className="chiploc-het" onClick={() => onDoi({ ...locRong(), xep: loc.xep })}>
            Xoá tất cả
          </button>
        </li>
      )}
    </ul>
  )
}
