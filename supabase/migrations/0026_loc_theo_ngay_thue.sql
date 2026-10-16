-- ============================================================
-- 0026 — Lọc xe theo NGÀY THUÊ, đồng bộ với lịch bận của chủ xe.
-- Chạy SAU 0025. Chạy lại nhiều lần được.
--
-- Nguồn duy nhất: `listing_blocked_dates` — chính bảng chủ xe khai trong
-- từng tin và màn "Lịch xe tổng" đang đọc. Không có bảng lịch thứ hai, nên
-- chủ xe sửa lịch ở đâu thì bộ lọc thấy ngay ở đó.
--
-- ⚠️ App KHÔNG có đặt xe. "Trống" = chủ xe CHƯA khai bận ngày đó, không phải
-- đã giữ chỗ. Vì vậy thêm `calendar_updated_at`: lần cuối chủ xe sửa lịch —
-- giao diện ghi "Lịch cập nhật N ngày trước" để khách tự cân nhắc.
--
--   1. `listings.calendar_updated_at` + trigger trên listing_blocked_dates.
--   2. `listing_card` thêm `calendar_updated_at` ở CUỐI.
--   3. `listing_card_tim(p_lat, p_lng, p_tu, p_den)` — cả 4 tham số TUỲ CHỌN:
--        · có p_tu + p_den → bỏ xe có khoảng bận chồng lên [p_tu, p_den]
--        · có p_lat + p_lng → có distance_km để xếp "Gần bạn nhất"
--      Gắn tiếp bộ lọc/keyset như view. `select` PHẢI có `id`.
--   4. `listing_card_gan` giữ nguyên chữ ký (luồng 04 đang dùng), dựng lại cho
--      khớp cột mới.
--   ⚠️ Thêm cột vào listing_card → thêm vào CẢ HAI hàm (cùng thứ tự).
-- ============================================================

begin;

-- ── 1. Mốc cập nhật lịch ──
alter table listings add column if not exists calendar_updated_at timestamptz;

create or replace function listings_danh_dau_lich() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  update listings set calendar_updated_at = now()
   where id = coalesce(new.listing_id, old.listing_id);
  return null;
end $fn$;
revoke all on function listings_danh_dau_lich() from public, anon, authenticated;

drop trigger if exists listing_blocked_dates_danh_dau on listing_blocked_dates;
create trigger listing_blocked_dates_danh_dau
  after insert or update or delete on listing_blocked_dates
  for each row execute function listings_danh_dau_lich();

do $blk$ declare n int; begin n := cap_quyen_cot_listings(); end $blk$;

-- Index cho phép lọc chồng khoảng (listing_id, date_from) đã có từ 0001;
-- thêm date_to để Postgres khỏi đọc lại bảng.
create index if not exists listing_blocked_dates_khoang_idx
  on listing_blocked_dates (listing_id, date_from, date_to) where deleted_at is null;

-- ── 2. listing_card ──
drop function if exists listing_card_gan(numeric, numeric);
drop function if exists listing_card_tim(numeric, numeric, date, date);

create or replace view listing_card with (security_invoker = true) as
select
  l.id, l.status, l.brand_text, l.model_text, l.year, l.seats,
  l.transmission, l.fuel, l.price_per_day,
  l.province_id, l.district_id, l.is_verified,
  l.published_at, l.expires_at, l.owner_id, l.amenity_codes,
  l.ev_range_km,
  l.charge_policy,
  l.collateral_required,
  i.url_thumb   as cover_thumb,
  i.blur_base64 as cover_blur,
  i.width       as cover_width,
  i.height      as cover_height,
  l.report_count,
  l.package_id,
  -- Chỉ để LỌC (textSearch), client không select cột này. Bị rơi khỏi view từ
  -- 0012 → ô tìm kiếm theo chữ lỗi 42703 trên production.
  l.search_tsv,
  -- Chủ xe công khai (0025). Đọc qua view owner_public — không chạm bảng users.
  op.ten_hien_thi as owner_ten,
  op.avatar_url   as owner_avatar,
  -- Lần cuối chủ xe sửa lịch bận (0026) — khách biết lịch có đáng tin không.
  l.calendar_updated_at
from listings l
left join owner_public op on op.id = l.owner_id
left join lateral (
  select url_thumb, blur_base64, width, height
  from listing_images
  where listing_id = l.id and deleted_at is null
  order by is_cover desc, sort_order
  limit 1
) i on true
where l.deleted_at is null;

revoke all on listing_card from anon, authenticated;
grant select on listing_card to anon, authenticated;

