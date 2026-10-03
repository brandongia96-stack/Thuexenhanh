import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, AlertTriangle, CarFront } from 'lucide-react'

import { useAuth } from '../../auth/AuthProvider'
import { VerifiedBadge } from '../../../components/Badge'
import { Skeleton } from '../../../components/Loading'
import { formatVnd } from '../../../lib/format'
import { HAS_BACKEND } from '../../../lib/config'

import { docTinChiTiet, conHienThi } from './chiTietApi'
import SliderAnh from './SliderAnh'
import {
  KhoiThongSo, KhoiTienNghi, KhoiGia, KhoiMoTa, KhoiLichBan, BanDo, KhoiDanhGia, KhoiQuyDinhPin
} from './KhoiThongTin'
import BangTinhTongTien from './BangTinhTongTien'
import HopLienHe from '../contact/HopLienHe'
import NutLuu from '../saved/NutLuu'
import { ghiXemTin } from '../ghiSuKien'
import './TrangXe.css'

/**
 * Trang chi tiết xe.
 *
 * Mục tiêu: khách xem đủ thông tin để quyết định rồi BẤM LẤY SỐ CHỦ XE.
 * Không có nút đặt xe — app là rao vặt, không giữ chỗ được (CLAUDE.md 1.2).
 */
export default function TrangXe() {
  const { id } = useParams()
  const { user } = useAuth()
  const [tin, setTin] = useState(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState(null)

  useEffect(() => {
    let huy = false
    setDangTai(true)
    setLoi(null)
    window.scrollTo(0, 0)

    docTinChiTiet(id)
      .then((kq) => {
        if (huy) return
        setTin(kq)
        setDangTai(false)
        // Ghi ngầm sau khi đã hiện trang. Khử trùng lặp 1 giờ + bỏ qua chủ xe
        // tự xem tin mình nằm trong ghiSuKien.
        if (kq) ghiXemTin(kq, user?.id ?? null)
      })
      .catch((e) => {
        if (huy) return
        setLoi(e)
        setDangTai(false)
      })

    return () => {
      huy = true
    }
    // Cố ý không phụ thuộc `user`: khách đăng nhập giữa chừng thì không tải lại
    // cả trang, chỉ là lượt xem đó đã ghi dưới dạng khách vãng lai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (dangTai) return <KhungCho />

  if (loi) {
    return (
      <TrangBao
        tieuDe="Không tải được tin này"
        moTa="Mạng đang chập chờn. Anh/chị thử tải lại trang giúp em."
      />
    )
  }

  if (!tin) {
    // RLS chỉ cho khách thấy tin đang hiển thị, nên tin hết hạn / bị ẩn / không
    // tồn tại đều rơi vào đây. Không hiện số điện thoại, không đoán bừa lý do.
    return (
      <TrangBao
        tieuDe="Tin đã hết hạn hoặc không còn hiển thị"
        moTa={
          HAS_BACKEND
            ? 'Chủ xe chưa gia hạn hoặc đã gỡ tin này. Anh/chị tìm xe khác nhé.'
            : 'Chưa kết nối máy chủ nên chưa đọc được tin.'
        }
      />
    )
  }

  const ten = `${tin.brand_text} ${tin.model_text}${tin.year ? ` ${tin.year}` : ''}`
  const conSong = conHienThi(tin)
  const noi = [tin.tenQuan, tin.tenTinh].filter(Boolean).join(', ')

  return (
    <div className="page trangxe">
      <Link to="/thue-xe" className="trangxe-quaylai">
        <ChevronLeft size={18} strokeWidth={2} />
        Danh sách xe
      </Link>

      {!conSong && (
        <div className="bang-hethan" role="status">
          <AlertTriangle size={18} strokeWidth={1.8} />
          <span>
            <strong>Tin đã hết hạn.</strong> Thông tin bên dưới có thể không còn đúng và
            không có số liên hệ.
          </span>
        </div>
      )}

      <div className="trangxe-luoi">
        <div className="trangxe-trai">
          <SliderAnh anh={tin.anh} ten={ten} />

          <header className="trangxe-dau">
            <h1 className="t-h1">{ten}</h1>
            <div className="row trangxe-nhan">
              <VerifiedBadge verified={tin.is_verified} />
              {noi && (
                <span className="t-small row" style={{ gap: 'var(--sp-1)' }}>
                  <MapPin size={14} strokeWidth={1.8} />
                  {noi}
                </span>
              )}
            </div>

          </header>

          <KhoiThongSo tin={tin} />
          <KhoiTienNghi codes={tin.amenity_codes} />
          <KhoiGia tin={tin} />
          <BangTinhTongTien tin={tin} userId={user?.id ?? null} conHienThi={conSong} />
          <KhoiMoTa text={tin.description} />
          <KhoiQuyDinhPin text={tin.battery_policy_note} fuel={tin.fuel} />
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
            <NutLuu tin={tin} />
            <HopLienHe tin={tin} userId={user?.id ?? null} conHienThi={conSong} />
            
            {/* Nút báo cáo lừa đảo / giá ảo */}
            <div style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ color: 'var(--m-subtle)', fontSize: '12px' }}
                onClick={() => alert('Chức năng báo cáo tin đăng đang được xây dựng')}
              >
                <AlertTriangle size={14} style={{ marginRight: 4 }} /> 
                Báo cáo tin này
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/** Khung chờ đúng hình dạng trang thật — skeleton, không phải spinner. */
function KhungCho() {
  return (
    <div className="page trangxe" aria-busy="true" aria-label="Đang tải tin">
      <div className="trangxe-luoi">
        <div className="trangxe-trai">
          {/* Khung ảnh giữ đúng tỉ lệ 4/3 của slider thật → trang không nhảy
              khi ảnh về (CLS). */}
          <div className="skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 'var(--r-lg)' }} />
          <Skeleton height={28} width="60%" />
          <Skeleton height={16} width="35%" />
          <Skeleton height={120} />
        </div>
        <aside className="trangxe-phai">
          <div className="card card-pad stack">
            <Skeleton height={24} width="50%" />
            <Skeleton height={44} />
            <Skeleton height={52} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function TrangBao({ tieuDe, moTa }) {
  return (
    <div className="page stack trangxe-bao">
      <CarFront size={36} strokeWidth={1.8} />
      <h1 className="t-h2">{tieuDe}</h1>
      <p className="t-body">{moTa}</p>
      <Link to="/thue-xe" className="btn btn-primary">
        Xem xe khác
      </Link>
    </div>
  )
}
