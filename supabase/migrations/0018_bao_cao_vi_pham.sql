-- ============================================================
-- 0018 — Báo cáo vi phạm: đếm báo cáo ĐÃ XÁC NHẬN + cho người duyệt xử lý.
-- Chạy SAU 0017. Chạy lại nhiều lần được.
--
-- Thay cho hai file phiên Gemini (03/10) — 0016_report_count.sql và
-- 0017_report_count_view.sql — trùng số với 0016/0017 đã chạy, và file view
-- đã được chạy trên production: DROP rồi dựng `listing_card` với bộ cột khác
-- (mất owner_id, amenity_codes, ev_range_km, cover_thumb...) → trang tìm xe,
-- Xe gần bạn, Xe đã lưu, màn chủ xe đều sập. File này dựng lại view đúng.
--
-- Luật:
--   · `report_count` chỉ tăng khi người duyệt XÁC NHẬN (da_xu_ly). Báo cáo
--     mới chưa xét không được hiện ra công khai — ai cũng bấm được, hiện ngay
--     là công cụ bôi nhọ đối thủ.
--   · Chủ xe KHÔNG được tự sửa `report_count` (đưa vào trigger chặn cột).
--   · Người duyệt (kiem_duyet/admin) cập nhật được trạng thái báo cáo — trước
--     đây không có policy UPDATE nên bấm "Xác nhận" không đổi gì mà không báo lỗi.
-- ============================================================

begin;

-- ── 1. Cột ──
alter table listings add column if not exists report_count int not null default 0;

-- ── 2. Đếm khi người duyệt xác nhận / đổi ý ──
create or replace function update_listing_report_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.status = 'da_xu_ly' and old.status is distinct from 'da_xu_ly' then
    update listings set report_count = report_count + 1 where id = new.listing_id;
  elsif old.status = 'da_xu_ly' and new.status is distinct from 'da_xu_ly' then
    update listings set report_count = greatest(0, report_count - 1) where id = new.listing_id;
  end if;
  return new;
end $fn$;

drop trigger if exists on_report_status_change on reports;
create trigger on_report_status_change
  after update of status on reports
  for each row execute function update_listing_report_count();

-- ── 3. Chủ xe không tự xoá vết ──
create or replace function guard_listing_sensitive_cols()
returns trigger language plpgsql as $fn$
begin
  if auth.role() is null or auth.role() = 'service_role'
     or has_role('admin') or has_role('kiem_duyet') then
    return new;
  end if;
  if new.is_verified is distinct from old.is_verified
     or new.published_at is distinct from old.published_at
     or new.expires_at is distinct from old.expires_at
     or new.report_count is distinct from old.report_count then
    raise exception 'Khong duoc tu sua trang thai hien thi cua tin';
  end if;
  -- Chủ xe chỉ được tự chuyển sang các trạng thái vô hại.
  if new.status is distinct from old.status
     and new.status not in ('nhap', 'an', 'cho_duyet') then
    raise exception 'Khong duoc tu chuyen tin sang trang thai %', new.status;
  end if;
  return new;
end $fn$;

-- ── 4. Người duyệt xử lý báo cáo ──
drop policy if exists reports_staff_update on reports;
create policy reports_staff_update on reports for update
  using (has_role('kiem_duyet') or has_role('admin'))
  with check (has_role('kiem_duyet') or has_role('admin'));

-- ── 5. Dựng lại listing_card (bản 0012 + report_count ở CUỐI) ──
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
  l.report_count
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

-- ── 6. Quyền cột (BẮT BUỘC sau khi thêm cột vào listings) ──
do $blk$
declare n int;
begin
  n := cap_quyen_cot_listings();
  raise notice 'Đã cấp lại quyền đọc % cột công khai của listings.', n;
end $blk$;

-- ── 7. Tự kiểm ──
do $blk$
declare n int;
begin
  select count(*) into n from information_schema.columns
  where table_schema = 'public' and table_name = 'listing_card'
    and column_name in ('owner_id', 'cover_thumb', 'amenity_codes', 'ev_range_km', 'report_count');
  if n <> 5 then raise exception 'HỎNG — listing_card thiếu cột (% / 5)', n; end if;

  select count(*) into n from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'listings'
    and grantee = 'anon' and privilege_type = 'SELECT' and column_name = 'report_count';
  if n <> 1 then raise exception 'HỎNG — anon chưa đọc được report_count'; end if;

  select count(*) into n from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'listings'
    and grantee in ('anon', 'authenticated') and privilege_type = 'SELECT'
    and column_name in ('contact_phone', 'contact_zalo', 'plate');
  if n > 0 then raise exception 'HỎNG — hở % cột nhạy cảm', n; end if;

  select count(*) into n from get_nearby_listings(10.77, 106.70);
  select count(*) into n from listing_card;
  raise notice 'OK — listing_card % dòng, báo cáo vi phạm sẵn sàng.', n;
end $blk$;

commit;
