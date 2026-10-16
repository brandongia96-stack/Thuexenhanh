import { useState, useEffect } from 'react'
import { X, Phone, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react'
import { xemLienHeKhach } from './requestsApi'
import { useAuth } from '../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import './ModalXemLienHe.css'

export default function ModalXemLienHe({ requestId, customerName, onClose }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [dangTai, setDangTai] = useState(true)
  const [duLieu, setDuLieu] = useState(null)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    if (!isLoggedIn) {
      setDangTai(false)
      return
    }

    async function layLienHe() {
      setDangTai(true)
      const res = await xemLienHeKhach(requestId)
      if (res?.ok) {
        setDuLieu(res)
      } else {
        setLoi(res?.error === 'chua_dang_nhap' 
          ? 'Vui lòng đăng nhập để xem thông tin liên hệ.' 
          : 'Không thể lấy thông tin liên hệ: ' + (res?.error || 'Lỗi hệ thống'))
      }
      setDangTai(false)
    }

    layLienHe()
  }, [requestId, isLoggedIn])

  return (
    <div className="modal-lienhe-overlay" onClick={onClose}>
      <div className="modal-lienhe-hop" onClick={e => e.stopPropagation()}>
        <button className="modal-lienhe-dong" onClick={onClose} aria-label="Đóng">
          <X size={18} strokeWidth={2} />
        </button>

        <div className="modal-lienhe-dau">
          <h3 className="modal-lienhe-tieude">Thông tin liên hệ khách thuê</h3>
          <p className="modal-lienhe-sub">Kết nối trực tiếp với <strong>{customerName || 'khách thuê'}</strong></p>
        </div>

        {!isLoggedIn ? (
          <div className="modal-lienhe-dangnhap">
            <p>Bạn cần đăng nhập để xem số điện thoại và kết nối trực tiếp với khách thuê.</p>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose()
                navigate('/dang-nhap?next=/cong-dong')
              }}
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : dangTai ? (
          <div className="modal-lienhe-loading">
            <div className="spinner-sm" />
            <span>Đang lấy số điện thoại...</span>
          </div>
        ) : loi ? (
          <div className="modal-lienhe-loi">
            <AlertCircle size={20} />
            <span>{loi}</span>
          </div>
        ) : (
          <div className="modal-lienhe-body">
            <div className="hop-so-dien-thoai">
              <span className="nhan-sdt">Số điện thoại / Zalo:</span>
              <span className="so-sdt">{duLieu.phone}</span>
            </div>

            <div className="modal-lienhe-actions">
              <a 
                href={`tel:${duLieu.phone}`} 
                className="btn btn-primary btn-action-call"
              >
                <Phone size={16} />
                Gọi điện ngay
              </a>

              {duLieu.zalo && (
                <a 
                  href={`https://zalo.me/${duLieu.zalo.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-zalo btn-action-zalo"
                >
                  <MessageSquare size={16} />
                  Nhắn qua Zalo
                </a>
              )}
            </div>

            <div className="luu-y-an-toan">
              <ShieldCheck size={16} className="icon-shield" />
              <span>
                Hai bên tự thoả thuận giá và kiểm tra giấy tờ khi giao xe. 
                Thuexenhanh không đứng giữa và không giữ tiền giao dịch.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
