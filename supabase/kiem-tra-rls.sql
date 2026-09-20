-- ============================================================
-- KIỂM TRA RLS — chạy sau khi đã chạy hết 0001 → 0008.
--
-- Cách dùng: mở SQL Editor của Supabase, dán CẢ FILE này, bấm Run.
-- Kết quả in ra dạng   PASS / FAIL   cho từng mục. Gửi lại nguyên khối
-- kết quả đó. Chỉ khi TẤT CẢ là PASS mới được bật nạp tiền thật.
--
-- Vì sao phải có file này: SQL Editor chạy bằng quyền `postgres`, bỏ qua
-- sạch RLS. Nhìn bằng mắt sẽ luôn thấy "chạy được" và tưởng là an toàn.
-- Script dưới `set local role authenticated` + giả JWT để đóng vai đúng
-- một người dùng thường, rồi thử làm bậy. Bị chặn = PASS.
--
-- KHÔNG ghi gì vĩnh viễn: mọi thứ chạy trong transaction và ROLLBACK ở cuối.
-- ============================================================

begin;

do $kt$
declare
  u_a        uuid;   -- kẻ tấn công: một người dùng thường
  u_b        uuid;   -- nạn nhân: người dùng khác
  tin_b      uuid;   -- tin đăng của u_b
  vi_a       uuid;
  so_nguoi   int;
  n          int;
  pass_ct    int := 0;
  fail_ct    int := 0;
  vi_b       uuid;
  tin_a      uuid;   -- tin của chính u_a
