#!/usr/bin/env node
/**
 * Bảng điều khiển triển khai — Thuexenhanh
 *
 * Chạy:  node tools/deploy-ui/server.mjs
 * Mở:    http://127.0.0.1:4545
 *
 * Ba nút:
 *   Quét  — soi toàn bộ app, báo cáo, KHÔNG đẩy gì.
 *   Dev   — quét, nếu sạch thì commit + đẩy lên nhánh `dev` trên GitHub.
 *   Main  — chỉ bật sau khi Dev xanh; đẩy đúng commit đó lên nhánh `main`.
 *
 * Hai luật an toàn nằm trong code này, đừng gỡ:
 *   1. KHÔNG BAO GIỜ `git add -A`. Chỉ stage đúng đường dẫn anh tick trên giao diện.
 *      Lý do: nhiều luồng chat sửa repo song song, `git add -A` cắn việc của luồng khác.
 *   2. KHÔNG BAO GIỜ `git checkout` / đổi nhánh. Đẩy bằng `git push origin HEAD:<nhánh>`,
 *      cây làm việc đứng yên nên luồng chat khác đang chạy không bị giật file.
 */

import http from 'node:http'
import { execFile } from 'node:child_process'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', '..')
const PORT = Number(process.env.PORT || 4545)
const FILE_STATE = path.join(HERE, '.state.json')
const FILE_SNAPSHOT = path.join(HERE, '.snapshot.json')

// Ngân sách lấy thẳng từ HIEU-NANG.md và CLAUDE.md. Đổi ở đây là đổi luật.
const NGAN_SACH_JS_GZ = 150 * 1024 // JS lần đầu, gzip
const NGAN_SACH_APP_JSX = 200 // App.jsx chỉ được routing + layout

const DUOI_CODE = new Set(['.js', '.jsx', '.mjs', '.css', '.sql', '.json', '.html'])
const BO_QUA_THU_MUC = new Set([
  'node_modules', '.git', 'dist', '_backup', '_scratch', '.vite', 'Web thue xe',
])

// ── Chạy lệnh ───────────────────────────────────────────────────────────────

function run(file, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(file, args, {
      cwd: ROOT,
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
      timeout: opts.timeout ?? 240_000,
      // Không cho git bật hộp thoại hỏi mật khẩu — thà hỏng ngay còn hơn treo im.
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    }, (err, stdout, stderr) => {
      resolve({
        code: err ? (typeof err.code === 'number' ? err.code : 1) : 0,
        out: String(stdout || ''),
        err: String(stderr || ''),
        timedOut: Boolean(err && err.killed),
      })
    })
  })
}

const git = (...args) => run('git', args)

/**
 * Chạy npm. Trên Windows KHÔNG spawn thẳng `npm.cmd` được: từ Node 20 (CVE-2024-27980)
 * việc đó ném `spawn EINVAL`. Phải đi qua cmd.exe. Tham số ở đây là hằng số do
 * code này đặt, không lấy từ người dùng, nên ghép chuỗi là an toàn.
 */
function runNpm(args, opts) {
  if (process.platform === 'win32') {
    return run(process.env.COMSPEC || 'cmd.exe', ['/d', '/s', '/c', 'npm ' + args.join(' ')], opts)
  }
  return run('npm', args, opts)
}

// ── Đọc/ghi trạng thái ──────────────────────────────────────────────────────

async function docJson(file, macDinh) {
  try { return JSON.parse(await readFile(file, 'utf8')) } catch { return macDinh }
}
async function ghiJson(file, data) {
  await writeFile(file, JSON.stringify(data, null, 2), 'utf8')
}

// ── Duyệt cây thư mục ───────────────────────────────────────────────────────

async function duyet(thuMuc, goc = thuMuc, ketQua = []) {
  let mucs
  try { mucs = await readdir(thuMuc, { withFileTypes: true }) } catch { return ketQua }
  for (const m of mucs) {
    if (m.name.startsWith('.')) continue
    const day = path.join(thuMuc, m.name)
    if (m.isDirectory()) {
      if (BO_QUA_THU_MUC.has(m.name)) continue
      await duyet(day, goc, ketQua)
    } else if (DUOI_CODE.has(path.extname(m.name))) {
      ketQua.push(day)
    }
  }
  return ketQua
}

