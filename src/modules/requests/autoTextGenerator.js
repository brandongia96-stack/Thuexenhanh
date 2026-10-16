import { formatVnd } from '../../lib/format'

/**
 * Định dạng ngày dd/mm/yyyy từ chuỗi yyyy-mm-dd
 */
function dinhDangNgay(str) {
  if (!str) return ''
  const parts = str.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return str
}

/**
 * Tính số ngày giữa 2 mốc ngày
 */
export function tinhSoNgay(tuNgay, denNgay) {
  if (!tuNgay || !denNgay) return 1
  const d1 = new Date(tuNgay)
  const d2 = new Date(denNgay)
  const diffTime = d2.getTime() - d1.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 1
}

/**
 * Sinh văn bản tự động dựa trên 5 tiêu chí
 * @param {Object} params
 * @param {string} params.startDate - YYYY-MM-DD
 * @param {string} params.endDate - YYYY-MM-DD
 * @param {number|string} params.seats - Số chỗ ngồi (4, 5, 7, 16...)
 * @param {string} params.bodyStyle - Dáng xe (sedan, suv, mpv, ban_tai...)
 * @param {string} params.transmission - 'tu_dong' | 'so_san' | 'bat_ky'
 * @param {string} params.fuel - 'xang' | 'dau' | 'dien' | 'bat_ky'
 * @param {string} params.provinceName - Tên tỉnh/thành
 * @param {string} params.districtName - Tên quận/huyện
 * @param {string} params.addressText - Địa chỉ cụ thể
 * @param {string} params.budgetOption - Mức ngân sách
 * @param {number} [params.budgetCustom] - Ngân sách tự nhập nếu có
 * @param {string[]} params.extraTags - Mảng các nhãn yêu cầu thêm
 * @param {string} [params.customNote] - Ghi chú riêng của khách
 * @returns {string} Bài viết hoàn chỉnh
 */
export function sinhNoiDungTimXe({
  startDate,
  endDate,
  seats,
  bodyStyle,
  transmission,
  fuel,
  provinceName,
  districtName,
  addressText,
  budgetOption,
  budgetCustom,
  extraTags = [],
  customNote = ''
}) {
  const ngayBatDauFmt = dinhDangNgay(startDate)
  const ngayKetThucFmt = dinhDangNgay(endDate)
  const soNgay = tinhSoNgay(startDate, endDate)

  // 1. Tiêu đề khu vực
  const diaDiemNhan = [addressText, districtName, provinceName].filter(Boolean).join(', ')
  const tieuDeKhuVuc = provinceName ? ` TẠI ${provinceName.toUpperCase()}` : ''

  // 2. Mô tả dòng xe
  const loaiHopSo = transmission === 'tu_dong' ? 'số tự động' : transmission === 'so_san' ? 'số sàn' : ''
  const loaiNhienLieu = fuel === 'dien' ? 'xe điện' : fuel === 'dau' ? 'máy dầu' : fuel === 'xang' ? 'máy xăng' : ''
  
  let loaiXeText = ''
  if (seats) {
    loaiXeText += `${seats} chỗ`
  }
  if (bodyStyle && bodyStyle !== 'bat_ky') {
    const mapBody = {
      sedan: 'Sedan',
      suv: 'SUV / Gầm cao',
      mpv: 'MPV gia đình',
      ban_tai: 'Bán tải',
      hatchback: 'Hatchback',
      '16cho': '16 chỗ'
    }
    loaiXeText += ` (${mapBody[bodyStyle] || bodyStyle})`
  }
  if (loaiHopSo) {
    loaiXeText += ` ${loaiHopSo}`
  }
  if (loaiNhienLieu) {
    loaiXeText += ` (${loaiNhienLieu})`
  }
  if (!loaiXeText) loaiXeText = 'xe tự lái theo nhu cầu'

  // 3. Ngân sách
  let nganSachText = 'Thoả thuận hợp lý theo chất lượng xe'
  if (budgetOption === 'custom' && budgetCustom > 0) {
    nganSachText = `Khoảng ${formatVnd(budgetCustom)}/ngày`
  } else if (budgetOption === 'duoi_700k') {
    nganSachText = 'Dưới 700.000đ/ngày (xe tiết kiệm)'
  } else if (budgetOption === '700k_1tr') {
    nganSachText = 'Khoảng 700.000đ – 1.000.000đ/ngày'
  } else if (budgetOption === '1tr_1tr5') {
    nganSachText = 'Khoảng 1.000.000đ – 1.500.000đ/ngày'
  } else if (budgetOption === '1tr5_2tr5') {
    nganSachText = 'Khoảng 1.500.000đ – 2.500.000đ/ngày'
  } else if (budgetOption === 'tren_2tr5') {
    nganSachText = 'Trên 2.500.000đ/ngày (xe sang/đời mới)'
  }

  // 4. Yêu cầu thêm (tags)
  const mapTags = {
    giao_tan_noi: 'Giao xe tận nơi hoặc hỗ trợ nhận xe thuận tiện',
    mien_the_chap: 'Ưu tiên chủ xe hỗ trợ miễn cọc xe máy',
    doi_moi: 'Xe đời mới, máy êm, bảo dưỡng định kỳ',
    sach_se: 'Xe sạch sẽ, không mùi thuốc lá, điều hoà mát sâu',
    di_tinh: 'Lịch trình đi tỉnh / về quê / du lịch',
    free_sac: 'Nếu là xe điện mong muốn có ưu đãi Free sạc',
    co_tai: 'Có nhu cầu thuê kèm tài xế lịch sự'
  }

  const listYeuCau = extraTags
    .map(tag => mapTags[tag])
    .filter(Boolean)

  if (customNote && customNote.trim()) {
    listYeuCau.push(customNote.trim())
  }

  // 5. Lắp ghép văn bản hoàn chỉnh
  let lines = [
    `🚗 [CẦN THUÊ XE TỰ LÁI${tieuDeKhuVuc}]`,
    `Chào các anh/chị chủ xe! Em đang có nhu cầu cần tìm thuê xe:`,
    ``,
    `🔹 Loại xe: ${loaiXeText}`,
    `📅 Thời gian thuê: Từ ${ngayBatDauFmt || '...'} đến ${ngayKetThucFmt || '...'} (${soNgay} ngày)`,
    `📍 Khu vực nhận xe: ${diaDiemNhan || 'Gần khu vực của bạn'}`,
    `💰 Dự kiến ngân sách: ${nganSachText}`
  ]

  if (listYeuCau.length > 0) {
    lines.push(``)
    lines.push(`✨ Yêu cầu thêm:`)
    listYeuCau.forEach(yc => {
      lines.push(`- ${yc}`)
    })
  }

  lines.push(``)
  lines.push(`👉 Bác chủ xe nào có xe trống lịch trên, vui lòng bấm "Gợi ý xe" hoặc bấm "Xem liên hệ" để kết nối trao đổi trực tiếp với em nhé. Cảm ơn cộng đồng!`)

  return lines.join('\n')
}
