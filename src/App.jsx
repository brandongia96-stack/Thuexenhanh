import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './modules/auth/AuthProvider'
import Header from './components/Header'
import Footer from './components/Footer'
import RequireRole from './components/RequireRole'
import { PageLoading } from './components/Loading'
import TrangChu from './modules/shell/TrangChu'
import ChuaLam from './modules/shell/ChuaLam'

// HIEU-NANG.md mục 3: chia gói theo route. Khách vào trang tìm kiếm KHÔNG
// tải code của ví token, quản trị hay form đăng xe.
// Trang chủ nằm trong gói đầu vì đó là nơi khách đáp xuống.
const DangNhap = lazy(() => import('./modules/auth/DangNhap'))

/**
 * App.jsx CHỈ làm routing + layout. Dưới 200 dòng.
 * Không viết logic nghiệp vụ ở đây — mỗi luồng thay <ChuaLam /> của mình
 * bằng component thật trong `src/modules/<module>/`, và dùng `lazy()` như trên.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<TrangChu />} />

              {/* ── Khách thuê ── */}
              <Route path="/thue-xe" element={<ChuaLam ten="Tìm kiếm xe" luong="04 — Tìm kiếm & bộ lọc" />} />
              <Route path="/xe/:id" element={<ChuaLam ten="Trang chi tiết xe" luong="05 — Trang xe & liên hệ" />} />
              <Route path="/da-luu" element={<ChuaLam ten="Xe đã lưu" luong="04 — Tìm kiếm & bộ lọc" />} />

              {/* ── Tài khoản ── */}
              <Route path="/dang-nhap" element={<DangNhap />} />
              <Route path="/tai-khoan" element={
                <RequireRole><ChuaLam ten="Tài khoản" luong="01 — Nền tảng" /></RequireRole>
              } />
              <Route path="/thong-bao" element={
                <RequireRole><ChuaLam ten="Thông báo" luong="11 — Thông báo" /></RequireRole>
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
                <RequireRole><ChuaLam ten="Ví token" luong="06 — Ví token & thanh toán" /></RequireRole>
              } />

              {/* ── Vận hành ── */}
              <Route path="/kiem-duyet" element={
                <RequireRole><ChuaLam ten="Hàng chờ kiểm duyệt" luong="08 — Tin cậy & kiểm duyệt" /></RequireRole>
              } />
              <Route path="/quan-tri" element={
                <RequireRole><ChuaLam ten="Trang quản trị" luong="10 — Quản trị" /></RequireRole>
              } />

              {/* ── Trang tĩnh ── */}
              <Route path="/dieu-khoan" element={<ChuaLam ten="Điều khoản sử dụng" luong="12 — Pháp lý" />} />
              <Route path="/bao-mat" element={<ChuaLam ten="Chính sách bảo mật" luong="12 — Pháp lý" />} />
              <Route path="/hoan-token" element={<ChuaLam ten="Chính sách hoàn token" luong="12 — Pháp lý" />} />
              <Route path="/lien-he" element={<ChuaLam ten="Liên hệ" luong="12 — Pháp lý" />} />

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
