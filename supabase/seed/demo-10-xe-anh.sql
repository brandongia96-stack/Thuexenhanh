-- ============================================================
-- Thêm ảnh (từ Unsplash) cho 10 xe DEMO để xem giao diện đầy đủ
-- Cần chạy sau khi đã chạy `demo-10-xe.sql`
-- CẬP NHẬT: Đã sửa ảnh lỗi và thêm 2 ảnh/xe để test slider
-- ============================================================

begin;

-- Dùng quyền service_role để bypass RLS
select set_config('request.jwt.claim.role', 'service_role', true),
       set_config('request.jwt.claims', '{"role":"service_role"}', true);

-- Xoá ảnh cũ của xe demo nếu có
delete from listing_images where listing_id in (
  select id from listings where owner_id = 'de000000-0000-4000-8000-000000000000'
);

-- Thêm ảnh từ Unsplash (dùng resize bằng tham số URL của Unsplash)
insert into listing_images (listing_id, url_thumb, url_medium, url_full, url_original, width, height, sort_order, is_cover)
values
  -- 1. Toyota Vios
  ('de000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80', 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80', 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&q=80', 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8', 800, 450, 0, true),
  ('de000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&q=80', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1600&q=80', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c', 800, 450, 1, false),
  
  -- 2. Hyundai Accent
  ('de000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2', 800, 450, 0, true),
  ('de000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&q=80', 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80', 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=1600&q=80', 'https://images.unsplash.com/photo-1493238792000-8113da705763', 800, 450, 1, false),
  
  -- 3. Kia Morning
  ('de000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1600&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24', 800, 450, 0, true),
  ('de000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1600&q=80', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b', 800, 450, 1, false),
  
  -- 4. Mazda CX-5
  ('de000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1600&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935', 800, 450, 0, true),
  ('de000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=400&q=80', 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=800&q=80', 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=1600&q=80', 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023', 800, 450, 1, false),
  
  -- 5. VinFast VF 6
  ('de000000-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&q=80', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1600&q=80', 'https://images.unsplash.com/photo-1502877338535-766e1452684a', 800, 450, 0, true),
  ('de000000-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=400&q=80', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800&q=80', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1600&q=80', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d', 800, 450, 1, false),
  
  -- 6. Toyota Innova
  ('de000000-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1503376712351-1f95d10d6118?w=400&q=80', 'https://images.unsplash.com/photo-1503376712351-1f95d10d6118?w=800&q=80', 'https://images.unsplash.com/photo-1503376712351-1f95d10d6118?w=1600&q=80', 'https://images.unsplash.com/photo-1503376712351-1f95d10d6118', 800, 450, 0, true),
  ('de000000-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400&q=80', 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&q=80', 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1600&q=80', 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd', 800, 450, 1, false),
  
  -- 7. Ford Ranger
  ('de000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1600&q=80', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf', 800, 450, 0, true),
  ('de000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&q=80', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1600&q=80', 'https://images.unsplash.com/photo-1550355291-bbee04a92027', 800, 450, 1, false),
  
  -- 8. Mitsubishi Xpander
  ('de000000-0000-4000-8000-000000000008', 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1600&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753', 800, 450, 0, true),
  ('de000000-0000-4000-8000-000000000008', 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&q=80', 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80', 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1600&q=80', 'https://images.unsplash.com/photo-1553440569-bcc63803a83d', 800, 450, 1, false),
  
  -- 9. Honda CR-V
  ('de000000-0000-4000-8000-000000000009', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1600&q=80', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7', 800, 450, 0, true),
  ('de000000-0000-4000-8000-000000000009', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1600&q=80', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888', 800, 450, 1, false),
  
  -- 10. Mercedes C-Class
  ('de000000-0000-4000-8000-000000000010', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7', 800, 450, 0, true),
  ('de000000-0000-4000-8000-000000000010', 'https://images.unsplash.com/photo-1611821064430-0d402242bbe8?w=400&q=80', 'https://images.unsplash.com/photo-1611821064430-0d402242bbe8?w=800&q=80', 'https://images.unsplash.com/photo-1611821064430-0d402242bbe8?w=1600&q=80', 'https://images.unsplash.com/photo-1611821064430-0d402242bbe8', 800, 450, 1, false);

commit;

INSERT INTO reference_prices (code, label, unit, price, source, effective_date) 
VALUES 
  ('xang_ron95', 'Xăng RON 95', 'lít', 24000, 'Petrolimex', CURRENT_DATE), 
  ('dau_do', 'Dầu DO', 'lít', 21000, 'Petrolimex', CURRENT_DATE)
ON CONFLICT DO NOTHING;
