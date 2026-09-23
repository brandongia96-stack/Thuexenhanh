-- ============================================================
-- Luồng 01 — VÁ RÒ RỈ SỐ ĐIỆN THOẠI. Chạy SAU 0009.
--
-- Lỗ hổng (kiểm chứng 23/09): `anon` gọi thẳng
--   GET /rest/v1/listings?select=contact_phone,contact_zalo,plate
-- là lấy sạch số của mọi chủ xe trong một request, bỏ qua Edge Function
-- `reveal-phone`. Tức là bỏ qua luôn việc đếm lượt lấy số — mà lượt lấy số
-- CHÍNH LÀ hàng hoá đem bán cho chủ xe. Rò chỗ này là phá cách app kiếm tiền,
-- không chỉ là lộ dữ liệu.
--
-- Vì sao RLS không cứu được: RLS lọc theo DÒNG, không theo CỘT. Policy
-- `listings_public_read` cho đọc mọi tin `dang_hien_thi` — đúng ý đồ, nhưng
-- khi đã đọc được dòng thì đọc được MỌI cột của dòng đó. Chặn theo cột phải
-- dùng quyền cấp cột, là việc của GRANT chứ không phải của RLS.
--
-- Vì sao chỉ `revoke select (cột)` là KHÔNG ĐỦ: Postgres coi quyền cấp ở mức
-- BẢNG bao trùm mọi cột. Còn `grant select on listings` thì revoke từng cột
-- không hạ được gì. Bắt buộc hạ quyền bảng trước, rồi cấp lại từng cột.
-- ============================================================

-- ── 1. Hạ quyền mức bảng, cấp lại từng cột trừ 3 cột nhạy cảm ──
do $blk$
declare
  -- Thêm cột nhạy cảm mới thì thêm tên vào đây. Cột thường không cần đụng:
  -- danh sách cấp phát sinh động nên luồng sau thêm cột là tự có quyền.
  cam  text[] := array['contact_phone', 'contact_zalo', 'plate'];
  cot  text;
  ds   text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
  into ds
  from information_schema.columns
  where table_schema = 'public' and table_name = 'listings'
    and not (column_name = any(cam));

  if ds is null then
    raise exception 'Không đọc được cột của bảng listings';
  end if;

  -- Thứ tự bắt buộc: hạ bảng TRƯỚC, cấp cột SAU.
  revoke select on listings from anon, authenticated;
  execute format('grant select (%s) on listings to anon, authenticated', ds);

  foreach cot in array cam loop
    raise notice 'Đã khoá cột listings.%', cot;
  end loop;
end $blk$;

-- service_role vẫn đọc đủ: Edge Function `reveal-phone` cần 3 cột đó.
grant select on listings to service_role;

-- ── 2. Đường đọc HỢP LỆ cho chủ xe và người kiểm duyệt ──
--
-- Chủ xe sửa tin của mình thì phải thấy lại số đã nhập; người kiểm duyệt phải
-- thấy biển số và số điện thoại để đối chiếu giấy tờ. Hai nhu cầu đó thật,
-- nên mở đúng một cửa hẹp thay vì trả lại quyền cột cho cả role.
--
-- `security definer` để hàm đọc được 3 cột vừa khoá; bù lại hàm TỰ kiểm
-- người gọi. Không nhận `p_actor` từ client — lấy thẳng `auth.uid()`, nên
-- không ai mạo danh được bằng cách truyền id người khác vào.
create or replace function listing_private(p_id uuid)
returns table (contact_phone text, contact_zalo text, plate text)
language plpgsql stable security definer set search_path = public as $fn$
declare v_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'chua_dang_nhap';
  end if;

  select l.owner_id into v_owner from listings l
  where l.id = p_id and l.deleted_at is null;

  if v_owner is null then
    raise exception 'khong_tim_thay';
  end if;

  if v_owner <> auth.uid() and not has_role('kiem_duyet') and not has_role('admin') then
    raise exception 'khong_co_quyen';
  end if;

  return query
  select l.contact_phone, l.contact_zalo, l.plate
  from listings l where l.id = p_id;
end $fn$;

revoke all on function listing_private(uuid) from public, anon;
grant execute on function listing_private(uuid) to authenticated, service_role;

-- Bản nhận mảng, cho hàng chờ duyệt của admin: một trang 20 tin mà gọi hàm
-- trên 20 lần là 20 vòng mạng. Lọc ngay trong SQL nên tin nào người gọi không
-- có quyền thì đơn giản là không nằm trong kết quả — không cần báo lỗi.
create or replace function listing_private_many(p_ids uuid[])
returns table (id uuid, contact_phone text, contact_zalo text, plate text)
language plpgsql stable security definer set search_path = public as $fn$
begin
  if auth.uid() is null then
    raise exception 'chua_dang_nhap';
  end if;
  if array_length(p_ids, 1) > 100 then
    raise exception 'qua_nhieu_yeu_cau';
  end if;

  return query
  select l.id, l.contact_phone, l.contact_zalo, l.plate
  from listings l
  where l.id = any(p_ids)
    and l.deleted_at is null
    and (l.owner_id = auth.uid() or has_role('kiem_duyet') or has_role('admin'));
end $fn$;

revoke all on function listing_private_many(uuid[]) from public, anon;
grant execute on function listing_private_many(uuid[]) to authenticated, service_role;

-- ── 3. Kiểm ngay tại chỗ, không đợi ai nhớ chạy ──
-- Chạy migration mà quyền không thay đổi thì phải nổ ngay, đừng để im lặng
-- rồi vài tuần sau mới phát hiện số vẫn rò.
do $blk$
declare n int;
begin
  select count(*) into n
  from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'listings'
    and grantee in ('anon', 'authenticated')
    and column_name in ('contact_phone', 'contact_zalo', 'plate')
    and privilege_type = 'SELECT';

  if n > 0 then
    raise exception 'VÁ HỎNG — anon/authenticated vẫn còn % quyền đọc cột nhạy cảm', n;
  end if;
  raise notice 'OK — anon và authenticated không còn đọc được contact_phone/contact_zalo/plate.';
end $blk$;
