import { Inbox } from 'lucide-react'

/**
 * Trạng thái rỗng.
 *
 * Luật: thiếu dữ liệu thì ẩn CẢ KHỐI, không render ô trống.
 * Chỉ dùng khối này khi sự vắng mặt tự nó là thông tin có ý nghĩa —
 * ví dụ "Chưa có đánh giá nào". Tuyệt đối không lấp chỗ trống bằng dữ liệu mẫu.
 */
export default function EmptyState({ icon: Icon = Inbox, title, hint, action }) {
  return (
    <div className="empty">
      <Icon size={32} strokeWidth={1.8} />
      <div className="empty-title">{title}</div>
      {hint && <div className="t-small">{hint}</div>}
      {action}
    </div>
  )
}
