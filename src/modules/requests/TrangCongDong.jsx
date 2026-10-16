import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Users, Plus, Search, MapPin, Sparkles, Filter, 
  Car, Shield, CheckCircle2, ChevronRight, Zap, RefreshCw
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useViTri } from '../../context/ViTriContext'
import { PROVINCES } from '../../data/provinces'
import TheTinTimXe from './TheTinTimXe'
import { layDanhSachTinTimXe, layTinCuaToi, dongTinTimXe } from './requestsApi'
import './CongDong.css'

export default function TrangCongDong() {
  const { user, isOwner } = useAuth()
  const { viTri, batViTri, xinQuyenViTri } = useViTri()
  const navigate = useNavigate()

  // State tabs & lọc
  const [tabHienTai, setTabHienTai] = useState('tat_ca') // 'tat_ca' | 'gan_toi' | 'tin_cua_toi'
  const [locProvince, setLocProvince] = useState('')
  const [locSeats, setLocSeats] = useState('')
  
  // State dữ liệu
  const [danhSach, setDanhSach] = useState([])
  const [dangTai, setDangTai] = useState(true)
  const [dangLamMoi, setDangLamMoi] = useState(false)
  const [loi, setLoi] = useState('')

  // Tải danh sách bài đăng
  const taiDuLieu = useCallback(async (isRefresh = false) => {
    if (isRefresh) setDangLamMoi(true)
    else setDangTai(true)
    setLoi('')

    try {
      if (tabHienTai === 'tin_cua_toi') {
        if (!user) {
          setDanhSach([])
          setDangTai(false)
          setDangLamMoi(false)
          return
        }
        const res = await layTinCuaToi(user.id)
        if (res.error) setLoi(res.error)
        else setDanhSach(res.data)
      } else {
        const provIndex = locProvince ? PROVINCES.indexOf(locProvince) : -1
        const provinceId = provIndex >= 0 ? provIndex + 1 : null

        const dungToaDo = tabHienTai === 'gan_toi' && viTri?.lat && viTri?.lng

        const res = await layDanhSachTinTimXe({
          lat: dungToaDo ? viTri.lat : null,
          lng: dungToaDo ? viTri.lng : null,
          provinceId,
          seats: locSeats ? Number(locSeats) : null,
          limit: 30
        })

        if (res.error) setLoi(res.error)
        else setDanhSach(res.data)
      }
    } catch (err) {
      setLoi(err.message || 'Lỗi khi tải dữ liệu.')
    } finally {
      setDangTai(false)
      setDangLamMoi(false)
    }
  }, [tabHienTai, locProvince, locSeats, viTri, user])

  useEffect(() => {
    taiDuLieu()
  }, [taiDuLieu])

  function handleChonTabGanToi() {
    if (!viTri) {
      xinQuyenViTri(
        () => setTabHienTai('gan_toi'),
        (err) => alert(err || 'Cần bật định vị GPS để xem các tin gần bạn.')
      )
    } else {
      setTabHienTai('gan_toi')
    }
  }

  async function handleDongTin(id) {
    if (window.confirm('Bạn có chắc chắn muốn đóng tin này vì đã tìm được xe?')) {
      await dongTinTimXe(id)
      taiDuLieu(true)
    }
  }

  return (
    <div className="congdong-container">
      {/* 1. HERO BANNER */}
      <section className="congdong-hero">
        <div className="congdong-hero-badge">
          <Sparkles size={14} className="icon-sparkles" />
          <span>Bảng tin Mạng xã hội kết nối trực tiếp</span>
        </div>
        <h1 className="congdong-hero-title">
          Cộng đồng Tìm Xe Tự Lái
        </h1>
        <p className="congdong-hero-sub">
          Khách thuê đăng bài 5 tiêu chí nhanh gọn — Hàng ngàn chủ xe lân cận chủ động liên hệ & báo giá tốt nhất.
        </p>

        <div className="congdong-hero-actions">
          <Link to="/cong-dong/dang-tin" className="btn btn-primary btn-hero-dangtin">
            <Plus size={18} strokeWidth={2} />
            Đăng tin tìm xe (Miễn phí)
          </Link>
          <Link to="/chu-xe/dang-tin" className="btn btn-outline btn-hero-chothue">
            <Car size={18} />
            Tôi có xe cho thuê
          </Link>
        </div>
      </section>

      {/* 2. PRO OWNER BANNER (NẾU LÀ CHỦ XE) */}
      {isOwner && (
        <div className="congdong-pro-banner">
          <div className="pro-banner-left">
            <div className="pro-badge-icon">
              <Zap size={20} />
            </div>
            <div>
              <div className="pro-banner-title">
                Đặc quyền Gói Pro: Nhận Email tức thì khi có khách tìm xe gần bạn
              </div>
              <p className="pro-banner-sub">
                Chớp cơ hội đón khách sớm nhất khu vực. Đăng ký tiện lợi bằng Token trong ví của bạn.
              </p>
            </div>
          </div>
          <Link to="/chu-xe/vi" className="btn btn-sm btn-pro-action">
            Nâng cấp Gói Pro
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* 3. THANH TAB & BỘ LỌC */}
      <div className="congdong-toolbar">
        <div className="congdong-tabs">
          <button 
            type="button" 
            className={`tab-item ${tabHienTai === 'tat_ca' ? 'active' : ''}`}
            onClick={() => setTabHienTai('tat_ca')}
          >
            Mới nhất
          </button>
          <button 
            type="button" 
            className={`tab-item ${tabHienTai === 'gan_toi' ? 'active' : ''}`}
            onClick={handleChonTabGanToi}
          >
            <MapPin size={14} />
            Gần tôi nhất
          </button>
          {user && (
            <button 
              type="button" 
              className={`tab-item ${tabHienTai === 'tin_cua_toi' ? 'active' : ''}`}
              onClick={() => setTabHienTai('tin_cua_toi')}
            >
              Bài đăng của tôi
            </button>
          )}
        </div>

        <div className="congdong-filters">
          <select 
            value={locProvince} 
            onChange={e => setLocProvince(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả tỉnh thành</option>
            {PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select 
            value={locSeats} 
            onChange={e => setLocSeats(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả số chỗ</option>
            <option value="4">4 - 5 chỗ</option>
            <option value="7">7 chỗ gia đình</option>
            <option value="16">16 chỗ</option>
          </select>

          <button 
            type="button" 
            className="btn-lammoi" 
            onClick={() => taiDuLieu(true)}
            title="Làm mới bảng tin"
            disabled={dangLamMoi}
          >
            <RefreshCw size={15} className={dangLamMoi ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* 4. DANH SÁCH FEED */}
      <main className="congdong-feed">
        {dangTai ? (
          <div className="congdong-loading">
            <div className="spinner-sm" />
            <span>Đang tải các bài đăng tìm xe...</span>
          </div>
        ) : loi ? (
          <div className="congdong-loi-box">
            <p>{loi}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => taiDuLieu()}>
              Thử lại
            </button>
          </div>
        ) : danhSach.length === 0 ? (
          <div className="congdong-empty-state">
            <div className="empty-icon-wrap">
              <Search size={36} />
            </div>
            <h3>Chưa có bài đăng nào phù hợp</h3>
            <p>
              {tabHienTai === 'tin_cua_toi'
                ? 'Bạn chưa đăng bài tìm xe nào. Hãy tạo bài đăng để các chủ xe chủ động liên hệ.'
                : 'Chưa có yêu cầu tìm xe nào trong khu vực hoặc bộ lọc bạn chọn.'}
            </p>
            <Link to="/cong-dong/dang-tin" className="btn btn-primary btn-sm">
              <Plus size={16} />
              Đăng tin tìm xe ngay
            </Link>
          </div>
        ) : (
          <div className="congdong-list">
            {danhSach.map(item => (
              <div key={item.id} className="feed-item-wrapper">
                <TheTinTimXe request={item} onCapNhat={() => taiDuLieu(true)} />
                {tabHienTai === 'tin_cua_toi' && item.status !== 'da_tim_thay' && (
                  <div className="tin-cuatoi-actions">
                    <span className="badge-status-mine">Trạng thái: {item.status === 'cho_duyet' ? 'Chờ kiểm duyệt' : 'Đang hiển thị'}</span>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDongTin(item.id)}
                    >
                      <CheckCircle2 size={14} />
                      Đánh dấu đã tìm được xe
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
