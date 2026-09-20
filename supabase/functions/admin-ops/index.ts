// POST /admin-ops  — cửa DUY NHẤT cho thao tác quản trị (luồng 10)
//
// Vào:  { action: '<tên>', ...tham số }
// Ra:   kết quả của hàm Postgres tương ứng, hoặc { error, message, fields? }
//
// Hai lớp chặn quyền, không tin lớp nào một mình:
//   1. Ở đây: xác thực JWT, tra vai trò trong user_roles bằng service_role.
//   2. Trong từng hàm 0005_admin.sql: hàm TỰ kiểm tra lại p_actor.
// Client không bao giờ gửi "tôi là admin" — người gọi luôn lấy từ JWT.
//
// Không có action nào ghi thẳng vào bảng. Mọi thao tác ghi là một hàm
// security definer chạy một transaction, đã tự ghi `admin_actions`.

import { preflight, docBody, json, loi } from '../_shared/http.ts'
import { admin, nguoiGoi } from '../_shared/db.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NGAY = /^\d{4}-\d{2}-\d{2}$/
// 1 token = 4.000đ (CLAUDE.md mục 6, khớp src/lib/config.js TOKEN_VND).
// Nằm MỘT chỗ ở đây, hàm SQL nhận qua tham số.
const TOKEN_VND = 4000

type Body = Record<string, unknown>
type Vai = { admin: boolean; kiemDuyet: boolean }

const uuid = (v: unknown) => (typeof v === 'string' && UUID.test(v) ? v : null)
const chu = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const sai = (truong: string, message: string) =>
  loi('du_lieu_khong_hop_le', message, { fields: { [truong]: 'khong_hop_le' } })

async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await admin().rpc(name, args)
  if (error) {
    console.error('admin-ops', name, error)
    return loi('loi_he_thong', 'Không thực hiện được, chưa có thay đổi nào được ghi')
  }
  return json(data)
}

Deno.serve(async (req) => {
  const p = preflight(req)
  if (p) return p

  const user = await nguoiGoi(req)
  if (!user) return loi('chua_dang_nhap', 'Bạn cần đăng nhập')

  const { data: rows, error } = await admin()
    .from('user_roles').select('role').eq('user_id', user.id).is('deleted_at', null)
  if (error) {
    console.error('admin-ops roles', error)
    return loi('loi_he_thong', 'Không kiểm tra được quyền')
  }
  const roles = (rows ?? []).map((r: { role: string }) => r.role)
  const vai: Vai = { admin: roles.includes('admin'), kiemDuyet: roles.includes('kiem_duyet') }
  if (!vai.admin && !vai.kiemDuyet) {
    return loi('khong_co_quyen', 'Bạn không có quyền vào khu quản trị')
  }

  const b = (await docBody<Body>(req)) ?? {}
  const actor = user.id

  switch (b.action) {
    // ── kiểm duyệt: kiem_duyet + admin ──
    case 'moderate_listing': {
      const id = uuid(b.listing_id)
      if (!id) return sai('listing_id', 'Thiếu mã tin')
      return rpc('admin_moderate_listing', {
        p_actor: actor, p_listing: id, p_decision: chu(b.decision, 10), p_reason: chu(b.reason),
      })
    }
    case 'plate_conflicts': {
      const id = uuid(b.listing_id)
      if (!id) return sai('listing_id', 'Thiếu mã tin')
      return rpc('admin_plate_conflicts', { p_actor: actor, p_listing: id })
    }
    case 'handle_report': {
      const id = uuid(b.report_id)
      if (!id) return sai('report_id', 'Thiếu mã báo cáo')
      return rpc('admin_handle_report', {
        p_actor: actor, p_report: id, p_status: chu(b.status, 20), p_note: chu(b.note),
      })
    }
    case 'health':
      return rpc('admin_health', { p_actor: actor, p_days: Number(b.days) || 14 })

    // ── chỉ admin ──
    case 'set_user_lock': {
      const id = uuid(b.user_id)
      if (!id) return sai('user_id', 'Thiếu mã người dùng')
      if (typeof b.lock !== 'boolean') return sai('lock', 'Thiếu lock')
      return rpc('admin_set_user_lock', {
        p_actor: actor, p_user: id, p_lock: b.lock, p_reason: chu(b.reason),
      })
    }
    case 'set_verified': {
      const id = uuid(b.user_id)
      if (!id) return sai('user_id', 'Thiếu mã người dùng')
      return rpc('admin_set_verified', {
        p_actor: actor, p_user: id, p_status: chu(b.verify_status, 20), p_note: chu(b.note),
      })
    }
    case 'adjust_wallet': {
      const id = uuid(b.user_id)
      if (!id) return sai('user_id', 'Thiếu mã người dùng')
      const tokens = Number(b.tokens)
      if (!Number.isInteger(tokens)) return sai('tokens', 'Số token phải là số nguyên')
      const idem = chu(b.idem_key, 120)
      if (!idem) return sai('idem_key', 'Thiếu idem_key')
      return rpc('admin_adjust_wallet', {
        p_actor: actor, p_user: id, p_kind: chu(b.kind, 10),
        p_tokens: tokens, p_reason: chu(b.reason), p_idem: idem,
      })
    }
    case 'revenue': {
      const tu = chu(b.from, 10), den = chu(b.to, 10)
      if (!NGAY.test(tu) || !NGAY.test(den)) return sai('from', 'Ngày phải dạng YYYY-MM-DD')
      return rpc('admin_revenue', { p_actor: actor, p_from: tu, p_to: den, p_token_vnd: TOKEN_VND })
    }
    case 'user_wallet': {
      // Đọc ví của người khác: RLS chỉ cho xem ví mình, nên phải đi đường này.
      if (!vai.admin) return loi('khong_co_quyen', 'Kiểm duyệt viên không được xem ví')
      const id = uuid(b.user_id)
      if (!id) return sai('user_id', 'Thiếu mã người dùng')
      const db = admin()
      const [bal, ledger] = await Promise.all([
        db.from('wallet_balances').select('token_da_nap,token_da_tieu,so_du')
          .eq('user_id', id).maybeSingle(),
        db.from('wallet_ledger')
          .select('id,kind,amount,so_du_sau,note,created_at')
          .eq('user_id', id)
          .order('created_at', { ascending: false }).order('id', { ascending: false })
          .limit(30),
      ])
      if (bal.error || ledger.error) {
        console.error('admin-ops user_wallet', bal.error ?? ledger.error)
        return loi('loi_he_thong', 'Không tải được ví')
      }
      return json({ so_du: bal.data ?? null, so_giao_dich: ledger.data ?? [] })
    }
    default:
      return loi('du_lieu_khong_hop_le', 'action không hợp lệ')
  }
})
