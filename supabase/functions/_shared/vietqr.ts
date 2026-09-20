// VietQR ĐỘNG — mã QR ngân hàng thật, có sẵn số tiền và nội dung chuyển khoản.
//
// Khác hẳn v0.1: QR trong code cũ chỉ là ảnh chứa một chuỗi text, quét bằng app
// ngân hàng không ra gì, rồi kích hoạt gói bằng `mailto:` thủ công. Bỏ hẳn.
//
// Luồng thật: img.vietqr.io sinh ảnh QR theo chuẩn VietQR của NAPAS.
// Khách quét -> app ngân hàng điền sẵn số tài khoản, số tiền, nội dung.
// Tiền về -> SePay/Casso bắn webhook -> đối soát theo nội dung -> cộng token.

const BANK = Deno.env.get('VIETQR_BANK') ?? ''        // mã ngân hàng, vd: 'MB', 'VCB'
const ACCOUNT = Deno.env.get('VIETQR_ACCOUNT') ?? ''  // số tài khoản nhận
const NAME = Deno.env.get('VIETQR_NAME') ?? ''        // tên chủ tài khoản

export const coCauHinhQR = Boolean(BANK && ACCOUNT)

export function qrUrl(vnd: number, noiDung: string): string | null {
  if (!coCauHinhQR) return null
  const q = new URLSearchParams({
    amount: String(vnd),
    addInfo: noiDung,
    accountName: NAME,
  })
  return `https://img.vietqr.io/image/${BANK}-${ACCOUNT}-compact2.png?${q}`
}

export function thongTinChuyenKhoan() {
  return { bank: BANK, account: ACCOUNT, name: NAME }
}

/**
 * Mã đối soát. Phải thoả ba điều kiện cùng lúc:
 *   · chỉ A-Z 0-9 — nhiều app ngân hàng nuốt dấu và ký tự lạ trong nội dung CK
 *   · đủ ngắn để người ta gõ tay được khi quét QR hỏng
 *   · đủ ngẫu nhiên để không ai đoán trúng mã của người khác rồi nhận nhầm token
 *
 * Bỏ các ký tự dễ đọc nhầm: 0/O, 1/I, 5/S.
 */
const CHU = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789'

export function sinhMaDoiSoat(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(7))
  let s = ''
  for (const b of bytes) s += CHU[b % CHU.length]
  return 'TXN' + s
}

/**
 * Moi mã đối soát ra khỏi nội dung chuyển khoản.
 * Ngân hàng hay chèn thêm chữ: "CHUYEN TIEN TXNAB2CD34 GD 123456".
 */
export function timMaDoiSoat(...nguon: (string | null | undefined)[]): string | null {
  for (const s of nguon) {
    if (!s) continue
    const m = String(s).toUpperCase().match(/TXN[A-Z0-9]{7}/)
    if (m) return m[0]
  }
  return null
}
