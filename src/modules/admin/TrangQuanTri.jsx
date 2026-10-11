// admin — khung trang quản trị, gắn ở /admin/* (App.jsx).
//
// Chặn quyền thật nằm ở server (RLS + hàm 0008_admin.sql + Edge Function).
// RequireRole ở App.jsx chỉ là lớp giao diện cho êm.
// Mỗi tab tải trễ — mở "Doanh thu" không kéo theo code "Người dùng".

import { lazy, Suspense } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { PageLoading } from '../../components/Loading'
import './admin.css'

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

const TABS = [
  { to: 'duyet-tin', nhan: 'Duyệt tin' },
  { to: 'duyet-giay-to', nhan: 'Duyệt Tích Xanh' },
  { to: 'bao-cao', nhan: 'Báo cáo vi phạm' },
  { to: 'nguoi-dung', nhan: 'Người dùng & ví' },
  { to: 'doanh-thu', nhan: 'Doanh thu' },
  { to: 'suc-khoe', nhan: 'Sức khoẻ hệ thống' },
  { to: 'gia-san', nhan: 'Giá sàn' },
  { to: 'gia-nhien-lieu', nhan: 'Giá nhiên liệu' },
  { to: 'cuu-ho', nhan: 'Cứu hộ' },
  { to: 'khieu-nai', nhan: 'Khiếu nại' },
  { to: 'yeu-cau-go', nhan: 'Yêu cầu gỡ' },
  { to: 'cung-cap-du-lieu', nhan: 'Cung cấp dữ liệu' },
  { to: 'xoa-tai-khoan', nhan: 'Xoá tài khoản' },
]

export default function TrangQuanTri() {
  return (
    <div className="page">
      <h1 className="t-h1">Quản trị</h1>
      <nav className="ad-tabs" aria-label="Mục quản trị" style={{ overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap' }}>
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => `ad-tab${isActive ? ' active' : ''}`}>
            {t.nhan}
          </NavLink>
        ))}
      </nav>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route index element={<Navigate to="/admin/duyet-tin" replace />} />
          <Route path="duyet-tin" element={<HangDuyet />} />
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
          <Route path="*" element={<Navigate to="/admin/duyet-tin" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}
