import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, SearchX, WifiOff } from 'lucide-react'

import EmptyState from '../../../components/EmptyState'
import TheXe from '../the-xe/TheXe'
import BoLoc from '../filter/BoLoc'
import ChipLoc from '../filter/ChipLoc'
import OTimKiem from './OTimKiem'
import { timTheXe } from './searchApi'
import {
  urlSangLoc, locSangUrl, locHieuLuc, chotCauTimKiem, locRong, demBoLoc, SAP_XEP,
} from '../filter/loc'
import { taiTenDiaGioi } from '../diaGioi'
import { layDanhSach, nhoDanhSach, useNhoViTriCuon } from '../boNhoPhien'
import { trackSearch } from '../../analytics/events'
import './TimKiem.css'

// Số thẻ đầu tiên tải ảnh ngay (không lazy) — vừa màn hình đầu trên điện thoại
// và máy tính. Ảnh đầu tiên nhìn thấy quyết định LCP (HIEU-NANG.md mục 1.3).
const SO_THE_UU_TIEN = 2

/**
 * Trang tìm kiếm `/thue-xe`.
 *
 * URL là nguồn sự thật duy nhất của bộ lọc: chia sẻ link được, bấm Quay lại về
 * đúng bộ lọc cũ. Trang này KHÔNG giữ bản sao bộ lọc trong state.
 */
