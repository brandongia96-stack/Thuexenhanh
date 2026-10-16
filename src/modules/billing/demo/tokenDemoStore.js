// billing/demo/tokenDemoStore — Bộ quản lý trạng thái thử nghiệm ví token (token-demo).
//
// Phục vụ yêu cầu: "tất cả các thao tác liên quan đến token trong app, và cho demo nó.
// Sử dụng biến token-demo, để sau này chỉ cần gọi lên là thay thế như thật được luôn".
//
// NGUYÊN TẮC THIẾT KẾ:
//   1. Giữ nguyên 100% hình dạng dữ liệu (schema/contract) như API thật trả về.
//   2. Lưu vào localStorage để không mất dữ liệu khi reload/chuyển trang giữa
//      /tai-khoan/vi, /chu-xe, /chu-xe/tin/:id, /chu-xe/dang-tin.
//   3. Khi cờ `token-demo` tắt, toàn bộ hệ thống tự động quay về Supabase/Edge Functions
//      thật mà không cần sửa code.
//   4. Phát CustomEvent ('thuexe:token-demo-changed', 'thuexe:token-changed')
//      để mọi component cập nhật tức thì khi có biến động.

import { tokensForMonths, vndForTokens } from '../../../lib/pricing'

export const KEY_TOKEN_DEMO = 'token-demo'
export const KEY_DEMO_STATE = 'thuexe_token_demo_state'
export const SU_KIEN_DEMO_THAY_DOI = 'thuexe:token-demo-changed'
export const SU_KIEN_VI_THAY_DOI = 'thuexe:token-changed'

let _boNhoTam = {}
export function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage
    }
  } catch {
    /* ignore */
  }
  return {
    getItem: (k) => _boNhoTam[k] ?? null,
    setItem: (k, v) => { _boNhoTam[k] = String(v) },
    removeItem: (k) => { delete _boNhoTam[k] },
    clear: () => { _boNhoTam = {} },
  }
}

function banSuKien(ten, detail) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(ten, { detail }))
    } catch {
      /* ignore */
    }
  }
}

/**
 * Kiểm tra xem chế độ token-demo có đang bật hay không.
 * Thứ tự ưu tiên:
 *   1. Query param URL: `?token-demo=1` / `?token-demo=true` hoặc `?demo=1`
 *   2. Biến toàn cục `window.__TOKEN_DEMO__` / `globalThis.__TOKEN_DEMO__`
 *   3. localStorage: key `token-demo` === '1' hoặc 'true'
 */
export function isTokenDemo() {
  // 0. KHÔNG BAO GIỜ bật trên bản production (anh xác nhận rà 17/10): ở chế
  //    độ demo, "trả phí hiển thị" chỉ trừ ví giả trong trình duyệt — chủ xe
  //    thật bấm ?demo=1 sẽ tưởng tin đã lên mà thực ra không. Chỉ dùng ở máy dev
  //    / bản xem thử (VITE_APP_ENV khác 'production').
  if (import.meta.env?.VITE_APP_ENV === 'production') return false

  // 1. Kiểm tra query param trong URL
  try {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search)
      if (params.has('token-demo')) {
        const v = params.get('token-demo')
        const bat = v === '1' || v === 'true'
        getStorage().setItem(KEY_TOKEN_DEMO, bat ? '1' : '0')
        return bat
      }
      if (params.get('demo') === '1' || params.get('demo') === 'true') {
        return true
      }
    }
  } catch {
    /* bỏ qua nếu môi trường không có location */
  }

  // 2. Kiểm tra biến toàn cục
  const globalObj = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null)
  if (globalObj && typeof globalObj.__TOKEN_DEMO__ === 'boolean') {
    return globalObj.__TOKEN_DEMO__
  }

  // 3. Kiểm tra localStorage
  try {
    const val = getStorage().getItem(KEY_TOKEN_DEMO)
    return val === '1' || val === 'true'
  } catch {
    return false
  }
}

/** Bật chế độ token-demo */
export function batTokenDemo() {
  try {
    getStorage().setItem(KEY_TOKEN_DEMO, '1')
    const globalObj = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null)
    if (globalObj) globalObj.__TOKEN_DEMO__ = true
    banSuKien(SU_KIEN_DEMO_THAY_DOI, { enabled: true })
  } catch {
    /* ignore */
  }
}

