// Test cho tinhChiPhi() — NGHIEN-CUU-XE-DIEN.md mục 4.
// Chạy: npm test

import { describe, it, expect } from 'vitest'
import { tinhChiPhi, DISCLAIMER_BANG_TINH } from './tinhChiPhi'

// Hai mốc giờ cách nhau đúng N ngày (00:00 → 00:00), không có giờ lẻ.
// Dùng cộng mốc thời gian bằng số (ms) thay vì ghép chuỗi ngày — ghép chuỗi
// tay rất dễ sai khi ngày lên hai chữ số ("2026-10-9" không phải ISO hợp lệ).
const GOC = new Date('2026-10-01T00:00:00')
const ngay = (n) => ({
  gioNhan: GOC,
  gioTra: new Date(GOC.getTime() + n * 24 * 60 * 60 * 1000),
})
// 2 ngày + 5 giờ lẻ.
const HAI_NGAY_LE_5_GIO = {
  gioNhan: new Date('2026-10-01T08:00:00'),
  gioTra: new Date('2026-10-03T13:00:00'),
}

const xeXangCoBan = () => ({ price_per_day: 900_000, fuel: 'xang', fuel_consumption: 8 })

function dongCua(kq, khoa) {
  return kq.dong.find((d) => d.khoa === khoa)
}

describe('tinhChiPhi — luật chung', () => {
  it('trả null khi thiếu giờ nhận/trả hợp lệ', () => {
    expect(tinhChiPhi({ tin: xeXangCoBan(), gioNhan: null, gioTra: null })).toBeNull()
    expect(
      tinhChiPhi({ tin: xeXangCoBan(), gioNhan: '2026-10-02T00:00:00', gioTra: '2026-10-01T00:00:00' }),
    ).toBeNull()
  })

  it('luôn kèm dòng miễn trừ cố định (luật 6)', () => {
    const kq = tinhChiPhi({ tin: xeXangCoBan(), ...ngay(3) })
    expect(kq.disclaimer).toBe(DISCLAIMER_BANG_TINH)
  })

  it('cọc hiện riêng, KHÔNG cộng vào tổng (luật 1)', () => {
    const tin = { ...xeXangCoBan(), deposit_amount: 5_000_000 }
    const kq = tinhChiPhi({ tin, ...ngay(3) })
    expect(kq.coc).toEqual({ soTien: 5_000_000, ghiChu: null })
    expect(kq.tongTien).toBe(3 * 900_000) // không có 5 triệu cọc trong tổng
  })

  it('không khai cọc thì ẩn cả dòng cọc (luật 2)', () => {
    const kq = tinhChiPhi({ tin: xeXangCoBan(), ...ngay(3) })
    expect(kq.coc).toBeNull()
  })

  it('thế chấp false thì "Không cần", true thì kèm ghi chú', () => {
    const khongCan = tinhChiPhi({ tin: xeXangCoBan(), ...ngay(1) })
    expect(khongCan.theChap).toEqual({ batBuoc: false, ghiChu: null })

    const canTheChap = tinhChiPhi({
      tin: { ...xeXangCoBan(), collateral_required: true, collateral_note: 'xe máy + cà vẹt' },
      ...ngay(1),
    })
    expect(canTheChap.theChap).toEqual({ batBuoc: true, ghiChu: 'xe máy + cà vẹt' })
  })

  it('không hiện 0đ giả cho khoản chủ xe chưa khai (giao xe không có số)', () => {
    const kq = tinhChiPhi({ tin: xeXangCoBan(), ...ngay(1), canGiaoXe: true })
    // Chưa khai delivery_fee và cũng không có delivery_fee_note → ẩn hẳn dòng.
    expect(dongCua(kq, 'giao_xe')).toBeUndefined()
  })

  it('giao xe có phí thì cộng vào tổng, kèm bán kính nếu có', () => {
    const tin = { ...xeXangCoBan(), delivery_fee: 100_000, delivery_radius_km: 10 }
    const kq = tinhChiPhi({ tin, ...ngay(3), canGiaoXe: true })
    const giaoXe = dongCua(kq, 'giao_xe')
    expect(giaoXe.soTien).toBe(100_000)
    expect(giaoXe.moTa).toContain('10 km')
    expect(kq.tongTien).toBe(3 * 900_000 + 100_000)
  })
})

