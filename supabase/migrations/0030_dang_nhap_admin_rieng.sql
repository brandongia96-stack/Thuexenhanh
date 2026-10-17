-- ============================================================
-- 0030 — ĐĂNG NHẬP QUẢN TRỊ RIÊNG (luồng 10, anh yêu cầu 17/10)
--
-- Trước: ai có dòng user_roles 'admin'/'kiem_duyet' là vào được quản trị,
-- kể cả khi đăng nhập Google/email như người dùng thường.
-- Sau:  quyền quản trị CHỈ có hiệu lực khi
--   (1) tài khoản nằm trong `admin_accounts` (tài khoản quản trị riêng,
--       đăng nhập bằng tên + mật khẩu ở /admin), VÀ
--   (2) phiên đăng nhập hiện tại do Edge Function `admin-login` tạo ra
--       (có dòng trong `admin_sessions`), chưa Thoát, chưa quá 8 giờ.
-- Đăng nhập thẳng vào Supabase Auth bằng email của tài khoản quản trị (bỏ
-- qua /admin) cũng KHÔNG có quyền — phiên đó không có trong admin_sessions,
-- nên không lách được giới hạn đăng nhập sai.
--
-- ⚠️ CHẠY FILE NÀY LÀ GỠ QUYỀN tài khoản Google/email cũ đang có vai trò
-- admin/kiem_duyet (mục 7: xoá mềm, in email từng tài khoản bị gỡ). Anh đã
-- duyệt 17/10. Sau đó gắn tài khoản quản trị riêng bằng gan_tai_khoan_quan_tri.
--
-- MẬT KHẨU KHÔNG BAO GIỜ nằm trong file này hay bất kỳ file nào của repo.
-- Anh tự tạo user trong Supabase Dashboard → Authentication (Supabase Auth
-- tự băm mật khẩu), rồi gắn tên đăng nhập bằng `gan_tai_khoan_quan_tri`.
--
-- Không đụng `listings`, không đụng view `listing_card`.
-- Chạy lại được (if not exists / create or replace).
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. BẢNG
-- ─────────────────────────────────────────────