/** Tắt chế độ token-demo */
export function tatTokenDemo() {
  try {
    getStorage().setItem(KEY_TOKEN_DEMO, '0')
    const globalObj = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null)
    if (globalObj) globalObj.__TOKEN_DEMO__ = false
    banSuKien(SU_KIEN_DEMO_THAY_DOI, { enabled: false })
  } catch {
    /* ignore */
  }
}

/** Đổi trạng thái bật/tắt token-demo */
export function chuyenDoiTokenDemo() {
  if (isTokenDemo()) {
    tatTokenDemo()
    return false
  } else {
    batTokenDemo()
    return true
  }
}


// ─── DỮ LIỆU BAN ĐẦU CỦA VÍ DEMO ───
// Đủ 4 loại biến động: nạp, tiêu (hiển thị), gia hạn, hoàn token.
// Đảm bảo tính toán đối soát khớp 100%:
//   - Đã nạp: 50 + 30 = 80 token
//   - Đã tiêu: 10 + 20 = 30 token
//   - Số dư: 80 - 30 = 50 token
function khoiTaoDuLieuGoc() {
  const bayGio = Date.now()
  const NGAY = 86400000

  return {
    wallet: {
      wallet_id: 'demo-wallet-vn-01',
      token_da_nap: 80,
      token_da_tieu: 30,
      so_du: 50,
    },
    ledger: [
      {
        id: 'leg-demo-001',
        kind: 'nap',
        amount: 50,
        so_du_sau: 50,
        note: 'Nạp 50 token · mã TXN9K2M4P1',
        listing_id: null,
        charge_kind: null,
        created_at: new Date(bayGio - 5 * NGAY).toISOString(),
      },
      {
        id: 'leg-demo-002',
        kind: 'tieu',
        amount: -10,
        so_du_sau: 40,
        note: 'Hiển thị tin Mazda CX-5 · 1 tháng',
        listing_id: 'demo-car-cx5',
        charge_kind: 'publish',
        created_at: new Date(bayGio - 4 * NGAY).toISOString(),
      },
      {
        id: 'leg-demo-003',
        kind: 'nap',
        amount: 30,
        so_du_sau: 70,
        note: 'Nạp 30 token · mã TXN7L8X2Z9',
        listing_id: null,
        charge_kind: null,
        created_at: new Date(bayGio - 2 * NGAY).toISOString(),
      },
      {
        id: 'leg-demo-004',
        kind: 'tieu',
        amount: -20,
        so_du_sau: 50,
        note: 'Gia hạn tin Hyundai SantaFe · 2 tháng',
        listing_id: 'demo-car-santafe',
        charge_kind: 'renew',
        created_at: new Date(bayGio - 1 * NGAY).toISOString(),
      },
    ],
    topups: [
      {
        id: 'topup-demo-001',
        token_amount: 50,
        vnd_amount: 200000,
        status: 'da_thanh_toan',
        transfer_code: 'TXN9K2M4P1',
        created_at: new Date(bayGio - 5 * NGAY).toISOString(),
        paid_at: new Date(bayGio - 5 * NGAY + 60000).toISOString(),
      },
      {
        id: 'topup-demo-002',
        token_amount: 30,
        vnd_amount: 120000,
        status: 'da_thanh_toan',
        transfer_code: 'TXN7L8X2Z9',
        created_at: new Date(bayGio - 2 * NGAY).toISOString(),
        paid_at: new Date(bayGio - 2 * NGAY + 45000).toISOString(),
      },
    ],
  }
}

/** Đọc state từ localStorage hoặc khởi tạo */
function docState() {
  try {
    const raw = getStorage().getItem(KEY_DEMO_STATE)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.wallet && Array.isArray(parsed.ledger)) {
        return parsed
      }
    }
  } catch {
    /* ignore json error */
  }
  const goc = khoiTaoDuLieuGoc()
  ghiState(goc)
  return goc
}

/** Ghi state vào localStorage và bắn sự kiện thông báo */
function ghiState(state) {
  try {
    getStorage().setItem(KEY_DEMO_STATE, JSON.stringify(state))
    banSuKien(SU_KIEN_VI_THAY_DOI, state)
  } catch {
    /* ignore */
  }
}


/** Đặt lại toàn bộ dữ liệu demo về trạng thái ban đầu */
export function demoReset() {
  const goc = khoiTaoDuLieuGoc()
  ghiState(goc)
  return goc
}

// ─── CÁC THAO TÁC TOKEN MÔ PHỎNG (CHUẨN CONTRACT 100%) ───

/**
 * 1. Số dư ví demo (giống view `wallet_balances`).
 */
export async function demoSoDuVi(_userId) {
  const st = docState()
  return { ...st.wallet }
}

