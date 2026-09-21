import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, ShieldCheck, Wallet, MapPin } from 'lucide-react'

import { PROVINCES, DISTRICTS } from '../../data/provinces'
import { TOKEN_VND, TOKENS_PER_MONTH } from '../../lib/config'
import { trySupabase } from '../../lib/supabase'
import { taiTenDiaGioi } from '../discovery/diaGioi'
import TheXe from '../discovery/the-xe/TheXe'
import OTimKiem from '../discovery/search/OTimKiem'
import { duongDanTimKiem } from '../discovery/filter/loc'
import './TrangChu.css'

// Cột thẻ xe — khớp view `listing_card`, cấm select * (HIEU-NANG.md mục 2.1).
const COT_THE =
  'id,status,brand_text,model_text,year,seats,transmission,fuel,price_per_day,' +
  'province_id,district_id,is_verified,published_at,owner_id,' +
  'cover_thumb,cover_blur,cover_width,cover_height'

/**
 * Trang chủ: hero (chữ + ô tìm kiếm) → cách hoạt động → xe mới đăng (chỉ khi có
 * tin thật) → khối chủ xe. Bố cục theo mẫu dev nhưng KHÔNG ảnh xe mẫu, không số
 * liệu bịa, không câu cam kết app không làm được (CLAUDE.md 1.2).
 */
export default function TrangChu() {
  return (
    <div className="page stack tc">
      <Hero />
      <BaBuoc />
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

  // Dùng đúng ô tìm kiếm + hàm dựng URL của luồng 04: gõ "xe số tự động quận 7"
  // là tự đoán ra bộ lọc; tỉnh/quận chọn ở đây đi kèm làm bộ lọc sẵn.
  function tim(cau) {
    dieuHuong(duongDanTimKiem(cau, { tinh, quan }))
  }

  return (
    <section className="tc-hero">
      <div>
        <span className="tc-nhan">Thuê xe tự lái</span>
        <h1 className="tc-h1">Gọi thẳng chủ xe,<br />tự thoả thuận giá</h1>
        <p className="tc-mota">
          Chủ xe đăng tin, khách thuê tìm xe. Bạn xem số điện thoại, gọi trực tiếp và tự
          thoả thuận với nhau. Không qua trung gian, không mất hoa hồng.
        </p>
        <p style={{ marginTop: 'var(--sp-4)' }}>
          <Link to="/chu-xe/dang-tin" className="tc-lienket">Bạn có xe cho thuê? Đăng tin →</Link>
        </p>
      </div>

      <div className="tc-tim">
        <div className="tc-tim-tieude">Tìm xe</div>
        <label className="field">
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
          <label className="field">
            <span className="field-label">Quận / huyện</span>
            <select className="select" value={quan} onChange={(e) => setQuan(e.target.value)}>
              <option value="">Tất cả</option>
              {dsQuan.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        )}
        <OTimKiem onGui={tim} />
      </div>
    </section>
  )
}

/** Mô tả đúng cách app hoạt động — không hứa thêm gì. */
function BaBuoc() {
  const buoc = [
    ['1', 'Tìm xe', 'Chọn địa điểm, xem ảnh và giá thuê theo ngày do chủ xe đăng.'],
    ['2', 'Xem số điện thoại', 'Bấm xem số của chủ xe ngay trên trang xe.'],
    ['3', 'Gọi và thoả thuận', 'Hai bên tự trao đổi giá, giấy tờ, cách giao nhận xe.'],
  ]
  return (
    <section className="stack">
      <h2 className="tc-h2">Cách hoạt động</h2>
      <div className="tc-buoc">
        {buoc.map(([so, ten, mota]) => (
          <div key={so} className="card card-pad stack" style={{ gap: 'var(--sp-2)' }}>
            <div className="tc-buoc-so">{so}</div>
            <div className="t-h3">{ten}</div>
            <p className="t-small">{mota}</p>
          </div>
        ))}
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
    <section className="stack">
      <div className="tc-dau">
        <h2 className="tc-h2">Xe mới đăng</h2>
        <Link to="/thue-xe" className="tc-lienket">Xem tất cả →</Link>
      </div>
      <div className="grid-cards">
        {ds.map((the) => <TheXe key={the.id} the={the} bangDiaGioi={bang} />)}
      </div>
    </section>
  )
}

function KhoiChuXe() {
  const phi = (TOKENS_PER_MONTH * TOKEN_VND).toLocaleString('vi-VN')
  return (
    <section className="stack">
      <div>
        <span className="tc-nhan">Dành cho chủ xe</span>
        <h2 className="tc-h2">Đăng xe, giữ trọn tiền thuê</h2>
      </div>
      <div className="grid-cards">
        <Diem
          icon={Wallet}
          title="Không hoa hồng"
          desc="Tiền thuê xe là chuyện của hai bên. Chúng tôi không đứng giữa dòng tiền."
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

      <div className="tc-cta">
        <h2>Có xe nhàn rỗi? Đăng tin ngay</h2>
        <p>Tạo tin, chờ duyệt, rồi khách gọi thẳng cho bạn.</p>
        <Link to="/chu-xe/dang-tin" className="btn btn-lg">
          <MapPin size={18} strokeWidth={2} /> Đăng xe của bạn
        </Link>
      </div>
      <p className="t-small">Giao dịch thuê xe do hai bên tự thoả thuận.</p>
    </section>
  )
}

function Diem({ icon: Icon, title, desc }) {
  return (
    <div className="card card-pad stack tc-the" style={{ gap: 'var(--sp-3)' }}>
      <div className="tc-icon"><Icon size={24} strokeWidth={1.8} color="var(--m-green)" /></div>
      <div className="t-h3">{title}</div>
      <p className="t-small">{desc}</p>
    </div>
  )
}
