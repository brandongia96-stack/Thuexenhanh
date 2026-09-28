# Sơ đồ hệ thống — ai nối vào đâu

Cập nhật **28/09/2026**. Mọi con số dưới đây đều **đã kiểm chứng**, không phải nhớ lại.

---

## 1. Toàn cảnh

```
        MÁY ANH                    GITHUB                    CLOUDFLARE PAGES
    ┌──────────────┐        ┌──────────────────┐        ┌────────────────────┐
    │ thư mục      │  push  │ brandongia96-    │  build │ project            │
    │ Webthuexe-   │ ─────► │ stack/           │ ─────► │ thuexenhanh        │
    │ Claude       │        │ Thuexenhanh      │        │                    │
    │              │        │                  │        │ nhánh SX: main     │
    │ nhánh: main  │        │  ├─ main         │        │                    │
    └──────────────┘        │  └─ dev          │        └─────────┬──────────┘
                            └──────────────────┘                  │
                                                         ┌────────┴────────┐
                                                         ▼                 ▼
                                          thuexenhanh.pages.dev   dev.thuexenhanh.pages.dev
                                             (bản chạy thật)         (BẢN CŨ, xem mục 4)
                                                         │
                                                         ▼
                                              ┌────────────────────┐
                                              │ SUPABASE           │
                                              │ nxwywykhlkdhofgn.. │
                                              │ CSDL + đăng nhập   │
                                              └────────────────────┘
```

**Ba tầng, ba việc khác nhau — không thay thế nhau:**

| Tầng | Là gì | Giữ cái gì |
|---|---|---|
| **GitHub** | kho mã nguồn | code |
| **Cloudflare Pages** | máy chủ web | HTML/JS/CSS, tên miền |
| **Supabase** | cơ sở dữ liệu | xe, người dùng, ví token, đăng nhập |

---

## 2. GitHub — có HAI repo, đừng nhầm

| Repo | Vai trò | Nhánh |
|---|---|---|
| **`brandongia96-stack/Thuexenhanh`** | ✅ **REPO CHÍNH** — nơi duy nhất được phát triển | `main`, `dev` |
| `giale-lab/Thuexenhanh` | ⛔ repo giao diện cũ, **đã ngừng phát triển** | `main`, `dev` |

Bản sao chỉ-đọc của repo giao diện nằm ở `_archive/giao-dien-dev/` — dùng để bê giao diện, không phát triển tiếp.

---

## 3. ⚠️ Chỗ đang loạn: code đẩy vào `dev`, Cloudflare lại build `main`

Trạng thái đo được ngày 28/09:

| | Commit | Ghi chú |
|---|---|---|
| Máy anh, nhánh `main` | `db93aa7` | mới nhất |
| GitHub `origin/dev` | `db93aa7` | **khớp máy anh** |
| GitHub `origin/main` | `73fc84a` | **thiếu 2 commit** |
| Cloudflare build từ | nhánh **`main`** | → bản chạy thật đang cũ |

**Vì sao:** công cụ `tools/deploy-ui` đẩy bằng `git push HEAD:dev` — tức là lấy nhánh đang đứng (local `main`) đẩy vào nhánh `dev` trên GitHub. Nên nhánh `main` trên GitHub không bao giờ được cập nhật, mà Cloudflare lại chỉ build `main`.

**Hệ quả:** anh commit xong, đẩy xong, nhưng `thuexenhanh.pages.dev` không đổi gì.

### Cách sửa — chọn MỘT quy ước rồi theo

**Cách A (đơn giản nhất, khuyến nghị):** đổi nhánh sản xuất của Cloudflare sang `dev`.
Cloudflare → Settings → **Branch control** → Production branch = `dev`.
Ưu: không phải đổi công cụ. Nhược: tên "dev" làm nhánh chạy thật thì hơi ngược đời.

**Cách B (đúng quy ước hơn):** giữ Cloudflare build `main`, sửa công cụ đẩy sang `main`.
Rồi `dev` thành nhánh thử nghiệm thật sự.

> Chưa chốt cách nào. Cần quyết trước khi làm tiếp, không thì mỗi lần deploy lại rối.

