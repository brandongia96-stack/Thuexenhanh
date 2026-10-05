const fs = require('fs');
let code = fs.readFileSync('src/modules/owner/TrangChuXe.jsx', 'utf8');
code = code.replace(
  'action={}',
  'action={<Link to="/chu-xe/dang-tin" className="btn btn-primary">Đăng xe ngay</Link>}'
);
fs.writeFileSync('src/modules/owner/TrangChuXe.jsx', code, 'utf8');
console.log('Fixed TrangChuXe.jsx');
