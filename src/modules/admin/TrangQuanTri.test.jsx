// Chặn tái phạm lỗi 17/10: thanh tab /admin dùng link TƯƠNG ĐỐI trong route
// splat `/admin/*` → React Router 7 nối vào đường dẫn hiện tại
// (/admin/tong-quan/duyet-tin), route con không khớp, `*` đẩy về Tổng quan.
// Mọi link trong thanh tab phải là /admin/<mục>, đứng ở mục nào cũng vậy.

import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { Route, Routes, StaticRouter } from 'react-router-dom'
import TrangQuanTri from './TrangQuanTri'

function htmlTai(url) {
  return renderToString(
    <StaticRouter location={url}>
      <Routes>
        <Route path="/admin/*" element={<TrangQuanTri />} />
      </Routes>
    </StaticRouter>,
  )
}

function hrefTai(url) {
  return [...htmlTai(url).matchAll(/href="([^"]+)"/g)].map((m) => m[1])
}

// href của mọi thẻ <a> đang được tô "active".
function activeTai(url) {
  return (htmlTai(url).match(/<a [^>]*>/g) ?? [])
    .filter((a) => /class="[^"]*\bactive\b/.test(a))
    .map((a) => a.match(/href="([^"]+)"/)[1])
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

  // Mỗi mục con: tab chính đúng phân hệ + tab con chính nó được tô "active".
  const MUC = {
    '/admin/duyet-tin': '/admin/duyet-tin', '/admin/duyet-tim-xe': '/admin/duyet-tin',
    '/admin/duyet-giay-to': '/admin/duyet-tin', '/admin/gia-san': '/admin/duyet-tin',
    '/admin/gia-nhien-lieu': '/admin/duyet-tin',
    '/admin/bao-cao': '/admin/bao-cao', '/admin/khieu-nai': '/admin/bao-cao',
    '/admin/yeu-cau-go': '/admin/bao-cao', '/admin/cung-cap-du-lieu': '/admin/bao-cao',
    '/admin/xoa-tai-khoan': '/admin/bao-cao',
    '/admin/nguoi-dung': '/admin/nguoi-dung', '/admin/doanh-thu': '/admin/nguoi-dung',
    '/admin/cuu-ho': '/admin/cuu-ho', '/admin/suc-khoe': '/admin/cuu-ho',
  }
  for (const [url, tabChinh] of Object.entries(MUC)) {
    it(`${url} tô đúng tab ${tabChinh}`, () => {
      const active = activeTai(url)
      expect(active).toContain(tabChinh)
      expect(active).toContain(url)
    })
  }

  it('nút Thoát chỉ hiện khi cổng đăng nhập truyền onThoat', () => {
    expect(htmlTai('/admin/tong-quan')).not.toContain('Thoát')
    const html = renderToString(
      <StaticRouter location="/admin/tong-quan">
        <Routes>
          <Route path="/admin/*" element={
            <TrangQuanTri onThoat={() => {}} hetHanLuc={new Date('2026-10-18T08:30:00+07:00')} />
          } />
        </Routes>
      </StaticRouter>,
    )
    expect(html).toContain('Thoát')
    expect(html).toContain('Đổi mật khẩu')
    expect(html).toContain('Phiên hết hạn lúc')
  })
})