describe('tinhChiPhi — giờ lẻ (luật 3)', () => {
  it('tròn ngày tự nhiên thì không có ghi chú quy tắc', () => {
    const kq = tinhChiPhi({ tin: xeXangCoBan(), ...ngay(3) })
    const thue = dongCua(kq, 'thue')
    expect(thue.soTien).toBe(3 * 900_000)
    expect(thue.ghiChu).toBeNull()
  })

  it('CÓ giá giờ: giờ lẻ tính riêng theo giá giờ', () => {
    const tin = { ...xeXangCoBan(), price_per_hour: 50_000 }
    const kq = tinhChiPhi({ tin, ...HAI_NGAY_LE_5_GIO })
    const thue = dongCua(kq, 'thue')
    // 2 ngày tròn + 5 giờ lẻ theo giá giờ, KHÔNG làm tròn lên ngày thứ 3.
    expect(thue.soTien).toBe(2 * 900_000 + 5 * 50_000)
    expect(thue.ghiChu).toMatch(/giá giờ/)
  })

  it('KHÔNG có giá giờ: giờ lẻ làm tròn LÊN trọn ngày, có ghi chú quy tắc', () => {
    const kq = tinhChiPhi({ tin: xeXangCoBan(), ...HAI_NGAY_LE_5_GIO })
    const thue = dongCua(kq, 'thue')
    expect(thue.soTien).toBe(3 * 900_000) // 2 ngày + 5 giờ lẻ -> làm tròn thành 3 ngày
    expect(thue.ghiChu).toMatch(/làm tròn lên trọn ngày/)
  })
})

describe('tinhChiPhi — vượt km', () => {
  it('không vượt hạn mức thì hiện 0đ (đây là số tính được, không phải bịa)', () => {
    const tin = { ...xeXangCoBan(), limit_km_per_day: 200, extra_km_fee: 5000 }
    const kq = tinhChiPhi({ tin, ...ngay(3), kmDuKien: 500 }) // hạn mức 3*200=600, chưa vượt
    const vuot = dongCua(kq, 'vuot_km')
    expect(vuot.soTien).toBe(0)
    expect(vuot.moTa).toMatch(/không vượt/)
  })

  it('vượt hạn mức thì tính đúng phần vượt × phí', () => {
    const tin = { ...xeXangCoBan(), limit_km_per_day: 200, extra_km_fee: 5000 }
    const kq = tinhChiPhi({ tin, ...ngay(3), kmDuKien: 700 }) // hạn mức 600, vượt 100km
    const vuot = dongCua(kq, 'vuot_km')
    expect(vuot.soTien).toBe(100 * 5000)
    expect(kq.tongTien).toBe(3 * 900_000 + 100 * 5000)
  })

  it('thiếu hạn mức hoặc phí vượt thì ẩn cả dòng (luật 2)', () => {
    const kq = tinhChiPhi({ tin: xeXangCoBan(), ...ngay(3), kmDuKien: 700 })
    expect(dongCua(kq, 'vuot_km')).toBeUndefined()
  })

  it('không nhập km dự kiến thì ẩn dòng vượt km', () => {
    const tin = { ...xeXangCoBan(), limit_km_per_day: 200, extra_km_fee: 5000 }
    const kq = tinhChiPhi({ tin, ...ngay(3), kmDuKien: null })
    expect(dongCua(kq, 'vuot_km')).toBeUndefined()
  })
})

