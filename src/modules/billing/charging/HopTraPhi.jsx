import { useMemo, useState } from 'react'
import { Check, Wallet } from 'lucide-react'
import Hop from '../Hop'
import HopNapToken from '../topup/HopNapToken'
import { traPhiHienThi } from '../billingApi'
import { GOI_HIEN_THI } from '../../../lib/pricing'
import { formatVnd, formatDate } from '../../../lib/format'

/**
 * Trả phí hiển thị cho một tin — dùng cho cả lần đăng đầu và gia hạn.
 *
 * Hộp này là NƠI DUY NHẤT trong app trừ token của chủ xe. Luồng 02 và 03 gọi
 * vào đây, không tự gọi Edge Function, để chỉ có một chỗ phải kiểm lại khi
 * mô hình giá đổi.
 *
 * Giá hiển thị ở đây chỉ để người ta đọc. Số token thật do server tính lại từ
 * số tháng — client không được là nguồn sự thật của giá.
 */
export default function HopTraPhi({ listing, soDu = 0, onDong, onXong }) {
  const [months, setMonths] = useState(1)
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState(null)
  const [moNap, setMoNap] = useState(false)
  const [xong, setXong] = useState(null)

  const goi = useMemo(
    () => GOI_HIEN_THI.find((g) => g.months === months) ?? GOI_HIEN_THI[0],
    [months],
  )
  const thieu = Math.max(goi.tokens - soDu, 0)
  const laGiaHan = Boolean(listing?.published_at)

  // Hết hạn dự kiến: gia hạn khi tin CÒN hạn thì nối tiếp, không cắt ngắn phần
  // đã trả. Con số này phải khớp với `greatest(expires_at, now())` phía server —
  // lệch là giao diện nói dối chủ xe về ngày hết hạn.
  const hetHanMoi = useMemo(() => {
    const cu = listing?.expires_at ? new Date(listing.expires_at) : null
    const goc = cu && cu > new Date() ? cu : new Date()
    const d = new Date(goc)
    d.setMonth(d.getMonth() + months)
    return d.toISOString()
  }, [listing?.expires_at, months])

  const traPhi = async () => {
    setDangGui(true)
    setLoi(null)
    try {
      const kq = await traPhiHienThi({ listingId: listing.id, months })
      setXong(kq)
      onXong?.(kq)
    } catch (e) {
      // `khong_du_token` không phải lỗi hệ thống — số dư vừa đổi ở tab khác
      // chẳng hạn. Nói đúng số còn thiếu thay vì "có lỗi xảy ra".
      setLoi(
        e?.code === 'khong_du_token'
          ? 'Số dư vừa thay đổi và không còn đủ. Anh nạp thêm rồi thử lại.'
          : (e?.message ?? 'Không thực hiện được. Token của anh chưa bị trừ.'),
      )
    } finally {
      setDangGui(false)
    }
  }

  if (moNap) {
    return <HopNapToken onDong={() => setMoNap(false)} onXong={() => { setMoNap(false); onXong?.(null) }} />
  }

  if (xong) {
    return (
      <Hop tieuDe="Tin đã lên" onDong={onDong}>
        <div className="row" style={{ gap: 'var(--sp-3)' }}>
          <Check size={24} strokeWidth={2} color="var(--m-green-ok)" />
          <div>
            <div className="t-h3">Đã trừ {xong.token_charged} token</div>
            <div className="t-small">
              Hiển thị tới hết ngày {formatDate(xong.expires_at)}. Số dư còn {xong.so_du} token.
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={onDong}>Xong</button>
      </Hop>
    )
  }

  return (
    <Hop
      tieuDe={laGiaHan ? 'Gia hạn hiển thị' : 'Trả phí hiển thị tin'}
      moTa={`${listing?.brand_text ?? ''} ${listing?.model_text ?? ''}`.trim() || undefined}
      onDong={onDong}
    >
      <div className="chon-luoi">
        {GOI_HIEN_THI.map((g) => (
          <button
            key={g.months}
            type="button"
            className="chon-o"
            aria-pressed={months === g.months}
            onClick={() => setMonths(g.months)}
          >
            <span className="chon-token">{g.label}</span>
            <span className="chon-vnd">{g.tokens} token</span>
            <span className="chon-mo-ta">{formatVnd(g.vnd)}</span>
          </button>
        ))}
      </div>

      {/* Giá tuyến tính, nói thẳng là tuyến tính. Không bịa ra "gói tiết kiệm". */}
      <div className="t-small">
        10 token cho 1 xe trong 1 tháng. Chọn nhiều tháng không rẻ hơn, chỉ đỡ phải
        gia hạn lại. Tin hiển thị tới hết ngày <b>{formatDate(hetHanMoi)}</b>.
      </div>

      <div className="ck-bang">
        <div className="ck-dong">
          <span className="ck-nhan">Số dư hiện tại</span>
          <span className="ck-gia-tri">{soDu} token</span>
        </div>
        <div className="ck-dong">
          <span className="ck-nhan">Trừ lần này</span>
          <span className="ck-gia-tri">−{goi.tokens} token</span>
        </div>
      </div>

      {loi && <div className="hop-loi">{loi}</div>}

      {thieu > 0 ? (
        <>
          <div className="hop-nhac">Còn thiếu {thieu} token để hiển thị {goi.label}.</div>
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => setMoNap(true)}>
            <Wallet size={18} strokeWidth={1.8} /> Nạp thêm token
          </button>
        </>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          disabled={dangGui}
          onClick={traPhi}
        >
          {dangGui ? 'Đang xử lý…' : `Trừ ${goi.tokens} token và hiển thị`}
        </button>
      )}

      <div className="t-small" style={{ textAlign: 'center' }}>
        Đây là phí hiển thị tin. Thuexenhanh không thu hoa hồng và không giữ tiền
        thuê xe — giao dịch do anh và khách tự thoả thuận.
      </div>
    </Hop>
  )
}