export default function TrangTimKiem() {
  const [sp, setSp] = useSearchParams()
  const chuoiUrl = sp.toString()
  const loc = useMemo(() => urlSangLoc(new URLSearchParams(chuoiUrl)), [chuoiUrl])
  const khoa = 'tim:' + chuoiUrl

  // Bản mới nhất của bộ lọc cho các callback trễ (debounce 300ms). Không thì gõ
  // dở rồi bấm một chip, lúc debounce bắn sẽ ghi đè bằng bộ lọc cũ.
  const locRef = useRef(loc)
  locRef.current = loc
  const khoaRef = useRef(khoa)
  khoaRef.current = khoa

  const [trang, setTrang] = useState(() => layDanhSach(khoa))
  const [dangTai, setDangTai] = useState(() => !layDanhSach(khoa))
  const [loi, setLoi] = useState(null)
  const [dangThem, setDangThem] = useState(false)
  const [loiThem, setLoiThem] = useState(false)
  const [lanThu, setLanThu] = useState(0)
  const [bangDiaGioi, setBangDiaGioi] = useState(null)
  const [moLoc, setMoLoc] = useState(false) // chỉ dùng trên điện thoại

  const acThem = useRef(null)

  useEffect(() => {
    document.title = 'Thuê xe tự lái | Thuexenhanh'
    taiTenDiaGioi().then(setBangDiaGioi).catch(() => {})
  }, [])

  const doiLoc = useCallback((moi) => {
    // replace: gõ và bấm lọc liên tục không được chất đống lịch sử trình duyệt,
    // bấm Quay lại phải ra khỏi trang chứ không phải lùi từng bộ lọc.
    setSp(locSangUrl(moi), { replace: true })
  }, [setSp])

  // Tải trang đầu mỗi khi bộ lọc (tức URL) đổi.
  useEffect(() => {
    setLoiThem(false)
    setDangThem(false) // đổi lọc giữa lúc đang tải thêm: request đó đã bị huỷ, đừng kẹt "Đang tải…"
    const cu = layDanhSach(khoa)
    if (cu) {
      // Quay lại từ trang chi tiết: hiện lại danh sách cũ TỨC THÌ (HIEU-NANG mục 5).
      setTrang(cu)
      setDangTai(false)
      setLoi(null)
      return
    }

    const ac = new AbortController()
    setDangTai(true)
    setLoi(null)

    const hieuLuc = locHieuLuc(locRef.current)
    timTheXe(hieuLuc, { signal: ac.signal })
      .then((kq) => {
        setTrang(kq)
        nhoDanhSach(khoa, kq)
        setDangTai(false)
        // Ghi nhận CHỈ khi có tìm/lọc thật — vào trang trống không phải một lượt tìm.
        if (hieuLuc.q?.trim() || demBoLoc(hieuLuc) > 0) {
          trackSearch({ ...hieuLuc, so_ket_qua_trang_dau: kq.items.length })
        }
      })
      .catch((err) => {
        if (ac.signal.aborted) return // đã gõ tiếp: request này bị bỏ chủ ý
        setLoi(err)
        setDangTai(false)
      })

    return () => {
      ac.abort() // gõ tiếp / đổi lọc thì huỷ request cũ (HIEU-NANG mục 2.5)
      acThem.current?.abort()
    }
  }, [khoa, lanThu])

  // Bấm Quay lại: hiện lại đúng vị trí đã cuộn.
  useNhoViTriCuon(khoa, !dangTai)

  const xemThem = useCallback(async () => {
    if (dangThem || !trang?.conNua) return
    const khoaLuc = khoa
    const ac = new AbortController()
    acThem.current = ac
    setDangThem(true)
    setLoiThem(false)
    try {
      const kq = await timTheXe(locHieuLuc(locRef.current), { cursor: trang.cursor, signal: ac.signal })
      if (ac.signal.aborted) return
      // Trong lúc chờ mà URL đã đổi thì kết quả này thuộc bộ lọc cũ, bỏ đi.
      if (khoaLuc !== khoaRef.current) return
      const co = new Set(trang.items.map((t) => t.id))
      const gop = {
        items: [...trang.items, ...kq.items.filter((t) => !co.has(t.id))],
        conNua: kq.conNua,
        cursor: kq.cursor,
      }
      setTrang(gop)
      nhoDanhSach(khoaLuc, gop)
    } catch {
      if (!ac.signal.aborted) setLoiThem(true)
    } finally {
      if (!ac.signal.aborted) setDangThem(false)
    }
  }, [dangThem, trang, khoa])

  // Cuộn gần tới đáy thì tự tải trang kế — cuộn vô hạn, 20 tin mỗi lần.
  const xemThemRef = useRef(xemThem)
  xemThemRef.current = xemThem
  const moc = useRef(null)
  useEffect(() => {
    const el = moc.current
    if (!el || !trang?.conNua || dangThem || loiThem) return
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && xemThemRef.current(),
      { rootMargin: '600px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [trang, dangThem, loiThem])

  const soBoLoc = demBoLoc(loc)
  const coLoc = soBoLoc > 0 || Boolean(loc.q.trim())
  const items = trang?.items ?? []

  return (
    <div className="page stack tk">
      <h1 className="t-h1">Thuê xe tự lái</h1>

      <div className="tk-dau">
        <div className="tk-timkiem">
          <OTimKiem
            value={loc.q}
            onGoiY={(q) => doiLoc({ ...locRef.current, q })}
            onGui={(cau) => doiLoc(chotCauTimKiem(locRef.current, cau))}
          />
        </div>
        <select
          className="select tk-xep"
          aria-label="Sắp xếp"
          value={loc.xep}
          onChange={(e) => doiLoc({ ...loc, xep: e.target.value })}
        >
          {SAP_XEP.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
        </select>
        <button
          type="button"
          className="btn btn-ghost tk-nutloc"
          aria-expanded={moLoc}
          onClick={() => setMoLoc((v) => !v)}
        >
          <SlidersHorizontal size={16} strokeWidth={2} />
          Bộ lọc{soBoLoc > 0 ? ` (${soBoLoc})` : ''}
        </button>
      </div>

      <ChipLoc loc={loc} onDoi={doiLoc} />

      <div className="tk-luoi">
        <aside className={'tk-loc card card-pad' + (moLoc ? ' mo' : '')}>
          <BoLoc loc={loc} onDoi={doiLoc} />
        </aside>

        <section className="tk-ketqua" aria-busy={dangTai} aria-label="Kết quả tìm kiếm">
          {dangTai && <KhungXuong />}

          {!dangTai && loi && (
            <EmptyState
              icon={WifiOff}
              title="Chưa tải được danh sách xe"
              hint="Kiểm tra kết nối mạng rồi thử lại."
              action={<button type="button" className="btn btn-primary" onClick={() => setLanThu((n) => n + 1)}>Thử lại</button>}
            />
          )}

          {!dangTai && !loi && items.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="Chưa có xe phù hợp"
              hint={coLoc ? 'Thử bỏ bớt bộ lọc hoặc đổi từ khoá.' : 'Hiện chưa có tin nào đang hiển thị.'}
              action={coLoc
                ? <button type="button" className="btn btn-primary" onClick={() => doiLoc({ ...locRong(), xep: loc.xep })}>Xoá bộ lọc</button>
                : null}
            />
          )}

          {!dangTai && !loi && items.length > 0 && (
            <>
              <div className="grid-cards tk-the">
                {items.map((the, i) => (
                  <TheXe key={the.id} the={the} bangDiaGioi={bangDiaGioi} uuTien={i < SO_THE_UU_TIEN} />
                ))}
              </div>

              {/* Mốc để cuộn tới đâu tải tới đó; nút bên dưới là đường lui khi
                  trình duyệt không hỗ trợ hoặc tải thêm lỗi. */}
              <div ref={moc} className="tk-moc" />
              {trang.conNua && (
                <div className="tk-them">
                  {loiThem && <span className="t-small">Không tải thêm được.</span>}
                  <button type="button" className="btn btn-ghost" onClick={xemThem} disabled={dangThem}>
                    {dangThem ? 'Đang tải…' : loiThem ? 'Thử lại' : 'Xem thêm xe'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

// Khung xám ĐÚNG hình thẻ thật: cảm giác nhanh hơn spinner và không nhảy layout
// (HIEU-NANG.md mục 4).
function KhungXuong() {
  return (
    <div className="grid-cards" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card">
          <div className="skeleton tk-khung-anh" />
          <div className="card-pad tk-khung-chu">
            <div className="skeleton" style={{ height: 18, width: '70%' }} />
            <div className="skeleton" style={{ height: 14, width: '50%' }} />
            <div className="skeleton" style={{ height: 18, width: '35%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
