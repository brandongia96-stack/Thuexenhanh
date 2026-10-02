-- ============================================================
-- KIỂM TRA RLS CỦA BẢNG ĐIỀU KHIỂN CHỦ XE (luồng 03)
--
-- Câu hỏi: chủ xe A có xem được số liệu / ví / SĐT của chủ xe B không?
-- Cách dùng: SQL Editor của Supabase, dán CẢ FILE, Run. In PASS/FAIL từng mục.
-- Cần ĐÚNG 2 người dùng trong bảng `users` (đăng nhập Google bằng 2 tài khoản).
-- Chỉ có 1 người thì script dừng, vì "đọc được 0 dòng" khi A = B là PASS giả.
--
-- Không ghi gì vĩnh viễn: mọi thứ chạy trong transaction và ROLLBACK ở cuối.
-- ============================================================

begin;

do $kt$
declare
  u_a uuid; u_b uuid; tin_a uuid; tin_b uuid;
  n int; pass_ct int := 0; fail_ct int := 0;
begin
  select id into u_a from users where deleted_at is null order by created_at limit 1;
  select id into u_b from users where deleted_at is null and id <> u_a order by created_at limit 1;
  if u_b is null then
    raise notice 'DỪNG — cần 2 người dùng. Đăng nhập bằng tài khoản Google thứ hai rồi chạy lại.';
    return;
  end if;

  -- Dữ liệu mồi (chạy bằng quyền postgres, trước khi đóng vai).
  insert into listings (owner_id, status, brand_text, model_text, price_per_day, contact_phone, plate)
  values (u_a, 'dang_hien_thi', 'Kia', 'Morning', 500000, '0907654321', '51A-11111') returning id into tin_a;
  insert into listings (owner_id, status, brand_text, model_text, price_per_day, contact_phone, plate)
  values (u_b, 'dang_hien_thi', 'Toyota', 'Vios', 800000, '0901234567', '51B-22222') returning id into tin_b;

  insert into events_daily (day, listing_id, owner_id, kind, count) values
    (current_date - 1, tin_a, u_a, 'view_listing', 7),
    (current_date - 1, tin_b, u_b, 'view_listing', 9);
  insert into events (kind, listing_id, owner_id) values
    ('view_listing', tin_a, u_a), ('view_listing', tin_b, u_b);
  insert into wallets (user_id) values (u_a), (u_b) on conflict (user_id) do nothing;

  raise notice '================ KIỂM TRA RLS — BẢNG ĐIỀU KHIỂN CHỦ XE ================';
  raise notice 'A (kẻ xem trộm) = %  |  B (nạn nhân) = %', u_a, u_b;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_a::text, 'role', 'authenticated')::text, true);

  -- Đối chứng: A phải thấy số của CHÍNH MÌNH, nếu không các PASS bên dưới vô nghĩa.
  select count(*) into n from events_daily where owner_id = u_a;
  if n >= 1 then raise notice 'PASS  0. Đối chứng: A đọc được số liệu của mình (% dòng)', n; pass_ct := pass_ct + 1;
  else raise notice 'FAIL  0. Đối chứng: A KHÔNG đọc được số liệu của chính mình'; fail_ct := fail_ct + 1; end if;

  select count(*) into n from events_daily where owner_id = u_b or listing_id = tin_b;
  if n = 0 then raise notice 'PASS  1. A đọc events_daily của B      -> 0 dòng'; pass_ct := pass_ct + 1;
  else raise notice 'FAIL  1. A đọc được % dòng events_daily của B', n; fail_ct := fail_ct + 1; end if;

  select count(*) into n from events where owner_id = u_b or listing_id = tin_b;
  if n = 0 then raise notice 'PASS  2. A đọc bảng events thô của B   -> 0 dòng'; pass_ct := pass_ct + 1;
  else raise notice 'FAIL  2. A đọc được % dòng events thô của B', n; fail_ct := fail_ct + 1; end if;

  select count(*) into n from wallet_balances where user_id = u_b;
  if n = 0 then raise notice 'PASS  3. A đọc số dư ví của B          -> 0 dòng'; pass_ct := pass_ct + 1;
  else raise notice 'FAIL  3. A đọc được số dư ví của B'; fail_ct := fail_ct + 1; end if;

  select count(*) into n from listing_private_many(array[tin_b, tin_a]) where id = tin_b;
  if n = 0 then raise notice 'PASS  4. listing_private_many tin của B -> không trả dòng nào'; pass_ct := pass_ct + 1;
  else raise notice 'FAIL  4. A lấy được SĐT/biển số tin của B qua listing_private_many'; fail_ct := fail_ct + 1; end if;

  select count(*) into n from listing_private_many(array[tin_a]) where id = tin_a and plate = '51A-11111';
  if n = 1 then raise notice 'PASS  5. Đối chứng: A lấy được SĐT/biển số tin của mình'; pass_ct := pass_ct + 1;
  else raise notice 'FAIL  5. Đối chứng: A không lấy được SĐT/biển số tin của mình'; fail_ct := fail_ct + 1; end if;

  begin
    perform * from listing_private(tin_b);
    raise notice 'FAIL  6. listing_private(tin của B) chạy được'; fail_ct := fail_ct + 1;
  exception when others then
    raise notice 'PASS  6. listing_private(tin của B)          -> bị chặn (%)', sqlerrm; pass_ct := pass_ct + 1;
  end;

  begin
    insert into events_daily (day, listing_id, owner_id, kind, count) values (current_date, tin_a, u_a, 'view_listing', 99999);
    raise notice 'FAIL  7. A tự ghi số liệu vào events_daily'; fail_ct := fail_ct + 1;
  exception when others then
    raise notice 'PASS  7. A tự bơm số vào events_daily        -> bị chặn (%)', sqlerrm; pass_ct := pass_ct + 1;
  end;

  raise notice '=========== KẾT QUẢ: % PASS, % FAIL ===========', pass_ct, fail_ct;
end $kt$;

rollback;
