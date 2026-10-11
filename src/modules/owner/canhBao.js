// owner/canhBao — vì sao một tin bị chặn, bị gắn cờ hay bị từ chối.
//
// Hàm thuần. Chỉ nêu những gì CSDL thật sự ghi lại: trạng thái từ chối + lý do,
// cờ giá thấp, số báo cáo đã được người duyệt xác nhận. Không có cột "giảm hiển
// thị" nên không bịa ra loại cảnh báo đó.

/**
 * @param {object} xe   hàng `listing_card` (status, report_count)
 * @param {object} [co] hàng `listings` (price_anomaly, reject_reason)
 * @returns {{key:string, text:string}[]} rỗng = không có gì để báo
 */
export function lyDoCanhBao(xe, co) {
  const ra = []

  if (xe?.status === 'tu_choi') {
    const ly = co?.reject_reason?.trim()
    ra.push({
      key: 'tu_choi',
      text: ly ? `Tin bị từ chối. Lý do: ${ly}` : 'Tin bị từ chối. Người duyệt chưa ghi lý do.',
    })
  }

  if (co?.price_anomaly) {
    ra.push({
      key: 'gia_thap',
      text: 'Giá thấp hơn mức tham khảo cho dòng xe này nên tin đang chờ người duyệt xem lại.',
    })
  }

  const n = Number(xe?.report_count) || 0
  if (n > 0) {
    ra.push({
      key: 'bao_cao',
      text: `Có ${n} báo cáo về tin này đã được người duyệt xác nhận.`,
    })
  }

  return ra
}
