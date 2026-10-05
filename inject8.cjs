const fs = require('fs');
let hook = fs.readFileSync('src/modules/listing/editor/useFormDangTin.js', 'utf8');

hook = hook.replace(
  'setForm(await hangSangForm(l))',
  'setForm(await hangSangForm(l));\n      if (l.package_id) setGoi(l.package_id);'
);

fs.writeFileSync('src/modules/listing/editor/useFormDangTin.js', hook, 'utf8');
console.log('useFormDangTin setGoi updated');
