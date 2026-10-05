import { TOKEN_VND, TOKENS_PER_MONTH } from './config'

export function tokensForMonths(months, package_id = 'co_ban') {
  if (!Number.isInteger(months) || months < 1) throw new Error('Số tháng phải là số nguyên dương')
  const tpm = package_id === 'day_du' ? 20 : TOKENS_PER_MONTH
  return months * tpm
}

export function vndForTokens(tokens) {
  return tokens * TOKEN_VND
}

export function vndForMonths(months, package_id) {
  return vndForTokens(tokensForMonths(months, package_id))
}

export function layGoiHienThi(package_id = 'co_ban') {
  return [1, 3, 6, 12].map((months) => ({
    months,
    tokens: tokensForMonths(months, package_id),
    vnd: vndForMonths(months, package_id),
    label: `${months} tháng`,
  }))
}

export const GOI_HIEN_THI = layGoiHienThi('co_ban')

export function publishIdemKey(listingId, months) {
  const now = new Date()
  const ky = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  return `publish:${listingId}:${ky}:${months}`
}
