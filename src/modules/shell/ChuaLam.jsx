import { Construction } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

/**
 * Chỗ giữ route cho module luồng sau.
 *
 * Nói thẳng là chưa làm, không vẽ giao diện giả để "cho đẹp".
 * Luồng sở hữu thay component này bằng màn hình thật.
 */
export default function ChuaLam({ ten, luong }) {
  return (
    <div className="page">
      <EmptyState
        icon={Construction}
        title={`${ten} chưa được dựng`}
        hint={`Màn hình này thuộc luồng ${luong}. Khung và hợp đồng dữ liệu đã sẵn sàng.`}
      />
    </div>
  )
}
