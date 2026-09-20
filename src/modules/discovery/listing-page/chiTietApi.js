// discovery/listing-page/chiTietApi — đọc một tin đầy đủ để dựng trang chi tiết.
//
// Luật từ contracts/api.md mục 2 và HIEU-NANG.md mục 2.1:
//   · Danh sách đọc view `listing_card`. Chỉ Ở ĐÂY mới lấy mô tả, thông số, ảnh.
//   · CẤM `select *` — liệt kê cột rõ ràng. `search_tsv` mà lọt vào payload là
//     cõng thêm vài KB mỗi lần mở trang, trên 4G thấy ngay.
//   · CẤM lấy `contact_phone` / `contact_zalo`. Số chỉ về qua Edge Function
//     `reveal-phone` sau khi khách bấm — để bot không quét sạch danh bạ chủ xe.

import { getSupabase } from '../../../lib/supabase'
import { HAS_BACKEND } from '../../../lib/config'
// Cố ý import thẳng `listing/lifecycle` chứ không qua `listing/index.js`:
// file index re-export cả FormDangTin và UploadAnh, mà hai file đó kéo theo
// CSS + browser-image-compression. Đi qua cửa chung là nhét cả form đăng tin
// vào gói của trang xem xe — vỡ ngân sách JS (HIEU-NANG.md mục 3).
// `lifecycle.js` là logic thuần, không có tác dụng phụ.
import { trangThaiThuc, dangHienThi } from '../../listing/lifecycle'

// Cột của bảng `listings` mà trang chi tiết thực sự dùng. Không có cột nào
// khác được thêm vào đây nếu giao diện không hiển thị nó.
const COT = [
  'id', 'owner_id', 'status',
  'brand_text', 'model_text', 'year', 'color', 'seats', 'transmission',
  'fuel', 'fuel_consumption', 'body_style', 'description',
  'price_per_day', 'price_per_month', 'deposit_note', 'delivery_fee_note',
  'limit_km_per_day', 'extra_km_fee',
  'province_id', 'district_id', 'address_text', 'lat', 'lng',
  'amenity_codes', 'is_verified', 'published_at', 'expires_at', 'created_at',
].join(',')

// Ảnh: lấy medium + full + blur. KHÔNG lấy url_original (cấm phục vụ ảnh gốc).
// `width`/`height` bắt buộc — thiếu là trang nhảy khi ảnh tải xong (CLS).
const COT_ANH = 'id,url_thumb,url_medium,url_full,blur_base64,width,height,sort_order,is_cover'
const COT_NGAY_CHAN = 'id,date_from,date_to,note'

const SELECT =
  `${COT},` +
  `listing_images(${COT_ANH}),` +
  `listing_blocked_dates(${COT_NGAY_CHAN}),` +
  // Tên tỉnh/quận lấy kèm trong CÙNG một request. Tách ra gọi riêng là thêm
  // một vòng mạng chỉ để hiện hai chữ (HIEU-NANG.md mục 0).
  `provinces(name),districts(name)`

// Bộ nhớ tạm trong phiên: bấm Quay lại rồi mở lại cùng chiếc xe là hiện ngay,
// đồng thời là chỗ chứa kết quả prefetch khi khách rê chuột vào thẻ xe.
const DOI_HAN_MS = 60 * 1000 // stale-while-revalidate 60s (HIEU-NANG.md mục 5)
const boNho = new Map()

function conTuoi(o) {
  return o && Date.now() - o.luc < DOI_HAN_MS
}

/**
 * Đọc một tin. Trả về `null` khi không đọc được — RLS chỉ cho khách thấy tin
 * `dang_hien_thi` / `sap_het_han`, nên tin đã hết hạn hoặc bị ẩn cũng rơi vào
 * nhánh này. Giao diện xử lý chung một trạng thái "tin không còn hiển thị".
 */
export async function docTinChiTiet(id, { boQuaBoNho = false } = {}) {
  if (!HAS_BACKEND || !id) return null

  const cu = boNho.get(id)
  if (!boQuaBoNho && conTuoi(cu)) return cu.tin

  const sb = await getSupabase()
  const { data, error } = await sb
    .from('listings')
    .select(SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    boNho.delete(id)
    return null
  }

  const tin = chuanHoa(data)
  boNho.set(id, { tin, luc: Date.now() })
  return tin
}

/**
 * Nạp trước một tin khi khách rê chuột / chạm vào thẻ xe ở trang tìm kiếm
 * (HIEU-NANG.md mục 3). Luồng 04 gọi hàm này từ thẻ xe; mở trang sau đó
 * gần như tức thì vì dữ liệu đã nằm trong `boNho`.
 * Nuốt mọi lỗi: prefetch hỏng thì im lặng, lần mở thật sẽ gọi lại.
 */
export function napTruocTin(id) {
  if (!id || conTuoi(boNho.get(id))) return
  docTinChiTiet(id).catch(() => {})
}

function chuanHoa(d) {
  const anh = (d.listing_images ?? [])
    .filter((a) => !a.deleted_at)
    .sort((a, b) => (b.is_cover === true) - (a.is_cover === true) || a.sort_order - b.sort_order)

  const homNay = new Date().toISOString().slice(0, 10)

  return {
    ...d,
    anh,
    // Chỉ hiện khoảng bận còn trong tương lai. Ngày bận của tháng trước không
    // phải thông tin, chỉ là rác trên màn hình.
    ngayChan: (d.listing_blocked_dates ?? [])
      .filter((n) => !n.deleted_at && n.date_to >= homNay)
      .sort((a, b) => a.date_from.localeCompare(b.date_from)),
    tenTinh: d.provinces?.name ?? null,
    tenQuan: d.districts?.name ?? null,
    // Trạng thái THẬT tại thời điểm nhìn: cột `status` do cron cập nhật, giữa
    // hai lần cron một tin `dang_hien_thi` có thể đã quá hạn rồi. Không được
    // để trang nói dối khách là tin còn sống.
    trangThai: trangThaiThuc(d),
  }
}

/** Tin có còn được phép hiện số điện thoại không. */
export function conHienThi(tin) {
  return Boolean(tin) && dangHienThi(tin.trangThai)
}

/** Dọn bộ nhớ tạm của một tin — dùng sau khi chủ xe vừa sửa tin đó. */
export function quenTin(id) {
  boNho.delete(id)
}