describe('tinhChiPhi — xe điện (luật 4)', () => {
  const xeDien = (them) => ({
    price_per_day: 700_000,
    fuel: 'dien',
    fuel_consumption: 5, // km / 1% pin
    ...them,
  })

  it('mien_phi: luôn 0đ, không cần biết km', () => {
    const kq = tinhChiPhi({ tin: xeDien({ charge_policy: 'mien_phi' }), ...ngay(1), kmDuKien: 300 })
    const sac = dongCua(kq, 'sac_pin')
    expect(sac.soTien).toBe(0)
    expect(sac.moTa).toMatch(/Free sạc/)
  })

  it('mien_phi_gioi_han, trong hạn mức: 0đ', () => {
    const tin = xeDien({ charge_policy: 'mien_phi_gioi_han', free_charge_km: 200 })
    const kq = tinhChiPhi({ tin, ...ngay(1), kmDuKien: 150 })
    expect(dongCua(kq, 'sac_pin').soTien).toBe(0)
  })

  it('mien_phi_gioi_han, vượt hạn mức nhưng không có charge_fee_per_pct: không bịa số', () => {
    const tin = xeDien({ charge_policy: 'mien_phi_gioi_han', free_charge_km: 200 })
    const kq = tinhChiPhi({ tin, ...ngay(1), kmDuKien: 300 })
    const sac = dongCua(kq, 'sac_pin')
    expect(sac.soTien).toBeNull()
    expect(sac.moTa).toMatch(/hỏi chủ xe/)
    // soTien null không được cộng vào tổng như một số
    expect(kq.tongTien).toBe(700_000)
  })

  it('mien_phi_gioi_han, vượt hạn mức CÓ charge_fee_per_pct: tính đúng phần vượt', () => {
    const tin = xeDien({
      charge_policy: 'mien_phi_gioi_han',
      free_charge_km: 200,
      charge_fee_per_pct: 10_000,
    })
    // km/1% = 5 -> vượt 50km (300-250... dùng số tròn hơn)
    const kq = tinhChiPhi({ tin, ...ngay(1), kmDuKien: 250 }) // vượt 50km / 5 = 10%
    const sac = dongCua(kq, 'sac_pin')
    expect(sac.soTien).toBe(10 * 10_000)
  })

  it('tinh_theo_phan_tram: % pin dùng = km ÷ (km/1%), nhân phí mỗi %', () => {
    const tin = xeDien({ charge_policy: 'tinh_theo_phan_tram', charge_fee_per_pct: 8_000 })
    const kq = tinhChiPhi({ tin, ...ngay(1), kmDuKien: 100 }) // 100/5 = 20%
    const sac = dongCua(kq, 'sac_pin')
    expect(sac.soTien).toBe(20 * 8_000)
  })

  it('tinh_theo_phan_tram thiếu dữ liệu thì không bịa số', () => {
    const tin = xeDien({ charge_policy: 'tinh_theo_phan_tram', charge_fee_per_pct: null })
    const kq = tinhChiPhi({ tin, ...ngay(1), kmDuKien: 100 })
    expect(dongCua(kq, 'sac_pin').soTien).toBeNull()
  })

  it('khach_tu_sac: không ước tính được, không cộng vào tổng', () => {
    const tin = xeDien({ charge_policy: 'khach_tu_sac' })
    const kq = tinhChiPhi({ tin, ...ngay(1), kmDuKien: 300 })
    const sac = dongCua(kq, 'sac_pin')
    expect(sac.soTien).toBeNull()
    expect(kq.tongTien).toBe(700_000)
  })

  it('chưa khai charge_policy thì ẩn cả dòng sạc pin', () => {
    const kq = tinhChiPhi({ tin: xeDien({ charge_policy: null }), ...ngay(1), kmDuKien: 300 })
    expect(dongCua(kq, 'sac_pin')).toBeUndefined()
  })

  it('xe điện nhưng không nhập km dự kiến thì ẩn dòng sạc pin', () => {
    const kq = tinhChiPhi({ tin: xeDien({ charge_policy: 'mien_phi' }), ...ngay(1), kmDuKien: null })
    expect(dongCua(kq, 'sac_pin')).toBeUndefined()
  })
})

describe('tinhChiPhi — xe xăng/dầu (luật 5)', () => {
  const giaXang = { price: 20_000, unit: 'lít', source: 'Petrolimex', effectiveDate: '2026-09-01' }

  it('ước tính đúng công thức: (km/100) × tiêu hao × giá, ghi nguồn + ngày', () => {
    const kq = tinhChiPhi({
      tin: xeXangCoBan(), // fuel_consumption = 8 lít/100km
      ...ngay(1),
      kmDuKien: 200,
      giaThamChieu: giaXang,
    })
    const nl = dongCua(kq, 'nhien_lieu')
    // 200/100 * 8 = 16 lít * 20.000đ = 320.000đ
    expect(nl.soTien).toBe(320_000)
    expect(nl.ghiChu).toContain('Petrolimex')
    expect(nl.ghiChu).toContain('2026-09-01')
  })

  it('không có giá tham chiếu thì ẩn dòng (luật 2)', () => {
    const kq = tinhChiPhi({ tin: xeXangCoBan(), ...ngay(1), kmDuKien: 200, giaThamChieu: null })
    expect(dongCua(kq, 'nhien_lieu')).toBeUndefined()
  })

  it('xe điện và hybrid không chạy qua nhánh nhiên liệu xăng/dầu', () => {
    const kqDien = tinhChiPhi({
      tin: { price_per_day: 700_000, fuel: 'dien', fuel_consumption: 5 },
      ...ngay(1),
      kmDuKien: 200,
      giaThamChieu: giaXang,
    })
    expect(dongCua(kqDien, 'nhien_lieu')).toBeUndefined()

    const kqHybrid = tinhChiPhi({
      tin: { price_per_day: 700_000, fuel: 'hybrid', fuel_consumption: 5 },
      ...ngay(1),
      kmDuKien: 200,
      giaThamChieu: giaXang,
    })
    expect(dongCua(kqHybrid, 'nhien_lieu')).toBeUndefined()
  })
})
