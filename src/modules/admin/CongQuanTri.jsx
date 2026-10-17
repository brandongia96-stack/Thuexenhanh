// admin — cổng /admin/* (App.jsx). Chưa có phiên quản trị → form đăng nhập
// riêng; có → bảng điều khiển. Đăng nhập Google/email của người dùng, kể cả
// tài khoản từng có vai trò admin, KHÔNG qua được cổng này.
//
// Đây vẫn chỉ là lớp giao diện. Chặn thật ở server: has_role() + admin-ops
// đòi phiên trong admin_sessions (0030_dang_nhap_admin_rieng.sql).

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { PageLoading } from '../../components/Loading'
import DangNhapQuanTri from './DangNhapQuanTri'
import { huyPhienQuanTri, kiemPhienQuanTri } from './adminAuth'

const TrangQuanTri = lazy(() => import('./TrangQuanTri'))

// Không thao tác quá lâu thì tự thoát. Hạn tối đa 8 giờ do server giữ.
const RANH_TOI_DA_MS = 30 * 60 * 1000
const SU_KIEN_HOAT_DONG = ['pointerdown', 'keydown', 'scroll', 'touchstart']

export default function CongQuanTri() {
  const { session, loading, signOut } = useAuth()
  const [phien, setPhien] = useState({ dangKiem: true, hopLe: false, hetHanLuc: null })
  const [thongBao, setThongBao] = useState(null)
  const lanCuoi = useRef(Date.now())
  const userId = session?.user?.id ?? null
  const lanKiem = useRef(0)

  // Luôn hỏi server theo phiên supabase-js đang giữ (không theo state React,
  // vì ngay sau đăng nhập state có thể chưa kịp đổi). Kết quả cũ hơn bị bỏ.
  const kiem = useCallback(async () => {
    const lan = ++lanKiem.current
    setPhien((p) => ({ ...p, dangKiem: true }))
    let kq = { hopLe: false, hetHanLuc: null }
    try {
      kq = await kiemPhienQuanTri()
    } catch {
      // chưa đăng nhập / mất mạng → coi như chưa có phiên quản trị
    }
    if (lan === lanKiem.current) setPhien({ dangKiem: false, ...kq })
  }, [])

  useEffect(() => {
    if (!loading) kiem()
  }, [loading, userId, kiem])

  const thoat = useCallback(async (loiNhan = null) => {
    await huyPhienQuanTri()
    await signOut()
    setThongBao(loiNhan)
    setPhien({ dangKiem: false, hopLe: false, hetHanLuc: null })
  }, [signOut])

  // Tự thoát: hết 8 giờ (server báo giờ hết hạn) hoặc 30 phút không thao tác.
  useEffect(() => {
    if (!phien.hopLe) return undefined
    lanCuoi.current = Date.now()
    const danhDau = () => { lanCuoi.current = Date.now() }
    SU_KIEN_HOAT_DONG.forEach((e) => window.addEventListener(e, danhDau, { passive: true }))
    const t = setInterval(() => {
      if (phien.hetHanLuc && Date.now() >= phien.hetHanLuc.getTime()) {
        thoat('Phiên quản trị đã hết hạn (8 giờ). Vui lòng đăng nhập lại.')
      } else if (Date.now() - lanCuoi.current > RANH_TOI_DA_MS) {
        thoat('Đã tự thoát vì không thao tác 30 phút.')
      }
    }, 30 * 1000)
    return () => {
      clearInterval(t)
      SU_KIEN_HOAT_DONG.forEach((e) => window.removeEventListener(e, danhDau))
    }
  }, [phien.hopLe, phien.hetHanLuc, thoat])

  if (loading || phien.dangKiem) return <PageLoading />

  if (!phien.hopLe) {
    return (
      <DangNhapQuanTri
        dangCoPhienThuong={Boolean(session)}
        thongBao={thongBao}
        onXong={async () => {
          setThongBao(null)
          await kiem()
        }}
      />
    )
  }

  return (
    <Suspense fallback={<PageLoading />}>
      <TrangQuanTri hetHanLuc={phien.hetHanLuc} onThoat={() => thoat()} />
    </Suspense>
  )
}
