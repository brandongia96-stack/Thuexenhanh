-- ============================================================
-- 0029 — Cộng đồng tìm xe: KHÁCH đăng "cần thuê xe", CHỦ XE xem & chào xe.
-- Viết lại 17/10/2026 (anh duyệt "làm lại, không gói Pro"). Chạy SAU 0028.
-- Chạy lại nhiều lần được.
--
-- Bản phiên trước (chưa từng chạy) có "gói Pro" — chủ xe trả token mới xem
-- được SĐT khách — và 4 lỗ: khách vãng lai đọc thẳng SĐT từ bảng; khách tự
-- đổi trạng thái thành "đã duyệt"; ai đăng nhập cũng xem số không giới hạn;
-- ai cũng gọi được hàm bắn thông báo hàng loạt. Bản này:
--
--   · KHÔNG có gói Pro, KHÔNG thu phí (CLAUDE.md 1.1: chỉ thu phí hiển thị tin).
--   · Bảng `customer_requests` CHỈ chính khách + kiểm duyệt đọc được. Bảng tin
--     công khai đi qua view `customer_request_feed` — SĐT đã che, chỉ tin đã
--     duyệt, còn hạn.
--   · Khách chỉ tạo tin ở trạng thái `cho_duyet`, chỉ tự đóng (`da_tim_thay`)
--     hoặc xoá mềm. Duyệt/từ chối là việc của kiểm duyệt/admin.
--   · Xem SĐT khách (`xem_lien_he_tim_xe`): chỉ CHỦ XE đang có tin hiển thị,
--     chỉ tin khách đã đồng ý chia sẻ, tối đa 20 tin khác nhau / 24h, có nhật
--     ký `customer_request_reveals`.
--   · Thông báo chủ xe cùng tỉnh: chỉ kiểm duyệt/admin gọi, mỗi tin MỘT lần.
--   · Tự che SĐT trong nội dung (che_sdt), tự lấy tên gọi + ảnh từ hồ sơ.
-- ============================================================

begin;

do $blk$ begin
  -- Kiểm THEO SCHEMA: pg_net cũng có kiểu net.request_status trùng tên.
  if to_regtype('public.request_status') is null then
    create type public.request_status as enum ('cho_duyet', 'da_duyet', 'tu_choi', 'da_tim_thay', 'het_han', 'bi_an');
  end if;
end $blk$;

