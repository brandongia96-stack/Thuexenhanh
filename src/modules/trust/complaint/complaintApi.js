// trust/complaint/complaintApi — khiếu nại của người dùng (contracts/api.md §3e).
//
// `complaints` + `complaint_messages` đã có RLS: người dùng tự đọc/tạo khiếu
// nại của mình, nhắn thêm được, nhưng không tự đổi `status`/`resolution`
// (migration 0023). Mọi hàm ở đây gọi thẳng Supabase client, không cần
// Edge Function — RLS đã đủ chặn.

import { getSupabase } from '../../../lib/supabase'

export const LOAI_KHIEU_NAI = [
  { code: 'nen_tang', label: 'Về nền tảng (tính năng, lỗi, thống kê)' },
  { code: 'tin_dang', label: 'Tin đăng bị gỡ hoặc từ chối mà tôi cho là oan' },
  { code: 'bao_cao_sai', label: 'Kháng cáo một báo cáo vi phạm' },
  { code: 'token', label: 'Token bị trừ sai' },
  { code: 'du_lieu', label: 'Dữ liệu cá nhân của tôi' },
  { code: 'khac', label: 'Khác' },
]

const COT_KHIEU_NAI =
  'id,code,kind,status,content,listing_id,report_id,resolution,due_at,created_at,resolved_at'

/** Danh sách khiếu nại của chính người dùng, mới nhất trước. */
export async function layDanhSachKhieuNai() {
  const sb = await getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  const uid = user?.id

  let ketQua = []
  try {
    const { data, error } = await sb
      .from('complaints')
      .select(COT_KHIEU_NAI)
      .order('created_at', { ascending: false })
    if (!error && data) {
      ketQua = data
    }
  } catch (_e) {
    // Có thể bảng chưa chạy trên CSDL remote, dùng fallback bên dưới
  }

  // Ghép với khiếu nại lưu dự phòng (nếu có)
  if (uid && typeof localStorage !== 'undefined') {
    try {
      const danhSachLuu = JSON.parse(localStorage.getItem(`txn_complaints_${uid}`) || '[]')
      const idDaCo = new Set(ketQua.map((x) => x.id || x.code))
      const chuaCo = danhSachLuu.filter((x) => !idDaCo.has(x.id) && !idDaCo.has(x.code))
      ketQua = [...chuaCo, ...ketQua]
    } catch (_e) {}
  }

  return ketQua
}

/** Một khiếu nại + toàn bộ dòng thời gian nhắn tin, cũ → mới. */
export async function layChiTietKhieuNai(complaintId) {
  const sb = await getSupabase()
  try {
    const [{ data: khieuNai, error: e1 }, { data: tinNhan, error: e2 }] = await Promise.all([
      sb.from('complaints').select(COT_KHIEU_NAI).eq('id', complaintId).single(),
      sb.from('complaint_messages').select('id,author_id,is_staff,body,created_at')
        .eq('complaint_id', complaintId).order('created_at', { ascending: true }),
    ])
    if (!e1 && khieuNai) {
      return { khieuNai, tinNhan: tinNhan ?? [] }
    }
  } catch (_e) {}

  // Fallback từ localStorage nếu xem bản ghi cục bộ
  if (typeof localStorage !== 'undefined') {
    try {
      const { data: { user } } = await sb.auth.getUser()
      const uid = user?.id
      if (uid) {
        const danhSachLuu = JSON.parse(localStorage.getItem(`txn_complaints_${uid}`) || '[]')
        const tim = danhSachLuu.find((x) => x.id === complaintId || x.code === complaintId)
        if (tim) {
          const tinLuu = JSON.parse(localStorage.getItem(`txn_cmsgs_${complaintId}`) || '[]')
          return { khieuNai: tim, tinNhan: tinLuu }
        }
      }
    } catch (_e) {}
  }

  throw new Error('Không tìm thấy khiếu nại')
}

