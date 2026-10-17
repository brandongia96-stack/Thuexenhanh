// Chặn tái phạm lỗi 17/10: thanh tab /admin dùng link TƯƠNG ĐỐI trong route
// splat `/admin/*` → React Router 7 nối vào đường dẫn hiện tại
// (/admin/tong-quan/duyet-tin), route con không khớp, `*` đẩy về Tổng quan.
// Mọi link trong thanh tab phải là /admin/<mục>, đứng ở mục nào cũng vậy.

import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { Route, Routes, StaticRouter } from 'react-router-dom'
import TrangQuanTri from './TrangQuanTri'

function hrefTai(url) {
  const html = renderToString(
    <StaticRouter location={url}>
      <Routes>
        <Route path="/admin/*" element={<TrangQuanTri />} />
      </Routes>
    </StaticRouter>,
  )
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
}

describe('thanh tab /admin', () => {
  for (const url of ['/admin/tong-quan', '/admin/duyet-tin', '/admin/khieu-nai', '/admin/cuu-ho']) {
    it(`đứng ở ${url} vẫn trỏ đúng /admin/<mục>`, () => {
      const hrefs = hrefTai(url)
      for (const muc of ['/admin/tong-quan', '/admin/duyet-tin', '/admin/bao-cao', '/admin/nguoi-dung', '/admin/cuu-ho']) {
        expect(hrefs).toContain(muc)
      }
      for (const h of hrefs) expect(h).toMatch(/^\/admin\/[a-z-]+$/)
    })
  }

  it('mục con của tab đang mở cũng là đường dẫn tuyệt đối', () => {
    expect(hrefTai('/admin/bao-cao')).toEqual(
      expect.arrayContaining(['/admin/khieu-nai', '/admin/yeu-cau-go', '/admin/cung-cap-du-lieu', '/admin/xoa-tai-khoan']),
    )
  })
})