-- Tài khoản quản trị: tên đăng nhập ↔ user của Supabase Auth.
-- Email thật của user KHÔNG nằm ở đây và không nằm trong code: Edge Function
-- tra ra từ auth.users lúc đăng nhập.
create table if not exists admin_accounts (
  user_id    uuid primary key references users(id),
  username   text not null unique check (username ~ '^[a-z0-9._-]{3,32}$'),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Mọi lần thử đăng nhập quản trị. 'cho' = đang xử lý (tính như sai cho tới
-- khi được đánh dấu 'dung'), 'khoa' = bị từ chối vì đang tạm khoá (không
-- tính vào số lần sai — để lần khoá không tự kéo dài mãi).
create table if not exists admin_login_attempts (
  id         bigint generated always as identity primary key,
  username   text not null,
  ip         text not null,
  status     text not null default 'cho' check (status in ('cho','sai','dung','khoa')),
  created_at timestamptz not null default now()
);
create index if not exists admin_login_attempts_tg on admin_login_attempts (created_at);

-- Phiên quản trị hợp lệ. session_id = claim `session_id` trong JWT của
-- Supabase Auth (giữ nguyên khi refresh token), nên phiên sống đúng 8 giờ kể
-- từ lúc đăng nhập dù token được làm mới bao nhiêu lần.
create table if not exists admin_sessions (
  session_id uuid primary key,
  user_id    uuid not null references users(id),
  ip         text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table admin_accounts       enable row level security;
alter table admin_login_attempts enable row level security;
alter table admin_sessions       enable row level security;
-- Không policy nào: client không đọc/ghi được, chỉ hàm security definer + service_role.
revoke all on admin_accounts, admin_login_attempts, admin_sessions from anon, authenticated;

-- ─────────────────────────────────────────────
-- 2. KIỂM TRA PHIÊN QUẢN TRỊ
-- ─────────────────────────────────────────────
create or replace function phien_quan_tri_hop_le(p_uid uuid, p_session uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select p_uid is not null and p_session is not null and exists (
    select 1
      from admin_sessions s
      join admin_accounts a on a.user_id = s.user_id and a.deleted_at is null
     where s.session_id = p_session
       and s.user_id = p_uid
       and s.revoked_at is null
       and s.created_at > now() - interval '8 hours'
  )
$fn$;

-- Phiên của CHÍNH người đang gọi (đọc từ JWT). Không nhận tham số → không dò
-- được phiên của ai khác.
create or replace function phien_quan_tri_hien_tai()
returns boolean language sql stable security definer set search_path = public as $fn$
  select phien_quan_tri_hop_le(auth.uid(), nullif(auth.jwt() ->> 'session_id', '')::uuid)
$fn$;

-- has_role: giữ nguyên chữ ký (mọi policy RLS gọi nó). Vai trò thường
-- (khach, chu_xe) như cũ; vai trò quản trị đòi thêm phiên quản trị hợp lệ.
create or replace function has_role(r user_role) returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from user_roles
                 where user_id = auth.uid() and role = r and deleted_at is null)
     and (r not in ('admin', 'kiem_duyet') or phien_quan_tri_hien_tai())
$fn$;

-- admin_has_role (0008): gọi từ Edge Function admin-ops bằng service_role nên
-- không có JWT người dùng ở đây — admin-ops tự kiểm phiên bằng
-- phien_quan_tri_hop_le trước. Lớp thứ hai này chỉ đòi tài khoản phải là
-- tài khoản quản trị riêng.
create or replace function admin_has_role(p_uid uuid, p_roles user_role[])
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from user_roles
                  where user_id = p_uid and role = any(p_roles) and deleted_at is null)
     and exists (select 1 from admin_accounts where user_id = p_uid and deleted_at is null)
$fn$;

-- ─────────────────────────────────────────────
-- 3. ĐĂNG NHẬP (chỉ Edge Function admin-login gọi, bằng service_role)
--
-- Giới hạn trong 15 phút gần nhất (đếm lần 'sai' + 'cho'):
--   · cùng tên + cùng IP: 5 lần   → tạm khoá IP đó với tên đó
--   · cùng IP, mọi tên:   20 lần  → tạm khoá IP
--   · cùng tên, mọi IP:   30 lần  → tạm khoá tên (dò mật khẩu phân tán)
-- Ghi lần thử TRƯỚC rồi mới đếm, có khoá advisory → gửi song song nhiều
-- request cũng không vượt được giới hạn.
-- ─────────────────────────────────────────────
create or replace function admin_login_bat_dau(p_username text, p_ip text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_ten   text := lower(trim(coalesce(p_username, '')));
  v_ip    text := left(coalesce(nullif(trim(p_ip), ''), 'khong_ro'), 64);
  v_id    bigint;
  v_cap   int;
  v_ip_n  int;
  v_ten_n int;
  v_uid   uuid;
  v_email text;
begin
  perform pg_advisory_xact_lock(hashtext('admin_login'));

  insert into admin_login_attempts (username, ip) values (left(v_ten, 64), v_ip)
  returning id into v_id;

  select count(*) filter (where username = left(v_ten, 64) and ip = v_ip),
         count(*) filter (where ip = v_ip),
         count(*) filter (where username = left(v_ten, 64))
    into v_cap, v_ip_n, v_ten_n
    from admin_login_attempts
   where created_at > now() - interval '15 minutes'
     and status in ('cho', 'sai');

  if v_cap > 5 or v_ip_n > 20 or v_ten_n > 30 then
    update admin_login_attempts set status = 'khoa' where id = v_id;
    return jsonb_build_object('khoa', true, 'attempt', v_id);
  end if;

  -- Chỉ tài khoản quản trị còn hiệu lực và còn vai trò quản trị.
  select a.user_id, u.email into v_uid, v_email
    from admin_accounts a
    join auth.users u on u.id = a.user_id
   where a.username = v_ten and a.deleted_at is null
     and exists (select 1 from user_roles r
                  where r.user_id = a.user_id and r.deleted_at is null
                    and r.role in ('admin', 'kiem_duyet'));

  return jsonb_build_object('khoa', false, 'attempt', v_id, 'user_id', v_uid, 'email', v_email);
end $fn$;

create or replace function admin_login_ket_thuc(
  p_attempt bigint, p_ok boolean, p_user uuid, p_session uuid, p_ip text
) returns void language plpgsql security definer set search_path = public as $fn$
begin
  update admin_login_attempts
     set status = case when p_ok then 'dung' else 'sai' end
   where id = p_attempt and status = 'cho';

  if p_ok then
    if p_user is null or p_session is null then
      raise exception 'Thiếu user hoặc session';
    end if;
    insert into admin_sessions (session_id, user_id, ip)
    values (p_session, p_user, left(p_ip, 64))
    on conflict (session_id) do nothing;
    perform admin_log(p_user, 'admin_login', 'admin_session', p_session::text,
                      null, jsonb_build_object('ip', left(p_ip, 64)));
  end if;
end $fn$;

-- ─────────────────────────────────────────────
-- 4. HÀM CHO TRANG /admin (người đã đăng nhập gọi)
-- ─────────────────────────────────────────────

-- Phiên hiện tại có phải phiên quản trị không, vai trò gì, hết hạn lúc nào.
-- Trang /admin dựa vào đây để hiện form đăng nhập hay bảng điều khiển —
-- nhưng chặn thật vẫn là RLS (has_role) và admin-ops.
create or replace function toi_la_quan_tri()
returns jsonb language sql stable security definer set search_path = public as $fn$
  select case when phien_quan_tri_hien_tai() then
    jsonb_build_object(
      'admin',      has_role('admin'),
      'kiem_duyet', has_role('kiem_duyet'),
      'het_han_luc', (select s.created_at + interval '8 hours' from admin_sessions s
                       where s.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid))
  else jsonb_build_object('admin', false, 'kiem_duyet', false) end
$fn$;

-- Nút Thoát: huỷ phiên quản trị hiện tại ở server (client signOut sau đó).
create or replace function thoat_quan_tri()
returns void language sql security definer set search_path = public as $fn$
  update admin_sessions set revoked_at = now()
   where session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
     and user_id = auth.uid() and revoked_at is null
$fn$;

-- ─────────────────────────────────────────────
-- 5. GẮN TÀI KHOẢN QUẢN TRỊ (anh chạy tay trong SQL Editor)
--
--   select gan_tai_khoan_quan_tri('admin', '<email của user vừa tạo>');
--
-- User phải được tạo TRƯỚC trong Dashboard → Authentication → Add user
-- (anh tự gõ mật khẩu ở đó). Hàm này không nhận, không thấy mật khẩu.
-- Không ai ngoài chủ CSDL gọi được (revoke cả service_role).
-- ─────────────────────────────────────────────
create or replace function gan_tai_khoan_quan_tri(
  p_username text, p_email text, p_role user_role default 'admin'
) returns uuid language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid;
  v_ten text := lower(trim(p_username));
begin
  if p_role not in ('admin', 'kiem_duyet') then
    raise exception 'Chỉ gắn vai trò admin hoặc kiem_duyet';
  end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(p_email));
  if v_uid is null then
    raise exception 'Chưa có user % trong Authentication — tạo user trước', p_email;
  end if;
  if not exists (select 1 from users where id = v_uid) then
    raise exception 'User chưa có dòng trong bảng users (trigger 0002 chưa chạy?)';
  end if;

  insert into admin_accounts (user_id, username) values (v_uid, v_ten)
  on conflict (user_id) do update set username = excluded.username, deleted_at = null;

  insert into user_roles (user_id, role) values (v_uid, p_role)
  on conflict (user_id, role) do update set deleted_at = null, updated_at = now();

  return v_uid;
end $fn$;

-- ─────────────────────────────────────────────
-- 6. CHẶN CẤP VAI TRÒ QUẢN TRỊ CHO TÀI KHOẢN THƯỜNG
--    Từ giờ dòng user_roles admin/kiem_duyet còn hiệu lực chỉ được có ở tài
--    khoản trong admin_accounts. Gỡ (đặt deleted_at) thì luôn được.
-- ─────────────────────────────────────────────
create or replace function user_roles_chi_tai_khoan_quan_tri()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.role in ('admin', 'kiem_duyet') and new.deleted_at is null
     and not exists (select 1 from admin_accounts
                      where user_id = new.user_id and deleted_at is null) then
    raise exception 'Vai trò % chỉ cấp cho tài khoản quản trị riêng (admin_accounts)', new.role;
  end if;
  return new;
end $fn$;

drop trigger if exists user_roles_chi_tai_khoan_quan_tri on user_roles;
create trigger user_roles_chi_tai_khoan_quan_tri
  before insert or update on user_roles
  for each row execute function user_roles_chi_tai_khoan_quan_tri();

-- ─────────────────────────────────────────────
-- 7. GỠ VAI TRÒ QUẢN TRỊ CỦA TÀI KHOẢN THƯỜNG (anh duyệt 17/10: "em toàn quyền")
--    Xoá mềm (deleted_at) mọi dòng admin/kiem_duyet của user không nằm trong
--    admin_accounts — tức các tài khoản Google/email cũ. Không xoá cứng: dòng
--    vẫn còn, có dấu thời gian, khôi phục được nếu cần.
--    Danh sách email bị gỡ in ra ở tab "Messages"/"Notices" của SQL Editor.
--    Chạy lại: không còn gì để gỡ thì in "0 dòng".
-- ─────────────────────────────────────────────
do $blk$
declare
  r     record;
  n     int := 0;
  v_mail text;
begin
  for r in
    update user_roles ur
       set deleted_at = now(), updated_at = now()
     where ur.role in ('admin', 'kiem_duyet') and ur.deleted_at is null
       and not exists (select 1 from admin_accounts a
                        where a.user_id = ur.user_id and a.deleted_at is null)
    returning ur.user_id, ur.role
  loop
    select email into v_mail from auth.users where id = r.user_id;
    raise notice 'Đã gỡ vai trò % của tài khoản % (user_id %)', r.role, coalesce(v_mail, '(không có email)'), r.user_id;
    n := n + 1;
  end loop;
  raise notice 'Gỡ vai trò quản trị của tài khoản thường: % dòng', n;
end $blk$;

-- ─────────────────────────────────────────────
-- 8. QUYỀN GỌI HÀM
-- ─────────────────────────────────────────────
revoke all on function phien_quan_tri_hop_le(uuid, uuid)              from public, anon, authenticated;
revoke all on function admin_login_bat_dau(text, text)                from public, anon, authenticated;
revoke all on function admin_login_ket_thuc(bigint, boolean, uuid, uuid, text) from public, anon, authenticated;
revoke all on function admin_has_role(uuid, user_role[])              from public, anon, authenticated;
revoke all on function gan_tai_khoan_quan_tri(text, text, user_role)  from public, anon, authenticated, service_role;
revoke all on function user_roles_chi_tai_khoan_quan_tri()            from public, anon, authenticated;
grant execute on function phien_quan_tri_hop_le(uuid, uuid)               to service_role;
grant execute on function admin_login_bat_dau(text, text)                 to service_role;
grant execute on function admin_login_ket_thuc(bigint, boolean, uuid, uuid, text) to service_role;
grant execute on function admin_has_role(uuid, user_role[])               to service_role;

revoke all on function phien_quan_tri_hien_tai() from public, anon;
revoke all on function toi_la_quan_tri()          from public, anon;
revoke all on function thoat_quan_tri()           from public, anon;
grant execute on function phien_quan_tri_hien_tai() to authenticated, service_role;
grant execute on function toi_la_quan_tri()          to authenticated;
grant execute on function thoat_quan_tri()           to authenticated;
-- has_role: giữ mở như 0009 (mọi policy RLS gọi nó, kể cả với anon).
grant execute on function has_role(user_role) to anon, authenticated, service_role;
