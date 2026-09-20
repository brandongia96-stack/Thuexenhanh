-- ============================================================
-- 0005 — QUẢN TRỊ: hàm phía server (luồng 10)
--
-- KHÔNG sửa bảng nào của contracts/schema.sql. File này chỉ THÊM hàm.
--
-- Nguyên tắc: mọi thao tác admin là MỘT hàm security definer chạy trong MỘT
-- transaction, vừa làm việc vừa ghi `admin_actions`. Không có đường "làm xong
-- rồi mới nhớ ghi nhật ký": hàm lỗi thì cả việc lẫn nhật ký cùng huỷ.
--
-- Mọi hàm nhận p_actor (người thao tác) và TỰ kiểm tra vai trò trong
-- user_roles — không tin Edge Function đã kiểm tra. Hai lớp, không phải một.
-- Toàn bộ revoke khỏi anon/authenticated, chỉ service_role (Edge Function
-- `admin-ops`) được gọi.
--
-- `admin_actions` không có cột `reason`; lý do nằm trong after_data->>'reason'.
-- (contracts/ chỉ luồng 01 được sửa — nếu cần cột riêng thì báo luồng 01.)
-- ============================================================

-- ─────────────────────────────────────────────
-- 0. KIỂM TRA VAI TRÒ
-- ─────────────────────────────────────────────
create or replace function admin_has_role(p_uid uuid, p_roles user_role[])
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from user_roles
                  where user_id = p_uid and role = any(p_roles) and deleted_at is null)
$fn$;

create or replace function admin_log(
  p_actor uuid, p_action text, p_target_type text, p_target_id text,
  p_before jsonb, p_after jsonb
) returns void language sql security definer set search_path = public as $fn$
  insert into admin_actions (admin_id, action, target_type, target_id, before_data, after_data)
  values (p_actor, p_action, p_target_type, p_target_id, p_before, p_after)
$fn$;

