// discovery/listing-page/baoGia — soạn nội dung báo giá gửi chủ xe qua Zalo.
//
// NGHIEN-CUU-XE-DIEN.md mục 4: Zalo không nhận tin soạn sẵn qua link một cách
// ổn định, nên cách làm là CHÉP vào clipboard rồi MỞ Zalo, báo khách tự dán.
// Hàm ở đây chỉ dựng chuỗi chữ — thuần, không đụng DOM/clipboard — để tách
// riêng khỏi phần có side-effect, dễ đọc và dễ test hơn.

import { formatVnd, formatDateTime } from '../../../lib/format'

/**
 * @param {object} p
 * @param {string} p.ten       "Toyota Innova 2021"
 * @param {Date|string} p.gioNhan
 * @param {Date|string} p.gioTra
 * @param {ReturnType<typeof import('./tinhChiPhi').tinhChiPhi>} p.ketQua
 * @returns {string|null}
 */
export function soanBaoGia({ ten, gioNhan, gioTra, ketQua }) {
  if (!ketQua) return null

  // Dòng chưa tính được số (soTien null, ví dụ "khách tự trả tiền sạc") thì
  // không đưa vào tin nhắn — một tin báo giá có dòng không có số dễ bị đọc
  // nhầm là lỗi, trong khi mô tả bằng lời đã nằm sẵn trên trang.
  const dong = ketQua.dong
    .filter((d) => d.soTien != null)
    .map((d) => `- ${d.nhan}: ${formatVnd(d.soTien)}`)
    .join('\n')

  const phan = [
    `Chào anh/chị, em quan tâm thuê xe ${ten} trên Thuexenhanh.`,
    `Thời gian dự kiến: ${formatDateTime(gioNhan)} → ${formatDateTime(gioTra)}`,
    dong && `Dự kiến chi phí:\n${dong}`,
    `Tổng dự kiến: ${formatVnd(ketQua.tongTien)}`,
    ketQua.coc?.soTien != null && `Cọc (hoàn lại khi trả xe): ${formatVnd(ketQua.coc.soTien)}`,
    'Anh/chị báo giúp em giá chính xác và xác nhận còn xe không ạ. Em cảm ơn!',
  ].filter(Boolean)

  return phan.join('\n\n')
}
