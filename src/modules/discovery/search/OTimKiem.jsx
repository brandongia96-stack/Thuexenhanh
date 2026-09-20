import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import './OTimKiem.css'

export const DEBOUNCE_MS = 300

/**
 * Ô tìm kiếm DÙNG CHUNG (trang tìm kiếm luồng 04, trang chủ luồng 14).
 * Import thẳng file này, không qua `discovery/index.js` (giữ gói đầu nhẹ).
 *
 *   Trang chủ:  <OTimKiem onGui={(cau) => navigate(duongDanTimKiem(cau))} />
 *   Tìm kiếm:   <OTimKiem value={loc.q} onGoiY={doiQ} onGui={chotCau} />
 *
 * @param {string}   value    giá trị đang có trong URL (nguồn sự thật)
 * @param {(s:string)=>void} onGoiY  bắn SAU 300ms ngừng gõ — gõ 10 chữ = 1 lần gọi,
 *                                    không phải 10 (HIEU-NANG.md mục 2.5)
 * @param {(s:string)=>void} onGui   bắn khi bấm Enter / nút Tìm
 */
export default function OTimKiem({
  value = '',
  onGoiY,
  onGui,
  placeholder = 'Tìm xe, ví dụ: innova, xe 7 chỗ…',
  autoFocus = false,
}) {
  const [text, setText] = useState(value)
  const daGui = useRef(value) // giá trị cuối cùng ô này tự đẩy ra ngoài
  const hen = useRef(null)

  // Giá trị bên ngoài đổi (gỡ chip, bấm "Xoá tất cả", Quay lại) thì ô theo.
  // Phải so với `daGui`, không thì đang gõ dở bị đè lại về chữ cũ.
  useEffect(() => {
    if (value !== daGui.current) {
      daGui.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => () => clearTimeout(hen.current), [])

  function doiChu(e) {
    const s = e.target.value
    setText(s)
    if (!onGoiY) return
    clearTimeout(hen.current)
    hen.current = setTimeout(() => {
      daGui.current = s
      onGoiY(s)
    }, DEBOUNCE_MS)
  }

  function gui(e) {
    e.preventDefault()
    clearTimeout(hen.current) // Enter thì khỏi chờ debounce
    onGui?.(text)
  }

  function xoa() {
    clearTimeout(hen.current)
    setText('')
    daGui.current = ''
    onGoiY?.('')
  }

  return (
    <form className="otk" role="search" onSubmit={gui}>
      <Search size={18} strokeWidth={2} className="otk-kinh" aria-hidden="true" />
      <input
        className="otk-o"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        value={text}
        onChange={doiChu}
        placeholder={placeholder}
        aria-label="Tìm xe"
        maxLength={100}
      />
      {text && (
        <button type="button" className="otk-xoa" onClick={xoa} aria-label="Xoá từ khoá">
          <X size={16} strokeWidth={2} />
        </button>
      )}
      <button type="submit" className="btn btn-primary btn-sm otk-tim">Tìm</button>
    </form>
  )
}
