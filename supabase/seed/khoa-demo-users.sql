-- ============================================================
-- KHOÁ 3 tài khoản demo có mật khẩu 123456 (tạo bởi demo-users.sql cũ).
--
-- Vì sao: file demo-users.sql đã nằm trên GitHub CÔNG KHAI, ghi rõ
--   admin123@test.com / 123456 — ai đọc được cũng đăng nhập được với
--   quyền admin (duyệt tin, tặng/thu hồi token, khoá người dùng).
-- Xoá file khỏi repo KHÔNG đủ: nó vẫn nằm trong lịch sử git. Phải khoá
-- chính tài khoản.
--
-- Cách chạy: Supabase → SQL Editor → New snippet → dán cả file → Run.
-- Chạy lại nhiều lần được. Không xoá cứng gì (ví vẫn giữ sổ).
-- ============================================================

begin;

-- 1. Đổi mật khẩu thành chuỗi ngẫu nhiên không ai biết + cấm đăng nhập vĩnh viễn
update auth.users
set encrypted_password = crypt(gen_random_uuid()::text, gen_salt('bf')),
    banned_until       = 'infinity'
where email in ('chuxe123@test.com', 'khachthue123@test.com', 'admin123@test.com');

-- 2. Đá văng mọi phiên đang đăng nhập
delete from auth.refresh_tokens
where user_id::uuid in (select id from auth.users
                        where email in ('chuxe123@test.com', 'khachthue123@test.com', 'admin123@test.com'));
delete from auth.sessions
where user_id in (select id from auth.users
                  where email in ('chuxe123@test.com', 'khachthue123@test.com', 'admin123@test.com'));

-- 3. Thu hồi vai trò (xoá mềm — has_role() đã lọc deleted_at is null)
update user_roles
set deleted_at = now()
where deleted_at is null
  and user_id in (select id from auth.users
                  where email in ('chuxe123@test.com', 'khachthue123@test.com', 'admin123@test.com'));

-- 4. Kiểm tra: phải ra 0 dòng vai trò còn hiệu lực
select u.email, r.role
from user_roles r join auth.users u on u.id = r.user_id
where r.deleted_at is null
  and u.email in ('chuxe123@test.com', 'khachthue123@test.com', 'admin123@test.com');

commit;
