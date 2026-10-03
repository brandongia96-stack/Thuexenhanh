// owner/ownerApi — đọc dữ liệu cho bảng điều khiển chủ xe.
//
// Màn này CHỈ ĐỌC (LUONG-CHAT/03-chu-xe.md, mục "Bảng CSDL"). Không một hàm nào
// trong file này được ghi. Nút gia hạn chuyển tiếp sang luồng 06, không tự trừ token.
//
// Ba luật hiệu năng bám suốt file (HIEU-NANG.md):
//   · mục 2.1 — cấm `select *`. Danh sách đọc view `listing_card`, đúng cột cần.
//   · mục 2.2 — phân trang keyset, cấm OFFSET, không đếm tổng.
//   · mục 2.4 — số liệu đọc từ bảng gộp `events_daily`. CẤM quét bảng `events` thô.

import { getSupabase } from '../../lib/supabase'
import { KIND_QUAN_TAM, SO_NGAY, ngayBatDau } from './soLieu'

export const TRANG = 20

// Cột thẻ xe cần. `listing_card` đã bỏ sẵn mô tả / thông số / số điện thoại,
// nhưng vẫn liệt kê tay để lỡ view có nở thêm cột thì danh sách không nặng lên.
const COT_THE =
  'id,status,brand_text,model_text,year,seats,transmission,fuel,price_per_day,' +
  'province_id,district_id,is_verified,published_at,expires_at,' +
  'cover_thumb,cover_blur,cover_width,cover_height'

// Nhóm lọc ở màn "Xe của tôi". Lọc theo cột `status` trong CSDL (server cập nhật
// theo cron) — lọc ở server vì phân trang keyset không lọc lại phía client được.
export const NHOM_TRANG_THAI = {
  tat_ca: null,
  hien_thi: ['dang_hien_thi', 'sap_het_han'],
  cho: ['nhap', 'cho_duyet', 'tu_choi'],
  het_han: ['het_han', 'an'],
}

// PostgREST: giá trị có dấu `:` `+` trong bộ lọc `or` phải bọc nháy kép.
const nhay = (v) => `"${v}"`

/**
 * Xe của chính chủ xe, phân trang keyset.
 *
 * Sắp theo `published_at desc`. Tin chưa đăng (nháp, chờ duyệt) có
 * `published_at = null`; Postgres xếp NULL lên ĐẦU khi sắp giảm dần, nên cursor
 * phải xử lý hai pha: còn trong vùng NULL, và đã qua vùng NULL. Bỏ qua chỗ này
 * là bản nháp biến mất từ trang thứ hai — lỗi im lặng, khó thấy nhất.
 *
 * @param {string} ownerId
 * @param {{cursor?: {published_at: string|null, id: string}|null, limit?: number}} opts
 */
export async function danhSachXeCuaToi(ownerId, { cursor = null, limit = TRANG, nhom = 'tat_ca' } = {}) {
  const sb = await getSupabase()

  let q = sb
    .from('listing_card')
    .select(COT_THE)
    .eq('owner_id', ownerId)
    .order('published_at', { ascending: false, nullsFirst: true })
    .order('id', { ascending: false })
    .limit(limit + 1) // lấy dư 1 để biết "còn nữa", khỏi phải đếm tổng

  if (NHOM_TRANG_THAI[nhom]) q = q.in('status', NHOM_TRANG_THAI[nhom])

  if (cursor) {
    q = cursor.published_at == null
      // Vẫn đang trong vùng tin chưa đăng: lấy tiếp phần NULL còn lại,
      // rồi mới tới các tin đã đăng.
      ? q.or(`and(published_at.is.null,id.lt.${nhay(cursor.id)}),published_at.not.is.null`)
      // Đã qua vùng NULL: keyset thường trên (published_at, id).
      : q.or(
          `published_at.lt.${nhay(cursor.published_at)},` +
          `and(published_at.eq.${nhay(cursor.published_at)},id.lt.${nhay(cursor.id)})`,
        )
  }

  const { data, error } = await q
  if (error) throw error

  const hang = data ?? []
  const conNua = hang.length > limit
  const items = conNua ? hang.slice(0, limit) : hang
  const cuoi = items[items.length - 1]

  return {
    items,
    conNua,
    cursor: cuoi ? { published_at: cuoi.published_at ?? null, id: cuoi.id } : null,
  }
}

/**
 * Số liệu N ngày gần nhất cho một nhóm xe.
 *
 * ĐỌC BẢNG GỘP `events_daily`, không đụng bảng `events` thô (HIEU-NANG.md 2.4).
 * Luôn truyền `listingIds` của đúng những xe đang hiển thị trên màn — xin số liệu
 * cho cả trăm xe rồi vứt đi là cách nhanh nhất để thổi bay ngân sách 4G.
 *
 * Lọc thêm `owner_id` để Postgres dùng index `events_daily_owner_idx`.
 */
export async function soLieuNhieuXe(ownerId, listingIds, { soNgay = SO_NGAY } = {}) {
  if (!listingIds?.length) return []
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('events_daily')
    .select('listing_id,kind,day,count')
    .eq('owner_id', ownerId)
    .in('listing_id', listingIds)
    .in('kind', KIND_QUAN_TAM)
    .gte('day', ngayBatDau(soNgay))
  if (error) throw error
  return data ?? []
}