-- ─────────────────────────────────────────────
-- 1. DUYỆT / TỪ CHỐI TIN  (kiem_duyet hoặc admin)
--    Duyệt: tin VẪN ở `cho_duyet`, hàng đợi -> `da_duyet`. Tin chỉ lên
--    `dang_hien_thi` khi chủ xe trả phí (charge_and_publish, 0004) — hàm đó
--    đòi có dòng `da_duyet` trước khi thu token. Admin duyệt không tự bật tin.
--    Từ chối: bắt buộc có lý do, chủ xe nhận thông báo kèm lý do.
-- ─────────────────────────────────────────────
create or replace function admin_moderate_listing(
  p_actor uuid, p_listing uuid, p_decision text, p_reason text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_l   listings%rowtype;
  v_q   uuid;
  v_ten text;
begin
  if not admin_has_role(p_actor, array['kiem_duyet','admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Bạn không có quyền kiểm duyệt');
  end if;
  if p_decision not in ('duyet','tu_choi') then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Quyết định không hợp lệ');
  end if;
  if p_decision = 'tu_choi' and (p_reason is null or length(trim(p_reason)) < 5) then
    return jsonb_build_object('error','du_lieu_khong_hop_le',
      'message','Từ chối phải ghi lý do để chủ xe biết đường sửa',
      'fields', jsonb_build_object('reason','bat_buoc'));
  end if;

  select * into v_l from listings where id = p_listing and deleted_at is null for update;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy tin đăng');
  end if;
  if v_l.status <> 'cho_duyet' then
    return jsonb_build_object('error','trang_thai_khong_hop_le',
      'message','Tin không còn ở trạng thái chờ duyệt (có thể người khác vừa xử lý)',
      'status', v_l.status);
  end if;

  v_ten := v_l.brand_text || ' ' || v_l.model_text;

  -- Hàng đợi: dùng dòng đang chờ, chưa có thì tạo. Không sửa dòng đã xử lý.
  select id into v_q from moderation_queue
   where listing_id = p_listing and status = 'cho_duyet'
   order by created_at desc limit 1 for update;
  if v_q is null then
    insert into moderation_queue (listing_id) values (p_listing) returning id into v_q;
  end if;

  update moderation_queue
     set status = case when p_decision = 'duyet' then 'da_duyet'::moderation_status
                       else 'tu_choi'::moderation_status end,
         reviewer_id = p_actor, reason = nullif(trim(p_reason), ''), reviewed_at = now()
   where id = v_q;

  if p_decision = 'tu_choi' then
    update listings set status = 'tu_choi', reject_reason = trim(p_reason) where id = p_listing;
    insert into notifications (user_id, kind, title, body, link)
    values (v_l.owner_id, 'tin_tu_choi', 'Tin ' || v_ten || ' chưa được duyệt',
            trim(p_reason), '/chu-xe/tin/' || p_listing);
  else
    update listings set reject_reason = null where id = p_listing;
    insert into notifications (user_id, kind, title, body, link)
    values (v_l.owner_id, 'tin_duyet', 'Tin ' || v_ten || ' đã được duyệt',
            'Thanh toán phí hiển thị để tin lên tìm kiếm.', '/chu-xe/tin/' || p_listing);
  end if;

  perform admin_log(p_actor, 'moderate_listing', 'listing', p_listing::text,
    jsonb_build_object('status', v_l.status),
    jsonb_build_object('decision', p_decision, 'reason', nullif(trim(p_reason), '')));

  return jsonb_build_object('ok', true, 'decision', p_decision);
end $fn$;

-- ─────────────────────────────────────────────
-- 2. TRÙNG BIỂN SỐ  (chỉ đọc — cảnh báo cho người duyệt)
--    Tự chuẩn hoá ở đây, không phụ thuộc hàm của luồng 08.
-- ─────────────────────────────────────────────
create or replace function admin_plate_conflicts(p_actor uuid, p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_plate text; v_rows jsonb;
begin
  if not admin_has_role(p_actor, array['kiem_duyet','admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Bạn không có quyền');
  end if;
  select upper(regexp_replace(coalesce(plate,''), '[^0-9A-Za-z]', '', 'g'))
    into v_plate from listings where id = p_listing;
  if v_plate is null or v_plate = '' then return jsonb_build_object('items', '[]'::jsonb); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', o.id, 'owner_id', o.owner_id, 'status', o.status,
           'brand_text', o.brand_text, 'model_text', o.model_text)), '[]'::jsonb)
    into v_rows
    from listings o
   where o.id <> p_listing and o.deleted_at is null
     and upper(regexp_replace(coalesce(o.plate,''), '[^0-9A-Za-z]', '', 'g')) = v_plate;
  return jsonb_build_object('items', v_rows);
end $fn$;

-- ─────────────────────────────────────────────
-- 3. KHOÁ / MỞ KHOÁ NGƯỜI DÙNG  (chỉ admin)
--    Khoá = soft delete (users.deleted_at) + ẨN các tin đang hiển thị.
--    Danh sách tin bị ẩn nằm trong before_data của dòng nhật ký, để mở khoá
--    khôi phục ĐÚNG những tin đó — không đụng tin vốn đã ẩn/nháp từ trước.
--    Không khoá được chính mình, không khoá admin khác.
-- ─────────────────────────────────────────────
create or replace function admin_set_user_lock(
  p_actor uuid, p_user uuid, p_lock boolean, p_reason text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_ids uuid[]; v_n int;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được khoá người dùng');
  end if;
  if p_reason is null or length(trim(p_reason)) < 5 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Bắt buộc ghi lý do',
      'fields', jsonb_build_object('reason','bat_buoc'));
  end if;
  if p_user = p_actor then
    return jsonb_build_object('error','khong_co_quyen','message','Không thể tự khoá chính mình');
  end if;
  if admin_has_role(p_user, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Không khoá được quản trị viên khác');
  end if;
  perform 1 from users where id = p_user for update;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy người dùng');
  end if;

  if p_lock then
    select coalesce(array_agg(id), '{}') into v_ids from listings
     where owner_id = p_user and status in ('dang_hien_thi','sap_het_han') and deleted_at is null;
    update listings set status = 'an' where id = any(v_ids);
    update users set deleted_at = now() where id = p_user and deleted_at is null;
    perform admin_log(p_actor, 'lock_user', 'user', p_user::text,
      jsonb_build_object('hidden_listing_ids', to_jsonb(v_ids)),
      jsonb_build_object('reason', trim(p_reason)));
    return jsonb_build_object('ok', true, 'locked', true, 'hidden', coalesce(array_length(v_ids,1),0));
  end if;

  -- Mở khoá: khôi phục đúng các tin đã bị ẩn ở lần khoá gần nhất.
  select coalesce(array(select jsonb_array_elements_text(before_data->'hidden_listing_ids')::uuid), '{}')
    into v_ids
    from admin_actions
   where action = 'lock_user' and target_id = p_user::text
   order by created_at desc limit 1;
  v_ids := coalesce(v_ids, '{}');

  update listings
     set status = case when expires_at is not null and expires_at > now()
                       then 'dang_hien_thi'::listing_status else 'het_han'::listing_status end
   where id = any(v_ids) and status = 'an' and deleted_at is null;
  get diagnostics v_n = row_count;
  update users set deleted_at = null where id = p_user;

  perform admin_log(p_actor, 'unlock_user', 'user', p_user::text,
    null, jsonb_build_object('reason', trim(p_reason), 'restored', v_n));
  return jsonb_build_object('ok', true, 'locked', false, 'restored', v_n);
end $fn$;

-- ─────────────────────────────────────────────
-- 4. TÍCH XANH  (chỉ admin) — xét giấy tờ, MIỄN PHÍ, không bán.
-- ─────────────────────────────────────────────
create or replace function admin_set_verified(
  p_actor uuid, p_user uuid, p_status verify_status, p_note text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_old verify_status;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được xét tích xanh');
  end if;
  if p_status not in ('da_xac_minh','tu_choi') then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Trạng thái không hợp lệ');
  end if;
  if p_status = 'tu_choi' and (p_note is null or length(trim(p_note)) < 5) then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Từ chối phải ghi lý do',
      'fields', jsonb_build_object('note','bat_buoc'));
  end if;
  select verify_status into v_old from users where id = p_user for update;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy người dùng');
  end if;

  update users set verify_status = p_status,
         verified_at = case when p_status = 'da_xac_minh' then now() else null end
   where id = p_user;
  update listings set is_verified = (p_status = 'da_xac_minh')
   where owner_id = p_user and deleted_at is null;

  perform admin_log(p_actor, 'set_verified', 'user', p_user::text,
    jsonb_build_object('verify_status', v_old),
    jsonb_build_object('verify_status', p_status, 'reason', nullif(trim(p_note), '')));
  return jsonb_build_object('ok', true, 'verify_status', p_status);
end $fn$;

-- ─────────────────────────────────────────────
-- 5. CỘNG / TRỪ / HOÀN TOKEN TAY  (chỉ admin)
--    Không sửa số dư. Ghi MỘT dòng vào sổ chỉ-ghi-thêm:
--      tang    +  tặng token (khuyến mại, bù lỗi hệ thống)
--      hoan    +  hoàn token theo chính sách hoàn
--      thu_hoi -  thu hồi token (cộng nhầm)
--    p_tokens luôn DƯƠNG; dấu do loại giao dịch quyết định.
--    Lý do bắt buộc. idem_key bắt buộc — bấm hai lần chỉ ghi một dòng.
--    Trừ quá số dư -> trigger 0004 (wallet_tx_non_negative) từ chối.
-- ─────────────────────────────────────────────
create or replace function admin_adjust_wallet(
  p_actor uuid, p_user uuid, p_kind wallet_tx_kind, p_tokens int, p_reason text, p_idem text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_wallet uuid; v_tx uuid; v_amount int;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được thao tác ví');
  end if;
  if p_kind not in ('tang','hoan','thu_hoi') then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Loại giao dịch không hợp lệ');
  end if;
  if p_tokens is null or p_tokens <= 0 or p_tokens > 100000 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Số token phải là số dương hợp lý',
      'fields', jsonb_build_object('tokens','khong_hop_le'));
  end if;
  if p_reason is null or length(trim(p_reason)) < 5 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Bắt buộc ghi lý do',
      'fields', jsonb_build_object('reason','bat_buoc'));
  end if;
  if p_idem is null or length(trim(p_idem)) = 0 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Thiếu idem_key');
  end if;
  perform 1 from users where id = p_user and deleted_at is null;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy người dùng');
  end if;

  v_amount := case when p_kind = 'thu_hoi' then -p_tokens else p_tokens end;
  v_wallet := ensure_wallet(p_user);
  perform 1 from wallets where id = v_wallet for update;

  begin
    insert into wallet_transactions (wallet_id, kind, amount, idem_key, note)
    values (v_wallet, p_kind, v_amount, 'admin:' || p_idem,
            'Admin · ' || trim(p_reason))
    on conflict (idem_key) do nothing
    returning id into v_tx;
  exception when check_violation then
    return jsonb_build_object('error','khong_du_token',
      'message','Thu hồi vượt quá số dư hiện có của ví',
      'so_du', wallet_so_du(p_user));
  end;

  if v_tx is null then
    return jsonb_build_object('ok', true, 'da_xu_ly', true, 'so_du', wallet_so_du(p_user));
  end if;

  perform admin_log(p_actor, 'adjust_wallet', 'wallet', v_wallet::text, null,
    jsonb_build_object('kind', p_kind, 'amount', v_amount, 'reason', trim(p_reason),
                       'user_id', p_user, 'tx_id', v_tx));
  return jsonb_build_object('ok', true, 'da_xu_ly', false, 'so_du', wallet_so_du(p_user));
end $fn$;

-- ─────────────────────────────────────────────
-- 6. XỬ LÝ BÁO CÁO  (kiem_duyet hoặc admin)
-- ─────────────────────────────────────────────
create or replace function admin_handle_report(
  p_actor uuid, p_report uuid, p_status report_status, p_note text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_old report_status;
begin
  if not admin_has_role(p_actor, array['kiem_duyet','admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Bạn không có quyền');
  end if;
  if p_status not in ('dang_xu_ly','da_xu_ly','bo_qua') then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Trạng thái không hợp lệ');
  end if;
  select status into v_old from reports where id = p_report and deleted_at is null for update;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy báo cáo');
  end if;
  update reports set status = p_status, handled_by = p_actor, handled_at = now() where id = p_report;
  perform admin_log(p_actor, 'handle_report', 'report', p_report::text,
    jsonb_build_object('status', v_old),
    jsonb_build_object('status', p_status, 'reason', nullif(trim(p_note), '')));
  return jsonb_build_object('ok', true);
end $fn$;

-- ─────────────────────────────────────────────
-- 7. DOANH THU  (chỉ admin, chỉ đọc)
--    TÁCH BẠCH hai thứ hay bị trộn:
--      token_tieu_ky  = DOANH THU (đã trừ khi hiển thị tin)
--      no_token       = NỢ PHẢI TRẢ (token đã nạp/tặng, chưa tiêu, còn nằm trong ví)
--    Tiền nạp KHÔNG phải doanh thu. Quy đổi VNĐ dùng p_token_vnd do
--    Edge Function truyền từ một hằng số duy nhất (không hardcode 4000 ở đây).
--    Tỷ lệ gia hạn: trong các khoản phí có kỳ HẾT HẠN rơi vào [từ, đến),
--    bao nhiêu tin đã được trả phí thêm lần nữa SAU khoản đó. Không có mẫu -> null.
-- ─────────────────────────────────────────────
create or replace function admin_revenue(p_actor uuid, p_from date, p_to date, p_token_vnd int)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_nap int; v_tieu int; v_no int; v_payers int; v_mau int; v_gia_han int; v_tinh jsonb;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên xem doanh thu');
  end if;
  if p_from is null or p_to is null or p_to <= p_from then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Khoảng thời gian không hợp lệ');
  end if;

  select coalesce(sum(amount) filter (where kind = 'nap'), 0),
         coalesce(-sum(amount) filter (where kind = 'tieu'), 0)
    into v_nap, v_tieu
    from wallet_transactions where created_at >= p_from and created_at < p_to;

  -- Nợ token: tổng số dư mọi ví. Số dư = tổng sổ, không có cột lưu sẵn.
  select coalesce(sum(amount), 0) into v_no from wallet_transactions;

  select count(distinct user_id) into v_payers
    from charges where created_at >= p_from and created_at < p_to;

  select count(*),
         count(*) filter (where exists (
           select 1 from charges c2
            where c2.listing_id = c.listing_id and c2.created_at > c.created_at))
    into v_mau, v_gia_han
    from charges c where c.period_end >= p_from and c.period_end < p_to;

  select coalesce(jsonb_agg(x order by (x->>'token')::int desc), '[]'::jsonb) into v_tinh
    from (select jsonb_build_object('province_id', p.id, 'ten', p.name,
                                    'token', sum(c.token_amount)) x
            from charges c
            join listings l on l.id = c.listing_id
            join provinces p on p.id = l.province_id
           where c.created_at >= p_from and c.created_at < p_to
           group by p.id, p.name) t;

  return jsonb_build_object(
    'token_nap_ky', v_nap, 'token_tieu_ky', v_tieu,
    'vnd_nap_ky', v_nap * p_token_vnd, 'vnd_doanh_thu_ky', v_tieu * p_token_vnd,
    'no_token', v_no, 'vnd_no_token', v_no * p_token_vnd,
    'chu_xe_tra_tien', v_payers,
    'gia_han_mau', v_mau, 'gia_han_da_gia_han', v_gia_han,
    'ty_le_gia_han', case when v_mau = 0 then null else round(v_gia_han::numeric / v_mau, 4) end,
    'theo_tinh', v_tinh);
end $fn$;

-- ─────────────────────────────────────────────
-- 8. SỨC KHOẺ HỆ THỐNG  (kiem_duyet hoặc admin, chỉ đọc)
--    Lượt xem / lấy số đọc từ `events_daily` — CẤM quét bảng `events` thô
--    (HIEU-NANG.md 2.4 + 7). Hôm nay chưa được gộp nên số ngày gần nhất
--    là hôm qua; giao diện phải nói rõ điều đó.
-- ─────────────────────────────────────────────
create or replace function admin_health(p_actor uuid, p_days int default 14)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_tinh jsonb; v_ngay jsonb; v_bao int; v_cho int;
begin
  if not admin_has_role(p_actor, array['kiem_duyet','admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Bạn không có quyền');
  end if;
  p_days := least(greatest(coalesce(p_days, 14), 1), 90);

  select coalesce(jsonb_agg(jsonb_build_object('province_id', province_id, 'ten', ten, 'so_tin', n)
                            order by n desc), '[]'::jsonb) into v_tinh
    from (select l.province_id, coalesce(p.name, 'Chưa rõ tỉnh') ten, count(*) n
            from listings l left join provinces p on p.id = l.province_id
           where l.status in ('dang_hien_thi','sap_het_han') and l.deleted_at is null
           group by l.province_id, p.name) t;

  select coalesce(jsonb_agg(jsonb_build_object('day', day, 'xem', xem, 'lay_so', lay_so)
                            order by day), '[]'::jsonb) into v_ngay
    from (select day,
                 coalesce(sum(count) filter (where kind = 'view_listing'), 0) xem,
                 coalesce(sum(count) filter (where kind = 'reveal_phone'), 0) lay_so
            from events_daily
           where day >= current_date - p_days
           group by day) t;

  select count(*) into v_bao from reports where status in ('moi','dang_xu_ly') and deleted_at is null;
  select count(*) into v_cho from listings where status = 'cho_duyet' and deleted_at is null;

  return jsonb_build_object('theo_tinh', v_tinh, 'theo_ngay', v_ngay,
                            'bao_cao_chua_xu_ly', v_bao, 'tin_cho_duyet', v_cho);
end $fn$;

-- ─────────────────────────────────────────────
-- 9. QUYỀN GỌI — chỉ service_role.
-- ─────────────────────────────────────────────
do $blk$
declare f text;
begin
  foreach f in array array[
    'admin_has_role(uuid,user_role[])',
    'admin_log(uuid,text,text,text,jsonb,jsonb)',
    'admin_moderate_listing(uuid,uuid,text,text)',
    'admin_plate_conflicts(uuid,uuid)',
    'admin_set_user_lock(uuid,uuid,boolean,text)',
    'admin_set_verified(uuid,uuid,verify_status,text)',
    'admin_adjust_wallet(uuid,uuid,wallet_tx_kind,int,text,text)',
    'admin_handle_report(uuid,uuid,report_status,text)',
    'admin_revenue(uuid,date,date,int)',
    'admin_health(uuid,int)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $blk$;
