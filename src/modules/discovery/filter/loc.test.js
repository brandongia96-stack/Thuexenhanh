import { describe, expect, it } from 'vitest'
import { urlSangLoc, locSangUrl, locRong, danhSachChip } from './loc'

describe('Bộ lọc Ngày thuê (tu / den)', () => {
  it('khởi tạo mặc định có tu và den rỗng', () => {
    const l = locRong()
    expect(l.tu).toBe('')
    expect(l.den).toBe('')
  })

  it('đọc tu và den hợp lệ từ URL', () => {
    // Tạo ngày tương lai hợp lệ
    const homNay = new Date()
    homNay.setHours(0, 0, 0, 0)
    const dTu = new Date(homNay)
    dTu.setDate(dTu.getDate() + 5)
    const dDen = new Date(dTu)
    dDen.setDate(dDen.getDate() + 3)

    const p = (n) => String(n).padStart(2, '0')
    const tuStr = `${dTu.getFullYear()}-${p(dTu.getMonth() + 1)}-${p(dTu.getDate())}`
    const denStr = `${dDen.getFullYear()}-${p(dDen.getMonth() + 1)}-${p(dDen.getDate())}`

    const sp = new URLSearchParams(`?tu=${tuStr}&den=${denStr}`)
    const loc = urlSangLoc(sp)
    expect(loc.tu).toBe(tuStr)
    expect(loc.den).toBe(denStr)
  })

  it('bỏ qua ngày trong quá khứ', () => {
    const sp = new URLSearchParams('?tu=2020-01-01&den=2020-01-05')
    const loc = urlSangLoc(sp)
    expect(loc.tu).toBe('')
    expect(loc.den).toBe('')
  })

  it('bỏ qua ngày ngược (den < tu)', () => {
    const homNay = new Date()
    const dTu = new Date(homNay)
    dTu.setDate(dTu.getDate() + 10)
    const dDen = new Date(homNay)
    dDen.setDate(dDen.getDate() + 5)

    const p = (n) => String(n).padStart(2, '0')
    const tuStr = `${dTu.getFullYear()}-${p(dTu.getMonth() + 1)}-${p(dTu.getDate())}`
    const denStr = `${dDen.getFullYear()}-${p(dDen.getMonth() + 1)}-${p(dDen.getDate())}`

    const sp = new URLSearchParams(`?tu=${tuStr}&den=${denStr}`)
    const loc = urlSangLoc(sp)
    expect(loc.tu).toBe('')
    expect(loc.den).toBe('')
  })

  it('bỏ qua khoảng ngày quá 180 ngày', () => {
    const homNay = new Date()
    const dTu = new Date(homNay)
    dTu.setDate(dTu.getDate() + 5)
    const dDen = new Date(homNay)
    dDen.setDate(dDen.getDate() + 200)

    const p = (n) => String(n).padStart(2, '0')
    const tuStr = `${dTu.getFullYear()}-${p(dTu.getMonth() + 1)}-${p(dTu.getDate())}`
    const denStr = `${dDen.getFullYear()}-${p(dDen.getMonth() + 1)}-${p(dDen.getDate())}`

    const sp = new URLSearchParams(`?tu=${tuStr}&den=${denStr}`)
    const loc = urlSangLoc(sp)
    expect(loc.tu).toBe('')
    expect(loc.den).toBe('')
  })

  it('ghi tu và den vào URLSearchParams', () => {
    const loc = { ...locRong(), tu: '2026-11-01', den: '2026-11-05' }
    const sp = locSangUrl(loc)
    expect(sp.get('tu')).toBe('2026-11-01')
    expect(sp.get('den')).toBe('2026-11-05')
  })

  it('hiển thị chip ngày dạng DD/MM – DD/MM và xóa được', () => {
    const loc = { ...locRong(), tu: '2026-10-21', den: '2026-10-23' }
    const chips = danhSachChip(loc)
    const chipNgay = chips.find((c) => c.key === 'ngay')
    expect(chipNgay).toBeDefined()
    expect(chipNgay.label).toBe('21/10 – 23/10')

    const locSauXoa = chipNgay.xoa(loc)
    expect(locSauXoa.tu).toBe('')
    expect(locSauXoa.den).toBe('')
  })
})
