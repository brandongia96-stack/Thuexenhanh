-- ============================================================
-- 0005 — THÔNG BÁO (luồng 11)
--
-- KHÔNG sửa bảng nào của contracts/schema.sql. File này chỉ THÊM:
--   · notification_prefs   — chủ xe bật/tắt loại thông báo được phép tắt
--   · notification_outbox  — hộp thư đi: mỗi (người, loại, tham chiếu, kênh) đúng MỘT dòng
--   · hàm xếp hàng, hàm quét mốc hết hạn, hàm nhận/đánh dấu cho Edge Function
--   · trigger: tin duyệt / từ chối / bị ẩn, nạp token thành công
--
-- Nguyên tắc (LUONG-CHAT/11-thong-bao.md):
--   2. Gửi MỘT lần    -> unique (user_id, type, ref_id, channel). Cron chạy lại = on conflict do nothing.
--   3. Tắt được       -> trừ loại liên quan tiền / tài khoản (cột `bat_buoc`), prefs không chạm được.
--   5. Ghi mọi lần gửi -> status / attempts / sent_at / error nằm ngay trên dòng outbox.
--   Cấm: nội dung KHÔNG chứa số điện thoại chủ xe; SMS không dùng ở đây (chỉ email / zalo / inapp).
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Cài đặt của người dùng
-- ─────────────────────────────────────────────
create table if not exists notification_prefs (
  user_id            uuid primary key references users(id) on delete cascade,
  van_hanh_email     boolean not null default true,   -- tin được duyệt / bị từ chối / bị ẩn
  tang_truong_email  boolean not null default false,  -- thống kê tuần, có người lưu xe (làm sau)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table notification_prefs enable row level security;
create policy notif_prefs_own_read on notification_prefs for select using (user_id = auth.uid());
create policy notif_prefs_own_ins   on notification_prefs for insert with check (user_id = auth.uid());
create policy notif_prefs_own_upd   on notification_prefs for update using (user_id = auth.uid());
create trigger notification_prefs_touch before update on notification_prefs
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────
-- 2. Hộp thư đi
-- ─────────────────────────────────────────────
create table if not exists notification_outbox (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  type       text not null,                -- vd 'het_han_3_ngay', 'nap_thanh_cong'
  ref_id     text not null,                -- khoá chống trùng: listing_id:ngày hết hạn, topup_id...
  channel    text not null check (channel in ('email', 'zalo', 'inapp')),
  status     text not null default 'cho_gui'
             check (status in ('cho_gui', 'dang_gui', 'da_gui', 'loi', 'bo_qua')),
  bat_buoc   boolean not null default false,
  title      text not null,
  body       text,
  link       text,
  attempts   int not null default 0,
  sent_at    timestamptz,
  error      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type, ref_id, channel)
);
create index if not exists notification_outbox_pending on notification_outbox (created_at)
  where status in ('cho_gui', 'dang_gui');
alter table notification_outbox enable row level security;
-- Chủ xe xem được lịch sử của mình. Không có policy ghi: client không gửi/sửa được.
create policy notif_outbox_own_read on notification_outbox for select
  using (user_id = auth.uid() or has_role('admin'));
create trigger notification_outbox_touch before update on notification_outbox
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────
-- 3. Xếp hàng MỘT thông báo (nhiều kênh). Idempotent.
-- ─────────────────────────────────────────────
create or replace function queue_notification(
  p_user_id  uuid,
  p_type     text,
  p_ref_id   text,
  p_channels text[],
  p_title    text,
  p_body     text,
  p_link     text,
  p_bat_buoc boolean default false,
  p_kind     notification_kind default 'he_thong',
  p_nhom     text default null          -- 'van_hanh' | 'tang_truong' | null (bắt buộc)
) returns int
language plpgsql security definer set search_path = public as $fn$
declare
  v_ch text; v_n int := 0; v_id uuid; v_pref notification_prefs;
begin
  if not p_bat_buoc then
    select * into v_pref from notification_prefs where user_id = p_user_id;
    -- Chưa có dòng prefs = dùng mặc định (van_hanh bật, tang_truong tắt).
    if p_nhom = 'van_hanh'    and coalesce(v_pref.van_hanh_email, true)      = false then return 0; end if;
    if p_nhom = 'tang_truong' and coalesce(v_pref.tang_truong_email, false) = false then return 0; end if;
  end if;

  foreach v_ch in array p_channels loop
    insert into notification_outbox (user_id, type, ref_id, channel, bat_buoc, title, body, link,
                                     status, sent_at)
    values (p_user_id, p_type, p_ref_id, v_ch, p_bat_buoc, p_title, p_body, p_link,
            case when v_ch = 'inapp' then 'da_gui' else 'cho_gui' end,
            case when v_ch = 'inapp' then now() end)
    on conflict (user_id, type, ref_id, channel) do nothing
    returning id into v_id;

    if v_id is not null then
      v_n := v_n + 1;
      -- In-app: chỉ chèn khi dòng outbox MỚI được tạo -> chạy lại không sinh thông báo trùng.
      if v_ch = 'inapp' then
        insert into notifications (user_id, kind, title, body, link)
        values (p_user_id, p_kind, p_title, p_body, p_link);
      end if;
    end if;
    v_id := null;
  end loop;
  return v_n;
