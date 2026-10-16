import { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'

import { PROVINCES } from '../../../data/provinces'
import { DANH_BA_CUU_HO } from '../../../data/danhBaCuuHo'
import { trySupabase } from '../../../lib/supabase'
import { idDiaGioi } from '../../discovery/search/idDiaGioi'
import { formatDate } from '../../../lib/format'
import BaoSoSaiCuuHo from '../../../components/BaoSoSaiCuuHo'
import { useMeta } from '../seo-xe/useMeta'
import '../TrangChu.css'

// Cột danh bạ — liệt kê rõ, cấm select * (HIEU-NANG.md mục 2.1).
// `updated_at`: để tính dòng "Cập nhật: dd/mm/yyyy" từ dữ liệu THẬT, không ghi tay.
const COT = 'id,name,phone,service,note,sort_order,updated_at'

/**
 * Cứu hộ 24/7: luôn hiện 3 đầu số khẩn cấp quốc gia (113/114/115 — đọc từ
 * `data/danhBaCuuHo.js`, KHÔNG phụ thuộc mạng), cộng thêm chọn tỉnh → danh
 * bạ cứu hộ tư nhân admin đã nhập ở `rescue_contacts` (có thể rỗng, có thể
 * lỗi mạng — khối đó tự ẩn, nhưng trang KHÔNG ẩn hẳn vì luôn có 113/114/115
 * là thông tin an toàn cần hiện bất kể CSDL thế nào).
 */
export default function TrangCuuHo() {
  const [tinh, setTinh] = useState('')
  const [ds, setDs] = useState([])
  const [dangTaiDs, setDangTaiDs] = useState(false)

  useMeta({
    title: 'Cứu hộ 24/7 — Thuexenhanh',
    description: 'Số khẩn cấp quốc gia 113/114/115 và danh bạ cứu hộ xe theo tỉnh thành.',
    path: '/cuu-ho',
    index: true,
  })

  // Đổi tỉnh → nạp danh bạ tư nhân (đã admin xác nhận) của tỉnh đó.
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

  // Mới nhất trong các số ĐANG HIỆN — không phải của cả bảng, để đúng nghĩa
  // "dữ liệu khách đang xem được cập nhật khi nào".
  const capNhatGanNhat = ds.length
    ? ds.reduce((max, x) => (x.updated_at > max ? x.updated_at : max), ds[0].updated_at)
    : null

  return (
    <div className="page stack tc">
      <div>
        <span className="tc-nhan">Hỗ trợ trên đường</span>
        <h1 className="tc-h1" style={{ fontSize: 'clamp(26px, 4vw, 38px)' }}>Cứu hộ 24/7</h1>
      </div>

      {/* Số khẩn cấp quốc gia — LUÔN hiện, không phụ thuộc Supabase. */}
      <div className="stack">
        <h2 className="tc-h2">Số khẩn cấp quốc gia</h2>
        <div className="grid-cards">
          {DANH_BA_CUU_HO.map((x) => (
            <div key={x.id} className="card card-pad stack" style={{ gap: 'var(--sp-2)' }}>
              <div className="t-h3">{x.ten}</div>
              <p className="t-small">{x.dichVuText}</p>
              <a href={`tel:${x.sdt}`} className="btn btn-primary">
                <Phone size={18} strokeWidth={1.8} /> Gọi {x.sdt}
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="stack">
        <h2 className="tc-h2">Cứu hộ theo tỉnh</h2>
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
          <>
            <p className="t-small">Cập nhật: {formatDate(capNhatGanNhat)}</p>
            <div className="grid-cards">
              {ds.map((x) => (
                <div key={x.id} className="card card-pad stack" style={{ gap: 'var(--sp-2)' }}>
                  <div className="t-h3">{x.name}</div>
                  {x.service && <p className="t-small">{x.service}</p>}
                  {x.note && <p className="t-small">{x.note}</p>}
                  {/* KHÔNG dùng `lib/phone.js` ở đây: nó chỉ nhận số di động VN,
                      còn danh bạ cứu hộ có cả tổng đài/hotline (vd. 1900...,
                      số bàn 028...) — hợp lệ bị `isValidPhone` từ chối thì mất
                      nút Gọi. Chỉ lọc ký tự. */}
                  <a href={`tel:${String(x.phone).replace(/[^+\d]/g, '')}`} className="btn btn-primary">
                    <Phone size={18} strokeWidth={1.8} /> Gọi {x.phone}
                  </a>
                  <BaoSoSaiCuuHo contact={{ id: x.id, ten: x.name, sdt: x.phone }} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="t-small" style={{ fontStyle: 'italic' }}>
        Danh bạ tổng hợp công khai. Thuê Xe Nhanh không thu phí và không chịu trách nhiệm về giá/chất lượng dịch vụ.
      </p>
    </div>
  )
}
