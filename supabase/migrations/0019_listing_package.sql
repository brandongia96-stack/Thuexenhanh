create type listing_package as enum ('co_ban', 'day_du');

alter table listings add column if not exists package_id listing_package not null default 'co_ban';

-- Cập nhật view `listing_card` để hiển thị `package_id` nếu cần thiết (không cần thiết thì thôi, nhưng cứ thêm)
drop view if exists listing_card;
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
  l.lat,
  l.lng,
  l.report_count,
  l.package_id,
  p.name as province_name,
  d.name as district_name,
  (
    select json_build_object('url_medium', url_medium, 'blur_base64', blur_base64)
    from listing_images
    where listing_id = l.id and deleted_at is null
    order by is_cover desc, sort_order asc
    limit 1
  ) as cover_image,
  l.ev_range_km,
  l.charge_policy,
  l.collateral_required,
  (select url_thumb from listing_images where listing_id = l.id and deleted_at is null order by is_cover desc, sort_order asc limit 1) as cover_thumb,
  (select blur_base64 from listing_images where listing_id = l.id and deleted_at is null order by is_cover desc, sort_order asc limit 1) as cover_blur,
  (select width from listing_images where listing_id = l.id and deleted_at is null order by is_cover desc, sort_order asc limit 1) as cover_width,
  (select height from listing_images where listing_id = l.id and deleted_at is null order by is_cover desc, sort_order asc limit 1) as cover_height
from listings l
left join provinces p on l.province_id = p.id
left join districts d on l.district_id = d.id
where l.deleted_at is null;

-- Update charge_and_publish để tính giá theo gói
create or replace function charge_and_publish(
  p_user_id    uuid,
  p_listing_id uuid,
  p_months     int,
  p_idem_key   text
) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  v_listing listings%rowtype;
  v_charge  charges%rowtype;
  v_wallet  uuid;
  v_so_du   int;
  v_tokens  int;
  v_bat_dau timestamptz;
  v_het_han timestamptz;
  v_kind    charge_kind;
  v_token_per_month int;
begin
  if p_months is null or p_months < 1 or p_months > 12 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le',
                              'message', 'Số tháng phải từ 1 đến 12',
                              'fields', jsonb_build_object('months', 'out_of_range'));
  end if;

  select * into v_listing from listings where id = p_listing_id for update;
  if not found then
    return jsonb_build_object('error', 'khong_tim_thay', 'message', 'Không tìm thấy tin');
  end if;
  if v_listing.owner_id <> p_user_id then
    return jsonb_build_object('error', 'khong_co_quyen', 'message', 'Tin không thuộc về bạn');
  end if;
  if v_listing.deleted_at is not null then
    return jsonb_build_object('error', 'trang_thai_khong_hop_le', 'message', 'Tin đã bị xoá');
  end if;
  if v_listing.status not in ('da_duyet', 'sap_het_han', 'het_han') then
    return jsonb_build_object('error', 'trang_thai_khong_hop_le',
                              'message', 'Tin đang ở trạng thái không thể thanh toán',
                              'status', v_listing.status);
  end if;

  -- Tính token dựa trên package_id
  if v_listing.package_id = 'day_du' then
    v_token_per_month := 20;
  else
    v_token_per_month := 10;
  end if;

  v_tokens := v_token_per_month * p_months;

  select w.id into v_wallet from wallets w where w.user_id = p_user_id for update;
  if not found then
    return jsonb_build_object('error', 'loi_he_thong', 'message', 'Không tìm thấy ví');
  end if;

  select coalesce(sum(amount), 0) into v_so_du from wallet_transactions where wallet_id = v_wallet;
  if v_so_du < v_tokens then
    return jsonb_build_object('error', 'thieu_so_du',
                              'message', format('Bạn cần %s token nhưng ví chỉ còn %s', v_tokens, v_so_du),
                              'required', v_tokens, 'balance', v_so_du);
  end if;

  -- Tránh trùng (idem)
  if exists (select 1 from wallet_transactions where wallet_id = v_wallet and idem_key = p_idem_key) then
    return jsonb_build_object('success', true, 'message', 'Đã xử lý trước đó');
  end if;

  v_bat_dau := now();
  if v_listing.expires_at is not null and v_listing.expires_at > now() then
    v_bat_dau := v_listing.expires_at;
    v_kind := 'gia_han';
  else
    v_kind := 'dang_tin';
  end if;
  v_het_han := v_bat_dau + (p_months || ' months')::interval;

  insert into wallet_transactions (wallet_id, kind, amount, idem_key)
  values (v_wallet, 'tieu', -v_tokens, p_idem_key)
  returning id into v_charge.id;

  insert into charges (id, user_id, listing_id, period_months, token_amount, period_start, period_end)
  values (v_charge.id, p_user_id, p_listing_id, p_months, v_tokens, v_bat_dau, v_het_han);

  update wallet_transactions set charge_id = v_charge.id where id = v_charge.id;

  update listings
     set status = 'dang_hien_thi',
         published_at = coalesce(published_at, now()),
         expires_at = v_het_han
   where id = p_listing_id;

  return jsonb_build_object('success', true, 'new_status', 'dang_hien_thi', 'expires_at', v_het_han);
end $fn$;