/**
 * Vị trí giá của một xe so với các xe CÙNG TỈNH đang hiển thị.
 *
 * Vì sao là "vị trí giá" chứ không phải "thứ hạng lượt xem" như brief mong muốn:
 * RLS của `events_daily` chỉ cho chủ xe đọc số của CHÍNH MÌNH (schema.sql,
 * policy `events_daily_read`). Muốn xếp hạng theo lượt xem thì phải có một hàm
 * RPC phía server trả về đúng một con số hạng, mà `contracts/` chỉ luồng 01 được
 * sửa. Nên ở đây làm thứ đọc được một cách trung thực: xe của anh đang rẻ hơn
 * bao nhiêu phần trăm xe cùng tỉnh. Không bịa ra một con số hạng giả.
 *
 * Hai truy vấn `count` có `head: true` — chỉ xin con số, không kéo hàng nào về.
 * Chỉ gọi ở trang số liệu của MỘT xe, không gọi trong danh sách.
 */
export async function viTriGia({ provinceId, pricePerDay, listingId }) {
  if (!provinceId || !pricePerDay) return null
  const sb = await getSupabase()

  const dangHien = (q) =>
    q.eq('province_id', provinceId).in('status', ['dang_hien_thi', 'sap_het_han'])

  const [tong, reHon] = await Promise.all([
    dangHien(sb.from('listing_card').select('id', { count: 'exact', head: true })),
    dangHien(sb.from('listing_card').select('id', { count: 'exact', head: true }))
      .lt('price_per_day', pricePerDay)
      .neq('id', listingId),
  ])
  if (tong.error) throw tong.error
  if (reHon.error) throw reHon.error

  const soXe = tong.count ?? 0
  if (soXe < 2) return null // một mình một chợ thì so với ai

  return {
    soXeCungTinh: soXe,
    soXeReHon: reHon.count ?? 0,
    // % số xe cùng tỉnh đang rẻ hơn xe này.
    phanTramReHon: Math.round(((reHon.count ?? 0) / Math.max(soXe - 1, 1)) * 100),
  }
}

/**
 * Số điện thoại + biển số của chính chủ xe, gom một lần cho cả trang.
 *
 * KHÔNG select thẳng `contact_phone`/`plate` từ `listings` (và cũng không có ở
 * `listing_card`): `0010_bao_ve_sdt.sql` đã hạ quyền đọc 3 cột nhạy cảm, đọc là
 * `42501`. Hàm RPC `listing_private_many` tự lọc theo `auth.uid()` ngay trong SQL —
 * tin không phải của mình thì đơn giản không nằm trong kết quả.
 *
 * Phần phụ: lỗi thì trả bảng rỗng, màn vẫn dùng được, chỉ ẩn dòng SĐT/biển số.
 * @returns {Promise<Map<string,{contact_phone:string|null, plate:string|null}>>}
 */
export async function thongTinRieng(listingIds) {
  const ra = new Map()
  if (!listingIds?.length) return ra
  try {
    const sb = await getSupabase()
    const { data, error } = await sb.rpc('listing_private_many', { p_ids: listingIds })
    if (error) throw error
    for (const r of data ?? []) ra.set(r.id, r)
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[owner] không lấy được SĐT/biển số:', e?.message)
  }
  return ra
}

/**
 * Tổng của chủ xe: đếm xe theo nhóm + hạn gần nhất + số tin sắp hết hạn.
 * Toàn bộ là `count` kiểu `head` (không kéo hàng nào về) trên đúng xe của mình,
 * đi theo index `(owner_id, status)`.
 */
export async function tongQuanXe(ownerId, nguongNgay = 3) {
  const sb = await getSupabase()
  const dem = (statuses) =>
    sb.from('listing_card').select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId).in('status', statuses)

  const han = new Date(Date.now() + nguongNgay * 86_400_000).toISOString()
  const [hien, cho, het, sap, gan] = await Promise.all([
    dem(NHOM_TRANG_THAI.hien_thi),
    dem(NHOM_TRANG_THAI.cho),
    dem(NHOM_TRANG_THAI.het_han),
    dem(NHOM_TRANG_THAI.hien_thi).lte('expires_at', han),
    sb.from('listing_card').select('expires_at')
      .eq('owner_id', ownerId).in('status', NHOM_TRANG_THAI.hien_thi)
      .not('expires_at', 'is', null)
      .order('expires_at', { ascending: true }).limit(1),
  ])
  for (const r of [hien, cho, het, sap, gan]) if (r.error) throw r.error

  return {
    dangHien: hien.count ?? 0,
    cho: cho.count ?? 0,
    hetHan: het.count ?? 0,
    sapHetHan: sap.count ?? 0,
    hetHanGanNhat: gan.data?.[0]?.expires_at ?? null,
  }
}

/**
 * Tổng lượt xem / lấy số 30 ngày của TOÀN BỘ xe của chủ xe (không chỉ trang đang hiện).
 * Vẫn đọc `events_daily`. Chỉ xin 2 cột, 2 loại sự kiện, tối đa 5.000 hàng.
 */
export async function tongSoLieuChuXe(ownerId, { soNgay = SO_NGAY } = {}) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('events_daily')
    .select('kind,count')
    .eq('owner_id', ownerId)
    .in('kind', ['view_listing', 'reveal_phone'])
    .gte('day', ngayBatDau(soNgay))
    .range(0, 4999)
  if (error) throw error
  const tong = { view_listing: 0, reveal_phone: 0 }
  for (const r of data ?? []) tong[r.kind] += Number(r.count) || 0

  return tong
}
