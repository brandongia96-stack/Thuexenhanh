# Bảng điều khiển triển khai

Trang chạy ở máy anh, không phải trang web. Nó cần chạy `git` và `npm run build` thật nên bắt buộc phải có tiến trình trên máy.

## Mở

Nháy đúp `tools/deploy-ui/start.cmd`, hoặc:

```bash
node tools/deploy-ui/server.mjs
```

Rồi mở `http://127.0.0.1:4545`. Chỉ nghe ở `127.0.0.1` — máy khác trong mạng không vào được.

---

## Ba nút

Chưa có tên miền riêng, nên `main` (`thuexenhanh.pages.dev`) là bản duy nhất khách thấy. **Không còn bước dev.**

| Nút | Làm gì |
|---|---|
| **Quét** (vòng tròn xanh trên thanh điều hướng) | Soi toàn bộ app rồi báo cáo. **Không đẩy gì.** Dùng để xem tình hình. |
| **Quét & đẩy lên main** | Quét. Có lỗi chặn thì **dừng**, hiện ô ghim đỏ. Sạch thì hỏi xác nhận một lần, rồi commit đúng file anh tick và `git push origin HEAD:main`. |
| **Mở web thật** | Mở `thuexenhanh.pages.dev`. Tô vàng ⚠ nếu web đó đang chạy code khác repo này. |

**Chốt ở máy chủ, không chỉ ở giao diện:** `main` chỉ nhận đúng commit mà lần quét gần nhất đã xác nhận sạch.
Gọi API mà không kèm mã commit lúc quét, hoặc kèm mã chưa quét, hoặc lần quét còn lỗi chặn, hoặc công cụ vừa
khởi động lại (mất ghi nhớ lần quét) thì đều bị từ chối. HEAD đổi giữa lúc quét và lúc đẩy
(phiên chat khác vừa commit) cũng bị từ chối, bắt quét lại.

Lệnh `POST /api/push-dev` vẫn còn để dùng khi cần, giao diện không còn nút cho nó.

**Lưu ý khi nhiều phiên cùng sửa repo:** lần quét build **cả cây làm việc**, kể cả file người khác đang sửa dở
chưa commit. File của họ hỏng cú pháp thì quét báo "Build hỏng" và chặn đẩy, dù commit của anh vẫn ổn.
Chờ họ sửa xong (hoặc commit xong) rồi quét lại. Công cụ không tự gạt file của người khác ra khỏi lần build.

## Ba tab

| Tab | Có gì |
|---|---|
| **Tổng quan** | 4 thẻ chỉ số (tổng code · JS lần đầu · chưa commit · build), biểu đồ cột dòng code theo module, vành khuyên phân bổ code trong `src/`, và khối so với lần quét trước |
| **Module** | Bảng đầy đủ: file, dòng, dung lượng, thay đổi từng module. Dòng tô xanh là module có code chưa commit |
| **Thay đổi** | Danh sách file có ô tick để chọn cái nào được commit, ô lời nhắn, và các cảnh báo vàng |

Ô ghim lỗi dính ở đầu trang, hiện ở cả ba tab.

Hai con số hay bị hỏi: thẻ **Tổng code** đếm cả `src/` + `contracts/` + `supabase/`; vành khuyên **chỉ đếm `src/`** nên nhỏ hơn. Đã ghi rõ trên giao diện.

---

## Hai luật an toàn nằm trong code, đừng gỡ

**1. Không bao giờ `git add -A`.**
Chỉ stage đúng đường dẫn anh tick trên giao diện. Nhiều luồng chat sửa repo song song — `git add -A` nuốt luôn việc dở dang của luồng khác.

**2. Không bao giờ đổi nhánh.**
Đẩy bằng `git push origin HEAD:<nhánh>`, cây làm việc đứng yên. `git checkout` giữa lúc luồng chat khác đang sửa file là hỏng việc.

Thêm một chốt: trước khi commit, công cụ so HEAD hiện tại với HEAD lúc quét. Lệch nhau là luồng khác vừa commit → **từ chối đẩy**, bắt quét lại.

---

## Lỗi chặn (đỏ — không cho đẩy)

| Mã | Bắt cái gì | Luật |
|---|---|---|
| `build-hong` | `npm run build` không chạy | CLAUDE.md §2.3 |
| `lo-key` | JWT thật trong file git theo dõi | 13-deploy §A1 |
| `env-theo-doi` | File `.env` bị git theo dõi | 13-deploy §A1 |
| `service-role-vite` | `service_role` đặt vào biến `VITE_*` | 13-deploy §B3 |
| `khoa-firebase` | Khoá Firebase `AIza...` khi repo public **và khoá chưa lên GitHub** | CLAUDE.md §9 |
| `thieu-redirects` | Thiếu `dist/_redirects` → F5 ra 404 | 13-deploy §B4 |
| `thieu-headers` | Thiếu `dist/_headers` | 13-deploy §B4 |
| `vuot-ngan-sach` | JS lần đầu > 150 KB gzip | HIEU-NANG §0 |
| `tailwind` | Có dấu vết TailwindCSS | CLAUDE.md §1.3 |
| `lucide-ca-goi` | `import * from 'lucide-react'` | CLAUDE.md §1.4 |
| `app-jsx-dai` | `App.jsx` > 200 dòng | CLAUDE.md §4 |
| `xung-dot` | Còn dấu `<<<<<<<` trong file | — |

Mỗi lỗi có nút **Copy để sửa** — chép ra văn bản dán thẳng vào luồng chat Claude, đã kèm tên file và điều luật bị vi phạm.

## Cảnh báo (vàng — vẫn cho đẩy)

Mã màu viết cứng · `select("*")` · `.range()` (OFFSET) · `<img>` thiếu width/height · `console.log` · TODO/FIXME · khoá Firebase khi repo đã private.

## Public hay private

Mỗi lần quét, công cụ hỏi GitHub API xem repo đang public hay private rồi hiện lên chip đầu trang. Trạng thái này quyết định mức độ của `khoa-firebase`:

| Repo | Khoá đã lên GitHub? | Mức |
|---|---|---|
| public | **chưa** | **chặn** — chặn bây giờ là còn ngăn kịp |
| public | rồi | cảnh báo — chặn không thu hồi được gì nữa |
| private | — | cảnh báo — vẫn nên tắt dự án Firebase cũ |
| không rõ (mất mạng) | — | **chặn** — không kiểm được thì không cho qua |

**Luật chung của mọi phép chặn trong công cụ này: chỉ chặn khi chặn còn cứu được.**
Chặn một việc đã rồi không bảo vệ được gì, chỉ tập cho người dùng thói quen bỏ qua
cảnh báo — rồi lần sau có lỗi thật cũng bỏ qua nốt.

Để biết khoá đã lộ chưa, công cụ tải thử chính file đó qua `raw.githubusercontent.com`
ở các nhánh `main` / `master` / `dev`.

---

## Chưa làm được

- **Chưa có remote `origin`** thì hai nút đẩy bị khoá. Chạy `git remote add origin <url>` trước.
- Công cụ **không kiểm tra RLS**. Bốn gạch RLS ở `DEPLOY.md` mục 4 vẫn phải thử tay trước khi đưa link cho người thật.
- Không chạy Lighthouse. Nó cân gói JS bằng gzip thật, không đo LCP/INP.

## File trạng thái

`.state.json` (lần đẩy `main` / `dev` gần nhất, ghi riêng từng nhánh) và `.snapshot.json` (mốc so sánh "code nào mới") nằm cùng thư mục, đã gitignore. Xoá đi thì lần quét sau tính là lần đầu.
