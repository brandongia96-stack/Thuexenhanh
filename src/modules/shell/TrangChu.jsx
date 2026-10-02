import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, ShieldCheck, Wallet, MapPin, Zap } from 'lucide-react'

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

// Dưới ngưỡng này thì ẩn cả khối "Thuê xe điện" — vài xe lẻ tẻ không đủ để
// gọi là một mục trên trang chủ, và tránh lộ danh tính chủ xe hiếm hoi
// (NGHIEN-CUU-XE-DIEN.md mục 6: cấm số liệu không tính từ tin thật, nhưng
// cũng không nên phô trương số nhỏ như thể đã nhiều).
const NGUONG_XE_DIEN = 3

/**
 * Trang chủ: hero (chữ + ô tìm kiếm) → cách hoạt động → thuê xe điện (chỉ khi
 * đủ tin thật) → xe mới đăng (chỉ khi có tin thật) → khối chủ xe. Bố cục theo
 * mẫu dev nhưng KHÔNG ảnh xe mẫu, không số liệu bịa, không câu cam kết app
 * không làm được (CLAUDE.md 1.2).
 */
export default function TrangChu() {
  return (
    <div className="page stack tc">
      <Hero />
      <BaBuoc />
      <XeGanBan />
      <XeDien />
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

/**
 * Khối "Thuê xe điện" (NGHIEN-CUU-XE-DIEN.md mục 2 đợt 2 #5).
 * Mọi con số TÍNH TỪ TIN THẬT đang hiển thị, không hardcode. Chưa đủ
 * `NGUONG_XE_DIEN` tin — hoặc cột xe điện chưa có trên CSDL (migration 0012
 * chưa chạy, `error` 42703) — thì ẩn cả khối, im lặng, không báo lỗi khách.
 */
function XeDien() {
  const [tk, setTk] = useState(null) // { ds, tongSo, freeSac, kmMin, kmMax }
  const [bang, setBang] = useState({ tinh: {}, quan: {} })

  useEffect(() => {
    let huy = false
    ;(async () => {
      const sb = await trySupabase()
      if (!sb) return
      const { data, error } = await sb
        .from('listing_card')
        .select(COT_THE + ',ev_range_km,charge_policy')
        .eq('status', 'dang_hien_thi')
        .eq('fuel', 'dien')
        .order('published_at', { ascending: false })
        .limit(24)
      if (error || !data || data.length < NGUONG_XE_DIEN || huy) return

      const coQuangDuong = data.map((x) => x.ev_range_km).filter((x) => x != null)
      const ten = await taiTenDiaGioi()
      if (huy) return
      setBang(ten)
      setTk({
        ds: data.slice(0, 4),
        tongSo: data.length,
        freeSac: data.filter((x) => x.charge_policy === 'mien_phi' || x.charge_policy === 'mien_phi_gioi_han').length,
        kmMin: coQuangDuong.length ? Math.min(...coQuangDuong) : null,
        kmMax: coQuangDuong.length ? Math.max(...coQuangDuong) : null,
      })
    })()
    return () => { huy = true }
  }, [])

  if (!tk) return null

  return (
    <section className="stack">
      <div className="tc-dau">
        <div>
          <span className="tc-nhan"><Zap size={14} strokeWidth={2} style={{ verticalAlign: '-2px' }} /> Xe điện</span>
          <h2 className="tc-h2">Thuê xe điện</h2>
        </div>
        <Link to={duongDanTimKiem('', { nl: 'dien' })} className="tc-lienket">Xem tất cả →</Link>
      </div>
      <p className="t-body">
        Đang có {tk.tongSo} xe điện cho thuê trên Thuexenhanh
        {tk.freeSac > 0 && `, ${tk.freeSac} xe được chủ xe cam kết free sạc`}
        {tk.kmMin != null && (
          tk.kmMin === tk.kmMax
            ? ` — quãng đường ${tk.kmMin} km mỗi lần sạc đầy theo chủ xe khai`
            : ` — quãng đường ${tk.kmMin}–${tk.kmMax} km mỗi lần sạc đầy theo chủ xe khai`
        )}.
      </p>
      <p className="t-small">Chính sách sạc do từng chủ xe cam kết, không phải của hãng xe.</p>
      <div className="grid-cards">
        {tk.ds.map((the) => <TheXe key={the.id} the={the} bangDiaGioi={bang} />)}
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


function XeGanBan() {
  const [trangThai, setTrangThai] = useState('cho')
  const [ds, setDs] = useState([])
  const [bang, setBang] = useState({ tinh: {}, quan: {} })

  function timXeGanDay() {
    setTrangThai('dang_tim')
    if (!navigator.geolocation) {
      setTrangThai('loi_gps')
      return
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: latBan, longitude: lngBan } = pos.coords
      const sb = await trySupabase()
      if (!sb) { setTrangThai('khong_co'); return }
      
      // Tính khoảng cách TRÊN SERVER (migration 0013): lọc bán kính 50 km,
      // trả tối đa 8 thẻ kèm distance_km. Không kéo toạ độ của mọi tin về máy.
      const { data, error } = await sb.rpc('get_nearby_listings', {
        p_lat: latBan, p_lng: lngBan, p_radius_km: 50, p_limit: 8,
      })
      if (error || !data?.length) { setTrangThai('khong_co'); return }

      const dsCuoi = data.map((x) => ({ ...x, khoangCach: Number(x.distance_km) }))

      const ten = await taiTenDiaGioi()
      setBang(ten)
      setDs(dsCuoi)
      setTrangThai('co_xe')
    }, () => {
      setTrangThai('loi_gps')
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 })
  }

  if (trangThai === 'khong_co' || trangThai === 'loi_gps') return null

  return (
    <section className="stack">
      <div className="tc-dau">
        <h2 className="tc-h2">
          <MapPin size={22} color="var(--m-red)" style={{ verticalAlign: '-4px', marginRight: 4 }} />
          Xe gần bạn nhất
        </h2>
      </div>
      
      {trangThai === 'cho' && (
        <div className="card card-pad empty" style={{ border: '1px dashed var(--m-border)', background: 'var(--m-bg)' }}>
          <p className="t-body" style={{ color: 'var(--m-dark)' }}>Cho phép định vị để xem các xe đang ở gần bạn nhất (bán kính 50km).</p>
          <button className="btn btn-primary" onClick={timXeGanDay}>
            <MapPin size={18} /> Quét radar tìm xe gần đây
          </button>
        </div>
      )}

      {trangThai === 'dang_tim' && (
        <div className="card card-pad empty" style={{ border: '1px dashed var(--m-border)' }}>
          <div className="skeleton" style={{ width: 120, height: 40, borderRadius: 20 }}></div>
          <p className="t-small" style={{ marginTop: 8 }}>Đang lấy toạ độ GPS của bạn...</p>
        </div>
      )}

      {trangThai === 'co_xe' && (
        <div className="grid-cards">
          {ds.map((the) => <TheXe key={the.id} the={the} bangDiaGioi={bang} />)}
        </div>
      )}
    </section>
  )
}
