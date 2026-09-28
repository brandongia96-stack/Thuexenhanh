# Nghiên cứu: xe điện + hỗ trợ người thuê tối đa

28/09/2026 · luồng nền tảng · chưa có code, chỉ là định hướng + phân việc.

---

## 1. Vì sao xe điện là mũi nhọn đúng

- **Thị trường VN, xe điện gần như là VinFast** (VF 3, VF 5, VF 6, VF 7, VF 8, VF 9, VF e34). Một dòng thương hiệu → dữ liệu kỹ thuật chuẩn hoá được, lọc/so sánh dễ hơn hẳn xe xăng.
- **Nỗi sợ lớn nhất của người thuê xe điện là không biết**: đi được bao xa, sạc ở đâu, sạc mất tiền không, trả xe phải còn bao nhiêu pin. Mioto và các app lớn trả lời mấy câu này rất sơ sài. **Đây là chỗ mình thắng được.**
- **Có lợi cho chủ xe → đúng nguyên tắc 1.1**: chủ xe điện có "Free sạc" được lọc riêng, được hiện huy hiệu → nhiều lượt lấy số hơn → có lý do nạp token.

> ⚠️ Các chính sách sạc miễn phí của hãng (thời hạn, điều kiện, xe nào được) **thay đổi theo từng đợt**. Không ghi con số nào lên web khi chưa có nguồn + ngày. "Free sạc" trên app là **cam kết của chủ xe**, không phải của hãng.

---

## 2. Danh sách tính năng, xếp theo giá trị / công sức

### 🟢 Đợt 1 — làm ngay, rẻ, giá trị cao nhất

| # | Tính năng | Vì sao | Luồng |
|---|---|---|---|
| 1 | **Thông số xe điện có cấu trúc** | Không có dữ liệu thì mọi tính năng khác không làm được | 01 → 02 |
| 2 | **Bảng tính tổng tiền dưới mỗi xe** | Người thuê biết ngay tổng phải trả, chủ xe đỡ trả lời câu "hết bao nhiêu" | 05 |
| 3 | **Bộ lọc xe điện**: Free sạc, Miễn thế chấp, quãng đường tối thiểu | Tìm đúng xe trong 1 bước | 04 |
| 4 | **Tin nhắn soạn sẵn gửi chủ xe** (xe + ngày + báo giá) | Lead chất lượng hơn, chủ xe nhận là trả lời được ngay — hợp mô hình liên hệ trực tiếp | 05 |

### 🟡 Đợt 2

| # | Tính năng | Luồng |
|---|---|---|
| 5 | Khối "Thuê xe điện" trên trang chủ — số liệu **tính từ tin thật** | 14 |
| 6 | Trang SEO theo **dòng xe × thành phố** ("Thuê VinFast VF 5 Hà Nội") — cách Chợ Tốt ăn Google | 14 |
| 7 | "Lần đầu lái xe điện" — sạc thế nào, pin bao nhiêu thì nên sạc, trạm ở đâu | 12 |
| 8 | Checklist nhận/trả xe: ảnh 4 góc, % pin, số km — lưu trên máy khách | 05 |

### ⚪ Đợt 3 — để sau

| # | Tính năng | Ghi chú |
|---|---|---|
| 9 | Bản đồ trạm sạc gần điểm nhận xe | Mapbox **tải trễ**. Nguồn dữ liệu cần kiểm giấy phép + độ phủ VN trước |
| 10 | Ước tính lộ trình: "đi 300 km cần sạc mấy lần" | Cần dữ liệu trạm sạc ở mục 9 |
| 11 | Lưu tìm kiếm + báo khi có xe điện mới | Luồng 11 |

---

## 3. Dữ liệu cần thêm (luồng 01 quyết, luồng 02 nhập)

**Xe điện:**

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `ev_range_km` | int | quãng đường khi đầy pin, **theo chủ xe khai** |
| `battery_kwh` | numeric | dung lượng pin |
| `charge_policy` | enum | `mien_phi` · `mien_phi_gioi_han` · `tinh_theo_phan_tram` · `khach_tu_sac` |
| `free_charge_km` | int | dùng khi `mien_phi_gioi_han` |
| `charge_fee_per_pct` | int | VNĐ cho mỗi 1% pin khách dùng |
| `pickup_min_pct` | int | giao xe tối thiểu bao nhiêu % |
| `return_min_pct` | int | trả xe tối thiểu bao nhiêu % |
| `has_portable_charger` | bool | có kèm dây sạc di động |
| `battery_ownership` | enum | `mua` · `thue` — pin thuê có thể kèm giới hạn km, khách phải biết |

