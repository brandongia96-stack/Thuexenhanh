// discovery/diaGioi — đổi province_id / district_id ra tên để hiện lên thẻ xe.
//
// View `listing_card` chỉ có id chứ không có tên (cố ý: tên là dữ liệu tĩnh,
// nhét vào mỗi thẻ xe là lặp lại hàng nghìn lần trên đường truyền).
// Danh mục này đổi vài năm một lần → tải MỘT LẦN, để localStorage kèm số phiên
// bản (HIEU-NANG.md mục 5).
//
// Trang chi tiết KHÔNG dùng file này: nó lấy tên kèm luôn trong truy vấn tin
// (`provinces(name)`), khỏi tốn thêm vòng mạng nào.

import { trySupabase } from '../../lib/supabase'

const KHOA = 'txn_ten_dia_gioi_v1'
let bangTen = null
let dangTai = null

function docCache() {
  try {
    const o = JSON.parse(localStorage.getItem(KHOA) || 'null')
    return o?.tinh ? o : null
  } catch {
    return null
  }
}

/** Trả về { tinh: {id: tên}, quan: {id: tên} }. Không có mạng thì trả bảng rỗng. */
export function taiTenDiaGioi() {
  if (bangTen) return Promise.resolve(bangTen)
  if (dangTai) return dangTai

  const cache = docCache()
  if (cache) {
    bangTen = cache
    return Promise.resolve(bangTen)
  }

  dangTai = (async () => {
    const sb = await trySupabase()
    if (!sb) return { tinh: {}, quan: {} }

    const [{ data: t }, { data: q }] = await Promise.all([
      sb.from('provinces').select('id,name').is('deleted_at', null),
      sb.from('districts').select('id,name').is('deleted_at', null),
    ])

    const bang = {
      tinh: Object.fromEntries((t ?? []).map((r) => [r.id, r.name])),
      quan: Object.fromEntries((q ?? []).map((r) => [r.id, r.name])),
    }
    try {
      localStorage.setItem(KHOA, JSON.stringify(bang))
    } catch {
      /* hết chỗ thì lần sau tải lại, không sao */
    }
    bangTen = bang
    return bang
  })().finally(() => {
    dangTai = null
  })

  return dangTai
}

/** "Quận 1, TP.HCM" — thiếu dữ liệu thì trả null để giao diện ẩn cả dòng. */
export function tenNoi(bang, provinceId, districtId) {
  if (!bang) return null
  const s = [bang.quan?.[districtId], bang.tinh?.[provinceId]].filter(Boolean).join(', ')
  return s || null
}
