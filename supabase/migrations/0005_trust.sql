-- Luồng 08 — Tin cậy & chống gian lận. BẢN NHÁP, chưa chạy.
--
-- Luồng 01 đã chuyển file này từ `src/modules/trust/server/` vào đây ngày 21/09.
-- Độc lập với billing/notify/admin — chạy ở đâu trong dãy cũng được.
-- VẪN LÀ BẢN NHÁP: luồng 08 chưa chạy thử, chưa nối UI.
-- Luồng 01 xem xét, gộp vào contracts/schema.sql rồi sinh lại migration.
-- Chạy SAU 0001, 0002, 0003.

-- ─────────────────────────────────────────────
-- 1. LỖ HỔNG: client tạo tin thẳng ở trạng thái đang hiển thị
--    listings_owner_insert chỉ kiểm owner_id. Trigger guard hiện chỉ gắn
--    BEFORE UPDATE, nên chủ xe INSERT thẳng status='dang_hien_thi',
--    is_verified=true, expires_at=... là lên sàn không qua duyệt, không trả token.
-- ─────────────────────────────────────────────
create or replace function guard_listing_insert()
returns trigger language plpgsql as $fn$
begin
  if auth.role() = 'service_role' or has_role('admin') then
    return new;
  end if;
  if new.status is distinct from 'nhap'
     or new.is_verified
     or new.published_at is not null
     or new.expires_at is not null then
    raise exception 'Tin moi phai bat dau o trang thai nhap';
  end if;
  return new;
end $fn$;

create trigger listings_guard_insert before insert on listings
  for each row execute function guard_listing_insert();

-- Chủ xe không tự đẩy tin sang cho_duyet: phải qua Edge Function submit-listing
-- (kiểm SĐT đã xác thực + trùng biển số + tạo dòng moderation_queue).
-- Nếu cho tự chuyển, tin kẹt ở cho_duyet mà không có dòng nào trong hàng đợi.
create or replace function guard_listing_submit()
returns trigger language plpgsql as $fn$
begin
  if auth.role() = 'service_role' or has_role('admin') or has_role('kiem_duyet') then
    return new;
  end if;
  if new.status = 'cho_duyet' and old.status is distinct from 'cho_duyet' then
    raise exception 'Gui duyet phai di qua submit-listing';
  end if;
  return new;
end $fn$;

create trigger listings_guard_submit before update on listings
  for each row execute function guard_listing_submit();

-- ─────────────────────────────────────────────
-- 2. BIỂN SỐ — chuẩn hoá và chặn trùng giữa hai chủ xe
-- ─────────────────────────────────────────────
-- "51A-123.45" / "51a 12345" -> "51A12345"
create or replace function norm_plate(p text) returns text
language sql immutable as $fn$
  select nullif(upper(regexp_replace(coalesce(p, ''), '[^0-9A-Za-z]', '', 'g')), '')
$fn$;

create index if not exists listings_plate_idx on listings (norm_plate(plate))
  where plate is not null and deleted_at is null
    and status in ('cho_duyet', 'dang_hien_thi', 'sap_het_han');

-- Có tin của NGƯỜI KHÁC đang chờ duyệt / hiển thị dùng cùng biển số không.
-- submit-listing gọi hàm này, có kết quả thì trả `du_lieu_khong_hop_le`.
create or replace function plate_conflict(p_listing uuid) returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1
    from listings me
    join listings o on norm_plate(o.plate) = norm_plate(me.plate)
    where me.id = p_listing
      and norm_plate(me.plate) is not null
      and o.id <> me.id
      and o.owner_id <> me.owner_id
      and o.deleted_at is null
      and o.status in ('cho_duyet', 'dang_hien_thi', 'sap_het_han')
  )
$fn$;

-- ─────────────────────────────────────────────
-- 3. BÁO CÁO — 3 người độc lập báo thì tin tự ẩn
-- ─────────────────────────────────────────────
-- Một người chỉ báo một tin một lần: không thì một người bấm 3 lần là ẩn tin đối thủ.
create unique index if not exists reports_one_per_person
  on reports (listing_id, reporter_id) where deleted_at is null;

create or replace function reports_before_insert()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if exists (select 1 from listings where id = new.listing_id and owner_id = new.reporter_id) then
    raise exception 'Khong the tu bao cao tin cua minh';
  end if;
  return new;
end $fn$;

create trigger reports_before_insert_trg before insert on reports
  for each row execute function reports_before_insert();

create or replace function reports_auto_hide()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  select count(distinct reporter_id) into n
  from reports
  where listing_id = new.listing_id and status = 'moi' and deleted_at is null;

  if n >= 3 then
    update listings set status = 'an'
    where id = new.listing_id and status in ('dang_hien_thi', 'sap_het_han');
    -- Đẩy vào hàng đợi để admin (luồng 10) xử lý, không để tin chết lặng.
    insert into moderation_queue (listing_id, status, reason)
    select new.listing_id, 'cho_duyet', 'Tu an: du 3 bao cao doc lap'
    where not exists (
      select 1 from moderation_queue
      where listing_id = new.listing_id and status = 'cho_duyet'
    );
  end if;
  return new;
end $fn$;

create trigger reports_auto_hide_trg after insert on reports
  for each row execute function reports_auto_hide();

-- ─────────────────────────────────────────────
-- 4. GIỚI HẠN — dùng cho Edge Function (service_role)
-- ─────────────────────────────────────────────
-- Lấy số: 20 lượt / người / 24h, chỉ tính tin KHÁC nhau (bấm lại tin cũ không tốn lượt).
create or replace function reveal_quota_left(p_user uuid) returns int
language sql stable security definer set search_path = public as $fn$
  select greatest(0, 20 - count(distinct listing_id))::int
  from events
  where kind = 'reveal_phone' and actor_id = p_user
    and created_at > now() - interval '24 hours'
$fn$;

-- OTP: 5 lần gửi / số / ngày.
create or replace function otp_sends_today(p_phone text) returns int
language sql stable security definer set search_path = public as $fn$
  select count(*)::int from otp_codes
  where phone = p_phone and created_at > now() - interval '24 hours'
$fn$;

revoke execute on function reveal_quota_left(uuid), otp_sends_today(text), plate_conflict(uuid)
  from public, anon, authenticated;
