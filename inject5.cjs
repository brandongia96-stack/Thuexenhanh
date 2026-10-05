const fs = require('fs');
let hook = fs.readFileSync('src/modules/listing/editor/useFormDangTin.js', 'utf8');

hook = hook.replace(
  'await guiDuyet(id)',
  'await guiDuyet(id)\n      if (goi === GOI.DAY_DU) { const { getSupabase } = await import(\'../../../lib/supabase\'); const sb = await getSupabase(); await sb.rpc(\'mock_grant_verified\', { p_listing_id: id }); }'
);

fs.writeFileSync('src/modules/listing/editor/useFormDangTin.js', hook, 'utf8');
console.log('useFormDangTin updated with mock_grant_verified');
