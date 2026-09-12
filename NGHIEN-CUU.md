# Nghiên cứu dự án "Thuexenhanh" — hiện trạng & mô hình kinh doanh

Ngày: 2026-09-12. Nguồn: giải nén `Web thue xe.rar` (đã bỏ `node_modules`).

---

## 1. Hiện trạng code

### Stack
- React 19 + Vite 7, CSS thuần (`src/styles.css`, 43KB), icon `lucide-react`.
- Firebase (Auth Google + Firestore + Storage) — `src/firebase.js`, project `thuexenhanh`.
- `browser-image-compression` để nén ảnh phía client.
- `vite-plugin-singlefile` → build ra `preview_offline.html` (1 file HTML duy nhất, double-click mở được).
- Deploy: Netlify (`netlify.toml`).

### Cấu trúc
Toàn bộ app nằm trong **1 file `src/App.jsx` — 131.493 ký tự, ~2.900 dòng, 40+ component**. Không có `src/components/`, không router, không state management. Đây là vấn đề bảo trì lớn nhất về mặt kỹ thuật.

Các màn hình chính:
- `LoginScreen` — Google login → chọn vai trò (Chủ xe / Khách thuê) → lưu vào Firestore `users/{uid}`. Có nút "Bỏ qua đăng nhập, xem thử" (guest mode chạy localStorage + `seedCars`).
- `Overview` — lưới xe + tìm kiếm + bộ lọc thông minh (`inferSmartFilters` đoán filter từ câu tìm kiếm) + chips.
- `CarDetailModal` — thông số, giá, đánh giá (đang **hardcode 2 comment giả** và "5.0 sao" giả).
- `AddCarForm` — form đăng xe, chia gói Cơ bản / Tích Xanh.
- `AccountSettingsScreen`, `MapModal`, `BlockedDatesManager` (lịch chặn ngày), `DateTimePickerModal`, `ImageUploadOptimizer`.

### Mô hình dữ liệu xe
Nested: `basicInfo` / `technicalInfo` / `rentalInfo` / `documents` / `ownerInfo` / `descriptions` / `status` / `images`. Có sẵn DB 27 hãng xe + model, 39 tỉnh thành + quận/huyện của 5 TP lớn.

### Luồng doanh thu đang có trong code
| | Gói Cơ Bản | Gói Tích Xanh |
|---|---|---|
| Giá | Miễn phí | 39K/1 tháng · 99K/3 tháng · 199K vĩnh viễn |
| Số trường | 5 nhóm rút gọn (~11 trường) | Đầy đủ (kỹ thuật, giấy tờ, giới hạn km, Zalo) |
| Đặc quyền | — | Huy hiệu tích xanh, viền thẻ nổi bật, lịch chặn ngày, (gói vĩnh viễn) ưu tiên top tìm kiếm |

Thanh toán: `UpgradeModal` hiện **QR tĩnh từ api.qrserver.com** (chỉ encode chuỗi `ThanhToanGoiTichXanh_1m` — **không phải QR ngân hàng thật, quét không ra tiền**), rồi user bấm "Tôi đã thanh toán" → mở `mailto:admin@miotofleet.com`. Kích hoạt thủ công 100%.

### Luồng "kết nối trực tiếp, không hoa hồng" — đã có
`CarDetailModal` → nút **Liên hệ** (3 bước: Liên hệ → hiện SĐT → Gọi điện / Nhắn Zalo `zalo.me/{sdt}`). Đúng định hướng anh muốn: app chỉ là chỗ trưng bày, giao dịch hai bên tự lo.

---

## 2. Lỗi phải sửa trước khi làm gì khác

**`src/App.jsx` hiện tại KHÔNG build được.** Ba lỗi cứng:

1. **`src/App.jsx:803-804`** — khai báo trùng:
   ```js
   const [editingId, setEditingId] = useState(null);
   const [editingId, setEditingId] = useState(null);   // ← SyntaxError
   ```
2. **`src/App.jsx:1034`** — dùng `<User size={17} />` nhưng import chỉ có `UserRoundCog` và `Users`, **không có `User`** → ReferenceError.
3. **`src/App.jsx:1044`** — truyền `onToggleFavorite={toggleFavorite}` nhưng **`toggleFavorite` chưa được định nghĩa** trong `App()` → ReferenceError.

Hệ quả phụ:
- `Overview` nhận prop `showFavorites` và dùng nó ở dòng 1182/1225, nhưng `App` **không bao giờ truyền** → tính năng "xe đã lưu" chết.
- `AccountSettingsScreen` khai báo nhận `cars` và `onToggleFavorite` nhưng `App` không truyền (dòng 1136).
- `preview_offline.html` và `dist/` đang là bản build **cũ hơn** src (thư mục `source-6a2a6cbb...` là snapshot đời trước, chưa có Firebase). Nên đừng tin `preview_offline.html` phản ánh code hiện tại.

