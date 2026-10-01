// discovery/listing-page/tinhChiPhi — bảng tính tổng tiền dự kiến.
//
// NGHIEN-CUU-XE-DIEN.md mục 4, "Luật cứng" 1-7 — từng luật đánh số ngay cạnh
// chỗ áp dụng để sau này đọc lại brief vẫn khớp được với code:
//
//   1. Cọc hiện RIÊNG, không cộng vào tổng — cọc là tiền trả lại.
//   2. Chủ xe không khai thì ẨN DÒNG đó, không đoán, không hiện 0đ giả.
//   3. Giờ lẻ: có `price_per_hour` thì tính theo giờ; không có thì làm tròn
//      lên ngày — ghi rõ quy tắc ngay dưới dòng.
//   4. Xe điện: % pin dùng = km ÷ (km/1%). Free sạc → 0. Giới hạn → chỉ tính
//      phần vượt `free_charge_km`. Tính theo % → nhân `charge_fee_per_pct`.
//   5. Xe xăng/dầu: ước tính bằng `fuel_consumption` × giá tham chiếu, ghi
//      ngày của giá.
//   6. Dòng miễn trừ BẮT BUỘC (CLAUDE.md 1.1 + 1.2).
//   7. Hàm tính THUẦN, chạy ở trình duyệt, không gọi server.
//
// Vì sao hàm thuần không tự đọc `reference_price_now`: gọi Supabase ở đây là
// phá luật 7 và không test được bằng dữ liệu giả. Nơi gọi (component) đọc giá
// tham chiếu một lần rồi TRUYỀN VÀO như dữ liệu thường.

// Dòng miễn trừ CỐ ĐỊNH — luật 6. Khai báo ở đây để không nơi nào quên ghép vào.
export const DISCLAIMER_BANG_TINH =
  'Ước tính theo thông tin chủ xe khai. Giá cuối cùng do anh/chị và chủ xe tự thoả thuận.'

const MOT_GIO_MS = 60 * 60 * 1000
const MOT_NGAY_MS = 24 * MOT_GIO_MS
// Lệch dưới 1 phút coi là 0 — tránh phép chia dấu phẩy động biến "đúng 3 ngày"
// thành "3 ngày + 0.000002 giờ lẻ".
const SAI_SO_GIO = 1 / 60

const soDuong = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null)
const soKhongAm = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null)

function toMs(gio) {
  if (gio == null) return null
  const t = gio instanceof Date ? gio.getTime() : new Date(gio).getTime()
  return Number.isFinite(t) ? t : null
}

/**
 * Tiền thuê theo thời gian — luật 3.
 * @returns {{ soTien: number, moTa: string, ghiChu: string|null, soNgayTinh: number }}
 */
function tinhTienThue(tin, soGio) {
  const soNgayTron = Math.floor(soGio / 24)
  const gioLe = soGio - soNgayTron * 24

  if (gioLe <= SAI_SO_GIO) {
    // Tròn ngày tự nhiên — không có gì phải ghi chú quy tắc.
    const soNgay = Math.max(soNgayTron, 1)
    return {
      soTien: soNgay * tin.price_per_day,
      moTa: `${soNgay} ngày × ${tin.price_per_day.toLocaleString('vi-VN')}đ`,
      ghiChu: null,
      soNgayTinh: soNgay,
    }
  }

  if (soDuong(tin.price_per_hour)) {
    // Có giá giờ: phần giờ lẻ tính riêng, làm tròn LÊN giờ (có lợi cho chủ xe,
    // nhất quán với cách làm tròn ngày ở nhánh dưới).
    const soGioLe = Math.ceil(gioLe - SAI_SO_GIO)
    const tienNgay = soNgayTron * tin.price_per_day
    const tienGio = soGioLe * tin.price_per_hour
    return {
      soTien: tienNgay + tienGio,
      moTa:
        soNgayTron > 0
          ? `${soNgayTron} ngày × ${tin.price_per_day.toLocaleString('vi-VN')}đ + ${soGioLe} giờ × ${tin.price_per_hour.toLocaleString('vi-VN')}đ`
          : `${soGioLe} giờ × ${tin.price_per_hour.toLocaleString('vi-VN')}đ`,
      ghiChu: 'Phần giờ lẻ tính theo giá giờ chủ xe đã khai.',
      soNgayTinh: soNgayTron + (soGioLe > 0 ? 1 : 0), // dùng để tính km bao gồm/ngày
    }
  }

  // Không có giá giờ: làm tròn lên trọn ngày — PHẢI ghi rõ quy tắc, không để
  // khách tự hỏi vì sao 2 ngày 1 tiếng lại tính thành 3 ngày.
  const soNgay = soNgayTron + 1
  return {
    soTien: soNgay * tin.price_per_day,
    moTa: `${soNgay} ngày × ${tin.price_per_day.toLocaleString('vi-VN')}đ`,
    ghiChu: 'Chủ xe chưa có giá theo giờ nên phần giờ lẻ được làm tròn lên trọn ngày.',
    soNgayTinh: soNgay,
  }
}

