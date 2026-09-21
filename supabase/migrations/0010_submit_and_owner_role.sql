-- ============================================================
-- Luồng 02 — ba việc còn thiếu để chủ xe đăng được tin đầu tiên.
-- Chạy SAU 0009. An toàn chạy lại nhiều lần (create or replace / if not exists).
--
--   1. submit_listing(): gửi tin đi duyệt. Edge Function `submit-listing` gọi.
--   2. Trigger cấp vai trò `chu_xe` khi người dùng tạo tin đầu tiên.
--   3. Vá log_listing_status() (0002): thiếu security definer nên không ai tạo được tin.
--
-- Vì sao cần (đã ghi ở CHANGELOG 21/09):
--   · 0005_trust.sql chặn chủ xe tự đẩy tin sang `cho_duyet` (guard_listing_submit)
--     và nói "phải qua Edge Function submit-listing" — nhưng hàm đó chưa có.
--   · Người mới chỉ được cấp vai trò `khach` (0002), client không ghi được
--     `user_roles`, còn `/chu-xe/*` đòi `chu_xe` → không ai đăng nổi tin đầu.
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. GỬI TIN ĐI DUYỆT
-- ─────────────────────────────────────────────
-- Server kiểm lại TOÀN BỘ. Kiểm ở client (lib/validate.js) chỉ để người dùng đỡ
-- bực; ai gọi thẳng API thì bỏ qua nó, nên ngưỡng giá/năm nằm ở đây một lần nữa.
-- Số 100.000 và 20.000.000 khớp GIA_TOI_THIEU / GIA_TOI_DA ở src/lib/validate.js.
create or replace function submit_listing(p_user_id uuid, p_listing_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  v_l      listings%rowtype;
  v_fields jsonb := '{}'::jsonb;
  v_nam    int := extract(year from now())::int;
begin
  perform 1 from users where id = p_user_id and deleted_at is null;
  if not found then
    return jsonb_build_object('error', 'khong_co_quyen',
                              'message', 'Tài khoản không thể gửi tin lúc này');
  end if;

  select * into v_l from listings
   where id = p_listing_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('error', 'khong_tim_thay', 'message', 'Không tìm thấy tin đăng');
  end if;
  if v_l.owner_id <> p_user_id then
    return jsonb_build_object('error', 'khong_co_quyen', 'message', 'Tin này không phải của bạn');
  end if;

  -- Bấm hai lần / mất mạng rồi bấm lại: trả kết quả cũ, không tạo dòng hàng đợi thứ hai.
  if v_l.status = 'cho_duyet' then
    return jsonb_build_object('status', 'cho_duyet', 'da_xu_ly', true);
  end if;
  if v_l.status not in ('nhap', 'tu_choi') then
    return jsonb_build_object('error', 'trang_thai_khong_hop_le',
                              'message', 'Tin này không ở trạng thái gửi duyệt được',
                              'status', v_l.status);
  end if;

  -- Validate. Mỗi lỗi một khoá `fields` để client tô đỏ đúng ô.
  if coalesce(trim(v_l.brand_text), '') = '' then v_fields := v_fields || '{"brand_text":"bat_buoc"}'; end if;
  if coalesce(trim(v_l.model_text), '') = '' then v_fields := v_fields || '{"model_text":"bat_buoc"}'; end if;
  if v_l.year is null or v_l.year < 2000 or v_l.year > v_nam then
    v_fields := v_fields || '{"year":"khong_hop_le"}';
  end if;
  if v_l.seats is null then v_fields := v_fields || '{"seats":"bat_buoc"}'; end if;
  if v_l.transmission is null then v_fields := v_fields || '{"transmission":"bat_buoc"}'; end if;
  if v_l.price_per_day is null or v_l.price_per_day < 100000 or v_l.price_per_day > 20000000 then
    v_fields := v_fields || '{"price_per_day":"khong_hop_le"}';
  end if;
  if v_l.province_id is null then v_fields := v_fields || '{"province":"bat_buoc"}'; end if;
  -- Biển số bắt buộc khi gửi duyệt (lưu nháp thì được để trống): không có biển số thì
  -- plate_conflict() bên dưới không chặn được ai đăng trùng xe. Dạng 51H12345 sau khi
  -- norm_plate() bỏ dấu; cùng quy tắc với useFormDangTin.js.
  if norm_plate(v_l.plate) is null then
    v_fields := v_fields || '{"plate":"bat_buoc"}';
  elsif norm_plate(v_l.plate) !~ '^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$' then
    v_fields := v_fields || '{"plate":"khong_hop_le"}';
  end if;
  if v_l.contact_phone is null or v_l.contact_phone !~ '^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$' then
    v_fields := v_fields || '{"contact_phone":"khong_hop_le"}';
  end if;

  if v_fields <> '{}'::jsonb then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le',
                              'message', 'Tin còn thiếu hoặc sai thông tin, kiểm tra các ô báo đỏ',
                              'fields', v_fields);
  end if;

  -- Biển số đang được tin của NGƯỜI KHÁC dùng (chờ duyệt / đang hiển thị).
  if plate_conflict(p_listing_id) then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le',
                              'message', 'Biển số này đang được một tin khác sử dụng. Nếu là xe của anh, liên hệ hỗ trợ để được xử lý.',
                              'fields', jsonb_build_object('plate', 'trung_bien_so'));
  end if;

  -- Chạy bằng service_role nên guard_listing_submit (0005) cho qua.
  update listings set status = 'cho_duyet', reject_reason = null where id = p_listing_id;

  insert into moderation_queue (listing_id)
  select p_listing_id
   where not exists (select 1 from moderation_queue
                      where listing_id = p_listing_id and status = 'cho_duyet');

  return jsonb_build_object('status', 'cho_duyet');