**Chi phí — đổi từ chữ sang số (để tính được):**

| Cột | Thay cho |
|---|---|
| `price_per_hour` | chưa có |
| `deposit_amount` | `deposit_note` (giữ note làm ghi chú thêm) |
| `collateral_required` + `collateral_note` | "thế chấp" (xe máy, giấy tờ) — **khác** với cọc tiền |
| `delivery_fee`, `delivery_radius_km` | `delivery_fee_note` |

**Giá tham chiếu** (xăng, điện) — bảng `reference_prices` có **nguồn + ngày áp dụng**, admin sửa được (luồng 10). Không hardcode.

`listing_card` chỉ thêm đúng thứ cần cho thẻ + lọc: `ev_range_km`, `charge_policy`, `collateral_required`. Giữ thẻ nhẹ.

---

## 4. Bảng tính tổng tiền — thiết kế

**Khách nhập:** giờ nhận, giờ trả, quãng đường dự kiến, có cần giao xe không.

```
Tiền thuê        3 ngày × 900.000đ                     2.700.000đ
Vượt km          (500 − 3×200) km → không vượt                  0đ
Sạc pin          Free sạc (chủ xe cam kết)                      0đ
Giao xe          trong bán kính 10 km                     100.000đ
─────────────────────────────────────────────────────────────────
TỔNG DỰ KIẾN                                           2.800.000đ

Cọc (hoàn lại khi trả xe)                              5.000.000đ
Thế chấp                                               Không cần

Ước tính theo thông tin chủ xe khai. Giá cuối cùng do anh/chị và chủ xe tự thoả thuận.
                                  [ Gửi báo giá này cho chủ xe qua Zalo ]
```

**Luật cứng:**

1. **Cọc hiện riêng, không cộng vào tổng** — cọc là tiền trả lại.
2. **Chủ xe không khai thì ẩn dòng đó**, không đoán, không hiện `0đ` giả.
3. **Giờ lẻ:** có `price_per_hour` thì tính theo giờ; không có thì làm tròn lên ngày — **ghi rõ quy tắc ngay dưới dòng**.
4. **Xe điện:** `% pin dùng = km ÷ (km/1%)`. Free sạc → 0. Giới hạn → chỉ tính phần vượt `free_charge_km`. Tính theo % → nhân `charge_fee_per_pct`.
5. **Xe xăng/dầu:** ước tính bằng `fuel_consumption` × giá tham chiếu, **ghi ngày của giá**.
6. **Dòng miễn trừ bắt buộc** (nguyên tắc 1.1 + 1.2). App **không thu tiền**, bảng tính chỉ là ước tính.
7. **Hàm tính thuần, chạy ở trình duyệt**, không gọi server → không tốn gì, không chậm (HIEU-NANG.md). Viết một lần, **export** cho luồng 04 dùng lại.

**"Gửi báo giá qua Zalo":** Zalo không nhận tin soạn sẵn qua đường dẫn một cách ổn định → **chép tin vào bộ nhớ tạm rồi mở Zalo**, báo khách "đã chép, dán vào khung chat". Bấm nút này vẫn phải đi qua `reveal-phone` → **vẫn đếm lead**.

---

## 5. Thứ tự làm

```
01 (CSDL)  →  02 (form nhập)  →  05 (bảng tính + tin nhắn)  ┐
                              →  04 (bộ lọc)                 ├→  14 (trang chủ + SEO)
                                                             ┘
```

01 phải xong trước — cả 4 luồng kia đọc cột mới.

---

## 6. Cấm

- Cấm ghi "rẻ hơn X%", "tiết kiệm X đồng" khi con số không tính từ tin thật.
- Cấm tự bịa chính sách sạc của hãng. "Free sạc" = chủ xe cam kết.
- Cấm cộng cọc vào tổng tiền.
- Cấm hiện `0đ` cho khoản chủ xe chưa khai.
- Cấm bảng tính gọi server.