end $fn$;

-- ─────────────────────────────────────────────
-- 4. Quét mốc hết hạn. Cron gọi qua Edge Function; chạy bao nhiêu lần cũng không trùng.
--
--    Đã có sẵn ở 0004_billing.sql (expire_listings) thông báo IN-APP cho "sắp hết hạn"
--    và "hết hạn" — nên ở đây các mốc đó CHỈ thêm email/zalo, tránh hai chuông cho một việc.
--    Mốc 1 ngày chưa có ai lo -> em thêm cả in-app.
--    ref_id gắn ngày hết hạn: gia hạn xong (ngày mới) thì kỳ sau nhắc lại được.
-- ─────────────────────────────────────────────
create or replace function scan_expiry_reminders() returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  r record; v_so_du int; v_ten text; v_han text; v_n3 int := 0; v_n1 int := 0;
  v_nhet int := 0; v_nthieu int := 0; v_ref text;
begin
  for r in
    select id, owner_id, brand_text, model_text, expires_at, status
    from listings
    where deleted_at is null
      and expires_at is not null
      and (
        (status in ('dang_hien_thi', 'sap_het_han') and expires_at > now() and expires_at <= now() + interval '3 days')
        or (status = 'het_han' and expires_at > now() - interval '7 days' and expires_at <= now())
      )
  loop
    v_ten   := r.brand_text || ' ' || r.model_text;
    v_han   := to_char(r.expires_at at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY');
    v_ref   := r.id || ':' || to_char(r.expires_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD');
    v_so_du := wallet_so_du(r.owner_id);

    if r.status = 'het_han' then
      -- Đã hết hạn -> email. (In-app do expire_listings lo.)
      v_nhet := v_nhet + queue_notification(r.owner_id, 'het_han', v_ref, array['email'],
        'Tin ' || v_ten || ' đã ẩn',
        'Tin đã hết hạn ngày ' || v_han || ' và không còn hiện ở tìm kiếm. Nạp token rồi gia hạn là tin hiện lại nguyên vẹn.',
        '/chu-xe/vi', true, 'het_han');
      continue;
    end if;

    if r.expires_at <= now() + interval '1 day' then
      v_n1 := v_n1 + queue_notification(r.owner_id, 'het_han_1_ngay', v_ref, array['zalo', 'inapp'],
        'Xe ' || v_ten || ' hết hạn trong 1 ngày',
        'Số dư ' || v_so_du || ' token. Gia hạn trước ' || v_han || ' để tin không bị ẩn.',
        '/chu-xe', true, 'sap_het_han');
    else
      v_n3 := v_n3 + queue_notification(r.owner_id, 'het_han_3_ngay', v_ref, array['email', 'zalo'],
        'Xe ' || v_ten || ' còn 3 ngày',
        'Xe ' || v_ten || ' hết hạn ngày ' || v_han || '. Số dư ' || v_so_du || ' token.',
        '/chu-xe', true, 'sap_het_han');
    end if;

    -- Không đủ token gia hạn 1 tháng (10 token — pricing.js). Email + zalo, kèm link nạp.
    if v_so_du < 10 then
      v_nthieu := v_nthieu + queue_notification(r.owner_id, 'thieu_token', v_ref, array['email', 'zalo'],
        'Chưa đủ token gia hạn ' || v_ten,
        'Gia hạn 1 tháng cần 10 token, ví của anh/chị còn ' || v_so_du || '. Nạp thêm để tin không bị ẩn.',
        '/chu-xe/vi', true, 'he_thong');
    end if;
  end loop;

  return jsonb_build_object('het_han_3_ngay', v_n3, 'het_han_1_ngay', v_n1,
                            'het_han', v_nhet, 'thieu_token', v_nthieu);
end $fn$;

-- ─────────────────────────────────────────────
-- 5. Trigger sự kiện: duyệt / từ chối / bị ẩn / nạp thành công
-- ─────────────────────────────────────────────
create or replace function notify_listing_status() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare v_ten text := new.brand_text || ' ' || new.model_text;
        v_ref text := new.id || ':' || new.status || ':' || extract(epoch from now())::bigint;
begin
  if new.status is not distinct from old.status then return new; end if;

  if old.status = 'cho_duyet' and new.status in ('dang_hien_thi', 'tu_choi') then
    if new.status = 'dang_hien_thi' then
      perform queue_notification(new.owner_id, 'tin_duyet', v_ref, array['email', 'inapp'],
        'Tin ' || v_ten || ' đã được duyệt',
        'Tin đã hiển thị ở trang tìm kiếm.', '/xe/' || new.id, false, 'tin_duyet', 'van_hanh');
    else
      perform queue_notification(new.owner_id, 'tin_tu_choi', v_ref, array['email', 'inapp'],
        'Tin ' || v_ten || ' bị từ chối',
        'Lý do: ' || coalesce(nullif(trim(new.reject_reason), ''), 'chưa ghi lý do') || '. Sửa lại rồi gửi duyệt lần nữa.',
        '/chu-xe/tin/' || new.id, false, 'tin_tu_choi', 'van_hanh');
    end if;
  elsif new.status = 'an' and old.status in ('dang_hien_thi', 'sap_het_han') then
    -- Trust (luồng 08) tự ẩn khi đủ 3 báo cáo.
    perform queue_notification(new.owner_id, 'tin_bi_an', v_ref, array['email', 'inapp'],
      'Tin ' || v_ten || ' tạm ẩn',
      'Tin bị báo cáo và đang được xem xét. Bạn sẽ nhận thông báo khi có kết quả.',
      '/chu-xe', false, 'he_thong', 'van_hanh');
  end if;
  return new;
end $fn$;

drop trigger if exists listings_notify_status on listings;
create trigger listings_notify_status after update of status on listings
  for each row execute function notify_listing_status();

create or replace function notify_topup_paid() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if new.status = 'da_thanh_toan' and old.status is distinct from 'da_thanh_toan' then
    -- In-app do receive_topup (0004_billing) đã chèn. Ở đây chỉ thêm email biên nhận.
    perform queue_notification(new.user_id, 'nap_thanh_cong', new.id::text, array['email'],
      'Biên nhận nạp ' || new.token_amount || ' token',
      'Đã nhận ' || to_char(new.vnd_amount, 'FM999G999G999') || 'đ, cộng ' || new.token_amount
        || ' token. Mã ' || new.transfer_code || '. Số dư mới: ' || wallet_so_du(new.user_id) || ' token.',
      '/chu-xe/vi', true, 'nap_thanh_cong');
  end if;
  return new;
end $fn$;

drop trigger if exists topups_notify_paid on topups;
create trigger topups_notify_paid after update of status on topups
  for each row execute function notify_topup_paid();

-- ─────────────────────────────────────────────
-- 6. Cho Edge Function: nhận lô cần gửi, ghi kết quả
--    Nhận bằng `for update skip locked` -> hai tiến trình không lấy trùng một dòng.
--    Dòng kẹt ở 'dang_gui' quá 10 phút được trả về hàng đợi.
-- ─────────────────────────────────────────────
create or replace function claim_outbox(p_limit int default 50)
returns table (id uuid, user_id uuid, type text, channel text, title text, body text, link text,
               email text, zalo_phone text, attempts int)
language plpgsql security definer set search_path = public as $fn$
begin
  update notification_outbox set status = 'cho_gui'
   where status = 'dang_gui' and updated_at < now() - interval '10 minutes';

  return query
  with c as (
    select o.id from notification_outbox o
     where o.status = 'cho_gui' and o.channel in ('email', 'zalo')
     order by o.created_at
     limit p_limit
     for update skip locked
  ), u as (
    update notification_outbox o set status = 'dang_gui', attempts = o.attempts + 1
      from c where o.id = c.id
    returning o.*
  )
  select u.id, u.user_id, u.type, u.channel, u.title, u.body, u.link,
         usr.email, coalesce(usr.zalo_phone, usr.phone), u.attempts
  from u join users usr on usr.id = u.user_id;
end $fn$;

-- p_ket_qua: 'da_gui' | 'bo_qua' (người dùng không có email/zalo) | 'loi' (thử lại tối đa 3 lần)
create or replace function mark_outbox(p_id uuid, p_ket_qua text, p_error text default null)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  update notification_outbox
     set status  = case when p_ket_qua = 'loi' and attempts < 3 then 'cho_gui' else p_ket_qua end,
         sent_at = case when p_ket_qua = 'da_gui' then now() else sent_at end,
         error   = p_error
   where id = p_id;
end $fn$;

-- Client không gọi được các hàm này. Chỉ service_role (Edge Function / cron).
revoke all on function queue_notification(uuid, text, text, text[], text, text, text, boolean, notification_kind, text) from public, anon, authenticated;
revoke all on function scan_expiry_reminders()                 from public, anon, authenticated;
revoke all on function claim_outbox(int)                       from public, anon, authenticated;
revoke all on function mark_outbox(uuid, text, text)           from public, anon, authenticated;
