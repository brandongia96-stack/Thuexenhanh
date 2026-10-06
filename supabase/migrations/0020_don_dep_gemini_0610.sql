-- ============================================================
-- 0020 — Dọn sau phiên Gemini 06/10 (commit 9cd7d81, đã chạy thẳng lên production).
-- Chạy SAU 0019. Chạy lại nhiều lần được.
--
-- Phiên đó chạy 3 file trùng số (0018_referral, 0019_listing_package,
-- 0020_mock_verify) — đã xoá khỏi repo, file này ghi lại trạng thái ĐÚNG:
--   · `mock_grant_verified(uuid)` security definer, ai cũng gọi được (kể cả
--     khách chưa đăng nhập) → tự cấp tích xanh cho tin bất kỳ. XOÁ.
--   · `charge_and_publish` bị viết lại: so trạng thái 'da_duyet' (không có
--     trong enum) → NỔ với mọi lần trả phí; bỏ chặn "chưa duyệt không thu
--     tiền", bỏ khoá idem chuẩn. → dựng lại nguyên bản 0004 (bên dưới).
--   · Gói "Đầy đủ" 20 token kèm tích xanh = BÁN TÍCH XANH (cấm, QUYET-DINH 10).
--     Giá giữ 10 token/tháng cho mọi gói. Cột `package_id` giữ lại (vô hại).
--   · Tặng 10 token khi đăng ký + giới thiệu bằng SĐT: không KYC → tạo tài
--     khoản ảo là cày token vô hạn; dò được SĐT nào có tài khoản. XOÁ.
--   · `listing_card` bị DROP lần 2 → dựng lại bản 0018 + `package_id` ở cuối.
-- ============================================================

begin;

do $blk$ begin
  if not exists (select 1 from pg_type where typname = 'listing_package') then
    create type listing_package as enum ('co_ban', 'day_du');
  end if;
end $blk$;
alter table listings add column if not exists package_id listing_package not null default 'co_ban';
alter table users    add column if not exists referred_by_id uuid references users(id);

drop function if exists mock_grant_verified(uuid);
drop trigger  if exists on_auth_user_created on users;
drop function if exists handle_new_user_wallet();
drop function if exists apply_referral(text);

-- ── charge_and_publish: nguyên bản 0004 ──
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
revoke all on function charge_and_publish(uuid,uuid,int,text) from public, anon, authenticated;
grant execute on function charge_and_publish(uuid,uuid,int,text) to service_role;

-- ── listing_card ──
drop view if exists listing_card;
create view listing_card with (security_invoker = true) as
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
  l.package_id
from listings l
left join lateral (
  select url_thumb, blur_base64, width, height
  from listing_images
  where listing_id = l.id and deleted_at is null
  order by is_cover desc, sort_order
  limit 1
) i on true
where l.deleted_at is null;

-- Chỉ đọc. (Bản Gemini để quyền mặc định → authenticated có cả INSERT/UPDATE.)
revoke all on listing_card from anon, authenticated;
grant select on listing_card to anon, authenticated;
do $blk$ declare n int; begin
  n := cap_quyen_cot_listings();
end $blk$;

commit;
