-- ============================================================
-- 0022 — QUẢN TRỊ: hàm ghi cho giá sàn, giá nhiên liệu, danh bạ cứu hộ.
--
-- Chỉ THÊM hàm. Không đổi bảng/view/policy nào.
-- Mỗi hàm: kiểm tra vai trò admin (lớp 2), validate, ghi, và ghi admin_actions
-- trong CÙNG transaction. Edge Function admin-ops gọi, chỉ service_role.
-- Chạy lại nhiều lần được (create or replace).
-- ============================================================

-- ── 1. Giá sàn theo số chỗ ──
create or replace function admin_set_price_floor(
  p_actor uuid, p_seats int, p_min_price int, p_note text
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_old price_floors%rowtype;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được sửa giá sàn');
  end if;
  if p_seats is null or p_seats < 2 or p_seats > 50 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Số chỗ phải từ 2 đến 50',
      'fields', jsonb_build_object('seats','khong_hop_le'));
  end if;
  if p_min_price is null or p_min_price <= 0 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Giá sàn phải lớn hơn 0',
      'fields', jsonb_build_object('min_price_per_day','khong_hop_le'));
  end if;

  select * into v_old from price_floors where seats = p_seats for update;
  insert into price_floors (seats, min_price_per_day, note)
  values (p_seats, p_min_price, nullif(trim(p_note), ''))
  on conflict (seats) do update
    set min_price_per_day = excluded.min_price_per_day, note = excluded.note;

  perform admin_log(p_actor, 'set_price_floor', 'price_floor', p_seats::text,
    case when v_old.seats is null then null
         else jsonb_build_object('min_price_per_day', v_old.min_price_per_day, 'note', v_old.note) end,
    jsonb_build_object('min_price_per_day', p_min_price, 'note', nullif(trim(p_note), '')));
  return jsonb_build_object('ok', true);
end $fn$;

-- ── 2. Giá nhiên liệu tham chiếu ──
-- Không sửa dòng cũ: thêm một dòng mới với effective_date. reference_price_now
-- lấy dòng mới nhất đã đến ngày áp dụng, nên lịch sử giữ nguyên.
create or replace function admin_set_reference_price(
  p_actor uuid, p_code text, p_label text, p_unit text, p_price int,
  p_source text, p_source_url text, p_effective date
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_id int;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được nhập giá tham chiếu');
  end if;
  if p_code is null or p_code !~ '^[a-z0-9_]{3,40}$' then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Mã giá không hợp lệ',
      'fields', jsonb_build_object('code','khong_hop_le'));
  end if;
  if p_label is null or length(trim(p_label)) = 0 or p_unit is null or length(trim(p_unit)) = 0 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Thiếu tên hoặc đơn vị');
  end if;
  if p_price is null or p_price <= 0 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Giá phải lớn hơn 0',
      'fields', jsonb_build_object('price','khong_hop_le'));
  end if;
  if p_source is null or length(trim(p_source)) = 0 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Bắt buộc ghi nguồn giá',
      'fields', jsonb_build_object('source','bat_buoc'));
  end if;
  if p_effective is null then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Thiếu ngày áp dụng');
  end if;

  insert into reference_prices (code, label, unit, price, source, source_url, effective_date)
  values (p_code, trim(p_label), trim(p_unit), p_price, trim(p_source),
          nullif(trim(p_source_url), ''), p_effective)
  on conflict (code, effective_date) do update
    set label = excluded.label, unit = excluded.unit, price = excluded.price,
        source = excluded.source, source_url = excluded.source_url, deleted_at = null
  returning id into v_id;

  perform admin_log(p_actor, 'set_reference_price', 'reference_price', v_id::text, null,
    jsonb_build_object('code', p_code, 'price', p_price, 'source', trim(p_source),
                       'effective_date', p_effective));
  return jsonb_build_object('ok', true, 'id', v_id);
end $fn$;

-- ── 3. Danh bạ cứu hộ ──
create or replace function admin_upsert_rescue(
  p_actor uuid, p_id uuid, p_province int, p_name text, p_phone text,
  p_service text, p_note text, p_sort int
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_id uuid; v_old rescue_contacts%rowtype;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được sửa danh bạ cứu hộ');
  end if;
  if p_name is null or length(trim(p_name)) < 2 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Thiếu tên',
      'fields', jsonb_build_object('name','bat_buoc'));
  end if;
  if p_phone is null or p_phone !~ '^0[0-9]{9}$' then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0',
      'fields', jsonb_build_object('phone','khong_hop_le'));
  end if;
  if p_province is not null and not exists (select 1 from provinces where id = p_province) then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Tỉnh không tồn tại',
      'fields', jsonb_build_object('province_id','khong_hop_le'));
  end if;

  if p_id is null then
    insert into rescue_contacts (province_id, name, phone, service, note, sort_order)
    values (p_province, trim(p_name), p_phone, nullif(trim(p_service), ''),
            nullif(trim(p_note), ''), coalesce(p_sort, 0))
    returning id into v_id;
    perform admin_log(p_actor, 'create_rescue', 'rescue_contact', v_id::text, null,
      jsonb_build_object('name', trim(p_name), 'phone', p_phone, 'province_id', p_province));
  else
    select * into v_old from rescue_contacts where id = p_id and deleted_at is null for update;
    if not found then
      return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy số cứu hộ này');
    end if;
    update rescue_contacts
       set province_id = p_province, name = trim(p_name), phone = p_phone,
           service = nullif(trim(p_service), ''), note = nullif(trim(p_note), ''),
           sort_order = coalesce(p_sort, 0)
     where id = p_id;
    v_id := p_id;
    perform admin_log(p_actor, 'update_rescue', 'rescue_contact', v_id::text,
      jsonb_build_object('name', v_old.name, 'phone', v_old.phone, 'province_id', v_old.province_id),
      jsonb_build_object('name', trim(p_name), 'phone', p_phone, 'province_id', p_province));
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end $fn$;

-- Xoá MỀM (luật: không xoá cứng). Bắt buộc có lý do.
create or replace function admin_delete_rescue(p_actor uuid, p_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_old rescue_contacts%rowtype;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được xoá danh bạ cứu hộ');
  end if;
  if p_reason is null or length(trim(p_reason)) < 5 then
    return jsonb_build_object('error','du_lieu_khong_hop_le','message','Bắt buộc ghi lý do xoá',
      'fields', jsonb_build_object('reason','bat_buoc'));
  end if;
  select * into v_old from rescue_contacts where id = p_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy số cứu hộ này');
  end if;
  update rescue_contacts set deleted_at = now() where id = p_id;
  perform admin_log(p_actor, 'delete_rescue', 'rescue_contact', p_id::text,
    jsonb_build_object('name', v_old.name, 'phone', v_old.phone),
    jsonb_build_object('reason', trim(p_reason)));
  return jsonb_build_object('ok', true);
end $fn$;

-- ── 4. Quyền gọi: chỉ service_role ──
do $blk$
declare f text;
begin
  foreach f in array array[
    'admin_set_price_floor(uuid,int,int,text)',
    'admin_set_reference_price(uuid,text,text,text,int,text,text,date)',
    'admin_upsert_rescue(uuid,uuid,int,text,text,text,text,int)',
    'admin_delete_rescue(uuid,uuid,text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $blk$;
