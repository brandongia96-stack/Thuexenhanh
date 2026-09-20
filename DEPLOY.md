# DEPLOY — Thuexenhanh (GitHub + Cloudflare Pages)

> Luồng 13. Chi tiết lý do ở `LUONG-CHAT/13-deploy.md`. File này là **bảng việc thực thi**.

Kiến trúc: Vite SPA tĩnh → `dist/` → Cloudflare Pages. Không server riêng. Supabase lo backend.

---

## 0. Phần code đã xong (không phải làm lại)

| Việc | Trạng thái |
|---|---|
| Quét secret trước khi push | ✅ sạch — không có JWT, không có `.env`, không có `.rar`/`node_modules`/`dist` bị theo dõi. Repo 217 KB. |
| `public/_redirects` | ✅ `/* /index.html 200` — F5 ở `/xe/CAR-123` không ra 404 |
| `public/_headers` | ✅ cache asset 1 năm, `index.html` không cache, `nosniff` + `Referrer-Policy` |
| Hai file trên có mặt trong `dist/` sau build | ✅ đã kiểm tra bằng `npm run build && ls dist/_redirects dist/_headers` |
| `.nvmrc` = `20` | ✅ ghim Node cho Cloudflare build |
| `thu-luong-02.html` | ✅ chuyển vào `_scratch/` + gitignore, không lên mạng |
| Bundle không lọt secret | ✅ 0 chuỗi JWT, 0 chữ `service_role` trong `dist/` |

Kích thước gói lần đầu: **58,93 KB gzip** — trong ngân sách 150 KB của `HIEU-NANG.md`.

---

## 1. GitHub — anh làm bằng tay

1. Vào github.com → tạo repo **private**. **Không tick** README / .gitignore / license.
2. Đưa URL cho luồng chat, hoặc tự chạy:

```bash
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

Máy này **chưa cài `gh` CLI**, nên không tạo repo tự động được.

---

## 2. Cloudflare Pages — anh làm bằng tay

Dashboard → **Workers & Pages** → tạo ứng dụng mới → **Pages** → nối GitHub → chọn repo.

> Giao diện Cloudflare hay đổi tên mục. Tìm theo nghĩa, đừng tìm theo đúng chữ.

### Thiết lập build

| Mục | Giá trị |
|---|---|
| Framework preset | Vite (hoặc None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | để trống |
| Production branch | `main` |

Node version: repo đã có `.nvmrc` = `20`, Cloudflare tự đọc. Nếu build vẫn báo sai Node thì thêm biến `NODE_VERSION` = `20`.

### Biến môi trường — đặt cho **cả Production và Preview**

```
VITE_SUPABASE_URL        = https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY   = <anon key>
VITE_APP_ENV             = production      (Preview đặt là: preview)
```

🔴 **Chỉ `anon` key.** Vite nhúng thẳng mọi biến `VITE_*` vào file JS công khai. `service_role` vào đây là lộ toàn bộ CSDL.

Anon key lộ ra ngoài là **đúng thiết kế** — nhưng chỉ an toàn khi RLS bật đủ (mục 4).

---

## 3. Supabase + Google OAuth — quên là đăng nhập chết trên production

Supabase → **Authentication → URL Configuration**:

- **Site URL**: tên miền production
- **Redirect URLs**: thêm đủ bốn dạng
  ```
  https://<tenmien>/**
  https://<repo>.pages.dev/**
  https://*.<repo>.pages.dev/**
  http://localhost:5173/**
  ```

Google Cloud Console → OAuth client: thêm đúng các origin đó vào **Authorized JavaScript origins** và **Authorized redirect URIs**.

Đây là lỗi hay gặp nhất: đăng nhập chạy ở máy, chết trên production.

---

## 4. 🔴 CHẶN CỨNG — chưa qua mục này thì không đưa link cho ai

Anon key nằm công khai trong file JS. Ai cũng mở console gọi thẳng Supabase được.
Chạy checklist ở `supabase/README.md` và **thử thật** bằng anon key:

- [ ] Sửa/xoá tin của người khác → **bị từ chối**
- [ ] Ghi `listings.is_verified` từ client → **bị từ chối**
- [ ] Ghi thẳng `wallets` / `wallet_transactions` → **bị từ chối**
- [ ] Đọc `otp_codes`, `admin_actions` → **bị từ chối**

Chưa đủ 4 gạch: deploy cứ deploy, **nhưng không đưa link cho người thật.**

---

## 5. Tên miền riêng

1. Mua tên miền (`.vn` qua nhà đăng ký trong nước, `.com` mua thẳng trên Cloudflare).
2. Trỏ nameserver về Cloudflare.
3. Pages → **Custom domains** → thêm tên miền. SSL tự cấp.
4. Bật **Always Use HTTPS**.
5. Quay lại mục 3, thêm tên miền mới vào Supabase + Google OAuth.

---

## 6. Nghiệm thu sau khi lên mạng

- [ ] Cloudflare build xanh, mở được trang chủ
- [ ] F5 ở `/xe/CAR-123` **không ra 404**
- [ ] Đăng nhập Google chạy trên tên miền production
- [ ] Push một commit lên `main` → tự deploy lại
- [ ] Mở nhánh phụ → có link xem trước riêng
- [ ] Lighthouse mobile ≥ 90 (`HIEU-NANG.md` mục 0)
- [ ] 4 gạch RLS ở mục 4 đã thử thật
