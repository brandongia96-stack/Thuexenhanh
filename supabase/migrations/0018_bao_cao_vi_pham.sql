-- Thêm cột report_count vào listings
alter table listings add column if not exists report_count int not null default 0;

-- Tạo hàm trigger để tự động tăng/giảm report_count khi status của report thay đổi
create or replace function update_listing_report_count()
returns trigger as $$
begin
  -- Nếu admin chuyển status sang 'da_xu_ly' (tức là report thật)
  if (NEW.status = 'da_xu_ly' and OLD.status != 'da_xu_ly') then
    update listings set report_count = report_count + 1 where id = NEW.listing_id;
  end if;
  
  -- Nếu admin đổi ý, chuyển từ 'da_xu_ly' sang trạng thái khác
  if (OLD.status = 'da_xu_ly' and NEW.status != 'da_xu_ly') then
    update listings set report_count = greatest(0, report_count - 1) where id = NEW.listing_id;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Gắn trigger vào bảng reports
drop trigger if exists on_report_status_change on reports;
create trigger on_report_status_change
  after update on reports
  for each row
  execute function update_listing_report_count();
