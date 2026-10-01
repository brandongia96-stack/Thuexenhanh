// shell/seo-xe/noiDungSeo — chữ nghĩa của trang SEO dòng xe × tỉnh.
//
// VÌ SAO TÁCH RA RIÊNG: cùng một câu tiêu đề/mô tả được dựng ở HAI nơi —
// `TrangDongXe.jsx` (lúc khách mở trang) và `scripts/prerender-seo.mjs`
// (lúc build, để nhét sẵn vào HTML tĩnh cho Google đọc). Hai bản mà lệch
// nhau thì Google thấy một đằng, khách thấy một nẻo — đúng kiểu lỗi không ai
// phát hiện cho tới khi thứ hạng tụt.
//
// File này CHỈ chứa hàm thuần: không React, không gọi mạng, không `window`.
// Node chạy thẳng được, trình duyệt cũng vậy.

/**
 * Dưới ngưỡng này thì trang vẫn hiện (không 404) nhưng `noindex`, và
 * prerender bỏ qua không sinh file tĩnh.
 *
 * Lý do có ngưỡng: 173 dòng xe × 39 tỉnh = 6.747 tổ hợp. Thả hết cho Google
 * index khi mỗi trang chỉ có 0–1 xe là tự bắn vào chân — Google gọi đó là
 * "thin content" và hạ chất lượng cả tên miền, không riêng mấy trang đó.
 *
 * Ngưỡng do anh chốt ngày 01/10 (NGHIEN-CUU-XE-DIEN.md mục 2 đợt 2 #6).
 */
export const NGUONG_INDEX = 5

/** "VinFast VF 5" — tên đầy đủ của dòng xe. */
export function tenDongXe(hang, dong) {
  return `${hang} ${dong}`
}

/** H1 của trang, cũng là phần đầu của <title>. */
export function tieuDeTrang(hang, dong, tenTinh) {
  const ten = tenDongXe(hang, dong)
  return tenTinh ? `Thuê ${ten} tự lái tại ${tenTinh}` : `Thuê ${ten} tự lái`
}

/** <title> đầy đủ. */
export function titleTrang(hang, dong, tenTinh) {
  return `${tieuDeTrang(hang, dong, tenTinh)} — Thuexenhanh`
}

/**
 * <meta description>.
 *
 * `soTin` là số tin THẬT đang hiển thị. Không có tin thì câu mô tả không được
 * hứa hẹn gì — nói "tìm xe", không nói "đang có xe" (CLAUDE.md 1.2).
 */
export function moTaTrang(hang, dong, tenTinh, soTin) {
  const ten = tenDongXe(hang, dong)
  const taiTinh = tenTinh ? ` tại ${tenTinh}` : ''
  return soTin > 0
    ? `Đang có ${soTin} xe ${ten} cho thuê${taiTinh} trên Thuexenhanh. ` +
      'Xem số điện thoại, gọi thẳng chủ xe, tự thoả thuận giá.'
    : `Tìm xe ${ten} cho thuê${taiTinh} trên Thuexenhanh.`
}

/**
 * Câu mô tả hiện trên trang, có kèm khoảng giá khi biết.
 * Trả về chuỗi thuần để prerender nhét thẳng vào HTML; React dựng lại cùng
 * nội dung bằng JSX (có `<strong>`), nên chữ phải khớp nhau.
 *
 * `giaMin`/`giaMax` nhận chuỗi ĐÃ ĐỊNH DẠNG ("850K"), không phải số — việc
 * định dạng là của `lib/format`, chỗ này chỉ ghép câu.
 */
export function cauMoTa(hang, dong, tenTinh, soTin, giaMin, giaMax) {
  const ten = tenDongXe(hang, dong)
  const taiTinh = tenTinh ? ` tại ${tenTinh}` : ''
  if (soTin === 0) {
    return `Hiện chưa có tin ${ten}${taiTinh} đang hiển thị.`
  }
  const gia = giaMin == null
    ? ''
    : giaMin === giaMax
      ? ` — giá ${giaMin}/ngày`
      : ` — giá ${giaMin} – ${giaMax}/ngày`
  return `Đang có ${soTin} xe ${ten} cho thuê${taiTinh}${gia}.`
}