/** Đường dẫn -> tên module. Quyết định cách gom nhóm ở bảng tổng quan. */
function moduleCua(rel) {
  const p = rel.replace(/\\/g, '/')
  const m = p.match(/^src\/modules\/([^/]+)\//)
  if (m) return m[1]
  if (p.startsWith('src/components/')) return 'components'
  if (p.startsWith('src/lib/')) return 'lib'
  if (p.startsWith('src/data/')) return 'data'
  if (p.startsWith('src/')) return 'khung'
  if (p.startsWith('contracts/')) return '· hợp đồng chung'
  if (p.startsWith('supabase/')) return '· supabase'
  if (p.startsWith('scripts/') || p.startsWith('tools/')) return '· công cụ'
  return '· khác'
}

// ── Trạng thái git ──────────────────────────────────────────────────────────

/** Tách `git status --porcelain=v1 -z`. Bản ghi đổi tên có hai đường dẫn. */
function tachStatus(raw) {
  const toks = raw.split('\0').filter(Boolean)
  const ra = []
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]
    const xy = t.slice(0, 2)
    let duongDan = t.slice(3)
    if (xy[0] === 'R' || xy[0] === 'C') { i++ } // bỏ qua đường dẫn cũ
    ra.push({ xy, path: duongDan.replace(/\\/g, '/') })
  }
  return ra
}

function nhanTrangThai(xy) {
  if (xy.includes('?')) return 'moi'
  if (xy.includes('D')) return 'xoa'
  if (xy.includes('A')) return 'moi'
  if (xy.includes('R')) return 'doi-ten'
  return 'sua'
}

async function thongTinGit() {
  const [branch, head, remote, upstreamDev] = await Promise.all([
    git('rev-parse', '--abbrev-ref', 'HEAD'),
    git('rev-parse', 'HEAD'),
    git('remote', 'get-url', 'origin'),
    git('rev-parse', '--verify', '--quiet', 'refs/remotes/origin/dev'),
  ])
  return {
    branch: branch.out.trim(),
    head: head.out.trim(),
    headNgan: head.out.trim().slice(0, 7),
    remote: remote.code === 0 ? remote.out.trim() : null,
    coNhanhDev: upstreamDev.code === 0,
  }
}

// ── Các phép kiểm tra luật dự án ────────────────────────────────────────────

function loi(ma, tieuDe, chiTiet, file, luat) {
  return { ma, tieuDe, chiTiet, file: file || null, luat: luat || null }
}

