import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Car,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Users,
  DollarSign,
  Activity,
  LifeBuoy,
  Trash2,
  FolderLock,
  ArrowRight,
  Clock,
  CheckCircle2,
  Fuel,
  TrendingDown,
  RefreshCw,
} from 'lucide-react'
import {
  hangDuyet,
  choXetTichXanh,
  baoCaoChuaXuLy,
  hangDoiKhieuNai,
  hangDoiYeuCauGo,
  yeuCauXoaTaiKhoan,
} from './adminApi'
import { formatVnd, timeAgo } from '../../lib/format'
import { Skeleton } from '../../components/Loading'

export default function TongQuan() {
  const [dangTai, setDangTai] = useState(true)
  const [thongKe, setThongKe] = useState({
    tinChoDuyet: [],
    tichXanh: [],
    baoCao: [],
    khieuNai: [],
    yeuCauGo: [],
    xoaTaiKhoan: [],
  })

  async function taiDuLieu() {
    setDangTai(true)
    try {
      const [tin, tx, bc, kn, yg, xtk] = await Promise.allSettled([
        hangDuyet({ limit: 10 }),
        choXetTichXanh(),
        baoCaoChuaXuLy(),
        hangDoiKhieuNai(),
        hangDoiYeuCauGo(),
        yeuCauXoaTaiKhoan(),
      ])

      setThongKe({
        tinChoDuyet: tin.status === 'fulfilled' ? tin.value?.items ?? [] : [],
        tichXanh: tx.status === 'fulfilled' ? tx.value ?? [] : [],
        baoCao: bc.status === 'fulfilled' ? bc.value ?? [] : [],
        khieuNai: kn.status === 'fulfilled' ? kn.value ?? [] : [],
        yeuCauGo: yg.status === 'fulfilled' ? yg.value ?? [] : [],
        xoaTaiKhoan: xtk.status === 'fulfilled' ? xtk.value ?? [] : [],
      })
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    taiDuLieu()
  }, [])

  const soTinCho = thongKe.tinChoDuyet.length
  const soTichXanh = thongKe.tichXanh.length
  const soBaoCao = thongKe.baoCao.length
  const soKhieuNai = thongKe.khieuNai.length
  const soPhapLy = thongKe.yeuCauGo.length + thongKe.xoaTaiKhoan.length

  const tongViecCanLam = soTinCho + soTichXanh + soBaoCao + soKhieuNai + soPhapLy

  return (
    <div className="ad-tongquan-wrap">
      {/* Banner chào mừng & tóm tắt */}
      <div className="ad-banner-chao">
        <div className="ad-banner-trai">
          <h2 className="ad-banner-tieude">Tổng quan bảng điều khiển</h2>
          <p className="ad-banner-mota">
            Hệ thống đang có{' '}
            <strong className={tongViecCanLam > 0 ? 'ad-chu-canhbao' : 'ad-chu-ok'}>
              {tongViecCanLam} đầu việc
            </strong>{' '}
            cần xem xét và xử lý.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm ad-btn-lammoi"
          onClick={taiDuLieu}
          disabled={dangTai}
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={15} className={dangTai ? 'xoay' : ''} />
          Làm mới
        </button>
      </div>

      {/* ─── HÀNG CHỈ SỐ NHANH (KPI CARDS) ─── */}
      <div className="ad-kpi-grid">
        {/* Tin xe chờ duyệt */}
        <Link to="/admin/duyet-tin" className="ad-kpi-card">
          <div className="ad-kpi-dau">
            <span className="ad-kpi-nhan">Tin xe chờ duyệt</span>
            <div className={`ad-kpi-icon ${soTinCho > 0 ? 'amber' : 'neutral'}`}>
              <Car size={20} />
            </div>
          </div>
          <div className="ad-kpi-so">{dangTai ? <Skeleton style={{ height: 32, width: 60 }} /> : soTinCho}</div>
          <div className="ad-kpi-duoi">
            <span>{soTinCho > 0 ? 'Cần duyệt kiểm tra thông tin' : 'Đã duyệt hết'}</span>
            <ArrowRight size={14} className="ad-kpi-arrow" />
          </div>
        </Link>

        {/* Tích xanh giấy tờ */}
        <Link to="/admin/duyet-giay-to" className="ad-kpi-card">
          <div className="ad-kpi-dau">
            <span className="ad-kpi-nhan">Hồ sơ Tích Xanh</span>
            <div className={`ad-kpi-icon ${soTichXanh > 0 ? 'blue' : 'neutral'}`}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="ad-kpi-so">{dangTai ? <Skeleton style={{ height: 32, width: 60 }} /> : soTichXanh}</div>
          <div className="ad-kpi-duoi">
            <span>{soTichXanh > 0 ? 'Chủ xe chờ xét duyệt CCCD' : 'Không có hồ sơ chờ'}</span>
            <ArrowRight size={14} className="ad-kpi-arrow" />
          </div>
        </Link>

        {/* Báo cáo vi phạm */}
        <Link to="/admin/bao-cao" className="ad-kpi-card">
          <div className="ad-kpi-dau">
            <span className="ad-kpi-nhan">Báo cáo vi phạm</span>
            <div className={`ad-kpi-icon ${soBaoCao > 0 ? 'red' : 'neutral'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="ad-kpi-so">{dangTai ? <Skeleton style={{ height: 32, width: 60 }} /> : soBaoCao}</div>
          <div className="ad-kpi-duoi">
            <span>{soBaoCao > 0 ? 'Báo cáo từ khách / chủ xe' : 'Hàng chờ sạch'}</span>
            <ArrowRight size={14} className="ad-kpi-arrow" />
          </div>
        </Link>

        {/* Khiếu nại mở */}
        <Link to="/admin/khieu-nai" className="ad-kpi-card">
          <div className="ad-kpi-dau">
            <span className="ad-kpi-nhan">Khiếu nại chưa đóng</span>
            <div className={`ad-kpi-icon ${soKhieuNai > 0 ? 'purple' : 'neutral'}`}>
              <Scale size={20} />
            </div>
          </div>
          <div className="ad-kpi-so">{dangTai ? <Skeleton style={{ height: 32, width: 60 }} /> : soKhieuNai}</div>
          <div className="ad-kpi-duoi">
            <span>{soKhieuNai > 0 ? 'Có thời hạn xử lý luật định' : 'Không có khiếu nại'}</span>
            <ArrowRight size={14} className="ad-kpi-arrow" />
          </div>
        </Link>
      </div>

      {/* ─── CÁC PHÂN HỆ QUẢN TRỊ THEO SECTION ─── */}
      <div className="ad-sections-grid">
        {/* Section 1: Kiểm duyệt & Xe */}
        <div className="ad-sec-box">
          <div className="ad-sec-header">
            <div className="ad-sec-icon-wrap blue">
              <Car size={18} />
            </div>
            <div>
              <h3 className="ad-sec-title">Kiểm duyệt & Quản lý xe</h3>
              <p className="ad-sec-desc">Tin đăng xe, giấy tờ kiểm định và quy định giá</p>
            </div>
          </div>
          <div className="ad-sec-links">
            <Link to="/admin/duyet-tin" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Duyệt tin xe</strong>
                <span>Duyệt tin đăng mới và cập nhật của chủ xe</span>
              </div>
              {soTinCho > 0 && <span className="ad-pill amber">{soTinCho} chờ</span>}
            </Link>
            <Link to="/admin/duyet-giay-to" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Duyệt hồ sơ Tích Xanh</strong>
                <span>Xét duyệt căn cước & cà vẹt để cấp tích xanh miễn phí</span>
              </div>
              {soTichXanh > 0 && <span className="ad-pill blue">{soTichXanh} hồ sơ</span>}
            </Link>
            <Link to="/admin/gia-san" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Quản lý Giá sàn</strong>
                <span>Cài đặt ngưỡng cảnh báo phá giá và bất thường</span>
              </div>
              <TrendingDown size={16} className="ad-sec-link-arrow" />
            </Link>
            <Link to="/admin/gia-nhien-lieu" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Giá nhiên liệu tham chiếu</strong>
                <span>Cập nhật bảng giá xăng, dầu và điện theo kỳ</span>
              </div>
              <Fuel size={16} className="ad-sec-link-arrow" />
            </Link>
          </div>
        </div>

        {/* Section 2: Pháp lý & Khiếu nại */}
        <div className="ad-sec-box">
          <div className="ad-sec-header">
            <div className="ad-sec-icon-wrap red">
              <Scale size={18} />
            </div>
            <div>
              <h3 className="ad-sec-title">Pháp lý & Giải quyết khiếu nại</h3>
              <p className="ad-sec-desc">Tuân thủ pháp luật, bảo vệ dữ liệu và giải quyết tranh chấp</p>
            </div>
          </div>
          <div className="ad-sec-links">
            <Link to="/admin/bao-cao" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Báo cáo vi phạm</strong>
                <span>Xử lý phản ánh tin ảo, sai giá, lừa đảo</span>
              </div>
              {soBaoCao > 0 && <span className="ad-pill red">{soBaoCao} mới</span>}
            </Link>
            <Link to="/admin/khieu-nai" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Hàng đợi khiếu nại</strong>
                <span>Quản lý tranh chấp có mã số hồ sơ và hạn luật định</span>
              </div>
              {soKhieuNai > 0 && <span className="ad-pill purple">{soKhieuNai} mở</span>}
            </Link>
            <Link to="/admin/yeu-cau-go" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Yêu cầu gỡ thông tin</strong>
                <span>Gỡ nội dung xâm phạm quyền tác giả hoặc dữ liệu cá nhân</span>
              </div>
              {thongKe.yeuCauGo.length > 0 && <span className="ad-pill amber">{thongKe.yeuCauGo.length}</span>}
            </Link>
            <Link to="/admin/cung-cap-du-lieu" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Sổ cung cấp dữ liệu cơ quan</strong>
                <span>Lưu vết các yêu cầu từ cơ quan chức năng</span>
              </div>
              <FolderLock size={16} className="ad-sec-link-arrow" />
            </Link>
            <Link to="/admin/xoa-tai-khoan" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Yêu cầu xóa tài khoản</strong>
                <span>Theo dõi hàng đợi xóa vĩnh viễn theo quyền cá nhân</span>
              </div>
              {thongKe.xoaTaiKhoan.length > 0 && <span className="ad-pill red">{thongKe.xoaTaiKhoan.length}</span>}
            </Link>
          </div>
        </div>

        {/* Section 3: Người dùng & Doanh thu */}
        <div className="ad-sec-box">
          <div className="ad-sec-header">
            <div className="ad-sec-icon-wrap green">
              <Users size={18} />
            </div>
            <div>
              <h3 className="ad-sec-title">Tài khoản & Ví Token</h3>
              <p className="ad-sec-desc">Quản lý thành viên, ví token nạp và doanh thu nền tảng</p>
            </div>
          </div>
          <div className="ad-sec-links">
            <Link to="/admin/nguoi-dung" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Người dùng & Ví token</strong>
                <span>Tra cứu tài khoản, điều chỉnh token tay, khóa/mở vi phạm</span>
              </div>
              <ArrowRight size={16} className="ad-sec-link-arrow" />
            </Link>
            <Link to="/admin/doanh-thu" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Báo cáo doanh thu</strong>
                <span>Thống kê token nạp/tiêu, biểu đồ và đối soát sổ ví</span>
              </div>
              <DollarSign size={16} className="ad-sec-link-arrow" />
            </Link>
          </div>
        </div>

        {/* Section 4: Vận hành & Hệ thống */}
        <div className="ad-sec-box">
          <div className="ad-sec-header">
            <div className="ad-sec-icon-wrap teal">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="ad-sec-title">Vận hành & Giám sát</h3>
              <p className="ad-sec-desc">Danh bạ cứu hộ toàn quốc và sức khỏe dịch vụ nền tảng</p>
            </div>
          </div>
          <div className="ad-sec-links">
            <Link to="/admin/cuu-ho" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Danh bạ cứu hộ toàn quốc</strong>
                <span>Cập nhật số điện thoại các đơn vị cứu hộ 63 tỉnh thành</span>
              </div>
              <LifeBuoy size={16} className="ad-sec-link-arrow" />
            </Link>
            <Link to="/admin/suc-khoe" className="ad-sec-link">
              <div className="ad-sec-link-info">
                <strong>Sức khỏe hệ thống</strong>
                <span>Giám sát Edge Function, tiến trình Cron và nhật ký lỗi</span>
              </div>
              <Activity size={16} className="ad-sec-link-arrow" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── HÀNG ĐỢI VIỆC GẤP (PRIORITY ITEMS) ─── */}
      {soTinCho > 0 && (
        <div className="ad-sec-box" style={{ marginTop: 'var(--sp-4)' }}>
          <div className="ad-sec-header">
            <div className="ad-sec-icon-wrap amber">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="ad-sec-title">Tin xe chờ duyệt mới nhất</h3>
              <p className="ad-sec-desc">Ưu tiên duyệt sớm để chủ xe có thể xuất bản tin</p>
            </div>
          </div>
          <div className="ad-hang-cho-list">
            {thongKe.tinChoDuyet.slice(0, 4).map((tin) => (
              <div key={tin.id} className="ad-hang-cho-item">
                <div className="ad-hang-cho-trai">
                  {tin.listing_images?.[0]?.url_thumb ? (
                    <img
                      src={tin.listing_images[0].url_thumb}
                      alt=""
                      className="ad-hang-cho-thumb"
                      width={64}
                      height={48}
                    />
                  ) : (
                    <div className="ad-hang-cho-nothumb">
                      <Car size={20} />
                    </div>
                  )}
                  <div>
                    <h4 className="ad-hang-cho-ten">
                      {tin.brand_text} {tin.model_text} {tin.year ? `(${tin.year})` : ''}
                    </h4>
                    <div className="t-small" style={{ color: 'var(--m-mid)' }}>
                      Giá: <strong>{formatVnd(tin.price_per_day)}/ngày</strong> · Gửi {timeAgo(tin.created_at)}
                    </div>
                  </div>
                </div>
                <Link to="/admin/duyet-tin" className="btn btn-sm btn-ghost">
                  Duyệt tin →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
