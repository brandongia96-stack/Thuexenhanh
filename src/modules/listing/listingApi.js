// listing/listingApi — đọc ghi tin đăng.
//
// Luật từ contracts/api.md mục 0, KHÔNG được phá:
//   · Client ghi thẳng `listings` / `listing_images` / `listing_blocked_dates`
//     của chính mình (RLS chặn người khác).
//   · Client TUYỆT ĐỐI không ghi: is_verified, published_at, expires_at,
//     và không tự đẩy status sang `dang_hien_thi`. Mấy thứ đó qua Edge Function.
//   · Không xoá cứng. Xoá = set deleted_at.

import { getSupabase, callFunction } from '../../lib/supabase'
import { HAS_BACKEND } from '../../lib/config'
import { normalizePhone } from '../../lib/phone'
import { STATUS } from './lifecycle'
import { tailenMotAnh, hangAnh } from './media/storage'

// ─────────────────────────────────────────────
// Danh mục địa giới: tên (form dùng) ↔ id (CSDL dùng)
// Dữ liệu tĩnh, đổi vài năm một lần → tải một lần, để localStorage.
// HIEU-NANG.md mục 5.
// ─────────────────────────────────────────────
const KHOA_DIA_GIOI = 'txn_dia_gioi_v1'
let diaGioiCache = null

async function taiDiaGioi() {
  if (diaGioiCache) return diaGioiCache

  try {
    const luu = JSON.parse(localStorage.getItem(KHOA_DIA_GIOI) || 'null')
    if (luu?.tinh) {
      diaGioiCache = luu
      return luu
    }
  } catch {
    /* localStorage hỏng thì tải lại từ mạng, không sao */
  }

  if (!HAS_BACKEND) return { tinh: {}, quan: {} }

  const sb = await getSupabase()
  const [{ data: tinhRows }, { data: quanRows }] = await Promise.all([
    sb.from('provinces').select('id,name').is('deleted_at', null),
    sb.from('districts').select('id,name,province_id').is('deleted_at', null),
  ])

  const tinh = Object.fromEntries((tinhRows ?? []).map((r) => [r.name, r.id]))
  // Khoá quận là "<province_id>|<tên quận>" vì tên quận trùng nhau giữa các tỉnh.
  const quan = Object.fromEntries((quanRows ?? []).map((r) => [r.province_id + '|' + r.name, r.id]))

  diaGioiCache = { tinh, quan }
  try {
    localStorage.setItem(KHOA_DIA_GIOI, JSON.stringify(diaGioiCache))
  } catch {
    /* hết chỗ lưu thì thôi, lần sau tải lại */
  }
  return diaGioiCache
}

async function idDiaGioi(tenTinh, tenQuan) {
  if (!tenTinh) return { province_id: null, district_id: null }
  const { tinh, quan } = await taiDiaGioi()
  const province_id = tinh[tenTinh] ?? null
  const district_id = province_id && tenQuan ? (quan[province_id + '|' + tenQuan] ?? null) : null
  return { province_id, district_id }
}

// Chiều ngược lại: từ id trong CSDL về tên, để đổ vào form lúc sửa tin.
async function tenDiaGioi(provinceId, districtId) {
  if (!provinceId) return { province: '', district: '' }
  const { tinh, quan } = await taiDiaGioi()
  const province = Object.keys(tinh).find((k) => tinh[k] === provinceId) ?? ''
  const district = districtId
    ? (Object.keys(quan).find((k) => quan[k] === districtId)?.split('|')[1] ?? '')
    : ''
  return { province, district }
}

