// discovery/search/idDiaGioi — đổi TÊN tỉnh/quận (thứ nằm trong URL) sang ID (thứ CSDL lọc).
//
// Chiều ngược lại (id → tên, để hiện lên thẻ xe) là `discovery/diaGioi.js` của
// luồng 05. Dùng CHUNG một bảng, một lần tải, một cache localStorage
// (HIEU-NANG.md mục 5) — không tải tỉnh/quận hai lần trên 4G.
//
// Tên quận trùng giữa các tỉnh nên khoá theo cặp "<province_id>|<tên>".

import { taiTenDiaGioi } from '../diaGioi'

let nguon = null // bảng gốc đã đảo
let daoNguoc = null

function dao(b) {
  if (nguon === b) return daoNguoc
  nguon = b
  daoNguoc = {
    tinh: Object.fromEntries(Object.entries(b.tinh ?? {}).map(([id, ten]) => [ten, Number(id)])),
    quan: Object.fromEntries(
      Object.entries(b.quan ?? {}).map(([id, ten]) => [`${b.quanTinh?.[id]}|${ten}`, Number(id)]),
    ),
  }
  return daoNguoc
}

/** @returns {Promise<{province_id: number|null, district_id: number|null}>} */
export async function idDiaGioi(tenTinh, tenQuan) {
  const d = dao(await taiTenDiaGioi())
  const province_id = d.tinh[tenTinh] ?? null
  const district_id = province_id && tenQuan ? (d.quan[`${province_id}|${tenQuan}`] ?? null) : null
  return { province_id, district_id }
}
