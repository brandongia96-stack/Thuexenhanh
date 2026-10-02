import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Check, Loader2 } from 'lucide-react'
import Hop from '../Hop'
import { GOI_NAP, TOI_THIEU, TOI_DA } from '../goiNap'
import { taoYeuCauNap, trangThaiNap } from '../billingApi'
import { vndForTokens } from '../../../lib/pricing'
import { formatVnd } from '../../../lib/format'
import { TOKEN_VND } from '../../../lib/config'

// Hỏi lại trạng thái mỗi 5 giây, bỏ cuộc sau 15 phút. Người dùng dùng 4G —
// hỏi dày hơn không làm tiền về nhanh hơn, chỉ tốn pin và dung lượng.
const NHIP_HOI = 5000
const HOI_TOI_DA = (15 * 60 * 1000) / NHIP_HOI

function DongCK({ nhan, giaTri, ma = false }) {
  const [daChep, setDaChep] = useState(false)
  const chep = async () => {
    try {
      await navigator.clipboard.writeText(String(giaTri))
      setDaChep(true)
      setTimeout(() => setDaChep(false), 1500)
    } catch {
      /* Trình duyệt chặn clipboard thì thôi — số vẫn hiện để gõ tay. */
    }
  }
  return (
    <div className="ck-dong">
      <span className="ck-nhan">{nhan}</span>
      <span className="row" style={{ gap: 'var(--sp-2)' }}>
        <span className={'ck-gia-tri' + (ma ? ' ck-ma' : '')}>{giaTri}</span>
        <button type="button" className="ck-chep" onClick={chep} aria-label={`Sao chép ${nhan}`}>
          {daChep ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={1.8} />}
        </button>
      </span>
    </div>
  )
}

/**
 * Nạp token: chọn số token → nhận QR ngân hàng ĐỘNG → chuyển khoản → chờ webhook.
 *
 * KHÔNG có nút "Tôi đã thanh toán". Nút đó trong v0.1 chỉ là lời hứa: bấm xong
 * vẫn phải có người ngồi kích hoạt tay. Ở đây token vào ví khi và chỉ khi ngân
 * hàng báo tiền về. Màn này chỉ đứng chờ và nói thật là đang chờ.
 */
