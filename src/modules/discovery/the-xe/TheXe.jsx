import { memo, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Users, Cog, Fuel, Clock, Share2, Check, X } from 'lucide-react'

import { VerifiedBadge } from '../../../components/Badge'
import { formatVndShort, timeAgo } from '../../../lib/format'
import { TRANSMISSIONS, FUELS } from '../../../data/options'
import { napTruocTin } from '../listing-page/chiTietApi'
import { tenNoi } from '../diaGioi'
import NutLuu from '../saved/NutLuu'
import './TheXe.css'

/**
 * Thẻ xe DÙNG CHUNG: trang tìm kiếm, xe đã lưu, trang chủ.
 *
 * Đọc từ view `listing_card` — ảnh là bản `thumb` 400w kèm ảnh mờ base64.
 * CẤM dùng ảnh gốc hay bản `medium` ở danh sách (HIEU-NANG.md mục 1.1).
 *
 * Giao diện lấy mẫu từ `_archive/giao-dien-dev` (CarCard): ảnh 16:9, nút chia sẻ +
 * tim nổi trên ảnh, lưới thông số dạng ô, giá nổi bật. CHỈ bê phần hiển thị.
 * Cố ý KHÔNG bê: đánh giá sao / lượt thích (chưa có dữ liệu thật — CLAUDE.md 1.2),
 * huy hiệu DEMO, nút "Liên hệ chủ xe" trừ token ngay trên thẻ (lấy số là việc của
 * trang chi tiết, luồng 05), nút đẩy tin / sửa / xoá (luồng 03, 07).
 *
 * `memo`: đổi một bộ lọc không được dựng lại toàn bộ danh sách
 * (HIEU-NANG.md mục 4) — các thẻ đã có cùng `id` giữ nguyên tham chiếu nên
 * React bỏ qua không dựng lại.
 *
 * Dạng danh sách (ngang) do CSS quyết định qua lớp `.tk-ds` của nơi chứa, thẻ
 * không cần biết.
 *
 * @param {object} the           một hàng của listing_card
 * @param {object} bangDiaGioi   kết quả `taiTenDiaGioi()`; null thì ẩn dòng địa điểm
 * @param {boolean} uuTien       thẻ nằm ngay màn hình đầu: không lazy, tải ảnh trước
 *                               (HIEU-NANG.md mục 1.3 — ảnh đầu tiên quyết định LCP)
 */
function TheXe({ the, bangDiaGioi, uuTien = false }) {
  const ten = `${the.brand_text} ${the.model_text}${the.year ? ` ${the.year}` : ''}`
  const noi = tenNoi(bangDiaGioi, the.province_id, the.district_id)
  const hopSo = TRANSMISSIONS.find((x) => x.value === the.transmission)?.label
  const nhienLieu = FUELS.find((x) => x.value === the.fuel)?.label
  const dang = timeAgo(the.published_at)

  return (
    <article className={'card card-hover thexe' + (the.is_verified ? ' thexe-xacminh' : '')}>
      <div className="thexe-anh" style={the.cover_blur ? { backgroundImage: `url(${the.cover_blur})` } : undefined}>
        {/* Liên kết phủ kín ảnh. Hai nút nổi bên dưới là anh em của nó chứ không
            nằm TRONG nó: nút lồng trong thẻ <a> là HTML sai, đọc màn hình đọc lộn xộn.
            Rê chuột / chạm là nạp trước tin → bấm vào mở gần như tức thì
            (HIEU-NANG.md mục 3). */}
        <Link
          to={`/xe/${the.id}`}
          className="thexe-lien"
          onMouseEnter={() => napTruocTin(the.id)}
          onTouchStart={() => napTruocTin(the.id)}
          aria-label={ten}
        >
          {the.cover_thumb && (
            <img
              src={the.cover_thumb}
              alt=""
              width={the.cover_width ?? 400}
              height={the.cover_height ?? 225}
              loading={uuTien ? 'eager' : 'lazy'}
              fetchPriority={uuTien ? 'high' : undefined}
              decoding="async"
            />
          )}
        </Link>
        <div className="thexe-nut">
          <NutChiaSe id={the.id} ten={ten} gia={the.price_per_day} />
          <NutLuu tin={the} kieu="tron" />
        </div>
      </div>

      <div className="thexe-than">
        <div className="thexe-dau">
          <Link to={`/xe/${the.id}`} className="t-h3 thexe-ten" title={ten}>{ten}</Link>
          {dang && (
            <span className="thexe-dang t-small">
              <Clock size={12} strokeWidth={1.8} aria-hidden="true" />
              Đăng {dang}
            </span>
          )}
        </div>

        {/* Ô nào thiếu dữ liệu thì ẩn ô đó; không có ô nào thì ẩn cả lưới. */}
        {(the.seats || hopSo || nhienLieu || noi) && (
          <div className="thexe-thongso">
            {the.seats && <span><Users size={14} strokeWidth={1.8} />{the.seats} chỗ</span>}
            {hopSo && <span><Cog size={14} strokeWidth={1.8} />{hopSo}</span>}
            {nhienLieu && <span><Fuel size={14} strokeWidth={1.8} />{nhienLieu}</span>}
            {noi && <span className="thexe-noi"><MapPin size={14} strokeWidth={1.8} />{noi}</span>}
          </div>
        )}

        <div className="thexe-chan">
          <div className="thexe-gia">
            <strong>{formatVndShort(the.price_per_day)}</strong>
            <span>/ ngày</span>
          </div>
          <VerifiedBadge verified={the.is_verified} />
        </div>
        {/* Cố ý KHÔNG có "5.0 · 15+ chuyến" — v0.1 bịa con số đó.
            Chưa có đánh giá thật (luồng 09) thì không hiện gì cả. */}
      </div>
    </article>
  )
}