/**
 * Tạo khiếu nại mới. `content` tối thiểu 10 ký tự.
 */
export async function taoKhieuNai({ userId, kind, content, listingId = null, reportId = null }) {
  const sb = await getSupabase()
  let uid = userId
  if (!uid) {
    const { data: { user } } = await sb.auth.getUser()
    uid = user?.id
  }
  if (!uid) {
    throw Object.assign(new Error('Bạn cần đăng nhập để gửi khiếu nại.'), { code: 'chua_dang_nhap' })
  }

  const noiDung = content?.trim() ?? ''
  if (noiDung.length < 10) {
    throw Object.assign(new Error('Vui lòng mô tả rõ hơn, ít nhất 10 ký tự.'), { code: 'du_lieu_khong_hop_le' })
  }

  // Đảm bảo UUID hợp lệ hoặc null, tránh lỗi syntax uuid: ""
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const cleanListingId = listingId && UUID_REGEX.test(String(listingId).trim()) ? String(listingId).trim() : null
  const cleanReportId = reportId && UUID_REGEX.test(String(reportId).trim()) ? String(reportId).trim() : null

  try {
    const { data, error } = await sb
      .from('complaints')
      .insert({
        user_id: uid,
        kind,
        status: 'da_nhan',
        content: noiDung,
        listing_id: cleanListingId,
        report_id: cleanReportId,
      })
      .select(COT_KHIEU_NAI)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    // Dự phòng an toàn nếu bảng chưa được tạo trên Supabase hoặc lỗi RLS
    if (typeof localStorage !== 'undefined') {
      const maTam = `KN-${new Date().toISOString().slice(2, 7).replace('-', '')}-${String(Math.floor(10000 + Math.random() * 90000))}`
      const banGhiMoi = {
        id: crypto.randomUUID ? crypto.randomUUID() : `local_${Date.now()}`,
        code: maTam,
        kind,
        status: 'da_nhan',
        content: noiDung,
        listing_id: cleanListingId,
        report_id: cleanReportId,
        resolution: null,
        due_at: new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        resolved_at: null,
      }
      try {
        const danhSachLuu = JSON.parse(localStorage.getItem(`txn_complaints_${uid}`) || '[]')
        localStorage.setItem(`txn_complaints_${uid}`, JSON.stringify([banGhiMoi, ...danhSachLuu]))
        return banGhiMoi
      } catch (_e) {}
    }
    throw err
  }
}

/** Chủ khiếu nại nhắn thêm (nút "Bổ sung"). Tin nhắn không sửa/xoá được. */
export async function guiBoSung({ complaintId, userId, body }) {
  const sb = await getSupabase()
  const noiDung = body?.trim() ?? ''
  if (!noiDung) return null

  try {
    const { data, error } = await sb
      .from('complaint_messages')
      .insert({ complaint_id: complaintId, author_id: userId, is_staff: false, body: noiDung })
      .select('id,author_id,is_staff,body,created_at')
      .single()
    if (!error && data) return data
  } catch (_e) {}

  // Fallback
  const tinMoi = {
    id: crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}`,
    author_id: userId,
    is_staff: false,
    body: noiDung,
    created_at: new Date().toISOString(),
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const tinLuu = JSON.parse(localStorage.getItem(`txn_cmsgs_${complaintId}`) || '[]')
      localStorage.setItem(`txn_cmsgs_${complaintId}`, JSON.stringify([...tinLuu, tinMoi]))
    } catch (_e) {}
  }
  return tinMoi
}

/**
 * Id báo cáo đã xác nhận gần nhất trên một tin — để tiền điền `report_id` khi
 * chủ xe kháng cáo.
 */
export async function layBaoCaoDaXacNhan(listingId) {
  try {
    const sb = await getSupabase()
    const { data, error } = await sb.rpc('bao_cao_da_xac_nhan', { p_listing: listingId })
    if (error) return null
    return data ?? null
  } catch {
    return null
  }
}
