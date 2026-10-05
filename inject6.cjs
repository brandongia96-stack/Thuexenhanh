const fs = require('fs');
let code = fs.readFileSync('src/modules/billing/charging/HopTraPhi.jsx', 'utf8');
code = code.replace(
  'import { GOI_HIEN_THI } from \'../../../lib/pricing\'',
  'import { layGoiHienThi } from \'../../../lib/pricing\''
);
code = code.replace(
  `  const goi = useMemo(
    () => GOI_HIEN_THI.find((g) => g.months === months) ?? GOI_HIEN_THI[0],
    [months],
  )`,
  `  const goi = useMemo(
    () => layGoiHienThi(listing?.package_id).find((g) => g.months === months) ?? layGoiHienThi(listing?.package_id)[0],
    [months, listing?.package_id],
  )`
);
fs.writeFileSync('src/modules/billing/charging/HopTraPhi.jsx', code, 'utf8');
console.log('HopTraPhi updated');
