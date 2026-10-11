-- ============================================================
-- 0023 — Tuân thủ pháp lý theo bộ tài liệu CEO 07/10/2026
--   CEO WEBTHUEXE/PhapLy_Luat_Ap_Dung_va_Lo_Hong.md (mã PL-xx)
--   CEO WEBTHUEXE/KeHoach_Backend_Bao_Mat_Phap_Ly.md (mã BE-xx)
-- Chạy SAU 0022. Chạy lại nhiều lần được.
--
-- Bộ tài liệu viết cho bản Firebase cũ + mô hình "khách trả token xem số".
-- Bản đang chạy (Supabase, chủ xe trả phí) ĐÃ đóng sẵn S1–S12: ví chỉ server
-- ghi, SĐT/biển số kín, duyệt tin, tích xanh server cấp, bằng chứng kín...
-- File này làm phần CÒN THIẾU:
--
--   1. PL-33  Giá sàn → NGƯỠNG CẢNH BÁO: không chặn cứng nữa (sàn ép giá người
--             bán độc lập là rủi ro Luật Cạnh tranh). Dưới ngưỡng → gắn cờ
--             `price_anomaly`, người duyệt xem tay.
--   2. PL-05/01/12/15  Bằng chứng đồng ý tách từng mục: thêm loại `operation`,
--             `show_phone`, `age_18`, `marketing`, `kyc_sensitive`; rút đồng ý
--             = THÊM dòng `granted=false` (bảng vẫn chỉ-ghi-thêm).
--   3. BE-28  Vị trí chỉ gần đúng: lat/lng làm tròn 2 số lẻ (~1 km) khi lưu.
--   4. PL-20/40  Khiếu nại có mã hồ sơ + hạn xử lý + lưu trao đổi.
--   5. PL-19  Hàng đợi yêu cầu gỡ có hạn 24h + cảnh báo admin khi còn < 4h.
--   6. PL-13  Sổ cung cấp dữ liệu cho cơ quan chức năng.
--   7. PL-10/49  Quyền của người dùng: tải dữ liệu của mình; yêu cầu xoá tài
--             khoản (chờ 7 ngày, huỷ được) → ẩn danh hoá thật.
--
-- CHƯA làm, cần anh/luật sư chốt: eKYC chủ xe (PL-17), hạn lưu nhật ký (PL-11),
-- hồ sơ chuyển dữ liệu ra nước ngoài (PL-08), hoá đơn điện tử (PL-56).
-- ============================================================

begin;

-- ── 1. Giá sàn → ngưỡng cảnh báo ──
alter table listings add column if not exists price_anomaly boolean not null default false;

create or replace function listings_kiem_gia_san() returns trigger
language plpgsql as $fn$
declare v_san int;
begin
  if new.seats is null or new.price_per_day is null then
    new.price_anomaly := false;
    return new;
  end if;
  select min_price_per_day into v_san
  from price_floors where seats <= new.seats
  order by seats desc limit 1;
  -- KHÔNG raise: chỉ gắn cờ để người duyệt xem tay (PL-33).
  new.price_anomaly := (v_san is not null and new.price_per_day < v_san);
  return new;
end $fn$;

drop trigger if exists listings_kiem_gia_san on listings;
create trigger listings_kiem_gia_san before insert or update of price_per_day, seats on listings
  for each row execute function listings_kiem_gia_san();

-- ── 2. Đồng ý tách từng mục ──
alter table user_consents drop constraint if exists user_consents_document_check;
alter table user_consents add constraint user_consents_document_check
  check (document in ('terms', 'privacy', 'refund', 'operation',
                      'show_phone', 'age_18', 'marketing', 'kyc_sensitive'));
alter table user_consents add column if not exists granted boolean not null default true;

-- Trạng thái đồng ý HIỆN TẠI của một người cho một mục (dòng mới nhất quyết định).
create or replace function da_dong_y(p_user uuid, p_document text)
returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce((
    select granted from user_consents
    where user_id = p_user and document = p_document
    order by accepted_at desc limit 1), false)
$fn$;
revoke all on function da_dong_y(uuid, text) from public, anon;
grant execute on function da_dong_y(uuid, text) to authenticated, service_role;

