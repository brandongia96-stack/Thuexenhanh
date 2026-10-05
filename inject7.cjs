const fs = require('fs');
let code = fs.readFileSync('src/modules/billing/charging/HopTraPhi.jsx', 'utf8');
code = code.replace(
  '{GOI_HIEN_THI.map((g) => (',
  '{layGoiHienThi(listing?.package_id).map((g) => ('
);
fs.writeFileSync('src/modules/billing/charging/HopTraPhi.jsx', code, 'utf8');
console.log('HopTraPhi updated 2');
