// listing/media/storage — đẩy ảnh lên Supabase Storage và dựng hàng cho `listing_images`.
//
// Đường dẫn theo contracts/api.md mục 5:
//   listing-images/<owner_id>/<listing_id>/<uuid>_<ban>.webp
// Bucket `listing-images`: đọc công khai, ghi = chủ tin (RLS lo).

import { getSupabase } from '../../../lib/supabase'
import { DUOI_FILE, DINH_DANG } from './imagePipeline'

export const BUCKET = 'listing-images'

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
 * @returns {{ url_thumb, url_medium, url_full, blur_base64, width, height }}
 */
export async function tailenMotAnh(anh, { ownerId, listingId }) {
  const sb = await getSupabase()

  // Tuần tự chứ không song song: mạng 4G chập chờn, ba request cùng lúc
  // dễ nghẽn rồi hỏng cả ba. Chậm hơn vài giây nhưng chắc.
  const url_full = await day(sb, duongDan(ownerId, listingId, anh.id, 'full'), anh.ban.full)
  const url_medium = await day(sb, duongDan(ownerId, listingId, anh.id, 'medium'), anh.ban.medium)
  const url_thumb = await day(sb, duongDan(ownerId, listingId, anh.id, 'thumb'), anh.ban.thumb)

  return {
    url_thumb,
    url_medium,
    url_full,
    blur_base64: anh.blur,
    width: anh.rong,
    height: anh.cao,
  }
}

/**
 * Dựng hàng để ghi vào `listing_images` (contracts/schema.sql).
 *
 * `is_cover` luôn false ở đây: schema chỉ cho MỘT ảnh bìa mỗi tin (unique index
 * `listing_images_cover_idx`). Chèn ảnh mới với is_cover=true khi tin đã có bìa
 * cũ là vỡ ràng buộc — bìa được đặt sau, ở `sapXepAnh()` trong listingApi.
 */
export function hangAnh({ listingId, daTaiLen, sortOrder }) {
  return {
    listing_id: listingId,
    url_thumb: daTaiLen.url_thumb,
    url_medium: daTaiLen.url_medium,
    url_full: daTaiLen.url_full,
    blur_base64: daTaiLen.blur_base64,
    width: daTaiLen.width,
    height: daTaiLen.height,
    sort_order: sortOrder,
    is_cover: false,
  }
}

/**
 * Ảnh để hiện lên giao diện, chọn đúng bản theo chỗ dùng.
 * Dùng chung cho luồng 03/04/05 — đọc hàng `listing_images` ra thứ render được.
 * Không có đường lui về ảnh gốc: danh sách chỉ được dùng `thumb` (HIEU-NANG 1.1).
 */
export function nguonAnh(hang, ban = 'medium') {
  const url = hang?.[`url_${ban}`] ?? null
  if (!url) return null
  return {
    url,
    blur: hang.blur_base64 ?? null,
    width: hang.width ?? null,
    height: hang.height ?? null,
  }
}
