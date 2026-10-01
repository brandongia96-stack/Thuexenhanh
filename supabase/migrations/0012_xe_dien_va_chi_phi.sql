-- ============================================================
-- Luồng 01 — XE ĐIỆN + CHI PHÍ DẠNG SỐ. Chạy SAU 0011.
-- Theo `NGHIEN-CUU-XE-DIEN.md` mục 3.
--
-- Ba việc:
--   1. 9 cột xe điện + 6 cột chi phí dạng số trên `listings`
--   2. Bảng `reference_prices` (giá xăng/điện, có nguồn và ngày áp dụng)
--   3. `listing_card` thêm đúng 3 cột
--
-- ⚠️ BẪY LỚN NHẤT của file này: `0010_bao_ve_sdt.sql` đã HẠ quyền đọc mức
-- BẢNG của `listings` rồi cấp lại theo từng CỘT. Nghĩa là mọi cột thêm sau
-- đó mặc định KHÔNG AI ĐỌC ĐƯỢC. Thêm cột mà quên cấp quyền thì giao diện
-- lặng lẽ thiếu dữ liệu, không báo lỗi gì — rất khó truy.
--
-- Nên đoạn cấp quyền được gói thành hàm `cap_quyen_cot_listings()` dùng lại
-- được. LUỒNG SAU THÊM CỘT VÀO `listings` thì gọi hàm đó ở cuối migration.
-- ============================================================

begin;

-- ── 1. Kiểu liệt kê mới ──
do $blk$ begin
  if not exists (select 1 from pg_type where typname = 'charge_policy') then
    create type charge_policy as enum ('mien_phi', 'mien_phi_gioi_han', 'tinh_theo_phan_tram', 'khach_tu_sac');
  end if;
  if not exists (select 1 from pg_type where typname = 'battery_ownership') then
    create type battery_ownership as enum ('mua', 'thue');
  end if;
end $blk$;

-- ── 2. Cột mới trên listings ──
-- Tất cả NULL được: 10 tin demo đang có sẽ nhận null, không vỡ dòng nào.
-- Riêng `collateral_required` để `not null default false` vì bộ lọc cần
-- true/false rõ ràng — null ở đây sẽ thành "không biết có phải thế chấp
-- không", mà khách lọc "không thế chấp" thì phải tin được kết quả.
alter table listings
  -- Chi phí dạng số (giữ nguyên các cột `*_note` cũ, không bỏ)
  add column if not exists price_per_hour      int,
  add column if not exists deposit_amount      int,
  add column if not exists collateral_required boolean not null default false,
  add column if not exists collateral_note     text,
  add column if not exists delivery_fee        int,
  add column if not exists delivery_radius_km  int,
  -- Xe điện
  add column if not exists ev_range_km         int,
  add column if not exists battery_kwh         numeric(5,1),
  add column if not exists charge_policy       charge_policy,
  add column if not exists free_charge_km      int,
  add column if not exists charge_fee_per_pct  int,
  add column if not exists pickup_min_pct      int,
  add column if not exists return_min_pct      int,
  add column if not exists has_portable_charger boolean,
  add column if not exists battery_ownership   battery_ownership;

-- Lọc "chỉ xe không cần thế chấp" và "xe điện đi được trên X km".
create index if not exists listings_collateral_idx on listings (collateral_required)
  where status in ('dang_hien_thi', 'sap_het_han') and deleted_at is null;
create index if not exists listings_ev_range_idx on listings (ev_range_km)
  where ev_range_km is not null and deleted_at is null;

-- ── 3. Bảng giá tham chiếu ──
create table if not exists reference_prices (
  id             serial primary key,
  code           text not null,
  label          text not null,
  unit           text not null,
  price          int not null check (price > 0),
  source         text not null,
  source_url     text,
  effective_date date not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (code, effective_date)
);
create index if not exists reference_prices_now_idx on reference_prices (code, effective_date desc);

create or replace view reference_price_now with (security_invoker = true) as
select distinct on (code)
  code, label, unit, price, source, source_url, effective_date
from reference_prices
where deleted_at is null and effective_date <= current_date
order by code, effective_date desc;

alter table reference_prices enable row level security;

drop policy if exists reference_prices_read  on reference_prices;
drop policy if exists reference_prices_admin on reference_prices;
create policy reference_prices_read  on reference_prices for select using (deleted_at is null);
create policy reference_prices_admin on reference_prices for all    using (has_role('admin'));