---

## 4. Hai tên miền phụ — cái nào là cái nào

| Địa chỉ | Thực tế đang phục vụ | Bằng chứng |
|---|---|---|
| **`thuexenhanh.pages.dev`** | ✅ **bản chạy thật** — v0.2 Supabase | title *"Thuexenhanh — Thuê xe tự lái, liên hệ thẳng chủ xe"*, 1 file JS |
| `dev.thuexenhanh.pages.dev` | ⛔ **bản build CŨ của repo `giale-lab`** (Firebase + Mapbox + Recharts) | title *"Thuê Xe Nhanh – Thuê xe tự lái siêu tốc"*, có `vendor-react`/`vendor-icons`, header `x-robots-tag: noindex` |

**`dev.` KHÔNG phải bản thử của repo chính.** Nó là xác của lần deploy trước, từ hồi Cloudflare còn nối repo khác. Nó vẫn còn vì alias nhánh giữ lại bản build cuối cùng thành công.

Giao diện đẹp anh hay xem chính là trang này — nó **không phản ánh** code hiện tại.

---

## 5. Supabase

| | |
|---|---|
| Project | `nxwywykhlkdhofgnmmpp.supabase.co` |
| Dữ liệu | **10 xe demo** (nạp 28/09 bằng `supabase/seed/demo-10-xe.sql`) |
| Đăng nhập | Google **đang bật** |
| ⚠️ Site URL | `localhost:3000` — **sai**, dự án chạy cổng `5173` → đăng nhập báo `bad_oauth_state` |

Nối vào web bằng 3 biến môi trường đặt ở **Cloudflare → Settings → Variables and secrets**:

```
VITE_SUPABASE_URL        https://nxwywykhlkdhofgnmmpp.supabase.co
VITE_SUPABASE_ANON_KEY   sb_publishable_…  ← ĐANG CẮT CỤT, phải dán đủ 46 ký tự
VITE_APP_ENV             production
```

> **Bẫy đã dính:** Cloudflare rút gọn giá trị dài khi hiển thị. Ai đó copy đúng cái dòng rút gọn rồi dán lại → key thành `sb_publishable_…`, Supabase trả `Invalid API key`, web trắng trơn.
> **Luật từ nay: kiểm giá trị biến bằng ĐỘ DÀI, không nhìn giao diện.**

Biến môi trường **chỉ ăn vào bản build mới** — sửa xong phải **Retry deployment**.

---

## 6. Ba lệnh tự kiểm

Anon key là khoá công khai, nằm sẵn trong file JS — dùng thoải mái để kiểm tra.

```bash
# 1. Web thật đang chạy bundle nào, có key đủ dài không
curl -s https://thuexenhanh.pages.dev/ | grep -oE '/assets/[^"]*\.js'
```
```bash
# 2. CSDL có bao nhiêu xe (đọc bằng đúng quyền khách vãng lai)
curl -s -I "https://nxwywykhlkdhofgnmmpp.supabase.co/rest/v1/listing_card?select=id" \
  -H "apikey: $(grep VITE_SUPABASE_ANON_KEY .env | cut -d= -f2)" \
  -H "Prefer: count=exact" -H "Range: 0-0" | grep -i content-range
```
```bash
# 3. Nhánh nào đang ở đâu
git fetch -q origin; git log --oneline -1 origin/main; git log --oneline -1 origin/dev; git log --oneline -1 HEAD
```

---

## 7. Việc còn treo

| # | Việc | Ai làm |
|---|---|---|
| 1 | Dán **đủ 46 ký tự** anon key vào Cloudflare (cả Production lẫn Preview) → Retry deployment | anh, 3 phút |
| 2 | **Chốt quy ước nhánh** — mục 3, cách A hay B | anh quyết |
| 3 | Sửa **Site URL + Redirect URLs** của Supabase (mục 5) | anh, 2 phút |
| 4 | Dọn alias `dev.` — cho build lại từ repo chính, hoặc xoá hẳn | luồng 13 |
| 5 | Gỡ 10 xe demo trước khi mở cho người thật (`xoa-demo-10-xe.sql`) | sau này |
