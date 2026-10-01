import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

import { trySupabase } from '../../../lib/supabase'
import { taiTenDiaGioi } from '../../discovery/diaGioi'
import { idDiaGioi } from '../../discovery/search/idDiaGioi'
import { duongDanTimKiem } from '../../discovery/filter/loc'
import TheXe from '../../discovery/the-xe/TheXe'
import { dongXeTuSlug, tinhTuSlug, duongDanDongXe } from './slugXe'
import { useMeta } from './useMeta'
import { NGUONG_INDEX, tenDongXe, tieuDeTrang, titleTrang, moTaTrang, cauMoTa } from './noiDungSeo'
import { formatVndShort } from '../../../lib/format'
import '../TrangChu.css'

// Cột thẻ xe — khớp view `listing_card`, giống `TrangChu.jsx`/`searchApi.js`.
const COT_THE =
  'id,status,brand_text,model_text,year,seats,transmission,fuel,price_per_day,' +
  'province_id,district_id,is_verified,published_at,owner_id,' +
  'ev_range_km,charge_policy,' +
  'cover_thumb,cover_blur,cover_width,cover_height'

// NGUONG_INDEX nay o `noiDungSeo.js` — dùng chung với `scripts/prerender-seo.mjs`
// để trang tĩnh sinh lúc build và trang động lúc chạy không lệch tiêu chí.
const GIOI_HAN = 20

/**
 * Trang SEO theo dòng xe (× tỉnh tuỳ chọn): `/thue-xe/:dongXe` hoặc
 * `/thue-xe/:dongXe/:tinh`. Mọi số liệu tính từ `listing_card` thật — không
 * đoạn văn PR tự nghĩ ra (CLAUDE.md 1.2).
 *
 * ⚠️ CSR, chưa prerender — xem cảnh báo ở `useMeta.js`.
 */
export default function TrangDongXe() {
  const { dongXe: slugDongXe, tinh: slugTinh } = useParams()
  const dongXe = dongXeTuSlug(slugDongXe)
  const tenTinh = slugTinh ? tinhTuSlug(slugTinh) : null

  // Slug lạ (không khớp 173 dòng xe tĩnh, hoặc có /:tinh nhưng không khớp 39
  // tỉnh) — không phải lỗi, chỉ là đường dẫn không tồn tại. Hiện trang tử tế,
  // không đoán bừa.
  const khongTonTai = !dongXe || (slugTinh && !tenTinh)

  if (khongTonTai) return <KhongTonTai />
  return <NoiDung hang={dongXe.hang} dong={dongXe.dong} tenTinh={tenTinh} />
}

function KhongTonTai() {
  useMeta({
    title: 'Không tìm thấy trang — Thuexenhanh',
    description: 'Đường dẫn này không tồn tại.',
    path: '/thue-xe',
    index: false,
  })
  return (
    <div className="page stack">
      <h1 className="t-h1">Không tìm thấy trang này</h1>
      <p className="t-body">Có thể đường dẫn đã đổi hoặc gõ nhầm.</p>
      <Link to="/thue-xe" className="btn btn-primary">Tìm xe</Link>
    </div>
  )
}

function NoiDung({ hang, dong, tenTinh }) {
  const [trang, setTrang] = useState('dang_tai') // 'dang_tai' | 'xong'
  const [ds, setDs] = useState([])
  const [bang, setBang] = useState({ tinh: {}, quan: {} })

  const ten = tenDongXe(hang, dong)

  useEffect(() => {
    let huy = false
    setTrang('dang_tai')
    ;(async () => {
      const sb = await trySupabase()
      if (!sb) { if (!huy) setTrang('xong'); return }

      let q = sb
        .from('listing_card')
        .select(COT_THE)
        .eq('status', 'dang_hien_thi')
        .eq('brand_text', hang)
        .eq('model_text', dong)
        .order('published_at', { ascending: false })
        .limit(GIOI_HAN)

      if (tenTinh) {
        const { province_id } = await idDiaGioi(tenTinh)
        // Tỉnh hợp lệ nhưng không map được id (mất mạng lần đầu) — coi như
        // chưa đủ dữ liệu, không lọc sai sang tỉnh khác.
        if (province_id == null) { if (!huy) { setDs([]); setTrang('xong') }; return }
        q = q.eq('province_id', province_id)
      }

      const { data, error } = await q
      if (huy) return
      if (error) { setDs([]); setTrang('xong'); return }
      const banLDiaGioi = await taiTenDiaGioi()
      if (huy) return
      setBang(banLDiaGioi)
      setDs(data ?? [])
      setTrang('xong')
    })()
    return () => { huy = true }
  }, [hang, dong, tenTinh])

  const tieuDe = tieuDeTrang(hang, dong, tenTinh)
  const duDuTin = ds.length >= NGUONG_INDEX

  const gia = ds.map((x) => x.price_per_day).filter((x) => x != null)
  const giaMin = gia.length ? Math.min(...gia) : null
  const giaMax = gia.length ? Math.max(...gia) : null

  useMeta({
    title: titleTrang(hang, dong, tenTinh),
    description: moTaTrang(hang, dong, tenTinh, ds.length),
    path: duongDanDongXe(hang, dong, tenTinh),
    // Chưa tải xong thì tạm noindex — tránh máy quét thấy trang rỗng đúng lúc
    // đang gọi mạng rồi bỏ qua, lỡ mất lượt crawl.
    index: trang === 'xong' && duDuTin,
  })

  return (
    <div className="page stack tc">
      <nav className="t-small" aria-label="breadcrumb">
        <Link to="/thue-xe">Tìm xe</Link>
        {' / '}
        <Link to={duongDanTimKiem('', { hang })}>{hang}</Link>
        {' / '}
        <span>{dong}</span>
        {tenTinh && <>{' / '}<span>{tenTinh}</span></>}
      </nav>

      <div>
        <h1 className="tc-h1" style={{ fontSize: 'clamp(26px, 4vw, 38px)' }}>{tieuDe}</h1>
        {/* Chữ dựng từ `cauMoTa` dùng chung với prerender — sửa câu thì sửa
            ở `noiDungSeo.js`, đừng sửa riêng ở đây rồi để hai bản lệch nhau. */}
        {trang === 'xong' && (
          <p className="tc-mota">
            {cauMoTa(
              hang, dong, tenTinh, ds.length,
              giaMin != null ? formatVndShort(giaMin) : null,
              giaMax != null ? formatVndShort(giaMax) : null,
            )}
          </p>
        )}
      </div>

      {trang === 'xong' && ds.length > 0 && (
        <div className="grid-cards">
          {ds.map((the) => <TheXe key={the.id} the={the} bangDiaGioi={bang} />)}
        </div>
      )}

      <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <Link to={duongDanTimKiem('', { hang })} className="btn btn-ghost">
          Xem tất cả {hang}
        </Link>
        {tenTinh && (
          <Link to={duongDanTimKiem('', { tinh: tenTinh })} className="btn btn-ghost">
            Xem tất cả xe tại {tenTinh}
          </Link>
        )}
      </div>

      <p className="t-small">Giao dịch thuê xe do hai bên tự thoả thuận.</p>
    </div>
  )
}
