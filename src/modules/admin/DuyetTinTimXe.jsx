import { useState, useEffect } from 'react'
import { Check, X, RefreshCw, AlertCircle, Calendar, MapPin, DollarSign, Car, User, Clock } from 'lucide-react'
import { getSupabase } from '../../lib/supabase'
import { adminXuLyTinTimXe } from '../requests/requestsApi'
import { moTaNganSach } from '../requests/nganSach'
import { PROVINCES } from '../../data/provinces'
import './DuyetTinTimXe.css'

export default function DuyetTinTimXe() {
  const [danhSach, setDanhSach] = useState([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState('')
  const [dangXuLyId, setDangXuLyId] = useState(null)

  async function taiHangCho() {
    setDangTai(true)
    setLoi('')
    try {
      const sb = await getSupabase()
      const { data, error } = await sb
        .from('customer_requests')
        .select('*')
        .eq('status', 'cho_duyet')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDanhSach(data || [])
    } catch (err) {
      setLoi('Lỗi khi tải hàng chờ: ' + err.message)
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    taiHangCho()
  }, [])

  async function handleDuyet(id) {
    setDangXuLyId(id)
    try {
      const res = await adminXuLyTinTimXe(id, true)
      if (res.ok) {
        setDanhSach(prev => prev.filter(item => item.id !== id))
      } else {
        alert('Lỗi duyệt: ' + res.error)
      }
    } catch (e) {
      alert('Lỗi hệ thống: ' + e.message)
    } finally {
      setDangXuLyId(null)
    }
  }

  async function handleTuChoi(id) {
    const lyDo = window.prompt('Nhập lý do từ chối bài đăng này:', 'Nội dung không phù hợp hoặc số điện thoại không hợp lệ')
    if (lyDo === null) return

    setDangXuLyId(id)
    try {
      const res = await adminXuLyTinTimXe(id, false, lyDo)
      if (res.ok) {
        setDanhSach(prev => prev.filter(item => item.id !== id))
      } else {
        alert('Lỗi từ chối: ' + res.error)
      }
    } catch (e) {
      alert('Lỗi hệ thống: ' + e.message)
    } finally {
      setDangXuLyId(null)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2>Hàng chờ duyệt tin tìm xe ({danhSach.length})</h2>
          <p className="admin-subtitle">
            Kiểm duyệt bài đăng tìm xe từ khách thuê trước khi hiển thị lên Bảng tin Cộng đồng. 
            Khi duyệt, hệ thống sẽ tự động gửi thông báo đến các chủ xe lân cận.
          </p>
        </div>
        <button 
          type="button" 
          className="btn btn-outline btn-sm" 
          onClick={taiHangCho}
          disabled={dangTai}
        >
          <RefreshCw size={14} className={dangTai ? 'spinning' : ''} />
          Làm mới
        </button>
      </div>

      {loi && (
        <div className="admin-alert alert-error">
          <AlertCircle size={16} />
          <span>{loi}</span>
        </div>
      )}

      {dangTai ? (
        <div className="admin-loading">Đang tải danh sách chờ duyệt...</div>
      ) : danhSach.length === 0 ? (
        <div className="admin-empty">
          <Check size={32} className="admin-empty-icon" />
          <h3>Không có tin nào đang chờ duyệt</h3>
          <p>Tất cả các bài đăng tìm xe từ khách đã được xử lý xong.</p>
        </div>
      ) : (
        <div className="admin-queue-list">
          {danhSach.map(item => (
            <div key={item.id} className="admin-queue-card">
              <div className="queue-card-head">
                <div className="queue-user-info">
                  <User size={16} />
                  <strong>{item.customer_name}</strong>
                  <span className="queue-phone">({item.customer_phone})</span>
                  <span className="queue-time">
                    <Clock size={12} />
                    {new Date(item.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="queue-card-actions">
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm btn-duyet"
                    onClick={() => handleDuyet(item.id)}
                    disabled={dangXuLyId === item.id}
                  >
                    <Check size={14} />
                    {dangXuLyId === item.id ? 'Đang duyệt...' : 'Duyệt bài'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-ghost btn-sm btn-tuchoi"
                    onClick={() => handleTuChoi(item.id)}
                    disabled={dangXuLyId === item.id}
                  >
                    <X size={14} />
                    Từ chối
                  </button>
                </div>
              </div>

              <div className="queue-criteria-grid">
                <div className="criteria-item">
                  <Calendar size={14} />
                  <span>{item.start_date} → {item.end_date}</span>
                </div>
                <div className="criteria-item">
                  <Car size={14} />
                  <span>{item.seats ? `${item.seats} chỗ` : 'Không chọn số chỗ'}</span>
                </div>
                <div className="criteria-item">
                  <MapPin size={14} />
                  {/* province_id = vị trí trong PROVINCES + 1 (đúng cách form lưu). */}
                  <span>{[item.address_text, PROVINCES[(item.province_id ?? 0) - 1]].filter(Boolean).join(', ') || 'Chưa chọn khu vực'}</span>
                </div>
                <div className="criteria-item">
                  <DollarSign size={14} />
                  <span>{moTaNganSach(item.budget_min, item.budget_max)}</span>
                </div>
                <div className="criteria-item">
                  <User size={14} />
                  <span>{item.consent_share_phone ? 'Đồng ý cho chủ xe xem số' : 'KHÔNG chia sẻ số'}</span>
                </div>
              </div>

              <div className="queue-content-box">
                <div className="queue-content-title">Nội dung bài viết:</div>
                <div className="queue-content-text">{item.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
