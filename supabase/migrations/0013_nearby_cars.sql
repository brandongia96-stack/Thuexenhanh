-- ============================================================
-- 0013 — "Xe gần bạn": tìm xe trong bán kính, tính khoảng cách TRÊN SERVER.
--
-- Thay bản cũ (client kéo toạ độ của MỌI tin về rồi tự tính Haversine):
--   · bản cũ tải N dòng toạ độ mỗi lần bấm — 10.000 tin là 10.000 dòng
--   · bản này: lọc hộp bao quanh trước (dùng được index), rồi mới tính
--     Haversine trên vài chục dòng, trả tối đa 20 thẻ + khoảng cách.
--
-- Điều kiện hiển thị KHỚP trang tìm kiếm (searchApi.js):
--   status in (dang_hien_thi, sap_het_han) và expires_at > now().
--
-- security INVOKER: chạy bằng quyền của người gọi → RLS + quyền cột của
-- 0010 vẫn áp dụng nguyên vẹn. Hàm không đọc contact_phone/zalo/plate.
--
-- Chạy lại nhiều lần được.
-- ============================================================

create index if not exists listings_lat_lng_idx
  on listings (lat, lng)
  where lat is not null and lng is not null and deleted_at is null;

create or replace function get_nearby_listings(
  p_lat       numeric,
  p_lng       numeric,
  p_radius_km numeric default 50,
  p_limit     int     default 8
)
returns table (
  id                  uuid,
  status              listing_status,
  brand_text          text,
  model_text          text,
  year                int,
  seats               int,
  transmission        transmission,
  fuel                fuel_type,
  price_per_day       int,
  province_id         int,
  district_id         int,
  is_verified         boolean,
  published_at        timestamptz,
  owner_id            uuid,
  ev_range_km         int,
  charge_policy       charge_policy,
  collateral_required boolean,
  cover_thumb         text,
  cover_blur          text,
  cover_width         int,
  cover_height        int,
  distance_km         numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with tham_so as (
    select
      p_lat::float8                                            as lat0,
      p_lng::float8                                            as lng0,
      least(greatest(coalesce(p_radius_km, 50), 1), 100)::float8 as r,
      least(greatest(coalesce(p_limit, 8), 1), 20)             as lim
    where p_lat between -90 and 90 and p_lng between -180 and 180
  ),
  ung_vien as (
    -- Hộp bao quanh: 1 độ vĩ ≈ 111 km. Lọc thô bằng index trước khi tính lượng giác.
    select l.id, l.lat::float8 as lat, l.lng::float8 as lng
    from listings l, tham_so t
    where l.lat is not null and l.lng is not null
      and l.deleted_at is null
      and l.status in ('dang_hien_thi', 'sap_het_han')
      and l.expires_at > now()
      and l.lat between t.lat0 - t.r / 111.0 and t.lat0 + t.r / 111.0
      and l.lng between t.lng0 - t.r / (111.0 * greatest(cos(radians(t.lat0)), 0.01))
                    and t.lng0 + t.r / (111.0 * greatest(cos(radians(t.lat0)), 0.01))
  ),
  co_khoang_cach as (
    select u.id,
      6371 * acos(least(1.0, greatest(-1.0,
        cos(radians(t.lat0)) * cos(radians(u.lat)) * cos(radians(u.lng) - radians(t.lng0))
        + sin(radians(t.lat0)) * sin(radians(u.lat))
      ))) as km
    from ung_vien u, tham_so t
  )
  select
    c.id, c.status, c.brand_text, c.model_text, c.year, c.seats, c.transmission, c.fuel,
    c.price_per_day, c.province_id, c.district_id, c.is_verified, c.published_at, c.owner_id,
    c.ev_range_km, c.charge_policy, c.collateral_required,
    c.cover_thumb, c.cover_blur, c.cover_width, c.cover_height,
    round(k.km::numeric, 1) as distance_km
  from co_khoang_cach k
  join listing_card c on c.id = k.id
  cross join tham_so t
  where k.km <= t.r
  order by k.km asc, c.id
  limit (select lim from tham_so);
$$;

revoke all on function get_nearby_listings(numeric, numeric, numeric, int) from public;
grant execute on function get_nearby_listings(numeric, numeric, numeric, int) to anon, authenticated;

-- Tự kiểm: hàm phải chạy được và toạ độ sai phải ra rỗng chứ không nổ.
do $$
declare n int;
begin
  select count(*) into n from get_nearby_listings(10.77, 106.70);
  select count(*) into n from get_nearby_listings(999, 999);
  if n <> 0 then
    raise exception 'HỎNG — toạ độ không hợp lệ vẫn trả % dòng', n;
  end if;
  raise notice 'OK — get_nearby_listings chạy, toạ độ sai trả rỗng.';
end $$;
