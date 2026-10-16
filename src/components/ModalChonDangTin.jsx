import { Car, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './ModalChonDangTin.css'

export default function ModalChonDangTin({ isOpen, onClose }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  function chon(duongDan) {
    onClose()
    navigate(duongDan)
  }

  return (
    <div className="modal-chon-dangtin-overlay" onClick={onClose}>
      <div className="modal-chon-dangtin-hop" onClick={e => e.stopPropagation()}>
        <button className="modal-chon-dangtin-dong" onClick={onClose} aria-label="Đóng">
          <X size={18} strokeWidth={2} />
        </button>

        <div className="modal-chon-dangtin-dau">
          <h3 className="modal-chon-dangtin-tieude">Bạn muốn đăng loại tin nào?</h3>
          <p className="modal-chon-dangtin-mota">
            Chọn nhu cầu của bạn để được kết nối chính xác và nhanh nhất.
          </p>
        </div>

        <div className="modal-chon-dangtin-danhsach">
          {/* Lựa chọn 1: Cho thuê xe */}
          <button 
            type="button" 
            className="modal-chon-item item-chothue"
            onClick={() => chon('/chu-xe/dang-tin')}
          >
            <div className="modal-chon-icon icon-chothue">
              <Car size={26} strokeWidth={1.8} />
            </div>
            <div className="modal-chon-noidung">
              <div className="modal-chon-nhan">
                <span className="modal-chon-ten">Cho thuê xe</span>
                <span className="badge-loaitin badge-chuxe">Dành cho chủ xe</span>
              </div>
              <p className="modal-chon-sub">
                Đăng xe của bạn lên sàn để kết nối hàng ngàn khách thuê tự lái.
              </p>
            </div>
          </button>

          {/* Lựa chọn 2: Cần tìm xe */}
          <button 
            type="button" 
            className="modal-chon-item item-timxe"
            onClick={() => chon('/cong-dong/dang-tin')}
          >
            <div className="modal-chon-icon icon-timxe">
              <Search size={26} strokeWidth={2} />
            </div>
            <div className="modal-chon-noidung">
              <div className="modal-chon-nhan">
                <span className="modal-chon-ten">Cần tìm xe</span>
                <span className="badge-loaitin badge-khach">Dành cho khách</span>
              </div>
              <p className="modal-chon-sub">
                Tạo bài đăng 5 tiêu chí trên Bảng tin Cộng đồng để chủ xe gần bạn chủ động báo giá.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
