import { BadgeCheck } from 'lucide-react'

// tone: verified | info | warn | danger | neutral
export default function Badge({ tone = 'neutral', icon: Icon, children }) {
  return (
    <span className={`badge badge-${tone}`}>
      {Icon && <Icon size={13} strokeWidth={2} />}
      {children}
    </span>
  )
}

/**
 * Tích xanh. Xét theo giấy tờ, MIỄN PHÍ — không bán bằng tiền.
 * Chỉ hiện khi `verified` đúng là true từ CSDL, không bao giờ hiện mặc định.
 */
export function VerifiedBadge({ verified }) {
  if (!verified) return null
  return (
    <Badge tone="verified" icon={BadgeCheck}>
      Đã xác minh
    </Badge>
  )
}