begin
  select count(*) into so_nguoi from users where deleted_at is null;
  if so_nguoi < 1 then
    raise notice 'DỪNG — chưa có người dùng nào. Đăng nhập Google một lần rồi chạy lại.';
    return;
  end if;

  select id into u_a from users where deleted_at is null order by created_at limit 1;
  select id into u_b from users where deleted_at is null and id <> u_a order by created_at limit 1;

  raise notice '================ KIỂM TRA RLS ================';
  raise notice 'Người dùng đóng vai (u_a): %', u_a;
  if u_b is null then
    raise notice 'CHỈ CÓ 1 NGƯỜI DÙNG — bỏ qua nhóm B (cách ly giữa hai người).';
    raise notice 'Muốn chạy đủ: đăng nhập bằng tài khoản Google thứ hai rồi chạy lại.';
    u_b := u_a;
  else
    raise notice 'Người dùng nạn nhân (u_b): %', u_b;
  end if;
  raise notice '';

  -- Tin của u_b, đang hiển thị, để thử sửa trộm.
  insert into listings (owner_id, status, brand_text, model_text, price_per_day,
                        contact_phone, published_at, expires_at)
  values (u_b, 'dang_hien_thi', 'Toyota', 'Vios', 800000,
          '0901234567', now(), now() + interval '30 days')
  returning id into tin_b;

  -- Tin của chính u_a — để thử tự gia hạn mà không trả token.
  insert into listings (owner_id, status, brand_text, model_text, price_per_day,
                        contact_phone, published_at, expires_at)
  values (u_a, 'dang_hien_thi', 'Kia', 'Morning', 500000,
          '0907654321', now(), now() + interval '3 days')
  returning id into tin_a;

  -- Ví có thể chưa tồn tại nếu người dùng được tạo trước trigger 0002.
  insert into wallets (user_id) values (u_a) on conflict (user_id) do nothing;
  insert into wallets (user_id) values (u_b) on conflict (user_id) do nothing;
  select id into vi_a from wallets where user_id = u_a;
  select id into vi_b from wallets where user_id = u_b;

  -- DỮ LIỆU MỒI — bắt buộc. Bảng rỗng thì "đọc được 0 dòng" là PASS giả:
  -- không phân biệt được RLS chặn thật hay chẳng có gì để đọc.
  insert into wallet_transactions (wallet_id, kind, amount, note, idem_key)
  values (vi_a, 'tang', 50, 'moi kiem tra', 'kt-rls-a-' || u_a::text);
  if vi_b <> vi_a then
    insert into wallet_transactions (wallet_id, kind, amount, note, idem_key)
    values (vi_b, 'tang', 50, 'moi kiem tra', 'kt-rls-b-' || u_b::text);
  end if;
  insert into events (kind, listing_id, owner_id) values ('view_listing', tin_b, u_b);
  insert into otp_codes (phone, code_hash, expires_at)
  values ('0900000001', 'moi-kiem-tra', now() + interval '5 min');

  -- ── Đóng vai người dùng thường ─────────────────────────
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_a::text, 'role', 'authenticated')::text, true);

  -- ══ NHÓM A — chặn tự nâng quyền (chỉ cần 1 người dùng) ══

  -- 1. Tự cấp tích xanh cho mình
  begin
    update users set verify_status = 'da_xac_minh' where id = u_a;
    get diagnostics n = row_count;
    if n > 0 then
      raise notice 'FAIL  1. Tự đặt verify_status = da_xac_minh  -> GHI ĐƯỢC';
      fail_ct := fail_ct + 1;
    else
      raise notice 'PASS  1. Tự đặt verify_status              -> 0 dòng bị sửa';
      pass_ct := pass_ct + 1;
    end if;
  exception when others then
    raise notice 'PASS  1. Tự đặt verify_status              -> bị chặn (%)', sqlerrm;
    pass_ct := pass_ct + 1;
  end;

  -- 2. Tự nạp token vào ví mình
  begin
    insert into wallet_transactions (wallet_id, kind, amount, note)
    values (vi_a, 'nap', 1000, 'thu tan cong');
    raise notice 'FAIL  2. Tự ghi 1000 token vào ví           -> GHI ĐƯỢC';
    fail_ct := fail_ct + 1;
  exception when others then
    raise notice 'PASS  2. Tự ghi token vào ví               -> bị chặn (%)', sqlerrm;
    pass_ct := pass_ct + 1;
  end;

  -- 3. Sổ ví chỉ ghi thêm: thử sửa một dòng đã có
  begin
    update wallet_transactions set amount = amount + 999
    where wallet_id = vi_a;
    get diagnostics n = row_count;
    if n > 0 then
      raise notice 'FAIL  3. Sửa dòng sổ ví đã ghi             -> SỬA ĐƯỢC';
      fail_ct := fail_ct + 1;
    else
      raise notice 'PASS  3. Sửa dòng sổ ví đã ghi             -> 0 dòng bị sửa';
      pass_ct := pass_ct + 1;
    end if;
  exception when others then
    raise notice 'PASS  3. Sửa dòng sổ ví đã ghi             -> bị chặn (%)', sqlerrm;
    pass_ct := pass_ct + 1;
  end;

  -- 4. Tự cấp vai trò admin
  begin
    insert into user_roles (user_id, role) values (u_a, 'admin');
    raise notice 'FAIL  4. Tự cấp vai trò admin              -> GHI ĐƯỢC';
    fail_ct := fail_ct + 1;
  exception when others then
    raise notice 'PASS  4. Tự cấp vai trò admin              -> bị chặn (%)', sqlerrm;
    pass_ct := pass_ct + 1;
  end;

  -- 5. Sửa bằng chứng đã đồng ý điều khoản
  begin
    insert into user_consents (user_id, document, version) values (u_a, 'terms', 'v1.0');
    update user_consents set version = 'v0.1' where user_id = u_a;
    get diagnostics n = row_count;
    if n > 0 then
      raise notice 'FAIL  5. Sửa bằng chứng đồng ý điều khoản  -> SỬA ĐƯỢC';
      fail_ct := fail_ct + 1;
    else
      raise notice 'PASS  5. Sửa bằng chứng đồng ý điều khoản  -> 0 dòng bị sửa';
      pass_ct := pass_ct + 1;
    end if;
  exception when others then
    raise notice 'PASS  5. Sửa bằng chứng đồng ý điều khoản  -> bị chặn (%)', sqlerrm;
    pass_ct := pass_ct + 1;
  end;

  -- ══ NHÓM B — cách ly giữa hai người dùng ══

  -- 6. Tự gia hạn tin của mình mà không trả token
  begin
    update listings set expires_at = now() + interval '10 years' where id = tin_a;
    get diagnostics n = row_count;
    if n > 0 then
      raise notice 'FAIL  6. Tự kéo dài hạn tin                -> SỬA ĐƯỢC';
      fail_ct := fail_ct + 1;
    else
      raise notice 'PASS  6. Tự kéo dài hạn tin                -> 0 dòng bị sửa';
      pass_ct := pass_ct + 1;
    end if;
  exception when others then
    raise notice 'PASS  6. Tự kéo dài hạn tin                -> bị chặn (%)', sqlerrm;
    pass_ct := pass_ct + 1;
  end;

  -- 7. Sửa tin của người khác
  begin
    update listings set price_per_day = 1 where id = tin_b;
    get diagnostics n = row_count;
    if n > 0 then
      raise notice 'FAIL  7. Sửa giá tin của người khác        -> SỬA ĐƯỢC';
      fail_ct := fail_ct + 1;
    else
      raise notice 'PASS  7. Sửa giá tin của người khác        -> 0 dòng bị sửa';
      pass_ct := pass_ct + 1;
    end if;
  exception when others then
    raise notice 'PASS  7. Sửa giá tin của người khác        -> bị chặn (%)', sqlerrm;
    pass_ct := pass_ct + 1;
  end;

  -- 8. Đăng tin đứng tên người khác
  begin
    insert into listings (owner_id, status, brand_text, model_text, price_per_day, contact_phone)
    values (u_b, 'nhap', 'Kia', 'Morning', 500000, '0900000000');
    raise notice 'FAIL  8. Đăng tin đứng tên người khác      -> GHI ĐƯỢC';
    fail_ct := fail_ct + 1;
  exception when others then
    raise notice 'PASS  8. Đăng tin đứng tên người khác      -> bị chặn (%)', sqlerrm;
    pass_ct := pass_ct + 1;
  end;

  -- 9. Đọc ví của người khác
  if u_b = u_a then
    n := 0;
  else
    select count(*) into n from wallet_transactions t
    join wallets w on w.id = t.wallet_id where w.user_id = u_b;
  end if;
  if n > 0 then
    raise notice 'FAIL  9. Đọc sổ ví của người khác          -> ĐỌC ĐƯỢC % dòng', n;
    fail_ct := fail_ct + 1;
  else
    raise notice 'PASS  9. Đọc sổ ví của người khác          -> 0 dòng';
    pass_ct := pass_ct + 1;
  end if;

  -- 10. Đọc số liệu lượt xem của người khác (hàng hoá đem bán)
  if u_b = u_a then
    n := 0;
  else
    select count(*) into n from events where owner_id = u_b;
  end if;
  if n > 0 then
    raise notice 'FAIL 10. Đọc lượt xem của chủ xe khác      -> ĐỌC ĐƯỢC % dòng', n;
    fail_ct := fail_ct + 1;
  else
    raise notice 'PASS 10. Đọc lượt xem của chủ xe khác      -> 0 dòng';
    pass_ct := pass_ct + 1;
  end if;

  -- 11. Đọc mã OTP
  select count(*) into n from otp_codes;
  if n > 0 then
    raise notice 'FAIL 11. Đọc bảng mã OTP                   -> ĐỌC ĐƯỢC % dòng', n;
    fail_ct := fail_ct + 1;
  else
    raise notice 'PASS 11. Đọc bảng mã OTP                   -> 0 dòng';
    pass_ct := pass_ct + 1;
  end if;

  -- 12. Đối chứng NGƯỢC: việc hợp lệ phải CHẠY ĐƯỢC.
  --     Không có mục này thì một cái RLS chặn sạch mọi thứ cũng "toàn PASS".
  begin
    select count(*) into n from listings where id = tin_b;
    if n = 1 then
      raise notice 'PASS 12. Đọc tin đang hiển thị (phải được) -> đọc được';
      pass_ct := pass_ct + 1;
    else
      raise notice 'FAIL 12. Đọc tin đang hiển thị (phải được) -> KHÔNG đọc được';
      fail_ct := fail_ct + 1;
    end if;
  exception when others then
    raise notice 'FAIL 12. Đọc tin đang hiển thị (phải được) -> lỗi (%)', sqlerrm;
    fail_ct := fail_ct + 1;
  end;

  execute 'reset role';

  raise notice '';
  raise notice '================ TỔNG KẾT ================';
  raise notice 'PASS: %   FAIL: %', pass_ct, fail_ct;
  if fail_ct > 0 then
    raise notice 'CÓ LỖ HỔNG — KHÔNG được bật nạp tiền thật.';
  elsif u_b = u_a then
    raise notice 'Sạch, nhưng mới kiểm bằng 1 tài khoản. Nên chạy lại với 2 tài khoản.';
  else
    raise notice 'Sạch toàn bộ.';
  end if;
end $kt$;

-- Không giữ lại gì.
rollback;
