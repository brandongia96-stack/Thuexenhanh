const fs = require('fs');
let content = fs.readFileSync('src/modules/auth/TrangTaiKhoan.jsx', 'utf8');
content = content.replace('ArrowLeft, Loader2', 'ArrowLeft, Loader2, Gift');
content = content.replace(
  '<MucMenu to="/da-luu" icon={Heart} chu="Xe đã lưu" />',
  '<MucMenu to="/da-luu" icon={Heart} chu="Xe đã lưu" />\n        <MucMenu onClick={() => setView(\'referral\')} icon={Gift} chu="Quà tặng giới thiệu" />'
);
fs.writeFileSync('src/modules/auth/TrangTaiKhoan.jsx', content, 'utf8');
console.log('Added Referral menu item');
