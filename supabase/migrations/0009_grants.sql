-- ============================================================
-- Luồng 01 — QUYỀN: chốt lại sau khi TẤT CẢ bảng và hàm đã tồn tại.
-- Chạy CUỐI CÙNG, sau 0008.
--
-- Hai việc:
--   1. Cấp lại quyền bảng — phủ cả bảng do 0007 tạo (0001 chạy trước nên
--      `grant on all tables` lúc đó chưa nhìn thấy chúng).
--   2. Thu hồi quyền GỌI các hàm đụng tiền và hàm admin.
--
-- Vì sao việc 2 quan trọng: Postgres mặc định cấp EXECUTE cho PUBLIC trên
-- mọi hàm. Các hàm dưới đây là `security definer` — chúng chạy bằng quyền
-- của người TẠO ra chúng, bỏ qua RLS. Để nguyên mặc định thì bất kỳ ai đăng
-- nhập cũng gọi thẳng được `admin_adjust_wallet` hay `charge_and_publish`.
--
-- An toàn để thu hồi: đã rà toàn bộ `src/`, client KHÔNG gọi `.rpc()` chỗ nào.
-- Mọi đường đi đều qua Edge Function, mà Edge Function chạy bằng service_role.
-- ============================================================

-- ── 1. Quyền bảng ──
grant usage on schema public to anon, authenticated, service_role;

grant select         on all tables    in schema public to anon, authenticated;
grant insert, update on all tables    in schema public to authenticated;
grant usage, select  on all sequences in schema public to anon, authenticated;

-- Không cấp `delete` cho ai: luật "không xoá cứng" (CLAUDE.md 1.3).
revoke delete on all tables in schema public from anon, authenticated;

-- ── 2. Thu hồi quyền gọi hàm nhạy cảm ──
-- Revoke theo TÊN hàm, quét từ pg_proc, nên không sợ gõ sai chữ ký
-- (nhiều hàm có tham số mặc định, chữ ký trải nhiều dòng).
do $blk$
declare
  r record;
  n int := 0;
  -- Hàm chỉ service_role được gọi. Đụng tiền, đụng quyền, hoặc là việc của cron.
  cam text[] := array[
    -- ví token (0004)
    'charge_and_publish', 'credit_topup', 'refund_tokens',
    'expire_listings', 'doi_soat_vi', 'ensure_wallet',
    -- quản trị (0008)
    'admin_log', 'admin_moderate_listing', 'admin_set_user_lock',
    'admin_set_verified', 'admin_adjust_wallet', 'admin_handle_report',
    'admin_revenue', 'admin_health', 'admin_plate_conflicts', 'admin_has_role',
    -- thông báo + dọn dẹp (0001, 0007)
    'rollup_events_daily', 'prune_events',
    'claim_outbox', 'mark_outbox', 'queue_notification', 'scan_expiry_reminders'
  ];
begin
  for r in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public' and p.proname = any(cam)
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
    n := n + 1;
  end loop;
  raise notice 'Đã khoá % hàm nhạy cảm, chỉ service_role gọi được.', n;

  if n = 0 then
    raise exception 'Không tìm thấy hàm nào để khoá — 0004/0007/0008 đã chạy chưa?';
  end if;
end $blk$;

-- Ghi chú về hai hàm hay bị hiểu nhầm:
--
-- `wallet_so_du` KHÔNG nằm trong danh sách trên vì `0004_billing.sql` đã tự
-- revoke nó rồi (dòng 463). Lý do của luồng 06 chặt hơn: hàm nhận `user_id`
-- làm THAM SỐ, nên ai gọi được là đọc được số dư ví của bất kỳ ai.
-- ĐỪNG mở lại. Client đọc số dư qua view `wallet_balances` / `wallet_ledger`,
-- hai view đó lọc theo `auth.uid()` nên chỉ thấy ví của chính mình.
--
-- `has_role` CỐ Ý để mở: mọi policy RLS đều gọi nó khi đánh giá quyền. Khoá
-- nó lại là khoá luôn cả những câu đọc hợp lệ. Nó chỉ trả true/false cho
-- CHÍNH người đang gọi (dùng auth.uid() bên trong), không lộ gì của ai khác.
