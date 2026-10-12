// scripts/kiem-bo-goc — chặn việc bo góc lệch nhau quay lại.
//
// Vì sao có file này: trước 12/10 app có 6 kiểu bo (0, 8, 12, 16, 20, 9999px)
// vì mỗi luồng tự chọn một con số — ô tìm kiếm thành viên thuốc, khối trang xe
// thì vuông. Gộp token (contracts/tokens.css) mới chỉ sửa được chỗ đang dùng
// token; ai gõ thẳng `border-radius: 8px` là phá lại ngay. File này bắt chỗ đó.
//
// Chạy:   npm run kiem:bogoc
// Thoát 1 nếu có vi phạm, 0 nếu sạch.
//
// Luật (không có ngoại lệ ngầm — cần ngoại lệ thì sửa danh sách CHO_PHEP ở dưới
// và giải thích vì sao):
//   ✓ var(--r-box)       độ bo duy nhất cho mọi ô
//   ✓ var(--r-circle)    hình tròn thật: ảnh đại diện, chấm
//   ✓ 50%                tương đương --r-circle (đang dùng cho ảnh đại diện)
//   ✓ 0 / inherit        bỏ bo có chủ ý (vd. ảnh nằm trong thẻ đã cắt góc)
//   ✓ var(--r-sm|md|lg|xl|full)   tên cũ, đã là bí danh của --r-box
//   ✗ số px bất kỳ       → dùng var(--r-box)
//   ✗ var(--r-<lạ>)      token không tồn tại → trình duyệt bỏ qua, ô vuông hẳn
//                         mà không báo gì (đã từng xảy ra: var(--r-2))

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const goc = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Token thật sự được khai báo, đọc thẳng từ hợp đồng để khỏi lệch.
const tokens = readFileSync(resolve(goc, 'contracts/tokens.css'), 'utf8')
const DA_KHAI = new Set([...tokens.matchAll(/--(r-[\w-]+)\s*:/g)].map((m) => m[1]))

const CHO_PHEP_GIA_TRI = /^(0|0px|inherit|initial|unset|50%|100%)$/

function duyet(thuMuc, ra = []) {
  for (const ten of readdirSync(thuMuc)) {
    const p = join(thuMuc, ten)
    if (ten === 'node_modules' || ten === 'dist') continue
    if (statSync(p).isDirectory()) duyet(p, ra)
    else if (/\.(css|jsx)$/.test(ten)) ra.push(p)
  }
  return ra
}

// `border-radius`, `border-top-left-radius`… và `borderRadius`… trong JSX.
const MAU = /(border(?:-(?:top|bottom)-(?:left|right))?-radius|border(?:Top|Bottom)(?:Left|Right)Radius|borderRadius)\s*:\s*([^;}\n]+)/g

const loi = []
for (const f of duyet(resolve(goc, 'src'))) {
  const noiDung = readFileSync(f, 'utf8')
  noiDung.split('\n').forEach((dong, i) => {
    for (const m of dong.matchAll(MAU)) {
      // Cắt giá trị đúng chỗ kết thúc: CSS dừng ở `;`, JSX inline dừng ở dấu
      // phẩy ngoài ngoặc (`borderRadius: 'var(--r-box)', display: 'grid'`).
      // Không cắt thì nuốt cả prop kế bên và báo nhầm.
      let gia = m[2]
      let sau = 0
      for (let k = 0; k < gia.length; k++) {
        if (gia[k] === '(') sau++
        else if (gia[k] === ')') sau--
        else if (gia[k] === ',' && sau === 0) { gia = gia.slice(0, k); break }
      }
      gia = gia.replace(/['"`]+/g, ' ').replace(/!important/, '').trim()

      // Có thể là 4 giá trị cho 4 góc ("12px 12px 0 0"): kiểm từng mảnh.
      for (const mieng of gia.split(/\s+/).filter(Boolean)) {
        if (CHO_PHEP_GIA_TRI.test(mieng)) continue
        // Biến JS (`borderRadius: radius`): giá trị thật nằm ở nơi truyền vào,
        // và nơi đó cũng bị quét. Không tự đoán được thì không báo.
        if (/^[A-Za-z_$][\w$.]*$/.test(mieng)) continue

        const v = mieng.match(/^var\(--(r-[\w-]+)\)$/)
        if (v) {
          if (!DA_KHAI.has(v[1])) {
            loi.push([f, i + 1, mieng, `token --${v[1]} KHÔNG tồn tại → ô bị vuông, không báo lỗi`])
          }
          continue
        }
        // Mảnh còn lại: số px / % lạ / biểu thức.
        loi.push([f, i + 1, mieng, 'giá trị gõ cứng — dùng var(--r-box)'])
      }
    }
  })
}

if (loi.length === 0) {
  console.log(`[kiem-bo-goc] SẠCH — mọi bo góc đều đi qua token (${DA_KHAI.size} token r-* khai báo).`)
  process.exit(0)
}

console.log(`[kiem-bo-goc] ${loi.length} chỗ bo góc lệch chuẩn:\n`)
for (const [f, dong, gia, ly_do] of loi) {
  console.log(`  ${relative(goc, f).replaceAll('\\', '/')}:${dong}   ${gia}`)
  console.log(`      → ${ly_do}`)
}
console.log('\nSửa thành var(--r-box). Hình tròn thật (ảnh đại diện, chấm) dùng var(--r-circle).')
process.exit(1)