/** Vượt km — chỉ tính khi chủ xe có khai cả hạn mức lẫn phí vượt. */
function tinhVuotKm(tin, kmDuKien, soNgayTinh) {
  const han = soKhongAm(tin.limit_km_per_day)
  const phi = soDuong(tin.extra_km_fee)
  if (han == null || phi == null || kmDuKien == null) return null // luật 2: chưa khai đủ thì ẩn

  const kmBaoGom = han * soNgayTinh
  const kmVuot = Math.max(0, kmDuKien - kmBaoGom)
  return {
    soTien: kmVuot * phi,
    moTa:
      kmVuot > 0
        ? `Vượt ${kmVuot} km (${kmDuKien} − ${soNgayTinh}×${han}) × ${phi.toLocaleString('vi-VN')}đ`
        : `${kmDuKien} km trong hạn mức ${kmBaoGom} km → không vượt`,
    ghiChu: null,
  }
}

/**
 * Chi phí sạc pin xe điện — luật 4.
 * `fuel_consumption` với xe điện nghĩa là "km đi được mỗi 1% pin"
 * (xem listing/fieldGroups.js, nhãn đổi theo `fuel`).
 */
function tinhSacPin(tin, kmDuKien) {
  if (kmDuKien == null) return null
  const { charge_policy } = tin

  if (charge_policy === 'mien_phi') {
    return { soTien: 0, moTa: 'Free sạc (chủ xe cam kết)', ghiChu: null }
  }

  if (charge_policy === 'mien_phi_gioi_han') {
    const gioiHan = soKhongAm(tin.free_charge_km)
    if (gioiHan == null) return null // chính sách này mà thiếu số km thì không nói được gì
    if (kmDuKien <= gioiHan) {
      return { soTien: 0, moTa: `Trong ${gioiHan} km miễn phí sạc`, ghiChu: null }
    }
    // Vượt giới hạn: chỉ tính được tiếp nếu chủ xe (hiếm khi) cũng khai phí
    // theo %. Không có thì KHÔNG bịa số — rule 2.
    const kmVuot = kmDuKien - gioiHan
    const kmMoiPhanTram = soDuong(tin.fuel_consumption)
    const phiPhanTram = soDuong(tin.charge_fee_per_pct)
    if (kmMoiPhanTram == null || phiPhanTram == null) {
      return {
        soTien: null,
        moTa: `Vượt ${kmVuot} km miễn phí — hỏi chủ xe phí sạc phần vượt`,
        ghiChu: null,
      }
    }
    const phanTramVuot = kmVuot / kmMoiPhanTram
    return {
      soTien: Math.round(phanTramVuot * phiPhanTram),
      moTa: `Vượt ${gioiHan} km miễn phí, ${phanTramVuot.toFixed(1)}% pin × ${phiPhanTram.toLocaleString('vi-VN')}đ`,
      ghiChu: null,
    }
  }

  if (charge_policy === 'tinh_theo_phan_tram') {
    const kmMoiPhanTram = soDuong(tin.fuel_consumption)
    const phiPhanTram = soDuong(tin.charge_fee_per_pct)
    if (kmMoiPhanTram == null || phiPhanTram == null) {
      return { soTien: null, moTa: 'Chưa đủ dữ liệu để ước tính phí sạc, hỏi chủ xe', ghiChu: null }
    }
    const phanTram = kmDuKien / kmMoiPhanTram
    return {
      soTien: Math.round(phanTram * phiPhanTram),
      moTa: `${phanTram.toFixed(1)}% pin × ${phiPhanTram.toLocaleString('vi-VN')}đ`,
      ghiChu: null,
    }
  }

  if (charge_policy === 'khach_tu_sac') {
    // Khách tự trả tiền sạc dọc đường — không phải chi phí app ước tính được.
    return { soTien: null, moTa: 'Khách tự trả tiền sạc dọc đường', ghiChu: null }
  }

  return null // chưa khai charge_policy — ẩn cả dòng
}

/**
 * Ước tính nhiên liệu xe xăng/dầu — luật 5.
 * `giaThamChieu` do nơi gọi đọc từ view `reference_price_now` rồi truyền vào
 * (hàm này KHÔNG gọi mạng — luật 7). Thiếu giá tham chiếu thì ẩn dòng.
 */
