-- ============================================================
-- 0021 — Chống gian lận theo tài liệu CEO (06/10/2026):
--   CEO WEBTHUEXE/Backend_Requirements.md + Danh_Sach_Trick_Lo_Va_Gian_Lan.md
-- Chạy SAU 0020. Chạy lại nhiều lần được.
--
-- Anh chốt 06/10: GIỮ mô hình chủ xe trả phí hiển thị, khách xem số MIỄN PHÍ.
-- Tài liệu viết cho Firebase + mô hình "khách trả token xem số" — chỉ lấy phần
-- hợp với mô hình đang chạy:
--
--   1. Giới hạn xem số: 10 xe khác nhau / 24h — theo TÀI KHOẢN nếu đã đăng
--      nhập, theo IP (đã băm) nếu chưa. Chỉ theo tài khoản thì kẻ cào chỉ cần
--      không đăng nhập. (trick 12 — bãi xe cào data chủ xe)
--   2. Nhật ký lấy số (`events` kind reveal_phone) GIỮ VĨNH VIỄN, không dọn
--      sau 90 ngày — bằng chứng khi khiếu nại / cơ quan chức năng yêu cầu.
--      Client không ghi/sửa/xoá được bảng events (0016).
--   3. Tự che số điện thoại trong chữ chủ xe gõ (mô tả, ghi chú...) và trong
--      đánh giá: cả dạng số (0901 234 567, +84...) lẫn dạng chữ ("không chín
--      một..."). (trick 1, 13)
--   4. Giá sàn theo số chỗ — bảng `price_floors`, admin sửa được. Nạp sẵn
--      đúng MỘT dòng anh ghi trong tài liệu: xe 7 chỗ ≥ 500.000đ/ngày.
--      Chỉ chặn lúc gửi duyệt / đổi giá. (trick 4 — đạp giá câu khách)
--   5. Biển số che giữa: cột công khai `plate_masked` (51H-***.45) tự sinh từ
--      `plate` (cột kín). (trick 9)
--   6. Danh bạ cứu hộ: bảng `rescue_contacts` — RỖNG, chỉ nhập số THẬT.
--   7. Bằng chứng báo cáo: bucket KÍN `bang-chung` + `reports.evidence_paths`.
--   8. Đánh giá chỉ khi đã lấy số chủ xe đó: `da_lien_he(listing)` + policy.
--      (luồng 09 còn tắt — dựng sẵn luật)
--
-- KHÔNG làm (trái quyết định): khách trả token xem số, hoàn token theo report,
-- tặng token (kể cả cho review) khi chưa có KYC, rút token ra tiền (vốn không có).
-- ============================================================

begin;

-- ── 1. Giới hạn xem số ──
create index if not exists events_reveal_actor_idx
  on events (actor_id, created_at desc) where kind = 'reveal_phone';
create index if not exists events_reveal_ip_idx
  on events ((meta->>'ip'), created_at desc) where kind = 'reveal_phone';

-- Số xe KHÁC NHAU đã lấy số trong 24h (không tính xe đang hỏi — bấm lại xe
-- cũ không tốn lượt). Đăng nhập → đếm theo tài khoản; chưa → theo IP băm.
create or replace function reveal_da_xem_24h(p_actor uuid, p_ip text, p_listing uuid)
returns int language sql stable security definer set search_path = public as $fn$
  select count(distinct listing_id)::int
  from events
  where kind = 'reveal_phone'
    and created_at > now() - interval '24 hours'
    and listing_id <> p_listing
    and (case when p_actor is not null then actor_id = p_actor
              else actor_id is null and meta->>'ip' = p_ip end)
$fn$;

-- Hàm cũ (0005) giữ chữ ký, đổi mức 20 → 10 cho khớp.
create or replace function reveal_quota_left(p_user uuid) returns int
language sql stable security definer set search_path = public as $fn$
  select greatest(0, 10 - count(distinct listing_id))::int
  from events
  where kind = 'reveal_phone' and actor_id = p_user
    and created_at > now() - interval '24 hours'
$fn$;

revoke all on function reveal_da_xem_24h(uuid, text, uuid) from public, anon, authenticated;
grant execute on function reveal_da_xem_24h(uuid, text, uuid) to service_role;

-- ── 2. Nhật ký lấy số giữ vĩnh viễn ──
create or replace function prune_events(p_keep_days int default 90)
returns int language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  delete from events
  where kind <> 'reveal_phone'          -- bằng chứng kết nối: KHÔNG dọn
    and created_at < now() - make_interval(days => p_keep_days)
    and (listing_id is null
         or exists (select 1 from events_daily d
                    where d.day = (events.created_at at time zone 'Asia/Ho_Chi_Minh')::date
                      and d.listing_id = events.listing_id
                      and d.kind = events.kind));
  get diagnostics n = row_count;
  return n;
end $fn$;
revoke all on function prune_events(int) from public, anon, authenticated;

-- ── 3. Che số điện thoại trong chữ tự do ──
create or replace function che_sdt(p text) returns text
language sql immutable as $fn$
  select case when p is null then null else
    regexp_replace(
      regexp_replace(p,
        -- dạng số: 0xxxxxxxxx hoặc +84/84xxxxxxxxx, cho phép cách bằng space . - _
        '(\+?84|0)([\s.\-_]*\d){8,10}', '***', 'g'),
      -- dạng chữ: từ 7 chữ số đọc liền trở lên
      '((không|khong|một|mot|hai|ba|bốn|bon|tư|năm|nam|lăm|sáu|sau|bảy|bay|tám|tam|chín|chin|linh)[\s,.\-]*){7,}',
      '*** ', 'gi')
  end
$fn$;

create or replace function listings_che_sdt() returns trigger
language plpgsql as $fn$
begin
  new.description         := che_sdt(new.description);
  new.deposit_note        := che_sdt(new.deposit_note);
  new.delivery_fee_note   := che_sdt(new.delivery_fee_note);
  new.address_text        := che_sdt(new.address_text);
  new.collateral_note     := che_sdt(new.collateral_note);
  new.battery_policy_note := che_sdt(new.battery_policy_note);
  return new;
end $fn$;

drop trigger if exists listings_che_sdt on listings;
create trigger listings_che_sdt before insert or update on listings
  for each row execute function listings_che_sdt();

create or replace function reviews_che_sdt() returns trigger
language plpgsql as $fn$
begin
  new.content := che_sdt(new.content);
  return new;
end $fn$;
drop trigger if exists reviews_che_sdt on reviews;
create trigger reviews_che_sdt before insert or update on reviews
  for each row execute function reviews_che_sdt();

-- ── 4. Giá sàn theo số chỗ ──
create table if not exists price_floors (
  seats             int primary key check (seats between 2 and 50),
  min_price_per_day int not null check (min_price_per_day > 0),
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table price_floors enable row level security;
drop policy if exists price_floors_read  on price_floors;
drop policy if exists price_floors_admin on price_floors;
create policy price_floors_read  on price_floors for select using (true);
create policy price_floors_admin on price_floors for all using (has_role('admin')) with check (has_role('admin'));
grant select on price_floors to anon, authenticated;
drop trigger if exists price_floors_touch on price_floors;
create trigger price_floors_touch before update on price_floors
  for each row execute function touch_updated_at();

-- Đúng con số anh ghi trong Backend_Requirements.md §5. Số chỗ khác: CHƯA có
-- sàn cho tới khi anh/admin nhập — không tự đoán.
insert into price_floors (seats, min_price_per_day, note)
values (7, 500000, 'Theo Backend_Requirements.md 06/10/2026')
on conflict (seats) do nothing;

-- Sàn áp dụng = dòng có số chỗ lớn nhất mà ≤ số chỗ của xe (7 chỗ phủ cả 9, 16 chỗ
-- cho tới khi có dòng riêng).
create or replace function listings_kiem_gia_san() returns trigger
language plpgsql as $fn$
declare v_san int;
begin
  -- Chỉ kiểm lúc gửi duyệt, hoặc đổi giá/số chỗ khi tin đang/sắp hiện.
  if not (
       (new.status = 'cho_duyet' and old.status is distinct from 'cho_duyet')
    or (new.status in ('cho_duyet', 'dang_hien_thi', 'sap_het_han')
        and (new.price_per_day is distinct from old.price_per_day
             or new.seats is distinct from old.seats))
  ) then
    return new;
  end if;
  if new.seats is null or new.price_per_day is null then return new; end if;

  select min_price_per_day into v_san
  from price_floors where seats <= new.seats
  order by seats desc limit 1;

  if v_san is not null and new.price_per_day < v_san then
    raise exception 'Giá thuê xe % chỗ không được thấp hơn %đ/ngày', new.seats,
      replace(to_char(v_san, 'FM999,999,999'), ',', '.')
      using errcode = 'P0001', hint = 'gia_duoi_san';
  end if;
  return new;
end $fn$;

drop trigger if exists listings_kiem_gia_san on listings;
create trigger listings_kiem_gia_san before update on listings
  for each row execute function listings_kiem_gia_san();

-- ── 5. Biển số che giữa ──
alter table listings add column if not exists plate_masked text;

-- '51H-123.45' → '51H-***.45'. Giữ mã tỉnh + seri và 2 số cuối.
create or replace function che_bien_so(p text) returns text
language plpgsql immutable as $fn$
declare
  s text := upper(regexp_replace(coalesce(p, ''), '\s', '', 'g'));
  m text[];
  so text;
begin
  if s = '' then return null; end if;
  m := regexp_match(s, '^(\d{2}[A-Z]{1,2}\d?)[-.]?([\d.]+)$');
  if m is null then return null; end if;          -- định dạng lạ: không hiện gì
  so := regexp_replace(m[2], '\D', '', 'g');
  if length(so) < 4 then return null; end if;
  return m[1] || '-' || repeat('*', length(so) - 2 - 0) || '.' || right(so, 2);
end $fn$;

create or replace function listings_che_bien_so() returns trigger
language plpgsql as $fn$
begin
  new.plate_masked := che_bien_so(new.plate);
  return new;
end $fn$;
drop trigger if exists listings_che_bien_so on listings;
create trigger listings_che_bien_so before insert or update of plate on listings
  for each row execute function listings_che_bien_so();

-- ── 6. Danh bạ cứu hộ ──
create table if not exists rescue_contacts (
  id          uuid primary key default gen_random_uuid(),
  province_id int references provinces(id),
  name        text not null,
  phone       text not null,
  service     text,                 -- 'cuu_ho', 'sua_xe', 'lop'...
  note        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists rescue_contacts_province_idx on rescue_contacts (province_id, sort_order) where deleted_at is null;
alter table rescue_contacts enable row level security;
drop policy if exists rescue_read  on rescue_contacts;
drop policy if exists rescue_admin on rescue_contacts;
create policy rescue_read  on rescue_contacts for select using (deleted_at is null);
create policy rescue_admin on rescue_contacts for all using (has_role('admin')) with check (has_role('admin'));
grant select on rescue_contacts to anon, authenticated;
drop trigger if exists rescue_contacts_touch on rescue_contacts;
create trigger rescue_contacts_touch before update on rescue_contacts
  for each row execute function touch_updated_at();

-- ── 7. Bằng chứng báo cáo ──
alter table reports add column if not exists evidence_paths text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bang-chung', 'bang-chung', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Đường dẫn: bang-chung/<user_id>/<uuid>.<đuôi>. Người gửi chỉ ghi vào thư
-- mục của mình; chỉ người gửi + kiểm duyệt/admin đọc được. Không ai sửa/xoá.
drop policy if exists bang_chung_ghi on storage.objects;
drop policy if exists bang_chung_doc on storage.objects;
create policy bang_chung_ghi on storage.objects for insert to authenticated
  with check (bucket_id = 'bang-chung' and (storage.foldername(name))[1] = auth.uid()::text);
create policy bang_chung_doc on storage.objects for select to authenticated
  using (bucket_id = 'bang-chung'
         and ((storage.foldername(name))[1] = auth.uid()::text
              or has_role('kiem_duyet') or has_role('admin')));

-- ── 8. Đánh giá chỉ khi đã liên hệ ──
create or replace function da_lien_he(p_listing uuid) returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from events
    where kind = 'reveal_phone' and listing_id = p_listing
      and actor_id = auth.uid() and actor_id is not null
  )
$fn$;
revoke all on function da_lien_he(uuid) from public;
grant execute on function da_lien_he(uuid) to authenticated;

drop policy if exists reviews_author on reviews;
drop policy if exists reviews_author_insert on reviews;
drop policy if exists reviews_author_update on reviews;
create policy reviews_author_insert on reviews for insert to authenticated
  with check (author_id = auth.uid() and da_lien_he(listing_id));
create policy reviews_author_update on reviews for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- ── Quyền cột listings (vừa thêm plate_masked) ──
do $blk$ declare n int; begin n := cap_quyen_cot_listings(); end $blk$;

-- ── Chạy lại trên dữ liệu đang có ──
-- (trigger giá sàn chỉ bắt khi đổi trạng thái/giá nên không chặn dòng cũ)
update listings set plate_masked = che_bien_so(plate) where plate is not null;
update listings set description = description
 where description ~ '(\+?84|0)([\s.\-_]*\d){8,10}';

-- ── Tự kiểm ──
do $blk$ begin
  if che_sdt('Gọi 0901 234 567 nhé') <> 'Gọi *** nhé' then
    raise exception 'HỎNG che_sdt dạng số: %', che_sdt('Gọi 0901 234 567 nhé'); end if;
  if che_sdt('giá 12.000.000đ/tháng') <> 'giá 12.000.000đ/tháng' then
    raise exception 'HỎNG che_sdt che nhầm giá tiền'; end if;
  if che_sdt('zalo không chín không một hai ba bốn năm sáu bảy') not like 'zalo ***%' then
    raise exception 'HỎNG che_sdt dạng chữ: %', che_sdt('zalo không chín không một hai ba bốn năm sáu bảy'); end if;
  if che_bien_so('51H-123.45') <> '51H-***.45' then
    raise exception 'HỎNG che_bien_so: %', che_bien_so('51H-123.45'); end if;
  if exists (select 1 from information_schema.column_privileges
             where table_name = 'listings' and grantee = 'anon' and privilege_type = 'SELECT'
               and column_name in ('contact_phone', 'contact_zalo', 'plate')) then
    raise exception 'HỎNG — hở cột nhạy cảm'; end if;
  raise notice 'OK — chống gian lận đã vào.';
end $blk$;

commit;
