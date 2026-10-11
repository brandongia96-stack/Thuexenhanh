// owner/TrangChuXe — màn "Xe của tôi" (route /chu-xe).
//
// Ghép các mảnh của luồng 03: danh sách xe + trạng thái + hạn còn lại, số liệu
// 30 ngày từng xe, tổng của chủ xe. Màn CHỈ ĐỌC. Việc duy nhất liên quan tới tiền
// là nút Gia hạn, và nó mở HopTraPhi của luồng 06 — không có cơ chế trừ token riêng.

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock, Car, Eye, Phone, Plus, ShieldCheck, Wallet, Download } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import { formatDate, formatTokens } from '../../lib/format'
import { TOKENS_PER_MONTH } from '../../lib/config'
import { soDuVi } from '../billing/billingApi'
import '../billing/billing.css' // HopTraPhi dùng class của billing.css (hop-nen, chon-luoi…)
import {
  danhSachXeCuaToi, docHienSdt, ghiHienSdt, soLieuNhieuXe, thongTinCo, thongTinRieng,
  tongQuanXe, tongSoLieuChuXe, viTriGia,
} from './ownerApi'
import { lyDoCanhBao } from './canhBao'
import CongTacHienSdt from './CongTacHienSdt'
import { chuoiDayDu, dinhDangTyLe, gopTheoXe, soRong, tyLeLaySo } from './soLieu'
import ChiSo from './ChiSo'
import TheXe from './TheXe'
import './owner.css'

// Hộp trả phí chỉ cần khi bấm Gia hạn → tải trễ, không nằm trong gói màn này.
const HopTraPhi = lazy(() => import('../billing').then((m) => ({ default: m.HopTraPhi })))

const TAB = [
  { key: 'tat_ca', nhan: 'Tất cả' },
  { key: 'hien_thi', nhan: 'Đang hiển thị' },
  { key: 'cho', nhan: 'Nháp / chờ duyệt' },
  { key: 'het_han', nhan: 'Hết hạn / ẩn' },
]