// Chép chữ khi `navigator.clipboard` bị chặn (trang không an toàn, WebView, trình
// duyệt cũ). execCommand đã lỗi thời nhưng vẫn chạy được trong lúc đang xử lý cú bấm.
function chepDuPhong(chu) {
  const o = document.createElement('textarea')
  o.value = chu
  o.setAttribute('readonly', '')
  o.style.position = 'fixed'
  o.style.opacity = '0'
  document.body.appendChild(o)
  o.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(o)
  }
}

/**
 * Chia sẻ tin. Ưu tiên hộp chia sẻ của điện thoại (Zalo, Messenger…), máy tính
 * thì chép link. Báo kết quả ngay trên nút bằng dấu tick — không dùng alert().
 * Chỉ chia sẻ đường dẫn `/xe/:id`, không đính thêm số điện thoại hay dữ liệu nào.
 */
function NutChiaSe({ id, ten, gia }) {
  // 'xong' = đã chép, 'loi' = không chép được. Lỗi phải THẤY được: bấm mà im
  // lặng thì khách tưởng nút hỏng.
  const [ketQua, setKetQua] = useState(null)
  const hen = useRef(null)
  useEffect(() => () => clearTimeout(hen.current), [])

  async function chiaSe() {
    const url = `${window.location.origin}/xe/${id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: ten, text: `${ten} · ${formatVndShort(gia)}/ngày`, url })
        return
      } catch (e) {
        if (e?.name === 'AbortError') return // khách tự đóng hộp chia sẻ, không phải lỗi
      }
    }
    let ok = false
    try {
      await navigator.clipboard.writeText(url)
      ok = true
    } catch {
      ok = chepDuPhong(url)
    }
    setKetQua(ok ? 'xong' : 'loi')
    clearTimeout(hen.current)
    hen.current = setTimeout(() => setKetQua(null), 2200)
  }

  const nhan = ketQua === 'xong' ? 'Đã chép liên kết' : ketQua === 'loi' ? 'Chưa chép được liên kết' : 'Chia sẻ xe'

  return (
    <button
      type="button"
      className={'thexe-btn' + (ketQua === 'xong' ? ' xong' : ketQua === 'loi' ? ' loi' : '')}
      onClick={chiaSe}
      aria-label={nhan}
      title={nhan}
    >
      {ketQua === 'xong' ? <Check size={16} strokeWidth={2} /> : ketQua === 'loi' ? <X size={16} strokeWidth={2} /> : <Share2 size={16} strokeWidth={2} />}
    </button>
  )
}

export default memo(TheXe)
