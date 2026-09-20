import {
  Users, Cog, Fuel, Calendar, Palette, Car, Gauge as GaugeIcon,
  MapPin, ExternalLink, CalendarX2,
} from 'lucide-react'
// 13 icon tiện nghi — import TỪNG CÁI. Import cả gói lucide-react là hơn 1 MB
// (HIEU-NANG.md mục 3, CLAUDE.md mục 1.4).
import {
  Map as MapIcon, Aperture, Video, CameraOff, Gauge, Navigation, CreditCard,
  ShieldCheck, CircleDot, Radar, Sun, Cpu, Armchair, Check,
} from 'lucide-react'

import { AMENITY_BY_CODE } from '../../../data/amenities'
import { TRANSMISSIONS, FUELS } from '../../../data/options'
import { formatVnd, formatDate } from '../../../lib/format'

const nhan = (ds, v) => ds.find((x) => x.value === v)?.label ?? null

const ICON_TIEN_NGHI = {
  Map: MapIcon, Aperture, Video, CameraOff, Gauge, Navigation, CreditCard,
  ShieldCheck, CircleDot, Radar, Sun, Cpu, Armchair,
}

/**
 * Khối nội dung. Trả null khi không có gì để nói.
 *
 * Đây là chỗ luật graceful degradation sống hay chết: tin gói Cơ Bản thiếu
 * thông số thì ẨN CẢ KHỐI, không hiện nhãn với ô trống (CLAUDE.md 1.3).
 */
export function Khoi({ title, children, trong = false }) {
  if (trong) return null
  return (
    <section className="khoi">
      <h2 className="t-h3">{title}</h2>
      {children}
    </section>
  )
}

/** Thông số kỹ thuật. Mỗi dòng tự biến mất nếu chủ xe không khai. */
export function KhoiThongSo({ tin }) {
  const dong = [
    { icon: Users, label: 'Số chỗ', value: tin.seats ? `${tin.seats} chỗ` : null },
    { icon: Cog, label: 'Hộp số', value: nhan(TRANSMISSIONS, tin.transmission) },
    { icon: Fuel, label: 'Nhiên liệu', value: nhan(FUELS, tin.fuel) },
    { icon: Calendar, label: 'Năm sản xuất', value: tin.year || null },
    { icon: Palette, label: 'Màu xe', value: tin.color },
    { icon: Car, label: 'Kiểu xe', value: tin.body_style },
    {
      icon: GaugeIcon,
      label: tin.fuel === 'dien' ? 'Quãng đường mỗi 1% pin' : 'Mức tiêu hao',
      value: tin.fuel_consumption
        ? `${tin.fuel_consumption} ${tin.fuel === 'dien' ? 'km / 1%' : 'lít / 100km'}`
        : null,
    },
  ].filter((d) => d.value != null && d.value !== '')

  return (
    <Khoi title="Thông số xe" trong={!dong.length}>
      <dl className="thongso">
        {dong.map((d) => (
          <div key={d.label} className="thongso-o">
            <d.icon size={18} strokeWidth={1.8} />
            <dt className="t-small">{d.label}</dt>
            <dd>{d.value}</dd>
          </div>
        ))}
      </dl>
    </Khoi>
  )
}

export function KhoiTienNghi({ codes = [] }) {
  const ds = codes.map((c) => AMENITY_BY_CODE[c]).filter(Boolean)
  return (
    <Khoi title="Tiện nghi" trong={!ds.length}>
      <ul className="tiennghi">
        {ds.map((a) => {
          const Icon = ICON_TIEN_NGHI[a.icon] ?? Check
          return (
            <li key={a.code}>
              <Icon size={18} strokeWidth={1.8} />
              {a.name}
            </li>
          )
        })}
      </ul>
    </Khoi>
  )
}

/**
 * Giá & điều kiện thuê.
 * Giá theo ngày luôn có (cột NOT NULL). Mấy dòng còn lại là gói Đầy Đủ,
 * thiếu thì biến mất từng dòng một.
 */
