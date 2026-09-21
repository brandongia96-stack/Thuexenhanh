// core/rbac — vai trò. Khớp enum user_role trong contracts/schema.sql.
// Đây chỉ là lớp điều hướng giao diện. Chặn thật nằm ở RLS phía Postgres.

export const ROLE = {
  KHACH: 'khach',
  CHU_XE: 'chu_xe',
  KIEM_DUYET: 'kiem_duyet',
  ADMIN: 'admin',
}

export const ROLE_LABEL = {
  khach: 'Khách thuê',
  chu_xe: 'Chủ xe',
  kiem_duyet: 'Kiểm duyệt',
  admin: 'Quản trị',
}

export function hasRole(roles, role) {
  return Array.isArray(roles) && roles.includes(role)
}

export function isStaff(roles) {
  return hasRole(roles, ROLE.KIEM_DUYET) || hasRole(roles, ROLE.ADMIN)
}

// Khách vào /chu-xe thì cần rủ nâng cấp, không phải chặn thẳng.
export function canAccess(path, roles) {
  if (path.startsWith('/quan-tri')) return hasRole(roles, ROLE.ADMIN)
  if (path.startsWith('/kiem-duyet')) return isStaff(roles)
  // Trang đăng tin mở cho MỌI tài khoản đã đăng nhập: đăng tin đầu tiên chính là
  // việc biến khách thành chủ xe. Vai trò `chu_xe` do trigger listings_grant_owner_role
  // (0010) cấp phía server khi bản nháp đầu được tạo — client không tự cấp được.
  if (path === '/chu-xe/dang-tin') return true
  if (path.startsWith('/chu-xe')) return hasRole(roles, ROLE.CHU_XE) || isStaff(roles)
  return true
}
