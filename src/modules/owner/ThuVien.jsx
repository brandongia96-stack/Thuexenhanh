import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Download, ShieldCheck, ExternalLink, Printer,
  AlertTriangle, Zap, CheckCircle2, BookOpen, Car,
  FileCheck, HelpCircle, PhoneCall, Scale, Phone
} from 'lucide-react'
import DanhBaCuuHoSection from './DanhBaCuuHoSection'
import './ThuVien.css'

export default function ThuVien() {
  const [tab, setTab] = useState('tat-ca')

  return (
    <div className="tv-page">
      {/* ─── Hero Thư viện ─── */}
      <section className="tv-hero">
        <div className="tv-hero-badge">
          <BookOpen size={16} /> Thư viện pháp lý &amp; Nghiệp vụ Chủ xe
        </div>
        <h1 className="t-h1" style={{ marginBottom: 'var(--sp-2)' }}>
          Kho Biểu Mẫu &amp; Tài Liệu Cho Chủ Xe
        </h1>
        <p className="t-body" style={{ color: 'var(--m-mid)', maxWidth: 720 }}>
          Tổng hợp đầy đủ hợp đồng mẫu chuẩn pháp lý, biên bản bàn giao xe 2 chiều, danh bạ cứu hộ giao thông 24/7 toàn quốc,
          quy trình phòng ngừa rủi ro và các cổng thông tin tra cứu phạt nguội, bằng lái phục vụ chủ xe.
        </p>
      </section>

      {/* ─── Bộ lọc danh mục ─── */}
      <div className="tv-filter" role="tablist" aria-label="Lọc danh mục tài liệu">
        {[
          { key: 'tat-ca', label: 'Tất cả tài liệu' },
          { key: 'cuu-ho', label: '🚨 Cứu hộ toàn quốc 24/7' },
          { key: 'bieu-mau', label: 'Biểu mẫu & Hợp đồng' },
          { key: 'quy-trinh', label: 'Quy trình an toàn' },
          { key: 'xu-ly', label: 'Phạt nguội & Tranh chấp' },
          { key: 'xe-dien', label: 'Cẩm nang Xe điện (EV)' },
          { key: 'cong-cu', label: 'Cổng tra cứu online' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            className={`tv-filter-btn${tab === item.key ? ' active' : ''}`}
            onClick={() => setTab(item.key)}
            role="tab"
            aria-selected={tab === item.key}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PHẦN 1: BỘ BIỂU MẪU TẢI VỀ (File Word & In ấn)
      ═══════════════════════════════════════════════════════════════ */}
      {(tab === 'tat-ca' || tab === 'bieu-mau') && (
        <section className="tv-section">
          <div className="tv-section-header">
            <h2 className="tv-section-title">
              <FileCheck size={22} strokeWidth={1.8} color="var(--m-green)" />
              1. Bộ biểu mẫu pháp lý chuẩn (File Word &amp; In ấn)
            </h2>
          </div>

          <div className="tv-grid-docs">
            {/* Card 1: Hợp đồng thuê xe */}
            <div className="tv-doc-card">
              <div className="tv-doc-top">
                <div className="tv-doc-icon tv-icon-word">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="t-h3">Hợp đồng thuê xe ô tô tự lái</h3>
                  <div className="tv-doc-meta">
                    <span>Định dạng: Word (.docx)</span> · <span>9 Điều khoản dân sự</span>
                  </div>
                  <p className="t-small" style={{ marginTop: 'var(--sp-2)' }}>
                    Quy định chặt chẽ quyền và nghĩa vụ 2 bên, điều khoản bồi thường hư hỏng, thỏa thuận giữ cọc bảo đảm phạt nguội.
                  </p>
                </div>
              </div>
              <div className="row" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
                <a
                  href="/mau-hop-dong-thue-xe.docx"
                  download="Hop-dong-thue-xe-va-bien-ban-ban-giao.docx"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Download size={14} /> Tải file Word
                </a>
                <Link to="/mau-hop-dong" className="btn btn-ghost btn-sm" title="Xem & In trực tiếp">
                  <Printer size={14} />
                </Link>
              </div>
            </div>

            {/* Card 2: Biên bản bàn giao nhận & trả xe */}
            <div className="tv-doc-card">
              <div className="tv-doc-top">
                <div className="tv-doc-icon tv-icon-word">
                  <FileCheck size={24} />
                </div>
                <div>
                  <h3 className="t-h3">Biên bản bàn giao xe 2 chiều</h3>
                  <div className="tv-doc-meta">
                    <span>Định dạng: Word (.docx)</span> · <span>Lúc nhận &amp; Lúc trả</span>
                  </div>
                  <p className="t-small" style={{ marginTop: 'var(--sp-2)' }}>
                    Bảng kiểm 15 hạng mục: kiểm tra ODO, xăng/pin, trầy xước ngoại thất, phụ tùng dự phòng và bảng quyết toán cọc.
                  </p>
                </div>
              </div>
              <div className="row" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
                <a
                  href="/mau-hop-dong-thue-xe.docx"
                  download="Hop-dong-thue-xe-va-bien-ban-ban-giao.docx"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Download size={14} /> Tải file Word
                </a>
                <Link to="/mau-hop-dong" className="btn btn-ghost btn-sm" title="Xem & In trực tiếp">
                  <Printer size={14} />
                </Link>
              </div>
            </div>

            {/* Card 3: Biên nhận đặt cọc & thỏa thuận giữ cọc */}
            <div className="tv-doc-card">
              <div className="tv-doc-top">
                <div className="tv-doc-icon tv-icon-guide">
                  <Scale size={24} />
                </div>
                <div>
                  <h3 className="t-h3">Giấy biên nhận &amp; Thỏa thuận giữ cọc</h3>
                  <div className="tv-doc-meta">
                    <span>Mẫu đính kèm</span> · <span>Bảo vệ quyền lợi</span>
                  </div>
                  <p className="t-small" style={{ marginTop: 'var(--sp-2)' }}>
                    Văn bản cam kết thời hạn hoàn tiền cọc, số tiền giữ lại để tra cứu phạt nguội (thường 15-30 ngày) và phương thức chuyển trả.
                  </p>
                </div>
              </div>
              <div className="row" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
                <Link to="/an-toan" className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
                  Xem hướng dẫn giữ cọc đúng luật
                </Link>
              </div>
            </div>

            {/* Card 4: Nội quy sử dụng xe (Checklist dán xe) */}
            <div className="tv-doc-card">
              <div className="tv-doc-top">
                <div className="tv-doc-icon tv-icon-alert">
                  <Car size={24} />
                </div>
                <div>
                  <h3 className="t-h3">Bảng Nội quy sử dụng xe (Dán xe)</h3>
                  <div className="tv-doc-meta">
                    <span>Checklist tóm tắt</span> · <span>Dán taplo / gáy ghế</span>
                  </div>
                  <p className="t-small" style={{ marginTop: 'var(--sp-2)' }}>
                    Nhắc nhở khách thuê: Không hút thuốc trên xe (phí vệ sinh 500k), loại nhiên liệu cần đổ, số hotline cứu hộ 24/7 của chủ xe.
                  </p>
                </div>
              </div>
              <div className="row" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
                <Link to="/cuu-ho" className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
                  Xem số cứu hộ khẩn cấp
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          DANH BẠ CỨU HỘ TOÀN QUỐC 24/7 (Bộ lọc thông minh theo vị trí / tìm tay)
      ═══════════════════════════════════════════════════════════════ */}
      {(tab === 'tat-ca' || tab === 'cuu-ho') && (
        <DanhBaCuuHoSection />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PHẦN 2: QUY TRÌNH 6 BƯỚC BÀN GIAO XE AN TOÀN
      ═══════════════════════════════════════════════════════════════ */}
      {(tab === 'tat-ca' || tab === 'quy-trinh') && (
        <section className="tv-section">
          <div className="tv-section-header">
            <h2 className="tv-section-title">
              <ShieldCheck size={22} color="var(--m-green)" />
              2. Quy trình 6 bước bàn giao xe an toàn (Chống lừa đảo, mất xe)
            </h2>
            <Link to="/an-toan" className="t-small" style={{ color: 'var(--m-green)', fontWeight: 600 }}>
              Xem chi tiết chính sách an toàn →
            </Link>
          </div>

          <div className="tv-step-list">
            <div className="tv-step-item">
              <div className="tv-step-num">1</div>
              <div>
                <strong>Đối chiếu CCCD &amp; Bằng lái thật</strong>
                <p className="t-small" style={{ marginTop: 4 }}>
                  Đối chiếu ảnh trên CCCD với người thật. Tra cứu số GPLX trên trang Cục CSGT/Tổng cục Đường bộ để kiểm tra bằng lái thật và đúng hạng xe. <em>Xem xong trả lại ngay bản gốc cho khách (không giữ CCCD/bằng lái gốc vì trái quy định pháp luật).</em>
                </p>
              </div>
            </div>

            <div className="tv-step-item">
              <div className="tv-step-num">2</div>
              <div>
                <strong>Nhận tài sản bảo đảm hợp pháp</strong>
                <p className="t-small" style={{ marginTop: 4 }}>
                  Thu tiền đặt cọc (chuyển khoản ngân hàng chính chủ) hoặc nhận thế chấp 01 xe máy chính chủ kèm Giấy đăng ký xe bản gốc. Ghi rõ số tiền và biển số xe máy thế chấp vào hợp đồng.
                </p>
              </div>
            </div>

            <div className="tv-step-item">
              <div className="tv-step-num">3</div>
              <div>
                <strong>Kiểm tra thiết bị định vị GPS</strong>
                <p className="t-small" style={{ marginTop: 4 }}>
                  Mở app quản lý định vị, kiểm tra vị trí hiện tại và dung lượng pin thiết bị. Đảm bảo GPS hoạt động tốt và cập nhật ổn định trước khi giao chìa khóa cho khách.
                </p>
              </div>
            </div>

            <div className="tv-step-item">
              <div className="tv-step-num">4</div>
              <div>
                <strong>Quay video &amp; Chụp ảnh 360 độ</strong>
                <p className="t-small" style={{ marginTop: 4 }}>
                  Cùng khách đi vòng quanh xe: quay clip rõ 4 góc cản trước sau, mâm lốp, kính xe, trần xe. Chụp ảnh rõ đồng hồ số km (ODO) và vạch xăng/mức pin lưu vào điện thoại 2 bên.
                </p>
              </div>
            </div>

            <div className="tv-step-item">
              <div className="tv-step-num">5</div>
              <div>
                <strong>Ký kết hợp đồng &amp; Biên bản</strong>
                <p className="t-small" style={{ marginTop: 4 }}>
                  Hai bên cùng đọc và ký tên vào Hợp đồng thuê xe và Biên bản bàn giao. Mỗi bên giữ 01 bản cứng. Ghi rõ điều khoản thỏa thuận phạt nguội và giờ hẹn trả xe.
                </p>
              </div>
            </div>

            <div className="tv-step-item">
              <div className="tv-step-num">6</div>
              <div>
                <strong>Thu đủ tiền thuê trước khi giao chìa</strong>
                <p className="t-small" style={{ marginTop: 4 }}>
                  Nhận đủ 100% tiền thuê xe và tiền cọc theo thỏa thuận trước khi giao chìa khóa. Cung cấp giấy đăng ký bản sao công chứng, bảo hiểm bắt buộc và số liên lạc hỗ trợ kỹ thuật cho khách.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PHẦN 3: XỬ LÝ PHẠT NGUỘI, TRANH CHẤP & RỦI RO
      ═══════════════════════════════════════════════════════════════ */}
      {(tab === 'tat-ca' || tab === 'xu-ly') && (
        <section className="tv-section">
          <div className="tv-section-header">
            <h2 className="tv-section-title">
              <AlertTriangle size={22} strokeWidth={1.8} color="var(--m-amber)" />
              3. Cẩm nang xử lý Phạt nguội &amp; Sự cố thực tế
            </h2>
          </div>

          <div className="card card-pad stack" style={{ gap: 'var(--sp-4)', backgroundColor: 'var(--m-surface)' }}>
            <div>
              <h3 className="t-h3" style={{ color: 'var(--m-dark)' }}>Cách xử lý khi xe bị Phạt nguội sau chuyến thuê</h3>
              <p className="t-body" style={{ marginTop: 4 }}>
                1. <strong>Tra cứu vi phạm:</strong> Định kỳ 7-15 ngày sau chuyến đi, vào cổng tra cứu của Cục CSGT (csgt.vn) để kiểm tra biển số xe.<br />
                2. <strong>Hồ sơ chứng minh người vi phạm:</strong> Khi nhận được thông báo phạt nguội của CSGT đúng khung thời gian khách thuê xe, chủ xe cầm theo: <em>Hợp đồng thuê xe gốc, Biên bản giao nhận ghi rõ ngày giờ, Bản trích xuất lộ trình GPS</em> đến Đội CSGT gửi thông báo để làm thủ tục chuyển quyết định xử phạt sang đúng người điều khiển phương tiện.<br />
                3. <strong>Khấu trừ từ tiền giữ phạt nguội:</strong> Sử dụng khoản tiền đặt cọc giữ lại theo thỏa thuận trong hợp đồng để nộp phạt hoặc liên hệ khách thuê chuyển tiền nộp phạt theo quy định.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--m-border)', paddingTop: 'var(--sp-3)' }}>
              <h3 className="t-h3" style={{ color: 'var(--m-dark)' }}>Xử lý khi khách chậm trả xe hoặc mất liên lạc</h3>
              <p className="t-body" style={{ marginTop: 4 }}>
                - Khi quá giờ trả xe 1-2 tiếng mà không liên lạc được: Kiểm tra ngay tín hiệu GPS để xác định vị trí xe.<br />
                - Nhắn tin thông báo chính thức cảnh báo vi phạm hợp đồng.<br />
                - Nếu GPS di chuyển vào các địa điểm nhạy cảm (tiệm cầm đồ, bãi xe lạ) hoặc xe bị tháo thiết bị: Đến ngay hiện trường giữ xe và trình báo ngay cơ quan Công an xã/phường gần nhất kèm theo Hợp đồng và Giấy tờ xe gốc để hỗ trợ thu hồi phương tiện.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--m-border)', paddingTop: 'var(--sp-3)' }}>
              <h3 className="t-h3" style={{ color: 'var(--m-dark)' }}>Nghĩa vụ thuế của chủ xe cá nhân</h3>
              <p className="t-body" style={{ marginTop: 4 }}>
                Theo quy định hiện hành, cá nhân cho thuê tài sản có tổng doanh thu trong năm dương lịch từ <strong>100 triệu đồng trở xuống</strong> thuộc đối tượng không phải nộp thuế GTGT và thuế TNCN. Trường hợp doanh thu trên 100 triệu đồng/năm, chủ xe tự kê khai tại Chi cục Thuế địa phương theo hướng dẫn.
                {' '}<Link to="/thue" style={{ color: 'var(--m-green)', fontWeight: 600 }}>Xem chi tiết chính sách thuế →</Link>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PHẦN 4: CẨM NANG CHO THUÊ XE ĐIỆN (EV)
      ═══════════════════════════════════════════════════════════════ */}
      {(tab === 'tat-ca' || tab === 'xe-dien') && (
        <section className="tv-section">
          <div className="tv-section-header">
            <h2 className="tv-section-title">
              <Zap size={22} color="var(--m-green)" />
              4. Cẩm nang đặc thù cho thuê Xe điện (EV)
            </h2>
          </div>

          <div className="card card-pad stack" style={{ gap: 'var(--sp-3)', background: 'var(--m-green-bg)', borderColor: 'var(--m-green-light)' }}>
            <h3 className="t-h3" style={{ color: 'var(--m-green)' }}>⚡ Lưu ý quan trọng khi giao xe điện cho khách tự lái:</h3>
            <ul style={{ paddingLeft: 'var(--sp-5)', margin: 0, lineHeight: 1.7 }} className="t-body">
              <li><strong>Mức pin giao xe:</strong> Nên sạc pin đạt tối thiểu <strong>80% - 100%</strong> trước giờ giao để khách yên tâm khởi hành.</li>
              <li><strong>Quy định trả pin:</strong> Ghi rõ trong hợp đồng: khách trả xe pin dưới mức giao thì bù bao nhiêu tiền (ví dụ: 5.000đ/1% pin thiếu).</li>
              <li><strong>Bàn giao sạc di động (Portable Charger):</strong> Bàn giao bộ sạc 220V kèm xe, hướng dẫn khách cắm vào ổ điện có tiếp địa và cất gọn trong cốp sau khi sử dụng.</li>
              <li><strong>Hướng dẫn trụ sạc công cộng:</strong> Chỉ dẫn khách cách cắm sạc tại hệ thống trạm sạc VinFast hoặc các trạm sạc nhượng quyền (EV One, V-Green...), cách thanh toán qua ứng dụng.</li>
              <li><strong>Cảnh báo pin cạn dưới 10%:</strong> Dặn khách không để pin cạn kiệt dưới 5% vì có nguy cơ nằm đường và ảnh hưởng đến tuổi thọ khối pin.</li>
            </ul>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PHẦN 5: CỔNG TRA CỨU TRỰC TUYẾN CHÍNH THỐNG
      ═══════════════════════════════════════════════════════════════ */}
      {(tab === 'tat-ca' || tab === 'cong-cu') && (
        <section className="tv-section">
          <div className="tv-section-header">
            <h2 className="tv-section-title">
              <ExternalLink size={22} color="var(--m-dark)" />
              5. Cổng tra cứu trực tuyến thiết yếu của Cơ quan Nhà nước
            </h2>
          </div>

          <div className="tv-tool-links">
            <a
              href="https://csgt.vn/tra-cuu-phuong-tien-vi-pham-giao-thong-qua-hinh-anh.html"
              target="_blank"
              rel="noopener noreferrer"
              className="tv-tool-link-card"
            >
              <ExternalLink size={18} strokeWidth={1.8} color="var(--m-green)" />
              <div>
                <div>Tra cứu Phạt nguội</div>
                <div className="t-small" style={{ color: 'var(--m-subtle)' }}>Cục Cảnh sát Giao thông (csgt.vn)</div>
              </div>
            </a>

            <a
              href="https://gplx.gov.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="tv-tool-link-card"
            >
              <ExternalLink size={18} strokeWidth={1.8} color="var(--m-green)" />
              <div>
                <div>Tra cứu Giấy phép lái xe</div>
                <div className="t-small" style={{ color: 'var(--m-subtle)' }}>Cục Đường bộ Việt Nam (gplx.gov.vn)</div>
              </div>
            </a>

            <a
              href="http://app.vr.org.vn/baocaotructuyen/TraCuu_PTXCG.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="tv-tool-link-card"
            >
              <ExternalLink size={18} strokeWidth={1.8} color="var(--m-amber)" />
              <div>
                <div>Tra cứu Đăng kiểm xe</div>
                <div className="t-small" style={{ color: 'var(--m-subtle)' }}>Cục Đăng kiểm VN (vr.org.vn)</div>
              </div>
            </a>

            <a
              href="https://dichvucong.gov.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="tv-tool-link-card"
            >
              <ExternalLink size={18} strokeWidth={1.8} color="var(--m-mid)" />
              <div>
                <div>Cổng Dịch vụ công QG</div>
                <div className="t-small" style={{ color: 'var(--m-subtle)' }}>Nộp phạt vi phạm online (dichvucong.gov.vn)</div>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* ─── Footer lưu ý ─── */}
      <div className="disclaimer" style={{ marginTop: 'var(--sp-8)' }}>
        <b>Lưu ý trách nhiệm:</b> Toàn bộ biểu mẫu và hướng dẫn trên được biên soạn trên cơ sở thực tế và quy định dân sự Việt Nam nhằm mục đích hỗ trợ tham khảo cho chủ xe. Thuê Xe Nhanh là nền tảng rao vặt công nghệ kết nối trực tiếp, không phải là một bên trong giao dịch và không cung cấp dịch vụ bảo lãnh hay tư vấn pháp lý trực tiếp.
      </div>
    </div>
  )
}
