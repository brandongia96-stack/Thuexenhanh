// Sinh migration từ nguồn sự thật:
//   contracts/schema.sql  -> supabase/migrations/0001_init.sql
//   src/data/*.js         -> supabase/migrations/0003_seed_static.sql
//
// Chạy: node scripts/gen-migrations.mjs
// Sửa schema hay dữ liệu tĩnh xong thì chạy lại, đừng sửa tay file migration.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'supabase/migrations')
mkdirSync(out, { recursive: true })

const banner = (src) =>
  `-- SINH TỰ ĐỘNG bởi scripts/gen-migrations.mjs từ ${src}\n-- Đừng sửa tay file này. Sửa nguồn rồi chạy lại script.\n\n`

// ── 0001: schema ──
const schema = readFileSync(resolve(root, 'contracts/schema.sql'), 'utf8')
writeFileSync(resolve(out, '0001_init.sql'), banner('contracts/schema.sql') + schema)

// ── 0003: dữ liệu tĩnh ──
const q = (s) => `'${String(s).replace(/'/g, "''")}'`

function slugify(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const imp = async (p) => import(pathToFileURL(resolve(root, p)).href)
const { CAR_MODELS, BRANDS } = await imp('src/data/brands.js')
const { PROVINCES, DISTRICTS, MAJOR_CITIES } = await imp('src/data/provinces.js')
const { AMENITIES } = await imp('src/data/amenities.js')

const L = [banner('src/data/*.js')]

L.push('-- Hãng xe')
L.push('insert into brands (name, slug, sort_order) values')
L.push(BRANDS.map((b, i) => `  (${q(b)}, ${q(slugify(b))}, ${i})`).join(',\n') + '\non conflict (name) do nothing;\n')

L.push('-- Dòng xe')
const models = []
for (const [brand, list] of Object.entries(CAR_MODELS)) {
  for (const m of list) {
    models.push(`  ((select id from brands where name = ${q(brand)}), ${q(m)}, ${q(slugify(m))})`)
  }
}
L.push('insert into models (brand_id, name, slug) values')
L.push(models.join(',\n') + '\non conflict (brand_id, name) do nothing;\n')

L.push('-- Tỉnh/thành')
L.push('insert into provinces (name, slug, is_major, sort_order) values')
L.push(
  PROVINCES.map(
    (p, i) => `  (${q(p)}, ${q(slugify(p))}, ${MAJOR_CITIES.includes(p)}, ${i})`
  ).join(',\n') + '\non conflict (name) do nothing;\n'
)

L.push('-- Quận/huyện (chỉ 5 thành phố lớn)')
const districts = []
for (const [prov, list] of Object.entries(DISTRICTS)) {
  for (const d of list) {
    districts.push(`  ((select id from provinces where name = ${q(prov)}), ${q(d)}, ${q(slugify(d))})`)
  }
}
L.push('insert into districts (province_id, name, slug) values')
L.push(districts.join(',\n') + '\non conflict (province_id, name) do nothing;\n')

L.push('-- Tiện nghi')
L.push('insert into amenities (code, name, icon, sort_order) values')
L.push(
  AMENITIES.map((a, i) => `  (${q(a.code)}, ${q(a.name)}, ${q(a.icon)}, ${i})`).join(',\n') +
    '\non conflict (code) do nothing;\n'
)

writeFileSync(resolve(out, '0003_seed_static.sql'), L.join('\n'))

console.log(
  `OK — brands ${BRANDS.length} · models ${models.length} · provinces ${PROVINCES.length} · districts ${districts.length} · amenities ${AMENITIES.length}`
)
