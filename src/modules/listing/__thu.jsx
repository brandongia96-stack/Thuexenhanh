// TẠM — trang thử riêng của luồng 02, để chạy được form mà chưa phải đụng
// vào App.jsx của luồng 01. Xoá file này cùng `thu-luong-02.html` sau khi
// route /chu-xe/dang-tin đã trỏ vào <TrangDangTin />.

import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import '../../styles.css'
import FormDangTin from './editor/FormDangTin'
import { useFormDangTin } from './editor/useFormDangTin'

function Thu() {
  const dieuKhien = useFormDangTin({ listingId: null, ownerId: 'thu-nghiem', sdtMacDinh: '' })
  return (
    <div className="page">
      <h1 className="t-h1" style={{ marginBottom: 16 }}>Thử form đăng tin (luồng 02)</h1>
      <FormDangTin dieuKhien={dieuKhien} onXong={(id) => console.log('xong', id)} />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MemoryRouter>
      <Thu />
    </MemoryRouter>
  </React.StrictMode>,
)
