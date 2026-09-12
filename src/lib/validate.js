// Kiểm tra dữ liệu phía client. Đây chỉ là lớp thân thiện với người dùng —
// server vẫn phải kiểm lại, không tin client.

import { isValidPhone } from './phone'

export const GIA_TOI_THIEU = 100_000      // 100k/ngày
export const GIA_TOI_DA = 20_000_000      // 20 triệu/ngày

// Trả về { ok, fields } — fields là { ten_truong: 'thông báo tiếng Việt' }
export function validateListing(l) {
  const fields = {}

  if (!l.brand_text) fields.brand_text = 'Chọn hãng xe'
  if (!l.model_text) fields.model_text = 'Chọn dòng xe'

  const namNay = new Date().getFullYear()
  if (!l.year) fields.year = 'Chọn năm sản xuất'
  else if (l.year < 2000 || l.year > namNay) fields.year = `Năm sản xuất phải từ 2000 đến ${namNay}`

  if (!l.seats) fields.seats = 'Chọn số chỗ'
  if (!l.transmission) fields.transmission = 'Chọn hộp số'

  if (!l.price_per_day) fields.price_per_day = 'Nhập giá thuê theo ngày'
  else if (l.price_per_day < GIA_TOI_THIEU) fields.price_per_day = 'Giá quá thấp, kiểm tra lại'
  else if (l.price_per_day > GIA_TOI_DA) fields.price_per_day = 'Giá quá cao, kiểm tra lại'

  if (!l.province_id && !l.province) fields.province_id = 'Chọn tỉnh/thành'

  if (!l.contact_phone) fields.contact_phone = 'Nhập số điện thoại liên hệ'
  else if (!isValidPhone(l.contact_phone)) fields.contact_phone = 'Số điện thoại không hợp lệ'

  if (l.contact_zalo && !isValidPhone(l.contact_zalo)) fields.contact_zalo = 'Số Zalo không hợp lệ'

  if (l.description && l.description.length > 2000) fields.description = 'Mô tả tối đa 2000 ký tự'

  return { ok: Object.keys(fields).length === 0, fields }
}

export function validateTopup(tokenAmount) {
  if (!tokenAmount || tokenAmount < 1) return { ok: false, message: 'Số token phải lớn hơn 0' }
  if (!Number.isInteger(tokenAmount)) return { ok: false, message: 'Số token phải là số nguyên' }
  if (tokenAmount > 10_000) return { ok: false, message: 'Mỗi lần nạp tối đa 10.000 token' }
  return { ok: true }
}