-- ── 3 + 4. Hai hàm tìm ──
create function listing_card_gan(p_lat numeric, p_lng numeric)
returns table (
  id uuid,
  status listing_status,
  brand_text text,
  model_text text,
  year integer,
  seats integer,
  transmission transmission,
  fuel fuel_type,
  price_per_day integer,
  province_id integer,
  district_id integer,
  is_verified boolean,
  published_at timestamp with time zone,
  expires_at timestamp with time zone,
  owner_id uuid,
  amenity_codes text[],
  ev_range_km integer,
  charge_policy charge_policy,
  collateral_required boolean,
  cover_thumb text,
  cover_blur text,
  cover_width integer,
  cover_height integer,
  report_count integer,
  package_id listing_package,
  search_tsv tsvector,
  owner_ten text,
  owner_avatar text,
  calendar_updated_at timestamp with time zone,
  distance_km numeric
)
language sql stable security invoker set search_path = public
as $$
  select c.id, c.status, c.brand_text, c.model_text, c.year, c.seats, c.transmission, c.fuel, c.price_per_day, c.province_id, c.district_id, c.is_verified, c.published_at, c.expires_at, c.owner_id, c.amenity_codes, c.ev_range_km, c.charge_policy, c.collateral_required, c.cover_thumb, c.cover_blur, c.cover_width, c.cover_height, c.report_count, c.package_id, c.search_tsv, c.owner_ten, c.owner_avatar, c.calendar_updated_at,
    round((6371 * acos(least(1.0, greatest(-1.0,
      cos(radians(p_lat::float8)) * cos(radians(t.lat)) * cos(radians(t.lng) - radians(p_lng::float8))
      + sin(radians(p_lat::float8)) * sin(radians(t.lat))
    ))))::numeric, 1) as distance_km
  from listing_card c
  join listings l on l.id = c.id
  left join districts d on d.id = c.district_id
  left join provinces p on p.id = c.province_id
  cross join lateral (
    select coalesce(l.lat, d.lat, p.lat)::float8 as lat,
           coalesce(l.lng, d.lng, p.lng)::float8 as lng
  ) t
  where p_lat between -90 and 90 and p_lng between -180 and 180
    and t.lat is not null and t.lng is not null
$$;

revoke all on function listing_card_gan(numeric, numeric) from public;
grant execute on function listing_card_gan(numeric, numeric) to anon, authenticated;

create function listing_card_tim(p_lat numeric default null, p_lng numeric default null,
  p_tu date default null, p_den date default null)
returns table (
  id uuid,
  status listing_status,
  brand_text text,
  model_text text,
  year integer,
  seats integer,
  transmission transmission,
  fuel fuel_type,
  price_per_day integer,
  province_id integer,
  district_id integer,
  is_verified boolean,
  published_at timestamp with time zone,
  expires_at timestamp with time zone,
  owner_id uuid,
  amenity_codes text[],
  ev_range_km integer,
  charge_policy charge_policy,
  collateral_required boolean,
  cover_thumb text,
  cover_blur text,
  cover_width integer,
  cover_height integer,
  report_count integer,
  package_id listing_package,
  search_tsv tsvector,
  owner_ten text,
  owner_avatar text,
  calendar_updated_at timestamp with time zone,
  distance_km numeric
)
language sql stable security invoker set search_path = public
as $$
  select c.id, c.status, c.brand_text, c.model_text, c.year, c.seats, c.transmission, c.fuel, c.price_per_day, c.province_id, c.district_id, c.is_verified, c.published_at, c.expires_at, c.owner_id, c.amenity_codes, c.ev_range_km, c.charge_policy, c.collateral_required, c.cover_thumb, c.cover_blur, c.cover_width, c.cover_height, c.report_count, c.package_id, c.search_tsv, c.owner_ten, c.owner_avatar, c.calendar_updated_at,
    case when p_lat is null or p_lng is null then null else round((6371 * acos(least(1.0, greatest(-1.0,
      cos(radians(p_lat::float8)) * cos(radians(t.lat)) * cos(radians(t.lng) - radians(p_lng::float8))
      + sin(radians(p_lat::float8)) * sin(radians(t.lat))
    ))))::numeric, 1) end as distance_km
  from listing_card c
  join listings l on l.id = c.id
  left join districts d on d.id = c.district_id
  left join provinces p on p.id = c.province_id
  cross join lateral (
    select coalesce(l.lat, d.lat, p.lat)::float8 as lat,
           coalesce(l.lng, d.lng, p.lng)::float8 as lng
  ) t
  where -- Vị trí: không gửi thì bỏ qua (distance_km = null); gửi sai thì rỗng.
    (p_lat is null or p_lng is null
       or (p_lat between -90 and 90 and p_lng between -180 and 180
           and t.lat is not null and t.lng is not null))
    -- Ngày: chỉ lọc khi có ĐỦ hai đầu và hợp lệ; ngày ngược / quá 180 ngày → rỗng.
    and (p_tu is null or p_den is null
       or (p_den >= p_tu and p_den - p_tu <= 180
           and not exists (
             select 1 from listing_blocked_dates b
             where b.listing_id = c.id and b.deleted_at is null
               and b.date_from <= p_den and b.date_to >= p_tu)))
$$;

revoke all on function listing_card_tim(numeric, numeric, date, date) from public;
grant execute on function listing_card_tim(numeric, numeric, date, date) to anon, authenticated;

-- ── Tự kiểm (trong giao dịch, dữ liệu thử bị huỷ cùng savepoint) ──
do $blk$
declare n_all int; n int; v_id uuid;
begin
  select count(*) into n_all from listing_card;
  if (select count(*) from listing_card_tim()) <> n_all then
    raise exception 'HỎNG — listing_card_tim() không tham số phải trả đủ dòng'; end if;
  if (select count(*) from listing_card_gan(10.77, 106.70)) <> n_all then
    raise exception 'HỎNG — listing_card_gan lệch'; end if;
  if (select count(*) from listing_card_tim(p_tu => '2026-12-10', p_den => '2026-12-01')) <> 0 then
    raise exception 'HỎNG — ngày ngược phải ra rỗng'; end if;
  raise notice 'OK — 0026.';
end $blk$;

commit;
