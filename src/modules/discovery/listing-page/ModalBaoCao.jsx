import { useEffect, useState, useRef } from 'react'
import {
  AlertTriangle, X, UploadCloud, FileText, Image as ImageIcon,
  Trash2, Shield, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react'
import {
  guiBaoCao, SO_FILE_BANG_CHUNG_TOI_DA, CO_MOI_FILE_TOI_DA, LOAI_BANG_CHUNG,
} from './chiTietApi'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate, useLocation } from 'react-router-dom'
import './ModalBaoCao.css'

const LY_DO = [
  {
    id: 'gia_ao',
    label: 'Giá báo khác với giá đăng',
    desc: 'Chủ xe báo giá thuê thực tế cao hơn hoặc đòi phụ phí bất hợp lý',
  },
  {
    id: 'xe_ao',
    label: 'Xe không có thật hoặc đã bán',
    desc: 'Tin ảo, hình ảnh lấy trên mạng hoặc chủ xe báo đã bán/không có xe',
  },
  {
    id: 'lua_dao',
    label: 'Dấu hiệu lừa đảo / Đòi cọc trước',
    desc: 'Yêu cầu chuyển cọc trước nhưng từ chối ký hợp đồng hoặc gặp mặt',
  },
  {
    id: 'thong_tin_sai',
    label: 'Sai thông tin (sai đời xe, sai biển số)',
    desc: 'Xe thực tế khác với thông tin, hình ảnh hoặc giấy tờ công bố',
  },
  {
    id: 'khac',
    label: 'Lý do khác',
    desc: 'Nội dung hoặc hành vi khác vi phạm quy định nền tảng',
  },
]

