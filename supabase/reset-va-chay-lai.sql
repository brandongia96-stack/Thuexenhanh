-- ============================================================
-- ⚠️  XOÁ SẠCH SCHEMA public RỒI DỰNG LẠI TỪ ĐẦU
--
-- Chỉ chạy khi migration lỡ chạy dở dang và cần làm lại sạch sẽ.
-- Lệnh `drop schema public cascade` XOÁ MỌI BẢNG, MỌI DỮ LIỆU trong đó.
--
-- CHỈ AN TOÀN KHI: dự án mới tạo, chưa có tin đăng thật, chưa có ví nào có
-- tiền. Đã có dữ liệu thật rồi thì ĐỪNG chạy — sao lưu trước đã.
--
-- Tài khoản đăng nhập (auth.users) KHÔNG bị xoá: nó nằm ở schema `auth`,
-- không phải `public`. Nhưng hồ sơ trong `public.users` thì mất, nên sau khi
-- chạy lại migration anh cần đăng xuất rồi đăng nhập lại để trigger tạo lại
-- hồ sơ và ví.
-- ============================================================

drop schema public cascade;
create schema public;

-- Trả lại quyền mặc định của Supabase cho schema vừa tạo.
grant usage  on schema public to postgres, anon, authenticated, service_role;
grant all    on schema public to postgres, service_role;

comment on schema public is 'standard public schema';

do $$ begin
  raise notice 'Đã xoá sạch schema public. Giờ chạy lại chay-tat-ca.sql.';
end $$;
