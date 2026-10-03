-- ============================================================
-- 0017 — Lịch chạy định kỳ (pg_cron). Chạy SAU 0016. Chạy lại được.
--
-- Trước 03/10 KHÔNG có lịch nào chạy: tin hết hạn không tự ẩn, bảng
-- `events_daily` trống → màn "Xe của tôi" luôn 0 lượt xem.
--
-- Cần có trước (KHÔNG ghi vào file này vì là bí mật):
--   · secret Edge Function `CRON_SECRET`  (npx supabase secrets set ...)
--   · Vault: `cron_secret` (cùng giá trị) và `project_url`
--   Xem supabase/README.md mục cron.
--
-- pg_cron tính giờ UTC. Giờ Việt Nam = UTC + 7.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Trigger chặn sửa cột nhạy cảm (0002) chỉ cho `service_role`/admin/kiểm duyệt
-- qua. pg_cron chạy thẳng trong DB, KHÔNG có JWT → auth.role() = null → bị chặn
-- → expire_listings() nổ "Khong duoc tu chuyen tin sang trang thai het_han".
-- Cho qua khi không có JWT: chỉ kết nối DB trực tiếp (cron, SQL Editor,
-- migration) mới như vậy. Mọi request qua API đều mang role anon/authenticated
-- nên vẫn bị kiểm y như cũ.
create or replace function guard_listing_sensitive_cols()
returns trigger language plpgsql as $fn$
begin
  if auth.role() is null or auth.role() = 'service_role'
     or has_role('admin') or has_role('kiem_duyet') then
    return new;
  end if;
  if new.is_verified is distinct from old.is_verified
     or new.published_at is distinct from old.published_at
     or new.expires_at is distinct from old.expires_at then
    raise exception 'Khong duoc tu sua trang thai hien thi cua tin';
  end if;
  -- Chủ xe chỉ được tự chuyển sang các trạng thái vô hại.
  if new.status is distinct from old.status
     and new.status not in ('nhap', 'an', 'cho_duyet') then
    raise exception 'Khong duoc tu chuyen tin sang trang thai %', new.status;
  end if;
  return new;
end $fn$;

-- cron.schedule cùng tên = ghi đè lịch cũ, nên chạy lại file không sinh lịch trùng.

-- Mỗi giờ phút 00: ẩn tin hết hạn, đánh dấu sắp hết hạn + thông báo trong app.
select cron.schedule('het-han-tin', '0 * * * *', $$ select expire_listings(); $$);

-- Mỗi giờ phút 10: gộp sự kiện hôm nay + hôm qua (giờ VN) cho bảng điều khiển.
select cron.schedule('gop-su-kien', '10 * * * *', $$ select rollup_events_recent(); $$);

-- 03:00 giờ VN: dọn bảng sự kiện thô quá 90 ngày (chỉ phần đã gộp).
select cron.schedule('don-su-kien', '0 20 * * *', $$ select prune_events(90); $$);

-- Mỗi 5 phút: gửi email/Zalo. Chưa có RESEND_API_KEY / ZALO_* thì thư nằm chờ
-- ở `cho_gui`, đặt khoá xong là tự gửi — không mất thư nào.
select cron.schedule('gui-thong-bao', '*/5 * * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body    := '{}'::jsonb
  );
$$);

do $blk$
declare n int;
begin
  select count(*) into n from cron.job
  where jobname in ('het-han-tin', 'gop-su-kien', 'don-su-kien', 'gui-thong-bao');
  if n <> 4 then raise exception 'HỎNG — chỉ có % / 4 lịch', n; end if;
  if not exists (select 1 from vault.decrypted_secrets where name = 'cron_secret') then
    raise warning 'Vault chưa có cron_secret — lịch gui-thong-bao sẽ bị từ chối';
  end if;
  raise notice 'OK — 4 lịch đã đặt.';
end $blk$;
