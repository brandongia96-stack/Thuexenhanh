-- ============================================================
-- Thuexenhanh - schema Postgres (Supabase) - v0.2
-- HOP DONG CHUNG. Chi luong 01 (nen tang) duoc sua file nay.
-- Quy uoc: snake_case tieng Anh - moi bang co id/created_at/updated_at
--          soft delete bang deleted_at - khong xoa cung
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ─────────────────────────────────────────────
-- 0. KIỂU LIỆT KÊ
-- ─────────────────────────────────────────────
create type user_role         as enum ('khach', 'chu_xe', 'kiem_duyet', 'admin');
create type listing_status    as enum ('nhap', 'cho_duyet', 'tu_choi', 'dang_hien_thi', 'sap_het_han', 'het_han', 'an');
create type transmission      as enum ('so_san', 'so_tu_dong');
create type fuel_type         as enum ('xang', 'dau', 'dien', 'hybrid');
create type verify_status     as enum ('chua_gui', 'cho_xet', 'da_xac_minh', 'tu_choi');
-- Sổ ví: chỉ ghi thêm. nap/hoan/tang = tăng; tieu/thu_hoi = giảm.
create type wallet_tx_kind    as enum ('nap', 'tieu', 'hoan', 'thu_hoi', 'tang');
create type topup_status      as enum ('cho_thanh_toan', 'da_thanh_toan', 'that_bai', 'huy');
create type charge_kind       as enum ('dang_tin', 'gia_han', 'day_tin', 'lead');
create type report_status     as enum ('moi', 'dang_xu_ly', 'da_xu_ly', 'bo_qua');
create type moderation_status as enum ('cho_duyet', 'da_duyet', 'tu_choi');
create type notification_kind as enum ('tin_duyet', 'tin_tu_choi', 'sap_het_han', 'het_han', 'nap_thanh_cong', 'tru_token', 'he_thong');
-- Nhật ký phân tích. Là hàng hoá đem bán cho chủ xe -> nằm ở lõi.
create type event_kind        as enum ('view_listing', 'reveal_phone', 'click_call', 'click_zalo', 'search', 'topup', 'renew', 'save_listing');

-- ─────────────────────────────────────────────
-- 1. NGƯỜI DÙNG & PHÂN QUYỀN
-- ─────────────────────────────────────────────
create table users (
  id                uuid primary key references auth.users(id) on delete cascade,
  phone             text unique,
  phone_verified_at timestamptz,
  email             text,
  full_name         text,
  avatar_url        text,
  zalo_phone        text,
  -- Tích xanh: xét theo giấy tờ, MIỄN PHÍ. Không bán. Client không được ghi.
  verify_status     verify_status not null default 'chua_gui',
  verified_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create table user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  role       user_role not null,
  granted_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, role)
);
create index on user_roles (user_id);

