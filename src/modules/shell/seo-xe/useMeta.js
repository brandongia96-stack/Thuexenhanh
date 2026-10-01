import { useEffect } from 'react'

// Tiêu đề/mô tả mặc định của `index.html` — chụp lại MỘT LẦN lúc app nạp, để
// trang nào không gọi `useMeta` (đa số) không bị ảnh hưởng, và để các trang có
// gọi trả lại đúng giá trị gốc khi khách rời đi (SPA không tự làm việc này).
const MAC_DINH = {
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content ?? '',
}

function dat(selector, thuoc, giaTri) {
  const el = document.querySelector(selector)
  if (el) el.setAttribute(thuoc, giaTri)
}

/**
 * Đổi `<title>`, meta description, canonical, robots cho một trang SEO động.
 *
 * ⚠️ Đây là CSR (đổi bằng JS sau khi trang đã tải) — không thay cho SSR/prerender
 * thật. Máy quét không chạy JS sẽ chỉ thấy thẻ mặc định của `index.html`.
 * Việc dựng prerender cho các route `/thue-xe/:dongXe` thuộc luồng nền tảng
 * (đụng `vite.config.js`), xem CHANGELOG mục luồng 14 ngày sinh file này.
 *
 * @param {{title: string, description: string, path: string, index: boolean}} meta
 *   `index=false` → noindex,follow (đủ tin thì true — NGUONG_INDEX ở TrangDongXe.jsx)
 */
export function useMeta({ title, description, path, index }) {
  useEffect(() => {
    document.title = title
    dat('meta[name="description"]', 'content', description)
    dat('meta[property="og:title"]', 'content', title)
    dat('meta[property="og:description"]', 'content', description)
    dat('link[rel="canonical"]', 'href', `https://thuexenhanh.com${path}`)
    dat('meta[property="og:url"]', 'content', `https://thuexenhanh.com${path}`)
    dat('meta[name="robots"]', 'content', index ? 'index, follow' : 'noindex, follow')

    return () => {
      document.title = MAC_DINH.title
      dat('meta[name="description"]', 'content', MAC_DINH.description)
      dat('meta[name="robots"]', 'content', 'index, follow')
      dat('link[rel="canonical"]', 'href', 'https://thuexenhanh.com/')
    }
  }, [title, description, path, index])
}
