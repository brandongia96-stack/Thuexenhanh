import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Check, Loader2 } from 'lucide-react'
import Hop from '../Hop'
import { GOI_NAP, TOI_THIEU, TOI_DA } from '../goiNap'
import { taoYeuCauNap, trangThaiNap } from '../billingApi'
import { taoYeuCauNapDemo, oQrDemo } from '../demo/napDemo'
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

/** Ô vuông giả hình QR cho bản xem thử. Cố định 240×240 như ảnh thật -> không vỡ CLS. */
function QrXemThu({ seed }) {
  const o = oQrDemo(seed)
  return (
    <div className="qr-demo">
      <svg className="qr-anh" width={240} height={240} viewBox="0 0 11 11" aria-label="Ô đặt mã QR — bản xem thử">
        <rect width="11" height="11" fill="var(--m-surface)" />
        {o.map(([c, r]) => (
          <rect key={`${c}-${r}`} x={c} y={r} width="1" height="1" fill="var(--m-dark)" />
        ))}
      </svg>
      <span className="qr-demo-nhan">Ô đặt mã QR · bản xem thử</span>
    </div>
  )
}

/**
 * Nạp token: chọn số token → nhận QR ngân hàng ĐỘNG → chuyển khoản → chờ webhook.
 *
 * KHÔNG có nút "Tôi đã thanh toán". Nút đó trong v0.1 chỉ là lời hứa: bấm xong
 * vẫn phải có người ngồi kích hoạt tay. Ở đây token vào ví khi và chỉ khi ngân
 * hàng báo tiền về. Màn này chỉ đứng chờ và nói thật là đang chờ.
 *
 * `demo` = bản xem thử bố cục: không gọi mạng, không cộng token thật, mọi màn
 * đều đeo nhãn. Dùng khi nạp tiền thật chưa mở (xem `demo/napDemo.js`).
 */
