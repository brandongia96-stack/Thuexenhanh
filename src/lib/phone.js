// Số điện thoại Việt Nam. Chuẩn hoá về dạng 10 số bắt đầu bằng 0.

const DAU_SO = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/

// Nhận "+84 901 234 567", "84901234567", "0901-234-567" -> "0901234567"
export function normalizePhone(input) {
  if (!input) return null
  let s = String(input).replace(/\D/g, '')
  if (s.startsWith('84')) s = '0' + s.slice(2)
  if (s.length === 9 && !s.startsWith('0')) s = '0' + s
  return s
}

export function isValidPhone(input) {
  const s = normalizePhone(input)
  return Boolean(s) && DAU_SO.test(s)
}

// Dạng E.164 cho SMS/OTP: +84901234567
export function toE164(input) {
  const s = normalizePhone(input)
  if (!isValidPhone(s)) return null
  return '+84' + s.slice(1)
}

export function telHref(phone) {
  const s = normalizePhone(phone)
  return s ? `tel:${s}` : null
}

export function zaloHref(phone) {
  const s = normalizePhone(phone)
  return s ? `https://zalo.me/${s}` : null
}
