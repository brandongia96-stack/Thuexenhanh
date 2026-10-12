/**
 * emailChaoMung.js — Mẫu email và cơ chế tự động gửi email chào mừng
 * khi người dùng đăng nhập / hoàn tất đồng ý điều khoản.
 *
 * 3 Ý CHÍNH TRONG EMAIL:
 *  1. Chào mừng thành viên mới & nút bấm quay về tìm xe (/thue-xe).
 *  2. Giới thiệu các tính năng cao cấp dành cho chủ xe: lịch xe thông minh, thống kê số liệu...
 *  3. Xác nhận chính thức về việc đã đồng ý các điều khoản dịch vụ, quy chế và chính sách bảo mật.
 */

import { trySupabase } from '../../lib/supabase'

/**
 * Tạo nội dung HTML hoàn chỉnh cho email chào mừng.
 * Định dạng Responsive inline CSS, tương thích Gmail, Outlook, Apple Mail...
 */
export function taoNoiDungEmailChaoMung({
  tenNguoiDung = '',
  emailNguoiDung = '',
  origin = typeof window !== 'undefined' ? window.location.origin : 'https://thuexenhanh.vn',
} = {}) {
  const tenHienThi = tenNguoiDung || emailNguoiDung.split('@')[0] || 'Quý khách'
  const linkTimXe = `${origin}/thue-xe`
  const linkDangTin = `${origin}/chu-xe/dang-tin`
  const linkDieuKhoan = `${origin}/dieu-khoan`
  const linkQuyChe = `${origin}/quy-che`
  const linkBaoMat = `${origin}/bao-mat`

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chào mừng bạn đến với Thuexenhanh</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Khung Email chính -->
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%);padding:32px 28px;text-align:center;color:#ffffff;">
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Thuexenhanh.vn</h1>
              <p style="margin:0;font-size:14px;opacity:0.95;color:#e6fffa;">Nền tảng kết nối thuê xe tự lái nhanh chóng & minh bạch</p>
            </td>
          </tr>

          <!-- Thân Email -->
          <tr>
            <td style="padding:32px 28px;">

              <!-- Ý 1: CHÀO MỪNG & QUAY VỀ TÌM XE -->
              <div style="margin-bottom:28px;">
                <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">Chào mừng ${tenHienThi}! 🎉</h2>
                <p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;">
                  Cảm ơn bạn đã đăng nhập và đồng hành cùng <strong>Thuexenhanh</strong>. Nền tảng được xây dựng để giúp bạn tìm kiếm và thuê xe tự lái nhanh nhất, kết nối trực tiếp với chủ xe uy tín trên toàn quốc mà không lo chi phí ẩn.
                </p>
                
                <div style="text-align:center;margin:24px 0;">
                  <a href="${linkTimXe}" style="display:inline-block;background-color:#0d9488;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;box-shadow:0 2px 8px rgba(13,148,136,0.3);">
                    🚗 Quay về tìm xe ngay
                  </a>
                </div>
                <p style="margin:0;font-size:13px;color:#64748b;text-align:center;">
                  Hàng trăm mẫu xe 4 chỗ, 7 chỗ, SUV và xe điện VinFast đang sẵn sàng phục vụ bạn.
                </p>
              </div>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;">

              <!-- Ý 2: GIỚI THIỆU TÍNH NĂNG ĐĂNG XE CAO CẤP -->
              <div style="margin-bottom:28px;">
                <h3 style="margin:0 0 12px 0;font-size:17px;color:#0f172a;display:flex;align-items:center;">
                  ⭐ Bạn có xe nhàn rỗi? Trở thành Chủ xe chuyên nghiệp
                </h3>
                <p style="margin:0 0 14px 0;font-size:14px;color:#475569;">
                  Thuexenhanh cung cấp bộ công cụ quản lý xe cao cấp hoàn toàn tự động, giúp chủ xe gia tăng thu nhập an tâm:
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
                  <tr>
                    <td style="padding:10px 14px;background-color:#f8fafc;border-left:4px solid #0d9488;border-radius:4px;margin-bottom:8px;">
                      <strong style="color:#0f766e;font-size:14px;">📅 Lịch xe thông minh:</strong>
                      <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">
                        Chủ động theo dõi ngày khách đặt, khoá ngày bận/bảo dưỡng xe theo lịch riêng. Tuyệt đối không lo bị trùng lịch.
                      </p>
                    </td>
                  </tr>
                  <tr><td height="8"></td></tr>
                  <tr>
                    <td style="padding:10px 14px;background-color:#f8fafc;border-left:4px solid #3b82f6;border-radius:4px;margin-bottom:8px;">
                      <strong style="color:#1d4ed8;font-size:14px;">📊 Thống kê & Báo cáo số liệu:</strong>
                      <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">
                        Đo lường chính xác số lượt khách xem xe, số lượt bấm gọi điện/Zalo theo ngày và tuần để tối ưu hoá hiệu quả tin đăng.
                      </p>
                    </td>
                  </tr>
                  <tr><td height="8"></td></tr>
                  <tr>
                    <td style="padding:10px 14px;background-color:#f8fafc;border-left:4px solid #10b981;border-radius:4px;">
                      <strong style="color:#047857;font-size:14px;">🛡️ Tích xanh uy tín & Ví Token minh bạch:</strong>
                      <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">
                        Xét duyệt Tích xanh chính chủ miễn phí, quản lý số dư token nạp/gia hạn rõ ràng, tiếp cận hàng nghìn lượt thuê tiềm năng.
                      </p>
                    </td>
                  </tr>
                </table>

                <div style="text-align:left;margin-top:12px;">
                  <a href="${linkDangTin}" style="font-size:14px;color:#0d9488;font-weight:600;text-decoration:none;">
                    👉 Đăng tin cho thuê xe của bạn &rarr;
                  </a>
                </div>
              </div>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;">

              <!-- Ý 3: XÁC NHẬN ĐỒNG Ý CÁC ĐIỀU KHOẢN -->
              <div style="background-color:#f1f5f9;border-radius:8px;padding:16px 18px;">
                <h3 style="margin:0 0 8px 0;font-size:15px;color:#0f172a;">
                  📝 Xác nhận chấp thuận điều khoản & chính sách
                </h3>
                <p style="margin:0 0 10px 0;font-size:13px;color:#475569;line-height:1.5;">
                  Email này đồng thời là bản ghi nhận bạn đã đọc và đồng ý với các quy định pháp lý của Thuexenhanh tại thời điểm đăng nhập:
                </p>
                <ul style="margin:0;padding-left:20px;font-size:13px;color:#334155;">
                  <li style="margin-bottom:4px;">
                    <a href="${linkDieuKhoan}" style="color:#0d9488;text-decoration:underline;">Điều khoản sử dụng</a>: Nguyên tắc kết nối trực tiếp, hai bên tự thoả thuận giao dịch.
                  </li>
                  <li style="margin-bottom:4px;">
                    <a href="${linkQuyChe}" style="color:#0d9488;text-decoration:underline;">Quy chế hoạt động</a>: Trách nhiệm minh bạch thông tin xe, giá niêm yết và chính sách an toàn.
                  </li>
                  <li>
                    <a href="${linkBaoMat}" style="color:#0d9488;text-decoration:underline;">Chính sách bảo vệ dữ liệu cá nhân</a>: Bảo mật thông tin tài khoản và tôn trọng quyền riêng tư.
                  </li>
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 28px;text-align:center;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">
              <p style="margin:0 0 6px 0;font-weight:600;color:#475569;">Thuê Xe Nhanh — Nền tảng kết nối thuê xe toàn quốc</p>
              <p style="margin:0 0 8px 0;">Cần hỗ trợ? Phản hồi trực tiếp vào email này hoặc truy cập mục <a href="${origin}/tro-giup" style="color:#0d9488;">Hỏi đáp & Trợ giúp</a>.</p>
              <p style="margin:0;color:#94a3b8;font-size:11px;">Đây là email tự động gửi khi bạn đăng nhập tài khoản tại Thuexenhanh.vn.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Phiên bản văn bản thuần (Plain Text) cho các ứng dụng email không hỗ trợ HTML.
 */
