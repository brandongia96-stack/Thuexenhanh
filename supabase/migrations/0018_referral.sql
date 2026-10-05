alter table users add column if not exists referred_by_id uuid references users(id);

create or replace function handle_new_user_wallet()
returns trigger as $$
declare
  w_id uuid;
begin
  insert into wallets (user_id) values (NEW.id) returning id into w_id;
  insert into wallet_transactions (wallet_id, kind, amount) values (w_id, 'tang', 10);
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on users;
create trigger on_auth_user_created
  after insert on users
  for each row execute function handle_new_user_wallet();

-- Retroactive cho user cũ
do $$
declare
  u record;
  w_id uuid;
begin
  for u in select id from users where not exists (select 1 from wallets where user_id = users.id) loop
    insert into wallets (user_id) values (u.id) returning id into w_id;
    insert into wallet_transactions (wallet_id, kind, amount) values (w_id, 'tang', 10);
  end loop;
end $$;

-- Hàm apply_referral
create or replace function apply_referral(ref_phone text)
returns json as $$
declare
  v_referrer_id uuid;
  v_referrer_wallet_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return json_build_object('error', 'Cần đăng nhập');
  end if;

  -- Bỏ khoảng trắng, dấu cộng nếu có
  ref_phone := regexp_replace(ref_phone, '\D', '', 'g');

  select id into v_referrer_id from users where regexp_replace(phone, '\D', '', 'g') = ref_phone limit 1;
  
  if v_referrer_id is null then
    return json_build_object('error', 'Mã giới thiệu không hợp lệ (không tìm thấy sđt)');
  end if;

  if v_referrer_id = v_uid then
    return json_build_object('error', 'Không thể tự giới thiệu chính mình');
  end if;

  if exists (select 1 from users where id = v_uid and referred_by_id is not null) then
    return json_build_object('error', 'Bạn đã nhập mã giới thiệu trước đó rồi');
  end if;

  update users set referred_by_id = v_referrer_id where id = v_uid;

  select id into v_referrer_wallet_id from wallets where user_id = v_referrer_id;
  if v_referrer_wallet_id is not null then
    insert into wallet_transactions (wallet_id, kind, amount) values (v_referrer_wallet_id, 'tang', 10);
  end if;

  return json_build_object('success', true);
end;
$$ language plpgsql security definer;
