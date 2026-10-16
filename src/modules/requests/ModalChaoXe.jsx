import { useState, useEffect } from 'react'
import { X, Car, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { danhSachXeCuaToi } from '../owner/ownerApi'
import { guiChaoXe } from './requestsApi'
import { formatVnd } from '../../lib/format'
import './ModalChaoXe.css'

export default function ModalChaoXe({ requestId, customerName, onClose, onSuccess }) {
  const { user } = useAuth()
  const [danhSachXe, setDanhSachXe] = useState([])
  const [dangTai, setDangTai] = useState(true)
  const [xeDuocChon, setXeDuocChon] = useState(null)
  const [giaDeXuat, setGiaDeXuat] = useState('')
  const [tinNhan, setTinNhan] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState('')
  const [thanhCong, setThanhCong] = useState(false)

  useEffect(() => {
    async function taiXe() {
      if (!user) return
      setDangTai(true)
      try {
        const res = await danhSachXeCuaToi(user.id, { nhom: 'hien_thi' })
        const ds = res?.danhSach || []
        setDanhSachXe(ds)
        if (ds.length > 0) {
          setXeDuocChon(ds[0].id)
          setGiaDeXuat(ds[0].price_per_day || '')
        }
      } catch (err) {
        setLoi('Không thể tải danh sách xe của bạn: ' + err.message)
      } finally {
        setDangTai(false)
      }
    }
    taiXe()
  }, [user])

  async function handleGuiOffer(e) {
    e.preventDefault()
    if (!xeDuocChon) {
      setLoi('Vui lòng chọn 1 xe của bạn để gợi ý.')
      return
    }

    setDangGui(true)
    setLoi('')
    try {
      const res = await guiChaoXe({
        requestId,
        ownerId: user.id,
        listingId: xeDuocChon,
        offerPrice: giaDeXuat ? Number(giaDeXuat) : null,
        message: tinNhan.trim()
      })

      if (res.error) {
        setLoi(res.error)
      } else {
        setThanhCong(true)
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      }
    } catch (err) {
      setLoi(err.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setDangGui(false)
    }
  }

  return (
    <div className="modal-chaoxe-overlay" onClick={onClose}>
      <div className="modal-chaoxe-hop" onClick={e => e.stopPropagation()}>
        <button className="modal-chaoxe-dong" onClick={onClose} aria-label="Đóng">
          <X size={18} strokeWidth={2} />
        </button>

        <div className="modal-chaoxe-dau">
          <h3 className="modal-chaoxe-tieude">Gợi ý xe của bạn cho khách</h3>
          <p className="modal-chaoxe-sub">
            Gửi báo giá và đề xuất xe cho <strong>{customerName || 'khách thuê'}</strong>
          </p>
        </div>

        {thanhCong ? (
          <div className="modal-chaoxe-thanhcong">
            <CheckCircle2 size={40} className="icon-success" />
            <h4>Đã gửi lời chào xe thành công!</h4>
            <p>Khách thuê sẽ nhìn thấy xe của bạn trong phần gợi ý của bài viết.</p>
          </div>
        ) : (
          <form onSubmit={handleGuiOffer} className="modal-chaoxe-form">
            {loi && (
              <div className="modal-chaoxe-alert">
                <AlertCircle size={16} />
                <span>{loi}</span>
              </div>
            )}

            <div className="form-group">
              <label>Chọn xe của bạn</label>
              {dangTai ? (
                <div className="chaoxe-loading">Đang tải danh sách xe...</div>
              ) : danhSachXe.length === 0 ? (
                <div className="chaoxe-empty">
                  Bạn chưa có xe nào đang hiển thị trên sàn để gợi ý.
                </div>
              ) : (
                <div className="chaoxe-xe-list">
                  {danhSachXe.map(car => (
                    <label 
                      key={car.id} 
                      className={`chaoxe-xe-item ${xeDuocChon === car.id ? 'active' : ''}`}
                    >
                      <input 
                        type="radio" 
                        name="car_select" 
                        checked={xeDuocChon === car.id}
                        onChange={() => {
                          setXeDuocChon(car.id)
                          setGiaDeXuat(car.price_per_day || '')
                        }}
                      />
                      <div className="chaoxe-xe-thumb">
                        {car.cover_thumb ? (
                          <img src={car.cover_thumb} alt="" />
                        ) : (
                          <Car size={20} />
                        )}
                      </div>
                      <div className="chaoxe-xe-info">
                        <span className="chaoxe-xe-ten">{car.brand_text} {car.model_text} {car.year ? `(${car.year})` : ''}</span>
                        <span className="chaoxe-xe-gia">{formatVnd(car.price_per_day)}/ngày</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Mức giá bạn đề xuất cho chuyến này (VNĐ/ngày)</label>
              <input 
                type="number" 
                placeholder="VD: 900000"
                value={giaDeXuat}
                onChange={e => setGiaDeXuat(e.target.value)}
                min="0"
                step="50000"
              />
            </div>

            <div className="form-group">
              <label>Lời nhắn gửi khách (tuỳ chọn)</label>
              <textarea 
                rows={3}
                placeholder="VD: Xe bên em có giao tận nơi cho anh, xe sạch sẽ bảo dưỡng đầy đủ..."
                value={tinNhan}
                onChange={e => setTinNhan(e.target.value)}
              />
            </div>

            <div className="modal-chaoxe-actions">
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={onClose}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-sm"
                disabled={dangGui || danhSachXe.length === 0}
              >
                <Send size={15} />
                {dangGui ? 'Đang gửi...' : 'Gửi lời chào xe'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
