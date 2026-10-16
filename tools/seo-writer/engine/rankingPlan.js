/**
 * tools/seo-writer/engine/rankingPlan.js
 * 
 * CHIẾN LƯỢC 90 NGÀY ĐƯA BÀI VIẾT LÊN TOP 3 GOOGLE (ACTIONABLE RANKING ROADMAP)
 * Kế hoạch từng tuần được đúc kết từ các dự án SEO thực chiến ngành thuê xe & du lịch tại Việt Nam.
 */

export const RANKING_90_DAYS_PLAN = {
  overview: {
    goal: 'Đưa ít nhất 5-10 bài viết mục tiêu vào TOP 1 - 3 Google Search trong vòng 90 ngày',
    targetMetrics: {
      organicImpressions: '25.000+ lượt hiển thị / tháng',
      organicClicks: '1.500 - 3.000 khách vào web / tháng',
      averagePosition: 'Top 2.8',
      ctrTarget: '> 7.5%'
    }
  },
  phases: [
    {
      phase: 1,
      name: 'Tháng 1 (Tuần 1 - 4): Xây Dựng Thẩm Quyền Cốt Lõi (Topical Authority) & Lập Chỉ Mục Thần Tốc',
      objective: 'Tạo chùm bài viết phủ kín chủ đề và ép Google index trong vòng 24 giờ.',
      tasks: [
        {
          week: 'Tuần 1',
          action: 'Thiết lập hạ tầng đo lường & Xuất bản 3 bài viết Pillar (Trụ cột)',
          details: [
            'Cài đặt Google Search Console (GSC) và gắn mã theo dõi Google Analytics 4 (GA4).',
            'Viết và xuất bản 3 bài viết trụ cột: "Bảng giá thuê xe tự lái 2026", "Kinh nghiệm thuê xe tự lái tránh đền tiền oan", "Thủ tục thuê xe tự lái không cần hộ khẩu".',
            'Khai báo sitemap.xml trong Google Search Console.',
            'Dùng tính năng "Kiểm tra URL" (URL Inspection) trong GSC bấm "Yêu cầu lập chỉ mục" (Request Indexing) ngay sau khi đăng bài để index trong 24h.'
          ]
        },
        {
          week: 'Tuần 2',
          action: 'Xuất bản chùm bài viết vệ tinh (Satellite Posts) & Đan chéo Internal Links',
          details: [
            'Xuất bản 4 bài viết ngách theo dòng xe: "Thuê xe Xpander tự lái giá bao nhiêu", "Thuê xe Carnival tự lái", "Thuê xe VF3 tự lái", "So sánh Vios và Accent".',
            'Gắn Schema JSON-LD (Article + FAQPage) vào từng bài viết.',
            'Đan chéo liên kết nội bộ: Bài ngách trỏ link về bài trụ cột, và tất cả cùng trỏ về trang danh sách xe /thue-xe.'
          ]
        },
        {
          week: 'Tuần 3 - 4',
          action: 'Kích hoạt tín hiệu người dùng ban đầu (Seed User Signals)',
          details: [
            'Chia sẻ link bài viết lên 3-5 hội nhóm Facebook liên quan (Hội thuê xe tự lái miền Nam, Hội lái xe Hà Nội, Hội VinFast...).',
            'Gửi link vào các nhóm Zalo đối tác chủ xe.',
            'Mục tiêu: Đạt 50 - 100 lượt đọc thật đầu tiên. Độc giả ở lại trang > 2 phút và click vào nút tìm xe /thue-xe để gửi tín hiệu "Helpful Content" tới thuật toán Google.'
          ]
        }
      ]
    },
    {
      phase: 2,
      name: 'Tháng 2 (Tuần 5 - 8): Đo Lường Search Query Thật & Tối Ưu Thời Gian Lưu Trang (Dwell Time)',
      objective: 'Leo từ Trang 2 - 3 (vị trí 15-30) lên Trang 1 (vị trí 4-8).',
      tasks: [
        {
          week: 'Tuần 5 - 6',
          action: 'Khai thác dữ liệu Search Console để bổ sung từ khóa phụ (LSI Keywords)',
          details: [
            'Vào GSC -> Hiệu suất (Performance) -> Lọc theo từng URL bài viết.',
            'Xem danh sách "Cụm từ tìm kiếm" (Queries) đang mang lại nhiều lượt hiển thị nhất nhưng chưa có click.',
            'Bổ sung các cụm từ này vào bài viết dưới dạng một tiêu đề H3 hoặc trong phần FAQ giải đáp thắc mắc.',
            'Cập nhật ngày modified date trong Schema để báo cho Google bài viết vừa được làm mới dữ liệu.'
          ]
        },
        {
          week: 'Tuần 7 - 8',
          action: 'Tối ưu trải nghiệm giữ chân độc giả (Tăng Dwell Time > 3 phút)',
          details: [
            'Thêm hình ảnh thực tế (ảnh thật chụp biển số mờ, ảnh chụp kiểm tra lốp, ảnh bảng đồng hồ).',
            'Kiểm tra tốc độ tải trang (PageSpeed Insights): Đảm bảo LCP < 2.5s, ảnh nén định dạng WebP.',
            'Chèn thêm bảng dữ liệu so sánh chi phí hoặc checklist để người đọc dừng lại xem và ghi chú.'
          ]
        }
      ]
    },
    {
      phase: 3,
      name: 'Tháng 3 (Tuần 9 - 12): Đột Phá Lên TOP 3 & Tối Ưu Tỷ Lệ Nhấp Chuột (CTR Hacks)',
      objective: 'Đẩy bài viết từ Top 5-8 vào thẳng TOP 1 - 3 và duy trì vị trí vững chắc.',
      tasks: [
        {
          week: 'Tuần 9 - 10',
          action: 'A/B Testing Tiêu Đề để tăng CTR lên > 8%',
          details: [
            'Khi bài viết đã lên trang 1 Google, thứ hạng được quyết định rất lớn bởi CTR (Tỷ lệ người dùng bấm vào bài viết so với đối thủ).',
            'Thêm các yếu tố "kích hoạt tâm lý" vào Title: Thêm năm [2026], chữ [Bảng Giá Mới], [Tránh Mất Tiền], con số cụ thể (5 Bước, 6 Điểm...).',
            'Tối ưu lại Meta Description: Đặt câu hỏi kích thích tò mò và nêu rõ giải pháp.'
          ]
        },
        {
          week: 'Tuần 11 - 12',
          action: 'Chiếm lĩnh Featured Snippet (Top 0) & Rich Snippets',
          details: [
            'Kiểm tra các câu hỏi trong khối FAQ đã hiển thị dưới dạng Rich Result trên Google chưa (dùng công cụ Kiểm tra kết quả nhiều định dạng của Google).',
            'Rà soát hộp Tóm Tắt Nhanh (> [!NOTE]): Điều chỉnh câu trả lời ngắn gọn đúng 40-50 từ để Google bốc thẳng lên vị trí Đoạn trích nổi bật (Featured Snippet).',
            'Kết quả: Bài viết giữ vững Top 1-3, mang lại dòng khách thuê và chủ xe tự nhiên mỗi ngày mà không tốn 1 đồng quảng cáo Google Ads!'
          ]
        }
      ]
    }
  ]
};
