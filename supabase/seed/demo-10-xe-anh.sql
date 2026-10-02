-- ============================================================
-- Thêm ảnh (từ Unsplash) cho 10 xe DEMO để xem giao diện đầy đủ
-- Cần chạy sau khi đã chạy `demo-10-xe.sql`
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
insert into listing_images (listing_id, url_thumb, url_medium, url_full, url_original, width, height, is_cover)
values
  -- 1. Toyota Vios (Sedan trắng)
  ('de000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1590362891991-f776e747a58f?w=400&q=80', 'https://images.unsplash.com/photo-1590362891991-f776e747a58f?w=800&q=80', 'https://images.unsplash.com/photo-1590362891991-f776e747a58f?w=1600&q=80', 'https://images.unsplash.com/photo-1590362891991-f776e747a58f', 800, 450, true),
  
  -- 2. Hyundai Accent (Sedan bạc)
  ('de000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2', 800, 450, true),
  
  -- 3. Kia Morning (Hatchback đỏ)
  ('de000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1600&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24', 800, 450, true),
  
  -- 4. Mazda CX-5 (SUV xám)
  ('de000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1600&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935', 800, 450, true),
  
  -- 5. VinFast VF 6 (SUV xanh)
  ('de000000-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1605892706351-8742b8e3a24b?w=400&q=80', 'https://images.unsplash.com/photo-1605892706351-8742b8e3a24b?w=800&q=80', 'https://images.unsplash.com/photo-1605892706351-8742b8e3a24b?w=1600&q=80', 'https://images.unsplash.com/photo-1605892706351-8742b8e3a24b', 800, 450, true),
  
  -- 6. Toyota Innova (MPV bạc)
  ('de000000-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1609528100058-29472e38c946?w=400&q=80', 'https://images.unsplash.com/photo-1609528100058-29472e38c946?w=800&q=80', 'https://images.unsplash.com/photo-1609528100058-29472e38c946?w=1600&q=80', 'https://images.unsplash.com/photo-1609528100058-29472e38c946', 800, 450, true),
  
  -- 7. Ford Ranger (Bán tải đen)
  ('de000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1600&q=80', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf', 800, 450, true),
  
  -- 8. Mitsubishi Xpander (MPV trắng)
  ('de000000-0000-4000-8000-000000000008', 'https://images.unsplash.com/photo-1629897048514-3dd74142277f?w=400&q=80', 'https://images.unsplash.com/photo-1629897048514-3dd74142277f?w=800&q=80', 'https://images.unsplash.com/photo-1629897048514-3dd74142277f?w=1600&q=80', 'https://images.unsplash.com/photo-1629897048514-3dd74142277f', 800, 450, true),
  
  -- 9. Honda CR-V (SUV trắng)
  ('de000000-0000-4000-8000-000000000009', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1600&q=80', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7', 800, 450, true),
  
  -- 10. Mercedes C-Class (Sedan đen)
  ('de000000-0000-4000-8000-000000000010', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1600&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8', 800, 450, true);

commit;

INSERT INTO reference_prices (code, label, unit, price, source, effective_date) 
VALUES 
  ('xang_ron95', 'Xăng RON 95', 'lít', 24000, 'Petrolimex', CURRENT_DATE), 
  ('dau_do', 'Dầu DO', 'lít', 21000, 'Petrolimex', CURRENT_DATE)
ON CONFLICT DO NOTHING;
