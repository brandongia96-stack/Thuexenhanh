// Gói nạp token + nhãn hiển thị cho sổ ví.
//
// Giá TUYẾN TÍNH, không có gói nào "tiết kiệm hơn". Cố tình như vậy: bịa ra
// mức chiết khấu để đẩy người ta nạp nhiều hơn nhu cầu là bán trước thứ mình
// chưa giao. Nạp bao nhiêu cũng cùng một giá 4.000đ/token.

import { TOKEN_VND, TOKENS_PER_MONTH } from '../../lib/config'
import { vndForTokens } from '../../lib/pricing'

export const TOI_THIEU = TOKENS_PER_MONTH   // đúng một tháng của một xe
export const TOI_DA = 2500                  // khớp giới hạn ở Edge Function create-topup

// Mô tả theo thứ người ta thực sự mua: số tháng hiển thị, không phải "gói Vàng".
export const GOI_NAP = [10, 30, 60, 120].map((tokens) => ({
  tokens,
  vnd: vndForTokens(tokens),
  moTa: `${tokens / TOKENS_PER_MONTH} tháng hiển thị cho 1 xe`,
}))

export const NHAN_GIAO_DICH = {
  nap:     { label: 'Nạp token',     tone: 'verified' },
  tang:    { label: 'Được tặng',     tone: 'verified' },
  hoan:    { label: 'Hoàn token',    tone: 'info' },
  tieu:    { label: 'Trừ token',     tone: 'neutral' },
  thu_hoi: { label: 'Thu hồi',       tone: 'danger' },
}

export const NHAN_TRANG_THAI_NAP = {
  cho_thanh_toan: { label: 'Chờ chuyển khoản', tone: 'warn' },
  da_thanh_toan:  { label: 'Đã cộng token',    tone: 'verified' },
  that_bai:       { label: 'Thất bại',         tone: 'danger' },
  huy:            { label: 'Đã huỷ',           tone: 'neutral' },
}

export function quyDoiVnd(tokens) {
  return (tokens ?? 0) * TOKEN_VND
}
