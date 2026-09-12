// listing/media/imagePipeline — một ảnh chủ xe chọn → bốn bản.
//
// HIEU-NANG.md mục 1.1 (bắt buộc):
//   blur    20px, base64 nhúng thẳng vào JSON  → hiện NGAY, 0 request, < 1 KB
//   thumb   400w   → thẻ xe trong danh sách     < 25 KB
//   medium  800w   → ảnh bìa trang chi tiết     < 70 KB
//   full    1600w  → chỉ khi bấm phóng to       < 200 KB
// CẤM trả ảnh gốc ra danh sách.
//
// Vì sao tự viết bằng canvas thay vì gọi thư viện: đằng nào cũng phải vẽ lại
// bốn lần ở bốn kích cỡ, mà thư viện nén chỉ làm được một cỡ mỗi lần gọi —
// gọi bốn lần là giải mã ảnh bốn lần trên đúng cái máy Android tầm trung
// mà mình đang cố tiết kiệm.

export const CO_ANH = {
  blur:   { width: 20,   quality: 0.45, max: 1_024 },
  thumb:  { width: 400,  quality: 0.72, max: 25 * 1024 },
  medium: { width: 800,  quality: 0.75, max: 70 * 1024 },
  full:   { width: 1600, quality: 0.80, max: 200 * 1024 },
}

export const LOAI_CHAP_NHAN = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
export const SO_ANH_TOI_DA = 12
export const DUNG_LUONG_GOC_TOI_DA = 25 * 1024 * 1024 // 25 MB — ảnh điện thoại đời mới

let hoTroWebpCache = null

// Trình duyệt cũ không xuất được WebP thì rơi về JPEG, đừng để chủ xe kẹt.
function hoTroWebp() {
  if (hoTroWebpCache !== null) return hoTroWebpCache
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    hoTroWebpCache = c.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    hoTroWebpCache = false
  }
  return hoTroWebpCache
}

export const DINH_DANG = () => (hoTroWebp() ? 'image/webp' : 'image/jpeg')
export const DUOI_FILE = () => (hoTroWebp() ? 'webp' : 'jpg')

async function docAnh(file) {
  // `from-image` để ảnh chụp dọc bằng điện thoại không bị quay ngang.
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
    // Thu hồi ngay: giữ lại là rò bộ nhớ, máy yếu upload 12 ảnh sẽ đứng.
    URL.revokeObjectURL(url)
  }
}

function veLai(anh, rongDich) {
  const rongGoc = anh.width
  const caoGoc = anh.height
  // Không phóng to ảnh nhỏ hơn kích cỡ đích — chỉ làm file nặng thêm mà không nét hơn.
  const rong = Math.min(rongDich, rongGoc)
  const cao = Math.round((rong / rongGoc) * caoGoc)

  const canvas = document.createElement('canvas')
  canvas.width = rong
  canvas.height = cao
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(anh, 0, 0, rong, cao)
  return canvas
}

function xuatBlob(canvas, loai, chatLuong) {
  return new Promise((ok, loi) => {
    canvas.toBlob(
      (b) => (b ? ok(b) : loi(new Error('Không xuất được ảnh'))),
      loai,
      chatLuong,
    )
  })
}

// Ép xuống dưới ngưỡng dung lượng bằng cách hạ chất lượng dần.
// Tối đa 3 lần thử — quá số đó thì chấp nhận, đừng bắt chủ xe đợi.
async function xuatDuoiNguong(canvas, loai, chatLuongDau, nguong) {
  let q = chatLuongDau
  let blob = await xuatBlob(canvas, loai, q)
  for (let i = 0; i < 3 && blob.size > nguong && q > 0.35; i++) {
    q = Math.max(0.35, q - 0.12)
    blob = await xuatBlob(canvas, loai, q)
  }
  return blob
}

function blobSangDataUrl(blob) {
  return new Promise((ok, loi) => {
    const fr = new FileReader()
    fr.onload = () => ok(fr.result)
    fr.onerror = () => loi(new Error('Không đọc được ảnh mờ'))
    fr.readAsDataURL(blob)
  })
}

