/**
 * tools/seo-writer/engine/keywordsBank.js
 * 
 * KHO TỪ KHÓA VÀNG NGÀNH THUÊ XE TỰ LÁI (ĐÃ PHÂN TÍCH SEARCH INTENT & ĐỘ CẠNH TRANH)
 * Được chia theo 5 Cụm Chủ Đề (Topic Clusters) giúp website phủ thẩm quyền chuyên gia
 * (Topical Authority) và leo Top 3 Google trong vòng 3 tháng.
 */

export const KEYWORD_CLUSTERS = [
  {
    id: 'kinh-nghiem-phap-ly',
    name: '1. Cẩm Nang Thực Chiến & Pháp Lý An Toàn',
    description: 'Tỷ lệ cạnh tranh vừa phải, tỷ lệ chuyển đổi và đọc lâu (Dwell Time) cực cao.',
    keywords: [
      {
        keyword: 'kinh nghiệm thuê xe tự lái tránh bị đền tiền oan',
        intent: 'Informational / How-to',
        difficulty: 'Dễ - Trung bình',
        targetDays: '45 - 60 ngày',
        searchVolumeEst: '2.400 / tháng',
        recommendedLength: '2.200 từ',
        primaryHook: 'Bí kíp quay video 360 độ và kiểm tra 6 điểm mù của xe trước khi ký bàn giao.'
      },
      {
        keyword: 'thủ tục thuê xe tự lái không cần hộ khẩu 2026',
        intent: 'Transactional / Commercial',
        difficulty: 'Dễ',
        targetDays: '30 - 45 ngày',
        searchVolumeEst: '1.800 / tháng',
        recommendedLength: '1.800 từ',
        primaryHook: 'Hầu hết các bên đã bỏ sổ hộ khẩu giấy. Cần chuẩn bị những gì thay thế?'
      },
      {
        keyword: 'nghị định 282 thuê xe tự lái có được giữ cccd gốc không',
        intent: 'Informational / Legal',
        difficulty: 'Rất dễ (Từ khóa xu hướng mới)',
        targetDays: '15 - 30 ngày',
        searchVolumeEst: '1.200 / tháng',
        recommendedLength: '1.900 từ',
        primaryHook: 'Cảnh báo mức phạt nếu chủ xe cố tình giữ CCCD gắn chip gốc theo quy định mới.'
      },
      {
        keyword: 'thuê xe tự lái bị phạt nguội ai trả tiền và xử lý thế nào',
        intent: 'Informational / Problem Solving',
        difficulty: 'Dễ',
        targetDays: '30 - 60 ngày',
        searchVolumeEst: '2.100 / tháng',
        recommendedLength: '2.000 từ',
        primaryHook: 'Quy trình kiểm tra phạt nguội trên csgt.vn và thời gian giữ tiền cọc đối soát.'
      },
      {
        keyword: 'hợp đồng thuê xe tự lái cần chú ý những điều khoản gì',
        intent: 'Informational / Transactional',
        difficulty: 'Dễ - Trung bình',
        targetDays: '45 - 75 ngày',
        searchVolumeEst: '1.500 / tháng',
        recommendedLength: '2.400 từ',
        primaryHook: '5 điều khoản cài cắm trong hợp đồng khiến người thuê xe mất trắng tiền cọc.'
      }
    ]
  },
  {
    id: 'bang-gia-dong-xe',
    name: '2. Bảng Giá & So Sánh Dòng Xe Thuê Phổ Biến',
    description: 'Ý định thuê xe (Commercial Intent) mạnh nhất, kéo khách thuê vào xem xe trực tiếp.',
    keywords: [
      {
        keyword: 'bảng giá thuê xe tự lái 4 chỗ 7 chỗ mới nhất 2026',
        intent: 'Commercial / Investigative',
        difficulty: 'Trung bình',
        targetDays: '60 - 90 ngày',
        searchVolumeEst: '5.400 / tháng',
        recommendedLength: '2.500 từ',
        primaryHook: 'Cập nhật giá thuê theo ngày, theo tháng của từng phân khúc sedan, MPV, SUV.'
      },
      {
        keyword: 'thuê xe xpander tự lái giá bao nhiêu 1 ngày',
        intent: 'Commercial',
        difficulty: 'Dễ',
        targetDays: '30 - 45 ngày',
        searchVolumeEst: '3.200 / tháng',
        recommendedLength: '1.900 từ',
        primaryHook: 'Mẫu 7 chỗ quốc dân: Tiêu hao xăng thực tế và khoảng giá thuê hợp lý.'
      },
      {
        keyword: 'thuê xe kia carnival tự lái tphcm giá rẻ uy tín',
        intent: 'Commercial / Transactional',
        difficulty: 'Trung bình',
        targetDays: '45 - 60 ngày',
        searchVolumeEst: '2.900 / tháng',
        recommendedLength: '2.100 từ',
        primaryHook: 'Phân tích trải nghiệm limousine 7 chỗ đi gia đình, cách thuê trực tiếp chủ xe giá tốt.'
      },
      {
        keyword: 'thuê xe vf3 tự lái giá bao nhiêu 1 ngày trải nghiệm',
        intent: 'Commercial (Từ khóa cực hot)',
        difficulty: 'Dễ',
        targetDays: '20 - 40 ngày',
        searchVolumeEst: '4.800 / tháng',
        recommendedLength: '1.800 từ',
        primaryHook: 'Xe điện mini chạy phố: Chi phí thuê, quãng đường thực tế và trạm sạc.'
      },
      {
        keyword: 'so sánh thuê xe vios và accent tự lái xe nào lợi xăng hơn',
        intent: 'Investigative / Comparison',
        difficulty: 'Rất dễ',
        targetDays: '30 - 45 ngày',
        searchVolumeEst: '1.600 / tháng',
        recommendedLength: '2.000 từ',
        primaryHook: 'Cân đo đong đếm chi phí thuê và mức ăn xăng cho chuyến đi 500km.'
      }
    ]
  },
  {
    id: 'cung-duong-dia-phuong',
    name: '3. Thuê Xe Tự Lái Theo Tỉnh & Cung Phượt Du Lịch',
    description: 'Từ khóa SEO Local nhắm đúng tệp khách chuẩn bị đi nghỉ cuối tuần hoặc du lịch.',
    keywords: [
      {
        keyword: 'thuê xe tự lái tphcm đi vũng tàu cuối tuần kinh nghiệm chi tiết',
        intent: 'Commercial / Local',
        difficulty: 'Dễ - Trung bình',
        targetDays: '45 - 60 ngày',
        searchVolumeEst: '3.100 / tháng',
        recommendedLength: '2.300 từ',
        primaryHook: 'Lịch trình cao tốc Long Thành, trạm dừng chân và lưu ý bãi đậu xe Vũng Tàu.'
      },
      {
        keyword: 'kinh nghiệm thuê xe tự lái đi đà lạt leo đèo bảo lộc an toàn',
        intent: 'Informational / Local',
        difficulty: 'Dễ',
        targetDays: '40 - 60 ngày',
        searchVolumeEst: '2.700 / tháng',
        recommendedLength: '2.400 từ',
        primaryHook: 'Cách kiểm tra phanh xe, chọn xe số tự động hay số sàn khi vượt đèo dốc sương mù.'
      },
      {
        keyword: 'thuê xe tự lái sân bay tân sơn nhất nhận xe ngay tại sảnh',
        intent: 'Transactional / High Intent',
        difficulty: 'Dễ',
        targetDays: '30 - 50 ngày',
        searchVolumeEst: '2.200 / tháng',
        recommendedLength: '1.900 từ',
        primaryHook: 'Cách nhận xe nhanh không mất phí gửi bãi TCP và gọi xe trực tiếp không qua trung gian.'
      },
      {
        keyword: 'thuê xe tự lái đà nẵng đi hội an huế trọn gói giá tốt',
        intent: 'Commercial / Local',
        difficulty: 'Dễ - Trung bình',
        targetDays: '45 - 60 ngày',
        searchVolumeEst: '2.600 / tháng',
        recommendedLength: '2.100 từ',
        primaryHook: 'Bí quyết thuê xe du lịch miền Trung xuyên đèo Hải Vân.'
      }
    ]
  },
  {
    id: 'danh-cho-chu-xe',
    name: '4. Thu Hút Chủ Xe (Tăng Nguồn Cung Cho Website)',
    description: 'Thu hút chủ xe đăng tin lên sàn Thuexenhanh, tạo nguồn xe phong phú cho web.',
    keywords: [
      {
        keyword: 'cho thuê xe tự lái có lời không kiếm được bao nhiêu 1 tháng',
        intent: 'Informational / Business',
        difficulty: 'Dễ',
        targetDays: '30 - 50 ngày',
        searchVolumeEst: '2.800 / tháng',
        recommendedLength: '2.500 từ',
        primaryHook: 'Bảng tính chi phí khấu hao, bảo dưỡng, bảo hiểm và dòng tiền ròng thực tế.'
      },
      {
        keyword: 'kinh nghiệm cho thuê xe tự lái không lo mất xe quản lý rủi ro',
        intent: 'Informational / How-to',
        difficulty: 'Dễ',
        targetDays: '30 - 60 ngày',
        searchVolumeEst: '1.900 / tháng',
        recommendedLength: '2.400 từ',
        primaryHook: 'Quy trình thẩm định khách thuê, lắp 2 thiết bị định vị GPS và giữ cọc an toàn.'
      },
      {
        keyword: 'nền tảng đăng tin cho thuê xe tự lái không mất hoa hồng',
        intent: 'Commercial / Solution',
        difficulty: 'Rất dễ',
        targetDays: '15 - 30 ngày',
        searchVolumeEst: '1.400 / tháng',
        recommendedLength: '1.800 từ',
        primaryHook: 'So sánh mô hình sàn thu phí 10-15% hoa hồng với mô hình rao vặt trực tiếp.'
      },
      {
        keyword: 'mẫu hợp đồng cho thuê xe tự lái chuẩn pháp lý mới nhất',
        intent: 'Transactional / Download',
        difficulty: 'Dễ - Trung bình',
        targetDays: '30 - 60 ngày',
        searchVolumeEst: '3.600 / tháng',
        recommendedLength: '2.200 từ',
        primaryHook: 'Tải file mẫu hợp đồng kèm điều khoản phạt nguội và trách nhiệm bảo hiểm rõ ràng.'
      }
    ]
  },
  {
    id: 'cao-diem-le-tet',
    name: '5. Mùa Cao Điểm & Xe Điện Xu Hướng Mới',
    description: 'Đón đầu lượng tìm kiếm bùng nổ dịp Tết, lễ 30/4 và xu hướng chuyển dịch xe điện.',
    keywords: [
      {
        keyword: 'kinh nghiệm thuê xe tự lái tết không bị ép giá và cọc sớm',
        intent: 'Commercial / Seasonal',
        difficulty: 'Trung bình',
        targetDays: '45 - 70 ngày',
        searchVolumeEst: '6.500 / tháng (cao điểm)',
        recommendedLength: '2.600 từ',
        primaryHook: 'Thời điểm vàng chốt xe Tết, mức tăng giá cho phép và cách ràng buộc chủ xe không hủy kèo.'
      },
      {
        keyword: 'thuê xe điện vinfast tự lái sạc pin ở đâu chi phí sạc thế nào',
        intent: 'Informational / Guide',
        difficulty: 'Dễ',
        targetDays: '25 - 45 ngày',
        searchVolumeEst: '2.300 / tháng',
        recommendedLength: '2.100 từ',
        primaryHook: 'Cẩm nang dùng trạm sạc VinFast, cách thanh toán và so sánh chi phí sạc với tiền đổ xăng.'
      }
    ]
  }
]
