-- ============================================================
-- TẤT CẢ MIGRATION — SINH TỰ ĐỘNG bởi scripts/gop-migration.mjs
-- Đừng sửa tay file này. Sửa file gốc trong supabase/migrations/ rồi chạy lại.
--
-- Cách dùng: mở SQL Editor của Supabase, dán CẢ FILE, bấm Run. Một lần duy nhất.
--
-- Bọc trong BEGIN/COMMIT: lỗi ở bất kỳ đâu là huỷ sạch toàn bộ, CSDL trở lại
-- như trước khi chạy. Không có chuyện vào được một nửa rồi mắc kẹt.
-- Gồm 8 file: 0001_init.sql, 0002_auth_hooks.sql, 0003_seed_static.sql, 0004_billing.sql, 0005_trust.sql, 0006_legal_consent.sql, 0007_notify.sql, 0008_admin.sql
-- ============================================================

begin;

-- ════════════════════════════════════════════════════════════
-- ▼ 0001_init.sql
-- ════════════════════════════════════════════════════════════
do $$ begin raise notice 'Đang chạy: 0001_init.sql'; end $$;

-- SINH TỰ ĐỘNG bởi scripts/gen-migrations.mjs từ contracts/schema.sql
-- Đừng sửa tay file này. Sửa nguồn rồi chạy lại script.

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
-- ── Index bắt buộc (HIEU-NANG.md mục 2.3) ──
-- Phân trang bằng KEYSET, không OFFSET, nên khoá sắp xếp luôn là
-- (published_at desc, id desc) — id nằm trong index để keyset không phải sort lại.
create index listings_province_feed_idx on listings (province_id, status, published_at desc, id desc);
create index listings_feed_idx          on listings (status, published_at desc, id desc);
create index listings_owner_idx         on listings (owner_id, status);
create index listings_search_idx        on listings using gin (search_tsv);
-- Cron quét tin sắp hết hạn / hết hạn.
create index listings_expiry_idx on listings (status, expires_at);
-- Lọc theo khoảng giá, chỉ trên tin còn hiển thị.
-- (price_per_day, id): sắp xếp theo giá cũng phân trang KEYSET, nên id phải nằm
-- trong index, không thì Postgres vẫn phải sort lại từ đầu mỗi trang.
create index listings_price_idx on listings (price_per_day, id)
  where status in ('dang_hien_thi', 'sap_het_han') and deleted_at is null;