/**
 * Bản 20px nhúng thẳng vào JSON. Phải < 1 KB, nếu không thì mỗi thẻ xe
 * trong danh sách 20 tin sẽ cõng thêm 20 KB dữ liệu vô ích.
 */
async function sinhBlur(anh) {
  const canvas = veLai(anh, CO_ANH.blur.width)
  const loai = DINH_DANG()
  let blob = await xuatBlob(canvas, loai, CO_ANH.blur.quality)
  let dataUrl = await blobSangDataUrl(blob)

  // base64 phình ~33%. Còn quá ngưỡng thì hạ tiếp, hết cách thì bỏ hẳn —
  // thà không có ảnh mờ còn hơn làm chậm cả trang danh sách.
  if (dataUrl.length > CO_ANH.blur.max) {
    blob = await xuatBlob(canvas, loai, 0.3)
    dataUrl = await blobSangDataUrl(blob)
  }
  return dataUrl.length <= CO_ANH.blur.max ? dataUrl : null
}

/**
 * Xử lý một file ảnh.
 * @returns {{
 *   id: string, ten: string, rong: number, cao: number,
 *   blur: string|null,
 *   ban: { thumb: Blob, medium: Blob, full: Blob },
 *   xemTruoc: string,       // object URL của bản medium, nhớ gọi thuHoi()
 *   dungLuong: { goc: number, thumb: number, medium: number, full: number },
 *   thuHoi: () => void,
 * }}
 */
export async function xuLyAnh(file) {
  if (!LOAI_CHAP_NHAN.includes(file.type)) {
    throw new Error('Chỉ nhận ảnh JPG, PNG, WebP hoặc HEIC')
  }
  if (file.size > DUNG_LUONG_GOC_TOI_DA) {
    throw new Error('Ảnh nặng quá 25 MB, chọn ảnh khác')
  }

  const anh = await docAnh(file)
  const loai = DINH_DANG()

  try {
    const blur = await sinhBlur(anh)

    const [full, medium, thumb] = await Promise.all([
      xuatDuoiNguong(veLai(anh, CO_ANH.full.width), loai, CO_ANH.full.quality, CO_ANH.full.max),
      xuatDuoiNguong(veLai(anh, CO_ANH.medium.width), loai, CO_ANH.medium.quality, CO_ANH.medium.max),
      xuatDuoiNguong(veLai(anh, CO_ANH.thumb.width), loai, CO_ANH.thumb.quality, CO_ANH.thumb.max),
    ])

    const xemTruoc = URL.createObjectURL(medium)
    const rong = Math.min(CO_ANH.full.width, anh.width)
    const cao = Math.round((rong / anh.width) * anh.height)

    return {
      id: crypto.randomUUID(),
      ten: file.name,
      rong,
      cao,
      blur,
      ban: { thumb, medium, full },
      xemTruoc,
      dungLuong: { goc: file.size, thumb: thumb.size, medium: medium.size, full: full.size },
      thuHoi: () => URL.revokeObjectURL(xemTruoc),
    }
  } finally {
    // ImageBitmap giữ bộ nhớ tới khi đóng. Máy yếu không đóng là hết RAM.
    anh.close?.()
  }
}

/**
 * Xử lý nhiều file — LẦN LƯỢT, không song song.
 * Máy Android tầm trung giải mã 12 ảnh cùng lúc là treo trình duyệt.
 * @param {(xong: number, tong: number) => void} onTienDo
 */
export async function xuLyNhieuAnh(files, onTienDo) {
  const ketQua = []
  const loi = []
  const ds = Array.from(files)

  for (let i = 0; i < ds.length; i++) {
    try {
      ketQua.push(await xuLyAnh(ds[i]))
    } catch (e) {
      loi.push({ ten: ds[i].name, message: e.message })
    }
    onTienDo?.(i + 1, ds.length)
  }
  return { anh: ketQua, loi }
}
