// Dữ liệu XEM THỬ cho màn nạp token.
//
// Vì sao tồn tại: backend nạp token đã viết xong (`create-topup`, `bank-webhook`,
// `credit_topup`) nhưng còn khoá vì chưa có tài khoản ngân hàng + SePay. Anh
// không nhìn thấy giao diện nào cả. File này dựng đúng bố cục đó bằng dữ liệu
// giả, chạy hoàn toàn trong trình duyệt.
//
// BA LUẬT CỦA FILE NÀY — đọc trước khi sửa:
//
//   1. KHÔNG gọi mạng. Không `getSupabase`, không `callFunction`. Một dòng gọi
//      mạng ở đây là demo biến thành đường trừ token thứ hai, không ai kiểm.
//   2. KHÔNG trộn vào ví thật. Số dư, sổ giao dịch, token đã nạp của trang ví
//      vẫn đọc từ CSDL. Demo chỉ sống trong hộp nạp rồi biến mất khi đóng.
//   3. MỌI màn demo phải có nhãn "BẢN XEM THỬ" hiện rõ. CLAUDE.md 1.2 cấm dữ
//      liệu giả hiển thị như thật — đợt rà soát 03/10 đã phải gỡ một lần rồi.
//
// Không dùng logo ngân hàng / NAPAS / VietQR thật: logo chứng nhận khi chưa có
// quan hệ thật cũng là dữ liệu bịa (đợt rà soát 02/10 đã gỡ logo Bộ Công Thương
// và logo thanh toán giả ở chân trang).

import { vndForTokens } from '../../../lib/pricing'

export const NGAN_HANG_DEMO = {
  bank: 'NGÂN HÀNG DEMO',
  account: '0000 0000 0000',
  name: 'CHỦ TÀI KHOẢN DEMO',
}

// Mã đối soát giả, cùng dạng với mã thật (TXN + 7 ký tự) để bố cục không lệch.
const CHU = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789'

function maDemo() {
  let s = ''
  for (let i = 0; i < 7; i++) s += CHU[Math.floor(Math.random() * CHU.length)]
  return 'TXN' + s
}

/** Trả về đúng hình dạng mà `create-topup` trả về, nhưng không đi đâu cả. */
export function taoYeuCauNapDemo(tokenAmount, phuongThuc = 'ngan_hang') {
  let nganHang = NGAN_HANG_DEMO
  if (phuongThuc === 'momo') {
    nganHang = {
      bank: 'Ví MoMo',
      account: '0988 888 888',
      name: 'CHỦ TÀI KHOẢN DEMO (MOMO)',
    }
  } else if (phuongThuc === 'zalopay') {
    nganHang = {
      bank: 'Ví ZaloPay',
      account: '0988 888 888',
      name: 'CHỦ TÀI KHOẢN DEMO (ZALOPAY)',
    }
  }

  return {
    demo: true,
    topup_id: 'demo-' + Date.now(),
    phuong_thuc: phuongThuc,
    token_amount: tokenAmount,
    vnd_amount: vndForTokens(tokenAmount),
    transfer_code: maDemo(),
    qr_url: null, // bản thật là ảnh từ img.vietqr.io; demo vẽ ô giả tại chỗ
    ngan_hang: nganHang,
  }
}

/**
 * Ô vuông giả hình mã QR, sinh bằng số nên nhìn khác nhau mỗi lần mở.
 * Trả về danh sách ô đen trên lưới 11×11 — đủ để mắt nhận ra "đây là chỗ đặt QR"
 * mà không ai quét được (và không nên quét được).
 */
export function oQrDemo(seed = 7) {
  const o = []
  let x = seed * 9301 + 49297
  const rand = () => ((x = (x * 9301 + 49297) % 233280) / 233280)
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 11; c++) {
      // Ba ô định vị ở góc — thứ làm mắt nhận ra ngay là mã QR.
      const gocTren = r < 3 && (c < 3 || c > 7)
      const gocDuoi = r > 7 && c < 3
      if (gocTren || gocDuoi) {
        if (r % 2 === 0 || c % 2 === 0) o.push([c, r])
      } else if (rand() > 0.55) {
        o.push([c, r])
      }
    }
  }
  return o
}
