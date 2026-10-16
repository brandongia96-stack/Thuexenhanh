/**
 * tools/seo-writer/engine/antiAiRules.js
 * 
 * BỘ QUY TẮC CHỐNG VĂN PHONG AI (ANTI-AI SLOP) & ĐẬM CHẤT THỰC CHIẾN
 * Giúp bài viết vượt qua mọi bộ lọc AI (Originality.ai, GPTZero, Turnitin)
 * và được Google xếp hạng cao nhờ trải nghiệm thực tế (E-E-A-T).
 */

export const BANNED_AI_WORDS = [
  'trong bối cảnh hiện đại',
  'trong thời đại công nghệ số',
  'trong thời đại số',
  'trong cuộc sống hiện đại',
  'ngày càng phát triển',
  'không thể phủ nhận rằng',
  'không thể không nhắc đến',
  'đóng vai trò vô cùng quan trọng',
  'đóng vai trò quan trọng',
  'là một sự lựa chọn hoàn hảo',
  'sự lựa chọn lý tưởng',
  'giải pháp hoàn hảo',
  'hãy cùng chúng tôi tìm hiểu',
  'hãy cùng khám phá',
  'hãy cùng điểm qua',
  'tóm lại',
  'kết luận lại',
  'nói tóm lại',
  'nhìn chung',
  'như chúng ta đã biết',
  'ngày càng trở nên phổ biến',
  'đáng chú ý là',
  'với sự phát triển không ngừng',
  'sự kết hợp hoàn hảo',
  'bài viết này sẽ giúp bạn',
  'bài viết dưới đây sẽ',
  'hãy cùng bắt đầu nhé',
  'vô vàn lợi ích',
  'như một bức tranh',
  'điểm sáng nổi bật',
  'hứa hẹn mang đến',
  'nâng tầm trải nghiệm',
  'mang lại trải nghiệm tuyệt vời',
  'tất tần tật',
  'từ a đến z',
  'đáp ứng mọi nhu cầu',
  'chiều lòng ngay cả những khách hàng khó tính nhất',
  'vị cứu tinh',
  'cơn sốt',
  'khuấy đảo thị trường',
  'bước ngoặt',
  'được ví như',
  'khoác lên mình',
  'trái tim của chiếc xe',
  'chiếc chìa khóa vạn năng',
]

/**
 * Các cụm từ và giọng điệu thực chiến của dân trong nghề (Practitioner Tone)
 * Được dùng để thay thế văn phong sách vở của AI.
 */
export const PRACTITIONER_PHRASES = [
  'Kinh nghiệm xương máu là',
  'Nói thẳng ra thì',
  'Rất nhiều bác tài mới hay dính chỗ này:',
  'Thực tế khi nhận xe bạn nên',
  'Đừng nghe người ta hứa mồm, cứ nhìn vào',
  'Con số thực tế bạn phải trả gồm:',
  'Điểm mấu chốt ở hợp đồng là',
  'Nhiều chủ xe thường bỏ qua điểm này nhưng',
  'Mẹo nhỏ để không bị đền tiền:',
  'Theo quy định mới nhất hiện nay,',
]

/**
 * Dữ liệu thực tế thị trường xe tự lái tại Việt Nam (Fact Injection)
 * Giúp AI viết bài có độ chính xác và thông tin sâu (Information Gain).
 */
export const CAR_RENTAL_FACTS = {
  pricing: {
    hangA: 'Grand i10, Morning, Wuling MiniEV: 450.000đ - 650.000đ/ngày',
    sedanB: 'Toyota Vios, Hyundai Accent, Honda City: 650.000đ - 900.000đ/ngày (lễ Tết 1.200.000đ - 1.500.000đ)',
    suvC: 'Mazda CX-5, Hyundai Tucson, Kia Seltos, Creta: 900.000đ - 1.300.000đ/ngày',
    mpv7cho: 'Mitsubishi Xpander, Toyota Veloz: 850.000đ - 1.100.000đ/ngày',
    suv7cho: 'Toyota Fortuner, Ford Everest, Hyundai SantaFe: 1.200.000đ - 1.600.000đ/ngày',
    caoCap: 'Kia Carnival, Mercedes C-Class: 1.800.000đ - 2.800.000đ/ngày',
    xeDien: 'VinFast VF 3 (500k-650k), VF 5 (650k-850k), VF 8 (1.3tr-1.7tr/ngày)',
    phuPhiKm: 'Quá 250km - 300km/ngày: tính phụ phí 3.000đ - 5.000đ/km',
    phuPhiGio: 'Quá giờ trả xe: 50.000đ - 100.000đ/giờ',
    luuDem: '200.000đ - 400.000đ/đêm tuỳ dòng xe'
  },
  legal: {
    cccd: 'Theo Nghị định 282/2025/NĐ-CP và Luật Căn cước mới: TUYỆT ĐỐI KHÔNG để chủ xe hoặc cơ sở cho thuê giữ bản gốc CCCD gắn chip. Chỉ cho đối chiếu hoặc quét mã QR xác thực.',
    taiSanCoc: 'Tài sản thế chấp thông thường: Xe máy chính chủ (kèm cà vẹt gốc giá trị từ 15-20 triệu) HOẶC chuyển khoản cọc tiền mặt từ 15.000.000đ - 30.000.000đ.',
    phatNguoi: 'Tiền cọc giữ lại tra phạt nguội: Sau khi trả xe, chủ xe được giữ lại 2.000.000đ - 5.000.000đ trong 15 đến 30 ngày để tra cứu trên hệ thống csgt.vn. Nếu không có lỗi sẽ hoàn trả 100% qua tài khoản.',
    hopDong: 'Bắt buộc phải có Biên bản bàn giao xe ghi nhận: số km hiện tại, vạch xăng/pin, các vết trầy xước có sẵn, tình trạng lốp dự phòng, camera hành trình và kiểm định còn hạn.'
  },
  platformInfo: {
    name: 'Thuexenhanh',
    domain: 'thuexenhanh.com',
    model: 'Nền tảng kết nối trực tiếp chủ xe và khách thuê tự lái. KHÔNG thu hoa hồng môi giới. Khách xem số điện thoại và gọi trực tiếp chủ xe.',
    feeForOwner: 'Chủ xe chỉ trả phí hiển thị tin: 10 token = 40.000đ/xe/tháng, giữ trọn 100% tiền thuê xe.'
  }
}

/**
 * Kiểm tra các từ cấm AI trong văn bản
 */
export function checkAiSlop(text) {
  if (!text) return { score: 100, matches: [] }
  const lower = text.toLowerCase()
  const matches = []
  
  for (const word of BANNED_AI_WORDS) {
    if (lower.includes(word)) {
      matches.push(word)
    }
  }

  // Chấm điểm: Cứ mỗi từ cấm bị trừ 4 điểm
  const penalty = matches.length * 4
  const score = Math.max(0, 100 - penalty)

  return {
    score,
    matches,
    isSlopFree: matches.length === 0,
    penalty
  }
}