export function taoNoiDungTextChaoMung({
  tenNguoiDung = '',
  emailNguoiDung = '',
  origin = typeof window !== 'undefined' ? window.location.origin : 'https://thuexenhanh.vn',
} = {}) {
  const tenHienThi = tenNguoiDung || emailNguoiDung.split('@')[0] || 'Quý khách'
  return `CHÀO MỪNG BẠN ĐẾN VỚI THUEXENHANH.VN!

Xin chào ${tenHienThi},

Cảm ơn bạn đã đăng nhập và đồng hành cùng Thuexenhanh. Dưới đây là các thông tin quan trọng dành cho bạn:

1. QUAY VỀ TÌM XE & THUÊ XE
Khám phá hàng trăm dòng xe tự lái 4 chỗ, 7 chỗ, xe điện quanh bạn với giá công khai, không cọc rườm rà.
Link tìm xe: ${origin}/thue-xe

2. BỘ CÔNG CỤ ĐĂNG XE CAO CẤP DÀNH CHO CHỦ XE
Nếu bạn có xe nhàn rỗi muốn cho thuê:
- Lịch xe thông minh: Quản lý lịch khách đặt, khoá ngày bận, chống trùng lịch.
- Thống kê & Báo cáo: Xem lượt xem tin, lượt khách lấy số điện thoại thoại/Zalo.
- Tích xanh uy tín & Ví Token: Xét duyệt uy tín miễn phí, nạp token linh hoạt.
Link đăng xe: ${origin}/chu-xe/dang-tin

3. XÁC NHẬN ĐỒNG Ý CÁC ĐIỀU KHOẢN
Bạn đã xác nhận đồng ý với:
- Điều khoản sử dụng: ${origin}/dieu-khoan
- Quy chế hoạt động: ${origin}/quy-che
- Chính sách bảo mật dữ liệu cá nhân: ${origin}/bao-mat

Chúc bạn có những trải nghiệm tuyệt vời cùng Thuexenhanh!
Hotline/Hỗ trợ: ${origin}/tro-giup
`
}

