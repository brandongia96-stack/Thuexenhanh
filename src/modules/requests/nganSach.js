// requests/nganSach — một nguồn duy nhất cho ngân sách tin tìm xe.
//
// Trước 17/10 form quy MỌI lựa chọn (trừ "dưới 700k") về 700.000–2.500.000đ,
// nên khách chọn "700k – 1 triệu" mà thẻ + màn duyệt hiện "~2.500.000đ/ngày".

import { formatVnd } from '../../lib/format'

/** Lựa chọn trên form → { min, max, thoaThuan } để lưu. */
export function khoangNganSach(option, custom = 0) {
  switch (option) {
    case 'duoi_700k': return { min: 0, max: 700000, thoaThuan: false }
    case '700k_1tr':  return { min: 700000, max: 1000000, thoaThuan: false }
    case '1tr_1tr5':  return { min: 1000000, max: 1500000, thoaThuan: false }
    case '1tr5_2tr5': return { min: 1500000, max: 2500000, thoaThuan: false }
    case 'tren_2tr5': return { min: 2500000, max: null, thoaThuan: false }
    case 'custom':
      return custom > 0 ? { min: custom, max: custom, thoaThuan: false } : { min: null, max: null, thoaThuan: true }
    default:          return { min: null, max: null, thoaThuan: true }
  }
}

/** Dòng hiển thị từ budget_min / budget_max đã lưu. */
export function moTaNganSach(min, max) {
  const a = Number(min) || 0
  const b = Number(max) || 0
  if (!a && !b) return 'Ngân sách thoả thuận'
  if (a && b && a === b) return `Khoảng ${formatVnd(a)}/ngày`
  if (!a && b) return `Dưới ${formatVnd(b)}/ngày`
  if (a && !b) return `Trên ${formatVnd(a)}/ngày`
  return `${formatVnd(a)} – ${formatVnd(b)}/ngày`
}
