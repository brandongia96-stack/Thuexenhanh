-- Luồng 08 — hỗ trợ kháng cáo. BẢN NHÁP, chưa chạy. Luồng 01 xem xét, đặt số
-- migration kế tiếp sau số lớn nhất hiện có rồi mới chạy (CLAUDE.md mục 0, 03/10).
--
-- Vì sao cần: chủ xe muốn kháng cáo một báo cáo đã bị xác nhận (report_count
-- tăng) cần gắn complaints.report_id (contracts/api.md §3e). Nhưng RLS của
-- `reports` chỉ cho reporter hoặc kiem_duyet/admin đọc (contracts/schema.sql
-- policy reports_create/reports_staff) — chủ xe không có quyền SELECT trực
-- tiếp bảng reports, dù là báo cáo nhắm vào tin của chính mình.
--
-- Hàm dưới chỉ trả về MỘT uuid (id của báo cáo), không lộ reason_code, detail,
-- hay danh tính người báo cáo. Chặn bằng security definer + so khớp
-- l.owner_id = auth.uid() ngay trong câu lệnh, chủ xe không truyền được
-- listing_id của người khác để dò.
create or replace function bao_cao_da_xac_nhan(p_listing uuid)
returns uuid
language sql stable security definer set search_path = public as $fn$
  select r.id
  from reports r
  join listings l on l.id = r.listing_id
  where r.listing_id = p_listing
    and r.status = 'da_xu_ly'
    and l.owner_id = auth.uid()
    and r.deleted_at is null
  order by r.handled_at desc nulls last, r.created_at desc
  limit 1
$fn$;

revoke all on function bao_cao_da_xac_nhan(uuid) from public, anon;
grant execute on function bao_cao_da_xac_nhan(uuid) to authenticated;
