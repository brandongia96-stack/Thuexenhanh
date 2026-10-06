// listing/media/cat169 — cắt ảnh về khung 16:9 TRƯỚC khi vào imagePipeline.js.
//
// Vì sao cắt ngay từ đầu: thẻ xe và ảnh bìa đều hiển thị 16:9. Cắt sớm thì cả
// bốn bản (blur/thumb/medium/full) đều đúng tỉ lệ, đỡ nhảy khung (CLS) và đỡ
// byte cho phần ảnh không ai thấy.
//
// Cách cắt: lấy khung 16:9 lớn nhất nằm giữa ảnh. Ảnh dọc chụp bằng điện thoại
// sẽ mất nhiều phần trên/dưới — chủ xe nên chụp ngang khi có thể.
//
// Tự viết bằng canvas, không thư viện. Chỉ giữ tối đa 1600px chiều ngang:
// bản lớn nhất của pipeline là 1600w, phần dư chỉ làm chậm máy yếu.

export const TI_LE_KHUNG = 16 / 9
const RONG_TOI_DA = 1600

/** Hình chữ nhật cắt (toạ độ trên ảnh gốc). Hàm thuần, kiểm được trên Node. */
export function tinhKhung169(w, h) {
  if (w / h > TI_LE_KHUNG) {
    // Ảnh rộng hơn 16:9: cắt hai bên.
    const sw = Math.round(h * TI_LE_KHUNG)
    return { sx: Math.round((w - sw) / 2), sy: 0, sw, sh: h }
  }
  // Ảnh cao hơn (hoặc đúng) 16:9: cắt trên dưới.
  const sh = Math.round(w / TI_LE_KHUNG)
  return { sx: 0, sy: Math.round((h - sh) / 2), sw: w, sh }
}

async function docAnh(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* rơi xuống cách dưới */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    return await new Promise((ok, loi) => {
      const img = new Image()
      img.onload = () => ok(img)
      img.onerror = () => loi(new Error('Không đọc được ảnh này'))
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Trả về File đã cắt 16:9 (JPEG), giữ nguyên tên gốc.
 * Ảnh không đọc được thì ném lỗi, để xuLyAnh báo cho chủ xe như cũ.
 */
export async function catKhung169(file) {
  const anh = await docAnh(file)
  try {
    const { sx, sy, sw, sh } = tinhKhung169(anh.width, anh.height)
    const rong = Math.min(sw, RONG_TOI_DA)
    const cao = Math.round((rong / sw) * sh)

    const canvas = document.createElement('canvas')
    canvas.width = rong
    canvas.height = cao
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(anh, sx, sy, sw, sh, 0, 0, rong, cao)

    const blob = await new Promise((ok, loi) => {
      canvas.toBlob((b) => (b ? ok(b) : loi(new Error('Không cắt được ảnh'))), 'image/jpeg', 0.92)
    })
    return new File([blob], file.name, { type: 'image/jpeg' })
  } finally {
    anh.close?.()
  }
}