export function KhoiGia({ tin }) {
  const dong = [
    { label: 'Giá theo tháng', value: formatVnd(tin.price_per_month) },
    { label: 'Tiền cọc', value: tin.deposit_note },
    { label: 'Phí giao xe', value: tin.delivery_fee_note },
    {
      label: 'Giới hạn km mỗi ngày',
      value: tin.limit_km_per_day ? `${tin.limit_km_per_day} km` : null,
    },
    {
      label: 'Phí vượt km',
      value: tin.extra_km_fee ? `${formatVnd(tin.extra_km_fee)} / km` : null,
    },
  ].filter((d) => d.value)

  return (
    <Khoi title="Giá & điều kiện thuê" trong={!dong.length}>
      <dl className="dieukien">
        {dong.map((d) => (
          <div key={d.label}>
            <dt className="t-small">{d.label}</dt>
            <dd>{d.value}</dd>
          </div>
        ))}
      </dl>
    </Khoi>
  )
}

/**
 * Mô tả của chủ xe. Đây cũng là chỗ chủ xe ghi giấy tờ cần mang và điều kiện
 * thuê — CSDL không có cột riêng cho hai thứ đó (xem listing/fieldGroups.js,
 * trường `description`). Không bịa thêm khối "Giấy tờ yêu cầu" rồi để trống.
 */
export function KhoiMoTa({ text }) {
  return (
    <Khoi title="Mô tả từ chủ xe" trong={!text?.trim()}>
      <p className="mota">{text}</p>
    </Khoi>
  )
}

/**
 * Lịch bận. CHỈ HIỆN — khách không đặt được ngày ở đây.
 * App là rao vặt, không giữ chỗ (CLAUDE.md 1.2).
 */
export function KhoiLichBan({ khoang = [] }) {
  return (
    <Khoi title="Ngày xe đã bận" trong={!khoang.length}>
      <ul className="lichban">
        {khoang.map((k) => (
          <li key={k.id}>
            <CalendarX2 size={16} strokeWidth={1.8} />
            <span>
              {formatDate(k.date_from)}
              {k.date_to !== k.date_from && ` – ${formatDate(k.date_to)}`}
            </span>
            {k.note && <span className="t-small">{k.note}</span>}
          </li>
        ))}
      </ul>
      <p className="t-small">
        Đây là lịch chủ xe tự khai. Muốn chắc ngày của mình thì gọi hỏi trực tiếp.
      </p>
    </Khoi>
  )
}

/**
 * Nơi nhận xe.
 *
 * HIEU-NANG.md mục 4 + mục 9: CẤM nhúng iframe bản đồ — mỗi iframe vài trăm KB
 * và kéo theo cả đống script của Google. Ở đây là địa chỉ dạng chữ + một nút
 * mở bản đồ ở app ngoài, 0 KB.
 *
 * Ảnh bản đồ tĩnh cần Google Maps Static API (CLAUDE.md mục 5.3 — "khi lên quy
 * mô"), chưa có khoá thì không vẽ bản đồ giả cho đẹp.
 */
export function BanDo({ tin }) {
  const diaChi = [tin.address_text, tin.tenQuan, tin.tenTinh].filter(Boolean).join(', ')
  if (!diaChi) return null

  const truyVan = tin.lat && tin.lng ? `${tin.lat},${tin.lng}` : diaChi
  const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(truyVan)}`

  return (
    <Khoi title="Nơi nhận xe">
      <div className="bando">
        <MapPin size={18} strokeWidth={1.8} />
        <span>{diaChi}</span>
        <a className="btn btn-ghost btn-sm" href={link} target="_blank" rel="noreferrer">
          Mở bản đồ
          <ExternalLink size={14} strokeWidth={2} />
        </a>
      </div>
      <p className="t-small">Địa chỉ chính xác do chủ xe hẹn khi anh/chị gọi.</p>
    </Khoi>
  )
}

/**
 * Đánh giá.
 *
 * v0.1 hardcode 5 sao + 2 bình luận giả (CLAUDE.md mục 9). Gỡ sạch.
 * Đánh giá thật là luồng 09. Tới lúc đó khối này mới có nội dung — giờ nói
 * thẳng là chưa có, không bịa một con số nào.
 */
export function KhoiDanhGia() {
  return (
    <Khoi title="Đánh giá">
      <p className="t-small">
        Chưa có đánh giá. Thuexenhanh chỉ hiện đánh giá của khách đã thuê thật,
        không dựng sẵn điểm số.
      </p>
    </Khoi>
  )
}
