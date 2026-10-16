import { useState, useEffect, useRef } from 'react'
import {
  ShieldCheck, Phone, X, AlertCircle, CheckCircle2,
  RefreshCw, ArrowRight,
} from 'lucide-react'
import { normalizePhone, isValidPhone } from '../../lib/phone'
import { guiOtp, xacThucOtp } from './trustApi'
import './ModalXacThucSdt.css'

export default function ModalXacThucSdt({
  open,
  onClose,
  sdtBanDau = '',
  onThanhCong,
}) {
  const [sdt, setSdt] = useState(sdtBanDau || '')
  const [buoc, setBuoc] = useState(1) // 1: Nhập/Xác nhận SĐT, 2: Nhập OTP
  const [otp, setOtp] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [dangXacNhan, setDangXacNhan] = useState(false)
  const [demNguoc, setDemNguoc] = useState(0)
  const [loi, setLoi] = useState(null)
  const [thanhCong, setThanhCong] = useState(false)

  const otpInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      const initPhone = sdtBanDau || ''
      setSdt(initPhone)
      setOtp('')
      setLoi(null)
      setThanhCong(false)
      setBuoc(1)
    }
  }, [open, sdtBanDau])

  useEffect(() => {
    if (demNguoc <= 0) return
    const timer = setInterval(() => {
      setDemNguoc((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [demNguoc])

  useEffect(() => {
    if (buoc === 2 && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [buoc])

  if (!open) return null

  const handleGuiOtp = async (e) => {
    if (e) e.preventDefault()
    setLoi(null)

    const norm = normalizePhone(sdt)
    if (!norm || !isValidPhone(norm)) {
      setLoi('Số điện thoại không đúng định dạng 10 chữ số (VD: 0901234567)')
      return
    }

    setDangGui(true)
    try {
      await guiOtp(norm)
      setBuoc(2)
      setDemNguoc(60)
    } catch (err) {
      setLoi(err?.message || 'Không thể gửi mã OTP, vui lòng thử lại sau.')
    } finally {
      setDangGui(false)
    }
  }

  const handleXacNhanOtp = async (e) => {
    if (e) e.preventDefault()
    setLoi(null)

    const cleanOtp = String(otp || '').trim()
    if (!cleanOtp) {
      setLoi('Vui lòng nhập 6 chữ số mã xác thực OTP')
      return
    }

    setDangXacNhan(true)
    try {
      const norm = normalizePhone(sdt)
      const res = await xacThucOtp(norm, cleanOtp)
      setThanhCong(true)

      const verifiedAt = res?.phone_verified_at || new Date().toISOString()
      setTimeout(() => {
        if (onThanhCong) {
          onThanhCong(norm, verifiedAt)
        }
        onClose()
      }, 1200)
    } catch (err) {
      setLoi(err?.message || 'Mã OTP không chính xác. Bạn thử lại nhé.')
    } finally {
      setDangXacNhan(false)
    }
  }

  return (
    <div
      className="modal-otp-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !dangXacNhan && !dangGui) {
          onClose()
        }
      }}
    >
      <div className="modal-otp-card" role="dialog" aria-modal="true" aria-labelledby="modal-otp-title">
        {/* Header */}
        <div className="modal-otp-header">
          <div className="modal-otp-header-left">
            <div className="modal-otp-icon-wrap">
              <ShieldCheck size={20} />
            </div>
            <h2 id="modal-otp-title" className="modal-otp-title">Xác thực số điện thoại</h2>
          </div>
          <button
            type="button"
            className="modal-otp-close"
            onClick={onClose}
            aria-label="Đóng"
            disabled={dangXacNhan || dangGui}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung */}
        <div className="modal-otp-body">
          {thanhCong ? (
            <div className="modal-otp-success-state">
              <div className="modal-otp-success-icon">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="t-h3" style={{ margin: 0, color: 'var(--m-dark)' }}>
                Xác thực thành công!
              </h3>
              <p className="t-small" style={{ color: 'var(--m-mid)', marginTop: 'var(--sp-2)' }}>
                Số điện thoại <strong>{normalizePhone(sdt)}</strong> đã được ghi nhận chính chủ.
              </p>
            </div>
          ) : buoc === 1 ? (
            <form onSubmit={handleGuiOtp}>
              <p className="modal-otp-desc">
                Mã xác thực OTP gồm 6 chữ số sẽ được gửi qua SMS đến số điện thoại của bạn để kích hoạt quyền đăng tin.
              </p>

              {loi && (
                <div className="modal-otp-error" role="alert">
                  <AlertCircle size={16} flexShrink={0} />
                  <span>{loi}</span>
                </div>
              )}

              <div className="modal-otp-input-wrap">
                <Phone size={18} className="modal-otp-input-icon" />
                <input
                  type="tel"
                  className="modal-otp-input"
                  placeholder="Nhập số điện thoại (VD: 0912345678)"
                  value={sdt}
                  onChange={(e) => setSdt(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-otp-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={onClose}
                  disabled={dangGui}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={dangGui || !isValidPhone(sdt)}
                >
                  {dangGui ? (
                    <>
                      <RefreshCw size={16} className="fdt-quay" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      Nhận mã OTP
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleXacNhanOtp}>
              <p className="modal-otp-desc">
                Vui lòng nhập mã OTP 6 chữ số vừa được gửi tới số{' '}
                <strong>{normalizePhone(sdt)}</strong>:
              </p>

              {loi && (
                <div className="modal-otp-error" role="alert">
                  <AlertCircle size={16} flexShrink={0} />
                  <span>{loi}</span>
                </div>
              )}

              <div className="modal-otp-input-wrap">
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="modal-otp-code-input"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-otp-resend-row">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0 6px', height: 28, fontSize: 13 }}
                  onClick={() => setBuoc(1)}
                  disabled={dangXacNhan}
                >
                  Đổi số điện thoại khác
                </button>

                {demNguoc > 0 ? (
                  <span style={{ color: 'var(--m-subtle)' }}>
                    Gửi lại mã sau <strong>{demNguoc}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '0 8px', height: 28, fontSize: 13, color: 'var(--m-green)' }}
                    onClick={() => handleGuiOtp()}
                    disabled={dangGui || dangXacNhan}
                  >
                    Gửi lại mã OTP
                  </button>
                )}
              </div>

              <div className="modal-otp-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={onClose}
                  disabled={dangXacNhan}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={dangXacNhan || otp.length < 6}
                >
                  {dangXacNhan ? (
                    <>
                      <RefreshCw size={16} className="fdt-quay" />
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Xác nhận OTP
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
