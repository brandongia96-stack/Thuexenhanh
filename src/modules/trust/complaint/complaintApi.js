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
  const { data, error } = await sb
    .from('complaints')
    .select(COT_KHIEU_NAI)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Một khiếu nại + toàn bộ dòng thời gian nhắn tin, cũ → mới. */
export async function layChiTietKhieuNai(complaintId) {
  const sb = await getSupabase()
  const [{ data: khieuNai, error: e1 }, { data: tinNhan, error: e2 }] = await Promise.all([
    sb.from('complaints').select(COT_KHIEU_NAI).eq('id', complaintId).single(),
    sb.from('complaint_messages').select('id,author_id,is_staff,body,created_at')
      .eq('complaint_id', complaintId).order('created_at', { ascending: true }),
  ])
  if (e1) throw e1
  if (e2) throw e2
  return { khieuNai, tinNhan: tinNhan ?? [] }
}

/**
 * Tạo khiếu nại mới. `content` tối thiểu 10 ký tự (CSDL chặn).
 * `reportId` dùng khi kháng cáo một báo cáo đã xác nhận — có thể null nếu
 * chưa lấy được (hàm `bao_cao_da_xac_nhan` chưa chạy trên Supabase).
 */
export async function taoKhieuNai({ userId, kind, content, listingId = null, reportId = null }) {
  const sb = await getSupabase()
  const noiDung = content?.trim() ?? ''
  if (noiDung.length < 10) {
    throw Object.assign(new Error('Vui lòng mô tả rõ hơn, ít nhất 10 ký tự.'), { code: 'du_lieu_khong_hop_le' })
  }
  const { data, error } = await sb
    .from('complaints')
    .insert({ user_id: userId, kind, content: noiDung, listing_id: listingId, report_id: reportId })
    .select(COT_KHIEU_NAI)
    .single()
  if (error) throw error
  return data
}

/** Chủ khiếu nại nhắn thêm (nút "Bổ sung"). Tin nhắn không sửa/xoá được. */
export async function guiBoSung({ complaintId, userId, body }) {
  const sb = await getSupabase()
  const noiDung = body?.trim() ?? ''
  if (!noiDung) return null
  const { data, error } = await sb
    .from('complaint_messages')
    .insert({ complaint_id: complaintId, author_id: userId, is_staff: false, body: noiDung })
    .select('id,author_id,is_staff,body,created_at')
    .single()
  if (error) throw error
  return data
}

/**
 * Id báo cáo đã xác nhận gần nhất trên một tin — để tiền điền `report_id` khi
 * chủ xe kháng cáo. Hàm server `bao_cao_da_xac_nhan` (nháp, chưa chạy) có thể
 * chưa tồn tại trên Supabase; lỗi thì coi như không có, không chặn việc gửi.
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
