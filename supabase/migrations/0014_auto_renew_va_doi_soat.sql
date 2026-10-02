-- ============================================================
-- Luồng 01 — Ba món hợp đồng chung mà luồng 06 đang vướng.
-- Chạy SAU 0013. (`src/modules/billing/server/README.md` mục 7)
--
--   1. `listings.auto_renew`      — chưa có cột thì không làm tự gia hạn được
--   2. `unmatched_transfers`      — tiền về mà sai mã thì hiện chỉ `console.error`
--   3. (món 3 là sửa `contracts/api.md`, không có SQL)
--
-- ⚠️ Thêm cột vào `listings` thì PHẢI gọi `cap_quyen_cot_listings()` ở cuối:
-- `0010_bao_ve_sdt.sql` đã hạ quyền đọc mức BẢNG rồi cấp lại theo từng CỘT,
-- nên cột mới mặc định không ai đọc được. Quên là giao diện lặng lẽ thiếu dữ
-- liệu, không báo lỗi gì.
-- ============================================================

begin;

-- ── 1. Tự động gia hạn ──
-- Mặc định TẮT. Tự lấy tiền của người ta mà họ không chủ động bật là cách
-- nhanh nhất để mất lòng tin — và trái tinh thần "app không đứng giữa dòng
-- tiền" (CLAUDE.md 1.1).
--
-- Cố ý KHÔNG thêm cột "gia hạn mấy tháng": cứ 1 tháng một lần. Thêm cột chưa
-- ai dùng là làm nặng schema; cần thì luồng 06 xin sau.
alter table listings
  add column if not exists auto_renew boolean not null default false;

-- Cron quét tin sắp hết hạn chỉ quan tâm tin BẬT cờ này. Index một phần cho
-- nhẹ: phần lớn tin sẽ để mặc định `false`.
create index if not exists listings_auto_renew_idx
  on listings (expires_at)
  where auto_renew and deleted_at is null;

-- ── 2. Chuyển khoản không cộng được token ──
do $blk$ begin
  if not exists (select 1 from pg_type where typname = 'unmatched_reason') then
    create type unmatched_reason as enum (
      'khong_doc_duoc_ma', 'khong_co_yeu_cau_nap', 'bi_tu_choi', 'khac');
  end if;
  if not exists (select 1 from pg_type where typname = 'unmatched_status') then
    create type unmatched_status as enum ('moi', 'dang_xu_ly', 'da_xu_ly', 'bo_qua');
  end if;
end $blk$;

create table if not exists unmatched_transfers (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,
  provider_ref  text,
  reason        unmatched_reason not null,
  transfer_code text,
  vnd_amount    int,
  content       text,
  payload       jsonb not null default '{}',

  status        unmatched_status not null default 'moi',
  resolved_topup_id uuid references topups(id),
  handled_by    uuid references users(id),
  handled_at    timestamptz,
  note          text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- Webhook gửi lại là chuyện thường; khoá này để gửi lại không sinh dòng thứ hai.
create unique index if not exists unmatched_transfers_ref_idx
  on unmatched_transfers (provider, provider_ref)
  where provider_ref is not null;
-- Hàng chờ: cũ nhất trước — người chờ lâu nhất phải được trả lời trước.
create index if not exists unmatched_transfers_queue_idx
  on unmatched_transfers (status, created_at);

alter table unmatched_transfers enable row level security;

drop policy if exists unmatched_admin on unmatched_transfers;
-- CHỈ admin: `payload` chứa tên và số tài khoản người gửi.
-- `service_role` (Edge Function `bank-webhook`) bỏ qua RLS nên vẫn ghi được.
create policy unmatched_admin on unmatched_transfers for all using (has_role('admin'));

drop trigger if exists unmatched_transfers_touch on unmatched_transfers;
create trigger unmatched_transfers_touch before update on unmatched_transfers
  for each row execute function touch_updated_at();

-- ── 3. Cấp lại quyền cột cho `listings` (vì vừa thêm `auto_renew`) ──
do $blk$
declare n int;
begin
  n := cap_quyen_cot_listings();
  raise notice 'Đã cấp lại quyền đọc % cột công khai của listings.', n;
end $blk$;

-- ── 4. Tự kiểm ──
do $blk$
declare n int;
begin
  -- 4a. Cột mới phải đọc được, nếu không màn chủ xe không thấy trạng thái cờ.
  select count(*) into n
  from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'listings'
    and grantee = 'anon' and privilege_type = 'SELECT' and column_name = 'auto_renew';
  if n <> 1 then
    raise exception 'HỎNG — anon chưa đọc được listings.auto_renew';
  end if;

  -- 4b. Ba cột nhạy cảm vẫn phải kín sau khi cấp lại quyền.
  select count(*) into n
  from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'listings'
    and grantee in ('anon', 'authenticated') and privilege_type = 'SELECT'
    and column_name in ('contact_phone', 'contact_zalo', 'plate');
  if n > 0 then
    raise exception 'HỎNG — cấp lại quyền đã làm hở % cột nhạy cảm', n;
  end if;

  -- 4c. 10 tin demo không được mất dòng nào.
  select count(*) into n from listing_card;
  raise notice 'listing_card còn % dòng.', n;

  raise notice 'OK — auto_renew + unmatched_transfers đã vào, quyền đúng.';
end $blk$;

commit;
