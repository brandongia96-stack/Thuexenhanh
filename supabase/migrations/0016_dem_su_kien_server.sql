-- ============================================================
-- 0016 — Đếm lượt xem / bấm gọi / lưu xe phải do SERVER quyết.
-- Chạy SAU 0015. Chạy lại nhiều lần được.
--
-- Vì sao (rà soát 03/10):
--   · Client tự `insert into events` → khách CHƯA ĐĂNG NHẬP bị 401 (anon không
--     có quyền INSERT) → gần như không lượt xem nào được đếm.
--   · Người đã đăng nhập thì ngược lại: policy `events_insert ... with check (true)`
--     cho chèn BẤT KỲ loại nào, ghi owner_id của ai cũng được → bơm lượt xem giả
--     cho xe mình hoặc bơm "lượt lấy số" vào xe người khác.
--   · Lượt xem là HÀNG HOÁ bán cho chủ xe (QUYET-DINH 7) — phải sạch.
--
-- Cách mới: client chỉ gọi `track_event(...)`. Hàm tự tra owner_id, tự lấy
-- actor từ auth.uid(), bỏ qua chủ xe tự xem, khử trùng lặp 1 giờ TRÊN SERVER.
-- `reveal_phone` KHÔNG nhận ở đây — chỉ Edge Function `reveal-phone` ghi.
--
-- Kèm theo:
--   · rollup_events_daily: tính ngày theo GIỜ VIỆT NAM (trước là UTC → số của
--     7 giờ sáng rơi sang ngày hôm trước), bỏ dòng listing_id null (unique với
--     null không chặn trùng → mỗi lần chạy lại sinh thêm dòng).
--   · cap_quyen_cot_listings(): 0015 thêm `battery_policy_note` mà quên cấp
--     quyền đọc → trang chi tiết xe lỗi 42501 trên production (đã vá tay 03/10).
-- ============================================================

begin;

-- ── 1. Quyền cột cho cột 0015 thêm ──
do $blk$
declare n int;
begin
  n := cap_quyen_cot_listings();
  raise notice 'Đã cấp lại quyền đọc % cột công khai của listings.', n;
end $blk$;

