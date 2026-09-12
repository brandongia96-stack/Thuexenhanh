// Định dạng hiển thị. Tất cả tiếng Việt, tiền VNĐ.

const nf = new Intl.NumberFormat('vi-VN')

export function formatVnd(n) {
  if (n == null || Number.isNaN(n)) return null
  return nf.format(n) + 'đ'
}

// 850000 -> "850K" ; 1200000 -> "1,2 triệu"
export function formatVndShort(n) {
  if (n == null || Number.isNaN(n)) return null
  if (n >= 1_000_000) {
    const trieu = n / 1_000_000
    return (Number.isInteger(trieu) ? trieu : trieu.toFixed(1).replace('.', ',')) + ' triệu'
  }
  if (n >= 1000) return Math.round(n / 1000) + 'K'
  return nf.format(n) + 'đ'
}

export function formatTokens(n) {
  if (n == null) return null
  return nf.format(n) + ' token'
}

export function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// "3 ngày trước", "vừa xong"
export function timeAgo(iso) {
  if (!iso) return null
  const giay = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (giay < 60) return 'vừa xong'
  if (giay < 3600) return Math.floor(giay / 60) + ' phút trước'
  if (giay < 86400) return Math.floor(giay / 3600) + ' giờ trước'
  if (giay < 2592000) return Math.floor(giay / 86400) + ' ngày trước'
  return formatDate(iso)
}

// Số ngày còn lại tới khi hết hạn. Âm = đã hết hạn.
export function daysUntil(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

// Che số điện thoại trước khi khách bấm "Xem số điện thoại": 0901234567 -> 0901 234 ***
export function maskPhone(phone) {
  if (!phone) return null
  const s = String(phone).replace(/\D/g, '')
  if (s.length < 7) return '***'
  return `${s.slice(0, 4)} ${s.slice(4, 7)} ***`
}

// 0901234567 -> "0901 234 567"
export function formatPhone(phone) {
  if (!phone) return null
  const s = String(phone).replace(/\D/g, '')
  if (s.length !== 10) return phone
  return `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}`
}
