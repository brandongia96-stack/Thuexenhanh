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
export async function danhSachXeCuaToi(ownerId, { cursor = null, limit = TRANG } = {}) {
  const sb = await getSupabase()

  let q = sb
    .from('listing_card')
    .select(COT_THE)
    .eq('owner_id', ownerId)
    .order('published_at', { ascending: false, nullsFirst: true })
    .order('id', { ascending: false })
    .limit(limit + 1) // lấy dư 1 để biết "còn nữa", khỏi phải đếm tổng

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
 * Số dư ví. Đọc view `wallet_balances` — client chỉ được ĐỌC ví,
 * mọi thao tác ghi đi qua Edge Function (contracts/api.md mục 0).
 * Trả `null` khi chủ xe chưa từng có ví: "chưa có ví" khác "có ví, 0 token".
 */
export async function soDuVi(userId) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('wallet_balances')
    .select('wallet_id,token_da_nap,token_da_tieu,so_du')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
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

/** Một tin đầy đủ hơn cho trang số liệu. Vẫn không lấy `*`. */
export async function docTheXe(listingId) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('listing_card')
    .select(COT_THE + ',owner_id')
    .eq('id', listingId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
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
