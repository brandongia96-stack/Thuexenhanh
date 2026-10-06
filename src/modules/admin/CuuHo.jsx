// admin/rescue — danh bạ cứu hộ theo tỉnh (bảng rescue_contacts).
// RỖNG là đúng: chỉ nhập số THẬT (contracts/api.md §3d). Xoá là xoá mềm, bắt buộc lý do.

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { getSupabase } from '../../lib/supabase'
import { formatPhone } from '../../lib/format'
import { danhBaCuuHo, luuCuuHo, xoaCuuHo } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

const RONG = { id: null, province_id: '', name: '', phone: '', service: '', note: '', sort_order: 0 }

async function tinhThanh() {
  const sb = await getSupabase()
  const { data, error } = await sb.from('provinces').select('id,name').order('sort_order').order('name')
  if (error) throw error
  return data ?? []
}

function Form({ ban, tinh, xong, huy }) {
  const [f, setF] = useState({ ...RONG, ...ban, province_id: ban.province_id ?? '' })
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const sdtOk = /^0\d{9}$/.test(f.phone.replace(/\s/g, ''))

  async function luu(e) {
    e.preventDefault()
    setDangLam(true); setLoi(null)
    try {
      await luuCuuHo({
        id: f.id, province_id: f.province_id === '' ? null : Number(f.province_id),
        name: f.name, phone: f.phone, service: f.service, note: f.note, sort_order: Number(f.sort_order) || 0,
      })
      xong()
    } catch (er) { setLoi(thongDiepLoi(er)) } finally { setDangLam(false) }
  }

  return (
    <form className="card ad-item" onSubmit={luu}>
      <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto' }} value={f.province_id} onChange={set('province_id')} aria-label="Tỉnh">
          <option value="">Toàn quốc</option>
          {tinh.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input className="input" style={{ flex: 1, minWidth: 160 }} placeholder="Tên (ví dụ: Cứu hộ 24/7 Minh Khang)" value={f.name} onChange={set('name')} aria-label="Tên" />
        <input className="input" style={{ width: 160 }} inputMode="tel" placeholder="Số điện thoại" value={f.phone} onChange={set('phone')} aria-label="Số điện thoại" />
      </div>
      <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <input className="input" style={{ width: 180 }} placeholder="Dịch vụ (cứu hộ, sửa xe, lốp...)" value={f.service ?? ''} onChange={set('service')} aria-label="Dịch vụ" />
        <input className="input" style={{ flex: 1, minWidth: 160 }} placeholder="Ghi chú (giờ làm việc...)" value={f.note ?? ''} onChange={set('note')} aria-label="Ghi chú" />
        <input className="input" style={{ width: 90 }} inputMode="numeric" placeholder="Thứ tự" value={f.sort_order} onChange={set('sort_order')} aria-label="Thứ tự" />
      </div>
      {f.phone && !sdtOk && <div className="t-small" style={{ color: 'var(--m-red)' }}>Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.</div>}
      {loi && <div className="ad-loi" role="alert">{loi}</div>}
      <div className="ad-hanh-dong">
        <button className="btn btn-primary" disabled={dangLam || f.name.trim().length < 2 || !sdtOk}>Lưu</button>
        <button type="button" className="btn btn-ghost" onClick={huy}>Huỷ</button>
      </div>
    </form>
  )
}

function XoaMem({ dong, xong }) {
  const [mo, setMo] = useState(false)
  const [lyDo, setLyDo] = useState('')
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState(null)
  if (!mo) return <button className="btn btn-sm btn-ghost" onClick={() => setMo(true)} aria-label={`Xoá ${dong.name}`}><Trash2 size={14} strokeWidth={2} /></button>
  return (
    <div className="stack" style={{ gap: 'var(--sp-2)' }}>
      <input className="input" placeholder="Lý do xoá (bắt buộc)" value={lyDo} onChange={(e) => setLyDo(e.target.value)} aria-label="Lý do xoá" />
      {loi && <div className="ad-loi" role="alert">{loi}</div>}
      <div className="ad-hanh-dong">
        <button className="btn btn-sm btn-danger" disabled={dangLam || lyDo.trim().length < 5}
          onClick={async () => {
            setDangLam(true); setLoi(null)
            try { await xoaCuuHo(dong.id, lyDo.trim()); xong() } catch (e) { setLoi(thongDiepLoi(e)); setDangLam(false) }
          }}>Xác nhận xoá</button>
        <button className="btn btn-sm btn-ghost" onClick={() => setMo(false)}>Thôi</button>
      </div>
    </div>
  )
}

export default function CuuHo() {
  const ds = useTai(() => danhBaCuuHo())
  const tinh = useTai(() => tinhThanh())
  const [sua, setSua] = useState(null) // null | RONG | dòng đang sửa
  const tenTinh = Object.fromEntries((tinh.data ?? []).map((t) => [t.id, t.name]))

  if (ds.dangTai && !ds.data) return <Skeleton height={160} />
  if (ds.loi) return <div className="ad-loi">Không tải được danh bạ: {thongDiepLoi(ds.loi)}</div>

  const xong = () => { setSua(null); ds.taiLai() }

  return (
    <div className="stack" style={{ gap: 'var(--sp-4)' }}>
      {sua ? (
        <Form key={sua.id ?? 'moi'} ban={sua} tinh={tinh.data ?? []} xong={xong} huy={() => setSua(null)} />
      ) : (
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => setSua(RONG)}>Thêm số cứu hộ</button>
      )}

      {ds.data.length === 0 ? (
        <EmptyState title="Chưa có số cứu hộ nào" hint="Chỉ nhập số thật đã xác nhận được. Danh bạ trống thì trang xe ẩn khối này." />
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="ad-bang">
            <thead><tr><th>Tỉnh</th><th>Tên</th><th>Số</th><th>Dịch vụ</th><th /></tr></thead>
            <tbody>
              {ds.data.map((r) => (
                <tr key={r.id}>
                  <td>{r.province_id ? (tenTinh[r.province_id] ?? '—') : 'Toàn quốc'}</td>
                  <td>{r.name}{r.note && <div className="t-small">{r.note}</div>}</td>
                  <td>{formatPhone(r.phone)}</td>
                  <td>{r.service ?? '—'}</td>
                  <td>
                    <div className="row" style={{ gap: 'var(--sp-2)' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => setSua(r)} aria-label={`Sửa ${r.name}`}><Pencil size={14} strokeWidth={2} /></button>
                      <XoaMem dong={r} xong={xong} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