Rủi ro khác: `firebaseConfig` nằm trong source (bình thường với Firebase web), **nhưng** toàn bộ an toàn phụ thuộc Firestore Security Rules — trong rar **không có `firestore.rules`**. Hiện `onSnapshot(collection(db,"cars"))` đọc tất cả, `setDoc`/`deleteDoc` gọi thẳng từ client: nếu rules đang để test mode thì **bất kỳ ai cũng xóa/sửa được xe của người khác**, và tự set `status.isVerified = true` để có tích xanh miễn phí.

---

## 3. Mô hình kinh doanh: nhận định thẳng

Mô hình anh chọn — **"chỉ thu tiền chủ xe khi đăng, không ăn hoa hồng"** — là mô hình **rao vặt (classifieds)**, giống Chợ Tốt Xe / Bất động sản, **không phải marketplace** như Mioto.

### Điểm mạnh thật
- Chủ xe cực ghét mất 15–20% hoa hồng cho Mioto → đây là điểm đau có thật, dễ bán.
- Không giữ tiền → không cần cổng thanh toán, không cần escrow, không cần giải quyết tranh chấp, không cần bảo hiểm chuyến đi. Vận hành nhẹ, một mình làm được.
- Không cần pháp lý phức tạp (không phải trung gian thanh toán).

### Điểm yếu chí mạng phải trả lời được
1. **Vòng luẩn quẩn gà–trứng lệch phía trả tiền.** Bên trả tiền (chủ xe) chỉ trả khi có khách. Khách chỉ đến khi có nhiều xe. Marketplace ăn hoa hồng có thể miễn phí đến khi có giao dịch; anh thì phải thu trước — tức **anh thu tiền trước khi chứng minh được giá trị**.
2. **Không có vòng lặp giữ chân.** Đã ăn hoa hồng thì mỗi chuyến là một lần chạm. Ở mô hình này, chủ xe trả 199K "vĩnh viễn" xong là anh **không còn doanh thu nào từ họ nữa mãi mãi**. Khách thuê thì gọi thẳng chủ xe lần sau, không mở app nữa.
3. **Doanh thu trần rất thấp.** Làm phép tính: 1.000 chủ xe trả trung bình 100K = **100 triệu**, phần lớn là one-time. Không đủ nuôi một người ở TP.HCM nếu tính chi phí marketing để có 1.000 chủ xe đó. Mức giá 39K/99K/199K hiện tại **quá rẻ để thành business**, nhưng lại **quá đắt để chủ xe trả khi chưa thấy khách**. Đây là vùng chết.
4. **Không có niềm tin.** Mioto bán sự an tâm (bảo hiểm, xác minh, tiền giữ hộ). App này bán một số điện thoại. Khách bị lừa một lần là mất luôn. Hệ thống đánh giá hiện đang **giả** (hardcode) — nếu để vậy khi ra mắt thì đó là nói dối người dùng, dính là mất sạch uy tín.
5. **Không đo được hiệu quả.** Chủ xe trả 99K sẽ hỏi "tôi được mấy cuộc gọi?". Hiện tại app **không đếm lượt xem, không đếm lượt bấm Liên hệ** → không có gì để chứng minh giá trị lúc gia hạn.

### Các hướng thu tiền đáng cân nhắc thay vì gói cố định
Không đề xuất chọn cái nào bây giờ — để dành cho phiên hỏi đáp:
- **Trả theo lead** (mỗi lượt khách bấm xem SĐT trừ 5–10K từ ví) — gắn tiền với giá trị thật, chủ xe dễ chấp nhận.
- **Trả theo vị trí hiển thị** (đấu giá top / đẩy tin như Chợ Tốt) — doanh thu lặp lại, tự co giãn theo cầu.
- **Thuê bao theo số xe** (chủ 5–20 xe là phân khúc trả tiền tốt nhất, không phải chủ 1 xe).
- **Bỏ hẳn "vĩnh viễn 199K"** — nó giết doanh thu định kỳ.

---

## 4. Việc nên làm, theo thứ tự

1. Sửa 3 lỗi build ở mục 2 (~30 phút) — bắt buộc, không có bước này thì không chạy được gì.
2. Viết `firestore.rules`: chỉ chủ sở hữu sửa/xóa xe của mình; `status.isVerified` **chỉ admin ghi được**.
3. Đếm **lượt xem xe** và **lượt bấm Liên hệ**, hiện cho chủ xe xem. Đây là nền móng cho mọi mô hình thu tiền.
4. Gỡ comment/đánh giá giả, thay bằng trạng thái rỗng trung thực ("Chưa có đánh giá").
5. Chốt lại mô hình giá sau khi hỏi đáp.
6. Tách `App.jsx` thành components — làm sau, khi mô hình đã chốt.

---

## 5. Skill hỏi đáp

Đã tạo `.claude/skills/grillme/SKILL.md`. Gõ `/grillme` — hoặc chỉ cần nhắn **"grill"** — để bắt đầu phiên chất vấn. Em hỏi từng câu một, xoáy vào chỗ yếu, không cho trả lời chung chung. Kết quả ghi vào `QUYET-DINH.md`.

Nguyên tắc chung của dự án đã được tổng hợp vào `CLAUDE.md` ở thư mục gốc.
