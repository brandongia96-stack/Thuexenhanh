# Đối chiếu form đăng tin với mẫu `CarForm.jsx` (21/09/2026)

Mẫu: `_archive/giao-dien-dev/src/modules/Cars/CarForm.jsx` (923 dòng) + `core.js` (`getFieldGroups`, `validateCar`).
Đối chiếu **cấu trúc + trường + luật**, chưa đối chiếu điểm ảnh (mẫu không chạy được ở đây, CSS 3.142 dòng).

## Đã bê / đã có

| Mẫu | Form v0.2 |
|---|---|
| Hãng → dòng xe (đổi hãng thì xoá dòng) | ✅ `useFormDangTin.doiTruong` |
| Tỉnh → quận/huyện | ✅ |
| Năm, số chỗ, hộp số, nhiên liệu, màu, mức tiêu hao | ✅ (mẫu dùng khoảng chọn sẵn, v0.2 dùng số thật vì cột `fuel_consumption numeric`) |
| Giá ngày / tháng, giới hạn km, phí vượt km | ✅ |
| Lịch xe bận theo khoảng ngày + ghi chú | ✅ `LichChanNgay` |
| Tiện nghi + **Chọn tất cả** | ✅ (thêm 21/09) |
| Biển số: bắt buộc + kiểm dạng `51H12345` | ✅ (thêm 21/09) — bắt buộc **khi gửi duyệt**, nháp được để trống; server kiểm lại |
| Thanh nút dính đáy | ✅ |
| Upload ảnh + nén | ✅ và **hơn mẫu**: 4 bản WebP + blur base64 (mẫu chỉ nén 1 cỡ) |

## Cố ý KHÔNG bê (vi phạm CLAUDE.md §1.2 / §6)

| Trong mẫu | Vì sao bỏ |
|---|---|
| Gói "Tối ưu — TRẢ PHÍ", `isVerified: packageType === "premium"` | **Bán tích xanh.** Cấm. Tích xanh xét giấy tờ, miễn phí. |
| Gói 1 tháng 39K / 3 tháng 99K / **Vĩnh viễn 199K** | Giá cũ. Đã chốt 10 token/tháng, bỏ gói vĩnh viễn. |
| "Thu hút khách hàng gấp 3 lần" | Con số không có căn cứ. |
| Lịch xe là "đặc quyền Gói Tối ưu" | v0.2: hai gói cùng giá, lịch có ở gói Đầy đủ. |
| `verifyEmail`, `setDoc`, Firestore | Backend cũ. |

## Mẫu có, v0.2 CHƯA có — cần cột mới ở `contracts/schema.sql` (luồng 01)

Luồng 02 không tự thêm cột. Nếu anh muốn bê, cần luồng 01 thêm:

| Trường mẫu | Cột đề xuất | Ghi chú |
|---|---|---|
| Giá cuối tuần (`weekendPrice`) | `price_weekend int` | Chủ xe hay khai, hữu ích cho khách |
| Điều kiện thuê: đặt cọc / thế chấp xe máy / đối chiếu GPLX | `require_deposit`, `require_motorbike`, `require_license` (boolean) | Hiện chỉ có `deposit_note` dạng chữ |
| Có tài xế (`driverIncluded`) | `driver_included boolean` | |
| Giá theo giờ, phí rửa xe | `price_per_hour`, `cleaning_fee` | Ưu tiên thấp |
| Hệ dẫn động, dung tích động cơ, phiên bản | `drivetrain`, `engine`, `trim` | Ưu tiên thấp |
| Phí sạc pin, miễn phí sạc (xe điện) | `charge_fee`, `free_charge_km` | Chỉ với xe điện |
| Nhãn + giờ nhận/trả cho từng đợt bận | `tag`, `time_from`, `time_to` trong `listing_blocked_dates` | Hiện chỉ có `note` |
| Trạng thái Xe trống / Xe bận | — | Không cần cột: suy ra từ lịch xe bận |
| Chọn vị trí chính xác trên bản đồ (Mapbox) | `lat`, `lng` **đã có** trong schema | Thiếu **thư viện**: `mapbox-gl` 515 KB gzip chưa có trong `package.json`. Nếu bật: tải trễ, chỉ khi bấm "Chọn trên bản đồ" (đã chốt ở `DOC-TRUOC.md`) |

## Khác biệt nên biết

- **Kiểu xe:** mẫu dùng *Loại xe* = Sedan/SUV/MPV/Hatchback/Pickup/Minivan. v0.2 đang dùng `BODY_STYLES` trong `src/data/options.js` (Đô thị, Gia đình, Gầm cao…) — đây là **mục đích sử dụng** chứ không phải kiểu thân xe, dùng làm bộ lọc sẽ khó hiểu. Đề xuất luồng 01 đổi danh sách sang kiểu thân xe như mẫu. Chỉ `fieldGroups.js` đang dùng nó.
- **Tên chủ xe:** mẫu bắt nhập ở form; v0.2 lấy từ hồ sơ `users.full_name`, schema `listings` không có cột tên liên hệ.
- **Năm sản xuất:** mẫu cho từ 1990, v0.2 từ 2000 (`lib/validate.js`).
