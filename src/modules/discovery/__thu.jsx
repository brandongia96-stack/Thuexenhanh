// TẠM — trang thử riêng của luồng 05, để nhìn tận mắt trang chi tiết xe khi
// chưa có dự án Supabase. Dữ liệu dưới đây là DỮ LIỆU THỬ, chỉ sống trong file
// này, không bao giờ lọt vào app thật (App.jsx không import file này).
// Xoá `thu-luong-05.html` + file này sau khi đã cắm Supabase và xem được tin thật.

import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import '../../styles.css'
import './listing-page/TrangXe.css'

import SliderAnh from './listing-page/SliderAnh'
import {
  KhoiThongSo, KhoiTienNghi, KhoiGia, KhoiMoTa, KhoiLichBan, BanDo, KhoiDanhGia,
} from './listing-page/KhoiThongTin'
import HopLienHe from './contact/HopLienHe'
import { VerifiedBadge } from '../../components/Badge'
import { formatVnd } from '../../lib/format'

// Ảnh thử: SVG data-url, không gọi mạng. Kích thước thật để thấy aspect-ratio
// có giữ được layout không.
const anhThu = (mau, chu) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">` +
    `<rect width="800" height="600" fill="${mau}"/>` +
    `<text x="400" y="300" font-size="48" fill="#fff" text-anchor="middle">${chu}</text></svg>`,
  )

const TIN = {
  id: 'thu-nghiem',
  owner_id: 'chu-xe-thu',
  status: 'dang_hien_thi',
  brand_text: 'Toyota',
  model_text: 'Innova',
  year: 2021,
  color: 'Trắng',
  seats: 7,
  transmission: 'so_tu_dong',
  fuel: 'xang',
  fuel_consumption: 8.5,
  body_style: 'Gia đình',
  description: 'Xe gia đình đi kỹ, bảo dưỡng đúng hãng.\nKhách mang theo CCCD + bằng lái, đặt cọc xe máy hoặc 15 triệu.',
  price_per_day: 850000,
  price_per_month: 18000000,
  deposit_note: '15 triệu hoặc xe máy + giấy tờ',
  delivery_fee_note: 'Miễn phí trong 10km, ngoài ra 15k/km',
  limit_km_per_day: 300,
  extra_km_fee: 5000,
  address_text: 'Gần sân bay Tân Sơn Nhất',
  tenTinh: 'TP.HCM',
  tenQuan: 'Tân Bình',
  lat: null,
  lng: null,
  amenity_codes: ['ban_do', 'cam_lui', 'etc', 'tui_khi', 'ghe_da', 'cua_so_troi'],
  is_verified: true,
  anh: [
    { id: 1, url_medium: anhThu('#3b82f6', 'Anh 1'), url_thumb: anhThu('#3b82f6', '1'), url_full: anhThu('#3b82f6', 'Anh 1 full'), width: 800, height: 600 },
    { id: 2, url_medium: anhThu('#4b4f56', 'Anh 2'), url_thumb: anhThu('#4b4f56', '2'), url_full: anhThu('#4b4f56', 'Anh 2 full'), width: 800, height: 600 },
    { id: 3, url_medium: anhThu('#16a34a', 'Anh 3'), url_thumb: anhThu('#16a34a', '3'), url_full: anhThu('#16a34a', 'Anh 3 full'), width: 800, height: 600 },
  ],
  ngayChan: [
    { id: 'a', date_from: '2026-10-01', date_to: '2026-10-05', note: 'Khách quen đã giữ' },
    { id: 'b', date_from: '2026-10-20', date_to: '2026-10-20', note: null },
  ],
}

// Tin thiếu dữ liệu: dùng để kiểm tra luật "thiếu thì ẩn CẢ KHỐI".
const TIN_CO_BAN = {
  ...TIN,
  id: 'thu-co-ban',
  color: null, body_style: null, fuel: null, fuel_consumption: null,
  price_per_month: null, deposit_note: null, delivery_fee_note: null,
  limit_km_per_day: null, extra_km_fee: null,
  description: null, amenity_codes: [], ngayChan: [], anh: [],
  address_text: null, tenQuan: null,
  is_verified: false,
}

function MotTin({ tin, conHienThi }) {
  const ten = `${tin.brand_text} ${tin.model_text} ${tin.year}`
  return (
    <div className="page trangxe">
      <div className="trangxe-luoi">
        <div className="trangxe-trai">
          <SliderAnh anh={tin.anh} ten={ten} />
          <header className="trangxe-dau">
            <h1 className="t-h1">{ten}</h1>
            <div className="row trangxe-nhan">
              <VerifiedBadge verified={tin.is_verified} />
              <span className="t-small">{[tin.tenQuan, tin.tenTinh].filter(Boolean).join(', ')}</span>
            </div>
          </header>
          <KhoiThongSo tin={tin} />
          <KhoiTienNghi codes={tin.amenity_codes} />
          <KhoiGia tin={tin} />
          <KhoiMoTa text={tin.description} />
          <KhoiLichBan khoang={tin.ngayChan} />
          <BanDo tin={tin} />
          <KhoiDanhGia />
        </div>
        <aside className="trangxe-phai">
          <div className="hop-lienhe card card-pad">
            <div className="hop-gia">
              <span className="t-price">{formatVnd(tin.price_per_day)}</span>
              <span className="t-small">/ ngày</span>
            </div>
            <HopLienHe tin={tin} userId={null} conHienThi={conHienThi} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function Thu() {
  return (
    <>
      <div className="page"><h1 className="t-h1">Thử trang xe (luồng 05) — tin đầy đủ</h1></div>
      <MotTin tin={TIN} conHienThi />
      <div className="page"><h1 className="t-h1">Tin gói Cơ Bản — khối thiếu dữ liệu phải BIẾN MẤT</h1></div>
      <MotTin tin={TIN_CO_BAN} conHienThi />
      <div className="page"><h1 className="t-h1">Tin đã hết hạn — không được hiện số</h1></div>
      <MotTin tin={TIN} conHienThi={false} />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MemoryRouter>
      <Thu />
    </MemoryRouter>
  </React.StrictMode>,
)