export default function TrangChuXe() {
  const { user } = useAuth()
  const ownerId = user?.id

  const [nhom, setNhom] = useState('tat_ca')
  const [items, setItems] = useState([])
  const [conNua, setConNua] = useState(false)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState(null)

  const [soLieu, setSoLieu] = useState(() => new Map())
  const [dangTaiSoLieu, setDangTaiSoLieu] = useState(false)
  const [rieng, setRieng] = useState(() => new Map())
  const [co, setCo] = useState(() => new Map())

  // Đồng ý cho khách xem SĐT: true/false, null = không đọc được (ẩn khối).
  const [hienSdt, setHienSdt] = useState(null)
  const [dangGhiSdt, setDangGhiSdt] = useState(false)
  const [loiSdt, setLoiSdt] = useState(null)

  const [quan, setQuan] = useState(null)       // đếm xe + hạn gần nhất
  const [tong, setTong] = useState(null)       // tổng lượt xem / lấy số
  const [soDu, setSoDu] = useState(undefined)  // undefined = chưa biết; 0 = chưa có token

  const [moRong, setMoRong] = useState(null)
  const [viTri, setViTri] = useState(() => new Map())
  const [giaHan, setGiaHan] = useState(null)

  // Cursor để trong ref: đổi nó không được kích hoạt tải lại, chỉ "Xem thêm" mới đọc.
  const cursorRef = useRef(null)
  // Đổi bộ lọc giữa lúc đang tải: kết quả của lần gọi cũ phải bị bỏ.
  const lanGoi = useRef(0)

  const taiSoLieuChoTrang = useCallback(async (moi) => {
    if (!moi.length) return
    const ids = moi.map((x) => x.id)
    setDangTaiSoLieu(true)
    const [hang, ttRieng, ttCo] = await Promise.allSettled([
      soLieuNhieuXe(ownerId, ids),
      thongTinRieng(ids),
      thongTinCo(ids),
    ])
    if (ttRieng.status === 'fulfilled') {
      setRieng((cu) => new Map([...cu, ...ttRieng.value]))
    }
    if (ttCo.status === 'fulfilled') {
      setCo((cu) => new Map([...cu, ...ttCo.value]))
    }
    if (hang.status === 'fulfilled') {
      const theoXe = gopTheoXe(hang.value)
      setSoLieu((cu) => {
        const ra = new Map(cu)
        for (const id of ids) {
          const x = theoXe.get(id)
          // Xe không có dòng nào trong events_daily = 0 thật, không phải "chưa biết".
          ra.set(id, { tong: x?.tong ?? soRong(), chuoi: chuoiDayDu(x?.theoNgay) })
        }
        return ra
      })
    }
    // Lỗi: không ghi gì vào `soLieu` → thẻ hiện "Chưa tải được số liệu", không bịa số 0.
    setDangTaiSoLieu(false)
  }, [ownerId])

  const taiTrang = useCallback(async ({ lai = false } = {}) => {
    if (!ownerId) return
    const lan = ++lanGoi.current
    setDangTai(true)
    setLoi(null)
    try {
      const kq = await danhSachXeCuaToi(ownerId, { nhom, cursor: lai ? null : cursorRef.current })
      if (lan !== lanGoi.current) return
      setItems((cu) => (lai ? kq.items : [...cu, ...kq.items]))
      cursorRef.current = kq.cursor
      setConNua(kq.conNua)
      taiSoLieuChoTrang(kq.items)
    } catch (e) {
      if (lan !== lanGoi.current) return
      setLoi(e?.message ?? 'Không tải được danh sách xe.')
    } finally {
      if (lan === lanGoi.current) setDangTai(false)
    }
  }, [ownerId, nhom, taiSoLieuChoTrang])

  // Đổi bộ lọc → xoá danh sách cũ rồi tải trang đầu.
  useEffect(() => {
    setItems([])
    cursorRef.current = null
    setConNua(false)
    setMoRong(null)
    taiTrang({ lai: true })
  }, [taiTrang])

  const taiTongQuan = useCallback(() => {
    if (!ownerId) return
    tongQuanXe(ownerId).then(setQuan).catch(() => setQuan(null))
    tongSoLieuChuXe(ownerId).then(setTong).catch(() => setTong(null))
    soDuVi(ownerId).then((v) => setSoDu(v?.so_du ?? 0)).catch(() => setSoDu(undefined))
  }, [ownerId])

  useEffect(() => { taiTongQuan() }, [taiTongQuan])

  useEffect(() => {
    if (!ownerId) return
    let huy = false
    docHienSdt(ownerId).then((v) => { if (!huy) setHienSdt(v) })
    return () => { huy = true }
  }, [ownerId])

  // Đổi công tắc ngay (HIEU-NANG.md mục 6), ghi ngầm, lỗi thì hoàn lại + báo.
  const doiHienSdt = useCallback(async (bat) => {
    const cu = hienSdt
    setHienSdt(bat)
    setLoiSdt(null)
    setDangGhiSdt(true)
    try {
      await ghiHienSdt(ownerId, bat)
    } catch (e) {
      setHienSdt(cu)
      setLoiSdt('Chưa lưu được lựa chọn. Anh thử lại giúp em.')
      if (import.meta.env.DEV) console.warn('[owner] ghi show_phone lỗi:', e?.message)
    } finally {
      setDangGhiSdt(false)
    }
  }, [ownerId, hienSdt])

  const bamMoRong = useCallback((id) => {
    setMoRong((cu) => (cu === id ? null : id))
  }, [])

  // Vị trí giá chỉ gọi khi mở rộng một xe, không gọi trong danh sách (2 truy vấn đếm).
  useEffect(() => {
    if (!moRong || viTri.has(moRong)) return
    const xe = items.find((x) => x.id === moRong)
    if (!xe) return
    viTriGia({ provinceId: xe.province_id, pricePerDay: xe.price_per_day, listingId: xe.id })
      .then((v) => setViTri((cu) => new Map(cu).set(moRong, v)))
      .catch(() => setViTri((cu) => new Map(cu).set(moRong, null)))
  }, [moRong, items, viTri])

  const xongTraPhi = useCallback((kq) => {
    // kq null = vừa nạp thêm token, chưa trả phí: chỉ cập nhật số dư.
    if (!kq) {
      soDuVi(ownerId).then((v) => setSoDu(v?.so_du ?? 0)).catch(() => {})
      return
    }
    setGiaHan(null)
    taiTrang({ lai: true })
    taiTongQuan()
  }, [ownerId, taiTrang, taiTongQuan])

  const dem = quan
    ? { tat_ca: quan.dangHien + quan.cho + quan.hetHan, hien_thi: quan.dangHien, cho: quan.cho, het_han: quan.hetHan }
    : null
  const tyLe = tong ? tyLeLaySo(tong.view_listing, tong.reveal_phone) : null
  const canToken = quan ? quan.sapHetHan * TOKENS_PER_MONTH : 0
  const thieuToken = quan?.sapHetHan > 0 && soDu !== undefined && soDu < canToken
  const chuaCoXe = !dangTai && !loi && nhom === 'tat_ca' && items.length === 0

  return (
    <div className="page stack cx">
      <div className="row cx-dau">
        <h1 className="t-h1">Xe của tôi</h1>
        
      </div>

      {quan?.sapHetHan > 0 && (
        <div className="cx-canh-bao" role="alert">
          <AlertTriangle size={18} strokeWidth={1.8} />
          <div>
            <strong>{quan.sapHetHan} xe còn từ 3 ngày trở xuống là hết hạn.</strong>{' '}
            {thieuToken
              ? <>Gia hạn cần {formatTokens(canToken)}, ví đang có {formatTokens(soDu)}. <Link to="/chu-xe/vi">Nạp thêm token</Link></>
              : 'Gia hạn để tin không biến mất khỏi tìm kiếm.'}
          </div>
        </div>
      )}

      {/* Tổng của chủ xe. ChiSo tự ẩn khi giá trị null (chưa biết); 0 vẫn hiện vì 0 là số thật. */}
      <section className="cx-tong" aria-label="Tổng quan 30 ngày">
        <ChiSo icon={Eye} nhan="Lượt xem 30 ngày" giaTri={tong?.view_listing} />
        <ChiSo icon={Phone} nhan="Lượt lấy số 30 ngày" giaTri={tong?.reveal_phone} tone="ok" />
        
        {/* Tỉ lệ chuyển đổi tách ra thành 1 box riêng cho chuyên nghiệp */}
        <ChiSo 
          icon={AlertTriangle} 
          nhan="Tỉ lệ chuyển đổi" 
          giaTri={tyLe != null ? `${dinhDangTyLe(tyLe)}` : null} 
          phu="Khách xem / Lấy số"
        />

        <ChiSo 
          icon={Car} 
          nhan="Tổng số xe" 
          giaTri={quan ? quan.dangHien + quan.cho + quan.hetHan : null} 
          phu={quan ? `${quan.cho} chờ duyệt` : null}
        />
        
        <ChiSo icon={Car} nhan="Đang hiển thị" giaTri={quan?.dangHien}
          phu={quan ? `${quan.hetHan} hết hạn / ẩn` : null} />
          
        <ChiSo icon={Wallet} nhan="Số dư token" giaTri={soDu === undefined ? null : soDu}
          phu={<Link to="/chu-xe/vi">Mở ví</Link>} />
      </section>
      {tong && tong.view_listing === 0 && tong.reveal_phone === 0 && (
        <p className="t-small">
          Chưa có lượt xem nào trong 30 ngày qua. Số liệu gộp theo ngày, cập nhật mỗi đêm, chưa gồm hôm nay.
        </p>
      )}

      <CongTacHienSdt bat={hienSdt} dangGhi={dangGhiSdt} loi={loiSdt} onDoi={doiHienSdt} />

      {/* Mẹo an toàn. CCCD: xem rồi trả lại ngay, KHÔNG khuyên giữ giấy tờ gốc (NĐ 282/2025). */}
      <aside className="cx-meo" aria-label="Mẹo an toàn">
        <ShieldCheck size={18} strokeWidth={1.8} />
        <div>
          <strong>Mẹo an toàn khi giao xe</strong>
          <ul className="cx-meo-ds">
            <li>Xem CCCD và bằng lái của khách, đối chiếu với người thật rồi trả lại ngay. Không giữ giấy tờ gốc.</li>
            <li>Chụp ảnh tình trạng xe cùng khách lúc giao và lúc nhận lại.</li>
          </ul>
        </div>
      </aside>

      {/* Quà tặng biểu mẫu cho chủ xe (Mức 2) */}
      <div className="card card-pad row" style={{ gap: 'var(--sp-4)', marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-4)', backgroundColor: 'var(--m-blue-bg)' }}>
        <div style={{ flex: 1 }}>
          <h3 className="t-h3" style={{ color: 'var(--m-blue)' }}>Biểu mẫu hỗ trợ kinh doanh</h3>
          <p className="t-small" style={{ marginTop: 4 }}>Tải ngay bộ Mẫu hợp đồng thuê xe & Biên bản bàn giao chuẩn pháp lý (File Word).</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => alert('Mẫu hợp đồng đang được đội pháp chế chuẩn bị. Sẽ sớm có mặt!')}
        >
          <Download size={16} /> Tải miễn phí
        </button>
      </div>

      <div className="cx-tab" role="tablist" aria-label="Lọc theo trạng thái">
        {TAB.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={nhom === t.key}
            className={`cx-tab-nut${nhom === t.key ? ' dang-chon' : ''}`}
            onClick={() => setNhom(t.key)}
          >
            {t.nhan}{dem ? ` (${dem[t.key]})` : ''}
          </button>
        ))}
      </div>

      {loi && (
        <div className="cx-canh-bao" role="alert">
          <AlertTriangle size={18} strokeWidth={1.8} />
          <div>
            {loi}{' '}
            <button type="button" className="cx-lien-ket" onClick={() => taiTrang({ lai: true })}>Thử lại</button>
          </div>
        </div>
      )}

      {chuaCoXe && (
        <EmptyState
          icon={Car}
          title="Anh chưa đăng xe nào"
          hint="Đăng tin đầu tiên để khách bắt đầu xem và gọi cho anh."
          action={<Link to="/chu-xe/dang-tin" className="btn btn-primary">Đăng xe ngay</Link>}
        />
      )}
      {!dangTai && !loi && !chuaCoXe && items.length === 0 && (
        <EmptyState icon={Car} title="Không có xe nào trong nhóm này" />
      )}

      <div className="cx-luoi">
        {items.map((xe, i) => (
          <TheXe
            key={xe.id}
            xe={xe}
            uuTien={i === 0}
            soLieu={soLieu.get(xe.id)}
            dangTaiSoLieu={dangTaiSoLieu}
            rieng={rieng.get(xe.id)}
            canhBao={lyDoCanhBao(xe, co.get(xe.id))}
            anLienHe={hienSdt === false}
            moRong={moRong === xe.id}
            viTri={viTri.get(xe.id)}
            onMoRong={bamMoRong}
            onGiaHan={setGiaHan}
          />
        ))}
        {dangTai && [0, 1].map((k) => (
          <div key={'sk' + k} className="card card-pad stack">
            <Skeleton height={140} />
            <Skeleton height={18} width="60%" />
            <Skeleton height={14} width="40%" />
          </div>
        ))}
      </div>

      {conNua && !dangTai && (
        <button type="button" className="btn btn-ghost" onClick={() => taiTrang()}>Xem thêm xe</button>
      )}

      {giaHan && (
        <Suspense fallback={null}>
          <HopTraPhi
            listing={giaHan}
            soDu={soDu ?? 0}
            onDong={() => setGiaHan(null)}
            onXong={xongTraPhi}
          />
        </Suspense>
      )}
    </div>
  )
}