/** Quét nội dung src/ theo các luật trong CLAUDE.md. */
function kiemTraLuatCode(files) {
  const chan = []
  const canhBao = []

  for (const f of files) {
    const rel = f.rel
    if (!/^src\//.test(rel)) continue
    const txt = f.text

    // ── Chặn ──
    if (/^<{7} /m.test(txt)) {
      chan.push(loi('xung-dot', 'Còn dấu xung đột merge trong file',
        'File còn `<<<<<<<` — code này không chạy được.', rel, 'git merge chưa giải quyết xong'))
    }
    if (/@tailwind\b|from\s+['"]tailwindcss|tailwind\.config/.test(txt)) {
      chan.push(loi('tailwind', 'Có dấu vết TailwindCSS',
        'Dự án dùng CSS thuần. Tailwind bị cấm.', rel, 'CLAUDE.md §1.3'))
    }
    if (/import\s+\*\s+as\s+\w+\s+from\s+['"]lucide-react['"]/.test(txt)) {
      chan.push(loi('lucide-ca-goi', 'Import cả gói lucide-react',
        'Cả gói hơn 1 MB. Phải import từng icon: `import { Car } from "lucide-react"`.',
        rel, 'CLAUDE.md §1.4'))
    }
    if (rel === 'src/App.jsx' && f.lines > NGAN_SACH_APP_JSX) {
      chan.push(loi('app-jsx-dai', `App.jsx ${f.lines} dòng, vượt ngưỡng ${NGAN_SACH_APP_JSX}`,
        'App.jsx chỉ được chứa routing + layout. Phần còn lại tách sang module.',
        rel, 'CLAUDE.md §4'))
    }

    // ── Cảnh báo ──
    if (rel !== 'src/styles.css') {
      const hex = [...txt.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0])
      if (hex.length) {
        canhBao.push(loi('mau-cung', `Mã màu viết cứng (${hex.length} chỗ)`,
          `Phải dùng token \`var(--m-...)\`. Thấy: ${[...new Set(hex)].slice(0, 5).join(', ')}`,
          rel, 'CLAUDE.md §1.3'))
      }
    }
    if (/\.select\(\s*['"`]\*/.test(txt)) {
      canhBao.push(loi('select-sao', 'Dùng `select("*")`',
        'Kéo thừa cột, tốn băng thông 4G. Liệt kê đúng cột cần.', rel, 'CLAUDE.md §1.4'))
    }
    if (/\.range\(/.test(txt)) {
      canhBao.push(loi('offset', 'Phân trang bằng `.range()` (OFFSET)',
        'Danh sách phải phân trang bằng cursor/keyset, không OFFSET.', rel, 'CLAUDE.md §1.4'))
    }
    const theImg = [...txt.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
    const imgThieu = theImg.filter((t) => !/\bwidth=/.test(t) || !/\bheight=/.test(t))
      .filter((t) => !/aspect-?[Rr]atio/.test(t))
    if (imgThieu.length) {
      canhBao.push(loi('img-khong-kich-thuoc', `${imgThieu.length} thẻ <img> thiếu width/height`,
        'Thiếu kích thước thì trang nhảy khi ảnh tải xong (CLS).', rel, 'CLAUDE.md §1.4'))
    }
    const log = (txt.match(/console\.log\(/g) || []).length
    if (log) {
      canhBao.push(loi('console-log', `Còn ${log} lệnh console.log`,
        'Dọn trước khi lên production.', rel, null))
    }
    const todo = (txt.match(/\b(TODO|FIXME|HACK)\b/g) || []).length
    if (todo) {
      canhBao.push(loi('todo', `Còn ${todo} ghi chú TODO/FIXME`, 'Việc chưa làm xong.', rel, null))
    }
  }
  return { chan, canhBao }
}

/**
 * Repo trên GitHub đang public hay private?
 * Hỏi API không đăng nhập: 200 = public, 404 = private (hoặc không tồn tại).
 * Trả `null` khi không xác định được (mất mạng, remote không phải GitHub).
 */
async function repoCongKhai(remote) {
  if (!remote) return null
  const m = remote.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/i)
  if (!m) return null
  try {
    const r = await fetch(`https://api.github.com/repos/${m[1]}/${m[2]}`, {
      headers: { accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(6000),
    })
    if (r.status === 404) return 'private'
    if (!r.ok) return null
    const j = await r.json()
    return j.private ? 'private' : 'public'
  } catch { return null }
}

/**
 * Quét secret trong các file git đang theo dõi. Đây là hàng rào cuối trước khi lộ key.
 * `hienTrang` là 'public' | 'private' | null — quyết định mức độ của khoá Firebase.
 */
async function kiemTraSecret(hienTrang) {
  const chan = []
  const canhBao = []
  const ls = await git('ls-files', '-z')
  const files = ls.out.split('\0').filter(Boolean)

  const envTheoDoi = files.filter((f) => /(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.env.example'))
  if (envTheoDoi.length) {
    chan.push(loi('env-theo-doi', 'File .env đang bị git theo dõi',
      `Đẩy lên là lộ key: ${envTheoDoi.join(', ')}. Gỡ bằng \`git rm --cached\`.`,
      envTheoDoi[0], 'LUONG-CHAT/13-deploy.md §A1'))
  }

  // JWT thật có 3 đoạn base64url ngăn bởi dấu chấm. Chuỗi "eyJ..." đứng một mình
  // trong tài liệu thì không tính — tránh báo động giả ở CLAUDE.md và các brief.
  const reJwt = /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/
  for (const f of files) {
    if (/\.(png|jpe?g|webp|ico|rar|zip|pdf)$/i.test(f)) continue
    let txt
    try { txt = await readFile(path.join(ROOT, f), 'utf8') } catch { continue }
    if (reJwt.test(txt)) {
      chan.push(loi('lo-key', 'Có khoá JWT thật trong file đang theo dõi',
        'Đẩy lên GitHub coi như đã lộ. Phải xoay key ở Supabase, không phải chỉ xoá commit.',
        f, 'LUONG-CHAT/13-deploy.md §A1'))
    }
    if (/VITE_[A-Z_]*SERVICE[A-Z_]*\s*=\s*\S/.test(txt)) {
      chan.push(loi('service-role-vite', 'service_role key đặt vào biến VITE_*',
        'Vite nhúng mọi biến VITE_* vào file JS công khai. Đây là lộ toàn bộ CSDL.',
        f, 'LUONG-CHAT/13-deploy.md §B3'))
    }
    // Khoá web Firebase/Google vốn được thiết kế để lộ ra ngoài — BÌNH THƯỜNG nếu
    // security rules chặt. Nhưng CLAUDE.md §9 ghi rõ v0.1 KHÔNG có Firestore rules,
    // ai cũng gọi setDoc/deleteDoc được. Nên mức độ phụ thuộc repo public hay private.
    if (/\bAIza[0-9A-Za-z_-]{30,}/.test(txt)) {
      if (hienTrang === 'public') {
        chan.push(loi('khoa-firebase', 'Repo ĐANG PUBLIC mà có cấu hình Firebase trong file',
          'Khoá web Firebase vốn công khai theo thiết kế — nguy hiểm hay không là do '
          + 'security rules của dự án, KHÔNG phải do khoá bị lộ. CLAUDE.md §9 ghi v0.1 '
          + 'không có rules; kiểm lại ở Firebase Console để biết thực tế.\n\n'
          + 'Lưu ý: gỡ khoá khỏi file BÂY GIỜ không xoá nó khỏi lịch sử git, và cũng '
          + 'không thu hồi được thứ đã đẩy lên repo công khai. Cách thật sự có tác dụng '
          + 'là siết rules hoặc xoá dự án Firebase cũ.',
          f, 'CLAUDE.md §9'))
      } else {
        canhBao.push(loi('khoa-firebase', 'Có cấu hình Firebase v0.1 trong repo',
          hienTrang === 'private'
            ? 'Repo private nên khoá không lộ thêm. Vẫn nên vào Firebase Console tắt dự '
              + 'án cũ nếu không dùng nữa — v0.2 đã chạy Supabase.'
            : 'Không xác định được repo public hay private (mất mạng?). Nếu repo public '
              + 'thì cần kiểm lại security rules của dự án Firebase cũ.',
          f, 'CLAUDE.md §9'))
      }
    }
  }
  return { chan, canhBao }
}

/** Đọc dist/index.html, gzip đúng các asset tải ở lần đầu. */
function doGoiLanDau() {
  const indexHtml = path.join(ROOT, 'dist', 'index.html')
  if (!existsSync(indexHtml)) return null
  const html = readFileSync(indexHtml, 'utf8')
  const duongDan = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
  let js = 0, css = 0
  const chiTiet = []
  for (const d of duongDan) {
    const f = path.join(ROOT, 'dist', d.replace(/^\//, ''))
    if (!existsSync(f)) continue
    const gz = gzipSync(readFileSync(f)).length
    if (d.endsWith('.css')) css += gz; else js += gz
    chiTiet.push({ ten: path.basename(f), gz })
  }
  return { js, css, chiTiet }
}

// ── Quét tổng ───────────────────────────────────────────────────────────────

async function quet(bao) {
  const batDau = Date.now()
  const chan = []
  const canhBao = []

  bao('git', 'Đọc trạng thái git…')
  const g = await thongTinGit()

  // 1. Đọc toàn bộ code
  bao('doc', 'Đọc code trong src/, contracts/, supabase/…')
  const duongDans = [
    ...(await duyet(path.join(ROOT, 'src'))),
    ...(await duyet(path.join(ROOT, 'contracts'))),
    ...(await duyet(path.join(ROOT, 'supabase'))),
  ]
  const files = []
  for (const abs of duongDans) {
    let text
    try { text = await readFile(abs, 'utf8') } catch { continue }
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/')
    files.push({
      rel,
      text,
      lines: text.length ? text.split('\n').length : 0,
      bytes: Buffer.byteLength(text, 'utf8'),
      module: moduleCua(rel),
    })
  }

  // 2. So với lần quét trước — "code nào mới"
  bao('so-sanh', 'So với lần quét trước…')
  const cu = await docJson(FILE_SNAPSHOT, { files: {}, at: null })
  const moi = {}
  for (const f of files) moi[f.rel] = { lines: f.lines, bytes: f.bytes }
  const tenCu = new Set(Object.keys(cu.files || {}))
  const tenMoi = new Set(Object.keys(moi))
  const soVoiLanTruoc = {
    laLanDau: !cu.at,
    luc: cu.at,
    themFile: [...tenMoi].filter((t) => !tenCu.has(t)),
    xoaFile: [...tenCu].filter((t) => !tenMoi.has(t)),
    suaFile: [...tenMoi].filter((t) => tenCu.has(t) && cu.files[t].bytes !== moi[t].bytes),
  }

  // 3. Thay đổi chưa commit
  bao('thay-doi', 'Tìm thay đổi chưa commit…')
  const st = await git('status', '--porcelain=v1', '-z', '--untracked-files=all')
  const thayDoi = tachStatus(st.out).map((e) => ({
    path: e.path,
    trangThai: nhanTrangThai(e.xy),
    module: moduleCua(e.path),
    them: 0,
    bot: 0,
  }))
  const numstat = await git('diff', '--numstat', 'HEAD')
  const banDo = new Map()
  for (const d of numstat.out.split('\n').filter(Boolean)) {
    const [a, b, p] = d.split('\t')
    if (p) banDo.set(p.replace(/\\/g, '/'), { them: Number(a) || 0, bot: Number(b) || 0 })
  }
  for (const t of thayDoi) {
    const n = banDo.get(t.path)
    if (n) { t.them = n.them; t.bot = n.bot; continue }
    if (t.trangThai !== 'moi') continue
    // File chưa được git theo dõi: git diff không thấy, phải tự đếm dòng.
    const f = files.find((x) => x.rel === t.path)
    if (f) { t.them = f.lines; continue }
    try {
      const txt = await readFile(path.join(ROOT, t.path), 'utf8')
      t.them = txt.length ? txt.split('\n').length : 0
    } catch { t.them = 0 }
  }

  // 4. Commit chưa lên nhánh dev
  bao('chua-day', 'Đếm commit chưa lên nhánh dev…')
  let commitChuaDay = []
  if (g.coNhanhDev) {
    const lg = await git('log', '--oneline', 'origin/dev..HEAD')
    commitChuaDay = lg.out.split('\n').filter(Boolean)
  }

  // 5. Luật code
  bao('luat', 'Đối chiếu luật trong CLAUDE.md…')
  const kq = kiemTraLuatCode(files)
  chan.push(...kq.chan)
  canhBao.push(...kq.canhBao)

  // 6. Secret — mức độ của khoá Firebase phụ thuộc repo public hay private
  bao('hien-trang', 'Hỏi GitHub xem repo public hay private…')
  const hienTrang = await repoCongKhai(g.remote)
  g.hienTrang = hienTrang

  bao('secret', 'Quét secret trong file git theo dõi…')
  const kqSecret = await kiemTraSecret(hienTrang)
  chan.push(...kqSecret.chan)
  canhBao.push(...kqSecret.canhBao)

  // 7. Build thật
  bao('build', 'Chạy `npm run build`… (chậm nhất, ~10s)')
  const tBuild = Date.now()
  const build = await runNpm(['run', 'build'])
  const buildMs = Date.now() - tBuild
  if (build.code !== 0) {
    const log = (build.err + '\n' + build.out).trim().split('\n').slice(-40).join('\n')
    chan.push(loi('build-hong', 'Build hỏng — `npm run build` không chạy được',
      log || 'Không có log.', null, 'CLAUDE.md §2.3'))
  }

  // 8. Hai file bắt buộc cho Cloudflare Pages
  bao('cloudflare', 'Kiểm tra _redirects và _headers trong dist/…')
  for (const f of ['_redirects', '_headers']) {
    if (!existsSync(path.join(ROOT, 'dist', f))) {
      chan.push(loi('thieu-' + f.slice(1), `Thiếu dist/${f}`,
        f === '_redirects'
          ? 'Không có file này thì F5 ở /xe/CAR-123 ra 404 trên Cloudflare Pages.'
          : 'Không có file này thì asset không được cache, tải lại từ đầu mỗi lần vào.',
        `public/${f}`, 'LUONG-CHAT/13-deploy.md §B4'))
    }
  }

  // 9. Ngân sách hiệu năng
  bao('ngan-sach', 'Cân gói JS lần đầu…')
  const goi = build.code === 0 ? doGoiLanDau() : null
  if (goi && goi.js > NGAN_SACH_JS_GZ) {
    chan.push(loi('vuot-ngan-sach',
      `Gói JS lần đầu ${(goi.js / 1024).toFixed(1)} KB gzip, vượt ngưỡng ${NGAN_SACH_JS_GZ / 1024} KB`,
      'Tách route bằng lazy import, hoặc tải trễ thư viện nặng.', null, 'HIEU-NANG.md §0'))
  }

  // 10. Gom theo module
  const modules = new Map()
  for (const f of files) {
    if (!modules.has(f.module)) {
      modules.set(f.module, { ten: f.module, files: 0, lines: 0, bytes: 0, thayDoi: [], moiSoLanTruoc: [] })
    }
    const m = modules.get(f.module)
    m.files++; m.lines += f.lines; m.bytes += f.bytes
  }
  // File thay đổi có thể nằm ngoài phạm vi đếm code (ví dụ `tools/`, `.gitignore`).
  // Vẫn phải có dòng cho nó, nếu không thẻ "Chưa commit" báo có mà bảng Module trống.
  for (const t of thayDoi) {
    if (!modules.has(t.module)) {
      modules.set(t.module, { ten: t.module, files: 0, lines: 0, bytes: 0, thayDoi: [], moiSoLanTruoc: [] })
    }
    modules.get(t.module).thayDoi.push(t)
  }
  for (const p of soVoiLanTruoc.themFile) {
    const m = modules.get(moduleCua(p))
    if (m) m.moiSoLanTruoc.push(p)
  }
  const dsModule = [...modules.values()].sort((a, b) => b.lines - a.lines)

  await ghiJson(FILE_SNAPSHOT, { at: new Date().toISOString(), files: moi })

  return {
    luc: new Date().toISOString(),
    matGiay: ((Date.now() - batDau) / 1000).toFixed(1),
    sach: chan.length === 0,
    chan,
    canhBao,
    git: g,
    tongQuan: {
      files: files.length,
      lines: files.reduce((s, f) => s + f.lines, 0),
      bytes: files.reduce((s, f) => s + f.bytes, 0),
      soModule: dsModule.filter((m) => !m.ten.startsWith('·')).length,
      jsGz: goi ? goi.js : null,
      cssGz: goi ? goi.css : null,
      nganSachJsGz: NGAN_SACH_JS_GZ,
      buildMs,
      buildOk: build.code === 0,
    },
    modules: dsModule,
    thayDoi,
    commitChuaDay,
    soVoiLanTruoc,
  }
}

// ── Đẩy lên GitHub ──────────────────────────────────────────────────────────

async function dayLenDev({ paths, message, headLucQuet }) {
  const g = await thongTinGit()
  if (!g.remote) {
    return { ok: false, loi: 'Chưa có remote `origin`. Chạy: git remote add origin <url repo>' }
  }
  if (headLucQuet && headLucQuet !== g.head) {
    return {
      ok: false,
      loi: `HEAD đã đổi từ lúc quét (${headLucQuet.slice(0, 7)} → ${g.headNgan}). `
        + 'Luồng chat khác vừa commit. Quét lại rồi đẩy.',
    }
  }

  // Chỉ stage đúng đường dẫn đã tick. Không bao giờ `git add -A`.
  if (paths && paths.length) {
    const add = await git('add', '--', ...paths)
    if (add.code !== 0) return { ok: false, loi: 'git add hỏng:\n' + add.err }

    const coGi = await git('diff', '--cached', '--quiet')
    if (coGi.code !== 0) {
      const msg = (message || '').trim() || 'deploy-ui: cap nhat'
      const cm = await git('commit', '-m', msg)
      if (cm.code !== 0) return { ok: false, loi: 'git commit hỏng:\n' + (cm.err || cm.out) }
    }
  }

  const push = await git('push', 'origin', 'HEAD:dev')
  if (push.code !== 0) {
    return { ok: false, loi: 'git push hỏng:\n' + (push.err || push.out) }
  }

  const sau = await thongTinGit()
  const state = { devPush: { sha: sau.head, luc: new Date().toISOString() } }
  await ghiJson(FILE_STATE, state)
  return { ok: true, sha: sau.head, log: push.err || push.out, state }
}

async function dayLenMain() {
  const g = await thongTinGit()
  const state = await docJson(FILE_STATE, {})
  if (!g.remote) return { ok: false, loi: 'Chưa có remote `origin`.' }
  if (!state.devPush) {
    return { ok: false, loi: 'Chưa đẩy lên dev lần nào. Bấm nút Dev trước.' }
  }
  if (state.devPush.sha !== g.head) {
    return {
      ok: false,
      loi: `Commit đã đổi sau lần đẩy dev (${state.devPush.sha.slice(0, 7)} → ${g.headNgan}). `
        + 'Main chỉ nhận đúng commit đã được kiểm tra. Bấm Dev lại.',
    }
  }
  const push = await git('push', 'origin', 'HEAD:main')
  if (push.code !== 0) return { ok: false, loi: 'git push hỏng:\n' + (push.err || push.out) }
  return { ok: true, sha: g.head, log: push.err || push.out }
}

// ── Máy chủ ─────────────────────────────────────────────────────────────────

function chiLocalhost(req) {
  const host = String(req.headers.host || '')
  return /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)
}

function traJson(res, data, ma = 200) {
  const body = JSON.stringify(data)
  res.writeHead(ma, { 'content-type': 'application/json; charset=utf-8' })
  res.end(body)
}

async function docBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { return {} }
}

const may = http.createServer(async (req, res) => {
  if (!chiLocalhost(req)) { res.writeHead(403); return res.end('chi chay o localhost') }
  const url = new URL(req.url, 'http://127.0.0.1')

  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await readFile(path.join(HERE, 'index.html'), 'utf8')
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      return res.end(html)
    }

    if (url.pathname === '/api/state') {
      const [g, st] = await Promise.all([thongTinGit(), docJson(FILE_STATE, {})])
      return traJson(res, { git: g, ...st })
    }

    // Quét — dòng sự kiện để giao diện hiện tiến trình thay vì đứng im 15 giây.
    if (url.pathname === '/api/scan') {
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      })
      const gui = (loai, data) => res.write(`event: ${loai}\ndata: ${JSON.stringify(data)}\n\n`)
      try {
        const kq = await quet((ma, text) => gui('buoc', { ma, text }))
        gui('xong', kq)
      } catch (e) {
        gui('vo', { loi: String(e && e.stack || e) })
      }
      return res.end()
    }

    if (req.method === 'POST' && url.pathname === '/api/push-dev') {
      // Header riêng: trang web lạ không gửi được nếu không qua preflight CORS.
      if (req.headers['x-deploy-ui'] !== '1') return traJson(res, { ok: false, loi: 'thieu header' }, 400)
      const body = await docBody(req)
      return traJson(res, await dayLenDev(body))
    }

    if (req.method === 'POST' && url.pathname === '/api/push-main') {
      if (req.headers['x-deploy-ui'] !== '1') return traJson(res, { ok: false, loi: 'thieu header' }, 400)
      return traJson(res, await dayLenMain())
    }

    res.writeHead(404); res.end('khong co')
  } catch (e) {
    traJson(res, { ok: false, loi: String(e && e.stack || e) }, 500)
  }
})

may.listen(PORT, '127.0.0.1', () => {
  console.log('')
  console.log('  Bảng điều khiển triển khai — Thuexenhanh')
  console.log('  → http://127.0.0.1:' + PORT)
  console.log('  Thư mục: ' + ROOT)
  console.log('  Ctrl+C để tắt.')
  console.log('')
})
