import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isTokenDemo,
  batTokenDemo,
  tatTokenDemo,
  chuyenDoiTokenDemo,
  demoReset,
  demoSoDuVi,
  demoSoGiaoDich,
  demoTaoYeuCauNap,
  demoXacNhanNapTien,
  demoTraPhiHienThi,
  demoDieuChinhVi,
  demoNapGanDay,
  demoTrangThaiNap,
  KEY_TOKEN_DEMO,
  getStorage,
} from './tokenDemoStore'
import { soDuVi, soGiaoDich, taoYeuCauNap, traPhiHienThi } from '../billingApi'

const getGlobal = () => (typeof window !== 'undefined' ? window : globalThis)

describe('Cơ chế token-demo và các thao tác liên quan đến token', () => {
  beforeEach(() => {
    getStorage().clear()
    delete getGlobal().__TOKEN_DEMO__
    demoReset()
  })

  afterEach(() => {
    getStorage().clear()
    delete getGlobal().__TOKEN_DEMO__
  })

  describe('1. Quản lý cờ token-demo', () => {
    it('Mặc định token-demo là false khi không có cờ', () => {
      expect(isTokenDemo()).toBe(false)
    })

    it('Bật và tắt token-demo qua hàm tiện ích', () => {
      batTokenDemo()
      expect(isTokenDemo()).toBe(true)
      expect(getStorage().getItem(KEY_TOKEN_DEMO)).toBe('1')

      tatTokenDemo()
      expect(isTokenDemo()).toBe(false)
      expect(getStorage().getItem(KEY_TOKEN_DEMO)).toBe('0')
    })

    it('Chuyển đổi trạng thái bằng chuyenDoiTokenDemo', () => {
      expect(chuyenDoiTokenDemo()).toBe(true)
      expect(isTokenDemo()).toBe(true)
      expect(chuyenDoiTokenDemo()).toBe(false)
      expect(isTokenDemo()).toBe(false)
    })

    it('Nhận diện cờ qua window/globalThis.__TOKEN_DEMO__', () => {
      getGlobal().__TOKEN_DEMO__ = true
      expect(isTokenDemo()).toBe(true)
      getGlobal().__TOKEN_DEMO__ = false
      expect(isTokenDemo()).toBe(false)
    })
  })


  describe('2. Khởi tạo và truy vấn số dư ví demo (soDuVi)', () => {
    it('Trả về số dư ví ban đầu chính xác (80 nạp - 30 tiêu = 50 dư)', async () => {
      batTokenDemo()
      const vi = await demoSoDuVi('user-test')
      expect(vi).toBeTruthy()
      expect(vi.token_da_nap).toBe(80)
      expect(vi.token_da_tieu).toBe(30)
      expect(vi.so_du).toBe(50)
    })
  })

  describe('3. Sổ giao dịch và phân trang keyset (soGiaoDich)', () => {
    it('Sổ giao dịch có các bản ghi ban đầu khớp đối soát', async () => {
      batTokenDemo()
      const kq = await demoSoGiaoDich('user-test', { limit: 10 })
      expect(kq.items.length).toBeGreaterThan(0)
      expect(kq.conNua).toBe(false)

      // Kiểm tra dòng mới nhất có số dư sau bằng số dư ví
      const dongMoiNhat = kq.items[0]
      expect(dongMoiNhat.so_du_sau).toBe(50)
    })

    it('Phân trang keyset hoạt động đúng với cursor', async () => {
      batTokenDemo()
      const trang1 = await demoSoGiaoDich('user-test', { limit: 2 })
      expect(trang1.items.length).toBe(2)
      expect(trang1.conNua).toBe(true)
      expect(trang1.cursor).toBeTruthy()

      const trang2 = await demoSoGiaoDich('user-test', { cursor: trang1.cursor, limit: 2 })
      expect(trang2.items.length).toBe(2)
      expect(trang2.items[0].id).not.toBe(trang1.items[0].id)
    })
  })

  describe('4. Nạp token (taoYeuCauNap + demoXacNhanNapTien)', () => {
    it('Tạo yêu cầu nạp thành công với mã chuyển khoản động', async () => {
      batTokenDemo()
      const yeuCau = await demoTaoYeuCauNap(30)
      expect(yeuCau.topup_id).toContain('demo-topup-')
      expect(yeuCau.token_amount).toBe(30)
      expect(yeuCau.vnd_amount).toBe(120000) // 30 * 4000
      expect(yeuCau.transfer_code).toMatch(/^TXN[A-Z0-9]{7}$/)

      // Kiểm tra trạng thái nạp đang chờ
      const tt = await demoTrangThaiNap(yeuCau.topup_id)
      expect(tt.status).toBe('cho_thanh_toan')
    })

    it('Tạo yêu cầu nạp qua MoMo và ZaloPay mang đúng thông tin ví nhận', async () => {
      batTokenDemo()
      const reqMomo = await demoTaoYeuCauNap(10, 'momo')
      expect(reqMomo.phuong_thuc).toBe('momo')
      expect(reqMomo.ngan_hang.bank).toContain('MoMo')
      expect(reqMomo.vnd_amount).toBe(40000)

      const reqZalo = await demoTaoYeuCauNap(20, 'zalopay')
      expect(reqZalo.phuong_thuc).toBe('zalopay')
      expect(reqZalo.ngan_hang.bank).toContain('ZaloPay')
      expect(reqZalo.vnd_amount).toBe(80000)
    })

    it('Xác nhận tiền về: cộng số dư ví và ghi sổ giao dịch', async () => {
      batTokenDemo()
      const yeuCau = await demoTaoYeuCauNap(40)
      const xn = await demoXacNhanNapTien(yeuCau.topup_id)
      expect(xn.ok).toBe(true)
      expect(xn.token_cong).toBe(40)
      expect(xn.soDu).toBe(90) // 50 + 40

      const vi = await demoSoDuVi('user-test')
      expect(vi.so_du).toBe(90)
      expect(vi.token_da_nap).toBe(120) // 80 + 40

      const so = await demoSoGiaoDich('user-test', { limit: 1 })
      expect(so.items[0].kind).toBe('nap')
      expect(so.items[0].amount).toBe(40)
      expect(so.items[0].so_du_sau).toBe(90)
    })

    it('Danh sách nạp gần đây (napGanDay) cập nhật chính xác', async () => {
      batTokenDemo()
      await demoTaoYeuCauNap(20)
      const ds = await demoNapGanDay('user-test', { limit: 5 })
      expect(ds[0].token_amount).toBe(20)
    })
  })

  describe('5. Trả phí hiển thị và gia hạn tin (traPhiHienThi)', () => {
    it('Trừ token đúng chuẩn 10 token/tháng và cập nhật hạn hiển thị', async () => {
      batTokenDemo()
      const kq = await demoTraPhiHienThi({
        listingId: 'car-innova-01',
        months: 2,
        listing: { brand_text: 'Toyota', model_text: 'Innova' },
      })

      expect(kq.ok).toBe(true)
      expect(kq.token_charged).toBe(20) // 2 tháng * 10
      expect(kq.so_du).toBe(30) // 50 - 20
      expect(new Date(kq.expires_at).getTime()).toBeGreaterThan(Date.now())

      const vi = await demoSoDuVi('user-test')
      expect(vi.so_du).toBe(30)
      expect(vi.token_da_tieu).toBe(50) // 30 + 20

      const so = await demoSoGiaoDich('user-test', { limit: 1 })
      expect(so.items[0].kind).toBe('tieu')
      expect(so.items[0].amount).toBe(-20)
      expect(so.items[0].so_du_sau).toBe(30)
      expect(so.items[0].note).toContain('Toyota Innova')
    })

    it('Chặn trả phí khi số dư không đủ (ném lỗi khong_du_token)', async () => {
      batTokenDemo()
      // Ví có 50 token, thử trả 6 tháng = 60 token
      await expect(
        demoTraPhiHienThi({
          listingId: 'car-test',
          months: 6,
        }),
      ).rejects.toMatchObject({ code: 'khong_du_token' })

      // Số dư không bị thay đổi
      const vi = await demoSoDuVi('user-test')
      expect(vi.so_du).toBe(50)
    })
  })

  describe('6. Điều chỉnh ví tay: Tặng / Hoàn / Thu hồi (demoDieuChinhVi)', () => {
    it('Hoàn token cộng số dư và ghi sổ loại hoan', async () => {
      batTokenDemo()
      const kq = await demoDieuChinhVi({
        kind: 'hoan',
        tokens: 10,
        reason: 'Hoàn token do lỗi hệ thống',
      })
      expect(kq.ok).toBe(true)
      expect(kq.soDu).toBe(60)

      const so = await demoSoGiaoDich('user-test', { limit: 1 })
      expect(so.items[0].kind).toBe('hoan')
      expect(so.items[0].amount).toBe(10)
      expect(so.items[0].so_du_sau).toBe(60)
    })

    it('Thu hồi token trừ số dư và ghi sổ loại thu_hoi', async () => {
      batTokenDemo()
      const kq = await demoDieuChinhVi({
        kind: 'thu_hoi',
        tokens: 15,
        reason: 'Thu hồi token thử nghiệm',
      })
      expect(kq.ok).toBe(true)
      expect(kq.soDu).toBe(35)
    })
  })

  describe('7. Tích hợp trong suốt qua billingApi khi bật token-demo', () => {
    it('soDuVi tự động đọc từ store demo khi cờ token-demo bật', async () => {
      batTokenDemo()
      const vi = await soDuVi('any-user-id')
      expect(vi.so_du).toBe(50)
    })

    it('taoYeuCauNap và traPhiHienThi qua billingApi hoạt động liên hoàn trên kho demo', async () => {
      batTokenDemo()

      // Nạp 20 token
      const req = await taoYeuCauNap(20)
      await demoXacNhanNapTien(req.topup_id)

      let vi = await soDuVi('u1')
      expect(vi.so_du).toBe(70)

      // Trả phí 3 tháng = 30 token
      const kq = await traPhiHienThi({ listingId: 'tin-123', months: 3 })
      expect(kq.token_charged).toBe(30)
      expect(kq.so_du).toBe(40)

      vi = await soDuVi('u1')
      expect(vi.so_du).toBe(40)
    })
  })
})
