---
name: thiet-ke-logo
description: Quy trình dựng logo / wordmark trên lưới trong Illustrator bằng ExtendScript (luồng 15 Designer) — đơn vị lưới, dựng từ hình cơ bản, gộp shape, chỉnh thị giác, thử ở cỡ nhỏ, xuất file. Dùng khi làm logo, icon app, wordmark, hoặc khi anh nhắn "logo", "dựng logo", "artboard logo".
---

# Dựng logo trên lưới — cách designer làm, bằng script

Logo tốt = **hình học chặt chẽ + chỉnh bằng mắt**. Lưới là điểm xuất phát; chỉnh thị
giác (optical correction) mới làm logo trông "đúng". Đừng dừng ở lưới.

## 1. Trước khi vẽ
1. Đọc brief (`design/BRIEF-LOGO.md`). Viết ra 1 câu: logo phải nói gì (vd. "nhanh, đáng tin, đơn giản").
2. Phân tích mẫu tham khảo: lấy **nguyên lý** (độ dày nét, bo góc, cách tách màu), **không
   chép hình**. Ghi rõ lấy gì từ mẫu nào.
3. Phác **ít nhất 3 hướng** khác nhau thật sự (không phải 3 màu của cùng một hình).

## 2. Đơn vị lưới
- Chọn **1 đơn vị U** (vd. U = độ dày nét chính). Mọi kích thước là bội số của U hoặc U/2:
  chiều cao chữ thường (x-height), bán kính bo, khoảng hở, khoảng cách chữ.
- Wordmark kiểu Booking.com: chữ thường, nét dày đều, đầu nét bo nhẹ, chữ tròn đầy đặn.
  Gợi ý khởi đầu: x-height = 5U, nét = 1U, chữ có phần đứng lên (h, t) cao 7U.
- **Dựng chữ từ hình cơ bản** (hình chữ nhật bo góc, hình tròn, cung ¼ vòng) — KHÔNG gõ font
  rồi outline. Wordmark "thuexenhanh" chỉ có **7 chữ khác nhau**: `t h u e x n a` → dựng 7
  chữ, ghép lại. `u` = `n` xoay 180°. `h` = `n` + phần đứng kéo cao.

## 3. Dựng trong Illustrator bằng ExtendScript
Chạy: `powershell -ExecutionPolicy Bypass -File scripts\adobe\chay.ps1 -App ai -Script design\script\<ten>.jsx`

- Đơn vị script là **point**. Gốc toạ độ: `y` tăng lên trên; artboard tạo bằng
  `doc.artboards.add([trai, tren, phai, duoi])`.
- Tách lớp: `Luoi` (lưới + guide, khoá lại), `Dung hinh` (shape gốc), `Logo` (bản gộp cuối).
- Hình cơ bản: `pathItems.rectangle(top, left, w, h)`, `roundedRectangle(top, left, w, h, rx, ry)`,
  `ellipse(top, left, w, h)`. Nét bo đầu: vẽ đường + `strokeCap = StrokeCap.ROUNDENDCAP`.
- Gộp shape (Pathfinder Unite): chọn nhóm rồi
  `app.executeMenuCommand('Live Pathfinder Add'); app.executeMenuCommand('expandStyle');`
- Nét → vùng tô (Outline Stroke): `app.executeMenuCommand('OffsetPath v22');`
  ✅ Đã thử thật trên Illustrator 2022 (26.5) ngày 17/10: Outline Stroke cho ra `PathItem`
  tô kín; Unite + expandStyle cho ra **một `GroupItem`** bọc hình đã gộp → bỏ nhóm thêm
  (`app.executeMenuCommand('ungroup')`) nếu cần một path. Mẫu: `design/script/_thu-pathfinder.jsx`.
- Guide lưới: tạo `pathItems` rồi đặt `guides = true`, cho vào lớp `Luoi`.
- Màu: dùng `RGBColor` với đúng mã HEX trong brief; khi chốt thì tạo **swatch toàn cục** có tên.
- Kết thúc: lưu `.ai` vào `design/nguon/`, xuất ảnh vào `design/xuat/`. File tạm luôn đóng bằng
  `SaveOptions.DONOTSAVECHANGES`.

## 4. Chỉnh thị giác (bắt buộc, sau lưới)
- **Overshoot:** chữ tròn (o, e, a, đường cong của n) nhô quá đường cơ sở và đường x-height
  khoảng **1,5–3% x-height**, nếu không trông nhỏ hơn chữ vuông.
- **Nét ngang mỏng hơn nét đứng** một chút (~90–95%) — cùng độ dày thì nét ngang trông dày hơn.
- **Chỗ nối vòm** (n, h, u): làm mảnh dần chỗ nối vào thân đứng, tránh "cục" đen.
- **Khoảng cách chữ theo mắt**, không theo số: cặp tròn–tròn (`e a`) sát hơn cặp đứng–đứng (`n h`).
- **Màu sáng trông nhỏ hơn màu đậm:** phần chữ màu sáng có thể cần dày hơn chút để cân.
- Sau khi chỉnh, **vẽ lại lưới dựng hình** (construction grid) trên bản cuối để trình bày.

## 5. Thử ở cỡ nhỏ (mới biết logo sống hay chết)
- Xuất icon ở **16, 24, 32, 48 px** và wordmark cao **20 px, 32 px**. Đọc lại các ảnh đó.
  Vòm/khoảng trống của chữ n ở 16 px còn nhìn ra không? Không ra → tăng khoảng hở.
- Thử **1 màu** (đen, trắng) — logo phải đứng được khi không có màu.
- Thử trên nền xanh đậm, nền trắng, nền ảnh.

## 6. Trình bày & xuất
- Mỗi phương án 1 artboard, cùng bố cục để so sánh công bằng.
- Xuất PNG từng artboard (`ExportOptionsPNG24`, `artBoardClipping = true`, đặt
  `doc.artboards.setActiveArtboardIndex(i)` trước khi xuất) + SVG cho logo đã chốt.
- **Đọc lại từng ảnh xuất** trước khi đưa anh.

## 7. Cấm
- Chép hình logo khác (kể cả "sửa nhẹ"): Booking, Mioto, các mẫu anh gửi chỉ để học nguyên lý.
- Hiệu ứng: gradient nặng, bóng đổ, 3D, viền — logo phải phẳng, in được 1 màu.
- Chữ font chưa có giấy phép thương mại. Wordmark tự dựng từ hình thì không vướng.