-- Mỗi ảnh lưu 4 bản (HIEU-NANG.md muc 1.1). CẤM trả ảnh gốc ra danh sách.
create table listing_images (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  url_thumb   text not null,          -- 400w,  < 25KB  -> thẻ xe
  url_medium  text,                   -- 800w,  < 70KB  -> ảnh bìa trang chi tiết
  url_full    text,                   -- 1600w, < 200KB -> chỉ khi phóng to / lướt slider
  url_original text,                  -- lưu trữ, KHÔNG phục vụ trực tiếp
  -- Ảnh mờ 20px nhúng thẳng dạng base64: hiện ngay, tốn 0 request.
  -- Bắt buộc dưới 1KB. Vượt là vỡ ngân sách JSON của danh sách.
  blur_base64 text check (blur_base64 is null or length(blur_base64) <= 1200),
  width       int,
  height      int,                    -- bắt buộc có để đặt aspect-ratio, tránh vỡ CLS
  sort_order  int not null default 0,
  is_cover    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index on listing_images (listing_id, sort_order);
-- Lấy đúng ảnh bìa cho thẻ xe, không quét hết ảnh của tin.
create unique index listing_images_cover_idx on listing_images (listing_id)
  where is_cover and deleted_at is null;

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

-- ─────────────────────────────────────────────
-- 3b. VIEW listing_card — nguồn DUY NHẤT cho mọi danh sách
--     HIEU-NANG.md mục 2.1: thẻ xe cần ~10 trường. CẤM select * cho danh sách.
--     Mô tả, thông số kỹ thuật, giấy tờ -> chỉ lấy khi mở trang chi tiết.
--     KHÔNG có contact_phone ở đây: số chỉ hiện qua Edge Function reveal-phone.
-- ─────────────────────────────────────────────
create view listing_card with (security_invoker = true) as
select
  l.id,
  l.status,
  l.brand_text,
  l.model_text,
  l.year,
  l.seats,
  l.transmission,
  l.fuel,
  l.price_per_day,
  l.province_id,
  l.district_id,
  l.is_verified,
  l.published_at,
  l.expires_at,
  l.owner_id,
  -- Hai cột dưới KHÔNG để hiển thị, chỉ để LỌC qua PostgREST (luồng 04):
  --   · search_tsv    -> tìm full-text tiếng Việt đã bỏ dấu
  --   · amenity_codes -> lọc tiện nghi
  -- Thiếu chúng ở view thì trang tìm kiếm phải gọi 2 lượt mạng mỗi trang,
  -- vỡ ngân sách 4G (HIEU-NANG.md mục 0). Client luôn liệt kê cột rõ ràng khi
  -- select nên search_tsv không bao giờ bị tải về trong payload.
  l.amenity_codes,
  l.search_tsv,
  -- Ảnh: chỉ bản thumb + blur nhúng sẵn. Tuyệt đối không trả ảnh gốc.
  i.url_thumb   as cover_thumb,
  i.blur_base64 as cover_blur,
  i.width       as cover_width,
  i.height      as cover_height
from listings l
left join lateral (
  select url_thumb, blur_base64, width, height
  from listing_images
  where listing_id = l.id and deleted_at is null
  order by is_cover desc, sort_order
  limit 1
) i on true
where l.deleted_at is null;

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
create view wallet_balances with (security_invoker = true) as
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

-- Bằng chứng người dùng đã đồng ý điều khoản (luồng 12, gộp vào hợp đồng 21/09).
-- CHỈ GHI THÊM: mỗi lần đồng ý là một dòng mới, không sửa dòng cũ. Đổi điều khoản
-- thì tăng `version` và xin đồng ý lại — không được ghi đè lịch sử.
-- Cố ý KHÔNG có `updated_at` (trái quy ước chung): bảng bằng chứng mà có dấu vết
-- sửa đổi thì không còn là bằng chứng. Cũng không có `deleted_at` vì không xoá.
create table user_consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  document    text not null check (document in ('terms', 'privacy', 'refund')),
  version     text not null,
  accepted_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index user_consents_user_idx on user_consents (user_id, document, accepted_at desc);
-- Chặn sửa/xoá ở tầng CSDL, không chỉ dựa vào việc thiếu policy —
-- service_role bỏ qua RLS nhưng không bỏ qua trigger.
create trigger user_consents_append_only
  before update or delete on user_consents
  for each row execute function forbid_mutation();

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
create index events_listing_idx on events (listing_id, kind, created_at desc);
create index events_owner_idx   on events (owner_id, created_at desc);
-- Cron gộp theo ngày rồi dọn bảng thô: quét theo created_at.
create index events_sweep_idx   on events (created_at);

-- Bảng tổng hợp theo ngày (HIEU-NANG.md mục 2.4).
-- Bảng `events` phình nhanh nhất: 1.000 tin x 100 lượt/tháng = 100.000 dòng/tháng.
-- Dashboard chủ xe (luồng 03) và báo cáo admin (luồng 10) ĐỌC TỪ ĐÂY,
-- tuyệt đối không quét bảng events thô.
-- Cron gộp mỗi đêm; bảng thô giữ 90 ngày rồi dọn.
create table events_daily (
  id         uuid primary key default gen_random_uuid(),
  day        date not null,
  listing_id uuid references listings(id) on delete cascade,
  owner_id   uuid references users(id),
  kind       event_kind not null,
  count      int not null default 0 check (count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day, listing_id, kind)
);
create index events_daily_owner_idx   on events_daily (owner_id, day desc);
create index events_daily_listing_idx on events_daily (listing_id, kind, day desc);

-- Gộp một ngày. Chạy lại nhiều lần cho cùng một ngày vẫn ra đúng kết quả
-- (idempotent) — cron chạy trùng không làm số liệu nhân đôi.
create or replace function rollup_events_daily(p_day date default (current_date - 1))
returns int language plpgsql security definer as $fn$
declare n int;
begin
  insert into events_daily (day, listing_id, owner_id, kind, count)
  select p_day, e.listing_id, e.owner_id, e.kind, count(*)
  from events e
  where e.created_at >= p_day and e.created_at < p_day + 1
  group by e.listing_id, e.owner_id, e.kind
  on conflict (day, listing_id, kind)
  do update set count = excluded.count, updated_at = now();
  get diagnostics n = row_count;
  return n;
end $fn$;

-- Dọn bảng thô. Chỉ xoá phần ĐÃ gộp — đây là bảng nhật ký máy sinh ra,
-- không phải dữ liệu người dùng, nên không áp luật soft delete.
create or replace function prune_events(p_keep_days int default 90)
returns int language plpgsql security definer as $fn$
declare n int;
begin
  delete from events
  where created_at < current_date - p_keep_days
    and exists (select 1 from events_daily d
                where d.day = events.created_at::date
                  and d.listing_id is not distinct from events.listing_id
                  and d.kind = events.kind);
  get diagnostics n = row_count;
  return n;
end $fn$;

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
    'reviews','reports','moderation_queue','otp_codes','notifications','events_daily'
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
    'reviews','reports','moderation_queue','otp_codes','user_consents','events','events_daily','notifications','admin_actions'
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

-- Bằng chứng đồng ý điều khoản: mỗi người chỉ thấy và chỉ thêm được dòng của mình.
-- Không có policy update/delete -> client không sửa, không xoá.
create policy user_consents_insert_own on user_consents for insert
  to authenticated with check (user_id = auth.uid());
create policy user_consents_select_own on user_consents for select
  to authenticated using (user_id = auth.uid() or has_role('admin'));

create policy reports_create on reports for insert with check (reporter_id = auth.uid());
create policy reports_staff  on reports for select using (has_role('kiem_duyet') or has_role('admin'));
create policy modq_staff     on moderation_queue for all using (has_role('kiem_duyet') or has_role('admin'));
-- OTP: client không đọc được dòng nào. Chỉ server xác thực.
create policy otp_none       on otp_codes for select using (false);

-- Ghi sự kiện: ai cũng ghi. Đọc: chỉ chủ xe của tin đó và admin.
create policy events_insert on events for insert with check (true);
create policy events_read   on events for select using (owner_id = auth.uid() or has_role('admin'));
-- Bảng tổng hợp: chủ xe đọc số của mình, admin đọc tất cả. Chỉ cron (service_role) ghi.
create policy events_daily_read on events_daily for select
  using (owner_id = auth.uid() or has_role('admin'));

create policy notif_own      on notifications for select using (user_id = auth.uid());
create policy notif_own_upd  on notifications for update using (user_id = auth.uid());
create policy admin_log_read on admin_actions for select using (has_role('admin'));

-- ════════════════════════════════════════════════════════════
-- ▼ 0002_auth_hooks.sql
-- ════════════════════════════════════════════════════════════
do $$ begin raise notice 'Đang chạy: 0002_auth_hooks.sql'; end $$;

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

-- ════════════════════════════════════════════════════════════
-- ▼ 0003_seed_static.sql
-- ════════════════════════════════════════════════════════════
do $$ begin raise notice 'Đang chạy: 0003_seed_static.sql'; end $$;

-- SINH TỰ ĐỘNG bởi scripts/gen-migrations.mjs từ src/data/*.js
-- Đừng sửa tay file này. Sửa nguồn rồi chạy lại script.


-- Hãng xe
insert into brands (name, slug, sort_order) values
  ('Toyota', 'toyota', 0),
  ('Hyundai', 'hyundai', 1),
  ('Kia', 'kia', 2),
  ('Mazda', 'mazda', 3),
  ('Honda', 'honda', 4),
  ('Ford', 'ford', 5),
  ('Mitsubishi', 'mitsubishi', 6),
  ('VinFast', 'vinfast', 7),
  ('Mercedes-Benz', 'mercedes-benz', 8),
  ('BMW', 'bmw', 9),
  ('Audi', 'audi', 10),
  ('Lexus', 'lexus', 11),
  ('Volvo', 'volvo', 12),
  ('Porsche', 'porsche', 13),
  ('Peugeot', 'peugeot', 14),
  ('Subaru', 'subaru', 15),
  ('Nissan', 'nissan', 16),
  ('Suzuki', 'suzuki', 17),
  ('Isuzu', 'isuzu', 18),
  ('MG', 'mg', 19),
  ('Skoda', 'skoda', 20),
  ('Haval', 'haval', 21),
  ('Wuling', 'wuling', 22),
  ('BYD', 'byd', 23),
  ('Chevrolet', 'chevrolet', 24),
  ('Volkswagen', 'volkswagen', 25)
on conflict (name) do nothing;

-- Dòng xe
insert into models (brand_id, name, slug) values
  ((select id from brands where name = 'Toyota'), 'Vios', 'vios'),
  ((select id from brands where name = 'Toyota'), 'Innova', 'innova'),
  ((select id from brands where name = 'Toyota'), 'Innova Cross', 'innova-cross'),
  ((select id from brands where name = 'Toyota'), 'Camry', 'camry'),
  ((select id from brands where name = 'Toyota'), 'Fortuner', 'fortuner'),
  ((select id from brands where name = 'Toyota'), 'Corolla Altis', 'corolla-altis'),
  ((select id from brands where name = 'Toyota'), 'Corolla Cross', 'corolla-cross'),
  ((select id from brands where name = 'Toyota'), 'Yaris', 'yaris'),
  ((select id from brands where name = 'Toyota'), 'Yaris Cross', 'yaris-cross'),
  ((select id from brands where name = 'Toyota'), 'Raize', 'raize'),
  ((select id from brands where name = 'Toyota'), 'Hilux', 'hilux'),
  ((select id from brands where name = 'Toyota'), 'Land Cruiser', 'land-cruiser'),
  ((select id from brands where name = 'Toyota'), 'Land Cruiser Prado', 'land-cruiser-prado'),
  ((select id from brands where name = 'Toyota'), 'Alphard', 'alphard'),
  ((select id from brands where name = 'Toyota'), 'Avanza Premio', 'avanza-premio'),
  ((select id from brands where name = 'Toyota'), 'Veloz Cross', 'veloz-cross'),
  ((select id from brands where name = 'Hyundai'), 'Grand i10', 'grand-i10'),
  ((select id from brands where name = 'Hyundai'), 'Accent', 'accent'),
  ((select id from brands where name = 'Hyundai'), 'Elantra', 'elantra'),
  ((select id from brands where name = 'Hyundai'), 'Creta', 'creta'),
  ((select id from brands where name = 'Hyundai'), 'Tucson', 'tucson'),
  ((select id from brands where name = 'Hyundai'), 'Santa Fe', 'santa-fe'),
  ((select id from brands where name = 'Hyundai'), 'Palisade', 'palisade'),
  ((select id from brands where name = 'Hyundai'), 'Stargazer', 'stargazer'),
  ((select id from brands where name = 'Hyundai'), 'Custin', 'custin'),
  ((select id from brands where name = 'Hyundai'), 'Ioniq 5', 'ioniq-5'),
  ((select id from brands where name = 'Hyundai'), 'Venue', 'venue'),
  ((select id from brands where name = 'Hyundai'), 'Kona', 'kona'),
  ((select id from brands where name = 'Hyundai'), 'Solati', 'solati'),
  ((select id from brands where name = 'Kia'), 'Morning', 'morning'),
  ((select id from brands where name = 'Kia'), 'Soluto', 'soluto'),
  ((select id from brands where name = 'Kia'), 'K3', 'k3'),
  ((select id from brands where name = 'Kia'), 'K5', 'k5'),
  ((select id from brands where name = 'Kia'), 'Sonet', 'sonet'),
  ((select id from brands where name = 'Kia'), 'Seltos', 'seltos'),
  ((select id from brands where name = 'Kia'), 'Sportage', 'sportage'),
  ((select id from brands where name = 'Kia'), 'Sorento', 'sorento'),
  ((select id from brands where name = 'Kia'), 'Carnival', 'carnival'),
  ((select id from brands where name = 'Kia'), 'Carens', 'carens'),
  ((select id from brands where name = 'Kia'), 'Cerato', 'cerato'),
  ((select id from brands where name = 'Kia'), 'Sedona', 'sedona'),
  ((select id from brands where name = 'Mazda'), 'Mazda 2', 'mazda-2'),
  ((select id from brands where name = 'Mazda'), 'Mazda 3', 'mazda-3'),
  ((select id from brands where name = 'Mazda'), 'Mazda 6', 'mazda-6'),
  ((select id from brands where name = 'Mazda'), 'CX-3', 'cx-3'),
  ((select id from brands where name = 'Mazda'), 'CX-30', 'cx-30'),
  ((select id from brands where name = 'Mazda'), 'CX-5', 'cx-5'),
  ((select id from brands where name = 'Mazda'), 'CX-8', 'cx-8'),
  ((select id from brands where name = 'Mazda'), 'BT-50', 'bt-50'),
  ((select id from brands where name = 'Honda'), 'Brio', 'brio'),
  ((select id from brands where name = 'Honda'), 'City', 'city'),
  ((select id from brands where name = 'Honda'), 'Civic', 'civic'),
  ((select id from brands where name = 'Honda'), 'Accord', 'accord'),
  ((select id from brands where name = 'Honda'), 'HR-V', 'hr-v'),
  ((select id from brands where name = 'Honda'), 'CR-V', 'cr-v'),
  ((select id from brands where name = 'Honda'), 'BR-V', 'br-v'),
  ((select id from brands where name = 'Ford'), 'Ranger', 'ranger'),
  ((select id from brands where name = 'Ford'), 'Everest', 'everest'),
  ((select id from brands where name = 'Ford'), 'Explorer', 'explorer'),
  ((select id from brands where name = 'Ford'), 'Territory', 'territory'),
  ((select id from brands where name = 'Ford'), 'Transit', 'transit'),
  ((select id from brands where name = 'Ford'), 'EcoSport', 'ecosport'),
  ((select id from brands where name = 'Ford'), 'Focus', 'focus'),
  ((select id from brands where name = 'Mitsubishi'), 'Attrage', 'attrage'),
  ((select id from brands where name = 'Mitsubishi'), 'Xpander', 'xpander'),
  ((select id from brands where name = 'Mitsubishi'), 'Xpander Cross', 'xpander-cross'),
  ((select id from brands where name = 'Mitsubishi'), 'Outlander', 'outlander'),
  ((select id from brands where name = 'Mitsubishi'), 'Pajero Sport', 'pajero-sport'),
  ((select id from brands where name = 'Mitsubishi'), 'Triton', 'triton'),
  ((select id from brands where name = 'VinFast'), 'Fadil', 'fadil'),
  ((select id from brands where name = 'VinFast'), 'VF 3', 'vf-3'),
  ((select id from brands where name = 'VinFast'), 'VF 5', 'vf-5'),
  ((select id from brands where name = 'VinFast'), 'VF e34', 'vf-e34'),
  ((select id from brands where name = 'VinFast'), 'VF 6', 'vf-6'),
  ((select id from brands where name = 'VinFast'), 'VF 7', 'vf-7'),
  ((select id from brands where name = 'VinFast'), 'VF 8', 'vf-8'),
  ((select id from brands where name = 'VinFast'), 'VF 9', 'vf-9'),
  ((select id from brands where name = 'VinFast'), 'Lux A2.0', 'lux-a2-0'),
  ((select id from brands where name = 'VinFast'), 'Lux SA2.0', 'lux-sa2-0'),
  ((select id from brands where name = 'VinFast'), 'President', 'president'),
  ((select id from brands where name = 'Mercedes-Benz'), 'C-Class', 'c-class'),
  ((select id from brands where name = 'Mercedes-Benz'), 'E-Class', 'e-class'),
  ((select id from brands where name = 'Mercedes-Benz'), 'S-Class', 's-class'),
  ((select id from brands where name = 'Mercedes-Benz'), 'GLC', 'glc'),
  ((select id from brands where name = 'Mercedes-Benz'), 'GLE', 'gle'),
  ((select id from brands where name = 'Mercedes-Benz'), 'GLS', 'gls'),
  ((select id from brands where name = 'Mercedes-Benz'), 'Maybach', 'maybach'),
  ((select id from brands where name = 'Mercedes-Benz'), 'G-Class', 'g-class'),
  ((select id from brands where name = 'Mercedes-Benz'), 'V-Class', 'v-class'),
  ((select id from brands where name = 'Mercedes-Benz'), 'EQB', 'eqb'),
  ((select id from brands where name = 'Mercedes-Benz'), 'EQE', 'eqe'),
  ((select id from brands where name = 'Mercedes-Benz'), 'EQS', 'eqs'),
  ((select id from brands where name = 'BMW'), '3 Series', '3-series'),
  ((select id from brands where name = 'BMW'), '5 Series', '5-series'),
  ((select id from brands where name = 'BMW'), '7 Series', '7-series'),
  ((select id from brands where name = 'BMW'), 'X3', 'x3'),
  ((select id from brands where name = 'BMW'), 'X4', 'x4'),
  ((select id from brands where name = 'BMW'), 'X5', 'x5'),
  ((select id from brands where name = 'BMW'), 'X6', 'x6'),
  ((select id from brands where name = 'BMW'), 'X7', 'x7'),
  ((select id from brands where name = 'BMW'), 'Z4', 'z4'),
  ((select id from brands where name = 'BMW'), 'i4', 'i4'),
  ((select id from brands where name = 'BMW'), 'i7', 'i7'),
  ((select id from brands where name = 'BMW'), 'iX3', 'ix3'),
  ((select id from brands where name = 'Audi'), 'A3', 'a3'),
  ((select id from brands where name = 'Audi'), 'A4', 'a4'),
  ((select id from brands where name = 'Audi'), 'A6', 'a6'),
  ((select id from brands where name = 'Audi'), 'A8', 'a8'),
  ((select id from brands where name = 'Audi'), 'Q2', 'q2'),
  ((select id from brands where name = 'Audi'), 'Q3', 'q3'),
  ((select id from brands where name = 'Audi'), 'Q5', 'q5'),
  ((select id from brands where name = 'Audi'), 'Q7', 'q7'),
  ((select id from brands where name = 'Audi'), 'Q8', 'q8'),
  ((select id from brands where name = 'Audi'), 'e-tron', 'e-tron'),
  ((select id from brands where name = 'Lexus'), 'ES', 'es'),
  ((select id from brands where name = 'Lexus'), 'LS', 'ls'),
  ((select id from brands where name = 'Lexus'), 'NX', 'nx'),
  ((select id from brands where name = 'Lexus'), 'RX', 'rx'),
  ((select id from brands where name = 'Lexus'), 'GX', 'gx'),
  ((select id from brands where name = 'Lexus'), 'LX', 'lx'),
  ((select id from brands where name = 'Lexus'), 'LM', 'lm'),
  ((select id from brands where name = 'Lexus'), 'IS', 'is'),
  ((select id from brands where name = 'Volvo'), 'XC40', 'xc40'),
  ((select id from brands where name = 'Volvo'), 'XC60', 'xc60'),
  ((select id from brands where name = 'Volvo'), 'XC90', 'xc90'),
  ((select id from brands where name = 'Volvo'), 'S90', 's90'),
  ((select id from brands where name = 'Volvo'), 'V60', 'v60'),
  ((select id from brands where name = 'Porsche'), 'Macan', 'macan'),
  ((select id from brands where name = 'Porsche'), 'Cayenne', 'cayenne'),
  ((select id from brands where name = 'Porsche'), 'Panamera', 'panamera'),
  ((select id from brands where name = 'Porsche'), 'Taycan', 'taycan'),
  ((select id from brands where name = 'Porsche'), '911', '911'),
  ((select id from brands where name = 'Peugeot'), '2008', '2008'),
  ((select id from brands where name = 'Peugeot'), '3008', '3008'),
  ((select id from brands where name = 'Peugeot'), '5008', '5008'),
  ((select id from brands where name = 'Peugeot'), '408', '408'),
  ((select id from brands where name = 'Peugeot'), 'Traveller', 'traveller'),
  ((select id from brands where name = 'Subaru'), 'Forester', 'forester'),
  ((select id from brands where name = 'Subaru'), 'Outback', 'outback'),
  ((select id from brands where name = 'Subaru'), 'BRZ', 'brz'),
  ((select id from brands where name = 'Subaru'), 'WRX', 'wrx'),
  ((select id from brands where name = 'Nissan'), 'Almera', 'almera'),
  ((select id from brands where name = 'Nissan'), 'Kicks', 'kicks'),
  ((select id from brands where name = 'Nissan'), 'Navara', 'navara'),
  ((select id from brands where name = 'Nissan'), 'Terra', 'terra'),
  ((select id from brands where name = 'Suzuki'), 'Swift', 'swift'),
  ((select id from brands where name = 'Suzuki'), 'Ertiga', 'ertiga'),
  ((select id from brands where name = 'Suzuki'), 'XL7', 'xl7'),
  ((select id from brands where name = 'Suzuki'), 'Jimny', 'jimny'),
  ((select id from brands where name = 'Suzuki'), 'Ciaz', 'ciaz'),
  ((select id from brands where name = 'Suzuki'), 'Blind Van', 'blind-van'),
  ((select id from brands where name = 'Isuzu'), 'D-Max', 'd-max'),
  ((select id from brands where name = 'Isuzu'), 'mu-X', 'mu-x'),
  ((select id from brands where name = 'MG'), 'MG5', 'mg5'),
  ((select id from brands where name = 'MG'), 'ZS', 'zs'),
  ((select id from brands where name = 'MG'), 'HS', 'hs'),
  ((select id from brands where name = 'MG'), 'RX5', 'rx5'),
  ((select id from brands where name = 'Skoda'), 'Karoq', 'karoq'),
  ((select id from brands where name = 'Skoda'), 'Kodiaq', 'kodiaq'),
  ((select id from brands where name = 'Haval'), 'H6', 'h6'),
  ((select id from brands where name = 'Wuling'), 'HongGuang MiniEV', 'hongguang-miniev'),
  ((select id from brands where name = 'BYD'), 'Atto 3', 'atto-3'),
  ((select id from brands where name = 'BYD'), 'Dolphin', 'dolphin'),
  ((select id from brands where name = 'BYD'), 'Seal', 'seal'),
  ((select id from brands where name = 'Chevrolet'), 'Colorado', 'colorado'),
  ((select id from brands where name = 'Chevrolet'), 'Trailblazer', 'trailblazer'),
  ((select id from brands where name = 'Chevrolet'), 'Cruze', 'cruze'),
  ((select id from brands where name = 'Chevrolet'), 'Spark', 'spark'),
  ((select id from brands where name = 'Volkswagen'), 'Teramont', 'teramont'),
  ((select id from brands where name = 'Volkswagen'), 'Tiguan', 'tiguan'),
  ((select id from brands where name = 'Volkswagen'), 'Touareg', 'touareg'),
  ((select id from brands where name = 'Volkswagen'), 'Virtus', 'virtus'),
  ((select id from brands where name = 'Volkswagen'), 'T-Cross', 't-cross')
on conflict (brand_id, name) do nothing;

-- Tỉnh/thành
insert into provinces (name, slug, is_major, sort_order) values
  ('TP.HCM', 'tp-hcm', true, 0),
  ('Hà Nội', 'ha-noi', true, 1),
  ('Đà Nẵng', 'da-nang', true, 2),
  ('Hải Phòng', 'hai-phong', true, 3),
  ('Cần Thơ', 'can-tho', true, 4),
  ('Bà Rịa - Vũng Tàu', 'ba-ria-vung-tau', false, 5),
  ('Bình Dương', 'binh-duong', false, 6),
  ('Đồng Nai', 'dong-nai', false, 7),
  ('Khánh Hòa', 'khanh-hoa', false, 8),
  ('Lâm Đồng', 'lam-dong', false, 9),
  ('Quảng Ninh', 'quang-ninh', false, 10),
  ('Thanh Hóa', 'thanh-hoa', false, 11),
  ('Nghệ An', 'nghe-an', false, 12),
  ('Thừa Thiên Huế', 'thua-thien-hue', false, 13),
  ('Quảng Nam', 'quang-nam', false, 14),
  ('Bình Định', 'binh-dinh', false, 15),
  ('Phú Yên', 'phu-yen', false, 16),
  ('Bình Thuận', 'binh-thuan', false, 17),
  ('Ninh Thuận', 'ninh-thuan', false, 18),
  ('Gia Lai', 'gia-lai', false, 19),
  ('Đắk Lắk', 'dak-lak', false, 20),
  ('Lào Cai', 'lao-cai', false, 21),
  ('Vĩnh Phúc', 'vinh-phuc', false, 22),
  ('Bắc Ninh', 'bac-ninh', false, 23),
  ('Hải Dương', 'hai-duong', false, 24),
  ('Hưng Yên', 'hung-yen', false, 25),
  ('Nam Định', 'nam-dinh', false, 26),
  ('Thái Bình', 'thai-binh', false, 27),
  ('Ninh Bình', 'ninh-binh', false, 28),
  ('Long An', 'long-an', false, 29),
  ('Tiền Giang', 'tien-giang', false, 30),
  ('Kiên Giang', 'kien-giang', false, 31),
  ('An Giang', 'an-giang', false, 32),
  ('Sóc Trăng', 'soc-trang', false, 33),
  ('Cà Mau', 'ca-mau', false, 34),
  ('Đắk Nông', 'dak-nong', false, 35),
  ('Kon Tum', 'kon-tum', false, 36),
  ('Bình Phước', 'binh-phuoc', false, 37),
  ('Tây Ninh', 'tay-ninh', false, 38)
on conflict (name) do nothing;

-- Quận/huyện (chỉ 5 thành phố lớn)
insert into districts (province_id, name, slug) values
  ((select id from provinces where name = 'TP.HCM'), 'Quận 1', 'quan-1'),
  ((select id from provinces where name = 'TP.HCM'), 'Quận 3', 'quan-3'),
  ((select id from provinces where name = 'TP.HCM'), 'Quận 4', 'quan-4'),
  ((select id from provinces where name = 'TP.HCM'), 'Quận 5', 'quan-5'),
  ((select id from provinces where name = 'TP.HCM'), 'Quận 6', 'quan-6'),
  ((select id from provinces where name = 'TP.HCM'), 'Quận 7', 'quan-7'),
  ((select id from provinces where name = 'TP.HCM'), 'Quận 8', 'quan-8'),
  ((select id from provinces where name = 'TP.HCM'), 'Quận 10', 'quan-10'),
  ((select id from provinces where name = 'TP.HCM'), 'Quận 11', 'quan-11'),
  ((select id from provinces where name = 'TP.HCM'), 'Quận 12', 'quan-12'),
  ((select id from provinces where name = 'TP.HCM'), 'Bình Thạnh', 'binh-thanh'),
  ((select id from provinces where name = 'TP.HCM'), 'Gò Vấp', 'go-vap'),
  ((select id from provinces where name = 'TP.HCM'), 'Phú Nhuận', 'phu-nhuan'),
  ((select id from provinces where name = 'TP.HCM'), 'Tân Bình', 'tan-binh'),
  ((select id from provinces where name = 'TP.HCM'), 'Tân Phú', 'tan-phu'),
  ((select id from provinces where name = 'TP.HCM'), 'Bình Tân', 'binh-tan'),
  ((select id from provinces where name = 'TP.HCM'), 'Bình Chánh', 'binh-chanh'),
  ((select id from provinces where name = 'TP.HCM'), 'Cần Giờ', 'can-gio'),
  ((select id from provinces where name = 'TP.HCM'), 'Củ Chi', 'cu-chi'),
  ((select id from provinces where name = 'TP.HCM'), 'Hóc Môn', 'hoc-mon'),
  ((select id from provinces where name = 'TP.HCM'), 'Nhà Bè', 'nha-be'),
  ((select id from provinces where name = 'TP.HCM'), 'Thủ Đức', 'thu-duc'),
  ((select id from provinces where name = 'Hà Nội'), 'Hoàn Kiếm', 'hoan-kiem'),
  ((select id from provinces where name = 'Hà Nội'), 'Ba Đình', 'ba-dinh'),
  ((select id from provinces where name = 'Hà Nội'), 'Đống Đa', 'dong-da'),
  ((select id from provinces where name = 'Hà Nội'), 'Hai Bà Trưng', 'hai-ba-trung'),
  ((select id from provinces where name = 'Hà Nội'), 'Hoàng Mai', 'hoang-mai'),
  ((select id from provinces where name = 'Hà Nội'), 'Long Biên', 'long-bien'),
  ((select id from provinces where name = 'Hà Nội'), 'Tây Hồ', 'tay-ho'),
  ((select id from provinces where name = 'Hà Nội'), 'Cầu Giấy', 'cau-giay'),
  ((select id from provinces where name = 'Hà Nội'), 'Thanh Xuân', 'thanh-xuan'),
  ((select id from provinces where name = 'Hà Nội'), 'Hà Đông', 'ha-dong'),
  ((select id from provinces where name = 'Hà Nội'), 'Đông Anh', 'dong-anh'),
  ((select id from provinces where name = 'Hà Nội'), 'Gia Lâm', 'gia-lam'),
  ((select id from provinces where name = 'Hà Nội'), 'Sóc Sơn', 'soc-son'),
  ((select id from provinces where name = 'Hà Nội'), 'Từ Liêm', 'tu-liem'),
  ((select id from provinces where name = 'Hà Nội'), 'Thường Tín', 'thuong-tin'),
  ((select id from provinces where name = 'Hà Nội'), 'Mê Linh', 'me-linh'),
  ((select id from provinces where name = 'Đà Nẵng'), 'Hải Châu', 'hai-chau'),
  ((select id from provinces where name = 'Đà Nẵng'), 'Thanh Khê', 'thanh-khe'),
  ((select id from provinces where name = 'Đà Nẵng'), 'Liên Chiểu', 'lien-chieu'),
  ((select id from provinces where name = 'Đà Nẵng'), 'Ngũ Hành Sơn', 'ngu-hanh-son'),
  ((select id from provinces where name = 'Đà Nẵng'), 'Sơn Trà', 'son-tra'),
  ((select id from provinces where name = 'Đà Nẵng'), 'Cẩm Lệ', 'cam-le'),
  ((select id from provinces where name = 'Đà Nẵng'), 'Hòa Vang', 'hoa-vang'),
  ((select id from provinces where name = 'Hải Phòng'), 'Hồng Bàng', 'hong-bang'),
  ((select id from provinces where name = 'Hải Phòng'), 'Ngô Quyền', 'ngo-quyen'),
  ((select id from provinces where name = 'Hải Phòng'), 'Lê Chân', 'le-chan'),
  ((select id from provinces where name = 'Hải Phòng'), 'Kiến An', 'kien-an'),
  ((select id from provinces where name = 'Hải Phòng'), 'Hải An', 'hai-an'),
  ((select id from provinces where name = 'Hải Phòng'), 'Đồ Sơn', 'do-son'),
  ((select id from provinces where name = 'Hải Phòng'), 'Dương Kinh', 'duong-kinh'),
  ((select id from provinces where name = 'Hải Phòng'), 'Thuỷ Nguyên', 'thuy-nguyen'),
  ((select id from provinces where name = 'Hải Phòng'), 'An Dương', 'an-duong'),
  ((select id from provinces where name = 'Hải Phòng'), 'An Lão', 'an-lao'),
  ((select id from provinces where name = 'Hải Phòng'), 'Kiến Thụy', 'kien-thuy'),
  ((select id from provinces where name = 'Hải Phòng'), 'Tiên Lãng', 'tien-lang'),
  ((select id from provinces where name = 'Hải Phòng'), 'Vĩnh Bảo', 'vinh-bao'),
  ((select id from provinces where name = 'Hải Phòng'), 'Cát Hải', 'cat-hai'),
  ((select id from provinces where name = 'Cần Thơ'), 'Ninh Kiều', 'ninh-kieu'),
  ((select id from provinces where name = 'Cần Thơ'), 'Bình Thủy', 'binh-thuy'),
  ((select id from provinces where name = 'Cần Thơ'), 'Cái Răng', 'cai-rang'),
  ((select id from provinces where name = 'Cần Thơ'), 'Ô Môn', 'o-mon'),
  ((select id from provinces where name = 'Cần Thơ'), 'Thốt Nốt', 'thot-not'),
  ((select id from provinces where name = 'Cần Thơ'), 'Phong Điền', 'phong-dien'),
  ((select id from provinces where name = 'Cần Thơ'), 'Cờ Đỏ', 'co-do'),
  ((select id from provinces where name = 'Cần Thơ'), 'Thới Lai', 'thoi-lai'),
  ((select id from provinces where name = 'Cần Thơ'), 'Vĩnh Thạnh', 'vinh-thanh')
on conflict (province_id, name) do nothing;

-- Tiện nghi
insert into amenities (code, name, icon, sort_order) values
  ('ban_do', 'Bản đồ', 'Map', 0),
  ('camera_360', 'Camera 360', 'Aperture', 1),
  ('cam_hanh_trinh', 'Camera hành trình', 'Video', 2),
  ('cam_lui', 'Camera lùi', 'CameraOff', 3),
  ('cam_bien_lop', 'Cảm biến lốp', 'Gauge', 4),
  ('gps', 'Định vị GPS', 'Navigation', 5),
  ('etc', 'Thu phí không dừng (ETC)', 'CreditCard', 6),
  ('tui_khi', 'Túi khí an toàn', 'ShieldCheck', 7),
  ('lop_du_phong', 'Lốp dự phòng', 'CircleDot', 8),
  ('cam_bien_va_cham', 'Cảm biến va chạm', 'Radar', 9),
  ('cua_so_troi', 'Cửa sổ trời', 'Sun', 10),
  ('adas', 'Hỗ trợ lái ADAS', 'Cpu', 11),
  ('ghe_da', 'Ghế da', 'Armchair', 12)
on conflict (code) do nothing;

-- ════════════════════════════════════════════════════════════
-- ▼ 0004_billing.sql
-- ════════════════════════════════════════════════════════════
do $$ begin raise notice 'Đang chạy: 0004_billing.sql'; end $$;

-- ============================================================
-- Luồng 06 — VÍ TOKEN: hàm phía server. Chạy SAU 0001, 0002, 0003.
-- Độc lập với `0005_trust.sql` (luồng 08) — hai file không đụng nhau.
--
-- PHẢI chạy TRƯỚC `0007_notify.sql` và `0008_admin.sql`: cả hai gọi
-- `wallet_so_du()` được định nghĩa ở file này.
--
-- Luồng 01 đã rà và chuyển file này từ `src/modules/billing/server/`
-- vào đây ngày 21/09 để thứ tự migration chạy được một mạch.
--
-- KHÔNG sửa bảng nào của contracts/schema.sql. File này chỉ THÊM:
--   · hàm security definer để service_role gọi từ Edge Function
--   · view sổ ví có cột "số dư sau" tính bằng cửa sổ trượt
--   · trigger chặn số dư âm
--   · hàm đối soát + hàm cron hết hạn
--
-- Sáu luật kế toán (LUONG-CHAT/06-vi-token.md) được cưỡng chế ở đây,
-- không phải chỉ "nhớ mà làm đúng" trong JavaScript:
--   1. Sổ chỉ ghi thêm       -> trigger wallet_tx_append_only (đã có ở 0001)
--   2. Số dư = tổng các dòng -> wallet_so_du(), view wallet_balances. Không có cột balance.
--   3. Tách nạp / tiêu       -> view wallet_balances (đã có ở 0001)
--   4. Mỗi dòng đủ thông tin -> view wallet_ledger: loại, số token, SỐ DƯ SAU, lý do, tham chiếu, thời điểm
--   5. Trừ/cộng idempotent   -> unique(idem_key) trên sổ + kiểm tra charges.idem_key
--   6. Client không ghi ví   -> mọi hàm dưới đây revoke khỏi anon/authenticated
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. ĐỌC SỐ DƯ — nguồn sự thật duy nhất
-- ─────────────────────────────────────────────
-- Số dư KHÔNG BAO GIỜ được lưu rời thành một cột rồi tự cộng trừ.
-- Lệch một dòng là mất dấu vết vĩnh viễn. Luôn cộng lại từ sổ.
create or replace function wallet_so_du(p_user_id uuid) returns int
language sql stable security definer set search_path = public as $fn$
  select coalesce(sum(t.amount), 0)::int
  from wallets w
  left join wallet_transactions t on t.wallet_id = w.id
  where w.user_id = p_user_id
$fn$;

-- Ví có thể chưa tồn tại nếu tài khoản được tạo trước trigger 0002.
create or replace function ensure_wallet(p_user_id uuid) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare v_id uuid;
begin
  select id into v_id from wallets where user_id = p_user_id;
  if v_id is null then
    insert into wallets (user_id) values (p_user_id)
    on conflict (user_id) do update set updated_at = now()
    returning id into v_id;
  end if;
  return v_id;
end $fn$;

-- ─────────────────────────────────────────────
-- 2. SỔ VÍ CHO NGƯỜI DÙNG XEM
--    Luật 4 đòi mỗi dòng phải có "số dư sau". Schema KHÔNG có cột đó —
--    và đó là chủ ý: cột lưu sẵn sẽ sai khi có dòng chèn muộn. Tính bằng
--    cửa sổ trượt lúc đọc thì luôn khớp với tổng sổ, không thể lệch.
--    security_invoker -> RLS của wallet_transactions vẫn áp: chỉ thấy ví mình.
-- ─────────────────────────────────────────────
create or replace view wallet_ledger with (security_invoker = true) as
select
  t.id,
  w.user_id,
  t.wallet_id,
  t.kind,
  t.amount,
  sum(t.amount) over (partition by t.wallet_id
                      order by t.created_at, t.id
                      rows between unbounded preceding and current row)::int as so_du_sau,
  t.note,
  t.topup_id,
  t.charge_id,
  c.listing_id,
  c.kind as charge_kind,
  t.created_at
from wallet_transactions t
join wallets w on w.id = t.wallet_id
left join charges c on c.id = t.charge_id;

-- ─────────────────────────────────────────────
-- 3. CẤM SỐ DƯ ÂM
--    Hàng phòng thủ thứ hai. Hàng thứ nhất là khoá dòng ví trong
--    charge_and_publish. Nếu có ai đó viết đường trừ token mới mà quên
--    kiểm tra số dư, tầng này chặn — không phải code review chặn.
-- ─────────────────────────────────────────────
create or replace function check_wallet_non_negative() returns trigger
language plpgsql set search_path = public as $fn$
declare v_so_du int;
begin
  select coalesce(sum(amount), 0) into v_so_du
  from wallet_transactions where wallet_id = new.wallet_id;
  if v_so_du < 0 then
    raise exception 'So du vi % se bi am (%). Giao dich bi tu choi.', new.wallet_id, v_so_du
      using errcode = 'check_violation';
  end if;
  return null;
end $fn$;

drop trigger if exists wallet_tx_non_negative on wallet_transactions;
create trigger wallet_tx_non_negative
  after insert on wallet_transactions
  for each row execute function check_wallet_non_negative();

-- ─────────────────────────────────────────────
-- 4. CỘNG TOKEN KHI TIỀN VỀ  (webhook ngân hàng gọi)
--
--    Idempotent theo mã giao dịch của nhà cung cấp. Webhook bắn 2 lần,
--    10 lần, hay bắn lại sau 3 ngày -> vẫn chỉ đúng MỘT dòng sổ, vì
--    wallet_transactions.idem_key là UNIQUE và ta để CSDL từ chối bản thứ hai
--    thay vì tự đi kiểm tra "đã có chưa" (kiểm tra kiểu đó thua race condition).
-- ─────────────────────────────────────────────
create or replace function credit_topup(
  p_topup_id     uuid,
  p_provider     text,
  p_provider_ref text,
  p_vnd_received int default null
) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  v_topup  topups%rowtype;
  v_wallet uuid;
  v_idem   text;
  v_tx     uuid;
begin
  if p_provider_ref is null or length(trim(p_provider_ref)) = 0 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le',
                              'message', 'Thiếu mã giao dịch ngân hàng');
  end if;

  select * into v_topup from topups where id = p_topup_id for update;
  if not found then
    return jsonb_build_object('error', 'khong_tim_thay',
                              'message', 'Không tìm thấy yêu cầu nạp');
  end if;

  -- Trả thiếu thì KHÔNG cộng. Ghi nhận để người thật xử lý, không tự đoán ý.
  if p_vnd_received is not null and p_vnd_received < v_topup.vnd_amount then
    return jsonb_build_object('error', 'sai_so_tien',
                              'message', 'Số tiền nhận được nhỏ hơn số tiền của yêu cầu nạp',
                              'da_nhan', p_vnd_received, 'can_co', v_topup.vnd_amount);
  end if;

  v_wallet := ensure_wallet(v_topup.user_id);
  v_idem   := 'topup:' || coalesce(p_provider, 'bank') || ':' || p_provider_ref;

  -- Chuyển khoản dư thì vẫn chỉ cộng đúng số token đã đặt. Phần dư ghi vào note,
  -- không âm thầm quy đổi thành token — tiền của người ta, phải nói rõ.
  insert into wallet_transactions (wallet_id, kind, amount, topup_id, idem_key, note)
  values (v_wallet, 'nap', v_topup.token_amount, v_topup.id, v_idem,
          'Nạp ' || v_topup.token_amount || ' token · mã ' || v_topup.transfer_code ||
          case when p_vnd_received is not null and p_vnd_received > v_topup.vnd_amount
               then ' · chuyển dư ' || (p_vnd_received - v_topup.vnd_amount) || 'đ, chưa quy đổi'
               else '' end)
  on conflict (idem_key) do nothing
  returning id into v_tx;

  if v_tx is null then
    -- Webhook gửi lại. Không cộng lần hai. Không coi là lỗi.
    return jsonb_build_object('da_xu_ly', true, 'topup_id', v_topup.id,
                              'so_du', wallet_so_du(v_topup.user_id));
  end if;

  update topups
     set status = 'da_thanh_toan', paid_at = now(),
         provider = coalesce(p_provider, provider), provider_ref = p_provider_ref
   where id = v_topup.id and status = 'cho_thanh_toan';

  insert into notifications (user_id, kind, title, body, link)
  values (v_topup.user_id, 'nap_thanh_cong',
          'Đã cộng ' || v_topup.token_amount || ' token',
          'Yêu cầu nạp ' || v_topup.transfer_code || ' đã được ghi nhận.',
          '/chu-xe/vi');

  insert into events (kind, actor_id, meta)
  values ('topup', v_topup.user_id,
          jsonb_build_object('topup_id', v_topup.id, 'token', v_topup.token_amount));

  return jsonb_build_object('da_xu_ly', false, 'topup_id', v_topup.id,
                            'token_credited', v_topup.token_amount,
                            'so_du', wallet_so_du(v_topup.user_id));
end $fn$;

-- ─────────────────────────────────────────────
-- 5. TRỪ TOKEN + BẬT HIỂN THỊ  — MỘT GIAO DỊCH
--
--    Trừ tiền rồi mới bật tin ở hai lệnh riêng là cách mất tiền của người
--    khác: lỗi ở giữa thì token bay mà tin không lên. Hàm plpgsql này chạy
--    trong một transaction — hoặc cả hai xong, hoặc không gì xảy ra.
--
--    Giá: 10 token / 1 xe / 1 tháng, TUYẾN TÍNH (CLAUDE.md mục 6).
--    Server là nguồn sự thật của giá. Client gửi lên bao nhiêu token cũng
--    không được tin — hàm tự tính lại từ số tháng.
-- ─────────────────────────────────────────────
create or replace function charge_and_publish(
  p_user_id    uuid,
  p_listing_id uuid,
  p_months     int,
  p_idem_key   text
) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  c_token_per_month constant int := 10;   -- khớp src/lib/config.js TOKENS_PER_MONTH
  v_listing listings%rowtype;
  v_charge  charges%rowtype;
  v_wallet  uuid;
  v_so_du   int;
  v_tokens  int;
  v_bat_dau timestamptz;
  v_het_han timestamptz;
  v_kind    charge_kind;
begin
  if p_months is null or p_months < 1 or p_months > 12 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le',
                              'message', 'Số tháng phải từ 1 đến 12',
                              'fields', jsonb_build_object('months', 'khong_hop_le'));
  end if;
  if p_idem_key is null or length(trim(p_idem_key)) = 0 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le',
                              'message', 'Thiếu idem_key — mọi lần trừ token bắt buộc có khoá');
  end if;

  -- Gửi lại cùng khoá -> trả lại kết quả lần đầu. KHÔNG trừ lần hai.
  select * into v_charge from charges where idem_key = p_idem_key;
  if found then
    select * into v_listing from listings where id = v_charge.listing_id;
    return jsonb_build_object('da_xu_ly', true,
                              'charge_id', v_charge.id,
                              'token_charged', v_charge.token_amount,
                              'expires_at', v_listing.expires_at,
                              'so_du', wallet_so_du(p_user_id));
  end if;

  select * into v_listing from listings
   where id = p_listing_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('error', 'khong_tim_thay', 'message', 'Không tìm thấy tin đăng');
  end if;
  if v_listing.owner_id <> p_user_id then
    return jsonb_build_object('error', 'khong_co_quyen', 'message', 'Tin này không phải của bạn');
  end if;
  if v_listing.status not in ('cho_duyet', 'dang_hien_thi', 'sap_het_han', 'het_han') then
    return jsonb_build_object('error', 'trang_thai_khong_hop_le',
                              'message', 'Tin chưa sẵn sàng để hiển thị',
                              'status', v_listing.status);
  end if;

  -- Chưa từng đăng thì phải qua kiểm duyệt trước khi được trả phí (luồng 08).
  -- Không lấy tiền của chủ xe cho một tin có thể bị từ chối ngay sau đó.
  if v_listing.published_at is null
     and not exists (select 1 from moderation_queue
                      where listing_id = v_listing.id and status = 'da_duyet') then
    return jsonb_build_object('error', 'trang_thai_khong_hop_le',
                              'message', 'Tin đang chờ kiểm duyệt, chưa thu phí hiển thị');
  end if;

  v_tokens := p_months * c_token_per_month;
  v_kind   := case when v_listing.published_at is null then 'dang_tin' else 'gia_han' end;

  -- Khoá dòng ví trước khi đọc số dư: hai tab bấm cùng lúc thì tab sau phải
  -- xếp hàng, không được đọc cùng một số dư cũ rồi cùng trừ.
  v_wallet := ensure_wallet(p_user_id);
  perform 1 from wallets where id = v_wallet for update;

  v_so_du := wallet_so_du(p_user_id);
  if v_so_du < v_tokens then
    return jsonb_build_object('error', 'khong_du_token',
                              'message', 'Số dư không đủ để hiển thị tin',
                              'so_du', v_so_du, 'can_co', v_tokens);
  end if;

  -- Gia hạn khi tin CÒN hạn thì nối tiếp từ ngày hết hạn cũ, không cắt ngắn
  -- phần chủ xe đã trả. Tin đã hết hạn thì tính từ hôm nay.
  v_bat_dau := greatest(coalesce(v_listing.expires_at, now()), now());
  v_het_han := v_bat_dau + (p_months || ' months')::interval;

  insert into charges (user_id, listing_id, kind, token_amount, months,
                       period_start, period_end, idem_key)
  values (p_user_id, v_listing.id, v_kind, v_tokens, p_months,
          v_bat_dau, v_het_han, p_idem_key)
  returning * into v_charge;

  insert into wallet_transactions (wallet_id, kind, amount, charge_id, idem_key, note)
  values (v_wallet, 'tieu', -v_tokens, v_charge.id, 'charge:' || v_charge.id,
          case when v_kind = 'dang_tin' then 'Hiển thị tin ' else 'Gia hạn tin ' end
          || v_listing.brand_text || ' ' || v_listing.model_text
          || ' · ' || p_months || ' tháng');

  update listings
     set status       = 'dang_hien_thi',
         published_at = coalesce(published_at, now()),
         expires_at   = v_het_han
   where id = v_listing.id;

  insert into notifications (user_id, kind, title, body, link)
  values (p_user_id, 'tru_token',
          'Đã trừ ' || v_tokens || ' token',
          v_listing.brand_text || ' ' || v_listing.model_text
            || ' hiển thị tới ' || to_char(v_het_han, 'DD/MM/YYYY'),
          '/chu-xe/vi');

  insert into events (kind, listing_id, owner_id, actor_id, meta)
  values ('renew', v_listing.id, p_user_id, p_user_id,
          jsonb_build_object('charge_id', v_charge.id, 'token', v_tokens,
                             'months', p_months, 'charge_kind', v_kind));

  return jsonb_build_object('da_xu_ly', false,
                            'charge_id', v_charge.id,
                            'token_charged', v_tokens,
                            'expires_at', v_het_han,
                            'so_du', wallet_so_du(p_user_id));
end $fn$;

-- ─────────────────────────────────────────────
-- 6. HOÀN TOKEN  (chỉ admin gọi — luồng 10 / chính sách hoàn token luồng 12)
--    Không UPDATE dòng cũ. Ghi một dòng ĐẢO NGƯỢC. Sổ luôn kể đủ câu chuyện.
-- ─────────────────────────────────────────────
create or replace function refund_tokens(
  p_user_id  uuid,
  p_tokens   int,
  p_ly_do    text,
  p_idem_key text
) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_wallet uuid; v_tx uuid;
begin
  if p_tokens is null or p_tokens <= 0 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le', 'message', 'Số token hoàn phải dương');
  end if;
  if p_ly_do is null or length(trim(p_ly_do)) = 0 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le', 'message', 'Hoàn token bắt buộc có lý do');
  end if;
  if p_idem_key is null or length(trim(p_idem_key)) = 0 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le', 'message', 'Thiếu idem_key');
  end if;

  v_wallet := ensure_wallet(p_user_id);
  insert into wallet_transactions (wallet_id, kind, amount, idem_key, note)
  values (v_wallet, 'hoan', p_tokens, p_idem_key, p_ly_do)
  on conflict (idem_key) do nothing
  returning id into v_tx;

  return jsonb_build_object('da_xu_ly', v_tx is null,
                            'so_du', wallet_so_du(p_user_id));
end $fn$;

-- ─────────────────────────────────────────────
-- 7. CRON HẾT HẠN
--    Hết token -> tin ẩn khỏi tìm kiếm. DỮ LIỆU GIỮ NGUYÊN, không xoá gì.
--    Nạp vào rồi gia hạn là tin hiện lại nguyên vẹn.
-- ─────────────────────────────────────────────
create or replace function expire_listings() returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_sap int; v_het int;
begin
  with u as (
    update listings set status = 'het_han'
     where status in ('dang_hien_thi', 'sap_het_han')
       and expires_at is not null and expires_at <= now()
       and deleted_at is null
    returning id, owner_id, brand_text, model_text
  ), n as (
    insert into notifications (user_id, kind, title, body, link)
    select owner_id, 'het_han', 'Tin đã hết hạn hiển thị',
           brand_text || ' ' || model_text || ' đã ẩn khỏi tìm kiếm. Gia hạn là hiện lại nguyên vẹn.',
           '/chu-xe'
    from u returning 1
  )
  select count(*) into v_het from u;

  with u as (
    update listings set status = 'sap_het_han'
     where status = 'dang_hien_thi'
       and expires_at is not null
       and expires_at <= now() + interval '3 days'
       and deleted_at is null
    returning id, owner_id, brand_text, model_text, expires_at
  ), n as (
    insert into notifications (user_id, kind, title, body, link)
    select owner_id, 'sap_het_han', 'Tin sắp hết hạn',
           brand_text || ' ' || model_text || ' hết hạn ngày '
             || to_char(expires_at, 'DD/MM/YYYY') || '.',
           '/chu-xe'
    from u returning 1
  )
  select count(*) into v_sap from u;

  return jsonb_build_object('het_han', v_het, 'sap_het_han', v_sap);
end $fn$;

-- ─────────────────────────────────────────────
-- 8. ĐỐI SOÁT SỔ SÁCH
--    Chạy tay hoặc theo cron. Trả về dòng nào là có chuyện — bảng RỖNG là tốt.
--    Bốn câu hỏi: có ví nào âm không, sổ có khớp chứng từ nạp không,
--    có khớp chứng từ trừ không, có khoản đã thu tiền mà quên cộng token không.
-- ─────────────────────────────────────────────
create or replace function doi_soat_vi()
returns table (van_de text, user_id uuid, chi_tiet jsonb)
language sql stable security definer set search_path = public as $fn$
  -- a. Số dư âm — không bao giờ được phép xảy ra.
  select 'so_du_am'::text, b.user_id,
         jsonb_build_object('so_du', b.so_du)
  from wallet_balances b where b.so_du < 0

  union all
  -- b. Token đã nạp trên sổ != tổng chứng từ nạp đã thanh toán.
  select 'nap_lech_chung_tu'::text, w.user_id,
         jsonb_build_object('so_theo_so_vi', coalesce(l.nap, 0),
                            'so_theo_topups', coalesce(t.nap, 0))
  from wallets w
  left join (select tx.wallet_id, sum(tx.amount) nap from wallet_transactions tx
              where tx.kind = 'nap' group by 1) l on l.wallet_id = w.id
  left join (select tp.user_id, sum(tp.token_amount) nap from topups tp
              where tp.status = 'da_thanh_toan' group by 1) t on t.user_id = w.user_id
  where coalesce(l.nap, 0) <> coalesce(t.nap, 0)

  union all
  -- c. Token đã tiêu trên sổ != tổng chứng từ trừ.
  select 'tieu_lech_chung_tu'::text, w.user_id,
         jsonb_build_object('so_theo_so_vi', coalesce(-l.tieu, 0),
                            'so_theo_charges', coalesce(c.tieu, 0))
  from wallets w
  left join (select tx.wallet_id, sum(tx.amount) tieu from wallet_transactions tx
              where tx.kind = 'tieu' group by 1) l on l.wallet_id = w.id
  left join (select ch.user_id, sum(ch.token_amount) tieu from charges ch group by 1) c
         on c.user_id = w.user_id
  where coalesce(-l.tieu, 0) <> coalesce(c.tieu, 0)

  union all
  -- d. Đã báo thanh toán nhưng không có dòng sổ nào tham chiếu tới.
  select 'topup_quen_cong'::text, tp.user_id,
         jsonb_build_object('topup_id', tp.id, 'transfer_code', tp.transfer_code)
  from topups tp
  where tp.status = 'da_thanh_toan'
    and not exists (select 1 from wallet_transactions t where t.topup_id = tp.id)
$fn$;

-- ─────────────────────────────────────────────
-- 9. QUYỀN GỌI — luật 6: client KHÔNG BAO GIỜ chạm vào ví
--    Mặc định Postgres cho public execute mọi hàm. Thu lại hết, chỉ
--    service_role (Edge Function) được gọi. Hàm chạy security definer mà
--    quên revoke thì bằng mở toang cửa két.
-- ─────────────────────────────────────────────
do $blk$
declare f text;
begin
  foreach f in array array[
    'credit_topup(uuid,text,text,int)',
    'charge_and_publish(uuid,uuid,int,text)',
    'refund_tokens(uuid,int,text,text)',
    'expire_listings()',
    'doi_soat_vi()',
    'ensure_wallet(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $blk$;

-- wallet_so_du nhận user_id làm tham số nên ai gọi được là đọc được số dư của
-- người khác. Chỉ server gọi. Client đọc số dư của mình qua view
-- `wallet_balances` — view đó có RLS, không lộ ví người khác.
revoke all on function wallet_so_du(uuid) from public, anon, authenticated;
grant execute on function wallet_so_du(uuid) to service_role;

grant select on wallet_ledger to authenticated;

-- ════════════════════════════════════════════════════════════
-- ▼ 0005_trust.sql
-- ════════════════════════════════════════════════════════════
do $$ begin raise notice 'Đang chạy: 0005_trust.sql'; end $$;

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

-- ════════════════════════════════════════════════════════════
-- ▼ 0006_legal_consent.sql
-- ════════════════════════════════════════════════════════════
do $$ begin raise notice 'Đang chạy: 0006_legal_consent.sql'; end $$;

-- ============================================================
-- ĐÃ GỘP VÀO HỢP ĐỒNG CHUNG — file này cố ý KHÔNG làm gì.
--
-- Bảng `user_consents` (luồng 12) nay nằm trong `contracts/schema.sql`,
-- nghĩa là nó đã được tạo từ `0001_init.sql`. Giữ file rỗng này để số thứ tự
-- migration không nhảy cóc, và để ai đọc lịch sử còn thấy nó đã đi đâu.
--
-- KHÔNG khôi phục nội dung cũ vào đây. Bản cũ tạo policy
-- `user_consents_select_own` KHÔNG có nhánh `has_role('admin')`; chạy lại nó
-- sau 0001 sẽ âm thầm siết mất quyền đọc của admin.
--
-- Cần sửa bảng này -> sửa `contracts/schema.sql` rồi chạy
-- `node scripts/gen-migrations.mjs` để sinh lại `0001_init.sql`.
-- ============================================================

select 1;

-- ════════════════════════════════════════════════════════════
-- ▼ 0007_notify.sql
-- ════════════════════════════════════════════════════════════
do $$ begin raise notice 'Đang chạy: 0007_notify.sql'; end $$;

-- ============================================================
-- 0005 — THÔNG BÁO (luồng 11)
--
-- KHÔNG sửa bảng nào của contracts/schema.sql. File này chỉ THÊM:
--   · notification_prefs   — chủ xe bật/tắt loại thông báo được phép tắt
--   · notification_outbox  — hộp thư đi: mỗi (người, loại, tham chiếu, kênh) đúng MỘT dòng
--   · hàm xếp hàng, hàm quét mốc hết hạn, hàm nhận/đánh dấu cho Edge Function
--   · trigger: tin duyệt / từ chối / bị ẩn, nạp token thành công
--
-- Nguyên tắc (LUONG-CHAT/11-thong-bao.md):
--   2. Gửi MỘT lần    -> unique (user_id, type, ref_id, channel). Cron chạy lại = on conflict do nothing.
--   3. Tắt được       -> trừ loại liên quan tiền / tài khoản (cột `bat_buoc`), prefs không chạm được.
--   5. Ghi mọi lần gửi -> status / attempts / sent_at / error nằm ngay trên dòng outbox.
--   Cấm: nội dung KHÔNG chứa số điện thoại chủ xe; SMS không dùng ở đây (chỉ email / zalo / inapp).
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Cài đặt của người dùng
-- ─────────────────────────────────────────────
create table if not exists notification_prefs (
  user_id            uuid primary key references users(id) on delete cascade,
  van_hanh_email     boolean not null default true,   -- tin được duyệt / bị từ chối / bị ẩn
  tang_truong_email  boolean not null default false,  -- thống kê tuần, có người lưu xe (làm sau)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table notification_prefs enable row level security;
create policy notif_prefs_own_read on notification_prefs for select using (user_id = auth.uid());
create policy notif_prefs_own_ins   on notification_prefs for insert with check (user_id = auth.uid());
create policy notif_prefs_own_upd   on notification_prefs for update using (user_id = auth.uid());
create trigger notification_prefs_touch before update on notification_prefs
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────
-- 2. Hộp thư đi
-- ─────────────────────────────────────────────
create table if not exists notification_outbox (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  type       text not null,                -- vd 'het_han_3_ngay', 'nap_thanh_cong'
  ref_id     text not null,                -- khoá chống trùng: listing_id:ngày hết hạn, topup_id...
  channel    text not null check (channel in ('email', 'zalo', 'inapp')),
  status     text not null default 'cho_gui'
             check (status in ('cho_gui', 'dang_gui', 'da_gui', 'loi', 'bo_qua')),
  bat_buoc   boolean not null default false,
  title      text not null,
  body       text,
  link       text,
  attempts   int not null default 0,
  sent_at    timestamptz,
  error      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type, ref_id, channel)
);
create index if not exists notification_outbox_pending on notification_outbox (created_at)
  where status in ('cho_gui', 'dang_gui');
alter table notification_outbox enable row level security;
-- Chủ xe xem được lịch sử của mình. Không có policy ghi: client không gửi/sửa được.
create policy notif_outbox_own_read on notification_outbox for select
  using (user_id = auth.uid() or has_role('admin'));
create trigger notification_outbox_touch before update on notification_outbox
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────
-- 3. Xếp hàng MỘT thông báo (nhiều kênh). Idempotent.
-- ─────────────────────────────────────────────
create or replace function queue_notification(
  p_user_id  uuid,
  p_type     text,
  p_ref_id   text,
  p_channels text[],
  p_title    text,
  p_body     text,
  p_link     text,
  p_bat_buoc boolean default false,
  p_kind     notification_kind default 'he_thong',
  p_nhom     text default null          -- 'van_hanh' | 'tang_truong' | null (bắt buộc)
) returns int
language plpgsql security definer set search_path = public as $fn$
declare
  v_ch text; v_n int := 0; v_id uuid; v_pref notification_prefs;
begin
  if not p_bat_buoc then
    select * into v_pref from notification_prefs where user_id = p_user_id;
    -- Chưa có dòng prefs = dùng mặc định (van_hanh bật, tang_truong tắt).
    if p_nhom = 'van_hanh'    and coalesce(v_pref.van_hanh_email, true)      = false then return 0; end if;
    if p_nhom = 'tang_truong' and coalesce(v_pref.tang_truong_email, false) = false then return 0; end if;
  end if;

  foreach v_ch in array p_channels loop
    insert into notification_outbox (user_id, type, ref_id, channel, bat_buoc, title, body, link,
                                     status, sent_at)
    values (p_user_id, p_type, p_ref_id, v_ch, p_bat_buoc, p_title, p_body, p_link,
            case when v_ch = 'inapp' then 'da_gui' else 'cho_gui' end,
            case when v_ch = 'inapp' then now() end)
    on conflict (user_id, type, ref_id, channel) do nothing
    returning id into v_id;

    if v_id is not null then
      v_n := v_n + 1;
      -- In-app: chỉ chèn khi dòng outbox MỚI được tạo -> chạy lại không sinh thông báo trùng.
      if v_ch = 'inapp' then
        insert into notifications (user_id, kind, title, body, link)
        values (p_user_id, p_kind, p_title, p_body, p_link);
      end if;
    end if;
    v_id := null;
  end loop;
  return v_n;
end $fn$;

-- ─────────────────────────────────────────────
-- 4. Quét mốc hết hạn. Cron gọi qua Edge Function; chạy bao nhiêu lần cũng không trùng.
--
--    Đã có sẵn ở 0004_billing.sql (expire_listings) thông báo IN-APP cho "sắp hết hạn"
--    và "hết hạn" — nên ở đây các mốc đó CHỈ thêm email/zalo, tránh hai chuông cho một việc.
--    Mốc 1 ngày chưa có ai lo -> em thêm cả in-app.
--    ref_id gắn ngày hết hạn: gia hạn xong (ngày mới) thì kỳ sau nhắc lại được.
-- ─────────────────────────────────────────────
create or replace function scan_expiry_reminders() returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  r record; v_so_du int; v_ten text; v_han text; v_n3 int := 0; v_n1 int := 0;
  v_nhet int := 0; v_nthieu int := 0; v_ref text;
begin
  for r in
    select id, owner_id, brand_text, model_text, expires_at, status
    from listings
    where deleted_at is null
      and expires_at is not null
      and (
        (status in ('dang_hien_thi', 'sap_het_han') and expires_at > now() and expires_at <= now() + interval '3 days')
        or (status = 'het_han' and expires_at > now() - interval '7 days' and expires_at <= now())
      )
  loop
    v_ten   := r.brand_text || ' ' || r.model_text;
    v_han   := to_char(r.expires_at at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY');
    v_ref   := r.id || ':' || to_char(r.expires_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD');
    v_so_du := wallet_so_du(r.owner_id);

    if r.status = 'het_han' then
      -- Đã hết hạn -> email. (In-app do expire_listings lo.)
      v_nhet := v_nhet + queue_notification(r.owner_id, 'het_han', v_ref, array['email'],
        'Tin ' || v_ten || ' đã ẩn',
        'Tin đã hết hạn ngày ' || v_han || ' và không còn hiện ở tìm kiếm. Nạp token rồi gia hạn là tin hiện lại nguyên vẹn.',
        '/chu-xe/vi', true, 'het_han');
      continue;
    end if;

    if r.expires_at <= now() + interval '1 day' then
      v_n1 := v_n1 + queue_notification(r.owner_id, 'het_han_1_ngay', v_ref, array['zalo', 'inapp'],
        'Xe ' || v_ten || ' hết hạn trong 1 ngày',
        'Số dư ' || v_so_du || ' token. Gia hạn trước ' || v_han || ' để tin không bị ẩn.',
        '/chu-xe', true, 'sap_het_han');
    else
      v_n3 := v_n3 + queue_notification(r.owner_id, 'het_han_3_ngay', v_ref, array['email', 'zalo'],
        'Xe ' || v_ten || ' còn 3 ngày',
        'Xe ' || v_ten || ' hết hạn ngày ' || v_han || '. Số dư ' || v_so_du || ' token.',
        '/chu-xe', true, 'sap_het_han');
    end if;

    -- Không đủ token gia hạn 1 tháng (10 token — pricing.js). Email + zalo, kèm link nạp.
    if v_so_du < 10 then
      v_nthieu := v_nthieu + queue_notification(r.owner_id, 'thieu_token', v_ref, array['email', 'zalo'],
        'Chưa đủ token gia hạn ' || v_ten,
        'Gia hạn 1 tháng cần 10 token, ví của anh/chị còn ' || v_so_du || '. Nạp thêm để tin không bị ẩn.',
        '/chu-xe/vi', true, 'he_thong');
    end if;
  end loop;

  return jsonb_build_object('het_han_3_ngay', v_n3, 'het_han_1_ngay', v_n1,
                            'het_han', v_nhet, 'thieu_token', v_nthieu);
end $fn$;

-- ─────────────────────────────────────────────
-- 5. Trigger sự kiện: duyệt / từ chối / bị ẩn / nạp thành công
-- ─────────────────────────────────────────────
create or replace function notify_listing_status() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare v_ten text := new.brand_text || ' ' || new.model_text;
        v_ref text := new.id || ':' || new.status || ':' || extract(epoch from now())::bigint;
begin
  if new.status is not distinct from old.status then return new; end if;

  if old.status = 'cho_duyet' and new.status in ('dang_hien_thi', 'tu_choi') then
    if new.status = 'dang_hien_thi' then
      perform queue_notification(new.owner_id, 'tin_duyet', v_ref, array['email', 'inapp'],
        'Tin ' || v_ten || ' đã được duyệt',
        'Tin đã hiển thị ở trang tìm kiếm.', '/xe/' || new.id, false, 'tin_duyet', 'van_hanh');
    else
      perform queue_notification(new.owner_id, 'tin_tu_choi', v_ref, array['email', 'inapp'],
        'Tin ' || v_ten || ' bị từ chối',
        'Lý do: ' || coalesce(nullif(trim(new.reject_reason), ''), 'chưa ghi lý do') || '. Sửa lại rồi gửi duyệt lần nữa.',
        '/chu-xe/tin/' || new.id, false, 'tin_tu_choi', 'van_hanh');
    end if;
  elsif new.status = 'an' and old.status in ('dang_hien_thi', 'sap_het_han') then
    -- Trust (luồng 08) tự ẩn khi đủ 3 báo cáo.
    perform queue_notification(new.owner_id, 'tin_bi_an', v_ref, array['email', 'inapp'],
      'Tin ' || v_ten || ' tạm ẩn',
      'Tin bị báo cáo và đang được xem xét. Bạn sẽ nhận thông báo khi có kết quả.',
      '/chu-xe', false, 'he_thong', 'van_hanh');
  end if;
  return new;
end $fn$;

drop trigger if exists listings_notify_status on listings;
create trigger listings_notify_status after update of status on listings
  for each row execute function notify_listing_status();

create or replace function notify_topup_paid() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if new.status = 'da_thanh_toan' and old.status is distinct from 'da_thanh_toan' then
    -- In-app do receive_topup (0004_billing) đã chèn. Ở đây chỉ thêm email biên nhận.
    perform queue_notification(new.user_id, 'nap_thanh_cong', new.id::text, array['email'],
      'Biên nhận nạp ' || new.token_amount || ' token',
      'Đã nhận ' || to_char(new.vnd_amount, 'FM999G999G999') || 'đ, cộng ' || new.token_amount
        || ' token. Mã ' || new.transfer_code || '. Số dư mới: ' || wallet_so_du(new.user_id) || ' token.',
      '/chu-xe/vi', true, 'nap_thanh_cong');
  end if;
  return new;
end $fn$;

drop trigger if exists topups_notify_paid on topups;
create trigger topups_notify_paid after update of status on topups
  for each row execute function notify_topup_paid();

-- ─────────────────────────────────────────────
-- 6. Cho Edge Function: nhận lô cần gửi, ghi kết quả
--    Nhận bằng `for update skip locked` -> hai tiến trình không lấy trùng một dòng.
--    Dòng kẹt ở 'dang_gui' quá 10 phút được trả về hàng đợi.
-- ─────────────────────────────────────────────
create or replace function claim_outbox(p_limit int default 50)
returns table (id uuid, user_id uuid, type text, channel text, title text, body text, link text,
               email text, zalo_phone text, attempts int)
language plpgsql security definer set search_path = public as $fn$
begin
  update notification_outbox set status = 'cho_gui'
   where status = 'dang_gui' and updated_at < now() - interval '10 minutes';

  return query
  with c as (
    select o.id from notification_outbox o
     where o.status = 'cho_gui' and o.channel in ('email', 'zalo')
     order by o.created_at
     limit p_limit
     for update skip locked
  ), u as (
    update notification_outbox o set status = 'dang_gui', attempts = o.attempts + 1
      from c where o.id = c.id
    returning o.*
  )
  select u.id, u.user_id, u.type, u.channel, u.title, u.body, u.link,
         usr.email, coalesce(usr.zalo_phone, usr.phone), u.attempts
  from u join users usr on usr.id = u.user_id;
end $fn$;

-- p_ket_qua: 'da_gui' | 'bo_qua' (người dùng không có email/zalo) | 'loi' (thử lại tối đa 3 lần)
create or replace function mark_outbox(p_id uuid, p_ket_qua text, p_error text default null)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  update notification_outbox
     set status  = case when p_ket_qua = 'loi' and attempts < 3 then 'cho_gui' else p_ket_qua end,
         sent_at = case when p_ket_qua = 'da_gui' then now() else sent_at end,
         error   = p_error
   where id = p_id;
end $fn$;

-- Client không gọi được các hàm này. Chỉ service_role (Edge Function / cron).
revoke all on function queue_notification(uuid, text, text, text[], text, text, text, boolean, notification_kind, text) from public, anon, authenticated;
revoke all on function scan_expiry_reminders()                 from public, anon, authenticated;
revoke all on function claim_outbox(int)                       from public, anon, authenticated;
revoke all on function mark_outbox(uuid, text, text)           from public, anon, authenticated;

-- ════════════════════════════════════════════════════════════
-- ▼ 0008_admin.sql
-- ════════════════════════════════════════════════════════════
do $$ begin raise notice 'Đang chạy: 0008_admin.sql'; end $$;

-- ============================================================
-- 0005 — QUẢN TRỊ: hàm phía server (luồng 10)
--
-- KHÔNG sửa bảng nào của contracts/schema.sql. File này chỉ THÊM hàm.
--
-- Nguyên tắc: mọi thao tác admin là MỘT hàm security definer chạy trong MỘT
-- transaction, vừa làm việc vừa ghi `admin_actions`. Không có đường "làm xong
-- rồi mới nhớ ghi nhật ký": hàm lỗi thì cả việc lẫn nhật ký cùng huỷ.
--
-- Mọi hàm nhận p_actor (người thao tác) và TỰ kiểm tra vai trò trong
-- user_roles — không tin Edge Function đã kiểm tra. Hai lớp, không phải một.
-- Toàn bộ revoke khỏi anon/authenticated, chỉ service_role (Edge Function
-- `admin-ops`) được gọi.
--
-- `admin_actions` không có cột `reason`; lý do nằm trong after_data->>'reason'.
-- (contracts/ chỉ luồng 01 được sửa — nếu cần cột riêng thì báo luồng 01.)
-- ============================================================

-- ─────────────────────────────────────────────
-- 0. KIỂM TRA VAI TRÒ
-- ─────────────────────────────────────────────
create or replace function admin_has_role(p_uid uuid, p_roles user_role[])
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from user_roles
                  where user_id = p_uid and role = any(p_roles) and deleted_at is null)
$fn$;

create or replace function admin_log(
  p_actor uuid, p_action text, p_target_type text, p_target_id text,
  p_before jsonb, p_after jsonb
) returns void language sql security definer set search_path = public as $fn$
  insert into admin_actions (admin_id, action, target_type, target_id, before_data, after_data)
  values (p_actor, p_action, p_target_type, p_target_id, p_before, p_after)
$fn$;

-- ─────────────────────────────────────────────
-- 1. DUYỆT / TỪ CHỐI TIN  (kiem_duyet hoặc admin)
--    Duyệt: tin VẪN ở `cho_duyet`, hàng đợi -> `da_duyet`. Tin chỉ lên
--    `dang_hien_thi` khi chủ xe trả phí (charge_and_publish, 0004) — hàm đó
--    đòi có dòng `da_duyet` trước khi thu token. Admin duyệt không tự bật tin.
--    Từ chối: bắt buộc có lý do, chủ xe nhận thông báo kèm lý do.
-- ─────────────────────────────────────────────
create or replace function admin_moderate_listing(
  p_actor uuid, p_listing uuid, p_decision text, p_reason text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_l   listings%rowtype;
  v_q   uuid;
  v_ten text;
begin
  if not admin_has_role(p_actor, array['kiem_duyet','admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Bạn không có quyền kiểm duyệt');
  end if;
  if p_decision not in ('duyet','tu_choi') then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Quyết định không hợp lệ');
  end if;
  if p_decision = 'tu_choi' and (p_reason is null or length(trim(p_reason)) < 5) then
    return jsonb_build_object('error','du_lieu_khong_hop_le',
      'message','Từ chối phải ghi lý do để chủ xe biết đường sửa',
      'fields', jsonb_build_object('reason','bat_buoc'));
  end if;

  select * into v_l from listings where id = p_listing and deleted_at is null for update;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy tin đăng');
  end if;
  if v_l.status <> 'cho_duyet' then
    return jsonb_build_object('error','trang_thai_khong_hop_le',
      'message','Tin không còn ở trạng thái chờ duyệt (có thể người khác vừa xử lý)',
      'status', v_l.status);
  end if;

  v_ten := v_l.brand_text || ' ' || v_l.model_text;

  -- Hàng đợi: dùng dòng đang chờ, chưa có thì tạo. Không sửa dòng đã xử lý.
  select id into v_q from moderation_queue
   where listing_id = p_listing and status = 'cho_duyet'
   order by created_at desc limit 1 for update;
  if v_q is null then
    insert into moderation_queue (listing_id) values (p_listing) returning id into v_q;
  end if;

  update moderation_queue
     set status = case when p_decision = 'duyet' then 'da_duyet'::moderation_status
                       else 'tu_choi'::moderation_status end,
         reviewer_id = p_actor, reason = nullif(trim(p_reason), ''), reviewed_at = now()
   where id = v_q;

  if p_decision = 'tu_choi' then
    update listings set status = 'tu_choi', reject_reason = trim(p_reason) where id = p_listing;
    insert into notifications (user_id, kind, title, body, link)
    values (v_l.owner_id, 'tin_tu_choi', 'Tin ' || v_ten || ' chưa được duyệt',
            trim(p_reason), '/chu-xe/tin/' || p_listing);
  else
    update listings set reject_reason = null where id = p_listing;
    insert into notifications (user_id, kind, title, body, link)
    values (v_l.owner_id, 'tin_duyet', 'Tin ' || v_ten || ' đã được duyệt',
            'Thanh toán phí hiển thị để tin lên tìm kiếm.', '/chu-xe/tin/' || p_listing);
  end if;

  perform admin_log(p_actor, 'moderate_listing', 'listing', p_listing::text,
    jsonb_build_object('status', v_l.status),
    jsonb_build_object('decision', p_decision, 'reason', nullif(trim(p_reason), '')));

  return jsonb_build_object('ok', true, 'decision', p_decision);
end $fn$;

-- ─────────────────────────────────────────────
-- 2. TRÙNG BIỂN SỐ  (chỉ đọc — cảnh báo cho người duyệt)
--    Tự chuẩn hoá ở đây, không phụ thuộc hàm của luồng 08.
-- ─────────────────────────────────────────────
create or replace function admin_plate_conflicts(p_actor uuid, p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_plate text; v_rows jsonb;
begin
  if not admin_has_role(p_actor, array['kiem_duyet','admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Bạn không có quyền');
  end if;
  select upper(regexp_replace(coalesce(plate,''), '[^0-9A-Za-z]', '', 'g'))
    into v_plate from listings where id = p_listing;
  if v_plate is null or v_plate = '' then return jsonb_build_object('items', '[]'::jsonb); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', o.id, 'owner_id', o.owner_id, 'status', o.status,
           'brand_text', o.brand_text, 'model_text', o.model_text)), '[]'::jsonb)
    into v_rows
    from listings o
   where o.id <> p_listing and o.deleted_at is null
     and upper(regexp_replace(coalesce(o.plate,''), '[^0-9A-Za-z]', '', 'g')) = v_plate;
  return jsonb_build_object('items', v_rows);
end $fn$;

-- ─────────────────────────────────────────────
-- 3. KHOÁ / MỞ KHOÁ NGƯỜI DÙNG  (chỉ admin)
--    Khoá = soft delete (users.deleted_at) + ẨN các tin đang hiển thị.
--    Danh sách tin bị ẩn nằm trong before_data của dòng nhật ký, để mở khoá
--    khôi phục ĐÚNG những tin đó — không đụng tin vốn đã ẩn/nháp từ trước.
--    Không khoá được chính mình, không khoá admin khác.
-- ─────────────────────────────────────────────
create or replace function admin_set_user_lock(
  p_actor uuid, p_user uuid, p_lock boolean, p_reason text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_ids uuid[]; v_n int;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được khoá người dùng');
  end if;
  if p_reason is null or length(trim(p_reason)) < 5 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Bắt buộc ghi lý do',
      'fields', jsonb_build_object('reason','bat_buoc'));
  end if;
  if p_user = p_actor then
    return jsonb_build_object('error','khong_co_quyen','message','Không thể tự khoá chính mình');
  end if;
  if admin_has_role(p_user, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Không khoá được quản trị viên khác');
  end if;
  perform 1 from users where id = p_user for update;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy người dùng');
  end if;

  if p_lock then
    select coalesce(array_agg(id), '{}') into v_ids from listings
     where owner_id = p_user and status in ('dang_hien_thi','sap_het_han') and deleted_at is null;
    update listings set status = 'an' where id = any(v_ids);
    update users set deleted_at = now() where id = p_user and deleted_at is null;
    perform admin_log(p_actor, 'lock_user', 'user', p_user::text,
      jsonb_build_object('hidden_listing_ids', to_jsonb(v_ids)),
      jsonb_build_object('reason', trim(p_reason)));
    return jsonb_build_object('ok', true, 'locked', true, 'hidden', coalesce(array_length(v_ids,1),0));
  end if;

  -- Mở khoá: khôi phục đúng các tin đã bị ẩn ở lần khoá gần nhất.
  select coalesce(array(select jsonb_array_elements_text(before_data->'hidden_listing_ids')::uuid), '{}')
    into v_ids
    from admin_actions
   where action = 'lock_user' and target_id = p_user::text
   order by created_at desc limit 1;
  v_ids := coalesce(v_ids, '{}');

  update listings
     set status = case when expires_at is not null and expires_at > now()
                       then 'dang_hien_thi'::listing_status else 'het_han'::listing_status end
   where id = any(v_ids) and status = 'an' and deleted_at is null;
  get diagnostics v_n = row_count;
  update users set deleted_at = null where id = p_user;

  perform admin_log(p_actor, 'unlock_user', 'user', p_user::text,
    null, jsonb_build_object('reason', trim(p_reason), 'restored', v_n));
  return jsonb_build_object('ok', true, 'locked', false, 'restored', v_n);
end $fn$;

-- ─────────────────────────────────────────────
-- 4. TÍCH XANH  (chỉ admin) — xét giấy tờ, MIỄN PHÍ, không bán.
-- ─────────────────────────────────────────────
create or replace function admin_set_verified(
  p_actor uuid, p_user uuid, p_status verify_status, p_note text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_old verify_status;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được xét tích xanh');
  end if;
  if p_status not in ('da_xac_minh','tu_choi') then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Trạng thái không hợp lệ');
  end if;
  if p_status = 'tu_choi' and (p_note is null or length(trim(p_note)) < 5) then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Từ chối phải ghi lý do',
      'fields', jsonb_build_object('note','bat_buoc'));
  end if;
  select verify_status into v_old from users where id = p_user for update;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy người dùng');
  end if;

  update users set verify_status = p_status,
         verified_at = case when p_status = 'da_xac_minh' then now() else null end
   where id = p_user;
  update listings set is_verified = (p_status = 'da_xac_minh')
   where owner_id = p_user and deleted_at is null;

  perform admin_log(p_actor, 'set_verified', 'user', p_user::text,
    jsonb_build_object('verify_status', v_old),
    jsonb_build_object('verify_status', p_status, 'reason', nullif(trim(p_note), '')));
  return jsonb_build_object('ok', true, 'verify_status', p_status);
end $fn$;

-- ─────────────────────────────────────────────
-- 5. CỘNG / TRỪ / HOÀN TOKEN TAY  (chỉ admin)
--    Không sửa số dư. Ghi MỘT dòng vào sổ chỉ-ghi-thêm:
--      tang    +  tặng token (khuyến mại, bù lỗi hệ thống)
--      hoan    +  hoàn token theo chính sách hoàn
--      thu_hoi -  thu hồi token (cộng nhầm)
--    p_tokens luôn DƯƠNG; dấu do loại giao dịch quyết định.
--    Lý do bắt buộc. idem_key bắt buộc — bấm hai lần chỉ ghi một dòng.
--    Trừ quá số dư -> trigger 0004 (wallet_tx_non_negative) từ chối.
-- ─────────────────────────────────────────────
create or replace function admin_adjust_wallet(
  p_actor uuid, p_user uuid, p_kind wallet_tx_kind, p_tokens int, p_reason text, p_idem text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_wallet uuid; v_tx uuid; v_amount int;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được thao tác ví');
  end if;
  if p_kind not in ('tang','hoan','thu_hoi') then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Loại giao dịch không hợp lệ');
  end if;
  if p_tokens is null or p_tokens <= 0 or p_tokens > 100000 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Số token phải là số dương hợp lý',
      'fields', jsonb_build_object('tokens','khong_hop_le'));
  end if;
  if p_reason is null or length(trim(p_reason)) < 5 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Bắt buộc ghi lý do',
      'fields', jsonb_build_object('reason','bat_buoc'));
  end if;
  if p_idem is null or length(trim(p_idem)) = 0 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Thiếu idem_key');
  end if;
  perform 1 from users where id = p_user and deleted_at is null;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy người dùng');
  end if;

  v_amount := case when p_kind = 'thu_hoi' then -p_tokens else p_tokens end;
  v_wallet := ensure_wallet(p_user);
  perform 1 from wallets where id = v_wallet for update;

  begin
    insert into wallet_transactions (wallet_id, kind, amount, idem_key, note)
    values (v_wallet, p_kind, v_amount, 'admin:' || p_idem,
            'Admin · ' || trim(p_reason))
    on conflict (idem_key) do nothing
    returning id into v_tx;
  exception when check_violation then
    return jsonb_build_object('error','khong_du_token',
      'message','Thu hồi vượt quá số dư hiện có của ví',
      'so_du', wallet_so_du(p_user));
  end;

  if v_tx is null then
    return jsonb_build_object('ok', true, 'da_xu_ly', true, 'so_du', wallet_so_du(p_user));
  end if;

  perform admin_log(p_actor, 'adjust_wallet', 'wallet', v_wallet::text, null,
    jsonb_build_object('kind', p_kind, 'amount', v_amount, 'reason', trim(p_reason),
                       'user_id', p_user, 'tx_id', v_tx));
  return jsonb_build_object('ok', true, 'da_xu_ly', false, 'so_du', wallet_so_du(p_user));
end $fn$;

-- ─────────────────────────────────────────────
-- 6. XỬ LÝ BÁO CÁO  (kiem_duyet hoặc admin)
-- ─────────────────────────────────────────────
create or replace function admin_handle_report(
  p_actor uuid, p_report uuid, p_status report_status, p_note text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_old report_status;
begin
  if not admin_has_role(p_actor, array['kiem_duyet','admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Bạn không có quyền');
  end if;
  if p_status not in ('dang_xu_ly','da_xu_ly','bo_qua') then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Trạng thái không hợp lệ');
  end if;
  select status into v_old from reports where id = p_report and deleted_at is null for update;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy báo cáo');
  end if;
  update reports set status = p_status, handled_by = p_actor, handled_at = now() where id = p_report;
  perform admin_log(p_actor, 'handle_report', 'report', p_report::text,
    jsonb_build_object('status', v_old),
    jsonb_build_object('status', p_status, 'reason', nullif(trim(p_note), '')));
  return jsonb_build_object('ok', true);
end $fn$;

-- ─────────────────────────────────────────────
-- 7. DOANH THU  (chỉ admin, chỉ đọc)
--    TÁCH BẠCH hai thứ hay bị trộn:
--      token_tieu_ky  = DOANH THU (đã trừ khi hiển thị tin)
--      no_token       = NỢ PHẢI TRẢ (token đã nạp/tặng, chưa tiêu, còn nằm trong ví)
--    Tiền nạp KHÔNG phải doanh thu. Quy đổi VNĐ dùng p_token_vnd do
--    Edge Function truyền từ một hằng số duy nhất (không hardcode 4000 ở đây).
--    Tỷ lệ gia hạn: trong các khoản phí có kỳ HẾT HẠN rơi vào [từ, đến),
--    bao nhiêu tin đã được trả phí thêm lần nữa SAU khoản đó. Không có mẫu -> null.
-- ─────────────────────────────────────────────
create or replace function admin_revenue(p_actor uuid, p_from date, p_to date, p_token_vnd int)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_nap int; v_tieu int; v_no int; v_payers int; v_mau int; v_gia_han int; v_tinh jsonb;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên xem doanh thu');
  end if;
  if p_from is null or p_to is null or p_to <= p_from then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Khoảng thời gian không hợp lệ');
  end if;

  select coalesce(sum(amount) filter (where kind = 'nap'), 0),
         coalesce(-sum(amount) filter (where kind = 'tieu'), 0)
    into v_nap, v_tieu
    from wallet_transactions where created_at >= p_from and created_at < p_to;

  -- Nợ token: tổng số dư mọi ví. Số dư = tổng sổ, không có cột lưu sẵn.
  select coalesce(sum(amount), 0) into v_no from wallet_transactions;

  select count(distinct user_id) into v_payers
    from charges where created_at >= p_from and created_at < p_to;

  select count(*),
         count(*) filter (where exists (
           select 1 from charges c2
            where c2.listing_id = c.listing_id and c2.created_at > c.created_at))
    into v_mau, v_gia_han
    from charges c where c.period_end >= p_from and c.period_end < p_to;

  select coalesce(jsonb_agg(x order by (x->>'token')::int desc), '[]'::jsonb) into v_tinh
    from (select jsonb_build_object('province_id', p.id, 'ten', p.name,
                                    'token', sum(c.token_amount)) x
            from charges c
            join listings l on l.id = c.listing_id
            join provinces p on p.id = l.province_id
           where c.created_at >= p_from and c.created_at < p_to
           group by p.id, p.name) t;

  return jsonb_build_object(
    'token_nap_ky', v_nap, 'token_tieu_ky', v_tieu,
    'vnd_nap_ky', v_nap * p_token_vnd, 'vnd_doanh_thu_ky', v_tieu * p_token_vnd,
    'no_token', v_no, 'vnd_no_token', v_no * p_token_vnd,
    'chu_xe_tra_tien', v_payers,
    'gia_han_mau', v_mau, 'gia_han_da_gia_han', v_gia_han,
    'ty_le_gia_han', case when v_mau = 0 then null else round(v_gia_han::numeric / v_mau, 4) end,
    'theo_tinh', v_tinh);
end $fn$;

-- ─────────────────────────────────────────────
-- 8. SỨC KHOẺ HỆ THỐNG  (kiem_duyet hoặc admin, chỉ đọc)
--    Lượt xem / lấy số đọc từ `events_daily` — CẤM quét bảng `events` thô
--    (HIEU-NANG.md 2.4 + 7). Hôm nay chưa được gộp nên số ngày gần nhất
--    là hôm qua; giao diện phải nói rõ điều đó.
-- ─────────────────────────────────────────────
create or replace function admin_health(p_actor uuid, p_days int default 14)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_tinh jsonb; v_ngay jsonb; v_bao int; v_cho int;
begin
  if not admin_has_role(p_actor, array['kiem_duyet','admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Bạn không có quyền');
  end if;
  p_days := least(greatest(coalesce(p_days, 14), 1), 90);

  select coalesce(jsonb_agg(jsonb_build_object('province_id', province_id, 'ten', ten, 'so_tin', n)
                            order by n desc), '[]'::jsonb) into v_tinh
    from (select l.province_id, coalesce(p.name, 'Chưa rõ tỉnh') ten, count(*) n
            from listings l left join provinces p on p.id = l.province_id
           where l.status in ('dang_hien_thi','sap_het_han') and l.deleted_at is null
           group by l.province_id, p.name) t;

  select coalesce(jsonb_agg(jsonb_build_object('day', day, 'xem', xem, 'lay_so', lay_so)
                            order by day), '[]'::jsonb) into v_ngay
    from (select day,
                 coalesce(sum(count) filter (where kind = 'view_listing'), 0) xem,
                 coalesce(sum(count) filter (where kind = 'reveal_phone'), 0) lay_so
            from events_daily
           where day >= current_date - p_days
           group by day) t;

  select count(*) into v_bao from reports where status in ('moi','dang_xu_ly') and deleted_at is null;
  select count(*) into v_cho from listings where status = 'cho_duyet' and deleted_at is null;

  return jsonb_build_object('theo_tinh', v_tinh, 'theo_ngay', v_ngay,
                            'bao_cao_chua_xu_ly', v_bao, 'tin_cho_duyet', v_cho);
end $fn$;

-- ─────────────────────────────────────────────
-- 9. QUYỀN GỌI — chỉ service_role.
-- ─────────────────────────────────────────────
do $blk$
declare f text;
begin
  foreach f in array array[
    'admin_has_role(uuid,user_role[])',
    'admin_log(uuid,text,text,text,jsonb,jsonb)',
    'admin_moderate_listing(uuid,uuid,text,text)',
    'admin_plate_conflicts(uuid,uuid)',
    'admin_set_user_lock(uuid,uuid,boolean,text)',
    'admin_set_verified(uuid,uuid,verify_status,text)',
    'admin_adjust_wallet(uuid,uuid,wallet_tx_kind,int,text,text)',
    'admin_handle_report(uuid,uuid,report_status,text)',
    'admin_revenue(uuid,date,date,int)',
    'admin_health(uuid,int)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $blk$;

-- ════════════════════════════════════════════════════════════
do $$ begin raise notice 'XONG — tất cả migration đã chạy.'; end $$;

commit;
