// listing/media/storage — đẩy ảnh lên Supabase Storage và dựng hàng cho `listing_images`.
//
// Đường dẫn theo contracts/api.md mục 5:
//   listing-images/<owner_id>/<listing_id>/<uuid>_<ban>.webp
// Bucket `listing-images`: đọc công khai, ghi = chủ tin (RLS lo).

import { requireSupabase } from '../../../lib/supabase'
import { DUOI_FILE, DINH_DANG } from './imagePipeline'

export const BUCKET = 'listing-images'

// ⚠️ CHỜ LUỒNG 01 — contracts/schema.sql hiện tại, bảng `listing_images` mới có
// (id, listing_id, url, width, height, sort_order, is_cover). Chưa có chỗ chứa
// bản mờ và ba cỡ ảnh mà HIEU-NANG.md mục 1.1 bắt buộc:
//
//   alter table listing_images
//     add column blur_data_url text,   -- base64 20px, < 1KB, trả kèm JSON
//     add column url_thumb  text,      -- 400w
//     add column url_medium text,      -- 800w
//     add column url_full   text;      -- 1600w
//
// Luồng 02 không được sửa contracts/. Ảnh vẫn được sinh và tải lên đủ bốn bản
// ngay từ bây giờ — chỉ là chưa ghi được đường dẫn vào CSDL. Khi luồng 01 thêm
// cột xong thì bật cờ này lên, không phải sửa chỗ nào khác.
export const COT_ANH_4_CO = false

function duongDan(ownerId, listingId, anhId, ban) {
  return `${ownerId}/${listingId}/${anhId}_${ban}.${DUOI_FILE()}`
}

async function day(sb, path, blob) {
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
    contentType: DINH_DANG(),
    // Tên file có UUID nên không bao giờ trùng; upsert để thử lại sau lỗi mạng
    // không bị chặn bởi chính file dở dang của lần trước.
    upsert: true,
    cacheControl: '31536000', // tên bất biến → cache một năm (HIEU-NANG mục 5)
  })
  if (error) throw error
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/**
 * Tải một ảnh đã xử lý lên Storage.
 * @param {object} anh   kết quả của xuLyAnh()
 * @returns {{ url_thumb, url_medium, url_full, blur_data_url, width, height }}
 */
export async function tailenMotAnh(anh, { ownerId, listingId }) {
  const sb = requireSupabase()

  // Tuần tự chứ không song song: mạng 4G chập chờn, ba request cùng lúc
  // dễ nghẽn rồi hỏng cả ba. Chậm hơn vài giây nhưng chắc.
  const url_full = await day(sb, duongDan(ownerId, listingId, anh.id, 'full'), anh.ban.full)
  const url_medium = await day(sb, duongDan(ownerId, listingId, anh.id, 'medium'), anh.ban.medium)
  const url_thumb = await day(sb, duongDan(ownerId, listingId, anh.id, 'thumb'), anh.ban.thumb)

  return {
    url_thumb,
    url_medium,
    url_full,
    blur_data_url: anh.blur,
    width: anh.rong,
    height: anh.cao,
  }
}

/**
 * Dựng hàng để ghi vào `listing_images`.
 * Khi chưa có bốn cột mới, cột `url` tạm trỏ vào bản `medium` — bản 800w, KHÔNG
 * phải ảnh gốc, nên vẫn không vi phạm luật "cấm trả ảnh gốc ra danh sách";
 * chỉ là danh sách đang cõng ảnh nặng hơn mức cần. Đây là nợ kỹ thuật có hạn,
 * trả xong ngay khi luồng 01 thêm cột.
 */
export function hangAnh({ listingId, daTaiLen, sortOrder, isCover }) {
  const co_ban = {
    listing_id: listingId,
    url: daTaiLen.url_medium,
    width: daTaiLen.width,
    height: daTaiLen.height,
    sort_order: sortOrder,
    is_cover: isCover,
  }

  if (!COT_ANH_4_CO) return co_ban

  return {
    ...co_ban,
    url_thumb: daTaiLen.url_thumb,
    url_medium: daTaiLen.url_medium,
    url_full: daTaiLen.url_full,
    blur_data_url: daTaiLen.blur_data_url,
  }
}

/**
 * Ảnh để hiện lên giao diện, chọn đúng bản theo chỗ dùng.
 * Dùng chung cho luồng 03/04/05 — đọc hàng `listing_images` ra thứ render được.
 */
export function nguonAnh(hang, ban = 'medium') {
  if (!hang) return null
  const url = hang[`url_${ban}`] ?? hang.url ?? null
  if (!url) return null
  return {
    url,
    blur: hang.blur_data_url ?? null,
    width: hang.width ?? null,
    height: hang.height ?? null,
  }
}
