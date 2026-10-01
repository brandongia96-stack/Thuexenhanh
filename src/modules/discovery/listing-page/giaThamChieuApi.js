// discovery/listing-page/giaThamChieuApi — đọc giá tham chiếu cho bảng tính.
//
// contracts/api.md mục 2: `reference_price_now` — CẤM hardcode giá trong code,
// bảng rỗng (admin luồng 10 chưa nhập) thì ẩn cả khối ước tính, không hiện 0đ.
//
// Mã `code` đã CHỐT ở contracts/api.md mục 2 (bảng "Mã reference_prices.code
// đã chốt"): 'xang_ron95' cho xăng, 'dau_do' cho dầu. Luồng 10 nhập giá phải
// dùng đúng 2 mã này — lệch mã thì khối ước tính tự ẩn (graceful
// degradation), không BAO GIỜ hiện số sai.
const MA_GIA_THEO_NHIEN_LIEU = {
  xang: 'xang_ron95',
  dau: 'dau_do',
}

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
      .select('price,unit,source,effective_date')
      .eq('code', ma)
      .maybeSingle()
    if (error || !data) return null
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
