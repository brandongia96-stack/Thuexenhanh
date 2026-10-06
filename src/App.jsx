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
const TrangTaiKhoan = lazy(() => import('./modules/auth/TrangTaiKhoan'))
const TrangQuanTri = lazy(() => import('./modules/admin/TrangQuanTri'))
const TrangThongBao = lazy(() => import('./modules/notify/TrangThongBao'))
const DieuKhoan = lazy(() => import('./modules/legal/DieuKhoan'))
const BaoMat = lazy(() => import('./modules/legal/BaoMat'))
const HoanToken = lazy(() => import('./modules/legal/HoanToken'))
const LienHe = lazy(() => import('./modules/legal/LienHe'))
const GioiThieu = lazy(() => import('./modules/legal/GioiThieu'))
const HoiDap = lazy(() => import('./modules/legal/HoiDap'))
const QuyChe = lazy(() => import('./modules/legal/QuyChe'))
const KhieuNai = lazy(() => import('./modules/legal/KhieuNai'))
const ThongTinThue = lazy(() => import('./modules/legal/ThongTinThue'))
// Luồng 05 — trang xem xe và xe đã lưu. Tách gói riêng: khách vào trang chủ
// không phải tải slider ảnh, hộp liên hệ hay 13 icon tiện nghi.
const TrangXe = lazy(() => import('./modules/discovery/listing-page/TrangXe'))
const TrangTimKiem = lazy(() => import('./modules/discovery/search/TrangTimKiem'))
// Luồng 14 — trang SEO theo dòng xe × tỉnh (NGHIEN-CUU-XE-DIEN.md mục 2 đợt 2 #6).
const TrangDongXe = lazy(() => import('./modules/shell/seo-xe/TrangDongXe'))
// Cứu hộ 24/7 — tự ẩn khi danh bạ rỗng (xem TrangCuuHo.jsx).
const TrangCuuHo = lazy(() => import('./modules/shell/cuu-ho/TrangCuuHo'))
const TrangDaLuu = lazy(() => import('./modules/discovery/saved/TrangDaLuu'))
// Luồng 06 — ví token. Chỉ chủ xe vào, nên tuyệt đối không nằm ở gói đầu:
// khách thuê không bao giờ phải tải code của sổ ví và màn QR chuyển khoản.
const TrangVi = lazy(() => import('./modules/billing/wallet/TrangVi'))
// Luồng 02 — đăng/sửa tin. Form + nén ảnh + lịch chặn ngày: chỉ chủ xe cần, nên tách gói riêng.
const TrangDangTin = lazy(() => import('./modules/listing/TrangDangTin'))
// Luồng 03 — bảng điều khiển chủ xe: danh sách xe + số liệu 30 ngày.
const TrangChuXe = lazy(() => import('./modules/owner/TrangChuXe'))
const LichXeTong = lazy(() => import('./modules/owner/LichXeTong'))


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
              <Route path="/thue-xe" element={<TrangTimKiem />} />
              {/* Phải đứng sau "/thue-xe" ở trên — route tĩnh luôn thắng route
                  động cùng tiền tố trong react-router v6, nhưng để rõ ràng vẫn
                  xếp đúng thứ tự đọc. */}
              <Route path="/thue-xe/:dongXe" element={<TrangDongXe />} />
              <Route path="/thue-xe/:dongXe/:tinh" element={<TrangDongXe />} />
              <Route path="/cuu-ho" element={<TrangCuuHo />} />
              <Route path="/xe/:id" element={<TrangXe />} />
              {/* Xe đã lưu thuộc luồng 05 (module discovery/saved), không phải 04. */}
              <Route path="/da-luu" element={<TrangDaLuu />} />

              {/* ── Tài khoản ── */}
              <Route path="/dang-nhap" element={<DangNhap />} />
              <Route path="/tai-khoan" element={
                <RequireRole><TrangTaiKhoan /></RequireRole>
              } />
              <Route path="/thong-bao" element={
                <RequireRole><TrangThongBao /></RequireRole>
              } />

              {/* ── Chủ xe ── */}
              <Route path="/chu-xe" element={
                <RequireRole><TrangChuXe /></RequireRole>
              } />
              <Route path="/chu-xe/lich" element={
                <RequireRole><LichXeTong /></RequireRole>
              } />
              <Route path="/chu-xe/dang-tin" element={
                <RequireRole><TrangDangTin /></RequireRole>
              } />
              <Route path="/chu-xe/tin/:id" element={
                <RequireRole><TrangDangTin /></RequireRole>
              } />
              <Route path="/chu-xe/vi" element={
                <RequireRole><TrangVi /></RequireRole>
              } />

              {/* ── Vận hành ── */}
              <Route path="/kiem-duyet" element={
                <RequireRole><ChuaLam ten="Hàng chờ kiểm duyệt" luong="08 — Tin cậy & kiểm duyệt" /></RequireRole>
              } />
              <Route path="/admin/*" element={
                <RequireRole><TrangQuanTri /></RequireRole>
              } />

              {/* ── Trang tĩnh ── */}
              <Route path="/quy-che" element={<QuyChe />} />
              <Route path="/dieu-khoan" element={<DieuKhoan />} />
              <Route path="/bao-mat" element={<BaoMat />} />
              <Route path="/hoan-token" element={<HoanToken />} />
              <Route path="/khieu-nai" element={<KhieuNai />} />
              <Route path="/thue" element={<ThongTinThue />} />
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
