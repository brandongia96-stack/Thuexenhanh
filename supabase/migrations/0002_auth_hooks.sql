-- Móc nối Supabase Auth -> bảng users/wallets/user_roles.
-- Chạy SAU 0001_init.sql.

-- Khi có người đăng nhập lần đầu: tạo hồ sơ + ví + vai trò 'khach'.
-- Chạy security definer vì auth.users nằm ngoài quyền của người dùng thường.
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.users (id, email, full_name, avatar_url, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.phone
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'khach')
  on conflict (user_id, role) do nothing;

  return new;
end $fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Chặn client tự nâng quyền cho mình.
-- Cột nhạy cảm chỉ đổi được bằng service_role (bỏ qua RLS) hoặc admin.
create or replace function guard_user_sensitive_cols()
returns trigger language plpgsql as $fn$
begin
  if auth.role() = 'service_role' or has_role('admin') then
    return new;
  end if;
  if new.verify_status is distinct from old.verify_status
     or new.verified_at is distinct from old.verified_at
     or new.phone_verified_at is distinct from old.phone_verified_at then
    raise exception 'Khong duoc tu sua trang thai xac minh';
  end if;
  return new;
end $fn$;

create trigger users_guard before update on users
  for each row execute function guard_user_sensitive_cols();

-- Tương tự cho tin đăng: client không được tự bật hiển thị hay tự tích xanh.
create or replace function guard_listing_sensitive_cols()
returns trigger language plpgsql as $fn$
begin
  if auth.role() = 'service_role' or has_role('admin') or has_role('kiem_duyet') then
    return new;
  end if;
  if new.is_verified is distinct from old.is_verified
     or new.published_at is distinct from old.published_at
     or new.expires_at is distinct from old.expires_at then
    raise exception 'Khong duoc tu sua trang thai hien thi cua tin';
  end if;
  -- Chủ xe chỉ được tự chuyển sang các trạng thái vô hại.
  if new.status is distinct from old.status
     and new.status not in ('nhap', 'an', 'cho_duyet') then
    raise exception 'Khong duoc tu chuyen tin sang trang thai %', new.status;
  end if;
  return new;
end $fn$;

create trigger listings_guard before update on listings
  for each row execute function guard_listing_sensitive_cols();

-- Ghi nhật ký vòng đời tin mỗi lần đổi trạng thái.
create or replace function log_listing_status()
returns trigger language plpgsql as $fn$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  insert into listing_events (listing_id, from_status, to_status, actor_id)
  values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status, auth.uid());
  return new;
end $fn$;

create trigger listings_log_status after insert or update on listings
  for each row execute function log_listing_status();
