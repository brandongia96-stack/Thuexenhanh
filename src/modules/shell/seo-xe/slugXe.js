// shell/seo-xe/slugXe — slug ↔ (hãng, dòng xe) và slug ↔ tỉnh, cho URL
// /thue-xe/<dong-xe>/<tinh> (NGHIEN-CUU-XE-DIEN.md mục 2 đợt 2 #6).
//
// Dữ liệu TĨNH (CAR_MODELS, PROVINCES), slug sinh MỘT LẦN lúc nạp module —
// không gọi mạng, không phụ thuộc Supabase. `brand_text`/`model_text` trong
// CSDL luôn khớp đúng các chuỗi này vì form đăng tin chọn từ chính danh sách
// này (`fieldGroups.js`), không phải chữ tự do.

// Đuôi `.js` tường minh: Vite chạy như cũ, nhưng `scripts/prerender-seo.mjs`
// dùng chính file này bằng Node thuần — Node ESM không tự đoán đuôi.
import { CAR_MODELS } from '../../../data/brands.js'
import { PROVINCES } from '../../../data/provinces.js'
import { boDau } from '../../discovery/search/chuanHoa.js'

/** "Mercedes-Benz" → "mercedes-benz". Dùng chung quy tắc bỏ dấu với ô tìm kiếm. */
export function slugHoa(s) {
  return boDau(s).trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// slug dòng xe → { hang, dong } — đã kiểm không trùng (173 dòng, xem CHANGELOG).
const DONG_XE = new Map()
for (const [hang, models] of Object.entries(CAR_MODELS)) {
  for (const dong of models) {
    DONG_XE.set(`${slugHoa(hang)}-${slugHoa(dong)}`, { hang, dong })
  }
}

// slug tỉnh → tên tỉnh thật.
const TINH = new Map(PROVINCES.map((p) => [slugHoa(p), p]))

/** @returns {{hang: string, dong: string}|null} */
export function dongXeTuSlug(slug) {
  return DONG_XE.get(slug) ?? null
}

/** @returns {string|null} */
export function tinhTuSlug(slug) {
  return TINH.get(slug) ?? null
}

/** Đường dẫn trang SEO — dùng khi cần link tới từ nơi khác (vd. sitemap, thẻ xe). */
export function duongDanDongXe(hang, dong, tenTinh) {
  const slug = `${slugHoa(hang)}-${slugHoa(dong)}`
  return tenTinh ? `/thue-xe/${slug}/${slugHoa(tenTinh)}` : `/thue-xe/${slug}`
}
