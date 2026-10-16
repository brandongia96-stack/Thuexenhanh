import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, Car, MapPin, DollarSign, CheckCircle2, 
  Copy, Send, ArrowLeft, Sparkles, Navigation, Info, ShieldCheck, Check
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useViTri } from '../../context/ViTriContext'
import { PROVINCES, districtsOf } from '../../data/provinces'
import { sinhNoiDungTimXe, tinhSoNgay } from './autoTextGenerator'
import { taoTinTimXe } from './requestsApi'
import './FormDangTinTimXe.css'

export default function FormDangTinTimXe() {
  const { user, profile } = useAuth()
  const { viTri, xinQuyenViTri, dangLay } = useViTri()
  const navigate = useNavigate()

  // Ngày mặc định: ngày mai -> ngày kia
  const homNay = new Date()
  const ngayMai = new Date(homNay)
  ngayMai.setDate(homNay.getDate() + 1)
  const ngayKia = new Date(homNay)
  ngayKia.setDate(homNay.getDate() + 3)

  const fmtDate = d => d.toISOString().split('T')[0]

  // State 5 Tiêu chí
  // 1. Ngày
  const [startDate, setStartDate] = useState(fmtDate(ngayMai))
  const [endDate, setEndDate] = useState(fmtDate(ngayKia))

  // 2. Xe
  const [seats, setSeats] = useState('7')
  const [bodyStyle, setBodyStyle] = useState('suv')
  const [transmission, setTransmission] = useState('tu_dong')
  const [fuel, setFuel] = useState('bat_ky')

  // 3. Vị trí
  const [province, setProvince] = useState('TP.HCM')
  const [district, setDistrict] = useState('')
  const [addressText, setAddressText] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)

  // 4. Ngân sách
  const [budgetOption, setBudgetOption] = useState('700k_1tr')
  const [budgetCustom, setBudgetCustom] = useState('')

  // 5. Yêu cầu thêm
  const [extraTags, setExtraTags] = useState(['giao_tan_noi', 'sach_se'])
  const [customNote, setCustomNote] = useState('')

  // Thông tin liên hệ
  const [customerName, setCustomerName] = useState(profile?.full_name || '')
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '')
  const [dongYChiaSeSdt, setDongYChiaSeSdt] = useState(true)

  // Chỉnh sửa văn bản sinh tự động
  const [contentCustom, setContentCustom] = useState(null)
  const [dangSuaText, setDangSuaText] = useState(false)

  // Trạng thái thao tác
  const [dangGui, setDangGui] = useState(false)
  const [daCopy, setDaCopy] = useState(false)
  const [loi, setLoi] = useState('')
  const [thanhCong, setThanhCong] = useState(false)

  // Đồng bộ khi có toạ độ từ ViTriContext
  useEffect(() => {
    if (viTri?.lat && viTri?.lng) {
      setLat(viTri.lat)
      setLng(viTri.lng)
    }
  }, [viTri])

  // Tự động sinh nội dung
  const autoText = useMemo(() => {
    return sinhNoiDungTimXe({
      startDate,
      endDate,
      seats,
      bodyStyle,
      transmission,
      fuel,
      provinceName: province,
      districtName: district,
      addressText,
      budgetOption,
      budgetCustom: Number(budgetCustom) || 0,
      extraTags,
      customNote
    })
  }, [
    startDate, endDate, seats, bodyStyle, transmission, fuel,
    province, district, addressText, budgetOption, budgetCustom,
    extraTags, customNote
  ])

  // Nội dung cuối cùng hiển thị và gửi đi
  const finalContent = contentCustom !== null ? contentCustom : autoText

  function toggleTag(tag) {
    setExtraTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function handleLayViTriHienTai() {
    xinQuyenViTri(
      (pos) => {
        setLat(pos.lat)
        setLng(pos.lng)
      },
      (err) => {
        alert(err || 'Không thể lấy vị trí hiện tại.')
      }
    )
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(finalContent)
      setDaCopy(true)
      setTimeout(() => setDaCopy(false), 2500)
    } catch {
      alert('Không thể sao chép tự động. Bạn vui lòng bôi đen và nhấn Copy.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoi('')

    if (!user) {
      navigate('/dang-nhap?next=/cong-dong/dang-tin')
      return
    }

    if (!customerPhone.trim()) {
      setLoi('Vui lòng nhập số điện thoại để chủ xe có thể liên hệ.')
      return
    }

    if (!dongYChiaSeSdt) {
      setLoi('Bạn cần đồng ý cho phép hiển thị thông tin liên hệ khi chủ xe bấm xem.')
      return
    }

    setDangGui(true)
    try {
      // Tìm province_id tương ứng
      const provIndex = PROVINCES.indexOf(province)
      const provinceId = provIndex >= 0 ? provIndex + 1 : 1

      const ketQua = await taoTinTimXe({
        customerId: user.id,
        customerName: customerName.trim() || 'Khách thuê',
        customerPhone: customerPhone.trim(),
        customerZalo: customerPhone.trim(),
        customerAvatar: profile?.avatar_url || null,
        startDate,
        endDate,
        seats,
        transmission,
        fuel,
        bodyStyle,
        provinceId,
        districtId: null, // Lưu cấp tỉnh/quận text
        addressText: [addressText, district].filter(Boolean).join(', '),
        lat,
        lng,
        budgetMin: budgetOption === 'duoi_700k' ? 0 : 700000,
        budgetMax: budgetOption === 'duoi_700k' ? 700000 : 2500000,
        budgetNegotiable: true,
        extraTags,
        customNote,
        content: finalContent
      })

      if (ketQua.error) {
        setLoi('Không thể gửi bài: ' + ketQua.error)
      } else {
        setThanhCong(true)
      }
    } catch (err) {
      setLoi(err.message || 'Có lỗi xảy ra, vui lòng thử lại sau.')
    } finally {
      setDangGui(false)
    }
  }

  // Màn hình hoàn tất
  if (thanhCong) {
    return (
      <div className="dangtin-timxe-wrap">
        <div className="dangtin-timxe-card thanh-cong-box">
          <div className="icon-thanh-cong">
            <CheckCircle2 size={48} strokeWidth={2} />
          </div>
          <h2>Đã gửi bài đăng tìm xe thành công!</h2>
          <p className="thanh-cong-desc">
            Bài viết của bạn đã được chuyển vào hàng chờ kiểm duyệt (thường dưới 15 phút).
            Hệ thống sẽ tự động gửi thông báo đến các chủ xe lân cận khu vực của bạn ngay khi bài được duyệt.
          </p>

          <div className="thanh-cong-actions">
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => navigate('/cong-dong')}
            >
              Về Bảng tin Cộng đồng
            </button>
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={handleCopy}
            >
              <Copy size={16} />
              {daCopy ? 'Đã sao chép nội dung!' : 'Sao chép bài viết'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dangtin-timxe-wrap">
      <div className="dangtin-timxe-header">
        <button 
          type="button" 
          className="btn-back" 
          onClick={() => navigate(-1)}
          aria-label="Quay lại"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="dangtin-timxe-title">Đăng tin tìm xe tự lái</h1>
          <p className="dangtin-timxe-sub">
            Chọn nhanh 5 tiêu chí bên dưới, hệ thống sẽ tự động soạn bài đăng chuẩn và thông báo đến các chủ xe lân cận.
          </p>
        </div>
      </div>

      {loi && (
        <div className="dangtin-timxe-alert alert-error">
          <Info size={18} />
          <span>{loi}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="dangtin-timxe-form">
        {/* TIÊU CHÍ 1: THỜI GIAN THUÊ */}
        <div className="dangtin-section">
          <div className="dangtin-section-head">
            <div className="section-badge">1</div>
            <div>
              <h3 className="section-title">Thời gian thuê xe</h3>
              <p className="section-desc">Bạn dự kiến nhận xe và trả xe vào ngày nào?</p>
            </div>
          </div>

          <div className="dangtin-grid-2">
            <div className="form-group">
              <label>Ngày nhận xe</label>
              <div className="input-with-icon">
                <Calendar size={18} className="icon-field" />
                <input 
                  type="date" 
                  value={startDate} 
                  min={fmtDate(homNay)}
                  onChange={e => {
                    setStartDate(e.target.value)
                    if (e.target.value > endDate) setEndDate(e.target.value)
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ngày trả xe</label>
              <div className="input-with-icon">
                <Calendar size={18} className="icon-field" />
                <input 
                  type="date" 
                  value={endDate} 
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="chip-songay">
            Tổng thời gian dự kiến: <strong>{tinhSoNgay(startDate, endDate)} ngày</strong>
          </div>
        </div>

        {/* TIÊU CHÍ 2: NHU CẦU DÒNG XE */}
        <div className="dangtin-section">
          <div className="dangtin-section-head">
            <div className="section-badge">2</div>
            <div>
              <h3 className="section-title">Nhu cầu dòng xe</h3>
              <p className="section-desc">Số chỗ ngồi, kiểu dáng và loại số bạn mong muốn</p>
            </div>
          </div>

          <div className="form-group">
            <label>Số chỗ ngồi</label>
            <div className="chip-group">
              {[
                { val: '4', label: '4-5 chỗ' },
                { val: '7', label: '7 chỗ gia đình' },
                { val: 'ban_tai', label: 'Bán tải' },
                { val: '16', label: '16 chỗ' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  className={`chip-btn ${seats === opt.val ? 'active' : ''}`}
                  onClick={() => setSeats(opt.val)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="dangtin-grid-3">
            <div className="form-group">
              <label>Kiểu dáng xe</label>
              <select value={bodyStyle} onChange={e => setBodyStyle(e.target.value)}>
                <option value="bat_ky">Bất kỳ kiểu dáng</option>
                <option value="suv">SUV / Gầm cao</option>
                <option value="sedan">Sedan</option>
                <option value="mpv">MPV đa dụng</option>
                <option value="ban_tai">Bán tải</option>
                <option value="hatchback">Hatchback nhỏ gọn</option>
              </select>
            </div>

            <div className="form-group">
              <label>Hộp số</label>
              <select value={transmission} onChange={e => setTransmission(e.target.value)}>
                <option value="tu_dong">Số tự động</option>
                <option value="so_san">Số sàn</option>
                <option value="bat_ky">Bất kỳ</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nhiên liệu</label>
              <select value={fuel} onChange={e => setFuel(e.target.value)}>
                <option value="bat_ky">Bất kỳ</option>
                <option value="xang">Máy xăng</option>
                <option value="dau">Máy dầu (tiết kiệm)</option>
                <option value="dien">Xe điện (VF3, VF5, VF8...)</option>
              </select>
            </div>
          </div>
        </div>

        {/* TIÊU CHÍ 3: VỊ TRÍ NHẬN XE */}
        <div className="dangtin-section">
          <div className="dangtin-section-head">
            <div className="section-badge">3</div>
            <div>
              <h3 className="section-title">Khu vực nhận xe</h3>
              <p className="section-desc">Hệ thống sẽ ưu tiên gửi thông báo tới chủ xe trong khu vực này</p>
            </div>
          </div>

          <div className="vitri-btn-wrap">
            <button 
              type="button" 
              className="btn btn-outline btn-sm btn-layvitri"
              onClick={handleLayViTriHienTai}
              disabled={dangLay}
            >
              <Navigation size={15} />
              {dangLay ? 'Đang xác định vị trí...' : (lat ? 'Đã gán toạ độ GPS của bạn' : 'Dùng vị trí hiện tại của tôi')}
            </button>
          </div>

          <div className="dangtin-grid-2">
            <div className="form-group">
              <label>Tỉnh / Thành phố</label>
              <select 
                value={province} 
                onChange={e => {
                  setProvince(e.target.value)
                  setDistrict('')
                }}
              >
                {PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quận / Huyện (nếu có)</label>
              <select 
                value={district} 
                onChange={e => setDistrict(e.target.value)}
                disabled={districtsOf(province).length === 0}
              >
                <option value="">Chọn Quận / Huyện</option>
                {districtsOf(province).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Địa điểm cụ thể hoặc điểm hẹn (tuỳ chọn)</label>
            <input 
              type="text" 
              placeholder="VD: Chung cư Sunrise City, Sân bay Tân Sơn Nhất, Bến xe..."
              value={addressText}
              onChange={e => setAddressText(e.target.value)}
            />
          </div>
        </div>

        {/* TIÊU CHÍ 4: NGÂN SÁCH DỰ KIẾN */}
        <div className="dangtin-section">
          <div className="dangtin-section-head">
            <div className="section-badge">4</div>
            <div>
              <h3 className="section-title">Ngân sách dự kiến</h3>
              <p className="section-desc">Mức giá bạn mong muốn thuê mỗi ngày</p>
            </div>
          </div>

          <div className="chip-group">
            {[
              { val: 'duoi_700k', label: '< 700k/ngày' },
              { val: '700k_1tr', label: '700k – 1 triệu' },
              { val: '1tr_1tr5', label: '1 – 1.5 triệu' },
              { val: '1tr5_2tr5', label: '1.5 – 2.5 triệu' },
              { val: 'thoa_thuan', label: 'Thoả thuận' }
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                className={`chip-btn ${budgetOption === opt.val ? 'active' : ''}`}
                onClick={() => setBudgetOption(opt.val)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* TIÊU CHÍ 5: YÊU CẦU THÊM */}
        <div className="dangtin-section">
          <div className="dangtin-section-head">
            <div className="section-badge">5</div>
            <div>
              <h3 className="section-title">Yêu cầu & Tiện ích thêm</h3>
              <p className="section-desc">Chọn các yêu cầu đặc biệt của chuyến đi (chọn nhiều ô)</p>
            </div>
          </div>

          <div className="tag-checkbox-grid">
            {[
              { id: 'giao_tan_noi', label: '🚀 Giao xe tận nơi' },
              { id: 'mien_the_chap', label: '🔑 Miễn cọc xe máy' },
              { id: 'sach_se', label: '✨ Xe sạch sẽ, không mùi' },
              { id: 'doi_moi', label: '🛡️ Xe đời mới' },
              { id: 'di_tinh', label: '🛣️ Đi tỉnh / về quê' },
              { id: 'free_sac', label: '⚡ Xe điện Free sạc' },
              { id: 'co_tai', label: '👨‍✈️ Thuê có tài xế' }
            ].map(item => (
              <label 
                key={item.id} 
                className={`tag-checkbox-card ${extraTags.includes(item.id) ? 'checked' : ''}`}
              >
                <input 
                  type="checkbox" 
                  checked={extraTags.includes(item.id)}
                  onChange={() => toggleTag(item.id)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Ghi chú riêng thêm cho chủ xe (tuỳ chọn)</label>
            <input 
              type="text" 
              placeholder="VD: Cần ghế an toàn trẻ em, gia đình mang theo 2 vali lớn..."
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
            />
          </div>
        </div>

        {/* THÔNG TIN LIÊN HỆ */}
        <div className="dangtin-section">
          <h3 className="section-title" style={{ marginBottom: 12 }}>Thông tin liên hệ của bạn</h3>
          <div className="dangtin-grid-2">
            <div className="form-group">
              <label>Họ và tên</label>
              <input 
                type="text" 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Tên của bạn"
                required
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại / Zalo</label>
              <input 
                type="tel" 
                value={customerPhone} 
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="09xx xxx xxx"
                required
              />
            </div>
          </div>

          <label className="dong-y-checkbox">
            <input 
              type="checkbox" 
              checked={dongYChiaSeSdt}
              onChange={e => setDongYChiaSeSdt(e.target.checked)}
              required
            />
            <span>
              Tôi đồng ý để các chủ xe có xe phù hợp bấm nút <strong>"Xem liên hệ"</strong> để kết nối và báo giá trực tiếp.
            </span>
          </label>
        </div>

        {/* KHỐI XEM TRƯỚC BÀI VIẾT (AUTO TEXT PREVIEW) */}
        <div className="dangtin-preview-box">
          <div className="dangtin-preview-head">
            <div className="preview-label">
              <Sparkles size={18} className="icon-sparkles" />
              <span>Nội dung bài viết tự động sinh ra</span>
            </div>
            <button 
              type="button" 
              className="btn-toggle-edit"
              onClick={() => {
                if (!dangSuaText && contentCustom === null) {
                  setContentCustom(autoText)
                }
                setDangSuaText(!dangSuaText)
              }}
            >
              {dangSuaText ? 'Xong sửa' : 'Chỉnh sửa chữ'}
            </button>
          </div>

          {dangSuaText ? (
            <textarea 
              className="preview-textarea"
              rows={8}
              value={contentCustom !== null ? contentCustom : autoText}
              onChange={e => setContentCustom(e.target.value)}
            />
          ) : (
            <div className="preview-content-view">
              {finalContent}
            </div>
          )}

          <div className="preview-actions">
            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              onClick={handleCopy}
            >
              {daCopy ? <Check size={16} /> : <Copy size={16} />}
              {daCopy ? 'Đã sao chép!' : 'Sao chép để đăng Facebook / Zalo'}
            </button>

            <button 
              type="submit" 
              className="btn btn-primary btn-submit-feed"
              disabled={dangGui}
            >
              <Send size={16} />
              {dangGui ? 'Đang gửi duyệt...' : 'Đăng bài lên Bảng tin'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
