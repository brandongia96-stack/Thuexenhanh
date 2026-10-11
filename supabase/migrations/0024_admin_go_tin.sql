-- ============================================================
-- 0024 — QUẢN TRỊ: thực thi yêu cầu gỡ nội dung (0023, luồng 10).
--
-- Chỉ THÊM hàm. Không đổi bảng/policy nào của 0023.
--
-- Khiếu nại (`complaints`/`complaint_messages`), sổ cung cấp dữ liệu
-- (`authority_requests`) và từ chối yêu cầu gỡ đã có policy RLS cho phép
-- kiểm duyệt/admin ghi trực tiếp (0023) — không cần hàm riêng.
--
-- Nút "Ẩn ngay" cần MỘT hàm vì phải làm hai việc không thể tách rời trong hai
-- lần gọi riêng: ẩn đúng đối tượng bị yêu cầu gỡ VÀ đóng hàng đợi trong CÙNG
-- transaction — tách làm hai thì admin bấm giữa chừng mất mạng sẽ ẩn tin
-- nhưng hàng đợi vẫn "cho_xu_ly", không ai biết đã xử lý.
-- ============================================================

create or replace function admin_execute_takedown(p_actor uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_tk takedown_requests%rowtype;
begin
  if not admin_has_role(p_actor, array['admin']::user_role[]) then
    return jsonb_build_object('error','khong_co_quyen','message','Chỉ quản trị viên được xử lý yêu cầu gỡ');
  end if;

  select * into v_tk from takedown_requests where id = p_id for update;
  if not found then
    return jsonb_build_object('error','khong_tim_thay','message','Không tìm thấy yêu cầu này');
  end if;
  if v_tk.status <> 'cho_xu_ly' then
    return jsonb_build_object('error','trang_thai_khong_hop_le',
      'message','Yêu cầu này đã được xử lý', 'status', v_tk.status);
  end if;

  if v_tk.target_type = 'listing' then
    update listings set status = 'an' where id = v_tk.target_id and deleted_at is null;
  elsif v_tk.target_type = 'review' then
    update reviews set is_public = false, deleted_at = coalesce(deleted_at, now()) where id = v_tk.target_id;
  end if;
  -- target_type = 'user': không có hành động tự động — quản trị viên khoá tay
  -- ở tab "Người dùng & ví" (khoá cần lý do riêng, không suy ra được từ đây).

  update takedown_requests
     set status = 'da_go', handled_by = p_actor, handled_at = now()
   where id = p_id;

  perform admin_log(p_actor, 'execute_takedown', v_tk.target_type, v_tk.target_id::text,
    null, jsonb_build_object('takedown_id', p_id, 'requester', v_tk.requester));
  return jsonb_build_object('ok', true, 'target_type', v_tk.target_type);
end $fn$;

revoke all on function admin_execute_takedown(uuid, uuid) from public, anon, authenticated;
grant execute on function admin_execute_takedown(uuid, uuid) to service_role;
