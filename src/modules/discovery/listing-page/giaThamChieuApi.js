// discovery/listing-page/giaThamChieuApi — đọc giá tham chiếu cho bảng tính.
//
// contracts/api.md mục 2: `reference_price_now` — CẤM hardcode giá trong code,
// bảng rỗng (admin luồng 10 chưa nhập) thì ẩn cả khối ước tính, không hiện 0đ.
//
// Mã `code` đã CHỐT ở contracts/api.md mục 2: 'xang_e10' cho xăng (đổi từ
// 'xang_ron95' ngày 03/10 — bảng giá không còn RON95 thường), 'dau_do' cho dầu.
// Giá do Edge Function `gia-nhien-lieu` tự lấy 2 lần/ngày (0019).
// Lệch mã thì khối ước tính tự ẩn, không BAO GIỜ hiện số sai.
const MA_GIA_THEO_NHIEN_LIEU = {
  xang: 'xang_e10',
  dau: 'dau_do',
}

// Quá chừng này ngày chưa kiểm lại được giá (nguồn hỏng, cron dừng) thì coi
// như không có giá — thà ẩn còn hơn hiện số cũ như thể là giá hôm nay.
const GIA_CU_TOI_DA_NGAY = 10
const MOT_NGAY = 86_400_000

import { getSupabase } from '../../../lib/supabase'
import { HAS_BACKEND } from '../../../lib/config'

/**
 * @param {'xang'|'dau'|'dien'|'hybrid'|null} fuel
 * @returns {Promise<{price:number, unit:string, source:string, effectiveDate:string}|null>}
 */
export async function layGiaThamChieu(fuel) {
  const ma = MA_GIA_THEO_NHIEN_LIEU[fuel]
  if (!ma || !HAS_BACKEND) return null

  try {
    const sb = await getSupabase()
    const { data, error } = await sb
      .from('reference_price_now')
      .select('price,unit,source,effective_date,checked_at')
      .eq('code', ma)
      .maybeSingle()
    if (error || !data) return null
    if (data.checked_at && Date.now() - new Date(data.checked_at).getTime() > GIA_CU_TOI_DA_NGAY * MOT_NGAY) {
      return null
    }
    return {
      price: data.price,
      unit: data.unit,
      source: data.source,
      effectiveDate: data.effective_date,
    }
  } catch {
    // Mất mạng hay chưa cấu hình: ẩn khối ước tính, không làm hỏng cả trang.
    return null
  }
}