function tinhNhienLieu(tin, kmDuKien, giaThamChieu) {
  if (kmDuKien == null) return null
  if (tin.fuel !== 'xang' && tin.fuel !== 'dau') return null // hybrid/điện không qua nhánh này

  const tieuHao = soDuong(tin.fuel_consumption) // lít / 100km
  if (tieuHao == null || !giaThamChieu?.price) return null

  const soLit = (kmDuKien / 100) * tieuHao
  return {
    soTien: Math.round(soLit * giaThamChieu.price),
    moTa: `${soLit.toFixed(1)} lít × ${giaThamChieu.price.toLocaleString('vi-VN')}đ/${giaThamChieu.unit ?? 'lít'}`,
    // Luật 5: BẮT BUỘC ghi ngày + nguồn của giá — khách không kiểm được số
    // thì không tin được bảng tính (contracts/api.md mục 2).
    ghiChu: `Giá ${giaThamChieu.source ?? ''} ngày ${giaThamChieu.effectiveDate ?? giaThamChieu.effective_date ?? ''}`.trim(),
  }
}

function tinhGiaoXe(tin, canGiaoXe) {
  if (!canGiaoXe) return null
  const phi = soKhongAm(tin.delivery_fee)
  if (phi == null) {
    // Có thể chủ xe chỉ ghi được bằng lời (delivery_fee_note) — không có số
    // thì không hiện dòng tiền, nhưng vẫn đáng nói nếu có ghi chú.
    if (tin.delivery_fee_note) {
      return { soTien: null, moTa: tin.delivery_fee_note, ghiChu: null }
    }
    return null
  }
  return {
    soTien: phi,
    moTa:
      tin.delivery_radius_km != null
        ? `Trong bán kính ${tin.delivery_radius_km} km`
        : 'Phí giao xe',
    ghiChu: null,
  }
}

/**
 * Hàm tính chính — thuần, không có side-effect, không gọi mạng (luật 7).
 *
 * @param {object} p
 * @param {object} p.tin           các cột cần của `listings` (xem contracts/api.md)
 * @param {Date|string|number} p.gioNhan
 * @param {Date|string|number} p.gioTra
 * @param {number|null} [p.kmDuKien]        quãng đường dự kiến, null = khách chưa nhập
 * @param {boolean} [p.canGiaoXe]
 * @param {{price:number, unit?:string, source?:string, effectiveDate?:string}|null} [p.giaThamChieu]
 *
 * @returns {null | {
 *   dong: Array<{ khoa:string, nhan:string, soTien:number|null, moTa:string, ghiChu:string|null }>,
 *   tongTien: number,
 *   coc: {soTien:number|null, ghiChu:string|null} | null,
 *   theChap: {batBuoc:boolean, ghiChu:string|null},
 *   disclaimer: string,
 * }}
 *   `null` khi không đủ dữ liệu TỐI THIỂU để tính (thiếu giờ nhận/trả hợp lệ).
 */
export function tinhChiPhi({
  tin,
  gioNhan,
  gioTra,
  kmDuKien = null,
  canGiaoXe = false,
  giaThamChieu = null,
}) {
  if (!tin || !soDuong(tin.price_per_day)) return null

  const nhanMs = toMs(gioNhan)
  const traMs = toMs(gioTra)
  if (nhanMs == null || traMs == null || traMs <= nhanMs) return null

  const soGio = (traMs - nhanMs) / MOT_GIO_MS
  const km = soKhongAm(kmDuKien)

  const thue = tinhTienThue(tin, soGio)
  const vuotKm = tinhVuotKm(tin, km, thue.soNgayTinh)
  const sac = tin.fuel === 'dien' ? tinhSacPin(tin, km) : null
  const nhienLieu = tinhNhienLieu(tin, km, giaThamChieu)
  const giaoXe = tinhGiaoXe(tin, canGiaoXe)

  const dong = [
    { khoa: 'thue', nhan: 'Tiền thuê', ...thue },
    vuotKm && { khoa: 'vuot_km', nhan: 'Vượt km', ...vuotKm },
    sac && { khoa: 'sac_pin', nhan: 'Sạc pin', ...sac },
    nhienLieu && { khoa: 'nhien_lieu', nhan: 'Xăng dầu (ước tính)', ...nhienLieu },
    giaoXe && { khoa: 'giao_xe', nhan: 'Giao xe', ...giaoXe },
  ].filter(Boolean)

  // Luật 1: cọc KHÔNG cộng vào tổng — tách riêng hẳn khỏi `dong`.
  const soCoc = soKhongAm(tin.deposit_amount)
  const coc =
    soCoc != null || tin.deposit_note
      ? { soTien: soCoc, ghiChu: tin.deposit_note ?? null }
      : null // luật 2: không khai gì thì ẩn cả dòng cọc

  const theChap = {
    batBuoc: Boolean(tin.collateral_required),
    ghiChu: tin.collateral_required ? (tin.collateral_note ?? null) : null,
  }

  const tongTien = dong.reduce((s, d) => s + (d.soTien ?? 0), 0)

  return {
    dong,
    tongTien,
    coc,
    theChap,
    // Luật 6: dòng miễn trừ đi kèm MỌI kết quả, không phải thứ UI có thể quên ghép.
    disclaimer: DISCLAIMER_BANG_TINH,
  }
}
