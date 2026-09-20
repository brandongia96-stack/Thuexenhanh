import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

import { useAuth } from '../../auth/AuthProvider'
import EmptyState from '../../../components/EmptyState'
import { PageLoading } from '../../../components/Loading'
import { danhSachDaLuu } from './savedApi'
import TheXeDaLuu from './TheXeDaLuu'
import { taiTenDiaGioi } from '../diaGioi'
import { layDanhSach, nhoDanhSach, useNhoViTriCuon } from '../boNhoPhien'
import '../listing-page/TrangXe.css'
import './DaLuu.css'

const KHOA = 'da-luu'

/**
 * Trang "Xe đã lưu".
 *
 * Khác v0.1: danh sách này đọc từ CSDL thật. Bản cũ chỉ giữ trong state nên
 * tải lại trang là trắng, và `showFavorites` thậm chí không được truyền xuống
 * (CLAUDE.md mục 9).
 */
export default function TrangDaLuu() {
  const { isLoggedIn, loading: dangKiemTraDangNhap, user } = useAuth()
  const [trang, setTrang] = useState(() => layDanhSach(KHOA) ?? { items: [], conNua: false, cursor: null })
  const [bangDiaGioi, setBangDiaGioi] = useState(null)
  const [dangTai, setDangTai] = useState(() => !layDanhSach(KHOA))
  const [dangThem, setDangThem] = useState(false)

  // Quay lại từ trang chi tiết: hiện lại danh sách cũ TỨC THÌ, đúng chỗ đã cuộn.
  useNhoViTriCuon(KHOA, !dangTai)

  const tai = useCallback(async () => {
    if (!user?.id) return
    const kq = await danhSachDaLuu(user.id)
    setTrang(kq)
    nhoDanhSach(KHOA, kq)
    setDangTai(false)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    taiTenDiaGioi().then(setBangDiaGioi)
    // Có bản cũ thì hiện ngay rồi làm mới ngầm — stale-while-revalidate
    // (HIEU-NANG.md mục 5).
    tai().catch(() => setDangTai(false))
  }, [user?.id, tai])

  async function xemThem() {
    if (dangThem || !trang.conNua) return
    setDangThem(true)
    try {
      const kq = await danhSachDaLuu(user.id, { cursor: trang.cursor })
      const gop = {
        items: [...trang.items, ...kq.items],
        conNua: kq.conNua,
        cursor: kq.cursor,
      }
      setTrang(gop)
      nhoDanhSach(KHOA, gop)
    } finally {
      setDangThem(false)
    }
  }

  if (dangKiemTraDangNhap) return <PageLoading />

  if (!isLoggedIn) {
    return (
      <div className="page">
        <EmptyState
          icon={Heart}
          title="Đăng nhập để xem xe đã lưu"
          hint="Xe anh/chị lưu được giữ lại theo tài khoản, đổi máy vẫn còn."
          action={<Link to="/dang-nhap" className="btn btn-primary">Đăng nhập</Link>}
        />
      </div>
    )
  }

  if (dangTai) return <PageLoading />

  if (!trang.items.length) {
    return (
      <div className="page">
        <EmptyState
          icon={Heart}
          title="Chưa lưu xe nào"
          hint="Bấm hình trái tim ở tin xe để lưu lại, khỏi phải tìm lại từ đầu."
          action={<Link to="/thue-xe" className="btn btn-primary">Tìm xe</Link>}
        />
      </div>
    )
  }

  return (
    <div className="page stack">
      <h1 className="t-h1">Xe đã lưu</h1>

      <div className="grid-cards">
        {trang.items.map((the) => (
          <TheXeDaLuu key={the.id} the={the} bangDiaGioi={bangDiaGioi} />
        ))}
      </div>

      {trang.conNua && (
        <button type="button" className="btn btn-ghost" onClick={xemThem} disabled={dangThem}>
          {dangThem ? 'Đang tải…' : 'Xem thêm'}
        </button>
      )}
    </div>
  )
}
