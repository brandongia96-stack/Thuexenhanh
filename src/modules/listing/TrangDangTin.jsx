// listing/TrangDangTin — trang đăng tin mới và sửa tin đã có.
//
// Route đã có sẵn trong App.jsx của luồng 01 (đang trỏ tạm vào <ChuaLam />):
//   /chu-xe/dang-tin   → đăng tin mới
//   /chu-xe/tin/:id    → sửa tin đã có
//
// Trang tự biết mình đang ở chế độ nào qua `:id` — không cần hai component.

import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { HAS_BACKEND } from '../../lib/config'
import { useFormDangTin } from './editor/useFormDangTin'
import FormDangTin from './editor/FormDangTin'
import KhoiHienThi from './lifecycle/KhoiHienThi'

export default function TrangDangTin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, loading, reload } = useAuth()

  const dieuKhien = useFormDangTin({
    listingId: id ?? null,
    ownerId: user?.id,
    sdtMacDinh: profile?.phone ?? '',
  })

  if (loading) {
    return (
      <div className="page stack" aria-busy="true">
        <div className="skeleton" style={{ height: 32, width: 200 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--r-lg)' }} />
      </div>
    )
  }

  // Chưa cấu hình backend: nói thật là chưa chạy được, đừng vẽ form rồi
  // để chủ xe điền hai mươi ô xong mới báo lỗi.
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
