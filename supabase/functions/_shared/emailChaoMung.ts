// Template HTML cho email chào mừng trong Edge Function (Resend)
export function htmlEmailChaoMung({
  email = '',
  origin = 'https://thuexenhanh.vn',
}: {
  email?: string
  origin?: string
}): string {
  const tenHienThi = email.split('@')[0] || 'Quý khách'
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
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%);padding:32px 28px;text-align:center;color:#ffffff;">
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;">Thuexenhanh.vn</h1>
              <p style="margin:0;font-size:14px;opacity:0.95;color:#e6fffa;">Nền tảng kết nối thuê xe tự lái nhanh chóng & minh bạch</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              <div style="margin-bottom:28px;">
                <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">Chào mừng ${tenHienThi}! 🎉</h2>
                <p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;">
                  Cảm ơn bạn đã đăng nhập và đồng hành cùng <strong>Thuexenhanh</strong>. Nền tảng được xây dựng để giúp bạn tìm kiếm và thuê xe tự lái nhanh nhất, kết nối trực tiếp với chủ xe uy tín trên toàn quốc.
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

              <div style="margin-bottom:28px;">
                <h3 style="margin:0 0 12px 0;font-size:17px;color:#0f172a;">
                  ⭐ Bạn có xe nhàn rỗi? Trở thành Chủ xe chuyên nghiệp
                </h3>
                <p style="margin:0 0 14px 0;font-size:14px;color:#475569;">
                  Thuexenhanh cung cấp bộ công cụ quản lý xe cao cấp hoàn toàn tự động:
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
                  <tr>
                    <td style="padding:10px 14px;background-color:#f8fafc;border-left:4px solid #0d9488;border-radius:4px;">
                      <strong style="color:#0f766e;font-size:14px;">📅 Lịch xe thông minh:</strong>
                      <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">
                        Chủ động theo dõi ngày khách đặt, khoá ngày bận/bảo dưỡng. Tránh hoàn toàn rủi ro trùng lịch.
                      </p>
                    </td>
                  </tr>
                  <tr><td height="8"></td></tr>
                  <tr>
                    <td style="padding:10px 14px;background-color:#f8fafc;border-left:4px solid #3b82f6;border-radius:4px;">
                      <strong style="color:#1d4ed8;font-size:14px;">📊 Thống kê & Báo cáo số liệu:</strong>
                      <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">
                        Đo lường chính xác số lượt khách xem xe, số lượt bấm gọi điện/Zalo theo ngày và tuần.
                      </p>
                    </td>
                  </tr>
                  <tr><td height="8"></td></tr>
                  <tr>
                    <td style="padding:10px 14px;background-color:#f8fafc;border-left:4px solid #10b981;border-radius:4px;">
                      <strong style="color:#047857;font-size:14px;">🛡️ Tích xanh uy tín & Ví Token minh bạch:</strong>
                      <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">
                        Xét duyệt Tích xanh chính chủ miễn phí, quản lý số dư token nạp/gia hạn rõ ràng.
                      </p>
                    </td>
                  </tr>
                </table>
                <a href="${linkDangTin}" style="font-size:14px;color:#0d9488;font-weight:600;text-decoration:none;">
                  👉 Đăng tin cho thuê xe của bạn &rarr;
                </a>
              </div>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;">

              <div style="background-color:#f1f5f9;border-radius:8px;padding:16px 18px;">
                <h3 style="margin:0 0 8px 0;font-size:15px;color:#0f172a;">
                  📝 Xác nhận chấp thuận điều khoản & chính sách
                </h3>
                <p style="margin:0 0 10px 0;font-size:13px;color:#475569;line-height:1.5;">
                  Tài khoản của bạn đã được xác nhận đồng ý với các quy định pháp lý của Thuexenhanh:
                </p>
                <ul style="margin:0;padding-left:20px;font-size:13px;color:#334155;">
                  <li style="margin-bottom:4px;">
                    <a href="${linkDieuKhoan}" style="color:#0d9488;">Điều khoản sử dụng</a>: Kết nối trực tiếp, hai bên tự thoả thuận giao dịch.
                  </li>
                  <li style="margin-bottom:4px;">
                    <a href="${linkQuyChe}" style="color:#0d9488;">Quy chế hoạt động</a>: Minh bạch thông tin xe và giá niêm yết.
                  </li>
                  <li>
                    <a href="${linkBaoMat}" style="color:#0d9488;">Chính sách bảo vệ dữ liệu cá nhân</a>: Bảo mật và tôn trọng quyền riêng tư.
                  </li>
                </ul>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:24px 28px;text-align:center;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">
              <p style="margin:0 0 6px 0;font-weight:600;color:#475569;">Thuê Xe Nhanh — Nền tảng kết nối thuê xe toàn quốc</p>
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
