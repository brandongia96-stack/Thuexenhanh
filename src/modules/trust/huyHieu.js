// trust/huyHieu — quy huy hiệu tin cậy từ dữ liệu THẬT của hồ sơ chủ xe.
// Không có dữ liệu thì không có huy hiệu (CLAUDE.md 1.2). Không bán, không tự gán.

const SAU_THANG_MS = 183 * 24 * 3600 * 1000

/** @returns {{code:string,label:string}[]} */
export function tinhHuyHieu({ user, soTinTuoi = 0, soBaoCao = 0, now = Date.now() }) {
  if (!user) return []
  const ds = []
  if (user.phone_verified_at) ds.push({ code: 'sdt', label: 'Đã xác thực SĐT' })
  if (user.verify_status === 'da_xac_minh') ds.push({ code: 'giay_to', label: 'Đã xác minh giấy tờ xe' })
  const tuoi = user.created_at ? now - new Date(user.created_at).getTime() : 0
  if (tuoi >= SAU_THANG_MS && soTinTuoi >= 3 && soBaoCao === 0) {
    ds.push({ code: 'lau_nam', label: 'Chủ xe lâu năm' })
  }
  return ds
}
