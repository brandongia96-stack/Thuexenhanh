// admin — khung trang quản trị, gắn ở /admin/* (App.jsx).
//
// Phân chia theo Section (Nhóm phân hệ) & Tab riêng biệt, kèm trang Tổng quan (Overview).
// Chỉ hiện sau cổng đăng nhập quản trị (CongQuanTri.jsx).
// Chặn quyền thật nằm ở server (RLS + hàm 0008_admin.sql + Edge Function, phiên 0030).

import { lazy, Suspense } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Car,
  Scale,
  Users,
  Activity,
  LogOut,
} from 'lucide-react'
import { PageLoading } from '../../components/Loading'
import './admin.css'

const TongQuan = lazy(() => import('./TongQuan'))
const HangDuyet = lazy(() => import('./HangDuyet'))
const DuyetGiayTo = lazy(() => import('./DuyetGiayTo'))
const NguoiDung = lazy(() => import('./NguoiDung'))
const DoanhThu = lazy(() => import('./DoanhThu'))
const SucKhoe = lazy(() => import('./SucKhoe'))
const QuanLyBaoCao = lazy(() => import('./QuanLyBaoCao'))
const GiaSan = lazy(() => import('./GiaSan'))
const GiaNhienLieu = lazy(() => import('./GiaNhienLieu'))
const CuuHo = lazy(() => import('./CuuHo'))
const KhieuNai = lazy(() => import('./KhieuNai'))
const YeuCauGo = lazy(() => import('./YeuCauGo'))
const CungCapDuLieu = lazy(() => import('./CungCapDuLieu'))
const XoaTaiKhoan = lazy(() => import('./XoaTaiKhoan'))
const DuyetTinTimXe = lazy(() => import('./DuyetTinTimXe'))

// Cấu trúc phân hệ (Sections) & Tab con
const SECTIONS = [
  {
    id: 'tong-quan',
    to: 'tong-quan',
    nhan: 'Tổng quan',
    Icon: LayoutDashboard,
    items: [],
  },
  {
    id: 'kiem-duyet',
    to: 'duyet-tin',
    nhan: 'Kiểm duyệt & Xe',
    Icon: Car,
    items: [
      { to: 'duyet-tin', nhan: 'Duyệt xe' },
      { to: 'duyet-tim-xe', nhan: 'Duyệt tin tìm xe' },
      { to: 'duyet-giay-to', nhan: 'Duyệt Tích Xanh' },
      { to: 'gia-san', nhan: 'Giá sàn' },
      { to: 'gia-nhien-lieu', nhan: 'Giá nhiên liệu' },
    ],
  },
  {
    id: 'phap-ly',
    to: 'bao-cao',
    nhan: 'Pháp lý & Khiếu nại',
    Icon: Scale,
    items: [
      { to: 'bao-cao', nhan: 'Báo cáo vi phạm' },
      { to: 'khieu-nai', nhan: 'Khiếu nại' },
      { to: 'yeu-cau-go', nhan: 'Yêu cầu gỡ' },
      { to: 'cung-cap-du-lieu', nhan: 'Cung cấp dữ liệu' },
      { to: 'xoa-tai-khoan', nhan: 'Xoá tài khoản' },
    ],
  },
  {
    id: 'tai-khoan',
    to: 'nguoi-dung',
    nhan: 'Tài khoản & Ví',
    Icon: Users,
    items: [
      { to: 'nguoi-dung', nhan: 'Người dùng & ví' },
      { to: 'doanh-thu', nhan: 'Doanh thu' },
    ],
  },
  {
    id: 'van-hanh',
    to: 'cuu-ho',
    nhan: 'Vận hành & Kỹ thuật',
    Icon: Activity,
    items: [
      { to: 'cuu-ho', nhan: 'Cứu hộ' },
      { to: 'suc-khoe', nhan: 'Sức khoẻ hệ thống' },
    ],
  },
]

const gioPhut = (d) =>
  d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

