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

| Nút | Làm gì |
|---|---|
| **Quét** | Soi toàn bộ app rồi báo cáo. **Không đẩy gì.** Dùng để xem tình hình. |
| **Quét & đẩy lên dev** | Quét lại. Sạch thì commit đúng file anh tick rồi `git push origin HEAD:dev`. Có lỗi thì **dừng**, hiện ô ghim đỏ. |
| **Đẩy lên main** | Chỉ mở sau khi đẩy dev xanh. Đẩy **đúng commit đó** lên `main` — nhánh Cloudflare build ra production. |

Nút main tự khoá lại nếu HEAD đổi sau lần đẩy dev. Main chỉ nhận commit đã qua kiểm tra, không nhận commit lạ.

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
| `khoa-firebase` | Khoá Firebase `AIza...` **khi repo đang public** | CLAUDE.md §9 |
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

| Repo | Khoá Firebase v0.1 |
|---|---|
| public | **chặn** — ai cũng đọc được khoá, mà v0.1 không có Firestore rules |
| private | cảnh báo — vẫn nên tắt dự án Firebase cũ |
| không rõ (mất mạng) | cảnh báo, nói rõ là không kiểm tra được |

---

## Chưa làm được

- **Chưa có remote `origin`** thì hai nút đẩy bị khoá. Chạy `git remote add origin <url>` trước.
- Công cụ **không kiểm tra RLS**. Bốn gạch RLS ở `DEPLOY.md` mục 4 vẫn phải thử tay trước khi đưa link cho người thật.
- Không chạy Lighthouse. Nó cân gói JS bằng gzip thật, không đo LCP/INP.

## File trạng thái

`.state.json` (lần đẩy dev gần nhất) và `.snapshot.json` (mốc so sánh "code nào mới") nằm cùng thư mục, đã gitignore. Xoá đi thì lần quét sau tính là lần đầu.
