// admin/account-deletion — yêu cầu xoá tài khoản (account_deletion_requests, 0023).
//
// CHỈ ĐỌC: cron `thuc_hien_xoa_tai_khoan` thực hiện xoá thật sau 7 ngày chờ.
// Dòng `cho_xu_ly_token` nghĩa là ví còn token — cron đã DỪNG LẠI, không tự
// xoá. Quản trị viên phải hoàn token theo Chính sách hoàn token (ở tab
// "Người dùng & ví") TRƯỚC, cron đêm sau mới xoá tiếp.

import EmptyState from '../../components/EmptyState'
import { Skeleton } from '../../components/Loading'
import Badge from '../../components/Badge'
import { formatDateTime, formatPhone } from '../../lib/format'
import { yeuCauXoaTaiKhoan } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

const NHAN = { cho: 'Chờ 7 ngày', cho_xu_ly_token: 'Ví còn token — cần xử lý tay', da_xoa: 'Đã xoá', da_huy: 'Đã huỷ yêu cầu' }
const TONE = { cho: 'neutral', cho_xu_ly_token: 'warn', da_xoa: 'danger', da_huy: 'neutral' }

export default function XoaTaiKhoan() {
  const { data, loi, dangTai } = useTai(() => yeuCauXoaTaiKhoan())

  if (dangTai && !data) return <Skeleton height={160} />
  if (loi) return <div className="ad-loi">Không tải được danh sách: {thongDiepLoi(loi)}</div>
  if (data.length === 0) return <EmptyState title="Không có yêu cầu xoá tài khoản nào" />

  const canXuLy = data.filter((r) => r.status === 'cho_xu_ly_token')

  return (
    <div className="stack" style={{ gap: 'var(--sp-4)' }}>
      {canXuLy.length > 0 && (
        <div className="ad-canh-bao" role="alert">
          {canXuLy.length} tài khoản xin xoá nhưng ví còn token — cron đã dừng, hoàn token xong mới xoá tiếp được.
        </div>
      )}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="ad-bang">
          <thead><tr><th>Người dùng</th><th>Yêu cầu lúc</th><th>Thực hiện sau</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className={r.status === 'cho_xu_ly_token' ? 'chon' : ''}>
                <td>{r.user?.full_name || formatPhone(r.user?.phone) || r.user?.email || r.user_id.slice(0, 8)}</td>
                <td>{formatDateTime(r.requested_at)}</td>
                <td>{formatDateTime(r.execute_after)}</td>
                <td><Badge tone={TONE[r.status]}>{NHAN[r.status] ?? r.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
