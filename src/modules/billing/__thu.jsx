// TẠM — trang thử riêng của luồng 06, để nhìn tận mắt màn nạp token và màn trả
// phí hiển thị mà không phải đăng nhập, không phải mở tài khoản ngân hàng.
//
// Theo đúng quy ước có sẵn của repo (`discovery/__thu.jsx` + `thu-luong-05.html`).
// Dữ liệu dưới đây là DỮ LIỆU THỬ, chỉ sống trong file này — `App.jsx` KHÔNG
// import file này, nên không có đường nào lọt vào app thật.
//
// Mở: `npm run dev` rồi vào /thu-luong-06.html

import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import '../../styles.css'
import './billing.css'

import HopNapToken from './topup/HopNapToken'
import HopTraPhi from './charging/HopTraPhi'
import { NHAN_GIAO_DICH, quyDoiVnd } from './goiNap'
import { formatVnd, formatDateTime } from '../../lib/format'

// Sổ giao dịch thử. Số dư sau được tính CỘNG DỒN như view `wallet_ledger` làm
// phía Postgres, để nhìn ra ngay nếu bố cục cột bị lệch.
const SO_THU = [
  { kind: 'nap', amount: 50, note: 'Nạp 50 token · mã TXNAB2CD34', created_at: '2026-10-14T09:12:00Z' },
  { kind: 'tieu', amount: -10, note: 'Hiển thị tin Toyota Innova · 1 tháng', created_at: '2026-10-14T09:20:00Z' },
  { kind: 'tieu', amount: -30, note: 'Gia hạn tin Kia Morning · 3 tháng', created_at: '2026-10-15T14:02:00Z' },
  { kind: 'hoan', amount: 10, note: 'Hoàn token do tin bị ẩn sai', created_at: '2026-10-16T08:30:00Z' },
].reduce((acc, d, i) => {
  const truoc = i === 0 ? 0 : acc[i - 1].so_du_sau
  acc.push({ ...d, id: 'thu-' + i, so_du_sau: truoc + d.amount })
  return acc
}, [])

const SO_DU = SO_THU[SO_THU.length - 1].so_du_sau

const TIN_THU = {
  id: '11111111-1111-4111-8111-111111111111',
  brand_text: 'Toyota',
  model_text: 'Innova',
  published_at: null,          // chưa từng đăng -> hộp hiện "Trả phí hiển thị tin"
  expires_at: null,
}
const TIN_GIA_HAN = {
  ...TIN_THU,
  id: '22222222-2222-4222-8222-222222222222',
  brand_text: 'Kia',
  model_text: 'Morning',
  published_at: '2026-09-20T00:00:00Z',
  expires_at: '2026-10-28T00:00:00Z',   // còn hạn -> hộp phải NỐI TIẾP, không cắt ngắn
}

function DongSo({ d }) {
  const nhan = NHAN_GIAO_DICH[d.kind] ?? { label: d.kind }
  const vao = d.amount > 0
  return (
    <div className="so-dong">
      <div>
        <div className="so-mo-ta">{d.note || nhan.label}</div>
        <div className="so-thoi-gian">{formatDateTime(d.created_at)}</div>
      </div>
      <div>
        <div className={'so-so ' + (vao ? 'so-vao' : 'so-ra')}>
          {vao ? '+' : '−'}{Math.abs(d.amount)} token
        </div>
        <div className="so-du-sau">còn {d.so_du_sau}</div>
      </div>
    </div>
  )
}

function Thu() {
  const [mo, setMo] = useState(null)   // nap | traphi | giahan | thieu

  return (
    <div className="page stack">
      <div>
        <h1 className="t-h1">Thử ví token (luồng 06)</h1>
        <p className="t-body">
          Toàn bộ số liệu trên trang này là <b>dữ liệu thử</b> nằm trong{' '}
          <code>src/modules/billing/__thu.jsx</code>. Không gọi Supabase, không
          cộng trừ token của ai.
        </p>
      </div>

      <div className="vi-tomtat">
        <div className="vi-o vi-o-chinh">
          <span className="vi-nhan">Số dư</span>
          <span className="vi-so">{SO_DU} token</span>
          <span className="vi-phu">tương đương {formatVnd(quyDoiVnd(SO_DU))}</span>
        </div>
        <div className="vi-o">
          <span className="vi-nhan">Đã nạp</span>
          <span className="vi-so-phu">60 token</span>
          <span className="vi-phu">tổng từ trước tới nay</span>
        </div>
        <div className="vi-o">
          <span className="vi-nhan">Đã dùng</span>
          <span className="vi-so-phu">40 token</span>
          <span className="vi-phu">đổi thành tháng hiển thị</span>
        </div>
      </div>

      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => setMo('nap')}>Màn nạp token (xem thử)</button>
        <button className="btn btn-ghost" onClick={() => setMo('traphi')}>Trả phí tin mới · ví đủ token</button>
        <button className="btn btn-ghost" onClick={() => setMo('giahan')}>Gia hạn tin còn hạn</button>
        <button className="btn btn-ghost" onClick={() => setMo('thieu')}>Ví thiếu token</button>
      </div>

      <div className="card card-pad stack" style={{ gap: 0 }}>
        <h2 className="t-h3" style={{ paddingBottom: 'var(--sp-3)' }}>Sổ giao dịch</h2>
        {SO_THU.slice().reverse().map((d) => <DongSo key={d.id} d={d} />)}
      </div>

      <p className="disclaimer">
        Token chỉ dùng để trả phí hiển thị tin đăng. Thuexenhanh không thu hoa hồng,
        không giữ tiền thuê xe — mọi giao dịch thuê xe do hai bên tự thoả thuận.
      </p>

      {mo === 'nap' && <HopNapToken demo onDong={() => setMo(null)} />}
      {mo === 'traphi' && (
        <HopTraPhi listing={TIN_THU} soDu={SO_DU} onDong={() => setMo(null)} />
      )}
      {mo === 'giahan' && (
        <HopTraPhi listing={TIN_GIA_HAN} soDu={SO_DU} onDong={() => setMo(null)} />
      )}
      {mo === 'thieu' && (
        <HopTraPhi listing={TIN_THU} soDu={3} onDong={() => setMo(null)} />
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MemoryRouter>
      <Thu />
    </MemoryRouter>
  </React.StrictMode>,
)
