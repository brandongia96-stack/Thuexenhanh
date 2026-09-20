# Luồng 13 — Triển khai (GitHub + Cloudflare)

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/13-deploy.md rồi bắt đầu.`

**Phụ thuộc:** 01 (khung chạy được `npm run build`) · **Chặn:** không
**Model đề xuất:** Sonnet 5

---

## Mục tiêu

Đẩy code lên GitHub private, nối Cloudflare Pages, mỗi lần push là tự build và lên mạng. Kèm bản xem trước cho từng nhánh.

Kiến trúc: **Vite SPA tĩnh** → `dist/` → Cloudflare Pages. Không có server riêng, Supabase lo phần backend.

---

## Phần A — GitHub

### A1. Kiểm tra trước khi push (BẮT BUỘC, làm đủ)

```bash
git ls-files | xargs grep -lE "(SUPABASE_SERVICE|service_role|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9)" || echo "SACH - khong co secret"
git ls-files | grep -E "\.env$|\.env\." || echo "SACH - khong co file .env"
git ls-files | grep -E "\.rar$|node_modules|^dist/" || echo "SACH - khong co file rac"
git count-objects -vH | grep size-pack
```

Bất kỳ dòng nào ra kết quả bất thường → **dừng lại, báo anh**. Secret đã push lên GitHub coi như đã lộ, đổi key chứ không xoá commit là xong.

### A2. Dọn trước khi push

- `thu-luong-02.html` ở thư mục gốc là file thử — xoá hoặc chuyển vào `_scratch/` rồi thêm vào `.gitignore`. Để nguyên là nó lên mạng thật.
- `Web thue xe/` (code v0.1 đóng băng) **vẫn giữ trong repo** để tham chiếu — nó không nằm trong `dist/` nên không ảnh hưởng bản deploy.

### A3. Tạo repo và đẩy lên

Anh tự tạo repo **private** trên github.com (đừng tick thêm README/gitignore/license), rồi đưa URL cho luồng này chạy:

```bash
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

Nếu có `gh` CLI thì dùng `gh repo create <ten> --private --source=. --push`.

---

## Phần B — Cloudflare Pages

### B1. Nối repo

Cloudflare Dashboard → **Workers & Pages** → tạo ứng dụng mới → **Pages** → nối GitHub → chọn repo.

> Giao diện Cloudflare hay đổi. Mục nào không thấy đúng tên thì **tìm theo nghĩa**, đừng đoán bừa, và đừng bịa đường dẫn menu trong báo cáo.

### B2. Thiết lập build

| Mục | Giá trị |
|---|---|
| Framework preset | Vite (hoặc None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (để trống) |
| Production branch | `main` |
| Node version | đặt biến `NODE_VERSION` = `20` (hoặc `22`) |

### B3. Biến môi trường

Đặt **cho cả Production và Preview**:

```
VITE_SUPABASE_URL        = https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY   = <anon key>
VITE_APP_ENV             = production   (Preview để là: preview)
```

⚠️ **Chỉ dùng `anon` key.** `service_role` key tuyệt đối không được vào build — Vite nhúng thẳng mọi biến `VITE_*` vào file JS công khai, ai cũng đọc được.

Anon key lộ ra ngoài là **bình thường và đúng thiết kế** — nhưng chỉ an toàn khi **RLS đã bật đủ**. Xem Phần E.

### B4. Hai file bắt buộc trong `public/`

Thư mục `public/` **chưa tồn tại**, phải tạo.

**`public/_redirects`** — không có file này thì mọi đường dẫn sâu (`/xe/CAR-123`) F5 sẽ ra **404**, vì react-router chạy phía client:

```
/*    /index.html   200
```

**`public/_headers`** — cache ảnh và asset, khớp `HIEU-NANG.md` mục 5:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

Vite tự chép `public/` sang `dist/` lúc build. Kiểm tra sau khi build:

```bash
npm run build && ls dist/_redirects dist/_headers
```

---

## Phần C — Cập nhật Supabase (quên là đăng nhập hỏng)

Sau khi có tên miền Cloudflare, vào Supabase → **Authentication → URL Configuration**:

- **Site URL**: tên miền production
- **Redirect URLs**: thêm cả ba dạng
  - `https://<tenmien>/**`
  - `https://<repo>.pages.dev/**`
  - `https://*.<repo>.pages.dev/**` ← bản xem trước theo nhánh
  - `http://localhost:5173/**` ← giữ để dev

Và trong **Google Cloud Console** (OAuth client): thêm đúng các origin đó vào *Authorized JavaScript origins* + *Authorized redirect URIs*.

**Bỏ bước này thì đăng nhập Google chạy ở máy nhưng chết trên production.** Đây là lỗi hay gặp nhất.

---

## Phần D — Tên miền riêng

1. Mua tên miền (`.vn` qua nhà đăng ký trong nước, hoặc `.com` mua thẳng trên Cloudflare).
2. Trỏ nameserver về Cloudflare.
3. Pages → **Custom domains** → thêm tên miền. SSL Cloudflare tự cấp.
4. Bật **Always Use HTTPS**.

---

## Phần E — 🔴 Chặn cứng trước khi cho người thật vào

**Không được công bố tên miền cho bất kỳ ai khi chưa kiểm tra RLS.**

Anon key nằm công khai trong file JS. Ai cũng mở console gọi thẳng Supabase được. Nếu RLS hở thì:
- xoá được tin của người khác
- tự set `is_verified = true`
- tự cộng token vào ví

Chạy checklist RLS ở `supabase/README.md` (luồng 01 đã viết) và **thử thật** bằng cách gọi API với anon key:

- [ ] Sửa/xoá tin của người khác → **bị từ chối**
- [ ] Ghi `listings.is_verified` từ client → **bị từ chối**
- [ ] Ghi thẳng `wallets` / `wallet_transactions` → **bị từ chối**
- [ ] Đọc bảng `otp_codes`, `admin_actions` → **bị từ chối**

Chưa đạt đủ 4 gạch → deploy cứ deploy, nhưng **chưa được đưa link cho ai**.

---

## Tiêu chí hoàn thành

- [ ] Repo private trên GitHub, không lọt secret, không lọt `.rar`/`node_modules`/`dist`
- [ ] `public/_redirects` + `public/_headers` có mặt trong `dist/` sau khi build
- [ ] Cloudflare Pages build xanh, mở được trang chủ
- [ ] F5 ở một đường dẫn sâu **không ra 404**
- [ ] Đăng nhập Google chạy được **trên tên miền production**
- [ ] Push một commit lên `main` → tự deploy lại
- [ ] Mở nhánh phụ → có link xem trước riêng
- [ ] Lighthouse mobile trên bản production ≥ 90 (`HIEU-NANG.md` mục 0)
- [ ] 4 gạch RLS ở Phần E đã thử thật
- [ ] Ghi một dòng vào `CHANGELOG.md`

---

## Cấm

- Cấm đưa `service_role` key vào biến `VITE_*` dưới mọi hình thức.
- Cấm commit file `.env`.
- Cấm đưa link cho người thật khi chưa qua Phần E.
- Cấm đổi `vite.config.js`, `package.json`, hay code trong `src/` — luồng này **chỉ** lo hạ tầng. Cần sửa code → dừng, báo anh.
- Cấm bịa các bước bấm trong dashboard Cloudflare/Supabase nếu không chắc — nói rõ chỗ nào anh phải tự làm bằng tay.