export default function HopNapToken({ onDong, onXong }) {
  const [buoc, setBuoc] = useState('chon')      // chon | qr | xong
  const [tokens, setTokens] = useState(GOI_NAP[0].tokens)
  const [phuongThuc, setPhuongThuc] = useState('ngan_hang')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState(null)
  const [yeuCau, setYeuCau] = useState(null)
  const [hetGio, setHetGio] = useState(false)
  const demRef = useRef(0)

  const hopLe = Number.isInteger(tokens) && tokens >= TOI_THIEU && tokens <= TOI_DA

  const tao = useCallback(async () => {
    if (!hopLe) return
    setDangGui(true)
    setLoi(null)
    try {
      const kq = await taoYeuCauNap(tokens)
      setYeuCau(kq)
      setBuoc('qr')
    } catch (e) {
      setLoi(e?.message ?? 'Không tạo được yêu cầu nạp')
    } finally {
      setDangGui(false)
    }
  }, [tokens, hopLe])

  // Chờ tiền về. Dọn interval khi đóng hộp — quên chỗ này là app vẫn gọi mạng
  // sau khi người ta đã rời màn hình.
  useEffect(() => {
    if (buoc !== 'qr' || !yeuCau?.topup_id) return
    demRef.current = 0
    let dung = false

    const id = setInterval(async () => {
      if (dung) return
      demRef.current += 1
      if (demRef.current > HOI_TOI_DA) {
        setHetGio(true)
        clearInterval(id)
        return
      }
      try {
        const t = await trangThaiNap(yeuCau.topup_id)
        if (dung || !t) return
        if (t.status === 'da_thanh_toan') {
          clearInterval(id)
          setBuoc('xong')
          onXong?.()
        } else if (t.status === 'that_bai' || t.status === 'huy') {
          clearInterval(id)
          setLoi('Yêu cầu nạp đã bị huỷ. Nếu anh đã chuyển khoản, nhắn cho bên em để đối soát.')
        }
      } catch {
        /* Mạng chập chờn là chuyện thường của 4G. Lần hỏi sau vẫn chạy. */
      }
    }, NHIP_HOI)

    return () => { dung = true; clearInterval(id) }
  }, [buoc, yeuCau, onXong])

  if (buoc === 'xong') {
    return (
      <Hop tieuDe="Đã cộng token" onDong={onDong}>
        <div className="row" style={{ gap: 'var(--sp-3)' }}>
          <Check size={24} strokeWidth={2} color="var(--m-green-ok)" />
          <div>
            <div className="t-h3">{yeuCau?.token_amount} token đã vào ví</div>
            <div className="t-small">Sổ giao dịch đã ghi một dòng cho lần nạp này.</div>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={onDong}>Xong</button>
      </Hop>
    )
  }

  if (buoc === 'qr' && yeuCau) {
    const tenApp = phuongThuc === 'momo' ? 'MoMo' 
                 : phuongThuc === 'zalopay' ? 'ZaloPay' 
                 : phuongThuc === 'vnpay' ? 'VNPAY' 
                 : 'app ngân hàng'
                 
    return (
      <Hop
        tieuDe={`Thanh toán qua ${tenApp}`}
        moTa={`Quét mã bằng ${tenApp}. Số tiền và nội dung đã điền sẵn.`}
        onDong={onDong}
      >
        {yeuCau.qr_url ? (
          <img
            className="qr-anh"
            src={yeuCau.qr_url}
            width={240}
            height={240}
            alt={`Mã QR chuyển khoản ${formatVnd(yeuCau.vnd_amount)}`}
          />
        ) : null}

        <div className="ck-bang">
          {phuongThuc === 'ngan_hang' && (
            <>
              <DongCK nhan="Ngân hàng" giaTri={yeuCau.ngan_hang?.bank} />
              <DongCK nhan="Số tài khoản" giaTri={yeuCau.ngan_hang?.account} ma />
            </>
          )}
          <DongCK nhan="Số tiền" giaTri={formatVnd(yeuCau.vnd_amount)} />
          <DongCK nhan="Nội dung" giaTri={yeuCau.transfer_code} ma />
        </div>

        <div className="hop-nhac">
          Nội dung chuyển khoản phải giữ nguyên mã <b>{yeuCau.transfer_code}</b>. Đây là thứ
          duy nhất giúp hệ thống tự động cộng điểm.
        </div>

        {loi && <div className="hop-loi">{loi}</div>}

        {hetGio ? (
          <div className="t-small">
            Chưa thấy tiền về sau 15 phút. Anh cứ đóng cửa sổ này — nếu đã chuyển khoản,
            token sẽ tự vào ví khi hệ thống báo có.
          </div>
        ) : (
          <div className="row t-small" style={{ justifyContent: 'center' }}>
            <Loader2 size={16} strokeWidth={1.8} className="quay" />
            Đang chờ thanh toán...
          </div>
        )}
      </Hop>
    )
  }

  return (
    <Hop
      tieuDe="Nạp token"
      moTa={`1 token = ${formatVnd(TOKEN_VND)}. Giá như nhau ở mọi mức nạp.`}
      onDong={onDong}
    >
      <div className="chon-luoi">
        {GOI_NAP.map((g) => (
          <button
            key={g.tokens}
            type="button"
            className="chon-o"
            aria-pressed={tokens === g.tokens}
            onClick={() => setTokens(g.tokens)}
          >
            <span className="chon-token">{g.tokens} token</span>
            <span className="chon-vnd">{formatVnd(g.vnd)}</span>
            <span className="chon-mo-ta">{g.moTa}</span>
          </button>
        ))}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="so-token">Hoặc nhập số token</label>
        <input
          id="so-token"
          className="input"
          type="number"
          inputMode="numeric"
          min={TOI_THIEU}
          max={TOI_DA}
          value={tokens}
          aria-invalid={!hopLe}
          onChange={(e) => setTokens(Number(e.target.value))}
        />
        {hopLe ? (
          <span className="field-hint">Thành tiền {formatVnd(vndForTokens(tokens))}</span>
        ) : (
          <span className="field-error">Nhập số nguyên từ {TOI_THIEU} đến {TOI_DA}</span>
        )}
      </div>

      <div className="field">
        <label className="field-label">Phương thức thanh toán</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          {[
            { id: 'ngan_hang', ten: 'Chuyển khoản', mau: 'var(--m-dark)' },
            { id: 'momo', ten: 'MoMo', mau: '#A50064' },
            { id: 'zalopay', ten: 'ZaloPay', mau: '#0068FF' },
            { id: 'vnpay', ten: 'VNPAY', mau: '#005BAA' },
            { id: 'the', ten: 'Thẻ tín dụng', mau: 'var(--m-dark)' }
          ].map((pt) => (
            <button
              key={pt.id}
              type="button"
              onClick={() => setPhuongThuc(pt.id)}
              style={{
                flex: '1 1 auto',
                padding: '10px 12px',
                border: `1px solid ${phuongThuc === pt.id ? pt.mau : 'var(--m-border)'}`,
                borderRadius: '8px',
                background: phuongThuc === pt.id ? `${pt.mau}10` : 'var(--m-surface)',
                color: phuongThuc === pt.id ? pt.mau : 'var(--m-mid)',
                fontWeight: phuongThuc === pt.id ? '600' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              {pt.ten}
            </button>
          ))}
        </div>
      </div>

      {loi && <div className="hop-loi">{loi}</div>}

      <button
        type="button"
        className="btn btn-primary btn-block btn-lg"
        disabled={!hopLe || dangGui}
        onClick={tao}
      >
        {dangGui ? 'Đang tạo mã…' : 'Lấy mã thanh toán'}
      </button>
      <div className="t-small" style={{ textAlign: 'center' }}>
        Token chỉ dùng để trả phí hiển thị tin. Không phải tiền cọc, không liên quan
        tới khoản thuê xe giữa anh và khách.
      </div>
    </Hop>
  )
}