// ─────────────────────────────────────────────
// Form ↔ hàng CSDL
// ─────────────────────────────────────────────
const soHoacNull = (v) => {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const chuHoacNull = (v) => {
  const s = typeof v === 'string' ? v.trim() : v
  return s ? s : null
}

/** Đổi giá trị form thành hàng `listings`. Chỉ gồm cột client được phép ghi. */
export async function formSangHang(form, ownerId) {
  const { province_id, district_id } = await idDiaGioi(form.province, form.district)

  return {
    owner_id: ownerId,

    brand_text: form.brand_text,
    model_text: form.model_text,
    year: soHoacNull(form.year),
    plate: chuHoacNull(form.plate)?.toUpperCase() ?? null,
    color: chuHoacNull(form.color),
    seats: soHoacNull(form.seats),
    transmission: chuHoacNull(form.transmission),
    fuel: chuHoacNull(form.fuel),
    fuel_consumption: soHoacNull(form.fuel_consumption),
    body_style: chuHoacNull(form.body_style),
    description: chuHoacNull(form.description),

    price_per_day: soHoacNull(form.price_per_day),
    price_per_month: soHoacNull(form.price_per_month),
    deposit_note: chuHoacNull(form.deposit_note),
    delivery_fee_note: chuHoacNull(form.delivery_fee_note),
    limit_km_per_day: soHoacNull(form.limit_km_per_day),
    extra_km_fee: soHoacNull(form.extra_km_fee),

    province_id,
    district_id,
    address_text: chuHoacNull(form.address_text),

    amenity_codes: Array.isArray(form.amenity_codes) ? form.amenity_codes : [],
    contact_phone: normalizePhone(form.contact_phone),
    contact_zalo: form.contact_zalo ? normalizePhone(form.contact_zalo) : null,
  }
}

/** Chiều ngược: hàng CSDL → giá trị form. */
export async function hangSangForm(l) {
  const { province, district } = await tenDiaGioi(l.province_id, l.district_id)
  return {
    ...l,
    province,
    district,
    // Ô nhập của React phải là chuỗi, null sẽ bị coi là uncontrolled input.
    year: l.year ?? '',
    seats: l.seats ?? '',
    price_per_day: l.price_per_day ?? '',
    price_per_month: l.price_per_month ?? '',
    limit_km_per_day: l.limit_km_per_day ?? '',
    extra_km_fee: l.extra_km_fee ?? '',
    fuel_consumption: l.fuel_consumption ?? '',
    amenity_codes: l.amenity_codes ?? [],
  }
}

// ─────────────────────────────────────────────
// Đọc
// ─────────────────────────────────────────────

/** Một tin đầy đủ để sửa: kèm ảnh và lịch chặn ngày. RLS lo phần quyền. */
export async function docTin(id) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('listings')
    .select('*, listing_images(*), listing_blocked_dates(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    ...data,
    listing_images: (data.listing_images ?? [])
      .filter((a) => !a.deleted_at)
      .sort((a, b) => a.sort_order - b.sort_order),
    listing_blocked_dates: (data.listing_blocked_dates ?? []).filter((d) => !d.deleted_at),
  }
}

/**
 * Danh sách tin của chính chủ xe.
 * Cấm `select *` (HIEU-NANG mục 2.1) — chỉ lấy cột bảng "Xe của tôi" cần.
 * Phân trang bằng cursor, không OFFSET.
 */
