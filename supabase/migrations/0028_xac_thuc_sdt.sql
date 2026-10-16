-- ============================================================
-- 0028 — Xác thực SĐT: KHÔNG có hàm RPC phía client.
-- (Đổi số từ 0026_xac_thuc_sdt.sql ngày 17/10 — trùng số, chưa từng chạy.)
--
-- Bản phiên trước tạo `xac_thuc_sdt_user(p_phone, p_code)` security definer
-- cho mọi người đã đăng nhập, nhận `p_code` nhưng KHÔNG kiểm mã → ai cũng tự
-- đánh dấu "đã xác thực" cho số bất kỳ (kể cả số của người khác). Bỏ hẳn.
--
-- Xác thực SĐT chỉ đi qua Edge Function `send-otp` + `verify-otp` (service_role,
-- so mã đã băm). Trigger guard_user_sensitive_cols vẫn chặn client tự ghi
-- phone_verified_at. Chạy lại được.
-- ============================================================

drop function if exists xac_thuc_sdt_user(text, text);