drop trigger if exists reference_prices_touch on reference_prices;
create trigger reference_prices_touch before update on reference_prices
  for each row execute function touch_updated_at();

-- CỐ Ý KHÔNG nạp sẵn giá xăng/điện. Một con số bịa trông y hệt con số thật,
-- và bảng tính sẽ cho ra kết quả sai mà không ai biết (CLAUDE.md 1.2).
-- Luồng 10 làm màn admin để nhập giá thật kèm nguồn.
-- Chưa có giá -> giao diện ẩn cả khối "ước tính chi phí", không hiện số 0.

-- ── 4. listing_card: thêm đúng 3 cột ──
-- `create or replace view` chỉ cho THÊM cột vào cuối, nên drop rồi dựng lại
-- để đặt 3 cột xe điện ngay trước nhóm ảnh cho dễ đọc.
drop view if exists listing_card;
create view listing_card with (security_invoker = true) as
select
  l.id, l.status, l.brand_text, l.model_text, l.year, l.seats,
  l.transmission, l.fuel, l.price_per_day,
  l.province_id, l.district_id, l.is_verified,
  l.published_at, l.expires_at, l.owner_id, l.amenity_codes,
  -- Chỉ 3 trường, đúng thứ cần cho thẻ và bộ lọc. Thẻ xe nhân với 20 tin mỗi
  -- trang nên thêm cột là thêm byte cho mọi khách (HIEU-NANG.md mục 2.1).
  l.ev_range_km,
  l.charge_policy,
  l.collateral_required,
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

grant select on listing_card to anon, authenticated;

-- ── 5. Cấp lại quyền theo cột (BẮT BUỘC sau mỗi lần thêm cột) ──
-- Gói thành hàm để luồng sau khỏi phải chép lại logic và khỏi quên.
create or replace function cap_quyen_cot_listings()
returns int language plpgsql security definer set search_path = public as $fn$
declare
  -- Cột KHÔNG được để anon/authenticated đọc. Thêm cột nhạy cảm mới thì
  -- thêm tên vào đây, đừng sửa chỗ khác.
  cam text[] := array['contact_phone', 'contact_zalo', 'plate'];
  ds  text;
  n   int;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position), count(*)
  into ds, n
  from information_schema.columns
  where table_schema = 'public' and table_name = 'listings'
    and not (column_name = any(cam));

  if ds is null then
    raise exception 'Không đọc được cột của bảng listings';
  end if;

  revoke select on listings from anon, authenticated;
  execute format('grant select (%s) on listings to anon, authenticated', ds);
  grant select on listings to service_role;
  return n;
end $fn$;

revoke all on function cap_quyen_cot_listings() from public, anon, authenticated;

do $blk$
declare n int;
begin
  n := cap_quyen_cot_listings();
  raise notice 'Đã cấp quyền đọc % cột công khai của listings.', n;
end $blk$;

-- ── 6. Tự kiểm: chạy xong mà sai thì nổ ngay tại đây ──
do $blk$
declare n int;
begin
  -- 6a. Ba cột nhạy cảm vẫn phải kín sau khi cấp lại quyền.
  select count(*) into n
  from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'listings'
    and grantee in ('anon', 'authenticated')
    and column_name in ('contact_phone', 'contact_zalo', 'plate')
    and privilege_type = 'SELECT';
  if n > 0 then
    raise exception 'HỎNG — cấp lại quyền đã làm hở % cột nhạy cảm', n;
  end if;

  -- 6b. Cột mới phải đọc được, nếu không giao diện thiếu dữ liệu trong im lặng.
  select count(*) into n
  from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'listings'
    and grantee = 'anon' and privilege_type = 'SELECT'
    and column_name in ('ev_range_km', 'charge_policy', 'collateral_required',
                        'deposit_amount', 'delivery_fee', 'price_per_hour');
  if n <> 6 then
    raise exception 'HỎNG — anon mới đọc được %/6 cột mới', n;
  end if;

  -- 6c. 10 tin demo không được mất dòng nào.
  select count(*) into n from listing_card;
  raise notice 'listing_card còn % dòng.', n;

  raise notice 'OK — xe điện + chi phí dạng số đã vào, quyền đúng.';
end $blk$;

commit;