export default function HopNapToken({ onDong, onXong, demo = false }) {
  const [buoc, setBuoc] = useState('chon')      // chon | qr | xong
  const [tokens, setTokens] = useState(GOI_NAP[0].tokens)
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState(null)
  const [yeuCau, setYeuCau] = useState(null)
  const [hetGio, setHetGio] = useState(false)
  const demRef = useRef(0)

  const hopLe = Number.isInteger(tokens) && tokens >= TOI_THIEU && tokens <= TOI_DA

  const tao = useCallback(async () => {
    if (!hopLe) return
    // Bản xem thử: dựng dữ liệu tại chỗ, không gọi Edge Function.
    if (demo) {
      setYeuCau(taoYeuCauNapDemo(tokens))
      setBuoc('qr')
      return
    }
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
  }, [tokens, hopLe, demo])

  // Chờ tiền về. Dọn interval khi đóng hộp — quên chỗ này là app vẫn gọi mạng
  // sau khi người ta đã rời màn hình.
  useEffect(() => {
    if (buoc !== 'qr' || !yeuCau?.topup_id) return
    if (demo) return   // xem thử thì không có gì để hỏi: anh tự bấm "giả lập tiền về"
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
  }, [buoc, yeuCau, onXong, demo])

  // Nhãn dán ở MỌI màn của bản xem thử. Không có ngoại lệ: một màn quên nhãn là
  // một màn nhìn y như thật.
  const nhanXemThu = demo ? (
    <div className="hop-demo">
      <b>Bản xem thử giao diện.</b> Số tài khoản và mã QR dưới đây là giả, không
      chuyển tiền vào. Nạp token thật sẽ mở khi có tài khoản ngân hàng.
    </div>
  ) : null

  if (buoc === 'xong') {
    return (
      <Hop tieuDe={demo ? 'Đã cộng token (xem thử)' : 'Đã cộng token'} onDong={onDong}>
        {nhanXemThu}
        <div className="row" style={{ gap: 'var(--sp-3)' }}>
          <Check size={24} strokeWidth={2} color="var(--m-green-ok)" />
          <div>
            <div className="t-h3">{yeuCau?.token_amount} token đã vào ví</div>
            <div className="t-small">
              {demo
                ? 'Ở bản thật, dòng này chỉ hiện sau khi ngân hàng báo tiền về. Ví của anh KHÔNG được cộng gì.'
                : 'Sổ giao dịch đã ghi một dòng cho lần nạp này.'}
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={onDong}>Xong</button>
      </Hop>
    )
  }

  if (buoc === 'qr' && yeuCau) {
    return (
      <Hop
        tieuDe={demo ? 'Chuyển khoản để nhận token (xem thử)' : 'Chuyển khoản để nhận token'}
        moTa="Quét mã bằng app ngân hàng. Số tiền và nội dung đã điền sẵn."
        onDong={onDong}
      >
        {nhanXemThu}

        {yeuCau.qr_url ? (
          <img
            className="qr-anh"
            src={yeuCau.qr_url}
            width={240}
            height={240}
            alt={`Mã QR chuyển khoản ${formatVnd(yeuCau.vnd_amount)}`}
          />
        ) : demo ? (
          <QrXemThu seed={yeuCau.token_amount} />
        ) : null}

        <div className="ck-bang">
          <DongCK nhan="Ngân hàng" giaTri={yeuCau.ngan_hang?.bank} />
          <DongCK nhan="Số tài khoản" giaTri={yeuCau.ngan_hang?.account} ma />
          <DongCK nhan="Số tiền" giaTri={formatVnd(yeuCau.vnd_amount)} />
          <DongCK nhan="Nội dung" giaTri={yeuCau.transfer_code} ma />
        </div>

        <div className="hop-nhac">
          Nội dung chuyển khoản phải giữ nguyên mã <b>{yeuCau.transfer_code}</b>. Đây là thứ
          duy nhất giúp hệ thống biết khoản tiền này là của anh.
        </div>

        {loi && <div className="hop-loi">{loi}</div>}

        {/* Bản thật KHÔNG có nút này — token vào ví chỉ khi ngân hàng báo tiền
            về (xem đầu file). Ở bản xem thử thì cần một cách để anh xem nốt
            màn cuối, nên nút nói thẳng nó là giả lập. */}
        {demo ? (
          <button type="button" className="btn btn-ghost btn-block" onClick={() => setBuoc('xong')}>
            Giả lập ngân hàng báo tiền về →
          </button>
        ) : hetGio ? (
          <div className="t-small">
            Chưa thấy tiền về sau 15 phút. Anh cứ đóng cửa sổ này — nếu đã chuyển khoản,
            token sẽ tự vào ví khi ngân hàng báo về, không cần làm lại.
          </div>
        ) : (
          <div className="row t-small" style={{ justifyContent: 'center' }}>
            <Loader2 size={16} strokeWidth={1.8} className="quay" />
            Đang chờ ngân hàng báo có
          </div>
        )}
      </Hop>
    )
  }

  return (
    <Hop
      tieuDe={demo ? 'Nạp token (xem thử)' : 'Nạp token'}
      moTa={`1 token = ${formatVnd(TOKEN_VND)}. Giá như nhau ở mọi mức nạp.`}
      onDong={onDong}
    >
      {nhanXemThu}

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

      {loi && <div className="hop-loi">{loi}</div>}

      <button
        type="button"
        className="btn btn-primary btn-block btn-lg"
        disabled={!hopLe || dangGui}
        onClick={tao}
      >
        {dangGui ? 'Đang tạo mã…' : 'Lấy mã chuyển khoản'}
      </button>
      <div className="t-small" style={{ textAlign: 'center' }}>
        Token chỉ dùng để trả phí hiển thị tin. Không phải tiền cọc, không liên quan
        tới khoản thuê xe giữa anh và khách.
      </div>
    </Hop>
  )
}
