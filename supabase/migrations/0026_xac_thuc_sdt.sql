-- 0026_xac_thuc_sdt.sql
-- Thêm hàm RPC xác thực số điện thoại người dùng an toàn (security definer)
-- và siết chặt kiểm tra số điện thoại đã xác thực khi gửi duyệt tin đăng.

-- 1. Hàm xác thực số điện thoại cho người dùng đang đăng nhập
create or replace function xac_thuc_sdt_user(p_phone text, p_code text default null)
returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_norm text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'chua_dang_nhap', 'message', 'Bạn cần đăng nhập để xác thực số điện thoại');
  end if;

  -- Chuẩn hoá số điện thoại
  v_norm := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if v_norm ~ '^84' then
    v_norm := '0' || substr(v_norm, 3);
  end if;

  if v_norm !~ '^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$' then
    return jsonb_build_object('ok', false, 'error', 'du_lieu_khong_hop_le', 'message', 'Số điện thoại không đúng định dạng');
  end if;

  -- Kiểm tra trùng số điện thoại với tài khoản khác
  if exists (select 1 from users where phone = v_norm and id <> v_uid and deleted_at is null) then
    return jsonb_build_object('ok', false, 'error', 'trung_so_dien_thoai', 'message', 'Số điện thoại này đã được sử dụng bởi một tài khoản khác');
  end if;

  -- Cập nhật thông tin xác thực cho người dùng (security definer bỏ qua trigger guard)
  update users
     set phone = v_norm,
         phone_verified_at = now(),
         updated_at = now()
   where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'phone', v_norm,
    'phone_verified_at', now()
  );
end $fn$;

revoke all on function xac_thuc_sdt_user(text, text) from public;
grant execute on function xac_thuc_sdt_user(text, text) to authenticated;