/**
 * 2. Sổ giao dịch demo, phân trang keyset theo (created_at, id) (giống view `wallet_ledger`).
 */
export async function demoSoGiaoDich(_userId, { cursor = null, limit = 20 } = {}) {
  const st = docState()
  // Sắp xếp giảm dần theo created_at rồi id
  const sapXep = [...st.ledger].sort((a, b) => {
    if (a.created_at !== b.created_at) {
      return a.created_at < b.created_at ? 1 : -1
    }
    return a.id < b.id ? 1 : -1
  })

  let ds = sapXep
  if (cursor) {
    ds = sapXep.filter((item) => {
      if (item.created_at < cursor.created_at) return true
      if (item.created_at === cursor.created_at && item.id < cursor.id) return true
      return false
    })
  }

  const conNua = ds.length > limit
  const items = conNua ? ds.slice(0, limit) : ds
  const cuoi = items[items.length - 1]

  return {
    items,
    conNua,
    cursor: cuoi ? { created_at: cuoi.created_at, id: cuoi.id } : null,
  }
}

/**
 * 3. Lịch sử các yêu cầu nạp gần đây (giống bảng `topups`).
 */
export async function demoNapGanDay(_userId, { limit = 5 } = {}) {
  const st = docState()
  return [...st.topups]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit)
}

/**
 * 4. Trạng thái một lần nạp (giống hàm `trangThaiNap`).
 */
export async function demoTrangThaiNap(topupId) {
  const st = docState()
  const found = st.topups.find((t) => t.id === topupId)
  if (!found) return null
  return {
    id: found.id,
    status: found.status,
    token_amount: found.token_amount,
    paid_at: found.paid_at,
  }
}

const CHU_MA = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789'
function sinhMaTransfer() {
  let s = ''
  for (let i = 0; i < 7; i++) s += CHU_MA[Math.floor(Math.random() * CHU_MA.length)]
  return 'TXN' + s
}

/**
 * 5. Tạo yêu cầu nạp token mới (giống Edge Function `create-topup`).
 */
export async function demoTaoYeuCauNap(tokenAmount, phuongThuc = 'ngan_hang') {
  const st = docState()
  const topupId = 'demo-topup-' + Date.now()
  const transferCode = sinhMaTransfer()
  const vndAmount = vndForTokens(tokenAmount)

  // MỘT nơi nhận duy nhất cho cả ba nút. `phuongThuc` chỉ nói anh định quét
  // bằng app nào — backend `create-topup` sinh đúng một mã VietQR của tài khoản
  // ngân hàng, không có cổng MoMo/ZaloPay riêng nào cả. Bịa ra "ví MoMo nhận
  // tiền" là hứa một đường tiền không tồn tại.
  const thongTinNhan = {
    bank: 'NGÂN HÀNG DEMO',
    account: '9999 8888 7777',
    name: 'THUEXENHANH DEMO',
  }

  const itemMoi = {
    id: topupId,
    token_amount: tokenAmount,
    vnd_amount: vndAmount,
    status: 'cho_thanh_toan',
    transfer_code: transferCode,
    phuong_thuc: phuongThuc,
    created_at: new Date().toISOString(),
    paid_at: null,
  }

  st.topups.unshift(itemMoi)
  ghiState(st)

  return {
    demo: true,
    topup_id: topupId,
    phuong_thuc: phuongThuc,
    token_amount: tokenAmount,
    vnd_amount: vndAmount,
    transfer_code: transferCode,
    qr_url: null, // HopNapToken sẽ tự vẽ ô QR demo
    ngan_hang: thongTinNhan,
  }
}

/**
 * 6. Mô phỏng tiền về từ ngân hàng / SePay (giống webhook `bank-webhook` + `credit_topup`).
 * Bấm nút này sẽ lập tức chuyển trạng thái sang 'da_thanh_toan' và cộng token vào ví.
 */
export async function demoXacNhanNapTien(topupId) {
  const st = docState()
  const topup = st.topups.find((t) => t.id === topupId)
  if (!topup) {
    throw new Error('Không tìm thấy yêu cầu nạp demo: ' + topupId)
  }
  if (topup.status === 'da_thanh_toan') {
    return { ok: true, daCong: true, soDu: st.wallet.so_du }
  }

  const bayGio = new Date().toISOString()
  topup.status = 'da_thanh_toan'
  topup.paid_at = bayGio

  // Cộng token vào ví
  st.wallet.token_da_nap += topup.token_amount
  st.wallet.so_du += topup.token_amount

  // Thêm dòng vào sổ giao dịch
  st.ledger.push({
    id: 'leg-demo-' + Date.now(),
    kind: 'nap',
    amount: topup.token_amount,
    so_du_sau: st.wallet.so_du,
    note: `Nạp ${topup.token_amount} token · mã ${topup.transfer_code}`,
    listing_id: null,
    charge_kind: null,
    created_at: bayGio,
  })

  ghiState(st)
  return {
    ok: true,
    daCong: true,
    token_cong: topup.token_amount,
    soDu: st.wallet.so_du,
  }
}

