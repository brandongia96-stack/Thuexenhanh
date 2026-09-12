import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../modules/auth/AuthProvider'
import { canAccess } from '../modules/auth/rbac'
import { PageLoading } from './Loading'
import EmptyState from './EmptyState'
import { ShieldAlert } from 'lucide-react'

/**
 * Chặn điều hướng theo vai trò. Đây chỉ là lớp giao diện cho êm —
 * chặn thật nằm ở RLS phía Postgres. Không bao giờ tin lớp này là bảo mật.
 */
export default function RequireRole({ children }) {
  const { isLoggedIn, roles, loading } = useAuth()
  const { pathname } = useLocation()

  if (loading) return <PageLoading />
  if (!isLoggedIn) return <Navigate to="/dang-nhap" state={{ from: pathname }} replace />

  if (!canAccess(pathname, roles)) {
    return (
      <div className="page">
        <EmptyState
          icon={ShieldAlert}
          title="Bạn chưa có quyền vào mục này"
          hint="Nếu bạn là chủ xe, hãy đăng tin xe đầu tiên để mở khoá bảng điều khiển."
        />
      </div>
    )
  }

  return children
}
