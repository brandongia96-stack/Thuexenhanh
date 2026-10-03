-- Cập nhật view listing_card để lấy report_count
drop view if exists listing_card;
create or replace view listing_card with (security_invoker = true) as
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
  l.lat,
  l.lng,
  l.report_count,
  p.name as province_name,
  d.name as district_name,
  -- Lấy ảnh bìa
  (
    select json_build_object('url_medium', url_medium, 'blur_base64', blur_base64)
    from listing_images
    where listing_id = l.id and deleted_at is null
    order by is_cover desc, sort_order asc
    limit 1
  ) as cover_image
from listings l
left join provinces p on l.province_id = p.id
left join districts d on l.district_id = d.id
where l.deleted_at is null;
