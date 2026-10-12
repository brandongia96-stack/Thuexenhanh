import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone, Save, LogOut, ChevronRight, Heart, Car, CalendarDays, Wallet,
  MessageCircle, Settings, ArrowLeft, ShieldAlert, ShieldCheck, MapPin, RefreshCw,
  CheckCircle2, AlertCircle,
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useViTri } from '../../context/ViTriContext'
import { getSupabase } from '../../lib/supabase'
import { normalizePhone, isValidPhone } from '../../lib/phone'
import ModalXacThucSdt from '../trust/ModalXacThucSdt'
import './TrangTaiKhoan.css'

// Ảnh đại diện: dùng ảnh Google của chính người dùng nếu có, không thì chữ cái đầu.
function AnhDaiDien({ profile, size }) {
  const ten = profile?.full_name?.trim() || ''
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt=""
        width={size}
        height={size}
        className="tk-avatar"
        style={{ width: size, height: size, borderRadius: '50%' }}
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div
      className="tk-avatar"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--m-green-light)',
        color: 'var(--m-green-hover)',
        fontWeight: 700,
        fontSize: size / 2.5,
      }}
    >
      {(ten[0] || '?').toUpperCase()}
    </div>
  )
}

function MucMenu({ to, onClick, icon: Icon, chu }) {
  const noiDung = (
    <>
      <div className="tk-menu-item-left">
        <div className="tk-icon-box" style={{ color: 'var(--m-mid)' }}>
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <span className="tk-menu-text">{chu}</span>
      </div>
      <ChevronRight size={20} className="tk-chevron" />
    </>
  )
  return to ? (
    <Link to={to} className="tk-menu-item" style={{ color: 'inherit', textDecoration: 'none' }}>
      {noiDung}
    </Link>
  ) : (
    <div className="tk-menu-item" role="button" tabIndex={0} onClick={onClick}>
      {noiDung}
    </div>
  )
}