-- ── 2. Hàm ghi sự kiện ──
create or replace function track_event(
  p_kind       text,
  p_listing_id uuid  default null,
  p_session_id text  default null,
  p_meta       jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor uuid := auth.uid();
  v_sid   text := nullif(left(coalesce(p_session_id, ''), 64), '');
  v_meta  jsonb := case
                     when jsonb_typeof(p_meta) = 'object' and pg_column_size(p_meta) <= 2048
                     then p_meta else '{}'::jsonb end;
  v_owner uuid;
begin
  -- Chỉ nhận loại client được phép ghi. reveal_phone/topup/renew do server ghi.
  if p_kind not in ('view_listing', 'click_call', 'click_zalo', 'save_listing', 'search') then
    return;
  end if;

  if p_kind = 'search' then
    insert into events (kind, actor_id, session_id, meta)
    values ('search', v_actor, v_sid, v_meta);
    return;
  end if;

  if p_listing_id is null then return; end if;

  -- Chỉ đếm cho tin đang hiển thị — khớp điều kiện trang tìm kiếm.
  select owner_id into v_owner
  from listings
  where id = p_listing_id
    and deleted_at is null
    and status in ('dang_hien_thi', 'sap_het_han')
    and expires_at > now();
  if v_owner is null then return; end if;

  -- Chủ xe tự xem tin mình: không tính.
  if v_actor is not null and v_actor = v_owner then return; end if;

  -- Cùng người + cùng xe + cùng loại trong 1 giờ chỉ tính 1 lần.
  -- "Cùng người" = tài khoản nếu đã đăng nhập, không thì session ẩn danh.
  if exists (
    select 1 from events e
    where e.kind = p_kind::event_kind
      and e.listing_id = p_listing_id
      and e.created_at > now() - interval '1 hour'
      and (case when v_actor is not null then e.actor_id = v_actor
                else v_sid is not null and e.session_id = v_sid end)
  ) then
    return;
  end if;

  insert into events (kind, listing_id, owner_id, actor_id, session_id, meta)
  values (p_kind::event_kind, p_listing_id, v_owner, v_actor, v_sid, v_meta);
end $fn$;

revoke all on function track_event(text, uuid, text, jsonb) from public;
grant execute on function track_event(text, uuid, text, jsonb) to anon, authenticated;

-- ── 3. Đóng đường ghi thẳng ──
drop policy if exists events_insert on events;
revoke insert, update, delete on events from anon, authenticated;

-- ── 4. Gộp theo ngày GIỜ VIỆT NAM ──
-- Mặc định: hôm qua theo giờ VN. Chạy lại bao nhiêu lần cũng ra cùng kết quả.
create or replace function rollup_events_daily(
  p_day date default ((now() at time zone 'Asia/Ho_Chi_Minh')::date - 1)
)
returns int
language plpgsql
security definer
set search_path = public
as $fn$
declare
  n int;
  v_tu  timestamptz := (p_day::timestamp)     at time zone 'Asia/Ho_Chi_Minh';
  v_den timestamptz := ((p_day + 1)::timestamp) at time zone 'Asia/Ho_Chi_Minh';
begin
  insert into events_daily (day, listing_id, owner_id, kind, count)
  select p_day, e.listing_id, max(e.owner_id::text)::uuid, e.kind, count(*)
  from events e
  where e.created_at >= v_tu and e.created_at < v_den
    and e.listing_id is not null
  group by e.listing_id, e.kind
  on conflict (day, listing_id, kind)
  do update set count = excluded.count, owner_id = excluded.owner_id, updated_at = now();
  get diagnostics n = row_count;
  return n;
end $fn$;

-- Gộp hôm nay + hôm qua — để cron chạy mỗi giờ, bảng điều khiển chủ xe
-- thấy số trong ngày thay vì chờ tới sáng hôm sau.
create or replace function rollup_events_recent()
returns int
language plpgsql
security definer
set search_path = public
as $fn$
declare v_hom_nay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  return rollup_events_daily(v_hom_nay - 1) + rollup_events_daily(v_hom_nay);
end $fn$;

-- Dọn bảng thô: chỉ xoá phần đã gộp (so ngày theo giờ VN cho khớp bước gộp).
create or replace function prune_events(p_keep_days int default 90)
returns int
language plpgsql
security definer
set search_path = public
as $fn$
declare n int;
begin
  delete from events
  where created_at < now() - make_interval(days => p_keep_days)
    and (listing_id is null
         or exists (select 1 from events_daily d
                    where d.day = (events.created_at at time zone 'Asia/Ho_Chi_Minh')::date
                      and d.listing_id = events.listing_id
                      and d.kind = events.kind));
  get diagnostics n = row_count;
  return n;
end $fn$;

-- Dòng listing_id null do bản cũ sinh ra: vô nghĩa với bảng điều khiển, lại
-- không bị unique chặn. Đây là bảng máy tự gộp, gộp lại được, nên xoá thẳng.
delete from events_daily where listing_id is null;

do $blk$
declare f text;
begin
  foreach f in array array[
    'rollup_events_daily(date)', 'rollup_events_recent()', 'prune_events(int)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $blk$;

-- ── 5. Tự kiểm ──
do $blk$
declare n int;
begin
  select count(*) into n from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'listings'
    and grantee = 'anon' and privilege_type = 'SELECT' and column_name = 'battery_policy_note';
  if n <> 1 then raise exception 'HỎNG — anon chưa đọc được battery_policy_note'; end if;

  select count(*) into n from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'listings'
    and grantee in ('anon', 'authenticated') and privilege_type = 'SELECT'
    and column_name in ('contact_phone', 'contact_zalo', 'plate');
  if n > 0 then raise exception 'HỎNG — hở % cột nhạy cảm', n; end if;

  select count(*) into n from information_schema.table_privileges
  where table_schema = 'public' and table_name = 'events'
    and grantee in ('anon', 'authenticated') and privilege_type in ('INSERT', 'UPDATE', 'DELETE');
  if n > 0 then raise exception 'HỎNG — client vẫn ghi thẳng được bảng events'; end if;

  perform rollup_events_recent();
  raise notice 'OK — track_event có, events đã đóng, gộp theo giờ VN chạy được.';
end $blk$;

commit;
