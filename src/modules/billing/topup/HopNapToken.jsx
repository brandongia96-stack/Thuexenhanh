import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Check, Loader2, Sparkles, Landmark, QrCode } from 'lucide-react'
import Hop from '../Hop'
import { GOI_NAP, TOI_THIEU, TOI_DA } from '../goiNap'
import { taoYeuCauNap, trangThaiNap, isTokenDemo, demoXacNhanNapTien } from '../billingApi'
import { taoYeuCauNapDemo, oQrDemo } from '../demo/napDemo'
import { vndForTokens } from '../../../lib/pricing'
import { formatVnd } from '../../../lib/format'
import { TOKEN_VND, FLAGS } from '../../../lib/config'

// Hỏi lại trạng thái mỗi 5 giây, bỏ cuộc sau 15 phút. Người dùng dùng 4G —
// hỏi dày hơn không làm tiền về nhanh hơn, chỉ tốn pin và dung lượng.
const NHIP_HOI = 5000
const HOI_TOI_DA = (15 * 60 * 1000) / NHIP_HOI

// Icon trung tính, KHÔNG vẽ nhái logo MoMo/ZaloPay.
//
// Hai lý do. Một: logo nhái của thương hiệu mình chưa có quan hệ là dữ liệu bịa
// — đợt rà soát 02/10 đã phải gỡ logo Bộ Công Thương và logo thanh toán giả ở
// chân trang. Hai: logo đặt cạnh nút làm người ta hiểu là có cổng MoMo riêng,
// trong khi cả ba nút chỉ dẫn tới cùng một mã VietQR của tài khoản ngân hàng.
// Tên app viết bằng chữ thì không sao — đó là nói app nào quét được mã.
function IconViQuet({ size = 22 }) {
  return <QrCode size={size} strokeWidth={1.8} aria-hidden="true" />
}

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
function QrXemThu({ seed, nhan = 'Ô đặt mã QR · bản xem thử' }) {
  const o = oQrDemo(seed)
  return (
    <div className="qr-demo">
      <svg className="qr-anh" width={240} height={240} viewBox="0 0 11 11" aria-label={nhan}>
        <rect width="11" height="11" fill="var(--m-surface)" />
        {o.map(([c, r]) => (
          <rect key={`${c}-${r}`} x={c} y={r} width="1" height="1" fill="var(--m-dark)" />
        ))}
      </svg>
      <span className="qr-demo-nhan">{nhan}</span>
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
  const cheDoDemo = demo || isTokenDemo()
  // Ba nút nạp chỉ bấm được khi THẬT SỰ có đường đi tiếp:
  //   · nạp tiền thật đã mở, hoặc
  //   · đang ở chế độ thử (token-demo / trang thử) — nơi mọi màn đều đeo nhãn.
  // Cờ tắt mà vẫn cho bấm là dựng một luồng thanh toán không dẫn tới đâu.
  const moKhoaNut = FLAGS.nap_tien_that || cheDoDemo
  const [buoc, setBuoc] = useState('chon')      // chon | qr | xong
  const [tokens, setTokens] = useState(GOI_NAP[0].tokens)
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState(null)
  const [yeuCau, setYeuCau] = useState(null)
  const [hetGio, setHetGio] = useState(false)
  const demRef = useRef(0)

  const hopLe = Number.isInteger(tokens) && tokens >= TOI_THIEU && tokens <= TOI_DA

  const tao = useCallback(async (phuongThuc = 'ngan_hang') => {
    if (!hopLe) return
    setDangGui(phuongThuc)
    setLoi(null)
    try {
      if (isTokenDemo()) {
        const kq = await taoYeuCauNap(tokens, phuongThuc)
        setYeuCau(kq)
        setBuoc('qr')
      } else if (demo) {
        setYeuCau(taoYeuCauNapDemo(tokens, phuongThuc))
        setBuoc('qr')
      } else {
        const kq = await taoYeuCauNap(tokens, phuongThuc)
        setYeuCau(kq)
        setBuoc('qr')
      }
    } catch (e) {
      setLoi(e?.message ?? 'Không tạo được yêu cầu nạp')
    } finally {
      setDangGui(false)
    }
  }, [tokens, hopLe, demo])

  const giaLapTienVe = useCallback(async () => {
    try {
      if (isTokenDemo() && yeuCau?.topup_id) {
        await demoXacNhanNapTien(yeuCau.topup_id)
      }
      setBuoc('xong')
      onXong?.()
    } catch (e) {
      setLoi(e?.message ?? 'Lỗi khi mô phỏng tiền về')
    }
  }, [yeuCau, onXong])

  // Chờ tiền về. Dọn interval khi đóng hộp — quên chỗ này là app vẫn gọi mạng
  // sau khi người ta đã rời màn hình.
  useEffect(() => {
    if (buoc !== 'qr' || !yeuCau?.topup_id) return
    // Nếu chỉ là demo giao diện tĩnh (không phải token-demo store) thì không hỏi định kỳ
    if (demo && !isTokenDemo()) return

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

  // Nhãn dán ở MỌI màn của bản xem thử.
  const nhanXemThu = cheDoDemo ? (
    <div className="hop-demo">
      <b>{isTokenDemo() ? 'Chế độ Thử nghiệm Token (token-demo).' : 'Bản xem thử giao diện.'}</b>{' '}
      {isTokenDemo()
        ? 'Dữ liệu được lưu vào ví demo để anh kiểm tra toàn bộ luồng nạp và trừ phí như thật.'
        : 'Số tài khoản và mã QR dưới đây là giả, không chuyển tiền vào. Nạp token thật sẽ mở khi có tài khoản ngân hàng.'}
    </div>
  ) : null

  if (buoc === 'xong') {
    return (
      <Hop tieuDe={cheDoDemo ? 'Đã cộng token (thử nghiệm)' : 'Đã cộng token'} onDong={onDong}>
        {nhanXemThu}
        <div className="row" style={{ gap: 'var(--sp-3)' }}>
          <Check size={24} strokeWidth={2} color="var(--m-green-ok)" />
          <div>
            <div className="t-h3">{yeuCau?.token_amount} token đã vào ví</div>
            <div className="t-small">
              {isTokenDemo()
                ? 'Ví demo đã được cộng token và sổ giao dịch đã ghi nhận một dòng nạp mới.'
                : demo
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
    // Cả ba phương thức đều là MỘT mã VietQR của tài khoản ngân hàng. MoMo và
    // ZaloPay chỉ là app quét được mã đó — không có cổng thanh toán riêng, và
    // cũng không có ai tên MoMo gửi tin báo tiền về cho mình. Chữ trên màn này
    // phải nói đúng như vậy.
    const isMomo = yeuCau.phuong_thuc === 'momo'
    const isZaloPay = yeuCau.phuong_thuc === 'zalopay'
    const tenApp = isMomo ? 'MoMo' : isZaloPay ? 'ZaloPay' : 'ngân hàng'

    const tieuDeModal = cheDoDemo
      ? 'Chuyển khoản để nhận token (thử nghiệm)'
      : 'Chuyển khoản để nhận token'

    const moTaModal = `Quét mã VietQR bằng app ${tenApp}. Số tiền và nội dung đã điền sẵn.`

    return (
      <Hop
        tieuDe={tieuDeModal}
        moTa={moTaModal}
        onDong={onDong}
      >
        {nhanXemThu}

        {yeuCau.qr_url ? (
          <img
            className="qr-anh"
            src={yeuCau.qr_url}
            width={240}
            height={240}
            alt={`Mã VietQR ${formatVnd(yeuCau.vnd_amount)}`}
          />
        ) : cheDoDemo ? (
          <QrXemThu seed={yeuCau.token_amount} nhan="Ô đặt mã VietQR · bản xem thử" />
        ) : null}

        {/* Tiền đi vào TÀI KHOẢN NGÂN HÀNG, dù anh quét bằng app nào. Nhãn phải
            là "Ngân hàng" / "Số tài khoản" — gọi là "Ví nhận / Số ví" thì người
            ta tưởng tiền nằm trong ví MoMo của mình. */}
        <div className="ck-bang">
          <DongCK nhan="Ngân hàng" giaTri={yeuCau.ngan_hang?.bank} />
          <DongCK nhan="Số tài khoản" giaTri={yeuCau.ngan_hang?.account} ma />
          <DongCK nhan="Số tiền" giaTri={formatVnd(yeuCau.vnd_amount)} />
          <DongCK nhan="Nội dung" giaTri={yeuCau.transfer_code} ma />
        </div>

        {(isMomo || isZaloPay) && (
          <div className="t-small">
            Đây là mã VietQR của tài khoản ngân hàng. App {tenApp} quét được mã này
            và chuyển tiền sang ngân hàng — Thuê Xe Nhanh không có cổng {tenApp} riêng.
          </div>
        )}

        <div className="hop-nhac">
          Nội dung chuyển khoản phải giữ nguyên mã <b>{yeuCau.transfer_code}</b>. Đây là thứ
          duy nhất giúp hệ thống biết khoản tiền này là của anh.
        </div>

        {loi && <div className="hop-loi">{loi}</div>}

        {/* Nút mô phỏng ở chế độ demo */}
        {cheDoDemo ? (
          <button type="button" className="btn btn-soft btn-block" onClick={giaLapTienVe}>
            <Sparkles size={16} strokeWidth={2} /> Mô phỏng ngân hàng báo có tiền về ngay →
          </button>
        ) : hetGio ? (
          <div className="t-small">
            Chưa thấy tiền về sau 15 phút. Anh cứ đóng cửa sổ này — nếu đã chuyển khoản,
            token sẽ tự vào ví khi hệ thống báo về, không cần làm lại.
          </div>
        ) : (
          <div className="row t-small" style={{ justifyContent: 'center' }}>
            <Loader2 size={16} strokeWidth={1.8} className="quay" />
            Đang chờ ngân hàng báo có
          </div>
        )}

        <button
          type="button"
          className="btn btn-ghost btn-block btn-sm"
          onClick={() => {
            setBuoc('chon')
            setYeuCau(null)
          }}
        >
          ← Đổi gói hoặc phương thức khác
        </button>
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

      {/* Cả ba nút dẫn tới CÙNG một mã VietQR của tài khoản ngân hàng. Nói ra
          ngay đây, trước khi anh bấm — để không ai tưởng chọn MoMo thì tiền đi
          đường khác. */}
      <div className="t-small">
        Cả ba cách đều dùng chung một mã VietQR của tài khoản ngân hàng. Chọn app
        nào là chọn app anh dùng để quét.
      </div>

      <div className="nap-cac-phuong-thuc">
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg nap-nut-nganhang"
          disabled={!moKhoaNut || !hopLe || Boolean(dangGui)}
          onClick={() => tao('ngan_hang')}
        >
          <Landmark size={20} strokeWidth={2} />
          <span>
            {!moKhoaNut
              ? 'Chuyển khoản ngân hàng · Sắp mở'
              : dangGui === 'ngan_hang'
              ? 'Đang tạo mã chuyển khoản…'
              : 'Chuyển khoản ngân hàng'}
          </span>
        </button>

        <div className="nap-luoi-vi">
          {[
            { ma: 'momo', ten: 'MoMo', lop: 'nap-o-momo' },
            { ma: 'zalopay', ten: 'ZaloPay', lop: 'nap-o-zalopay' },
          ].map((v) => (
            <button
              key={v.ma}
              type="button"
              className={'nap-o-vi ' + v.lop}
              disabled={!moKhoaNut || !hopLe || Boolean(dangGui)}
              onClick={() => tao(v.ma)}
            >
              <span className="nap-icon-vi">
                <IconViQuet size={20} />
              </span>
              <span>
                {!moKhoaNut ? v.ten : dangGui === v.ma ? 'Đang tạo…' : v.ten}
                {!moKhoaNut && <span className="nap-sap-mo">Sắp mở</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      {!moKhoaNut && (
        <div className="hop-nhac">
          Nạp token tự động <b>sắp mở</b> — đang chờ tài khoản ngân hàng nhận tiền.
          Trong thời gian này token được cấp thủ công, anh nhắn cho bên em.
        </div>
      )}

      <div className="t-small" style={{ textAlign: 'center' }}>
        Token chỉ dùng để trả phí hiển thị tin. Không phải tiền cọc, không liên quan
        tới khoản thuê xe giữa anh và khách.
      </div>
    </Hop>
  )
}
