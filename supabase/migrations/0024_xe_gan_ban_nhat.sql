-- ============================================================
-- 0024 — Sắp xếp "Xe gần bạn nhất" + sửa tìm kiếm theo chữ.
-- Chạy SAU 0023. Chạy lại nhiều lần được.
--
--   1. `listing_card` thêm lại `search_tsv` ở CUỐI (create or replace, không
--      drop). Cột này rơi khỏi view từ 0012 → gõ tìm "innova" lỗi 42703.
--   2. Toạ độ trung tâm tỉnh/quận (`provinces.lat/lng`, `districts.lat/lng`).
--      Vị trí xe = toạ độ tin (đã làm tròn ~1 km) → không có thì trung tâm
--      QUẬN → không có thì trung tâm TỈNH. Khoảng cách vì vậy là GẦN ĐÚNG —
--      giao diện phải ghi "khoảng … km".
--   3. `listing_card_gan(p_lat, p_lng)`: trả MỌI cột của listing_card +
--      `distance_km`. Là hàm trả bảng nên PostgREST cho gắn tiếp bộ lọc, sắp
--      xếp, keyset y như đọc view:
--        sb.rpc('listing_card_gan', { p_lat, p_lng }).select(COT).eq(...)
--          .order('distance_km').order('id').limit(21)
--      ⚠️ Thêm cột vào `listing_card` thì PHẢI thêm vào hàm này (cùng thứ tự).
--      security INVOKER → RLS + quyền cột vẫn áp nguyên.
-- ============================================================

begin;

-- ── 1. listing_card + search_tsv ──
-- Hàm cũ (nếu có) phụ thuộc kiểu dòng của view → gỡ trước khi đổi view.
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
  l.search_tsv
from listings l
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

-- ── 2. Toạ độ trung tâm ──
alter table provinces add column if not exists lat numeric(8,4);
alter table provinces add column if not exists lng numeric(8,4);
alter table districts add column if not exists lat numeric(8,4);
alter table districts add column if not exists lng numeric(8,4);

update provinces p set lat = v.lat, lng = v.lng
from (values
  (1, 10.7769, 106.7009),  -- TP.HCM
  (2, 21.0285, 105.8542),  -- Hà Nội
  (3, 16.0544, 108.2022),  -- Đà Nẵng
  (4, 20.8449, 106.6881),  -- Hải Phòng
  (5, 10.0452, 105.7469),  -- Cần Thơ
  (6, 10.3460, 107.0843),  -- Bà Rịa - Vũng Tàu
  (7, 10.9804, 106.6519),  -- Bình Dương
  (8, 10.9574, 106.8427),  -- Đồng Nai
  (9, 12.2388, 109.1967),  -- Khánh Hòa
  (10, 11.9404, 108.4583),  -- Lâm Đồng
  (11, 20.9505, 107.0734),  -- Quảng Ninh
  (12, 19.8067, 105.7852),  -- Thanh Hóa
  (13, 18.6734, 105.6813),  -- Nghệ An
  (14, 16.4637, 107.5909),  -- Thừa Thiên Huế
  (15, 15.5683, 108.4800),  -- Quảng Nam
  (16, 13.7830, 109.2197),  -- Bình Định
  (17, 13.0882, 109.3175),  -- Phú Yên
  (18, 10.9333, 108.1000),  -- Bình Thuận
  (19, 11.5667, 108.9833),  -- Ninh Thuận
  (20, 13.9833, 108.0000),  -- Gia Lai
  (21, 12.6667, 108.0500),  -- Đắk Lắk
  (22, 22.4833, 103.9667),  -- Lào Cai
  (23, 21.3089, 105.6049),  -- Vĩnh Phúc
  (24, 21.1861, 106.0763),  -- Bắc Ninh
  (25, 20.9372, 106.3150),  -- Hải Dương
  (26, 20.6464, 106.0511),  -- Hưng Yên
  (27, 20.4344, 106.1683),  -- Nam Định
  (28, 20.4464, 106.3364),  -- Thái Bình
  (29, 20.2506, 105.9745),  -- Ninh Bình
  (30, 10.5333, 106.4167),  -- Long An
  (31, 10.3600, 106.3600),  -- Tiền Giang
  (32, 10.0167, 105.0833),  -- Kiên Giang
  (33, 10.3833, 105.4167),  -- An Giang
  (34, 9.6033, 105.9800),  -- Sóc Trăng
  (35, 9.1769, 105.1524),  -- Cà Mau
  (36, 12.0000, 107.6833),  -- Đắk Nông
  (37, 14.3500, 108.0000),  -- Kon Tum
  (38, 11.7500, 106.9000),  -- Bình Phước
  (39, 11.3100, 106.0983)  -- Tây Ninh
) as v(id, lat, lng) where p.id = v.id;

