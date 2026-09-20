// owner/soLieu — gộp số liệu thô thành thứ hiển thị được.
//
// Toàn bộ file này là HÀM THUẦN: vào là mấy hàng `events_daily`, ra là chuỗi
// ngày + tổng. Không gọi mạng, không đụng React. Tách ra vì đây là chỗ dễ sai
// nhất (lệch ngày, cộng nhầm loại) và là chỗ cần soi kỹ nhất — số liệu này là
// HÀNG HOÁ đem bán cho chủ xe, sai một con số là mất niềm tin.
//
// Luật tuyệt đối (LUONG-CHAT/03-chu-xe.md mục "Cấm"):
//   · Không bịa số. Chưa có dữ liệu thì trả 0 và để giao diện nói "chưa có".
//   · Số 0 là số THẬT, khác với `null` là "chưa biết". Đừng lẫn hai thứ.

import { EVENT } from '../analytics/events'

export const SO_NGAY = 30

// Các loại sự kiện bảng điều khiển quan tâm. Xin đúng chừng này, không xin thừa —
// mỗi loại thừa là thêm ~30 hàng JSON cho mỗi xe (HIEU-NANG.md mục 2.4).
export const KIND_QUAN_TAM = [
  EVENT.VIEW_LISTING,
  EVENT.REVEAL_PHONE,
  EVENT.CLICK_CALL,
  EVENT.CLICK_ZALO,
]

/** 'YYYY-MM-DD' theo giờ máy người dùng. Cột `events_daily.day` cũng kiểu date. */
export function khoaNgay(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const ngay = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${ngay}`
}

/** Danh sách N ngày gần nhất, cũ → mới. Ngày không có dữ liệu vẫn phải có mặt,
 *  nếu không biểu đồ sẽ nén khoảng trống lại và nói dối về nhịp độ. */
export function chuoiNgay(soNgay = SO_NGAY, moc = new Date()) {
  const ra = []
  for (let i = soNgay - 1; i >= 0; i--) {
    const d = new Date(moc)
    d.setDate(d.getDate() - i)
    ra.push(khoaNgay(d))
  }
  return ra
}

export function ngayBatDau(soNgay = SO_NGAY, moc = new Date()) {
  const d = new Date(moc)
  d.setDate(d.getDate() - (soNgay - 1))
  return khoaNgay(d)
}

/** Bộ đếm rỗng: tất cả bằng 0. Dùng cho xe chưa có dòng nào trong `events_daily` —
 *  0 là con số thật, không phải dữ liệu bịa. */
export const soRong = () => ({
  view_listing: 0,
  reveal_phone: 0,
  click_call: 0,
  click_zalo: 0,
})

const congRong = soRong

/**
 * Gộp hàng `events_daily` theo từng xe.
 * @param {Array<{listing_id:string, kind:string, day:string, count:number}>} hang
 * @returns {Map<string, { tong: object, theoNgay: Map<string, object> }>}
 */
export function gopTheoXe(hang) {
  const ra = new Map()
  for (const h of hang ?? []) {
    if (!h?.listing_id) continue
    let xe = ra.get(h.listing_id)
    if (!xe) {
      xe = { tong: congRong(), theoNgay: new Map() }
      ra.set(h.listing_id, xe)
    }
    if (!(h.kind in xe.tong)) continue // loại sự kiện ngoài quan tâm: bỏ qua

    const so = Number(h.count) || 0
    xe.tong[h.kind] += so

    let ngay = xe.theoNgay.get(h.day)
    if (!ngay) {
      ngay = congRong()
      xe.theoNgay.set(h.day, ngay)
    }
    ngay[h.kind] += so
  }
  return ra
}

/** Cộng dồn số của nhiều xe thành số tổng của chủ xe. */
export function tongCuaChuXe(theoXe) {
  const tong = congRong()
  for (const xe of theoXe.values()) {
    for (const k of Object.keys(tong)) tong[k] += xe.tong[k]
  }
  return tong
}

/**
 * Chuỗi đủ N ngày để vẽ biểu đồ. Ngày thiếu = 0 (0 là số thật: hôm đó
 * không ai xem), không phải là "không có dữ liệu".
 */
export function chuoiDayDu(theoNgay, soNgay = SO_NGAY, moc = new Date()) {
  return chuoiNgay(soNgay, moc).map((day) => {
    const c = theoNgay?.get(day) ?? congRong()
    return { day, ...c }
  })
}

/** Tỷ lệ lấy số / lượt xem. `null` khi chưa có lượt xem nào — chia cho 0
 *  không ra 0%, nó ra "chưa biết". Giao diện phải ẩn khối, không hiện "0%". */
export function tyLeLaySo(luotXem, luotLaySo) {
  if (!luotXem) return null
  return (luotLaySo / luotXem) * 100
}

export function dinhDangTyLe(t) {
  if (t == null) return null
  return (t >= 10 ? Math.round(t) : Math.round(t * 10) / 10).toString().replace('.', ',') + '%'
}

/** Có con số nào khác 0 không. Dùng để quyết định vẽ biểu đồ hay hiện trạng thái rỗng. */
export function coSoLieu(tong) {
  return Boolean(tong && Object.values(tong).some((v) => v > 0))
}
