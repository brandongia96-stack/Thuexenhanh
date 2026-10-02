-- ============================================================
-- DEMO USERS: Tạo 3 tài khoản ảo để test toàn bộ quy trình
--
-- File này tạo 3 tài khoản thật trong hệ thống auth với mật khẩu dễ nhớ,
-- giúp anh dễ dàng đăng xuất / đăng nhập để test luồng từ các góc nhìn khác nhau.
-- 
-- Cách chạy: Copy toàn bộ dán vào Supabase SQL Editor và Run.
-- ============================================================

begin;

-- Đảm bảo extension pgcrypto có sẵn để mã hoá mật khẩu
create extension if not exists pgcrypto;

-- 1. Tài khoản CHỦ XE (người đăng xe)
-- Email: chuxe123@test.com
-- Pass:  123456
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '11111111-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'chuxe123@test.com', crypt('123456', gen_salt('bf')), now(), '{"full_name": "Chủ Xe 123"}'::jsonb, now(), now()
) on conflict (id) do update set encrypted_password = crypt('123456', gen_salt('bf'));

-- 2. Tài khoản KHÁCH THUÊ (người đi thuê)
-- Email: khachthue123@test.com
-- Pass:  123456
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '22222222-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'khachthue123@test.com', crypt('123456', gen_salt('bf')), now(), '{"full_name": "Khách Thuê 123"}'::jsonb, now(), now()
) on conflict (id) do update set encrypted_password = crypt('123456', gen_salt('bf'));

-- 3. Tài khoản ADMIN (Quản trị viên)
-- Email: admin123@test.com
-- Pass:  123456
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '33333333-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'admin123@test.com', crypt('123456', gen_salt('bf')), now(), '{"full_name": "Admin Tối Cao"}'::jsonb, now(), now()
) on conflict (id) do update set encrypted_password = crypt('123456', gen_salt('bf'));

-- Cấp full quyền quản trị & duyệt bài cho admin123
insert into user_roles (user_id, role)
values 
  ('33333333-0000-4000-8000-000000000003', 'admin'),
  ('33333333-0000-4000-8000-000000000003', 'kiem_duyet')
on conflict do nothing;

-- 4. Tặng sẵn 1000 token cho Chủ xe để tiện test xuất bản xe
-- (Phải tặng qua hàm admin để lưu sổ sách đúng chuẩn, thay vì insert chay)
select set_config('request.jwt.claim.role', 'service_role', true);

insert into wallet_transactions (wallet_id, kind, amount, idem_key, note)
select id, 'tang', 1000, 'tang-test-chuxe123', 'Tặng token test'
from wallets where user_id = '11111111-0000-4000-8000-000000000001'
on conflict do nothing;

commit;
