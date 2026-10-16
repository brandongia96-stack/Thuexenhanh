-- ============================================================
-- 0025 — Hồ sơ CÔNG KHAI của chủ xe (avatar trên thẻ xe, trang chủ xe).
-- Chạy SAU 0024. Chạy lại nhiều lần được.
--
-- Bảng `users` chỉ chính chủ + admin đọc được (có email, SĐT). Khách cần
-- biết "ai cho thuê" (Luật TMĐT — công khai thông tin người bán ở mức tối
-- thiểu, PL-21) nhưng KHÔNG được thấy email/SĐT/CCCD.
--
-- `owner_public`: view KHÔNG security_invoker (chạy bằng quyền chủ view) nên
-- đọc được users, nhưng CHỈ trả 6 cột an toàn và CHỈ người đang có ít nhất
-- một tin hiển thị — người dùng thường không lộ ra ở đây:
--   id · ten_hien_thi (TÊN GỌI = chữ cuối của họ tên, "Huỳnh Bảo Gia" → "Gia")
--   avatar_url · da_xac_minh · tham_gia_tu (tháng) · so_xe_dang_cho_thue
--
-- `listing_card` thêm `owner_ten`, `owner_avatar` ở CUỐI → thẻ xe có avatar
-- mà không tốn thêm request. `listing_card_gan` dựng lại cho khớp cột.
-- ============================================================

begin;

create or replace view owner_public as
select
  u.id,
  coalesce(nullif(
    upper(left(regexp_replace(trim(u.full_name), '^.*\s', ''), 1))
      || substr(regexp_replace(trim(u.full_name), '^.*\s', ''), 2), ''), 'Chủ xe') as ten_hien_thi,
  u.avatar_url,
  (u.verify_status = 'da_xac_minh') as da_xac_minh,
  date_trunc('month', u.created_at)::date as tham_gia_tu,
  x.so_xe as so_xe_dang_cho_thue
from users u
join lateral (
  select count(*)::int as so_xe
  from listings l
  where l.owner_id = u.id and l.deleted_at is null
    and l.status in ('dang_hien_thi', 'sap_het_han') and l.expires_at > now()
) x on x.so_xe > 0
where u.deleted_at is null;

revoke all on owner_public from anon, authenticated;
grant select on owner_public to anon, authenticated;

-- listing_card phụ thuộc kiểu dòng → gỡ hàm trước khi đổi view.
drop function if exists listing_card_gan(numeric, numeric);

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
  op.avatar_url   as owner_avatar
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
  distance_km numeric
)
language sql stable security invoker set search_path = public
as $$
  select c.id, c.status, c.brand_text, c.model_text, c.year, c.seats, c.transmission, c.fuel, c.price_per_day, c.province_id, c.district_id, c.is_verified, c.published_at, c.expires_at, c.owner_id, c.amenity_codes, c.ev_range_km, c.charge_policy, c.collateral_required, c.cover_thumb, c.cover_blur, c.cover_width, c.cover_height, c.report_count, c.package_id, c.search_tsv, c.owner_ten, c.owner_avatar,
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

do $blk$
declare n int;
begin
  -- Không được lộ cột nào ngoài 6 cột đã định.
  select count(*) into n from information_schema.columns
  where table_schema = 'public' and table_name = 'owner_public'
    and column_name not in ('id', 'ten_hien_thi', 'avatar_url', 'da_xac_minh', 'tham_gia_tu', 'so_xe_dang_cho_thue');
  if n > 0 then raise exception 'HỎNG — owner_public lộ cột ngoài danh sách'; end if;
  select count(*) into n from listing_card_gan(10.77, 106.70);
  if n <> (select count(*) from listing_card) then raise exception 'HỎNG — listing_card_gan lệch'; end if;
  raise notice 'OK — 0025.';
end $blk$;

commit;
