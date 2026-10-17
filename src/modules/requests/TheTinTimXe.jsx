import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, MapPin, DollarSign, Car, Phone, 
  MessageCircle, Send, CheckCircle2, Share2, Sparkles, User, Tag
} from 'lucide-react'
import { formatVnd } from '../../lib/format'
import { moTaNganSach } from './nganSach'
import { useAuth } from '../auth/AuthProvider'
import ModalXemLienHe from './ModalXemLienHe'
import ModalChaoXe from './ModalChaoXe'

/**
 * Tính thời gian đăng tương đối (vd: 5 phút trước, 2 giờ trước)
 */
function thoiGianTuongDoi(isoString) {
  if (!isoString) return ''
  const past = new Date(isoString).getTime()
  const now = Date.now()
  const diffSec = Math.floor((now - past) / 1000)

  if (diffSec < 60) return 'Vừa xong'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} giờ trước`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `${diffDay} ngày trước`
  return new Date(isoString).toLocaleDateString('vi-VN')
}

export default function TheTinTimXe({ request, onCapNhat }) {
  const { user, isOwner } = useAuth()
  const [moLienHe, setMoLienHe] = useState(false)
  const [moChaoXe, setMoChaoXe] = useState(false)
  const [daCopyLink, setDaCopyLink] = useState(false)

  // Map nhãn tiện ích
  const MAP_TAGS = {
    giao_tan_noi: '🚀 Giao tận nơi',
    mien_the_chap: '🔑 Miễn cọc xe máy',
    sach_se: '✨ Sạch sẽ không mùi',
    doi_moi: '🛡️ Xe đời mới',
    di_tinh: '🛣️ Đi tỉnh',
    free_sac: '⚡ Free sạc',
    co_tai: '👨‍✈️ Thuê có tài'
  }

  function handleShare() {
    const url = `${window.location.origin}/cong-dong?id=${request.id}`
    navigator.clipboard.writeText(url)
    setDaCopyLink(true)
    setTimeout(() => setDaCopyLink(false), 2000)
  }

  const isMyPost = user && user.id === request.customer_id

  return (
    <article className="the-timxe-card">
      {/* 1. Header bài đăng */}
      <div className="the-timxe-header">
        <div className="the-timxe-tacgia">
          {request.customer_avatar ? (
            <img 
              src={request.customer_avatar} 
              alt="" 
              className="the-timxe-avatar" 
              loading="lazy"
            />
          ) : (
            <div className="the-timxe-avatar avatar-fallback">
              {(request.customer_name || 'K').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="the-timxe-info">
            <div className="the-timxe-ten-hang">
              <span className="the-timxe-ten">{request.customer_name || 'Khách thuê'}</span>
              <span className="badge-loai-tin">Cần tìm xe</span>
            </div>
            <div className="the-timxe-meta">
              <span>{thoiGianTuongDoi(request.created_at)}</span>
              {request.distance_km !== undefined && request.distance_km !== null && (
                <>
                  <span className="meta-cham">•</span>
                  <span className="meta-khoang-cach">
                    <MapPin size={12} />
                    Cách bạn ~{request.distance_km} km
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button 
          type="button" 
          className="btn-share-post" 
          onClick={handleShare}
          title="Sao chép liên kết bài đăng"
          aria-label="Chia sẻ"
        >
          <Share2 size={16} />
          {daCopyLink && <span className="tooltip-share">Đã chép link!</span>}
        </button>
      </div>

      {/* 2. Hàng tiêu chí nổi bật (Badges 5 tiêu chí) */}
      <div className="the-timxe-chips">
        <div className="timxe-chip chip-ngay">
          <Calendar size={13} />
          <span>
            {new Date(request.start_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            {' – '}
            {new Date(request.end_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
          </span>
        </div>

        {request.seats && (
          <div className="timxe-chip chip-xe">
            <Car size={13} />
            <span>{request.seats} chỗ {request.body_style && request.body_style !== 'bat_ky' ? `(${request.body_style})` : ''}</span>
          </div>
        )}

        {(request.district_name || request.province_name) && (
          <div className="timxe-chip chip-vitri">
            <MapPin size={13} />
            <span>{[request.district_name, request.province_name].filter(Boolean).join(', ')}</span>
          </div>
        )}

        <div className="timxe-chip chip-gia">
          <DollarSign size={13} />
          <span>{moTaNganSach(request.budget_min, request.budget_max)}</span>
        </div>
      </div>

      {/* 3. Nội dung bài viết */}
      <div className="the-timxe-noidung">
        {request.content}
      </div>

      {/* 4. Tags tiện ích thêm */}
      {request.extra_tags && request.extra_tags.length > 0 && (
        <div className="the-timxe-tags">
          {request.extra_tags.map(tag => (
            <span key={tag} className="tag-pill">
              {MAP_TAGS[tag] || tag}
            </span>
          ))}
        </div>
      )}

      {/* 5. Footer hành động */}
      <div className="the-timxe-footer">
        <div className="the-timxe-stats">
          {request.offer_count > 0 && (
            <span className="stat-offers">
              🚀 <strong>{request.offer_count}</strong> chủ xe đã chào giá
            </span>
          )}
        </div>

        <div className="the-timxe-buttons">
          {/* Nút Xem liên hệ (tuân thủ luật bảo mật số điện thoại) */}
          <button 
            type="button" 
            className="btn btn-outline btn-sm btn-xemlienhe"
            onClick={() => setMoLienHe(true)}
          >
            <Phone size={15} />
            Xem liên hệ
          </button>

          {/* Nút Gợi ý xe của tôi (dành cho chủ xe) */}
          {isOwner && !isMyPost && (
            <button 
              type="button" 
              className="btn btn-primary btn-sm btn-chao-xe"
              onClick={() => setMoChaoXe(true)}
            >
              <Send size={14} />
              Gợi ý xe của tôi
            </button>
          )}
        </div>
      </div>

      {/* Modal Xem thông tin liên hệ */}
      {moLienHe && (
        <ModalXemLienHe 
          requestId={request.id}
          customerName={request.customer_name}
          onClose={() => setMoLienHe(false)}
        />
      )}

      {/* Modal Chào xe từ chủ xe */}
      {moChaoXe && (
        <ModalChaoXe 
          requestId={request.id}
          customerName={request.customer_name}
          onClose={() => setMoChaoXe(false)}
          onSuccess={() => {
            setMoChaoXe(false)
            onCapNhat?.()
          }}
        />
      )}
    </article>
  )
}
