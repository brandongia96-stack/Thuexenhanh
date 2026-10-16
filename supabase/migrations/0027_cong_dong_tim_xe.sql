-- ============================================================
-- 0027 — BẢNG TIN CỘNG ĐỒNG TÌM XE & HỆ THỐNG THÔNG BÁO CHỦ XE (GÓI PRO)
-- Chạy SAU 0026. Chạy lại nhiều lần được.
--
-- Tính năng:
--   1. Khách thuê đăng bài tìm xe tự lái / có tài.
--   2. Bảng tin cộng đồng (Community Feed) tương tác xã hội.
--   3. Chủ xe xem liên hệ & chào xe từ kho xe của mình.
--   4. Quét chủ xe lân cận để gửi thông báo In-app & Email cho chủ xe GÓI PRO.
--   5. Gói Pro đăng ký bằng token (tiếp nối hạ tầng ví token).
-- ============================================================

begin;

-- ── 1. Kiểu trạng thái tin tìm xe ──
do $$
begin
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type request_status as enum ('cho_duyet', 'da_duyet', 'tu_choi', 'da_tim_thay', 'het_han', 'bi_an');
  end if;
end $$;

-- ── 2. Bổ sung Gói Pro trên bảng users ──
alter table users add column if not exists is_pro_owner boolean default false;
alter table users add column if not exists pro_until timestamptz;

