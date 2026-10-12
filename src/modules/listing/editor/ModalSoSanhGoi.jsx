import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, Check, Wallet, Zap, Shield, Sparkles, Clock, ArrowRight } from 'lucide-react'
import { TOKENS_PER_MONTH } from '../../../lib/config'
import { GOI } from '../fieldGroups'
import './ModalSoSanhGoi.css'

const TIET_MUC = [
  { ten: 'Mức phí duy trì hiển thị', coban: `${TOKENS_PER_MONTH} Token/tháng`, daydu: `${TOKENS_PER_MONTH} Token/tháng`, ghiChu: 'Đồng giá (~40.000đ/tháng)' },
  { ten: 'Thời gian hoàn tất đăng xe', coban: '~2 phút siêu tốc', daydu: '~5 - 7 phút chi tiết' },
  { ten: 'Thông tin kỹ thuật cốt lõi (Hãng, đời, số chỗ, hộp số, nhiên liệu)', coban: true, daydu: true },
  { ten: 'Tải ảnh thực tế (Tối đa 10 ảnh chất lượng cao)', coban: true, daydu: true },
  { ten: 'Bảo vệ SĐT & Zalo liên hệ (Chống bot cào số tự động)', coban: true, daydu: true },
  { ten: 'Khai báo chi tiết tiền cọc & hình thức thế chấp', coban: false, daydu: true, moTa: 'Khách nắm rõ điều kiện cọc, đỡ gọi hỏi nhiều' },
  { ten: 'Giới hạn km mỗi ngày & Đơn giá phụ trội vượt km', coban: false, daydu: true, moTa: 'Tránh tranh chấp khi trả xe' },
  { ten: 'Danh mục 13 tiện nghi chi tiết trên xe (Camera, GPS, Bluetooth...)', coban: false, daydu: true, moTa: 'Dễ tiếp cận khách tìm kiếm theo bộ lọc' },
  { ten: 'Lịch bận xe (Chủ động chặn ngày xe đã kín lịch)', coban: false, daydu: true, moTa: 'Khách không gọi vào ngày bận' },
  { ten: 'Chính sách sạc & Cam kết Pin (Dành cho xe điện EV)', coban: false, daydu: true, moTa: 'Bàn giao % pin và dây sạc di động' },
  { ten: 'AI Quét giấy tờ xe tự động (OCR)', coban: false, daydu: true, moTa: 'Tự động trích xuất thông tin cà vẹt / đăng kiểm' },
  { ten: 'Mức độ tin cậy từ khách thuê', coban: 'Tiêu chuẩn', daydu: '⭐ Tối ưu cuộc gọi' },
]