update districts d set lat = v.lat, lng = v.lng
from (values
  (1, 10.7756, 106.7019),  -- Quận 1
  (2, 10.7844, 106.6843),  -- Quận 3
  (3, 10.7578, 106.7013),  -- Quận 4
  (4, 10.7540, 106.6634),  -- Quận 5
  (5, 10.7481, 106.6352),  -- Quận 6
  (6, 10.7340, 106.7218),  -- Quận 7
  (7, 10.7241, 106.6286),  -- Quận 8
  (8, 10.7716, 106.6672),  -- Quận 10
  (9, 10.7629, 106.6504),  -- Quận 11
  (10, 10.8672, 106.6413),  -- Quận 12
  (11, 10.8106, 106.7091),  -- Bình Thạnh
  (12, 10.8388, 106.6653),  -- Gò Vấp
  (13, 10.7992, 106.6803),  -- Phú Nhuận
  (14, 10.8015, 106.6526),  -- Tân Bình
  (15, 10.7901, 106.6280),  -- Tân Phú
  (16, 10.7654, 106.6038),  -- Bình Tân
  (17, 10.6874, 106.5939),  -- Bình Chánh
  (18, 10.4114, 106.9547),  -- Cần Giờ
  (19, 11.0067, 106.4946),  -- Củ Chi
  (20, 10.8841, 106.5916),  -- Hóc Môn
  (21, 10.6953, 106.7327),  -- Nhà Bè
  (22, 10.8494, 106.7537),  -- Thủ Đức
  (23, 21.0285, 105.8542),  -- Hoàn Kiếm
  (24, 21.0352, 105.8239),  -- Ba Đình
  (25, 21.0181, 105.8256),  -- Đống Đa
  (26, 21.0056, 105.8576),  -- Hai Bà Trưng
  (27, 20.9754, 105.8458),  -- Hoàng Mai
  (28, 21.0362, 105.8942),  -- Long Biên
  (29, 21.0718, 105.8239),  -- Tây Hồ
  (30, 21.0362, 105.7906),  -- Cầu Giấy
  (31, 20.9937, 105.8118),  -- Thanh Xuân
  (32, 20.9719, 105.7728),  -- Hà Đông
  (33, 21.1372, 105.8456),  -- Đông Anh
  (34, 21.0219, 105.9408),  -- Gia Lâm
  (35, 21.2583, 105.8500),  -- Sóc Sơn
  (36, 21.0450, 105.7500),  -- Từ Liêm
  (37, 20.8700, 105.8600),  -- Thường Tín
  (38, 21.1800, 105.7100),  -- Mê Linh
  (39, 16.0594, 108.2208),  -- Hải Châu
  (40, 16.0642, 108.1884),  -- Thanh Khê
  (41, 16.0967, 108.1432),  -- Liên Chiểu
  (42, 16.0125, 108.2575),  -- Ngũ Hành Sơn
  (43, 16.0886, 108.2435),  -- Sơn Trà
  (44, 16.0175, 108.1994),  -- Cẩm Lệ
  (45, 16.0245, 108.1132),  -- Hòa Vang
  (46, 20.8653, 106.6664),  -- Hồng Bàng
  (47, 20.8529, 106.7001),  -- Ngô Quyền
  (48, 20.8471, 106.6782),  -- Lê Chân
  (49, 20.8033, 106.6267),  -- Kiến An
  (50, 20.8358, 106.7267),  -- Hải An
  (51, 20.7067, 106.7900),  -- Đồ Sơn
  (52, 20.7850, 106.7117),  -- Dương Kinh
  (53, 20.9333, 106.6833),  -- Thuỷ Nguyên
  (54, 20.8667, 106.6000),  -- An Dương
  (55, 20.8000, 106.5500),  -- An Lão
  (56, 20.7667, 106.6500),  -- Kiến Thụy
  (57, 20.7167, 106.5500),  -- Tiên Lãng
  (58, 20.6833, 106.4833),  -- Vĩnh Bảo
  (59, 20.7250, 107.0500),  -- Cát Hải
  (60, 10.0342, 105.7797),  -- Ninh Kiều
  (61, 10.0708, 105.7483),  -- Bình Thủy
  (62, 10.0033, 105.7663),  -- Cái Răng
  (63, 10.1167, 105.6333),  -- Ô Môn
  (64, 10.2833, 105.5333),  -- Thốt Nốt
  (65, 9.9833, 105.6833),  -- Phong Điền
  (66, 10.1000, 105.4500),  -- Cờ Đỏ
  (67, 10.0667, 105.5500),  -- Thới Lai
  (68, 10.2167, 105.4000)  -- Vĩnh Thạnh
) as v(id, lat, lng) where d.id = v.id;

-- ── 3. Hàm tìm theo khoảng cách ──
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
  distance_km numeric
)
language sql stable security invoker set search_path = public
as $$
  select c.id, c.status, c.brand_text, c.model_text, c.year, c.seats, c.transmission, c.fuel, c.price_per_day, c.province_id, c.district_id, c.is_verified, c.published_at, c.expires_at, c.owner_id, c.amenity_codes, c.ev_range_km, c.charge_policy, c.collateral_required, c.cover_thumb, c.cover_blur, c.cover_width, c.cover_height, c.report_count, c.package_id, c.search_tsv,
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

-- ── Tự kiểm ──
do $blk$
declare n int;
begin
  if (select count(*) from provinces where lat is null) > 0 then
    raise exception 'HỎNG — còn tỉnh chưa có toạ độ'; end if;
  select count(*) into n from listing_card_gan(999, 999);
  if n <> 0 then raise exception 'HỎNG — toạ độ sai vẫn trả dòng'; end if;
  select count(*) into n from listing_card_gan(10.77, 106.70);
  if n <> (select count(*) from listing_card) then
    raise exception 'HỎNG — listing_card_gan trả % dòng, lệch với listing_card', n; end if;
  if (select count(*) from information_schema.columns where table_schema = 'public'
        and table_name = 'listing_card' and column_name in ('owner_id', 'cover_thumb', 'search_tsv')) <> 3 then
    raise exception 'HỎNG — listing_card thiếu cột'; end if;
  raise notice 'OK — 0024.';
end $blk$;

commit;
