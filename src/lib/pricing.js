// Mô hình giá — ĐÃ CHỐT ở CLAUDE.md mục 6. Luồng khác không được đổi công thức.
// 1 token = 4.000đ · 10 token / 1 xe / 1 tháng · tuyến tính · KHÔNG có gói vĩnh viễn.

import { TOKEN_VND, TOKENS_PER_MONTH } from './config'

export function tokensForMonths(months) {
  if (!Number.isInteger(months) || months < 1) throw new Error('Số tháng phải là số nguyên dương')
  return months * TOKENS_PER_MONTH
}

export function vndForTokens(tokens) {
  return tokens * TOKEN_VND
}

export function vndForMonths(months) {
  return vndForTokens(tokensForMonths(months))
}

// Các lựa chọn hiển thị ở màn đăng tin / gia hạn.
// Cố tình không có gói "tiết kiệm hơn" — giá tuyến tính, nói thẳng là tuyến tính.
export const GOI_HIEN_THI = [1, 3, 6, 12].map((months) => ({
  months,
  tokens: tokensForMonths(months),
  vnd: vndForMonths(months),
  label: `${months} tháng`,
}))

// Khoá chống trừ trùng. Cùng tin + cùng kỳ = cùng khoá = chỉ trừ một lần.
export function publishIdemKey(listingId, months) {
  const now = new Date()
  const ky = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  return `publish:${listingId}:${ky}:${months}`
}
