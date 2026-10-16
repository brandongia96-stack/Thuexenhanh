// modules/requests/requestsApi.js
// API giao tiếp với Supabase cho Bảng tin Cộng đồng tìm xe & Gói Pro.

import { getSupabase } from '../../lib/supabase'

/**
 * Lấy danh sách bài tin tìm xe trên Bảng tin Cộng đồng
 * @param {Object} [filter]
 * @param {number} [filter.lat] - Toạ độ người xem nếu có
 * @param {number} [filter.lng] - Toạ độ người xem nếu có
 * @param {number} [filter.provinceId]
 * @param {number} [filter.seats]
 * @param {string} [filter.status] - Mặc định 'da_duyet'
 * @param {number} [filter.limit] - Số lượng tin (mặc định 20)
 */
export async function layDanhSachTinTimXe({
  lat = null,
  lng = null,
  provinceId = null,
  seats = null,
  status = 'da_duyet',
  limit = 20
} = {}) {
  try {
    const sb = await getSupabase()

    // Nếu có toạ độ -> gọi RPC tính khoảng cách
    if (lat && lng) {
      let q = sb
        .rpc('customer_requests_gan', { p_lat: Number(lat), p_lng: Number(lng) })
        .eq('status', status)

      if (provinceId) q = q.eq('province_id', provinceId)
      if (seats) q = q.eq('seats', seats)

      const { data, error } = await q
        .order('distance_km', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data: data || [], error: null }
    }

    // Không có toạ độ -> đọc view Bảng tin
    let q = sb
      .from('customer_request_feed')
      .select('*')
      .eq('status', status)

    if (provinceId) q = q.eq('province_id', provinceId)
    if (seats) q = q.eq('seats', seats)

    const { data, error } = await q
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Lỗi layDanhSachTinTimXe:', err)
    return { data: [], error: err.message }
  }
}

/**
 * Lấy danh sách tin do chính người dùng hiện tại đăng
 */
export async function layTinCuaToi(userId) {
  if (!userId) return { data: [], error: 'chua_dang_nhap' }
  try {
    const sb = await getSupabase()
    const { data, error } = await sb
      .from('customer_requests')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

/**
 * Tạo mới bài đăng tìm xe (Khách gửi duyệt)
 */
export async function taoTinTimXe(params) {
  try {
    const sb = await getSupabase()
    const { data, error } = await sb
      .from('customer_requests')
      .insert({
        customer_id: params.customerId,
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        customer_zalo: params.customerZalo || params.customerPhone,
        customer_avatar: params.customerAvatar || null,
        start_date: params.startDate,
        end_date: params.endDate,
        seats: params.seats ? Number(params.seats) : null,
        transmission: params.transmission || 'bat_ky',
        fuel: params.fuel || 'bat_ky',
        body_style: params.bodyStyle || 'bat_ky',
        province_id: params.provinceId || null,
        district_id: params.districtId || null,
        address_text: params.addressText || null,
        lat: params.lat ? Number(params.lat) : null,
        lng: params.lng ? Number(params.lng) : null,
        budget_min: params.budgetMin ? Number(params.budgetMin) : null,
        budget_max: params.budgetMax ? Number(params.budgetMax) : null,
        budget_negotiable: params.budgetNegotiable !== false,
        extra_tags: params.extraTags || [],
        custom_note: params.customNote || null,
        content: params.content,
        consent_share_phone: true,
        status: 'cho_duyet' // Luôn qua kiểm duyệt
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Lỗi taoTinTimXe:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Đánh dấu tin đã tìm được xe (Khách tự đóng tin)
 */
export async function dongTinTimXe(requestId) {
  try {
    const sb = await getSupabase()
    const { error } = await sb
      .from('customer_requests')
      .update({ status: 'da_tim_thay', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) throw error
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Xem thông tin liên hệ của khách (mở SĐT thật qua RPC)
 */
export async function xemLienHeKhach(requestId) {
  try {
    const sb = await getSupabase()
    const { data, error } = await sb.rpc('xem_lien_he_tim_xe', {
      p_request_id: requestId
    })
    if (error) throw error
    return data
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Chủ xe gửi lời chào xe / gợi ý xe vào bài đăng
 */
export async function guiChaoXe({ requestId, ownerId, listingId, offerPrice, message }) {
  try {
    const sb = await getSupabase()
    const { data, error } = await sb
      .from('customer_request_offers')
      .insert({
        request_id: requestId,
        owner_id: ownerId,
        listing_id: listingId || null,
        offer_price: offerPrice ? Number(offerPrice) : null,
        message: message || ''
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message }
  }
}

/**
 * Lấy danh sách các chào xe của một bài đăng
 */
export async function layDanhSachChaoXe(requestId) {
  try {
    const sb = await getSupabase()
    const { data, error } = await sb
      .from('customer_request_offers')
      .select(`
        id,
        created_at,
        offer_price,
        message,
        owner_id,
        users:owner_id (full_name, avatar_url, phone),
        listing:listing_id (id, brand_text, model_text, price_per_day, year)
      `)
      .eq('request_id', requestId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

/**
 * Admin duyệt hoặc từ chối bài tin tìm xe
 */
export async function adminXuLyTinTimXe(requestId, dongY, lyDo = null) {
  try {
    const sb = await getSupabase()
    const statusMoi = dongY ? 'da_duyet' : 'tu_choi'
    const { error } = await sb
      .from('customer_requests')
      .update({
        status: statusMoi,
        reject_reason: lyDo,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) throw error

    // Nếu duyệt -> tự động xếp hàng thông báo cho chủ xe lân cận
    if (dongY) {
      try {
        await sb.rpc('notify_nearby_owners_on_request', { p_request_id: requestId })
      } catch (e) {
        console.warn('Lỗi kích hoạt thông báo lân cận:', e)
      }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Mua / Gia hạn Gói Pro bằng Token
 */
export async function muaGoiPro({ userId, soThang = 1, costToken = 30 }) {
  try {
    const sb = await getSupabase()
    const idemKey = `pro_${userId}_${Date.now()}`
    const { data, error } = await sb.rpc('mua_goi_pro', {
      p_user_id: userId,
      p_so_thang: soThang,
      p_cost_token: costToken,
      p_idem_key: idemKey
    })

    if (error) throw error
    return data
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