function dinhDangDungLuong(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ModalBaoCao({ tin, dong }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef(null)

  const [lyDo, setLyDo] = useState('')
  const [chiTiet, setChiTiet] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState(null)
  const [thanhCong, setThanhCong] = useState(false)
  const [files, setFiles] = useState([])
  const [camKet, setCamKet] = useState(false)

  // Bắt đăng nhập mới được báo cáo
  useEffect(() => {
    if (!user) {
      navigate('/dang-nhap', { state: { quayLai: location.pathname + location.search } })
    }
  }, [user, navigate, location])

  // Đóng khi nhấn phím Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !dangGui) dong()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dong, dangGui])

  if (!user) return null

  function handleFileChange(e) {
    setLoi(null)
    const chon = Array.from(e.target.files || [])
    if (!chon.length) return

    const tongMoi = files.length + chon.length
    if (tongMoi > SO_FILE_BANG_CHUNG_TOI_DA) {
      setLoi(`Chỉ được tải lên tối đa ${SO_FILE_BANG_CHUNG_TOI_DA} file bằng chứng.`)
    }

    const hopLe = chon.filter((f) => {
      const dungLoai = LOAI_BANG_CHUNG.includes(f.type)
      const dungCo = f.size <= CO_MOI_FILE_TOI_DA
      return dungLoai && dungCo
    })

    if (hopLe.length !== chon.length) {
      setLoi('Chỉ nhận ảnh JPG/PNG/WEBP hoặc PDF, mỗi file ≤ 5MB. File không hợp lệ đã bị bỏ qua.')
    }

    setFiles((prev) => [...prev, ...hopLe].slice(0, SO_FILE_BANG_CHUNG_TOI_DA))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function xoaFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function xuLyGui(e) {
    e.preventDefault()
    if (!lyDo) {
      setLoi('Vui lòng chọn một lý do báo cáo.')
      return
    }
    if (lyDo === 'lua_dao' && files.length === 0) {
      setLoi('Báo cáo lừa đảo cần ít nhất 1 ảnh hoặc PDF làm bằng chứng.')
      return
    }
    if (!camKet) {
      setLoi('Vui lòng tích xác nhận cam kết thông tin trước khi gửi.')
      return
    }

    setDangGui(true)
    setLoi(null)
    try {
      await guiBaoCao(tin.id, user.id, lyDo, chiTiet, files)
      setThanhCong(true)
    } catch (err) {
      setLoi(err.message || 'Không thể gửi báo cáo. Vui lòng thử lại.')
    } finally {
      setDangGui(false)
    }
  }

  const tenXe = tin
    ? `${tin.brand_text || ''} ${tin.model_text || ''}${tin.year ? ` ${tin.year}` : ''}`.trim()
    : ''

  return (
    <div
      className="modal-baocao-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !dangGui) dong()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-baocao-title"
    >
      <div className="modal-baocao-card">
        {/* Header */}
        <div className="modal-baocao-header">
          <div className="modal-baocao-header-left">
            <div className="mbc-icon-wrap" aria-hidden="true">
              <AlertTriangle size={20} />
            </div>
            <div className="mbc-header-text">
              <h2 id="modal-baocao-title" className="mbc-header-title">
                Báo cáo tin đăng
              </h2>
              {tenXe && <span className="mbc-header-sub">Xe: {tenXe}</span>}
            </div>
          </div>
          <button
            type="button"
            className="mbc-close-btn"
            onClick={dong}
            disabled={dangGui}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nội dung */}
        {thanhCong ? (
          <div className="mbc-success-view">
            <div className="mbc-success-icon" aria-hidden="true">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="t-h2">Gửi báo cáo thành công</h3>
            <p className="mbc-success-desc">
              Cảm ơn bạn đã phản ánh giúp cộng đồng thuê xe an toàn hơn. Đội ngũ kiểm duyệt sẽ xem xét nội dung trong thời gian sớm nhất. Tin nhận đủ 3 báo cáo vi phạm độc lập sẽ tạm thời được ẩn để xác minh.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={dong}
            >
              Đã hiểu
            </button>
          </div>
        ) : (
          <form onSubmit={xuLyGui} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="modal-baocao-body">
              {/* Lý do */}
              <div className="mbc-reasons" role="radiogroup" aria-label="Lý do báo cáo">
                <div className="field-label">
                  Lý do báo cáo <span className="mbc-bat-buoc">*</span>
                </div>
                {LY_DO.map((l) => {
                  const chon = lyDo === l.id
                  return (
                    <div
                      key={l.id}
                      role="radio"
                      aria-checked={chon}
                      tabIndex={0}
                      className={`mbc-reason-item${chon ? ' mbc-reason-selected' : ''}`}
                      onClick={() => setLyDo(l.id)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault()
                          setLyDo(l.id)
                        }
                      }}
                    >
                      <div className="mbc-radio-circle" aria-hidden="true">
                        {chon && <div className="mbc-radio-dot" />}
                      </div>
                      <div className="mbc-reason-content">
                        <span className="mbc-reason-label">{l.label}</span>
                        <span className="mbc-reason-desc">{l.desc}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Chi tiết thêm */}
              <div className="field">
                <label className="field-label" htmlFor="mbc-chi-tiet">
                  Chi tiết thêm <span className="field-hint">(tuỳ chọn)</span>
                </label>
                <textarea
                  id="mbc-chi-tiet"
                  className="textarea"
                  rows={3}
                  placeholder="Ví dụ: Gọi điện thì chủ xe bảo xe giá này nhưng đòi thêm phụ phí 200k/ngày..."
                  value={chiTiet}
                  onChange={(e) => setChiTiet(e.target.value)}
                  disabled={dangGui}
                />
              </div>

              {/* Bằng chứng */}
              <div className="field">
                <div className="field-label">
                  Bằng chứng {lyDo === 'lua_dao' ? <span className="mbc-bat-buoc">(bắt buộc với tin lừa đảo)</span> : <span className="field-hint">(tuỳ chọn)</span>}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={LOAI_BANG_CHUNG.join(',')}
                  multiple
                  disabled={dangGui || files.length >= SO_FILE_BANG_CHUNG_TOI_DA}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {files.length < SO_FILE_BANG_CHUNG_TOI_DA && (
                  <div
                    className="mbc-upload-dropzone"
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                  >
                    <UploadCloud size={24} className="mbc-upload-icon" aria-hidden="true" />
                    <div className="mbc-upload-info">
                      <span className="mbc-upload-title">
                        Tải lên hình ảnh hoặc PDF (tối đa {SO_FILE_BANG_CHUNG_TOI_DA} file, ≤ 5MB)
                      </span>
                      <span className="mbc-upload-hint">
                        Chụp tin nhắn, ảnh xe thực tế hoặc biên nhận đặt cọc
                      </span>
                    </div>
                  </div>
                )}

                {files.length > 0 && (
                  <div className="mbc-file-list">
                    {files.map((f, idx) => (
                      <div key={`${f.name}-${idx}`} className="mbc-file-item">
                        <div className="mbc-file-left">
                          {f.type === 'application/pdf' ? (
                            <FileText size={16} color="var(--m-mid)" aria-hidden="true" />
                          ) : (
                            <ImageIcon size={16} color="var(--m-mid)" aria-hidden="true" />
                          )}
                          <span className="mbc-file-name" title={f.name}>
                            {f.name}
                          </span>
                          <span className="mbc-file-size">({dinhDangDungLuong(f.size)})</span>
                        </div>
                        <button
                          type="button"
                          className="mbc-file-remove"
                          onClick={() => xoaFile(idx)}
                          disabled={dangGui}
                          title="Gỡ file này"
                          aria-label={`Gỡ file ${f.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mbc-privacy-note">
                  <Shield size={14} aria-hidden="true" />
                  <span>
                    Chỉ đội ngũ Thuê Xe Nhanh xem được để bảo vệ quyền lợi người dùng. Vui lòng che số CCCD, tài khoản và thông tin nhạy cảm.
                  </span>
                </div>
              </div>

              {/* Cam kết */}
              <label className="mbc-camket-box">
                <input
                  type="checkbox"
                  className="mbc-camket-input"
                  checked={camKet}
                  onChange={(e) => setCamKet(e.target.checked)}
                  disabled={dangGui}
                />
                <span>
                  Tôi cam kết thông tin cung cấp là đúng sự thật và chịu trách nhiệm nếu cố tình phản ánh sai sự thật.
                </span>
              </label>

              {/* Lỗi */}
              {loi && (
                <div className="mbc-error-alert" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{loi}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-baocao-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={dong}
                disabled={dangGui}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={dangGui || !lyDo || !camKet || (lyDo === 'lua_dao' && files.length === 0)}
              >
                {dangGui ? (
                  <>
                    <Loader2 size={16} className="mbc-spin" aria-hidden="true" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi báo cáo'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