export default function TrangTaiKhoan() {
  const { profile, user, signOut, isOwner, reload, capNhatSoDienThoaiXacThuc } = useAuth()
  const { batViTri, doiBatViTri, viTri, dangLay: dangLayViTri, loiViTri, xinQuyenViTri } = useViTri()

  const [view, setView] = useState('menu') // 'menu' | 'profile'

  const [sdt, setSdt] = useState(profile?.phone || '')
  const [zalo, setZalo] = useState(profile?.zalo_phone || '')

  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState(null)
  const [thongBao, setThongBao] = useState(null)
  const [moModalOtp, setMoModalOtp] = useState(false)

  // Cập nhật giá trị khi profile thay đổi từ bên ngoài
  useEffect(() => {
    if (profile?.phone && !sdt) setSdt(profile.phone)
    if (profile?.zalo_phone && !zalo) setZalo(profile.zalo_phone)
  }, [profile])

  const normNhap = normalizePhone(sdt)
  const normHoSo = normalizePhone(profile?.phone)
  const daXacThucSdt = Boolean(profile?.phone_verified_at && normHoSo && normNhap === normHoSo)

  const luuThongTin = async (e) => {
    e.preventDefault()
    setLoi(null)
    setThongBao(null)
    setDangLuu(true)

    try {
      const norm = normalizePhone(sdt)
      const normZalo = normalizePhone(zalo)
      const sb = await getSupabase()
      const { error } = await sb
        .from('users')
        .update({
          phone: norm || null,
          zalo_phone: normZalo || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      await reload()
      setThongBao('Cập nhật thông tin thành công.')
    } catch (error) {
      setLoi(error.message || 'Không thể lưu thông tin. Vui lòng thử lại.')
    } finally {
      setDangLuu(false)
    }
  }

  const handleXacThucThanhCong = async (soDtMoi, verifiedAt) => {
    setSdt(soDtMoi)
    if (capNhatSoDienThoaiXacThuc) {
      capNhatSoDienThoaiXacThuc(soDtMoi, verifiedAt)
    }
    await reload()
    setThongBao(`Đã xác thực số điện thoại ${soDtMoi} thành công!`)
  }

  // ─── GIAO DIỆN HỒ SƠ CÁ NHÂN (CẬP NHẬT THÔNG TIN) ───
  if (view === 'profile') {
    return (
      <div className="page" style={{ maxWidth: 640, paddingBottom: 'var(--sp-12)' }}>
        <div className="row" style={{ gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)', alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ padding: 'var(--sp-2)' }} onClick={() => setView('menu')}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="t-h2" style={{ margin: 0 }}>Cập nhật thông tin</h1>
        </div>

        <div className="stack" style={{ gap: 'var(--sp-5)' }}>
          {/* Ô 1: THẺ AVATAR & THÔNG TIN TÀI KHOẢN */}
          <div
            className="card card-pad tk-the-ho-so row"
            style={{ gap: 'var(--sp-4)', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}
          >
            <AnhDaiDien profile={profile} size={96} />
            <div style={{ textAlign: 'center' }}>
              <h2 className="t-h3" style={{ margin: 0 }}>{profile?.full_name || 'Người dùng ẩn danh'}</h2>
              <div style={{ color: 'var(--m-subtle)', marginTop: 4, fontSize: 14 }}>{profile?.email}</div>
            </div>
          </div>

          {/* Ô 2: THẺ THÔNG TIN LIÊN HỆ */}
          <div className="card card-pad tk-the-ho-so">
            <h2 className="t-h3" style={{ marginBottom: 'var(--sp-4)', marginTop: 0 }}>
              Thông tin liên hệ
            </h2>

            <form onSubmit={luuThongTin} className="stack" style={{ gap: 'var(--sp-4)' }}>
              {loi && (
                <div className="loi-he-thong" style={{ margin: 0 }}>
                  <AlertCircle size={16} />
                  <span>{loi}</span>
                </div>
              )}
              {thongBao && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--m-green-light)',
                    color: 'var(--m-green-hover)',
                    borderRadius: 'var(--r-md)',
                    fontWeight: 500,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{thongBao}</span>
                </div>
              )}

              {/* TRƯỜNG: SỐ ĐIỆN THOẠI */}
              <div className="field">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <label className="field-label" htmlFor="tk-sdt" style={{ margin: 0 }}>
                    Số điện thoại
                  </label>
                  {daXacThucSdt ? (
                    <span className="badge badge-verified" style={{ gap: 4 }}>
                      <CheckCircle2 size={13} /> Đã xác thực
                    </span>
                  ) : (
                    <span className="badge badge-warn" style={{ gap: 4 }}>
                      <AlertCircle size={13} /> Chưa xác thực
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative', width: '100%' }}>
                  <Phone
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--m-subtle)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="tk-sdt"
                    type="tel"
                    className="input"
                    style={{ paddingLeft: 42, width: '100%' }}
                    value={sdt}
                    onChange={(e) => setSdt(e.target.value)}
                    placeholder="09xx xxx xxx"
                  />
                </div>

                <div
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--sp-2)',
                    marginTop: 2,
                  }}
                >
                  <span className="field-hint" style={{ margin: 0 }}>
                    {daXacThucSdt
                      ? 'Số điện thoại chính chủ để khách thuê / chủ xe liên hệ.'
                      : 'Bắt buộc xác thực số điện thoại để đăng tin cho thuê xe.'}
                  </span>

                  {!daXacThucSdt && (
                    <button
                      type="button"
                      className="btn btn-soft btn-sm"
                      style={{ height: 32, padding: '0 12px', fontSize: 13, gap: 5 }}
                      onClick={() => setMoModalOtp(true)}
                      disabled={!isValidPhone(sdt)}
                    >
                      <ShieldCheck size={15} />
                      Xác thực ngay
                    </button>
                  )}
                </div>
              </div>

              {/* TRƯỜNG: SỐ ZALO */}
              <div className="field">
                <label className="field-label" htmlFor="tk-zalo" style={{ margin: 0, marginBottom: 2 }}>
                  Số Zalo (tuỳ chọn)
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <MessageCircle
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--m-subtle)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="tk-zalo"
                    type="tel"
                    className="input"
                    style={{ paddingLeft: 42, width: '100%' }}
                    value={zalo}
                    onChange={(e) => setZalo(e.target.value)}
                    placeholder="09xx xxx xxx"
                  />
                </div>
                <span className="field-hint" style={{ marginTop: 2 }}>
                  Số Zalo để khách thuê nhắn tin trao đổi nhanh.
                </span>
              </div>

              <div className="row" style={{ marginTop: 'var(--sp-3)', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={dangLuu}>
                  <Save size={18} />
                  {dangLuu ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>

          {/* Ô 3: THẺ VỊ TRÍ & KHOẢNG CÁCH */}
          <div className="card card-pad tk-the-ho-so stack" style={{ gap: 'var(--sp-3)' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <MapPin size={20} color="var(--m-green)" />
                <h2 className="t-h3" style={{ margin: 0 }}>Vị trí &amp; Khoảng cách</h2>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={batViTri}
                aria-label="Bật tắt chia sẻ vị trí"
                className={`tk-cong-tac${batViTri ? ' bat' : ''}`}
                disabled={dangLayViTri}
                onClick={() => doiBatViTri(!batViTri)}
              >
                <span className="tk-cong-tac-nut" />
              </button>
            </div>

            <p className="t-small" style={{ color: 'var(--m-mid)', margin: 0 }}>
              {batViTri
                ? 'Đang bật định vị. Hệ thống dùng vị trí của bạn để tính số km tới từng chiếc xe trên các thẻ xe.'
                : 'Đang tắt định vị. Bật để xem các xe đang ở gần bạn nhất và khoảng cách chính xác.'}
            </p>

            {loiViTri && <div className="field-error">{loiViTri}</div>}

            {batViTri && (
              <div
                className="row"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 'var(--sp-3)',
                  borderTop: '1px solid var(--m-border)',
                }}
              >
                <span className="t-small" style={{ color: 'var(--m-subtle)' }}>
                  {viTri ? 'Đã lưu toạ độ vị trí hiện tại' : 'Chưa lấy được toạ độ'}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={dangLayViTri}
                  onClick={() => xinQuyenViTri()}
                >
                  <RefreshCw size={14} className={dangLayViTri ? 'fdt-quay' : ''} />
                  {dangLayViTri ? 'Đang cập nhật...' : 'Cập nhật lại GPS'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal xác thực OTP */}
        <ModalXacThucSdt
          open={moModalOtp}
          onClose={() => setMoModalOtp(false)}
          sdtBanDau={sdt || profile?.phone || ''}
          onThanhCong={handleXacThucThanhCong}
        />
      </div>
    )
  }

  // ─── GIAO DIỆN MENU CHÍNH ───
  return (
    <div className="tk-container">
      <div className="tk-menu-list">
        <div className="tk-menu-item tk-profile-header" onClick={() => setView('profile')}>
          <div className="tk-menu-item-left">
            <AnhDaiDien profile={profile} size={56} />
            <div className="tk-profile-info">
              <h3 className="tk-profile-name">{profile?.full_name || 'Người dùng ẩn danh'}</h3>
              <span className="tk-profile-role">{isOwner ? 'Chủ xe & Khách thuê' : 'Khách thuê'}</span>
            </div>
          </div>
          <ChevronRight size={20} className="tk-chevron" />
        </div>

        <div className="tk-divider" />
        <MucMenu to="/da-luu" icon={Heart} chu="Xe đã lưu" />

        {isOwner && (
          <>
            <div className="tk-divider" />
            <MucMenu to="/chu-xe" icon={Car} chu="Xe của tôi" />
            <MucMenu to="/chu-xe/lich" icon={CalendarDays} chu="Lịch xe" />
            <MucMenu to="/chu-xe/vi" icon={Wallet} chu="Ví token" />
          </>
        )}

        <div className="tk-divider" />
        <MucMenu to="/tai-khoan/khieu-nai" icon={ShieldAlert} chu="Khiếu nại của tôi" />
        <MucMenu to="/lien-he" icon={MessageCircle} chu="Liên hệ" />
        <MucMenu onClick={() => setView('profile')} icon={Settings} chu="Cài đặt thông tin" />
        <MucMenu onClick={() => setView('profile')} icon={MapPin} chu={`Vị trí: ${batViTri ? 'Đang bật' : 'Đang tắt'}`} />
        <MucMenu to="/tai-khoan/du-lieu" icon={ShieldCheck} chu="Dữ liệu & Quyền riêng tư" />
        <MucMenu onClick={signOut} icon={LogOut} chu="Thoát tài khoản" />
      </div>

      <div className="tk-version">
        Version: 0.2.0 (100)
      </div>
    </div>
  )
}
