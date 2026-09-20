import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, X, ImageOff } from 'lucide-react'
import { anhTin, tiLeKhung, napTruoc } from '../anh'

/**
 * Slider ảnh xe.
 *
 * Luật HIEU-NANG.md mục 1.4, không được phá:
 *   · Chỉ tải ảnh ĐANG XEM + nạp trước ĐÚNG MỘT ảnh kế tiếp. Không nạp cả album.
 *   · Ảnh bìa dùng bản `medium` (800w). Bản `full` (1600w) CHỈ tải khi bấm phóng to.
 *   · Vuốt nhanh qua thì huỷ request ảnh không còn cần.
 *   · Mọi <img> có aspect-ratio → ảnh tải xong trang không nhảy (CLS).
 */
export default function SliderAnh({ anh = [], ten }) {
  const [i, setI] = useState(0)
  const [hien, setHien] = useState(() => new Set([0])) // chỉ mục đã được phép tải
  const [phongTo, setPhongTo] = useState(false)
  const chamX = useRef(null)

  const tong = anh.length
  const hienTai = anhTin(anh[i], 'medium')

  // Nạp trước đúng một ảnh kế tiếp, và huỷ nếu khách vuốt đi chỗ khác trước
  // khi nó tải xong.
  useEffect(() => {
    if (i + 1 >= tong) return undefined
    const ke = anhTin(anh[i + 1], 'medium')
    return napTruoc(ke?.url)
  }, [i, tong, anh])

  const den = useCallback(
    (moi) => {
      if (moi < 0 || moi >= tong) return
      setI(moi)
      setHien((s) => (s.has(moi) ? s : new Set(s).add(moi)))
    },
    [tong],
  )

  // Bàn phím: mũi tên trái/phải, Esc đóng khung phóng to.
  useEffect(() => {
    function phim(e) {
      if (e.key === 'ArrowLeft') den(i - 1)
      else if (e.key === 'ArrowRight') den(i + 1)
      else if (e.key === 'Escape') setPhongTo(false)
    }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [i, den])

  if (!tong) {
    // Graceful degradation: không có ảnh thì ẩn cả khối, không hiện ô xám rỗng.
    return (
      <div className="slider-trong">
        <ImageOff size={28} strokeWidth={1.8} />
        <span className="t-small">Tin này chưa có ảnh xe</span>
      </div>
    )
  }

  return (
    <div className="slider">
      <div
        className="slider-khung"
        style={{ aspectRatio: tiLeKhung(hienTai) }}
        onTouchStart={(e) => {
          chamX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (chamX.current == null) return
          const dx = e.changedTouches[0].clientX - chamX.current
          if (Math.abs(dx) > 40) den(dx < 0 ? i + 1 : i - 1)
          chamX.current = null
        }}
      >
        {anh.map((a, idx) => {
          const src = anhTin(a, 'medium')
          if (!src) return null
          return (
            <img
              key={a.id ?? idx}
              className={'slider-anh' + (idx === i ? ' hien' : '')}
              // Ảnh chưa tới lượt thì chưa có src — đó là cách duy nhất chắc
              // chắn trình duyệt không kéo sẵn cả album về trên 4G.
              src={hien.has(idx) ? src.url : undefined}
              alt={`${ten} — ảnh ${idx + 1}/${tong}`}
              width={src.width ?? undefined}
              height={src.height ?? undefined}
              // Ảnh đầu tiên là LCP của trang: không lazy, ưu tiên cao.
              loading={idx === 0 ? 'eager' : 'lazy'}
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              decoding="async"
              // Nền mờ base64 nhúng sẵn: hiện ngay, 0 request (HIEU-NANG 1.2).
              style={src.blur ? { backgroundImage: `url(${src.blur})` } : undefined}
              draggable={false}
            />
          )
        })}

        {tong > 1 && (
          <>
            <button
              type="button"
              className="slider-nut slider-trai"
              onClick={() => den(i - 1)}
              disabled={i === 0}
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="slider-nut slider-phai"
              onClick={() => den(i + 1)}
              disabled={i === tong - 1}
              aria-label="Ảnh sau"
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </>
        )}

        <button
          type="button"
          className="slider-nut slider-to"
          onClick={() => setPhongTo(true)}
          aria-label="Phóng to ảnh"
        >
          <Expand size={18} strokeWidth={2} />
        </button>

        {tong > 1 && <div className="slider-dem">{i + 1}/{tong}</div>}
      </div>

      {tong > 1 && (
        <div className="slider-thumb" role="tablist" aria-label="Chọn ảnh">
          {anh.map((a, idx) => {
            const t = anhTin(a, 'thumb')
            if (!t) return null
            return (
              <button
                type="button"
                key={a.id ?? idx}
                className={'slider-o' + (idx === i ? ' chon' : '')}
                onClick={() => den(idx)}
                role="tab"
                aria-selected={idx === i}
                aria-label={`Ảnh ${idx + 1}`}
              >
                <img
                  src={t.url}
                  alt=""
                  width={t.width ?? undefined}
                  height={t.height ?? undefined}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            )
          })}
        </div>
      )}

      {phongTo && <KhungPhongTo anh={anh[i]} ten={ten} dong={() => setPhongTo(false)} />}
    </div>
  )
}

/** Bản `full` 1600w chỉ được tải ở đây — đúng lúc khách bấm phóng to. */
function KhungPhongTo({ anh, ten, dong }) {
  const src = anhTin(anh, 'full')
  if (!src) return null
  return (
    <div className="phongto" onClick={dong} role="dialog" aria-modal="true" aria-label="Ảnh phóng to">
      <button type="button" className="phongto-dong" onClick={dong} aria-label="Đóng">
        <X size={22} strokeWidth={2} />
      </button>
      <img
        src={src.url}
        alt={ten}
        width={src.width ?? undefined}
        height={src.height ?? undefined}
        decoding="async"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