/**
 * Gửi hoặc xếp hàng gửi email chào mừng về tài khoản.
 *
 * Hàm an toàn (Idempotent):
 *  - Mỗi tài khoản chỉ gửi đúng 1 lần (dựa vào cờ localStorage + unique CSDL).
 *  - Hoạt động ngay cả khi chưa có backend thật (ghi nhận log & in-app).
 *  - Khi có Supabase backend, xếp vào bảng `notification_outbox` để Edge Function / Resend gửi thật.
 */
export async function guiEmailChaoMung(user) {
  if (!user || !user.id) return { thanhCong: false, lyDo: 'khong_co_user' }

  const khoaLocal = `txn_welcome_sent_${user.id}`
  if (typeof localStorage !== 'undefined' && localStorage.getItem(khoaLocal)) {
    return { thanhCong: true, daGuiTruocDo: true }
  }

  const email = user.email || ''
  const ten = user.user_metadata?.full_name || user.user_metadata?.name || ''
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thuexenhanh.vn'

  const html = taoNoiDungEmailChaoMung({ tenNguoiDung: ten, emailNguoiDung: email, origin })
  const text = taoNoiDungTextChaoMung({ tenNguoiDung: ten, emailNguoiDung: email, origin })

  let daLuuBackend = false

  try {
    const sb = await trySupabase()
    if (sb) {
      // 1. Tạo thông báo trong app (hiển thị ngay ở quả chuông /thong-bao)
      await sb.from('notifications').insert({
        user_id: user.id,
        kind: 'he_thong',
        title: 'Chào mừng bạn đến với Thuexenhanh!',
        body: 'Khám phá các dòng xe đang cho thuê hoặc bắt đầu đăng xe với các công cụ quản lý lịch và thống kê chuyên nghiệp.',
        link: '/thue-xe',
      }).catch(() => {})

      // 2. Xếp hàng gửi email qua notification_outbox (cho Edge Function send-notifications / Resend)
      const { error: outboxErr } = await sb.from('notification_outbox').insert({
        user_id: user.id,
        type: 'chao_mung',
        ref_id: 'chao_mung_' + user.id,
        channel: 'email',
        bat_buoc: true,
        title: 'Chào mừng bạn đến với Thuexenhanh!',
        body: text,
        link: '/thue-xe',
        status: 'cho_gui',
      })

      if (!outboxErr) {
        daLuuBackend = true
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[emailChaoMung] Không ghi được vào outbox CSDL:', err?.message)
    }
  }

  // Đánh dấu đã kích hoạt gửi cho tài khoản này để không gửi lặp
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(khoaLocal, new Date().toISOString())
  }

  if (import.meta.env.DEV) {
    console.info(
      `%c[EMAIL CHÀO MỪNG ĐÃ KÍCH HOẠT]%c Gửi tới: ${email || user.id}\nĐã lưu DB: ${daLuuBackend ? 'Có' : 'Chưa (chờ backend)'}`,
      'background:#0d9488;color:#fff;font-weight:bold;padding:2px 6px;border-radius:4px;',
      'color:#0f766e;font-weight:bold;'
    )
  }

  return {
    thanhCong: true,
    daLuuBackend,
    email,
    html,
    text,
  }
}