-- ─────────────────────────────────────────────
-- 2. DỮ LIỆU TĨNH
-- ─────────────────────────────────────────────
create table brands (
  id         serial primary key,
  name       text not null unique,
  slug       text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table models (
  id         serial primary key,
  brand_id   int not null references brands(id),
  name       text not null,
  slug       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (brand_id, name)
);

create table provinces (
  id         serial primary key,
  name       text not null unique,
  slug       text not null unique,
  is_major   boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table districts (
  id          serial primary key,
  province_id int not null references provinces(id),
  name        text not null,
  slug        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (province_id, name)
);

create table amenities (
  id         serial primary key,
  code       text not null unique,
  name       text not null,
  icon       text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ─────────────────────────────────────────────
-- 3. TIN ĐĂNG
-- ─────────────────────────────────────────────
create table listings (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references users(id),
  status            listing_status not null default 'nhap',
  reject_reason     text,

  brand_id          int references brands(id),
  model_id          int references models(id),
  brand_text        text not null,
  model_text        text not null,
  year              int,
  plate             text,
  color             text,
  seats             int,
  transmission      transmission,
  fuel              fuel_type,
  fuel_consumption  numeric(4,1),
  body_style        text,
  description       text,

  price_per_day     int not null,
  price_per_month   int,
  deposit_note      text,
  delivery_fee_note text,
  limit_km_per_day  int,
  extra_km_fee      int,

  province_id       int references provinces(id),
  district_id       int references districts(id),
  address_text      text,
  lat               numeric(9,6),
  lng               numeric(9,6),

  amenity_codes     text[] not null default '{}',
  -- Số hiện sau khi khách bấm "Xem số điện thoại". KHÔNG có nút đặt xe.
  contact_phone     text not null,
  contact_zalo      text,

  -- Client KHÔNG được ghi 3 cột dưới. Chỉ server/admin.
  is_verified       boolean not null default false,
  published_at      timestamptz,
  expires_at        timestamptz,

  search_tsv        tsvector,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index on listings (status, expires_at);
create index on listings (owner_id);
create index on listings (province_id, district_id);
create index on listings (price_per_day);
create index listings_search_idx on listings using gin (search_tsv);

create table listing_images (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  url        text not null,
  width      int,
  height     int,
  sort_order int not null default 0,
  is_cover   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on listing_images (listing_id, sort_order);

create table listing_blocked_dates (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  date_from  date not null,
  date_to    date not null,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on listing_blocked_dates (listing_id, date_from);

-- Nhật ký vòng đời tin (đổi trạng thái). Khác bảng events (phân tích).
create table listing_events (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  from_status listing_status,
  to_status   listing_status not null,
  actor_id    uuid references users(id),
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on listing_events (listing_id, created_at desc);

create table saved_listings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, listing_id)
);

-- ─────────────────────────────────────────────
-- 4. VÍ TOKEN  (1 token = 4.000d - 10 token/xe/thang)
--    Sổ CHỈ GHI THÊM. Số dư = tổng các dòng, không lưu số dư rời.
-- ─────────────────────────────────────────────
create table wallets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wallet_transactions (
  id         uuid primary key default gen_random_uuid(),
  wallet_id  uuid not null references wallets(id),
  kind       wallet_tx_kind not null,
  -- Dương = vào ví, âm = ra khỏi ví. Luôn là số TOKEN, không phải VNĐ.
  amount     int not null check (amount <> 0),
  topup_id   uuid,
  charge_id  uuid,
  -- Khoá chống trừ trùng. Mọi lần trừ token BẮT BUỘC có idem_key.
  idem_key   text unique,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind in ('nap','hoan','tang') and amount > 0)
      or (kind in ('tieu','thu_hoi')    and amount < 0))
);
create index on wallet_transactions (wallet_id, created_at desc);

-- Sổ chỉ ghi thêm: chặn UPDATE/DELETE ngay ở tầng CSDL.
create or replace function forbid_mutation() returns trigger language plpgsql as $fn$
begin
  raise exception 'Bang % chi duoc ghi them, khong sua khong xoa', tg_table_name;
end $fn$;

create trigger wallet_tx_append_only
  before update or delete on wallet_transactions
  for each row execute function forbid_mutation();

-- token_da_nap = nghĩa vụ nợ - token_da_tieu = doanh thu. Tách bạch.
create view wallet_balances as
select w.id as wallet_id, w.user_id,
       coalesce(sum(t.amount) filter (where t.kind in ('nap','tang')), 0) as token_da_nap,
       coalesce(-sum(t.amount) filter (where t.kind = 'tieu'), 0)         as token_da_tieu,
       coalesce(sum(t.amount), 0)                                        as so_du
from wallets w
left join wallet_transactions t on t.wallet_id = w.id
group by w.id, w.user_id;

create table topups (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  token_amount  int not null check (token_amount > 0),
  vnd_amount    int not null check (vnd_amount > 0),
  status        topup_status not null default 'cho_thanh_toan',
  -- Nội dung chuyển khoản, dùng để đối soát webhook ngân hàng.
  transfer_code text not null unique,
  provider      text,
  provider_ref  text,
  paid_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on topups (user_id, created_at desc);

create table charges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id),
  listing_id   uuid references listings(id),
  kind         charge_kind not null,
  token_amount int not null check (token_amount > 0),
  months       int,
  period_start timestamptz,
  period_end   timestamptz,
  idem_key     text not null unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on charges (user_id, created_at desc);

-- Đẩy tin: bảng dựng sẵn, CHƯA BẬT (luồng 07).
create table boosts (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings(id),
  token_amount int not null check (token_amount > 0),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- ─────────────────────────────────────────────
-- 5. TIN CẬY & KIỂM DUYỆT
-- ─────────────────────────────────────────────
-- Đánh giá THẬT (luồng 09). CẤM seed dữ liệu mẫu vào bảng này.
create table reviews (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  author_id  uuid not null references users(id),
  rating     int not null check (rating between 1 and 5),
  content    text,
  is_public  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (listing_id, author_id)
);

create table reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references listings(id),
  reporter_id uuid references users(id),
  reason_code text not null,
  detail      text,
  status      report_status not null default 'moi',
  handled_by  uuid references users(id),
  handled_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table moderation_queue (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id),
  status      moderation_status not null default 'cho_duyet',
  reviewer_id uuid references users(id),
  reason      text,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on moderation_queue (status, created_at);

create table otp_codes (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  attempts    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on otp_codes (phone, created_at desc);

-- ─────────────────────────────────────────────
-- 6. PHÂN TÍCH & THÔNG BÁO
-- ─────────────────────────────────────────────
create table events (
  id         uuid primary key default gen_random_uuid(),
  kind       event_kind not null,
  listing_id uuid references listings(id),
  -- Lặp lại owner_id để dashboard chủ xe khỏi join. Server ghi, không phải client.
  owner_id   uuid references users(id),
  actor_id   uuid references users(id),
  session_id text,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on events (listing_id, kind, created_at desc);
create index on events (owner_id, created_at desc);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  kind       notification_kind not null,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on notifications (user_id, read_at, created_at desc);

-- Nhật ký admin. KHÔNG ĐƯỢC XOÁ, không được sửa.
create table admin_actions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references users(id),
  action      text not null,
  target_type text,
  target_id   text,
  before_data jsonb,
  after_data  jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger admin_actions_append_only
  before update or delete on admin_actions
  for each row execute function forbid_mutation();

-- ─────────────────────────────────────────────
-- 7. TRIGGER CHUNG
-- ─────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger language plpgsql as $fn$
begin new.updated_at = now(); return new; end $fn$;

do $blk$
declare t text;
begin
  foreach t in array array[
    'users','user_roles','brands','models','provinces','districts','amenities',
    'listings','listing_images','listing_blocked_dates','saved_listings',
    'wallets','topups','charges','boosts',
    'reviews','reports','moderation_queue','otp_codes','notifications'
  ] loop
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $blk$;

-- Full-text tiếng Việt: bỏ dấu rồi đánh chỉ mục.
create or replace function listings_tsv() returns trigger language plpgsql as $fn$
begin
  new.search_tsv := to_tsvector('simple', unaccent(
    coalesce(new.brand_text,'')   || ' ' || coalesce(new.model_text,'') || ' ' ||
    coalesce(new.address_text,'') || ' ' || coalesce(new.description,'')));
  return new;
end $fn$;
create trigger listings_tsv_trg before insert or update on listings
  for each row execute function listings_tsv();

-- ─────────────────────────────────────────────
-- 8. RLS - bật cho MỌI bảng
--    Khách chỉ đọc tin đang hiển thị. Chủ xe chỉ sửa tin của mình.
--    Tiền và is_verified: chỉ server (service_role) được ghi.
-- ─────────────────────────────────────────────
create or replace function has_role(r user_role) returns boolean
language sql stable security definer as $fn$
  select exists (select 1 from user_roles
                 where user_id = auth.uid() and role = r and deleted_at is null)
$fn$;

do $blk$
declare t text;
begin
  foreach t in array array[
    'users','user_roles','brands','models','provinces','districts','amenities',
    'listings','listing_images','listing_blocked_dates','listing_events','saved_listings',
    'wallets','wallet_transactions','topups','charges','boosts',
    'reviews','reports','moderation_queue','otp_codes','events','notifications','admin_actions'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $blk$;

-- Dữ liệu tĩnh: ai cũng đọc, chỉ admin ghi.
do $blk$
declare t text;
begin
  foreach t in array array['brands','models','provinces','districts','amenities'] loop
    execute format('create policy %I on %I for select using (deleted_at is null)', t || '_read', t);
    execute format('create policy %I on %I for all using (has_role(''admin''))', t || '_admin', t);
  end loop;
end $blk$;

create policy users_self_read   on users for select using (id = auth.uid() or has_role('admin'));
create policy users_self_update on users for update using (id = auth.uid()) with check (id = auth.uid());
create policy roles_self_read   on user_roles for select using (user_id = auth.uid() or has_role('admin'));

create policy listings_public_read on listings for select
  using (deleted_at is null and (status in ('dang_hien_thi','sap_het_han')
         or owner_id = auth.uid() or has_role('kiem_duyet') or has_role('admin')));
create policy listings_owner_insert on listings for insert with check (owner_id = auth.uid());
create policy listings_owner_update on listings for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy listings_mod_update   on listings for update using (has_role('kiem_duyet') or has_role('admin'));

create policy images_read  on listing_images for select using (deleted_at is null);
create policy images_owner on listing_images for all
  using (exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));

create policy blocked_read  on listing_blocked_dates for select using (deleted_at is null);
create policy blocked_owner on listing_blocked_dates for all
  using (exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));

create policy listing_events_read on listing_events for select
  using (exists (select 1 from listings l where l.id = listing_id
                 and (l.owner_id = auth.uid() or has_role('kiem_duyet') or has_role('admin'))));

create policy saved_own on saved_listings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- VÍ: client CHỈ ĐỌC. Mọi thao tác ghi đi qua server (service_role bỏ qua RLS).
create policy wallets_own   on wallets for select using (user_id = auth.uid());
create policy wallet_tx_own on wallet_transactions for select
  using (exists (select 1 from wallets w where w.id = wallet_id and w.user_id = auth.uid()));
create policy topups_own    on topups  for select using (user_id = auth.uid());
create policy topups_create on topups  for insert with check (user_id = auth.uid());
create policy charges_own   on charges for select using (user_id = auth.uid());
create policy boosts_read   on boosts  for select using (deleted_at is null);

create policy reviews_read   on reviews for select using (is_public and deleted_at is null);
create policy reviews_author on reviews for all
  using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy reports_create on reports for insert with check (reporter_id = auth.uid());
create policy reports_staff  on reports for select using (has_role('kiem_duyet') or has_role('admin'));
create policy modq_staff     on moderation_queue for all using (has_role('kiem_duyet') or has_role('admin'));
-- OTP: client không đọc được dòng nào. Chỉ server xác thực.
create policy otp_none       on otp_codes for select using (false);

-- Ghi sự kiện: ai cũng ghi. Đọc: chỉ chủ xe của tin đó và admin.
create policy events_insert on events for insert with check (true);
create policy events_read   on events for select using (owner_id = auth.uid() or has_role('admin'));

create policy notif_own      on notifications for select using (user_id = auth.uid());
create policy notif_own_upd  on notifications for update using (user_id = auth.uid());
create policy admin_log_read on admin_actions for select using (has_role('admin'));