-- ── 3. Bảng tin tìm xe (customer_requests) ──
create table if not exists customer_requests (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references users(id) on delete cascade,
  customer_name       text not null,
  customer_phone      text not null,
  customer_zalo       text,
  customer_avatar     text,
  
  -- 5 Tiêu chí cốt lõi
  start_date          date not null,
  end_date            date not null,
  seats               int,
  transmission        text default 'bat_ky', -- 'tu_dong', 'so_san', 'bat_ky'
  fuel                text default 'bat_ky', -- 'xang', 'dau', 'dien', 'bat_ky'
  body_style          text default 'bat_ky', -- 'sedan', 'suv', 'mpv', 'ban_tai', '16cho', 'bat_ky'
  
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
  
  -- Nội dung bài viết
  content             text not null,
  status              request_status not null default 'cho_duyet',
  reject_reason       text,
  
  offer_count         int not null default 0,
  reveal_count        int not null default 0,
  
  consent_share_phone boolean not null default true,
  
  expires_at          timestamptz not null default (now() + interval '5 days'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index if not exists customer_requests_feed_idx 
  on customer_requests (status, expires_at, created_at desc) 
  where deleted_at is null;

create index if not exists customer_requests_province_idx 
  on customer_requests (province_id, status) 
  where deleted_at is null;

create index if not exists customer_requests_customer_idx 
  on customer_requests (customer_id, created_at desc);

-- ── 4. Bảng phản hồi / Chào xe từ chủ xe (customer_request_offers) ──
create table if not exists customer_request_offers (
  id                  uuid primary key default gen_random_uuid(),
  request_id          uuid not null references customer_requests(id) on delete cascade,
  owner_id            uuid not null references users(id) on delete cascade,
  listing_id          uuid references listings(id) on delete set null,
  offer_price         int,
  message             text,
  created_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index if not exists request_offers_req_idx 
  on customer_request_offers (request_id, created_at desc);

-- Trigger cập nhật offer_count
create or replace function update_request_offer_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update customer_requests set offer_count = offer_count + 1 where id = new.request_id;
  elsif tg_op = 'DELETE' then
    update customer_requests set offer_count = greatest(0, offer_count - 1) where id = old.request_id;
  end if;
  return null;
end $$;

drop trigger if exists trigger_update_request_offer_count on customer_request_offers;
create trigger trigger_update_request_offer_count
  after insert or delete on customer_request_offers
  for each row execute function update_request_offer_count();

-- ── 5. View Bảng tin Cộng đồng (che số điện thoại thô) ──
create or replace view customer_request_feed with (security_invoker = true) as
select
  r.id,
  r.customer_id,
  r.customer_name,
  -- SĐT che 4 số giữa để bảo mật trên feed công khai
  case 
    when length(r.customer_phone) >= 10 then
      substr(r.customer_phone, 1, 3) || ' ••• •' || substr(r.customer_phone, length(r.customer_phone) - 2)
    else '0•• ••• •••'
  end as customer_phone_masked,
  r.customer_avatar,
  r.start_date,
  r.end_date,
  r.seats,
  r.transmission,
  r.fuel,
  r.body_style,
  r.province_id,
  r.district_id,
  p.name as province_name,
  d.name as district_name,
  r.address_text,
  coalesce(r.lat, d.lat, p.lat) as lat,
  coalesce(r.lng, d.lng, p.lng) as lng,
  r.budget_min,
  r.budget_max,
  r.budget_negotiable,
  r.extra_tags,
  r.custom_note,
  r.content,
  r.status,
  r.offer_count,
  r.reveal_count,
  r.expires_at,
  r.created_at
from customer_requests r
left join provinces p on p.id = r.province_id
left join districts d on d.id = r.district_id
where r.deleted_at is null;

-- ── 6. Hàm tìm bài yêu cầu gần toạ độ ──
create or replace function customer_requests_gan(p_lat numeric, p_lng numeric)
returns table (
  id uuid,
  customer_id uuid,
  customer_name text,
  customer_phone_masked text,
  customer_avatar text,
  start_date date,
  end_date date,
  seats integer,
  transmission text,
  fuel text,
  body_style text,
  province_id integer,
  district_id integer,
  province_name text,
  district_name text,
  address_text text,
  lat numeric,
  lng numeric,
  budget_min integer,
  budget_max integer,
  budget_negotiable boolean,
  extra_tags text[],
  custom_note text,
  content text,
  status request_status,
  offer_count integer,
  reveal_count integer,
  expires_at timestamptz,
  created_at timestamptz,
  distance_km numeric
)
language sql stable security invoker set search_path = public
as $$
  select 
    f.id, f.customer_id, f.customer_name, f.customer_phone_masked, f.customer_avatar,
    f.start_date, f.end_date, f.seats, f.transmission, f.fuel, f.body_style,
    f.province_id, f.district_id, f.province_name, f.district_name, f.address_text,
    f.lat, f.lng, f.budget_min, f.budget_max, f.budget_negotiable, f.extra_tags,
    f.custom_note, f.content, f.status, f.offer_count, f.reveal_count,
    f.expires_at, f.created_at,
    round((6371 * acos(least(1.0, greatest(-1.0,
      cos(radians(p_lat::float8)) * cos(radians(f.lat::float8)) * cos(radians(f.lng::float8) - radians(p_lng::float8))
      + sin(radians(p_lat::float8)) * sin(radians(f.lat::float8))
    ))))::numeric, 1) as distance_km
  from customer_request_feed f
  where f.lat is not null and f.lng is not null
    and p_lat between -90 and 90 and p_lng between -180 and 180;
$$;

-- ── 7. Hàm Xem liên hệ khách (mở SĐT thật cho chủ xe) ──
create or replace function xem_lien_he_tim_xe(p_request_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_phone text;
  v_zalo text;
  v_name text;
  v_status request_status;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'error', 'chua_dang_nhap');
  end if;

  select customer_phone, coalesce(customer_zalo, customer_phone), customer_name, status
    into v_phone, v_zalo, v_name, v_status
    from customer_requests
   where id = p_request_id and deleted_at is null;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'khong_tim_thay');
  end if;

  if v_status not in ('da_duyet', 'da_tim_thay') and not exists (
    select 1 from user_roles where user_id = v_actor and role in ('admin', 'kiem_duyet')
  ) and v_actor != (select customer_id from customer_requests where id = p_request_id) then
    return jsonb_build_object('ok', false, 'error', 'tin_chua_duyet');
  end if;

  -- Tăng số lượt xem
  update customer_requests
     set reveal_count = reveal_count + 1
   where id = p_request_id;

  return jsonb_build_object(
    'ok', true,
    'phone', v_phone,
    'zalo', v_zalo,
    'name', v_name
  );
end $$;

-- ── 8. Hàm xếp hàng thông báo cho chủ xe lân cận khi duyệt tin ──
create or replace function notify_nearby_owners_on_request(p_request_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_req record;
  v_owner record;
  v_count_inapp int := 0;
  v_count_email int := 0;
  v_title text;
  v_body text;
  v_link text;
  v_loc text;
begin
  select r.*, p.name as prov_name, d.name as dist_name
    into v_req
    from customer_requests r
    left join provinces p on p.id = r.province_id
    left join districts d on d.id = r.district_id
   where r.id = p_request_id and r.status = 'da_duyet' and r.deleted_at is null;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'yeu_cau_khong_hop_le');
  end if;

  v_loc := coalesce(v_req.dist_name, '') || case when v_req.dist_name is not null and v_req.prov_name is not null then ', ' else '' end || coalesce(v_req.prov_name, 'khu vực của bạn');
  v_title := 'Có khách tìm xe ' || coalesce(v_req.seats::text || ' chỗ ', '') || 'tại ' || v_loc;
  v_body := 'Khách thuê từ ' || to_char(v_req.start_date, 'DD/MM') || ' đến ' || to_char(v_req.end_date, 'DD/MM') || '. Bấm để xem và liên hệ ngay!';
  v_link := '/cong-dong?id=' || v_req.id::text;

  -- Quét các chủ xe có xe đang hiển thị cùng tỉnh/thành
  for v_owner in (
    select distinct l.owner_id, u.email, u.is_pro_owner, u.pro_until
      from listings l
      join users u on u.id = l.owner_id
     where l.status = 'dang_hien_thi'
       and l.deleted_at is null
       and l.owner_id != v_req.customer_id
       and (v_req.province_id is null or l.province_id = v_req.province_id)
     limit 100
  ) loop
    -- 1. In-app notification cho mọi chủ xe lân cận
    perform queue_notification(
      v_owner.owner_id,
      'khach_tim_xe_gan',
      v_req.id::text || ':' || v_owner.owner_id::text,
      array['inapp'],
      v_title,
      v_body,
      v_link,
      false,
      'he_thong',
      'van_hanh'
    );
    v_count_inapp := v_count_inapp + 1;

    -- 2. Gửi Email nếu chủ xe có GÓI PRO còn hạn
    if (v_owner.is_pro_owner is true or (v_owner.pro_until is not null and v_owner.pro_until > now())) 
       and v_owner.email is not null and length(v_owner.email) > 5 then
      perform queue_notification(
        v_owner.owner_id,
        'pro_email_tim_xe',
        v_req.id::text || ':email:' || v_owner.owner_id::text,
        array['email'],
        '🚀 [Gói Pro] ' || v_title,
        v_body || ' (Thông báo ưu tiên dành riêng cho chủ xe Gói Pro Thuexenhanh)',
        v_link,
        false,
        'he_thong',
        'van_hanh'
      );
      v_count_email := v_count_email + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'notified_inapp', v_count_inapp,
    'notified_pro_email', v_count_email
  );
end $$;

-- ── 9. Mua Gói Pro bằng Token ──
create or replace function mua_goi_pro(
  p_user_id uuid,
  p_so_thang int,
  p_cost_token int,
  p_idem_key text
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_so_du int;
  v_now timestamptz := now();
  v_new_until timestamptz;
  v_curr_until timestamptz;
begin
  if p_user_id is null or p_user_id != auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'khong_hop_le');
  end if;

  if p_so_thang <= 0 or p_cost_token <= 0 then
    return jsonb_build_object('ok', false, 'error', 'tham_so_sai');
  end if;

  -- Kiểm tra số dư token
  select token_balance into v_so_du from wallets where user_id = p_user_id;
  if coalesce(v_so_du, 0) < p_cost_token then
    return jsonb_build_object('ok', false, 'error', 'khong_du_token', 'balance', coalesce(v_so_du, 0));
  end if;

  -- Tính thời hạn mới
  select pro_until into v_curr_until from users where id = p_user_id;
  if v_curr_until is not null and v_curr_until > v_now then
    v_new_until := v_curr_until + (p_so_thang || ' months')::interval;
  else
    v_new_until := v_now + (p_so_thang || ' months')::interval;
  end if;

  -- Trừ token (idempotent ghi wallet_transactions)
  insert into wallet_transactions (
    user_id, kind, amount, balance_after, note, idempotency_key
  ) values (
    p_user_id, 'tieu', -p_cost_token, v_so_du - p_cost_token,
    'Đăng ký Gói Pro nhận thông báo khách tìm xe (' || p_so_thang || ' tháng)',
    p_idem_key
  ) on conflict (user_id, idempotency_key) do nothing;

  -- Cập nhật wallets
  update wallets
     set token_balance = token_balance - p_cost_token,
         token_da_tieu = token_da_tieu + p_cost_token,
         updated_at = v_now
   where user_id = p_user_id;

  -- Cập nhật users
  update users
     set is_pro_owner = true,
         pro_until = v_new_until,
         updated_at = v_now
   where id = p_user_id;

  return jsonb_build_object(
    'ok', true,
    'pro_until', v_new_until,
    'new_balance', v_so_du - p_cost_token
  );
end $$;

-- ── 10. Phân quyền RLS & Grants ──
alter table customer_requests enable row level security;
alter table customer_request_offers enable row level security;

-- Policies customer_requests:
drop policy if exists cr_read on customer_requests;
create policy cr_read on customer_requests for select
  using (
    status in ('da_duyet', 'da_tim_thay') 
    or customer_id = auth.uid() 
    or has_role('admin') 
    or has_role('kiem_duyet')
  );

drop policy if exists cr_insert on customer_requests;
create policy cr_insert on customer_requests for insert
  with check (customer_id = auth.uid());

drop policy if exists cr_update on customer_requests;
create policy cr_update on customer_requests for update
  using (customer_id = auth.uid() or has_role('admin') or has_role('kiem_duyet'));

-- Policies customer_request_offers:
drop policy if exists cro_read on customer_request_offers;
create policy cro_read on customer_request_offers for select
  using (deleted_at is null);

drop policy if exists cro_insert on customer_request_offers;
create policy cro_insert on customer_request_offers for insert
  with check (owner_id = auth.uid());

grant select on customer_requests to anon, authenticated;
grant insert, update on customer_requests to authenticated;
grant select on customer_request_offers to anon, authenticated;
grant insert, update, delete on customer_request_offers to authenticated;
grant select on customer_request_feed to anon, authenticated;

grant execute on function customer_requests_gan(numeric, numeric) to anon, authenticated;
grant execute on function xem_lien_he_tim_xe(uuid) to authenticated;
grant execute on function mua_goi_pro(uuid, int, int, text) to authenticated;
grant execute on function notify_nearby_owners_on_request(uuid) to authenticated;

commit;
