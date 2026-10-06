import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Phone } from 'lucide-react'

import { PROVINCES } from '../../../data/provinces'
import { trySupabase } from '../../../lib/supabase'
import { idDiaGioi } from '../../discovery/search/idDiaGioi'
import { useMeta } from '../seo-xe/useMeta'
import '../TrangChu.css'

// Cột danh bạ — liệt kê rõ, cấm select * (HIEU-NANG.md mục 2.1).
const COT = 'id,name,phone,service,note,sort_order'

/**
 * Cứu hộ 24/7: chọn tỉnh → danh sách số cứu hộ thật kèm nút Gọi.
 *
 * Bảng `rescue_contacts` rỗng (hoặc chưa có) → trang ẩn hẳn, chuyển về trang
 * chủ. Menu cũng phải ẩn theo cùng điều kiện (việc của Header, luồng nền tảng).
 */
export default function TrangCuuHo() {
  const [trang, setTrang] = useState('dang_tai') // dang_tai | co_du_lieu | an
  const [tinh, setTinh] = useState('')
  const [ds, setDs] = useState([])
  const [dangTaiDs, setDangTaiDs] = useState(false)

  useMeta({
    title: 'Cứu hộ 24/7 — Thuexenhanh',
    description: 'Danh bạ cứu hộ xe theo tỉnh thành. Danh bạ tổng hợp công khai.',
    path: '/cuu-ho',
    index: trang === 'co_du_lieu',
  })

  // Kiểm có bất kỳ số nào không — nếu không thì ẩn cả trang.
  useEffect(() => {
    let huy = false
    ;(async () => {
      const sb = await trySupabase()
      if (!sb) { if (!huy) setTrang('an'); return }
      const { data, error } = await sb
        .from('rescue_contacts')
        .select('id')
        .is('deleted_at', null)
        .limit(1)
      if (huy) return
      setTrang(!error && data?.length ? 'co_du_lieu' : 'an')
    })()
    return () => { huy = true }
  }, [])

  // Đổi tỉnh → nạp danh bạ của tỉnh đó.
  useEffect(() => {
    if (!tinh) { setDs([]); return }
    let huy = false
    setDangTaiDs(true)
    ;(async () => {
      const sb = await trySupabase()
      if (!sb) { if (!huy) { setDs([]); setDangTaiDs(false) } ; return }
      const { province_id } = await idDiaGioi(tinh)
      if (province_id == null) { if (!huy) { setDs([]); setDangTaiDs(false) }; return }
      const { data, error } = await sb
        .from('rescue_contacts')
        .select(COT)
        .eq('province_id', province_id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
      if (huy) return
      setDs(error ? [] : (data ?? []))
      setDangTaiDs(false)
    })()
    return () => { huy = true }
  }, [tinh])

  if (trang === 'an') return <Navigate to="/" replace />
  if (trang === 'dang_tai') return null

  return (
    <div className="page stack tc">
      <div>
        <span className="tc-nhan">Hỗ trợ trên đường</span>
        <h1 className="tc-h1" style={{ fontSize: 'clamp(26px, 4vw, 38px)' }}>Cứu hộ 24/7</h1>
      </div>

      <label className="field" style={{ maxWidth: 360 }}>
        <span className="field-label">Chọn tỉnh / thành phố</span>
        <select className="select" value={tinh} onChange={(e) => setTinh(e.target.value)}>
          <option value="">— Chọn tỉnh —</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      {tinh && !dangTaiDs && ds.length === 0 && (
        <p className="t-body">Chưa có số cứu hộ cho {tinh}.</p>
      )}

      {ds.length > 0 && (
        <div className="grid-cards">
          {ds.map((x) => (
            <div key={x.id} className="card card-pad stack" style={{ gap: 'var(--sp-2)' }}>
              <div className="t-h3">{x.name}</div>
              {x.service && <p className="t-small">{x.service}</p>}
              {x.note && <p className="t-small">{x.note}</p>}
              <a href={`tel:${String(x.phone).replace(/[^+\d]/g, '')}`} className="btn btn-primary">
                <Phone size={18} strokeWidth={1.8} /> Gọi {x.phone}
              </a>
            </div>
          ))}
        </div>
      )}

      <p className="t-small" style={{ fontStyle: 'italic' }}>
        Danh bạ tổng hợp công khai. Thuê Xe Nhanh không thu phí và không chịu trách nhiệm về giá/chất lượng dịch vụ.
      </p>
    </div>
  )
}
