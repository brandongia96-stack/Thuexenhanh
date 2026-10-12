// listing/TrangDangTin — trang đăng tin mới và sửa tin đã có.
//
// Route đã có sẵn trong App.jsx của luồng 01:
//   /chu-xe/dang-tin   → đăng tin mới
//   /chu-xe/tin/:id    → sửa tin đã có
//
// Trang tự biết mình đang ở chế độ nào qua `:id` — không cần hai component.
// Bắt buộc xác thực số điện thoại trước khi đăng tin mới.

import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShieldAlert, ShieldCheck, AlertCircle, PhoneCall } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { HAS_BACKEND } from '../../lib/config'
import { useFormDangTin } from './editor/useFormDangTin'
import FormDangTin from './editor/FormDangTin'
import KhoiHienThi from './lifecycle/KhoiHienThi'
import ModalXacThucSdt from '../trust/ModalXacThucSdt'

export default function TrangDangTin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, loading, reload, capNhatSoDienThoaiXacThuc } = useAuth()
  const [moModalOtp, setMoModalOtp] = useState(false)

  const daXacThucSdt = Boolean(profile?.phone && profile?.phone_verified_at)

  const dieuKhien = useFormDangTin({
    listingId: id ?? null,
    ownerId: user?.id,
    sdtMacDinh: profile?.phone ?? '',
    daXacThucSdt,
  })

  if (loading) {
    return (
      <div className="page stack" aria-busy="true">
        <div className="skeleton" style={{ height: 32, width: 200 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--r-lg)' }} />
      </div>
    )
  }

  // Chưa cấu hình backend
  if (!HAS_BACKEND) {
    return (
      <div className="page">
        <div className="empty">
          <span className="empty-title">Chưa kết nối cơ sở dữ liệu</span>
          <span className="t-small">Tạo file <code>.env</code> từ <code>.env.example</code> rồi chạy lại.</span>
        </div>
      </div>
    )
  }

  // Chưa đăng nhập
  if (!user) {
    return (
      <div className="page">
        <div className="empty">
          <span className="empty-title">Cần đăng nhập để đăng tin</span>
          <span className="t-small">Đăng nhập rồi quay lại đây là điền tiếp được.</span>
          <button className="btn btn-primary" onClick={() => navigate('/dang-nhap')}>
            Đăng nhập
          </button>
        </div>
      </div>
    )
  }

  // BẮT BUỘC: Đã đăng nhập nhưng CHƯA XÁC THỰC SỐ ĐIỆN THOẠI
  if (!daXacThucSdt) {
    return (
      <div className="page stack" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="row" style={{ marginBottom: 'var(--sp-4)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} strokeWidth={1.8} />
            Quay lại
          </button>
          <h1 className="t-h2" style={{ margin: 0 }}>Đăng xe cho thuê</h1>
        </div>

        <div
          className="card card-pad stack"
          style={{
            border: '1px solid var(--m-border)',
            textAlign: 'center',
            padding: 'var(--sp-8) var(--sp-6)',
            alignItems: 'center',
            gap: 'var(--sp-4)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--m-amber-bg, #FEF3C7)',
              color: 'var(--m-amber, #D97706)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto',
            }}
          >
            <PhoneCall size={32} />
          </div>

          <div className="stack" style={{ gap: 'var(--sp-2)' }}>
            <h2 className="t-h2" style={{ margin: 0 }}>Yêu cầu xác thực số điện thoại</h2>
            <p className="t-body" style={{ color: 'var(--m-mid)', maxWidth: 480, margin: '0 auto' }}>
              Để bảo vệ uy tín sàn giao dịch, phòng ngừa tin ảo và đảm bảo khách thuê luôn liên lạc trực tiếp được với bạn khi thuê xe, bạn cần <strong>xác thực số điện thoại chính chủ</strong> trước khi đăng tin.
            </p>
          </div>

          {profile?.phone ? (
            <div
              className="row"
              style={{
                background: 'var(--m-bg)',
                padding: '10px 16px',
                borderRadius: 'var(--r-md)',
                gap: 'var(--sp-3)',
                border: '1px solid var(--m-border)',
                alignItems: 'center',
              }}
            >
              <span className="t-small" style={{ color: 'var(--m-mid)' }}>Số điện thoại tài khoản:</span>
              <strong>{profile.phone}</strong>
              <span className="badge badge-warn" style={{ gap: 4 }}>
                <AlertCircle size={12} /> Chưa xác thực
              </span>
            </div>
          ) : (
            <p className="t-small" style={{ color: 'var(--m-subtle)' }}>
              Tài khoản của bạn hiện chưa có số điện thoại liên hệ.
            </p>
          )}

          <div className="row" style={{ gap: 'var(--sp-3)', marginTop: 'var(--sp-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setMoModalOtp(true)}
            >
              <ShieldCheck size={18} />
              {profile?.phone ? 'Xác thực số điện thoại ngay' : 'Thêm & xác thực số điện thoại'}
            </button>
            <Link to="/tai-khoan" className="btn btn-ghost">
              Cài đặt tài khoản
            </Link>
          </div>

          <p className="t-micro" style={{ color: 'var(--m-subtle)', marginTop: 'var(--sp-2)' }}>
            Xác thực cực nhanh trong 30 giây qua mã OTP. Sau khi xác thực, hệ thống sẽ mở form đăng tin ngay lập tức.
          </p>
        </div>

        {/* Modal OTP */}
        <ModalXacThucSdt
          open={moModalOtp}
          onClose={() => setMoModalOtp(false)}
          sdtBanDau={profile?.phone || ''}
          onThanhCong={async (phone, verifiedAt) => {
            if (capNhatSoDienThoaiXacThuc) {
              capNhatSoDienThoaiXacThuc(phone, verifiedAt)
            }
            await reload()
            setMoModalOtp(false)
          }}
        />
      </div>
    )
  }

  // ĐÃ XÁC THỰC SỐ ĐIỆN THOẠI → MỞ FORM ĐĂNG TIN
  return (
    <div className="page stack">
      <div className="row">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={1.8} />
          Quay lại
        </button>
        <h1 className="t-h1">{id ? 'Sửa tin đăng' : 'Đăng xe cho thuê'}</h1>
      </div>

      {/* Trả phí / gia hạn: chỉ mở HopTraPhi của luồng 06, không tự trừ token. */}
      <KhoiHienThi tin={dieuKhien.tin} userId={user.id} onDoiTrangThai={dieuKhien.taiLaiTin} />

      <FormDangTin
        dieuKhien={dieuKhien}
        onXong={async (listingId, viec) => {
          // Tin đầu tiên vừa biến khách thành chủ xe (trigger phía server). Nạp lại
          // vai trò TRƯỚC khi chuyển trang, nếu không RequireRole còn nhớ vai trò cũ
          // và chặn ngay trang sửa tin.
          if (!id) await reload()
          // Gửi duyệt xong thì về danh sách xe của tôi — chủ xe cần thấy tin
          // của mình đang ở trạng thái nào, chứ không phải ngồi lại trong form.
          if (viec === 'duyet') navigate('/chu-xe', { replace: true })
          else if (!id) navigate(`/chu-xe/tin/${listingId}`, { replace: true })
        }}
      />
    </div>
  )
}
