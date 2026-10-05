const fs = require('fs');
let content = fs.readFileSync('src/modules/listing/editor/FormDangTin.jsx', 'utf8');
content = content.replace(
  '<h2 className="t-h3">Khai báo bao nhiêu thông tin?</h2>',
  '<h2 className="t-h3">Chọn gói đăng tin</h2>'
);
content = content.replace(
  '<p className="t-small">Hai lựa chọn dưới đây <strong>cùng một giá</strong>. Khác nhau ở số trường phải điền, không phải ở tiền.</p>',
  '<p className="t-small">Gói <strong>Cơ bản</strong> tốn 10 Token/tháng. Gói <strong>Đầy đủ</strong> tốn 20 Token/tháng và được cấp Tích xanh.</p>'
);

// Add the OCR Mock UI
const ocrMockUI = `
          {goi === GOI.DAY_DU && (
            <div className="fdt-nhom card card-pad stack" style={{ background: 'var(--m-green-bg)', borderColor: 'var(--m-green-light)' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 className="t-h4" style={{ color: 'var(--m-green)' }}>✨ AI Quét Giấy Tờ Tự Động (OCR)</h3>
              </div>
              <p className="t-small">Tải lên Ảnh Đăng kiểm hoặc Cà vẹt xe. AI sẽ tự động trích xuất thông tin và điền vào form bên dưới. Quét thành công sẽ được cấp <strong>Tích Xanh uy tín</strong>.</p>
              
              <div className="row" style={{ gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  disabled={khoaSua || dangQuetGiayTo}
                  onClick={quetGiayTo}
                >
                  {dangQuetGiayTo ? <><Loader2 size={18} className="lucide-spin" /> Đang quét AI...</> : 'Tải lên giấy tờ xe'}
                </button>
                {quetThanhCong && (
                  <span style={{ color: 'var(--m-green)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={18} /> Đã cấp Tích Xanh!
                  </span>
                )}
              </div>
            </div>
          )}

          {nhom.map((n) => (
`;

content = content.replace(
  '{/* ─── Các nhóm trường ─── */}\n        <div className="fdt-chia">',
  ocrMockUI + '\n        <div className="fdt-chia">'
);

// Add the state and function for OCR
const ocrLogic = `
  const nhan = nhanTrangThai(trangThai)

  const [dangQuetGiayTo, setDangQuetGiayTo] = useState(false)
  const [quetThanhCong, setQuetThanhCong] = useState(false)

  function quetGiayTo() {
    setDangQuetGiayTo(true)
    setTimeout(() => {
      // Giả lập điền dữ liệu OCR
      doiTruong('plate', '51K-12345')
      doiTruong('brand_text', 'Toyota')
      doiTruong('model_text', 'Innova')
      doiTruong('year', '2023')
      doiTruong('seats', '7')
      doiTruong('color', 'Trắng')
      
      setQuetThanhCong(true)
      setDangQuetGiayTo(false)
      alert('AI đã quét thành công! Form đã được điền tự động và chiếc xe này sẽ nhận được Tích Xanh.')
    }, 2000)
  }
`;

content = content.replace(
  'const nhan = nhanTrangThai(trangThai)',
  ocrLogic
);

fs.writeFileSync('src/modules/listing/editor/FormDangTin.jsx', content, 'utf8');
console.log('FormDangTin updated');
