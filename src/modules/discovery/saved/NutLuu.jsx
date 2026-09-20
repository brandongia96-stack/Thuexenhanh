import { useNavigate, useLocation } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useLuuXe } from './useLuuXe'

/**
 * Nút tim "Lưu xe". Dùng chung cho trang chi tiết và thẻ xe ở luồng 04.
 *
 * Bấm là đổi màu NGAY (optimistic), API chạy ngầm, hỏng thì hoàn lại —
 * HIEU-NANG.md mục 6. Chưa đăng nhập thì đưa sang trang đăng nhập và nhớ
 * đường quay lại, chứ không im lặng nuốt cú bấm như v0.1.
 */
export default function NutLuu({ tin, kieu = 'nut' }) {
  const { daLuu, canDangNhap, loi, batTat } = useLuuXe(tin)
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  function bam(e) {
    e.preventDefault()
    e.stopPropagation()
    if (canDangNhap) {
      navigate('/dang-nhap', { state: { quayLai: pathname + search } })
      return
    }
    batTat()
  }

  return (
    <button
      type="button"
      className={`nutluu nutluu-${kieu}` + (daLuu ? ' daluu' : '')}
      onClick={bam}
      aria-pressed={daLuu}
      aria-label={daLuu ? 'Bỏ lưu xe' : 'Lưu xe'}
      title={loi ?? (daLuu ? 'Bỏ lưu' : 'Lưu xe')}
    >
      <Heart size={18} strokeWidth={2} fill={daLuu ? 'currentColor' : 'none'} />
      {kieu === 'nut' && <span>{daLuu ? 'Đã lưu' : 'Lưu xe'}</span>}
    </button>
  )
}