export async function danhSachTinCuaToi(ownerId, { cursor = null, limit = 20 } = {}) {
  const sb = await getSupabase()
  let q = sb
    .from('listings')
    .select(
      'id,status,brand_text,model_text,year,seats,transmission,price_per_day,' +
      'province_id,district_id,is_verified,published_at,expires_at,created_at,reject_reason,' +
      'listing_images(url,is_cover,sort_order)',
    )
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  if (cursor) {
    q = q.or(
      `created_at.lt.${cursor.created_at},` +
      `and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await q
  if (error) throw error

  const cuoi = data?.[data.length - 1]
  return {
    items: data ?? [],
    // Không đếm tổng số — truy vấn đắt mà chủ xe không quan tâm (HIEU-NANG 2.2).
    conNua: (data?.length ?? 0) === limit,
    cursor: cuoi ? { created_at: cuoi.created_at, id: cuoi.id } : null,
  }
}

// ─────────────────────────────────────────────
// Ghi
// ─────────────────────────────────────────────

/** Tạo bản nháp. Không gửi `status` — CSDL mặc định `nhap`. */
export async function taoNhap(form, ownerId) {
  const sb = await getSupabase()
  const hang = await formSangHang(form, ownerId)
  const { data, error } = await sb.from('listings').insert(hang).select('id,status').single()
  if (error) throw error
  return data
}

/**
 * Cập nhật nội dung tin. Chỉ ghi cột nội dung — mọi cột do server quản
 * (status, published_at, expires_at, is_verified) đều không có trong `formSangHang`.
 */
export async function capNhatTin(id, form, ownerId) {
  const sb = await getSupabase()
  const hang = await formSangHang(form, ownerId)
  delete hang.owner_id // không cho đổi chủ tin
  const { error } = await sb.from('listings').update(hang).eq('id', id)
  if (error) throw error
}

/** Xoá mềm. CLAUDE.md mục 1.3: không xoá cứng dữ liệu. */
export async function xoaTin(id) {
  const sb = await getSupabase()
  const { error } = await sb
    .from('listings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** Ẩn tin khỏi tìm kiếm mà vẫn giữ nguyên dữ liệu. */
export async function anTin(id) {
  const sb = await getSupabase()
  const { error } = await sb.from('listings').update({ status: STATUS.AN }).eq('id', id)
  if (error) throw error
}

/**
 * Gửi tin đi duyệt. Đi qua Edge Function vì server còn phải tạo hàng
 * `moderation_queue` và ghi `listing_events` — client làm được một nửa
 * thì dữ liệu lệch.
 */
export async function guiDuyet(listingId) {
  return callFunction('submit-listing', { listing_id: listingId })
}

// ─────────────────────────────────────────────
// Ảnh
// ─────────────────────────────────────────────

/**
 * Tải ảnh mới lên Storage rồi ghi hàng vào `listing_images`.
 * @param {(xong:number, tong:number) => void} onTienDo
 */
export async function luuAnhMoi(listingId, ownerId, danhSachAnh, { batDauTu = 0, onTienDo } = {}) {
  const sb = await getSupabase()
  const hang = []

  for (let i = 0; i < danhSachAnh.length; i++) {
    const daTaiLen = await tailenMotAnh(danhSachAnh[i], { ownerId, listingId })
    hang.push(hangAnh({
      listingId,
      daTaiLen,
      sortOrder: batDauTu + i,
      isCover: danhSachAnh[i].laBia === true,
    }))
    onTienDo?.(i + 1, danhSachAnh.length)
  }

  if (!hang.length) return []
  const { data, error } = await sb.from('listing_images').insert(hang).select('*')
  if (error) throw error
  return data
}

/** Đổi thứ tự + ảnh bìa cho ảnh đã lưu. */
export async function capNhatThuTuAnh(danhSach) {
  const sb = await getSupabase()
  await Promise.all(
    danhSach.map((a, i) =>
      sb.from('listing_images')
        .update({ sort_order: i, is_cover: a.is_cover === true })
        .eq('id', a.id),
    ),
  )
}

export async function xoaAnh(imageId) {
  const sb = await getSupabase()
  const { error } = await sb
    .from('listing_images')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', imageId)
  if (error) throw error
}

// ─────────────────────────────────────────────
// Lịch chặn ngày
// ─────────────────────────────────────────────

/**
 * Ghi đè toàn bộ lịch chặn của một tin: xoá mềm hàng cũ rồi chèn hàng mới.
 * Lịch chặn là một tập hợp, không phải bản ghi có lịch sử cần giữ — nên
 * thay cả cụm đơn giản và đúng hơn là dò từng khoảng xem đổi gì.
 */
export async function luuNgayChan(listingId, khoang) {
  const sb = await getSupabase()

  const { error: loiXoa } = await sb
    .from('listing_blocked_dates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('listing_id', listingId)
    .is('deleted_at', null)
  if (loiXoa) throw loiXoa

  if (!khoang.length) return []

  const { data, error } = await sb
    .from('listing_blocked_dates')
    .insert(khoang.map((k) => ({
      listing_id: listingId,
      date_from: k.date_from,
      date_to: k.date_to,
      note: k.note || null,
    })))
    .select('*')
  if (error) throw error
  return data
}

export const coBackend = () => HAS_BACKEND