-- ── 1. Tin tìm xe ──
create table if not exists customer_requests (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references users(id),
  customer_name       text not null default 'Khách',
  customer_phone      text not null,
  customer_zalo       text,
  customer_avatar     text,
  start_date          date not null,
  end_date            date not null,
  seats               int,
  transmission        text default 'bat_ky',
  fuel                text default 'bat_ky',
  body_style          text default 'bat_ky',
  province_id         int references provinces(id),
  district_id         int references districts(id),
  address_text        text,
  lat                 numeric(8,4),
  lng                 numeric(8,4),
  budget_min          int,
  budget_max          int,
  budget_negotiable   boolean default true,
  extra_tags          text[] default '{}',
  custom_note         text,
  content             text not null,
  status              request_status not null default 'cho_duyet',
  reject_reason       text,
  offer_count         int not null default 0,
  reveal_count        int not null default 0,
  consent_share_phone boolean not null default false,
  notified_at         timestamptz,
  expires_at          timestamptz not null default (now() + interval '5 days'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create index if not exists customer_requests_feed_idx
  on customer_requests (status, expires_at, created_at desc) where deleted_at is null;
create index if not exists customer_requests_province_idx
  on customer_requests (province_id, status) where deleted_at is null;
create index if not exists customer_requests_customer_idx
  on customer_requests (customer_id, created_at desc);

-- ── 2. Chủ xe chào xe ──
create table if not exists customer_request_offers (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references customer_requests(id),
  owner_id    uuid not null references users(id),
  listing_id  uuid references listings(id),
  offer_price int,
  message     text,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists request_offers_req_idx on customer_request_offers (request_id, created_at desc);
-- Mỗi chủ xe chào MỘT lần mỗi tin (đỡ spam tin của khách).
create unique index if not exists request_offers_mot_lan
  on customer_request_offers (request_id, owner_id) where deleted_at is null;

-- ── 3. Nhật ký chủ xe xem SĐT khách (bằng chứng + hạn mức) ──
create table if not exists customer_request_reveals (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references customer_requests(id),
  owner_id    uuid not null references users(id),
  created_at  timestamptz not null default now(),
  unique (request_id, owner_id)
);
create index if not exists cr_reveals_owner_idx on customer_request_reveals (owner_id, created_at desc);

-- ── 4. Luật ghi tin ──
create or replace function la_kiem_duyet() returns boolean
language sql stable as $fn$ select has_role('admin') or has_role('kiem_duyet') $fn$;

create or replace function customer_requests_truoc_khi_ghi() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare v_u users%rowtype; v_dang_mo int; v_hom_nay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if tg_op = 'INSERT' then
    select * into v_u from users where id = new.customer_id;
    -- Tên gọi + ảnh lấy từ hồ sơ, không tin client gửi lên (cùng luật owner_public).
    new.customer_name := coalesce(nullif(
      upper(left(regexp_replace(trim(v_u.full_name), '^.*\s', ''), 1))
        || substr(regexp_replace(trim(v_u.full_name), '^.*\s', ''), 2), ''), 'Khách');
    new.customer_avatar := v_u.avatar_url;
    new.offer_count := 0;
    new.reveal_count := 0;
    new.notified_at := null;
    if not la_kiem_duyet() then
      new.status := 'cho_duyet';
      new.reject_reason := null;
    end if;
    select count(*) into v_dang_mo from customer_requests
     where customer_id = new.customer_id and deleted_at is null
       and status in ('cho_duyet', 'da_duyet') and expires_at > now();
    if v_dang_mo >= 3 then
      raise exception 'Mỗi tài khoản tối đa 3 tin tìm xe đang mở' using hint = 'qua_nhieu_tin';
    end if;
  else
    -- Hàm nội bộ (đếm lượt xem/chào, đánh dấu đã báo) đặt cờ này trong giao dịch.
    -- Client gọi qua API không đặt được GUC tuỳ ý.
    -- Kết nối DB trực tiếp (cron, SQL Editor, migration) không có JWT → cho qua,
    -- cùng luật với guard_listing_sensitive_cols (0017).
    if current_setting('txn.cap_nhat_noi_bo', true) = '1' or auth.role() is null then
      return new;
    end if;
    if not la_kiem_duyet() then
      -- Khách chỉ được: đóng tin (đã tìm được xe) hoặc xoá mềm. Mọi cột khác giữ nguyên.
      if new.status is distinct from old.status and new.status <> 'da_tim_thay' then
        raise exception 'Không được tự đổi trạng thái tin' using hint = 'khong_co_quyen';
      end if;
      if (to_jsonb(new) - array['status', 'deleted_at', 'updated_at'])
         is distinct from (to_jsonb(old) - array['status', 'deleted_at', 'updated_at']) then
        raise exception 'Tin đã gửi không sửa được — đóng tin rồi đăng tin mới' using hint = 'khong_sua_duoc';
      end if;
      return new;
    end if;
  end if;

  if new.end_date < new.start_date or new.end_date - new.start_date > 60 then
    raise exception 'Ngày thuê không hợp lệ (tối đa 60 ngày)' using hint = 'ngay_sai';
  end if;
  if tg_op = 'INSERT' and new.end_date < v_hom_nay then
    raise exception 'Ngày trả xe đã qua' using hint = 'ngay_sai';
  end if;
  new.content      := che_sdt(new.content);
  new.custom_note  := che_sdt(new.custom_note);
  new.address_text := che_sdt(new.address_text);
  if new.lat is not null then new.lat := round(new.lat, 2); end if;
  if new.lng is not null then new.lng := round(new.lng, 2); end if;
  -- Hết hạn hết ngày trả xe (giờ VN).
  new.expires_at := ((new.end_date + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh');
  return new;
end $fn$;

drop trigger if exists customer_requests_truoc_khi_ghi on customer_requests;
create trigger customer_requests_truoc_khi_ghi before insert or update on customer_requests
  for each row execute function customer_requests_truoc_khi_ghi();
drop trigger if exists customer_requests_touch on customer_requests;
create trigger customer_requests_touch before update on customer_requests
  for each row execute function touch_updated_at();

-- ── 5. Luật chào xe ──
create or replace function request_offers_truoc_khi_ghi() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if not exists (select 1 from customer_requests r where r.id = new.request_id
                 and r.status = 'da_duyet' and r.deleted_at is null and r.expires_at > now()) then
    raise exception 'Tin tìm xe không còn nhận chào xe' using hint = 'tin_dong';
  end if;
  if not exists (select 1 from owner_public o where o.id = new.owner_id) then
    raise exception 'Cần có ít nhất một tin xe đang hiển thị để chào xe' using hint = 'chua_co_xe';
  end if;
  if new.listing_id is not null and not exists (
       select 1 from listings l where l.id = new.listing_id and l.owner_id = new.owner_id
         and l.deleted_at is null and l.status in ('dang_hien_thi', 'sap_het_han')) then
    raise exception 'Xe chào phải là xe của anh/chị đang hiển thị' using hint = 'xe_sai';
  end if;
  new.message := che_sdt(new.message);
  return new;
end $fn$;
drop trigger if exists request_offers_truoc_khi_ghi on customer_request_offers;
create trigger request_offers_truoc_khi_ghi before insert on customer_request_offers
  for each row execute function request_offers_truoc_khi_ghi();

create or replace function update_request_offer_count() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  perform set_config('txn.cap_nhat_noi_bo', '1', true);
  update customer_requests r set offer_count = (
    select count(*) from customer_request_offers o
    where o.request_id = r.id and o.deleted_at is null)
  where r.id = coalesce(new.request_id, old.request_id);
  perform set_config('txn.cap_nhat_noi_bo', '0', true);
  return null;
end $fn$;
drop trigger if exists trigger_update_request_offer_count on customer_request_offers;
create trigger trigger_update_request_offer_count
  after insert or update of deleted_at on customer_request_offers
  for each row execute function update_request_offer_count();

-- ── 6. Bảng tin công khai (view chạy quyền chủ view, SĐT đã che) ──
create or replace view customer_request_feed as
select
  r.id, r.customer_id, r.customer_name,
  case when length(r.customer_phone) >= 10
       then substr(r.customer_phone, 1, 3) || ' ••• •' || right(r.customer_phone, 3)
       else '0•• ••• •••' end as customer_phone_masked,
  r.customer_avatar, r.start_date, r.end_date, r.seats, r.transmission, r.fuel, r.body_style,
  r.province_id, r.district_id, p.name as province_name, d.name as district_name,
  r.address_text,
  coalesce(r.lat, d.lat, p.lat) as lat, coalesce(r.lng, d.lng, p.lng) as lng,
  r.budget_min, r.budget_max, r.budget_negotiable, r.extra_tags, r.custom_note, r.content,
  r.status, r.offer_count, r.reveal_count, r.consent_share_phone, r.expires_at, r.created_at
from customer_requests r
left join provinces p on p.id = r.province_id
left join districts d on d.id = r.district_id
where r.deleted_at is null
  and r.status in ('da_duyet', 'da_tim_thay')
  and r.expires_at > now();

drop function if exists customer_requests_gan(numeric, numeric);
create function customer_requests_gan(p_lat numeric, p_lng numeric)
returns setof customer_request_feed
language sql stable security invoker set search_path = public as $fn$
  select f.* from customer_request_feed f
  where f.lat is not null and p_lat between -90 and 90 and p_lng between -180 and 180
  order by 6371 * acos(least(1.0, greatest(-1.0,
      cos(radians(p_lat::float8)) * cos(radians(f.lat::float8)) * cos(radians(f.lng::float8) - radians(p_lng::float8))
      + sin(radians(p_lat::float8)) * sin(radians(f.lat::float8)))))
$fn$;

-- ── 7. Chủ xe xem liên hệ khách ──
create or replace function xem_lien_he_tim_xe(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_actor uuid := auth.uid(); r customer_requests%rowtype; v_da_xem int;
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'error', 'chua_dang_nhap', 'message', 'Đăng nhập để xem liên hệ khách');
  end if;
  select * into r from customer_requests where id = p_request_id and deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'khong_tim_thay', 'message', 'Tin không còn');
  end if;
  -- Chính khách hoặc kiểm duyệt: xem bình thường, không tính lượt.
  if r.customer_id = v_actor or la_kiem_duyet() then
    return jsonb_build_object('ok', true, 'phone', r.customer_phone,
      'zalo', coalesce(r.customer_zalo, r.customer_phone), 'name', r.customer_name);
  end if;
  if r.status <> 'da_duyet' or r.expires_at <= now() then
    return jsonb_build_object('ok', false, 'error', 'tin_dong', 'message', 'Tin này đã đóng');
  end if;
  if not r.consent_share_phone then
    return jsonb_build_object('ok', false, 'error', 'khach_khong_chia_se',
      'message', 'Khách chưa đồng ý chia sẻ số — hãy gửi lời chào xe');
  end if;
  if not exists (select 1 from owner_public o where o.id = v_actor) then
    return jsonb_build_object('ok', false, 'error', 'chua_co_xe',
      'message', 'Chỉ chủ xe đang có tin hiển thị mới xem được liên hệ khách');
  end if;
  if not exists (select 1 from customer_request_reveals where request_id = r.id and owner_id = v_actor) then
    select count(*) into v_da_xem from customer_request_reveals
     where owner_id = v_actor and created_at > now() - interval '24 hours';
    if v_da_xem >= 20 then
      return jsonb_build_object('ok', false, 'error', 'vuot_gioi_han',
        'message', 'Anh/chị đã xem liên hệ 20 khách trong 24 giờ qua. Vui lòng thử lại sau.');
    end if;
    insert into customer_request_reveals (request_id, owner_id) values (r.id, v_actor);
    perform set_config('txn.cap_nhat_noi_bo', '1', true);
    update customer_requests set reveal_count = reveal_count + 1 where id = r.id;
    perform set_config('txn.cap_nhat_noi_bo', '0', true);
  end if;
  return jsonb_build_object('ok', true, 'phone', r.customer_phone,
    'zalo', coalesce(r.customer_zalo, r.customer_phone), 'name', r.customer_name);
end $fn$;

-- ── 8. Báo chủ xe cùng tỉnh khi tin được duyệt (chỉ kiểm duyệt gọi, mỗi tin 1 lần) ──
create or replace function notify_nearby_owners_on_request(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare r record; n int;
begin
  if not la_kiem_duyet() then
    return jsonb_build_object('ok', false, 'error', 'khong_co_quyen');
  end if;
  select cr.*, p.name as tinh into r from customer_requests cr
    left join provinces p on p.id = cr.province_id
   where cr.id = p_request_id and cr.status = 'da_duyet' and cr.deleted_at is null
   for update of cr;
  if not found then return jsonb_build_object('ok', false, 'error', 'yeu_cau_khong_hop_le'); end if;
  if r.notified_at is not null then return jsonb_build_object('ok', true, 'da_bao_truoc', true); end if;

  insert into notifications (user_id, kind, title, body, link)
  select distinct l.owner_id, 'he_thong'::notification_kind,
    'Có khách tìm xe ' || coalesce(r.seats::text || ' chỗ ', '') || 'tại ' || coalesce(r.tinh, 'khu vực của anh/chị'),
    'Cần xe từ ' || to_char(r.start_date, 'DD/MM') || ' đến ' || to_char(r.end_date, 'DD/MM') || '.',
    '/cong-dong?id=' || r.id
  from listings l
  where l.deleted_at is null and l.status in ('dang_hien_thi', 'sap_het_han') and l.expires_at > now()
    and l.owner_id <> r.customer_id
    and (r.province_id is null or l.province_id = r.province_id)
  limit 200;
  get diagnostics n = row_count;
  perform set_config('txn.cap_nhat_noi_bo', '1', true);
  update customer_requests set notified_at = now() where id = p_request_id;
  perform set_config('txn.cap_nhat_noi_bo', '0', true);
  return jsonb_build_object('ok', true, 'notified_inapp', n);
end $fn$;

-- ── 9. Quyền ──
alter table customer_requests        enable row level security;
alter table customer_request_offers  enable row level security;
alter table customer_request_reveals enable row level security;

drop policy if exists cr_read   on customer_requests;
drop policy if exists cr_insert on customer_requests;
drop policy if exists cr_update on customer_requests;
create policy cr_read on customer_requests for select to authenticated
  using (customer_id = auth.uid() or la_kiem_duyet());
create policy cr_insert on customer_requests for insert to authenticated
  with check (customer_id = auth.uid());
create policy cr_update on customer_requests for update to authenticated
  using (customer_id = auth.uid() or la_kiem_duyet())
  with check (customer_id = auth.uid() or la_kiem_duyet());

drop policy if exists cro_read   on customer_request_offers;
drop policy if exists cro_insert on customer_request_offers;
drop policy if exists cro_update on customer_request_offers;
create policy cro_read on customer_request_offers for select using (deleted_at is null);
create policy cro_insert on customer_request_offers for insert to authenticated
  with check (owner_id = auth.uid());
create policy cro_update on customer_request_offers for update to authenticated
  using (owner_id = auth.uid() or la_kiem_duyet()) with check (owner_id = auth.uid() or la_kiem_duyet());

drop policy if exists crr_read on customer_request_reveals;
create policy crr_read on customer_request_reveals for select to authenticated
  using (owner_id = auth.uid() or la_kiem_duyet());

revoke all on customer_requests, customer_request_offers, customer_request_reveals from anon, authenticated;
grant select, insert, update on customer_requests to authenticated;
grant select on customer_request_offers to anon, authenticated;
grant insert, update on customer_request_offers to authenticated;
grant select on customer_request_reveals to authenticated;
revoke all on customer_request_feed from anon, authenticated;
grant select on customer_request_feed to anon, authenticated;

revoke all on function customer_requests_truoc_khi_ghi() from public, anon, authenticated;
revoke all on function request_offers_truoc_khi_ghi() from public, anon, authenticated;
revoke all on function update_request_offer_count() from public, anon, authenticated;
revoke all on function xem_lien_he_tim_xe(uuid) from public, anon;
revoke all on function notify_nearby_owners_on_request(uuid) from public, anon;
grant execute on function customer_requests_gan(numeric, numeric) to anon, authenticated;
grant execute on function xem_lien_he_tim_xe(uuid) to authenticated;
grant execute on function notify_nearby_owners_on_request(uuid) to authenticated;
grant execute on function la_kiem_duyet() to anon, authenticated;

-- ── Tự kiểm ──
do $blk$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'customer_request_feed' and column_name in ('customer_phone', 'customer_zalo')) then
    raise exception 'HỎNG — view công khai lộ SĐT khách'; end if;
  if has_table_privilege('anon', 'customer_requests', 'select') then
    raise exception 'HỎNG — khách vãng lai đọc được bảng tin gốc'; end if;
  if exists (select 1 from pg_proc where proname = 'mua_goi_pro') then
    raise exception 'HỎNG — còn hàm gói Pro'; end if;
  raise notice 'OK — 0029.';
end $blk$;

commit;