-- ── 3. Vị trí gần đúng ──
-- Toạ độ xe thường trùng nhà chủ xe. Chỉ lưu tới ~1 km; địa chỉ chính xác chủ
-- xe tự hẹn khi khách gọi. "Xe gần bạn" vẫn chạy với độ chính xác này.
create or replace function listings_lam_tron_vi_tri() returns trigger
language plpgsql as $fn$
begin
  if new.lat is not null then new.lat := round(new.lat::numeric, 2); end if;
  if new.lng is not null then new.lng := round(new.lng::numeric, 2); end if;
  return new;
end $fn$;
drop trigger if exists listings_lam_tron_vi_tri on listings;
create trigger listings_lam_tron_vi_tri before insert or update of lat, lng on listings
  for each row execute function listings_lam_tron_vi_tri();
update listings set lat = lat where lat is not null;

-- ── 4. Khiếu nại ──
do $blk$ begin
  if not exists (select 1 from pg_type where typname = 'complaint_status') then
    create type complaint_status as enum ('da_nhan', 'dang_xu_ly', 'cho_bo_sung', 'da_giai_quyet', 'dong');
  end if;
end $blk$;

create sequence if not exists complaints_code_seq;

create table if not exists complaints (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique
                default 'KN-' || to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMM') || '-'
                        || lpad(nextval('complaints_code_seq')::text, 5, '0'),
  user_id       uuid not null references users(id),
  kind          text not null check (kind in ('nen_tang', 'tin_dang', 'bao_cao_sai', 'token', 'du_lieu', 'khac')),
  listing_id    uuid references listings(id),
  report_id     uuid references reports(id),          -- kháng cáo một báo cáo
  content       text not null check (length(trim(content)) >= 10),
  status        complaint_status not null default 'da_nhan',
  -- Hạn theo cam kết công bố ở phienBan.js THOI_HAN (15 ngày làm việc ≈ 21 ngày lịch).
  due_at        timestamptz not null default now() + interval '21 days',
  resolution    text,
  handled_by    uuid references users(id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists complaints_user_idx  on complaints (user_id, created_at desc);
create index if not exists complaints_queue_idx on complaints (status, due_at);

create table if not exists complaint_messages (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  author_id    uuid not null references users(id),
  is_staff     boolean not null default false,
  body         text not null check (length(trim(body)) >= 1),
  created_at   timestamptz not null default now()
);
create index if not exists complaint_messages_idx on complaint_messages (complaint_id, created_at);

alter table complaints enable row level security;
alter table complaint_messages enable row level security;

drop policy if exists complaints_own_read   on complaints;
drop policy if exists complaints_own_insert on complaints;
drop policy if exists complaints_staff      on complaints;
create policy complaints_own_read on complaints for select to authenticated
  using (user_id = auth.uid() or has_role('kiem_duyet') or has_role('admin'));
-- Người dùng chỉ TẠO; đổi trạng thái/kết quả là việc của người xử lý.
create policy complaints_own_insert on complaints for insert to authenticated
  with check (user_id = auth.uid() and status = 'da_nhan'
              and resolution is null and handled_by is null);
create policy complaints_staff on complaints for update to authenticated
  using (has_role('kiem_duyet') or has_role('admin'))
  with check (has_role('kiem_duyet') or has_role('admin'));

drop policy if exists cmsg_read   on complaint_messages;
drop policy if exists cmsg_insert on complaint_messages;
create policy cmsg_read on complaint_messages for select to authenticated
  using (exists (select 1 from complaints c where c.id = complaint_id
                 and (c.user_id = auth.uid() or has_role('kiem_duyet') or has_role('admin'))));
create policy cmsg_insert on complaint_messages for insert to authenticated
  with check (author_id = auth.uid()
    and is_staff = (has_role('kiem_duyet') or has_role('admin'))
    and exists (select 1 from complaints c where c.id = complaint_id
                and (c.user_id = auth.uid() or has_role('kiem_duyet') or has_role('admin'))));

grant select, insert on complaints, complaint_messages to authenticated;
grant update on complaints to authenticated;
grant usage on sequence complaints_code_seq to authenticated;

drop trigger if exists complaints_touch on complaints;
create trigger complaints_touch before update on complaints
  for each row execute function touch_updated_at();
drop trigger if exists complaint_messages_append_only on complaint_messages;
create trigger complaint_messages_append_only before update or delete on complaint_messages
  for each row execute function forbid_mutation();

-- ── 5. Yêu cầu gỡ nội dung (hạn 24h) ──
create table if not exists takedown_requests (
  id           uuid primary key default gen_random_uuid(),
  source       text not null check (source in ('co_quan_chuc_nang', 'nguoi_dung', 'chu_so_huu_tri_tue')),
  requester    text not null,                 -- tên cơ quan / người yêu cầu
  doc_ref      text,                          -- số văn bản (nếu có)
  target_type  text not null check (target_type in ('listing', 'review', 'user')),
  target_id    uuid not null,
  reason       text not null,
  received_at  timestamptz not null default now(),
  deadline_at  timestamptz not null default now() + interval '24 hours',
  status       text not null default 'cho_xu_ly' check (status in ('cho_xu_ly', 'da_go', 'tu_choi')),
  handled_by   uuid references users(id),
  handled_at   timestamptz,
  note         text,
  alerted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists takedown_queue_idx on takedown_requests (status, deadline_at);
alter table takedown_requests enable row level security;
drop policy if exists takedown_admin on takedown_requests;
create policy takedown_admin on takedown_requests for all to authenticated
  using (has_role('admin')) with check (has_role('admin'));
grant select, insert, update on takedown_requests to authenticated;
drop trigger if exists takedown_touch on takedown_requests;
create trigger takedown_touch before update on takedown_requests
  for each row execute function touch_updated_at();

-- Cron mỗi giờ: yêu cầu còn < 4h mà chưa xử lý → báo mọi admin, MỘT lần.
create or replace function canh_bao_han_go() returns int
language plpgsql security definer set search_path = public as $fn$
declare n int := 0; r record;
begin
  for r in
    select id, deadline_at, requester from takedown_requests
    where status = 'cho_xu_ly' and alerted_at is null
      and deadline_at < now() + interval '4 hours'
    for update
  loop
    insert into notifications (user_id, kind, title, body, link)
    select ur.user_id, 'he_thong', 'Yêu cầu gỡ sắp quá hạn 24 giờ',
           'Yêu cầu từ ' || r.requester || ' hết hạn lúc '
             || to_char(r.deadline_at at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM') || '.',
           '/admin'
    from user_roles ur where ur.role = 'admin' and ur.deleted_at is null;
    update takedown_requests set alerted_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $fn$;
revoke all on function canh_bao_han_go() from public, anon, authenticated;

-- ── 6. Sổ cung cấp dữ liệu cho cơ quan chức năng ──
create table if not exists authority_requests (
  id           uuid primary key default gen_random_uuid(),
  agency       text not null,
  doc_number   text not null,                 -- CHỈ cung cấp khi có văn bản
  doc_date     date,
  scope        text not null,                 -- xin dữ liệu gì, của ai
  handled_by   uuid not null references users(id),
  delivered_at timestamptz,
  note         text,
  created_at   timestamptz not null default now()
);
alter table authority_requests enable row level security;
drop policy if exists authority_admin on authority_requests;
create policy authority_admin on authority_requests for all to authenticated
  using (has_role('admin')) with check (has_role('admin') and handled_by = auth.uid());
grant select, insert, update on authority_requests to authenticated;

-- ── 7. Quyền của người dùng với dữ liệu của mình ──
-- 7a. Tải dữ liệu
create or replace function xuat_du_lieu_cua_toi() returns jsonb
language sql stable security definer set search_path = public as $fn$
  select case when auth.uid() is null then null else jsonb_build_object(
    'xuat_luc', now(),
    'ho_so', (select to_jsonb(u) - 'referred_by_id' from users u where u.id = auth.uid()),
    'dong_y', (select coalesce(jsonb_agg(jsonb_build_object(
                 'muc', document, 'phien_ban', version, 'dong_y', granted, 'luc', accepted_at)
                 order by accepted_at), '[]') from user_consents where user_id = auth.uid()),
    'tin_dang', (select coalesce(jsonb_agg(to_jsonb(l) - 'search_tsv' order by l.created_at), '[]')
                 from listings l where l.owner_id = auth.uid()),
    'xe_da_luu', (select coalesce(jsonb_agg(listing_id), '[]') from saved_listings
                  where user_id = auth.uid() and deleted_at is null),
    'lich_su_lay_so', (select coalesce(jsonb_agg(jsonb_build_object(
                 'tin', listing_id, 'luc', created_at) order by created_at), '[]')
                 from events where kind = 'reveal_phone' and actor_id = auth.uid()),
    'bao_cao_da_gui', (select coalesce(jsonb_agg(jsonb_build_object(
                 'tin', listing_id, 'ly_do', reason_code, 'chi_tiet', detail,
                 'trang_thai', status, 'luc', created_at) order by created_at), '[]')
                 from reports where reporter_id = auth.uid()),
    'khieu_nai', (select coalesce(jsonb_agg(jsonb_build_object(
                 'ma', code, 'loai', kind, 'noi_dung', content, 'trang_thai', status,
                 'ket_qua', resolution, 'luc', created_at) order by created_at), '[]')
                 from complaints where user_id = auth.uid()),
    'so_du_token', (select wallet_so_du(auth.uid()))
  ) end
$fn$;
revoke all on function xuat_du_lieu_cua_toi() from public, anon;
grant execute on function xuat_du_lieu_cua_toi() to authenticated;

-- 7b. Yêu cầu xoá tài khoản
create table if not exists account_deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  requested_at  timestamptz not null default now(),
  execute_after timestamptz not null default now() + interval '7 days',
  status        text not null default 'cho' check (status in ('cho', 'da_huy', 'da_xoa', 'cho_xu_ly_token')),
  done_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists account_deletion_one_open
  on account_deletion_requests (user_id) where status in ('cho', 'cho_xu_ly_token');
alter table account_deletion_requests enable row level security;
drop policy if exists adr_own   on account_deletion_requests;
drop policy if exists adr_admin on account_deletion_requests;
create policy adr_own   on account_deletion_requests for select to authenticated using (user_id = auth.uid());
create policy adr_admin on account_deletion_requests for select to authenticated using (has_role('admin'));
grant select on account_deletion_requests to authenticated;

create or replace function yeu_cau_xoa_tai_khoan() returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_row account_deletion_requests%rowtype;
begin
  if v_uid is null then return jsonb_build_object('error', 'chua_dang_nhap'); end if;
  if has_role('admin') then
    return jsonb_build_object('error', 'khong_hop_le',
      'message', 'Tài khoản quản trị không tự xoá được. Gỡ quyền quản trị trước.');
  end if;
  select * into v_row from account_deletion_requests
   where user_id = v_uid and status in ('cho', 'cho_xu_ly_token');
  if not found then
    insert into account_deletion_requests (user_id) values (v_uid) returning * into v_row;
  end if;
  return jsonb_build_object('ok', true, 'execute_after', v_row.execute_after,
                            'so_du_token', wallet_so_du(v_uid));
end $fn$;

create or replace function huy_yeu_cau_xoa_tai_khoan() returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  update account_deletion_requests set status = 'da_huy', updated_at = now()
   where user_id = auth.uid() and status in ('cho', 'cho_xu_ly_token');
  get diagnostics n = row_count;
  return jsonb_build_object('ok', n > 0);
end $fn$;

revoke all on function yeu_cau_xoa_tai_khoan() from public, anon;
revoke all on function huy_yeu_cau_xoa_tai_khoan() from public, anon;
grant execute on function yeu_cau_xoa_tai_khoan() to authenticated;
grant execute on function huy_yeu_cau_xoa_tai_khoan() to authenticated;

-- 7c. Ẩn danh hoá MỘT tài khoản. Không xoá dòng (giữ toàn vẹn sổ ví, nhật ký
-- lấy số, bằng chứng đồng ý) nhưng xoá sạch thứ định danh được người đó.
create or replace function an_danh_hoa_tai_khoan(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as $fn$
begin
  -- Tin đăng: ẩn + xoá mềm, xoá liên hệ, biển số, địa chỉ, toạ độ.
  update public.listings
     set status = 'an', deleted_at = coalesce(deleted_at, now()),
         contact_phone = '0000000000', contact_zalo = null,
         plate = null, address_text = null, lat = null, lng = null
   where owner_id = p_user;
  update public.listing_images set deleted_at = coalesce(deleted_at, now())
   where listing_id in (select id from public.listings where owner_id = p_user);
  update public.saved_listings set deleted_at = coalesce(deleted_at, now()) where user_id = p_user;

  update public.users
     set full_name = null, phone = null, zalo_phone = null, avatar_url = null,
         email = null, referred_by_id = null, deleted_at = coalesce(deleted_at, now())
   where id = p_user;
  update public.user_roles set deleted_at = coalesce(deleted_at, now()) where user_id = p_user;

  -- Đăng nhập: gỡ liên kết Google, khoá, xoá email/SĐT/metadata.
  delete from auth.sessions       where user_id = p_user;
  delete from auth.refresh_tokens where user_id = p_user::text;
  delete from auth.identities     where user_id = p_user;
  update auth.users
     set email = 'da-xoa-' || p_user || '@invalid.local', phone = null,
         raw_user_meta_data = '{}'::jsonb, encrypted_password = null,
         banned_until = 'infinity'
   where id = p_user;
end $fn$;
revoke all on function an_danh_hoa_tai_khoan(uuid) from public, anon, authenticated;

-- 7d. Cron hằng ngày: thực hiện các yêu cầu đã hết 7 ngày chờ.
-- Còn token trong ví → KHÔNG tự xoá, chuyển cho admin xử lý theo Chính sách
-- hoàn token trước (tiền của người ta, không được lặng lẽ làm mất).
create or replace function thuc_hien_xoa_tai_khoan() returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare r record; v_xoa int := 0; v_cho int := 0;
begin
  for r in
    select id, user_id from account_deletion_requests
    where status = 'cho' and execute_after <= now()
    for update
  loop
    if wallet_so_du(r.user_id) > 0 then
      update account_deletion_requests set status = 'cho_xu_ly_token', updated_at = now() where id = r.id;
      insert into notifications (user_id, kind, title, body, link)
      select ur.user_id, 'he_thong', 'Yêu cầu xoá tài khoản còn token',
             'Một tài khoản xin xoá nhưng ví còn token — xử lý theo Chính sách hoàn token.', '/admin'
      from user_roles ur where ur.role = 'admin' and ur.deleted_at is null;
      v_cho := v_cho + 1;
    else
      perform an_danh_hoa_tai_khoan(r.user_id);
      update account_deletion_requests set status = 'da_xoa', done_at = now(), updated_at = now() where id = r.id;
      v_xoa := v_xoa + 1;
    end if;
  end loop;
  return jsonb_build_object('da_xoa', v_xoa, 'cho_xu_ly_token', v_cho);
end $fn$;
revoke all on function thuc_hien_xoa_tai_khoan() from public, anon, authenticated;

-- ── Quyền cột listings (vừa thêm price_anomaly) + gắn cờ cho dòng đang có ──
do $blk$ declare n int; begin n := cap_quyen_cot_listings(); end $blk$;
update listings set price_per_day = price_per_day;

-- ── Lịch ──
select cron.schedule('canh-bao-han-go', '5 * * * *', $$ select canh_bao_han_go(); $$);
-- 02:30 giờ VN
select cron.schedule('xoa-tai-khoan', '30 19 * * *', $$ select thuc_hien_xoa_tai_khoan(); $$);

-- ── Tự kiểm ──
do $blk$ begin
  if exists (select 1 from information_schema.column_privileges
             where table_name = 'listings' and grantee = 'anon' and privilege_type = 'SELECT'
               and column_name in ('contact_phone', 'contact_zalo', 'plate')) then
    raise exception 'HỎNG — hở cột nhạy cảm'; end if;
  if (select count(*) from information_schema.columns where table_schema = 'public'
        and table_name = 'listing_card' and column_name in ('owner_id', 'cover_thumb')) <> 2 then
    raise exception 'HỎNG — listing_card thiếu cột'; end if;
  raise notice 'OK — 0023.';
end $blk$;

commit;
