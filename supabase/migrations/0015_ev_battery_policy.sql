-- Thêm trường ghi chú quy định pin cho xe điện
alter table listings add column if not exists battery_policy_note text;
