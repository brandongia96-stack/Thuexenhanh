-- ============================================================
-- ĐÃ GỘP VÀO HỢP ĐỒNG CHUNG — file này cố ý KHÔNG làm gì.
--
-- Bảng `user_consents` (luồng 12) nay nằm trong `contracts/schema.sql`,
-- nghĩa là nó đã được tạo từ `0001_init.sql`. Giữ file rỗng này để số thứ tự
-- migration không nhảy cóc, và để ai đọc lịch sử còn thấy nó đã đi đâu.
--
-- KHÔNG khôi phục nội dung cũ vào đây. Bản cũ tạo policy
-- `user_consents_select_own` KHÔNG có nhánh `has_role('admin')`; chạy lại nó
-- sau 0001 sẽ âm thầm siết mất quyền đọc của admin.
--
-- Cần sửa bảng này -> sửa `contracts/schema.sql` rồi chạy
-- `node scripts/gen-migrations.mjs` để sinh lại `0001_init.sql`.
-- ============================================================

select 1;
