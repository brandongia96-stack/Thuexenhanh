import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Users } from 'lucide-react'

import EmptyState from '../../../components/EmptyState'
import { PageLoading, Skeleton } from '../../../components/Loading'
import TheXe from '../the-xe/TheXe'
import { docChuXeCongKhai, danhSachXeCuaChu } from './chuXeApi'
import KhoiChuXe from './KhoiChuXe'
import { taiTenDiaGioi } from '../diaGioi'
import { layDanhSach, nhoDanhSach, useNhoViTriCuon } from '../boNhoPhien'
import { useMeta } from '../../shell/seo-xe/useMeta'
import './ChuXe.css'

/**
 * Trang hồ sơ công khai của chủ xe — `/chu/:id` (contracts/api.md mục 3g).
 *
 * `owner_public` trả null khi người này không tồn tại HOẶC không còn tin nào
 * đang hiển thị — hai trường hợp gộp chung một trạng thái rỗng, giống cách
 * `TrangXe.jsx` xử lý tin hết hạn/bị ẩn/không tồn tại.
 *
 * CẤM hiện họ tên đầy đủ, email, SĐT, CCCD — chỉ `ten_hien_thi`. Số điện
 * thoại của từng xe vẫn phải qua nút "Xem số điện thoại" như cũ, không có
 * đường tắt nào ở trang này.
 */
export default function TrangChuCongKhai() {
  const { id } = useParams()
  const khoa = `chu:${id}`

  const [chuXe, setChuXe] = useState(null)
  const [dangTaiChu, setDangTaiChu] = useState(true)
  const [trang, setTrang] = useState(() => layDanhSach(khoa) ?? { items: [], conNua: false, cursor: null })
  const [dangTaiXe, setDangTaiXe] = useState(() => !layDanhSach(khoa))
  const [dangThem, setDangThem] = useState(false)
  const [bangDiaGioi, setBangDiaGioi] = useState(null)

  // Quay lại từ trang chi tiết xe: hiện lại đúng vị trí đã cuộn.
  useNhoViTriCuon(khoa, !dangTaiChu && !dangTaiXe)

  const tai = useCallback(async () => {
    const c = await docChuXeCongKhai(id)
    setChuXe(c)
    setDangTaiChu(false)
    if (!c) {
      setDangTaiXe(false)
      return
    }
    const kq = await danhSachXeCuaChu(id)
    setTrang(kq)
    nhoDanhSach(khoa, kq)
    setDangTaiXe(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    setDangTaiChu(true)
    setDangTaiXe(!layDanhSach(khoa))
    window.scrollTo(0, 0)
    taiTenDiaGioi().then(setBangDiaGioi).catch(() => {})
    tai().catch(() => {
      setDangTaiChu(false)
      setDangTaiXe(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tai])

  // Rỗng (không tồn tại / hết tin) → noindex. Có tin → index để Google thấy trang.
  useMeta({
    title: chuXe
      ? `Xe của ${chuXe.ten_hien_thi} cho thuê | Thuê Xe Nhanh`
      : 'Chủ xe | Thuê Xe Nhanh',
    description: chuXe
      ? `${chuXe.so_xe_dang_cho_thue} xe đang cho thuê bởi ${chuXe.ten_hien_thi} trên Thuê Xe Nhanh — thuê xe tự lái, liên hệ trực tiếp.`
      : 'Trang chủ xe này hiện không có tin nào đang hiển thị.',
    path: `/chu/${id}`,
    index: Boolean(chuXe),
  })

  async function xemThem() {
    if (dangThem || !trang.conNua) return
    setDangThem(true)
    try {
      const kq = await danhSachXeCuaChu(id, { cursor: trang.cursor })
      const gop = { items: [...trang.items, ...kq.items], conNua: kq.conNua, cursor: kq.cursor }
      setTrang(gop)
      nhoDanhSach(khoa, gop)
    } finally {
      setDangThem(false)
    }
  }

  if (dangTaiChu) return <PageLoading />

  if (!chuXe) {
    return (
      <div className="page">
        <EmptyState
          icon={Users}
          title="Chủ xe này hiện không có xe cho thuê"
          hint="Có thể tin đã hết hạn hoặc chủ xe đã gỡ hết tin."
          action={<Link to="/thue-xe" className="btn btn-primary">Tìm xe khác</Link>}
        />
      </div>
    )
  }

  return (
    <div className="page stack">
      <KhoiChuXe chuXe={chuXe} kichThuoc="lon" />

      <div className="chutrang-xe stack">
        {dangTaiXe ? (
          <KhungChoLuoiXe />
        ) : !trang.items.length ? (
          // Hiếm: owner_public vừa đếm được ≥1 tin lúc khối trên tải xong,
          // nhưng tin đó vừa hết hạn đúng lúc danh sách tải. Không crash,
          // chỉ nói thật là hiện chưa có gì để xem.
          <EmptyState icon={Users} title="Chủ xe này hiện không có xe cho thuê" />
        ) : (
          <>
            <div className="grid-cards">
              {trang.items.map((the) => (
                <TheXe key={the.id} the={the} bangDiaGioi={bangDiaGioi} />
              ))}
            </div>
            {trang.conNua && (
              <button type="button" className="btn btn-ghost" onClick={xemThem} disabled={dangThem}>
                {dangThem ? 'Đang tải…' : 'Xem thêm'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/** Khung chờ đúng hình dạng lưới thẻ xe thật — skeleton, không phải spinner. */
function KhungChoLuoiXe() {
  return (
    <div className="grid-cards" aria-busy="true" aria-label="Đang tải xe">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card">
          <Skeleton height={160} radius="0" />
          <div className="card-pad stack" style={{ gap: 'var(--sp-2)' }}>
            <Skeleton height={18} width="70%" />
            <Skeleton height={14} width="45%" />
          </div>
        </div>
      ))}
    </div>
  )
}
