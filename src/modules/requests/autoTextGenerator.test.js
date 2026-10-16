import { describe, it, expect } from 'vitest'
import { sinhNoiDungTimXe, tinhSoNgay } from './autoTextGenerator'

describe('autoTextGenerator', () => {
  it('tinhSoNgay tính đúng số ngày giữa 2 mốc', () => {
    expect(tinhSoNgay('2026-10-20', '2026-10-22')).toBe(2)
    expect(tinhSoNgay('2026-10-20', '2026-10-20')).toBe(1)
    expect(tinhSoNgay(null, null)).toBe(1)
  })

  it('sinhNoiDungTimXe sinh bài viết đầy đủ 5 tiêu chí', () => {
    const text = sinhNoiDungTimXe({
      startDate: '2026-10-20',
      endDate: '2026-10-22',
      seats: '7',
      bodyStyle: 'suv',
      transmission: 'tu_dong',
      fuel: 'xang',
      provinceName: 'TP.HCM',
      districtName: 'Quận 7',
      addressText: 'Chung cư Sunrise City',
      budgetOption: '700k_1tr',
      extraTags: ['giao_tan_noi', 'sach_se'],
      customNote: 'Có chở theo em bé nhỏ'
    })

    expect(text).toContain('[CẦN THUÊ XE TỰ LÁI TẠI TP.HCM]')
    expect(text).toContain('7 chỗ (SUV / Gầm cao) số tự động (máy xăng)')
    expect(text).toContain('20/10/2026 đến 22/10/2026 (2 ngày)')
    expect(text).toContain('Chung cư Sunrise City, Quận 7, TP.HCM')
    expect(text).toContain('Khoảng 700.000đ – 1.000.000đ/ngày')
    expect(text).toContain('Giao xe tận nơi hoặc hỗ trợ nhận xe thuận tiện')
    expect(text).toContain('Xe sạch sẽ, không mùi thuốc lá, điều hoà mát sâu')
    expect(text).toContain('Có chở theo em bé nhỏ')
  })

  it('sinhNoiDungTimXe xử lý tốt khi thiếu thông số tuỳ chọn', () => {
    const text = sinhNoiDungTimXe({
      startDate: '2026-10-25',
      endDate: '2026-10-26',
      seats: '4',
      bodyStyle: 'bat_ky',
      transmission: 'bat_ky',
      fuel: 'bat_ky',
      provinceName: '',
      districtName: '',
      addressText: '',
      budgetOption: 'thoa_thuan'
    })

    expect(text).toContain('[CẦN THUÊ XE TỰ LÁI]')
    expect(text).toContain('4 chỗ')
    expect(text).toContain('Thoả thuận hợp lý theo chất lượng xe')
  })
})
