const fs = require('fs');
let formApi = fs.readFileSync('src/modules/listing/listingApi.js', 'utf8');

// Update formSangHang to include package_id
formApi = formApi.replace(
  'export async function formSangHang(form, ownerId) {',
  'export async function formSangHang(form, ownerId, package_id) {'
);
formApi = formApi.replace(
  '    owner_id: ownerId,\n',
  '    owner_id: ownerId,\n    package_id: package_id || \'co_ban\',\n'
);

// Update taoNhap
formApi = formApi.replace(
  'export async function taoNhap(form, ownerId) {',
  'export async function taoNhap(form, ownerId, package_id) {'
);
formApi = formApi.replace(
  'const hang = await formSangHang(form, ownerId)',
  'const hang = await formSangHang(form, ownerId, package_id)'
);

// Update capNhatTin
formApi = formApi.replace(
  'export async function capNhatTin(id, form, ownerId) {',
  'export async function capNhatTin(id, form, ownerId, package_id) {'
);
formApi = formApi.replace(
  'const hang = await formSangHang(form, ownerId)',
  'const hang = await formSangHang(form, ownerId, package_id)'
);

fs.writeFileSync('src/modules/listing/listingApi.js', formApi, 'utf8');

let hook = fs.readFileSync('src/modules/listing/editor/useFormDangTin.js', 'utf8');
hook = hook.replace(
  'const id = await taoNhap(form, ownerId)',
  'const id = await taoNhap(form, ownerId, goi)'
);
hook = hook.replace(
  'await capNhatTin(id, form, ownerId)',
  'await capNhatTin(id, form, ownerId, goi)'
);
hook = hook.replace(
  'const [goi, setGoi] = useState(GOI.DAY_DU)',
  'const [goi, setGoi] = useState(GOI.CO_BAN)'
);
// Make sure when loading a listing we set the `goi` correctly
hook = hook.replace(
  'setForm(hangSangForm(t))',
  'setForm(hangSangForm(t));\n      if (t.package_id) setGoi(t.package_id);'
);

fs.writeFileSync('src/modules/listing/editor/useFormDangTin.js', hook, 'utf8');
console.log('listingApi and useFormDangTin updated');