end $fn$;

-- Chỉ Edge Function (service_role) gọi được. Hàm nhận user_id làm tham số nên để
-- mở là ai đăng nhập cũng gửi tin thay người khác được — cùng lý do với 0009.
revoke all on function submit_listing(uuid, uuid) from public, anon, authenticated;
grant execute on function submit_listing(uuid, uuid) to service_role;

-- ─────────────────────────────────────────────
-- 2. CẤP VAI TRÒ chu_xe KHI TẠO TIN ĐẦU TIÊN
-- ─────────────────────────────────────────────
-- Đăng tin đầu tiên là việc biến khách thành chủ xe. Cấp ở server, trong trigger:
-- client không được ghi `user_roles` (chống tự nâng quyền), và cấp ngay lúc tạo
-- bản nháp thì không phải chờ bước nào khác.
--
-- `on conflict do nothing`: nếu admin đã gỡ vai trò này (xoá mềm `deleted_at`),
-- hàng cũ vẫn còn nên KHÔNG cấp lại — người bị gỡ quyền không tự lấy lại được
-- bằng cách tạo thêm tin.
create or replace function grant_owner_role()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  insert into user_roles (user_id, role) values (new.owner_id, 'chu_xe')
  on conflict (user_id, role) do nothing;
  return new;
end $fn$;

drop trigger if exists listings_grant_owner_role on listings;
create trigger listings_grant_owner_role
  after insert on listings
  for each row execute function grant_owner_role();

revoke all on function grant_owner_role() from public, anon, authenticated;

-- Người đã có tin từ trước (nếu có) cũng cần vai trò.
insert into user_roles (user_id, role)
select distinct owner_id, 'chu_xe'::user_role from listings
on conflict (user_id, role) do nothing;

-- ─────────────────────────────────────────────
-- 3. VÁ LỖI 0002: chủ xe không tạo/sửa được tin nào
-- ─────────────────────────────────────────────
-- log_listing_status() (0002) ghi vào `listing_events` nhưng chạy bằng quyền của
-- NGƯỜI GỌI, mà `listing_events` chỉ có policy SELECT (RLS bật, không có policy
-- INSERT). Kết quả: mọi INSERT/UPDATE đổi trạng thái tin của người dùng thật đều
-- lỗi "new row violates row-level security policy for table listing_events".
-- Phát hiện khi chạy thử migration với vai trò `authenticated` (superuser bỏ qua RLS
-- nên không bao giờ thấy lỗi này).
--
-- Nhật ký vòng đời là việc của hệ thống chứ không phải của client: cho hàm chạy
-- bằng quyền chủ sở hữu (security definer) thay vì mở policy INSERT cho client —
-- mở policy là để client tự viết lịch sử tin của mình.
-- auth.uid() bên trong vẫn là người đang thao tác, nên `actor_id` vẫn đúng.
create or replace function log_listing_status()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  insert into listing_events (listing_id, from_status, to_status, actor_id)
  values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status, auth.uid());
  return new;
end $fn$;

revoke all on function log_listing_status() from public, anon, authenticated;
