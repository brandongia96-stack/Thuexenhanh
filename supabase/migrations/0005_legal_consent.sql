-- Luồng 12: lưu thời điểm + phiên bản điều khoản người dùng đã đồng ý.
-- Bảng chỉ ghi thêm (không sửa, không xoá) để làm bằng chứng.
-- 🔒 Bảng mới ngoài contracts/schema.sql — cần luồng 01 gộp vào hợp đồng.

create table if not exists user_consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  document    text not null check (document in ('terms', 'privacy', 'refund')),
  version     text not null,
  accepted_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists user_consents_user_idx on user_consents (user_id, document, accepted_at desc);

alter table user_consents enable row level security;

drop policy if exists user_consents_insert_own on user_consents;
create policy user_consents_insert_own on user_consents
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_consents_select_own on user_consents;
create policy user_consents_select_own on user_consents
  for select to authenticated
  using (user_id = auth.uid());

-- Không có policy update/delete => client không sửa/xoá được.