export default function TrangQuanTri({ hetHanLuc = null, onThoat }) {
  const location = useLocation()
  
  // Xác định sub-path hiện tại: ví dụ /admin/duyet-tin -> 'duyet-tin'
  const duongDan = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'tong-quan'

  // Tìm Section đang hoạt động
  const sectionHienTai =
    SECTIONS.find(
      (s) => s.to === duongDan || s.items.some((sub) => sub.to === duongDan),
    ) || SECTIONS[0]

  return (
    <div className="page ad-page-container">
      {/* Tiêu đề & Giới thiệu */}
      <div className="ad-header-top">
        <div>
          <h1 className="t-h1">Quản trị hệ thống</h1>
          <p className="t-small" style={{ color: 'var(--m-mid)', marginTop: 2 }}>
            Bảng điều khiển vận hành, kiểm duyệt và quản lý nền tảng Thuê Xe Nhanh
          </p>
        </div>
        {onThoat && (
          <div className="ad-phien">
            {hetHanLuc && <span className="t-small">Phiên hết hạn lúc {gioPhut(hetHanLuc)}</span>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={onThoat}>
              <LogOut size={16} strokeWidth={1.8} />
              Thoát
            </button>
          </div>
        )}
      </div>

      {/* ─── THANH SECTION CHÍNH (PRIMARY SECTIONS) ─── */}
      {/* Link phải TUYỆT ĐỐI: trang gắn ở route splat /admin/*, link tương đối bị
          nối vào mục đang mở (/admin/tong-quan/duyet-tin) rồi bị `*` đẩy về Tổng quan. */}
      <nav className="ad-section-bar" aria-label="Phân hệ quản trị">
        {SECTIONS.map((sec) => {
          const laActive = sectionHienTai.id === sec.id
          const { Icon } = sec
          return (
            <Link
              key={sec.id}
              to={`/admin/${sec.to}`}
              className={`ad-section-tab${laActive ? ' active' : ''}`}
            >
              <Icon size={17} strokeWidth={laActive ? 2.2 : 1.8} />
              <span>{sec.nhan}</span>
            </Link>
          )
        })}
      </nav>

      {/* ─── THANH TAB CON RIÊNG CHO TỪNG SECTION (SUB-TABS) ─── */}
      {sectionHienTai.items.length > 0 && (
        <nav className="ad-subtabs-bar" aria-label={`Mục con của ${sectionHienTai.nhan}`}>
          {sectionHienTai.items.map((sub) => (
            <NavLink
              key={sub.to}
              to={`/admin/${sub.to}`}
              className={({ isActive }) => `ad-subtab${isActive ? ' active' : ''}`}
            >
              {sub.nhan}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Nội dung tương ứng */}
      <div className="ad-content-box">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route index element={<Navigate to="/admin/tong-quan" replace />} />
            <Route path="tong-quan" element={<TongQuan />} />
            <Route path="duyet-tin" element={<HangDuyet />} />
            <Route path="duyet-tim-xe" element={<DuyetTinTimXe />} />
            <Route path="duyet-giay-to" element={<DuyetGiayTo />} />
            <Route path="bao-cao" element={<QuanLyBaoCao />} />
            <Route path="nguoi-dung" element={<NguoiDung />} />
            <Route path="doanh-thu" element={<DoanhThu />} />
            <Route path="suc-khoe" element={<SucKhoe />} />
            <Route path="gia-san" element={<GiaSan />} />
            <Route path="gia-nhien-lieu" element={<GiaNhienLieu />} />
            <Route path="cuu-ho" element={<CuuHo />} />
            <Route path="khieu-nai" element={<KhieuNai />} />
            <Route path="yeu-cau-go" element={<YeuCauGo />} />
            <Route path="cung-cap-du-lieu" element={<CungCapDuLieu />} />
            <Route path="xoa-tai-khoan" element={<XoaTaiKhoan />} />
            <Route path="*" element={<Navigate to="/admin/tong-quan" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  )
}
