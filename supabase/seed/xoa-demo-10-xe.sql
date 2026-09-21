-- ============================================================
-- GỠ 10 tin DEMO (supabase/seed/demo-10-xe.sql).
--
-- Xoá MỀM, đúng luật CLAUDE.md §1.3 "không xoá cứng": đặt `deleted_at`, tin biến
-- mất khỏi mọi truy vấn của app nhưng dữ liệu còn nguyên trong bảng.
-- Chỉ đụng tin của tài khoản DEMO — tin của người dùng thật không bị chạm.
-- Chạy trong SQL Editor, chạy lại nhiều lần được.
-- ============================================================

begin;

select set_config('request.jwt.claim.role', 'service_role', true),
       set_config('request.jwt.claims', '{"role":"service_role"}', true);

update listings
   set deleted_at = now()
 where owner_id = 'de000000-0000-4000-8000-000000000000'
   and deleted_at is null;

commit;

-- Phải ra 0 dòng đang hiển thị.
select count(*) as con_hien_thi
from listings
where owner_id = 'de000000-0000-4000-8000-000000000000' and deleted_at is null;
