import { Link } from 'react-router-dom'

/** Khung chung cho văn bản pháp lý: tiêu đề, phiên bản, ngày hiệu lực. */
export default function LegalLayout({ title, van, children }) {
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
        </header>
        {children}
        <p className="t-small">
          <Link to="/dieu-khoan">Điều khoản</Link> · <Link to="/bao-mat">Bảo mật</Link> ·{' '}
          <Link to="/hoan-token">Hoàn token</Link> · <Link to="/tro-giup">Câu hỏi thường gặp</Link>
        </p>
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
