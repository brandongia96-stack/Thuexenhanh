// Trang thử nghiệm riêng của luồng 06 và chế độ token-demo.
// Cho phép demo và kiểm tra tận mắt toàn bộ thao tác liên quan đến token trong app:
// nạp token, trừ phí hiển thị, gia hạn, hoàn token, phân trang sổ giao dịch.
//
// Mở: `npm run dev` rồi vào /thu-luong-06.html hoặc /chu-xe/vi?token-demo=1

import React, { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { Sparkles, RotateCcw, Plus, ReceiptText } from 'lucide-react'
import '../../styles.css'
import './billing.css'

import HopNapToken from './topup/HopNapToken'
import HopTraPhi from './charging/HopTraPhi'
import { NHAN_GIAO_DICH, quyDoiVnd } from './goiNap'
import { formatVnd, formatDateTime } from '../../lib/format'
import {
  soDuVi,
  soGiaoDich,
  batTokenDemo,
  demoReset,
  demoDieuChinhVi,
  SU_KIEN_VI_THAY_DOI,
} from './billingApi'

const TIN_THU = {
  id: '11111111-1111-4111-8111-111111111111',
  brand_text: 'Toyota',
  model_text: 'Innova 2022',
  published_at: null,          // chưa từng đăng -> hộp hiện "Trả phí hiển thị tin"
  expires_at: null,
}
const TIN_GIA_HAN = {
  ...TIN_THU,
  id: '22222222-2222-4222-8222-222222222222',
  brand_text: 'Kia',
  model_text: 'Morning 2021',
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
  const [vi, setVi] = useState(null)
  const [so, setSo] = useState([])

  // Luôn kích hoạt demo mode trên trang thử này
  useEffect(() => {
    batTokenDemo()
  }, [])

  const tai = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([soDuVi('demo-user'), soGiaoDich('demo-user')])
      setVi(b)
      setSo(s.items)
    } catch (e) {
      console.error('Lỗi tải ví demo:', e)
    }
  }, [])

  useEffect(() => {
    tai()
    const handleUpdate = () => tai()
    window.addEventListener(SU_KIEN_VI_THAY_DOI, handleUpdate)
    return () => window.removeEventListener(SU_KIEN_VI_THAY_DOI, handleUpdate)
  }, [tai])

  const soDu = vi?.so_du ?? 0
  const daNap = vi?.token_da_nap ?? 0
  const daTieu = vi?.token_da_tieu ?? 0

  return (
    <div className="page stack">
      <div className="hop-demo stack" style={{ gap: 'var(--sp-2)' }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <Sparkles size={18} strokeWidth={2} />
            <h1 className="t-h2" style={{ margin: 0 }}>Thử nghiệm tất cả thao tác Token (token-demo)</h1>
          </div>
          <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                await demoDieuChinhVi({ kind: 'hoan', tokens: 10, reason: 'Hoàn token khiếu nại (demo)' })
                tai()
              }}
            >
              +10 hoàn token
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                demoReset()
                tai()
              }}
            >
              <RotateCcw size={14} /> Đặt lại ví gốc (50 token)
            </button>
          </div>
        </div>
        <p className="t-body" style={{ margin: 0 }}>
          Trang thử nghiệm trực quan kết nối với <code>tokenDemoStore</code>. Mọi thao tác nạp tiền, trừ phí hiển thị, gia hạn
          và biến động số dư được lưu vào <code>localStorage</code> (key <code>thuexe_token_demo_state</code>) y như thật.
        </p>
      </div>

      <div className="vi-tomtat">
        <div className="vi-o vi-o-chinh">
          <span className="vi-nhan">Số dư</span>
          <span className="vi-so">{soDu} token</span>
          <span className="vi-phu">tương đương {formatVnd(quyDoiVnd(soDu))}</span>
        </div>
        <div className="vi-o">
          <span className="vi-nhan">Đã nạp</span>
          <span className="vi-so-phu">{daNap} token</span>
          <span className="vi-phu">tổng từ trước tới nay</span>
        </div>
        <div className="vi-o">
          <span className="vi-nhan">Đã dùng</span>
          <span className="vi-so-phu">{daTieu} token</span>
          <span className="vi-phu">đổi thành tháng hiển thị</span>
        </div>
      </div>

      <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
        <button className="btn btn-primary" onClick={() => setMo('nap')}>
          <Plus size={16} strokeWidth={2} /> Màn nạp token (chuyển khoản + tiền về)
        </button>
        <button className="btn btn-soft" onClick={() => setMo('traphi')}>
          Trả phí tin mới (Toyota Innova · 1-12 tháng)
        </button>
        <button className="btn btn-soft" onClick={() => setMo('giahan')}>
          Gia hạn tin còn hạn (Kia Morning · nối tiếp ngày)
        </button>
        <button className="btn btn-ghost" onClick={() => setMo('thieu')}>
          Mô phỏng ví thiếu token (kiểm tra chặn)
        </button>
      </div>

      <div className="card card-pad stack" style={{ gap: 0 }}>
        <div className="row" style={{ justifyContent: 'space-between', paddingBottom: 'var(--sp-3)' }}>
          <h2 className="t-h3">Sổ giao dịch đối soát ({so.length} dòng)</h2>
        </div>
        {so.length === 0 ? (
          <div className="t-small">Chưa có giao dịch nào.</div>
        ) : (
          so.map((d) => <DongSo key={d.id} d={d} />)
        )}
      </div>

      <p className="disclaimer">
        Token chỉ dùng để trả phí hiển thị tin đăng. Thuexenhanh không thu hoa hồng,
        không giữ tiền thuê xe — mọi giao dịch thuê xe do hai bên tự thoả thuận.
      </p>

      {mo === 'nap' && (
        <HopNapToken demo onDong={() => setMo(null)} onXong={tai} />
      )}
      {mo === 'traphi' && (
        <HopTraPhi listing={TIN_THU} soDu={soDu} onDong={() => setMo(null)} onXong={tai} />
      )}
      {mo === 'giahan' && (
        <HopTraPhi listing={TIN_GIA_HAN} soDu={soDu} onDong={() => setMo(null)} onXong={tai} />
      )}
      {mo === 'thieu' && (
        <HopTraPhi listing={TIN_THU} soDu={2} onDong={() => setMo(null)} onXong={tai} />
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

