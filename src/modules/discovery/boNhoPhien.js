// discovery/boNhoPhien — nhớ danh sách và vị trí cuộn trong một phiên.
//
// HIEU-NANG.md mục 5: "Bấm Quay lại phải hiện lại danh sách cũ TỨC THÌ, đúng
// vị trí đã cuộn — không tải lại từ đầu. Đây là chỗ khách cảm nhận rõ nhất."
//
// Cách làm: giữ kết quả + vị trí cuộn trong RAM theo khoá (thường là đường dẫn
// kèm bộ lọc). Không dùng sessionStorage vì danh sách 20 thẻ kèm ảnh mờ base64
// là vài trăm KB — ghi/đọc JSON mỗi lần cuộn còn chậm hơn gọi lại mạng.
// Mất khi F5 là chấp nhận được: F5 là khách chủ động muốn dữ liệu mới.
//
// ⚠️ Dùng chung với luồng 04 (trang tìm kiếm). Luồng 04 gọi đúng hai hàm:
// `nhoDanhSach(khoa, duLieu)` sau mỗi lần tải, và `useNhoViTriCuon(khoa, sanSang)`
// trong component danh sách.

import { useEffect, useRef } from 'react'
import { useNavigationType } from 'react-router-dom'

const TUOI_MS = 5 * 60 * 1000
const kho = new Map()

export function nhoDanhSach(khoa, duLieu) {
  const cu = kho.get(khoa)
  kho.set(khoa, { ...cu, duLieu, luc: Date.now() })
}

/** Trả về dữ liệu còn hạn, hoặc null. Hết hạn thì gọi lại mạng. */
export function layDanhSach(khoa) {
  const o = kho.get(khoa)
  if (!o?.duLieu || Date.now() - o.luc > TUOI_MS) return null
  return o.duLieu
}

export function quenDanhSach(khoa) {
  kho.delete(khoa)
}

/**
 * Nhớ và khôi phục vị trí cuộn.
 *
 * @param {string} khoa      cùng khoá với `nhoDanhSach`
 * @param {boolean} sanSang  dữ liệu đã render xong chưa — khôi phục sớm hơn thì
 *                           trang còn ngắn, cuộn tới vị trí cũ là rơi xuống đáy
 */
export function useNhoViTriCuon(khoa, sanSang) {
  const kieuDieuHuong = useNavigationType() // POP = bấm Quay lại
  const daKhoiPhuc = useRef(false)

  useEffect(() => {
    if (!sanSang || daKhoiPhuc.current) return
    daKhoiPhuc.current = true

    const y = kho.get(khoa)?.cuon
    if (kieuDieuHuong === 'POP' && y) {
      // Chờ một khung hình để trình duyệt dựng xong chiều cao thật rồi mới nhảy.
      requestAnimationFrame(() => window.scrollTo(0, y))
    } else if (kieuDieuHuong === 'PUSH') {
      window.scrollTo(0, 0)
    }
  }, [khoa, sanSang, kieuDieuHuong])

  // Ghi vị trí cuộn. KHÔNG đọc `window.scrollY` lúc component bị gỡ: khi đó trang
  // đích (thường đang hiện skeleton ngắn) đã thay chỗ, trình duyệt kẹp scrollY
  // xuống thấp → Quay lại là về sai chỗ. Nên ghi dần vào biến thường (không
  // setState, không dựng lại gì) bằng listener passive: mỗi sự kiện chỉ gán một
  // con số, không ảnh hưởng INP (HIEU-NANG.md mục 0).
  useEffect(() => {
    let y = window.scrollY
    const nho = () => { y = window.scrollY }
    window.addEventListener('scroll', nho, { passive: true })
    return () => {
      window.removeEventListener('scroll', nho)
      const cu = kho.get(khoa)
      kho.set(khoa, { ...cu, cuon: y, luc: cu?.luc ?? Date.now() })
    }
  }, [khoa])
}