/**
 * 7. Trả phí hiển thị tin đăng mới hoặc gia hạn tin (giống Edge Function `publish-listing`).
 * Trừ token theo tháng (10 token/tháng/xe), kiểm tra số dư, cập nhật expires_at.
 */
export async function demoTraPhiHienThi({ listingId, months, listing = null }) {
  const st = docState()
  const tokenCan = tokensForMonths(months)

  // Kiểm tra số dư ví
  if (st.wallet.so_du < tokenCan) {
    const err = new Error('Số dư ví không đủ token')
    err.code = 'khong_du_token'
    throw err
  }

  // Tính ngày hết hạn mới
  const cu = listing?.expires_at ? new Date(listing.expires_at) : null
  const goc = cu && cu > new Date() ? cu : new Date()
  const d = new Date(goc)
  d.setMonth(d.getMonth() + months)
  const hetHanMoi = d.toISOString()

  const laGiaHan = Boolean(listing?.published_at)

  // Trừ token
  st.wallet.token_da_tieu += tokenCan
  st.wallet.so_du -= tokenCan

  const carName = [listing?.brand_text, listing?.model_text].filter(Boolean).join(' ')
  const noteGiaoDich = laGiaHan
    ? `Gia hạn tin ${carName || 'xe'} · ${months} tháng`
    : `Hiển thị tin ${carName || 'xe'} · ${months} tháng`

  // Thêm dòng sổ
  st.ledger.push({
    id: 'leg-demo-' + Date.now(),
    kind: 'tieu',
    amount: -tokenCan,
    so_du_sau: st.wallet.so_du,
    note: noteGiaoDich,
    listing_id: listingId,
    charge_kind: laGiaHan ? 'renew' : 'publish',
    created_at: new Date().toISOString(),
  })

  ghiState(st)

  return {
    ok: true,
    token_charged: tokenCan,
    expires_at: hetHanMoi,
    so_du: st.wallet.so_du,
    demo: true,
  }
}

/**
 * 8. Quản trị viên điều chỉnh ví tay: Hoàn token / Tặng token / Thu hồi token
 * (giống `dieuChinhVi` trong adminApi).
 */
export async function demoDieuChinhVi({ kind, tokens, reason }) {
  const st = docState()
  const soToken = Number(tokens)
  if (!Number.isInteger(soToken) || soToken <= 0) {
    throw new Error('Số token phải là số nguyên dương')
  }

  let delta = 0
  if (kind === 'tang' || kind === 'hoan') {
    delta = soToken
    if (kind === 'tang') {
      st.wallet.token_da_nap += soToken
    }
  } else if (kind === 'thu_hoi') {
    delta = -soToken
  } else {
    throw new Error('Loại điều chỉnh không hợp lệ: ' + kind)
  }

  st.wallet.so_du += delta
  if (st.wallet.so_du < 0) st.wallet.so_du = 0

  const nhanLoai = {
    tang: 'Tặng token',
    hoan: 'Hoàn token',
    thu_hoi: 'Thu hồi token',
  }[kind] ?? kind

  st.ledger.push({
    id: 'leg-demo-' + Date.now(),
    kind,
    amount: delta,
    so_du_sau: st.wallet.so_du,
    note: `${nhanLoai}: ${reason || 'Điều chỉnh thủ công'}`,
    listing_id: null,
    charge_kind: null,
    created_at: new Date().toISOString(),
  })

  ghiState(st)
  return { ok: true, soDu: st.wallet.so_du }
}

// Gắn hàm tiện ích vào window để có thể bật/tắt hoặc kiểm tra từ Console trình duyệt bất kỳ lúc nào:
if (typeof window !== 'undefined') {
  window.__tokenDemo = {
    isDemo: isTokenDemo,
    enable: batTokenDemo,
    disable: tatTokenDemo,
    toggle: chuyenDoiTokenDemo,
    reset: demoReset,
    getState: docState,
  }
}
