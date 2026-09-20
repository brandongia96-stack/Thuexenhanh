import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './modules/auth/AuthProvider'
import Header from './components/Header'
import Footer from './components/Footer'
import RequireRole from './components/RequireRole'
import { PageLoading } from './components/Loading'
import TrangChu from './modules/shell/TrangChu'
import ChuaLam from './modules/shell/ChuaLam'
import GhiNhanDongY from './modules/legal/GhiNhanDongY'

// HIEU-NANG.md mục 3: chia gói theo route. Khách vào trang tìm kiếm KHÔNG
// tải code của ví token, quản trị hay form đăng xe.
// Trang chủ nằm trong gói đầu vì đó là nơi khách đáp xuống.
const DangNhap = lazy(() => import('./modules/auth/DangNhap'))
const TrangThongBao = lazy(() => import('./modules/notify/TrangThongBao'))
const DieuKhoan = lazy(() => import('./modules/legal/DieuKhoan'))
const BaoMat = lazy(() => import('./modules/legal/BaoMat'))
const HoanToken = lazy(() => import('./modules/legal/HoanToken'))
const LienHe = lazy(() => import('./modules/legal/LienHe'))
const GioiThieu = lazy(() => import('./modules/legal/GioiThieu'))
const HoiDap = lazy(() => import('./modules/legal/HoiDap'))
// Luồng 05 — trang xem xe và xe đã lưu. Tách gói riêng: khách vào trang chủ
// không phải tải slider ảnh, hộp liên hệ hay 13 icon tiện nghi.
const TrangXe = lazy(() => import('./modules/discovery/listing-page/TrangXe'))
const TrangDaLuu = lazy(() => import('./modules/discovery/saved/TrangDaLuu'))
// Luồng 06 — ví token. Chỉ chủ xe vào, nên tuyệt đối không nằm ở gói đầu:
// khách thuê không bao giờ phải tải code của sổ ví và màn QR chuyển khoản.
const TrangVi = lazy(() => import('./modules/billing/wallet/TrangVi'))

/**
 * App.jsx CHỈ làm routing + layout. Dưới 200 dòng.
 * Không viết logic nghiệp vụ ở đây — mỗi luồng thay <ChuaLam /> của mình
 * bằng component thật trong `src/modules/<module>/`, và dùng `lazy()` như trên.
 */
export default function App() {
  return (
    <AuthProvider>
      <GhiNhanDongY />
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<TrangChu />} />

              {/* ── Khách thuê ── */}
              <Route path="/thue-xe" element={<ChuaLam ten="Tìm kiếm xe" luong="04 — Tìm kiếm & bộ lọc" />} />
              <Route path="/xe/:id" element={<TrangXe />} />
              {/* Xe đã lưu thuộc luồng 05 (module discovery/saved), không phải 04. */}
              <Route path="/da-luu" element={<TrangDaLuu />} />

              {/* ── Tài khoản ── */}
              <Route path="/dang-nhap" element={<DangNhap />} />
              <Route path="/tai-khoan" element={
                <RequireRole><ChuaLam ten="Tài khoản" luong="01 — Nền tảng" /></RequireRole>
              } />
              <Route path="/thong-bao" element={
                <RequireRole><TrangThongBao /></RequireRole>
              } />

              {/* ── Chủ xe ── */}
              <Route path="/chu-xe" element={
                <RequireRole><ChuaLam ten="Bảng điều khiển chủ xe" luong="03 — Chủ xe" /></RequireRole>
              } />
              <Route path="/chu-xe/dang-tin" element={
                <RequireRole><ChuaLam ten="Đăng tin xe" luong="02 — Tin đăng xe" /></RequireRole>
              } />
              <Route path="/chu-xe/tin/:id" element={
                <RequireRole><ChuaLam ten="Sửa tin đăng" luong="02 — Tin đăng xe" /></RequireRole>
              } />
              <Route path="/chu-xe/vi" element={
                <RequireRole><TrangVi /></RequireRole>
              } />

              {/* ── Vận hành ── */}
              <Route path="/kiem-duyet" element={
                <RequireRole><ChuaLam ten="Hàng chờ kiểm duyệt" luong="08 — Tin cậy & kiểm duyệt" /></RequireRole>
              } />
              <Route path="/quan-tri" element={
                <RequireRole><ChuaLam ten="Trang quản trị" luong="10 — Quản trị" /></RequireRole>
              } />

              {/* ── Trang tĩnh ── */}
              <Route path="/dieu-khoan" element={<DieuKhoan />} />
              <Route path="/bao-mat" element={<BaoMat />} />
              <Route path="/hoan-token" element={<HoanToken />} />
              <Route path="/gioi-thieu" element={<GioiThieu />} />
              <Route path="/tro-giup" element={<HoiDap />} />
              <Route path="/lien-he" element={<LienHe />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
