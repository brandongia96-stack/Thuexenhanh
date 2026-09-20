import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, ShieldCheck, Wallet, Search } from 'lucide-react'

import { PROVINCES, DISTRICTS } from '../../data/provinces'
import { TOKEN_VND, TOKENS_PER_MONTH } from '../../lib/config'
import { trySupabase } from '../../lib/supabase'
import { taiTenDiaGioi } from '../discovery/diaGioi'
import TheXeDaLuu from '../discovery/saved/TheXeDaLuu'
import '../discovery/saved/DaLuu.css'

// Cột thẻ xe — khớp view `listing_card`, cấm select * (HIEU-NANG.md mục 2.1).
const COT_THE =
  'id,status,brand_text,model_text,year,seats,transmission,fuel,price_per_day,' +
  'province_id,district_id,is_verified,published_at,owner_id,' +
  'cover_thumb,cover_blur,cover_width,cover_height'

/**
 * Trang chủ: hero có ô tìm kiếm → xe mới đăng (chỉ khi có tin thật) → khối chủ xe.
 * Không ảnh mẫu, không số liệu bịa (CLAUDE.md 1.2).
 */
export default function TrangChu() {
  return (
    <div className="page stack" style={{ gap: 'var(--sp-8)' }}>
      <Hero />
      <XeMoiDang />
      <KhoiChuXe />
    </div>
  )
}

function Hero() {
  const dieuHuong = useNavigate()
  const [tinh, setTinh] = useState('')
  const [quan, setQuan] = useState('')
  const dsQuan = DISTRICTS[tinh] ?? []

  function tim(e) {
    e.preventDefault()
    // TODO(luồng 04): thay ô địa điểm này bằng component lọc của luồng 04 và
    // dùng đúng tên tham số URL của nó. Tạm dùng ?tinh=&quan= (tên hiển thị).
    const q = new URLSearchParams()
    if (tinh) q.set('tinh', tinh)
    if (quan) q.set('quan', quan)
    const s = q.toString()
    dieuHuong(s ? `/thue-xe?${s}` : '/thue-xe')
  }

  return (
    <section className="stack" style={{ gap: 'var(--sp-4)', paddingTop: 'var(--sp-6)' }}>
      <h1 className="t-h1">Thuê xe tự lái, gọi thẳng chủ xe</h1>
      <p className="t-body" style={{ maxWidth: 560 }}>
        Chủ xe đăng tin, khách thuê tìm xe. Bạn xem số điện thoại, gọi trực tiếp và tự
        thoả thuận với nhau.
      </p>

      <form
        onSubmit={tim}
        className="card card-pad"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)', alignItems: 'flex-end' }}
      >
        <label className="field" style={{ flex: '1 1 200px' }}>
          <span className="field-label">Tỉnh / thành phố</span>
          <select
            className="select"
            value={tinh}
            onChange={(e) => { setTinh(e.target.value); setQuan('') }}
          >
            <option value="">Tất cả</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        {dsQuan.length > 0 && (
          <label className="field" style={{ flex: '1 1 200px' }}>
            <span className="field-label">Quận / huyện</span>
            <select className="select" value={quan} onChange={(e) => setQuan(e.target.value)}>
              <option value="">Tất cả</option>
              {dsQuan.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        )}
        <button type="submit" className="btn btn-primary btn-lg" style={{ flex: '0 0 auto' }}>
          <Search size={18} strokeWidth={2} /> Tìm xe
        </button>
      </form>

      <div>
        <Link to="/chu-xe/dang-tin" className="t-small" style={{ color: 'var(--m-green)', fontWeight: 600 }}>
          Bạn có xe cho thuê? Đăng tin →
        </Link>
      </div>
    </section>
  )
}

/** Tối đa 8 tin thật, mới nhất. Chưa có tin (hoặc lỗi mạng) → ẩn cả khối. */
function XeMoiDang() {
  const [ds, setDs] = useState([])
  const [bang, setBang] = useState({ tinh: {}, quan: {} })

  useEffect(() => {
    let huy = false
    ;(async () => {
      const sb = await trySupabase()
      if (!sb) return
      const { data, error } = await sb
        .from('listing_card')
        .select(COT_THE)
        .eq('status', 'dang_hien_thi')
        .order('published_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(8)
      if (error || !data?.length || huy) return
      const ten = await taiTenDiaGioi()
      if (!huy) { setBang(ten); setDs(data) }
    })()
    return () => { huy = true }
  }, [])

  if (ds.length === 0) return null

  return (
    <section className="stack" style={{ gap: 'var(--sp-4)' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="t-h2">Xe mới đăng</h2>
        <Link to="/thue-xe" className="t-small" style={{ color: 'var(--m-green)', fontWeight: 600 }}>
          Xem tất cả
        </Link>
      </div>
      <div className="grid-cards">
        {ds.map((the) => <TheXeDaLuu key={the.id} the={the} bangDiaGioi={bang} />)}
      </div>
    </section>
  )
}

function KhoiChuXe() {
  const phi = (TOKENS_PER_MONTH * TOKEN_VND).toLocaleString('vi-VN')
  return (
    <section className="stack" style={{ gap: 'var(--sp-4)' }}>
      <h2 className="t-h2">Bạn có xe cho thuê?</h2>
      <div className="grid-cards">
        <Diem
          icon={Wallet}
          title="Không hoa hồng"
          desc="Chủ xe giữ trọn tiền thuê. Tiền thuê là chuyện của hai bên, chúng tôi không đứng giữa dòng tiền."
        />
        <Diem
          icon={Phone}
          title={`${TOKENS_PER_MONTH} token / xe / tháng`}
          desc={`Phí hiển thị tin là ${TOKENS_PER_MONTH} token, tương đương ${phi}đ cho mỗi xe mỗi tháng. Khách xem số điện thoại và gọi thẳng cho bạn.`}
        />
        <Diem
          icon={ShieldCheck}
          title="Tích xanh miễn phí"
          desc="Xác minh xét theo giấy tờ, không bán bằng tiền."
        />
      </div>
      <div>
        <Link to="/chu-xe/dang-tin" className="btn btn-primary btn-lg">Đăng xe của bạn</Link>
      </div>
      <p className="t-small">Giao dịch thuê xe do hai bên tự thoả thuận.</p>
    </section>
  )
}

function Diem({ icon: Icon, title, desc }) {
  return (
    <div className="card card-pad stack" style={{ gap: 'var(--sp-2)' }}>
      <Icon size={22} strokeWidth={1.8} color="var(--m-green)" />
      <div className="t-h3">{title}</div>
      <p className="t-small">{desc}</p>
    </div>
  )
}
