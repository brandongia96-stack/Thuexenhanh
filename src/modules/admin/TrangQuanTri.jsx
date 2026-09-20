// admin — khung trang quản trị, gắn ở /quan-tri/* (App.jsx).
//
// Chặn quyền thật nằm ở server (RLS + hàm 0005_admin.sql + Edge Function).
// RequireRole ở App.jsx chỉ là lớp giao diện cho êm.
// Mỗi tab tải trễ — mở "Doanh thu" không kéo theo code "Người dùng".

import { lazy, Suspense } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { PageLoading } from '../../components/Loading'
import './admin.css'

const HangDuyet = lazy(() => import('./HangDuyet'))
const NguoiDung = lazy(() => import('./NguoiDung'))
const DoanhThu = lazy(() => import('./DoanhThu'))
const SucKhoe = lazy(() => import('./SucKhoe'))

const TABS = [
  { to: 'duyet-tin', nhan: 'Duyệt tin' },
  { to: 'nguoi-dung', nhan: 'Người dùng & ví' },
  { to: 'doanh-thu', nhan: 'Doanh thu' },
  { to: 'suc-khoe', nhan: 'Sức khoẻ hệ thống' },
]

export default function TrangQuanTri() {
  return (
    <div className="page">
      <h1 className="t-h1">Quản trị</h1>
      <nav className="ad-tabs" aria-label="Mục quản trị">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => `ad-tab${isActive ? ' active' : ''}`}>
            {t.nhan}
          </NavLink>
        ))}
      </nav>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route index element={<Navigate to="duyet-tin" replace />} />
          <Route path="duyet-tin" element={<HangDuyet />} />
          <Route path="nguoi-dung" element={<NguoiDung />} />
          <Route path="doanh-thu" element={<DoanhThu />} />
          <Route path="suc-khoe" element={<SucKhoe />} />
          <Route path="*" element={<Navigate to="duyet-tin" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}
