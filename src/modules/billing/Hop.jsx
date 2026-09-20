import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Hộp nổi dùng chung trong module ví.
 *
 * Cố tình để ở trong `modules/billing/`, không đẩy lên `components/`:
 * `components/` là của chung, đổi ở đó là đụng mọi luồng khác. Khi có luồng
 * thứ hai cần đúng hộp này thì hẵng chuyển lên, kèm một lần bàn bạc.
 */
export default function Hop({ tieuDe, moTa, onDong, children }) {
  const hopRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onDong?.() }
    document.addEventListener('keydown', onKey)
    // Khoá cuộn nền: trên điện thoại, nền cuộn sau lưng hộp là lỗi khó chịu nhất.
    const cuOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    hopRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = cuOverflow
    }
  }, [onDong])

  return (
    <div className="hop-nen" onMouseDown={(e) => { if (e.target === e.currentTarget) onDong?.() }}>
      <div
        className="hop"
        role="dialog"
        aria-modal="true"
        aria-label={tieuDe}
        tabIndex={-1}
        ref={hopRef}
      >
        <div className="hop-dau">
          <div>
            <div className="t-h2">{tieuDe}</div>
            {moTa && <div className="t-small" style={{ marginTop: 'var(--sp-1)' }}>{moTa}</div>}
          </div>
          <button type="button" className="hop-dong" onClick={onDong} aria-label="Đóng">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