export default function ModalSoSanhGoi({ onDong, goiHienTai, onChonGoi }) {
  const hopRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onDong?.() }
    document.addEventListener('keydown', onKey)
    const cuOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    hopRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = cuOverflow
    }
  }, [onDong])

  return (
    <div
      className="mssg-nen"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onDong?.() }}
    >
      <div
        className="mssg-hop"
        role="dialog"
        aria-modal="true"
        aria-label="So sánh 2 cách đăng tin xe"
        tabIndex={-1}
        ref={hopRef}
      >
        {/* Header */}
        <div className="mssg-dau">
          <div>
            <div className="t-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} color="var(--m-green)" />
              So sánh 2 cách đăng tin xe
            </div>
            <div className="t-small" style={{ marginTop: 4, color: 'var(--m-mid)' }}>
              Cả 2 gói đều có <strong>cùng mức phí ({TOKENS_PER_MONTH} Token/tháng)</strong>. Chủ xe tự do lựa chọn tuỳ theo nhu cầu.
            </div>
          </div>
          <button type="button" className="mssg-dong" onClick={onDong} aria-label="Đóng popup">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* Nội dung cuộn */}
        <div className="mssg-than">
          {/* 2 Card Gói */}
          <div className="mssg-cards">
            {/* Card Gói Cơ bản */}
            <div className={`mssg-card${goiHienTai === GOI.CO_BAN ? ' mssg-card-highlight' : ''}`}>
              <div>
                <div className="t-small" style={{ color: 'var(--m-mid)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={14} /> Điền nhanh ~2 phút
                </div>
                <h3 className="mssg-card-title" style={{ marginTop: 4 }}>Gói Cơ Bản</h3>
                <p className="t-small" style={{ color: 'var(--m-subtle)', marginTop: 4 }}>
                  Chỉ điền những thông tin thiết yếu nhất để xe lên sàn ngay.
                </p>
              </div>

              <div>
                <div className="mssg-price">
                  <span className="mssg-price-num">{TOKENS_PER_MONTH}</span>
                  <span className="mssg-price-unit">Token / tháng</span>
                </div>
                <div className="t-small" style={{ color: 'var(--m-mid)', marginTop: 2 }}>
                  Tương đương ~40.000đ
                </div>
              </div>

              <button
                type="button"
                className={`btn ${goiHienTai === GOI.CO_BAN ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                onClick={() => {
                  onChonGoi?.(GOI.CO_BAN)
                  onDong?.()
                }}
              >
                {goiHienTai === GOI.CO_BAN ? '✓ Đang chọn gói này' : 'Chọn Gói Cơ Bản'}
              </button>
            </div>

            {/* Card Gói Đầy đủ */}
            <div className={`mssg-card mssg-card-highlight`}>
              <span className="mssg-badge-hot">Khuyên dùng</span>
              <div>
                <div className="t-small" style={{ color: 'var(--m-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={14} /> Đầy đủ &amp; Uy tín cao
                </div>
                <h3 className="mssg-card-title" style={{ marginTop: 4 }}>Gói Đầy Đủ</h3>
                <p className="t-small" style={{ color: 'var(--m-subtle)', marginTop: 4 }}>
                  Thêm tiện nghi, tiền cọc, lịch xe bận và chính sách pin giúp khách nắm rõ điều kiện.
                </p>
              </div>

              <div>
                <div className="mssg-price">
                  <span className="mssg-price-num" style={{ color: 'var(--m-green)' }}>{TOKENS_PER_MONTH}</span>
                  <span className="mssg-price-unit">Token / tháng</span>
                </div>
                <div className="t-small" style={{ color: 'var(--m-green)', fontWeight: 600, marginTop: 2 }}>
                  Cùng mức phí, nhiều quyền lợi hơn
                </div>
              </div>

              <button
                type="button"
                className={`btn ${goiHienTai === GOI.DAY_DU ? 'btn-primary' : 'btn-soft'} btn-sm`}
                onClick={() => {
                  onChonGoi?.(GOI.DAY_DU)
                  onDong?.()
                }}
              >
                {goiHienTai === GOI.DAY_DU ? '✓ Đang chọn gói này' : 'Chọn Gói Đầy Đủ'}
              </button>
            </div>
          </div>

          {/* Bảng so sánh chi tiết tính năng */}
          <div>
            <h4 className="t-h3" style={{ marginBottom: 'var(--sp-3)' }}>Bảng so sánh chi tiết tính năng</h4>
            <div className="mssg-bang-wrap">
              <table className="mssg-bang">
                <thead>
                  <tr>
                    <th>Tính năng / Dữ liệu</th>
                    <th className="center">Gói Cơ Bản</th>
                    <th className="center" style={{ color: 'var(--m-green)' }}>Gói Đầy Đủ</th>
                  </tr>
                </thead>
                <tbody>
                  {TIET_MUC.map((m, idx) => (
                    <tr key={idx} className="highlight-col">
                      <td>
                        <strong>{m.ten}</strong>
                        {m.moTa && <div className="t-small" style={{ color: 'var(--m-subtle)' }}>{m.moTa}</div>}
                      </td>
                      <td className="center">
                        {typeof m.coban === 'boolean' ? (
                          m.coban ? (
                            <span className="mssg-check"><Check size={14} strokeWidth={2.5} /></span>
                          ) : (
                            <span className="mssg-cross"><X size={14} strokeWidth={2} /></span>
                          )
                        ) : (
                          <span style={{ fontWeight: 600 }}>{m.coban}</span>
                        )}
                      </td>
                      <td className="center">
                        {typeof m.daydu === 'boolean' ? (
                          m.daydu ? (
                            <span className="mssg-check"><Check size={14} strokeWidth={2.5} /></span>
                          ) : (
                            <span className="mssg-cross"><X size={14} strokeWidth={2} /></span>
                          )
                        ) : (
                          <span style={{ fontWeight: 700, color: 'var(--m-green)' }}>{m.daydu}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Chân Popup dẫn về trang Ví & Nạp Token */}
        <div className="mssg-chan">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <Wallet size={18} color="var(--m-blue)" />
            <span className="t-small">
              Muốn kiểm tra số dư hoặc nạp thêm token cho xe?
            </span>
          </div>
          <Link
            to="/chu-xe/vi"
            className="btn btn-ghost btn-sm"
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={onDong}
          >
            Đến trang Ví Token <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
