import { Link, useLocation } from 'react-router-dom'
import { PHAP_NHAN, EMAIL_HO_TRO, coPhapNhan, coKenhLienHe } from './phienBan'

// Danh mục văn bản — đổi ở một chỗ, mọi trang đổi theo.
const VAN_BAN_LINKS = [
  ['/quy-che', 'Quy chế hoạt động'],
  ['/dieu-khoan', 'Điều khoản sử dụng'],
  ['/bao-mat', 'Bảo vệ dữ liệu cá nhân'],
  ['/hoan-token', 'Hoàn token'],
  ['/khieu-nai', 'Giải quyết khiếu nại'],
  ['/thue', 'Thông tin thuế'],
  ['/tro-giup', 'Câu hỏi thường gặp'],
]

/**
 * Khung chung cho văn bản pháp lý: tiêu đề, phiên bản, ngày hiệu lực,
 * danh mục văn bản, và CẢNH BÁO BẢN NHÁP.
 *
 * Có `van` = đây là văn bản pháp lý có phiên bản → tự hiện dòng cảnh báo
 * "bản nháp, cần luật sư duyệt". Trang thường (Giới thiệu, FAQ, Liên hệ)
 * không truyền `van` nên không hiện.
 */
export default function LegalLayout({ title, van, moTa, children }) {
  // Dùng useLocation, không dùng window.location: trang này được prerender
  // ở bước build (scripts/prerender-seo.mjs) nên không chắc có `window`.
  const { pathname } = useLocation()
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <article className="card card-pad stack">
        <header>
          <h1 className="t-h1">{title}</h1>
          {van && (
            <p className="t-small" style={{ marginTop: 4 }}>
              Phiên bản {van.phienBan} · Có hiệu lực từ {van.hieuLuc}
            </p>
          )}
          {moTa && <p className="t-body" style={{ marginTop: 'var(--sp-2)' }}>{moTa}</p>}
        </header>

        {children}

        {van && (
          <div className="disclaimer">
            <b>Đây là bản nháp.</b> Văn bản này do chúng tôi tự soạn và <b>chưa được người có
            chuyên môn pháp lý thẩm định</b>. Phải có luật sư đọc lại trước khi áp dụng chính
            thức hoặc thu tiền của người dùng.
          </div>
        )}

        <nav className="stack" style={{ gap: 'var(--sp-1)', borderTop: '1px solid var(--m-border)', paddingTop: 'var(--sp-3)' }}>
          <span className="t-small"><b>Các văn bản khác</b></span>
          <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
            {VAN_BAN_LINKS.filter(([to]) => to !== pathname).map(([to, ten]) => (
              <Link key={to} to={to} className="t-small">{ten}</Link>
            ))}
          </div>
        </nav>
      </article>
    </div>
  )
}

export function Muc({ n, title, children }) {
  return (
    <section className="stack">
      <h2 className="t-h3">{n ? `${n}. ` : ''}{title}</h2>
      {children}
    </section>
  )
}

export function DanhSach({ items }) {
  return (
    <ul className="stack" style={{ paddingLeft: '1.2em' }}>
      {items.map((t) => <li key={t} className="t-body">{t}</li>)}
    </ul>
  )
}

/** Danh sách "nhãn — nội dung", dùng cho thời hạn lưu trữ, quyền của người dùng. */
export function DanhSachNhan({ items }) {
  return (
    <ul className="stack" style={{ paddingLeft: '1.2em' }}>
      {items.map(([nhan, noiDung]) => (
        <li key={nhan} className="t-body"><b>{nhan}:</b> {noiDung}</li>
      ))}
    </ul>
  )
}

/**
 * Khối thông tin pháp nhân. Chưa có thông tin thật → ẩn cả khối và nói thẳng
 * là đang hoàn tất, KHÔNG render ô trống (CLAUDE.md §1.3 graceful degradation).
 */
export function KhoiPhapNhan() {
  if (!coPhapNhan()) {
    return (
      <p className="t-body">
        Thông tin pháp nhân vận hành nền tảng đang được hoàn tất và sẽ được công bố tại đây.
        Trong thời gian này nền tảng chưa mở cho người dùng thật.
      </p>
    )
  }
  const dong = [
    ['Đơn vị vận hành', PHAP_NHAN.ten],
    ['Mã số', PHAP_NHAN.maSo],
    ['Địa chỉ', PHAP_NHAN.diaChi],
    ['Người đại diện', PHAP_NHAN.nguoiDaiDien],
    ['Điện thoại', PHAP_NHAN.dienThoai],
  ].filter(([, v]) => v && v.trim() !== '')
  return <DanhSachNhan items={dong} />
}

/** Kênh gửi yêu cầu. Chưa có email thật thì chỉ nói về nút báo cáo tin. */
export function KhoiLienHe() {
  if (!coKenhLienHe()) {
    return (
      <p className="t-body">
        Kênh tiếp nhận bằng email đang được hoàn tất. Hiện bạn gửi phản ánh về một tin cụ thể
        bằng nút báo cáo ngay trên trang xe đó.
      </p>
    )
  }
  return (
    <p className="t-body">
      Gửi tới <a href={`mailto:${EMAIL_HO_TRO}`}>{EMAIL_HO_TRO}</a>, hoặc dùng nút báo cáo ngay
      trên trang xe nếu bạn phản ánh về một tin cụ thể.
    </p>
  )
}
