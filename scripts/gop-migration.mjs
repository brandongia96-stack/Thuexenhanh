// Gộp 8 file migration thành MỘT file dán một lần vào SQL Editor.
//
// Vì sao cần: dán 8 lần thì dễ nhầm thứ tự, và nếu file thứ 5 lỗi thì 4 file
// trước đã ghi vào CSDL rồi — dở dang, phải dọn tay. File gộp bọc trong
// BEGIN/COMMIT nên hoặc vào hết, hoặc không vào gì.
//
// Chạy: node scripts/gop-migration.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const thuMuc = resolve(root, 'supabase/migrations')

const files = readdirSync(thuMuc).filter((f) => f.endsWith('.sql')).sort()

const out = [
  '-- ============================================================',
  '-- TẤT CẢ MIGRATION — SINH TỰ ĐỘNG bởi scripts/gop-migration.mjs',
  '-- Đừng sửa tay file này. Sửa file gốc trong supabase/migrations/ rồi chạy lại.',
  '--',
  '-- Cách dùng: mở SQL Editor của Supabase, dán CẢ FILE, bấm Run. Một lần duy nhất.',
  '--',
  '-- Bọc trong BEGIN/COMMIT: lỗi ở bất kỳ đâu là huỷ sạch toàn bộ, CSDL trở lại',
  '-- như trước khi chạy. Không có chuyện vào được một nửa rồi mắc kẹt.',
  `-- Gồm ${files.length} file: ${files.join(', ')}`,
  '-- ============================================================',
  '',
  'begin;',
  '',
]

for (const f of files) {
  const noiDung = readFileSync(resolve(thuMuc, f), 'utf8')
  out.push(
    '-- ════════════════════════════════════════════════════════════',
    `-- ▼ ${f}`,
    '-- ════════════════════════════════════════════════════════════',
    `do $$ begin raise notice 'Đang chạy: ${f}'; end $$;`,
    '',
    noiDung.trimEnd(),
    ''
  )
}

out.push(
  '-- ════════════════════════════════════════════════════════════',
  "do $$ begin raise notice 'XONG — tất cả migration đã chạy.'; end $$;",
  '',
  'commit;',
  ''
)

const dich = resolve(root, 'supabase/chay-tat-ca.sql')
writeFileSync(dich, out.join('\n'))

const dong = out.join('\n').split('\n').length
console.log(`OK — ${files.length} file, ${dong} dòng -> supabase/chay-tat-ca.sql`)
console.log(files.map((f, i) => `  ${i + 1}. ${f}`).join('\n'))
