-- ============================================================
-- DEMO: 10 tin xe mẫu để xem giao diện (luồng 02 / 04 / 05).
--
-- ĐÂY LÀ DỮ LIỆU GIẢ. Chỉ dùng trên bản dev, GỠ TRƯỚC KHI MỞ CHO NGƯỜI THẬT:
--   supabase/seed/xoa-demo-10-xe.sql
--
-- Cách chạy: Supabase → SQL Editor → dán CẢ FILE → Run. Chạy lại nhiều lần được
-- (cố định mã tin, `on conflict do nothing`) — không sinh thêm bản sao.
-- Cần đã chạy migration tới 0009 trở lên (0010 có hay không đều được).
--
-- Vì sao an toàn với luật trung thực (CLAUDE.md §1.2):
--   · Mọi tin ghi rõ "[DEMO]" trong mô tả và "(DEMO)" ở địa chỉ.
--   · Chủ xe là tài khoản riêng "DEMO – chủ xe mẫu", email đuôi `.invalid`
--     (tên miền dành riêng, không thể là email thật), không có mật khẩu -> không
--     ai đăng nhập được.
--   · SĐT là 0000000000 — không quay được số nào, không làm phiền người thật.
--   · KHÔNG có đánh giá, số chuyến, lượt xem, tích xanh. Bảng reviews / events
--     không được đụng tới.
--   · KHÔNG có ảnh: em không bịa ảnh xe. Thẻ xe sẽ hiện trạng thái không ảnh.
--     Muốn có ảnh, đăng nhập bằng tài khoản thật và tự tải lên ảnh của mình.
--   · Biển số để trống (không dùng biển số của ai).
-- ============================================================

begin;

-- Chạy trong SQL Editor là quyền `postgres`, không phải JWT service_role, nên
-- trigger guard_listing_insert (0005) sẽ chặn việc chèn tin đã ở trạng thái
-- hiển thị. Khai báo vai trò cho RIÊNG giao dịch này (tham số `true` = local).
select set_config('request.jwt.claim.role', 'service_role', true),
       set_config('request.jwt.claims', '{"role":"service_role"}', true);

-- ── 1. Chủ xe DEMO ──
-- Trigger handle_new_auth_user (0002) tự tạo hồ sơ + ví + vai trò khách.
insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values (
  'de000000-0000-4000-8000-000000000000',
  'authenticated', 'authenticated',
  'demo@thuexenhanh.invalid',
  '{"full_name":"DEMO – chủ xe mẫu"}'::jsonb,
  now(), now()
)
on conflict (id) do nothing;

-- ── 2. Mười tin ──
-- Mã hạn cố định để chạy lại không nhân đôi. Tên hãng/dòng/tỉnh/quận tra ra id
-- từ bảng tĩnh; nếu tên nào lệch thì id là null (tin vẫn lên, chỉ mất lọc theo id).
with mau (n, hang, dong, nam, cho, hop_so, nhien_lieu, tieu_hao, mau_xe, kieu, gia_ngay, gia_thang,
          coc, gioi_han_km, phi_km, tinh, quan, dia_chi, tien_nghi, gio_truoc, con_ngay) as (
  values
  ( 1, 'Toyota',        'Vios',       2022, 5, 'so_tu_dong', 'xang',   6.0, 'Trắng',   'Đô thị',    550000, 12500000, 'Tin mẫu',                 300, 5000, 'TP.HCM',    'Quận 7',      '(DEMO) gần Phú Mỹ Hưng',     array['cam_lui','gps','tui_khi','ban_do'],                    1, 30),
  ( 2, 'Hyundai',       'Accent',     2021, 5, 'so_san',     'xang',   5.8, 'Bạc',     'Đô thị',    480000, 11000000, 'Tin mẫu',                 300, 4000, 'TP.HCM',    'Tân Bình',    '(DEMO) gần sân bay',         array['cam_lui','tui_khi'],                                   2, 30),
  ( 3, 'Kia',           'Morning',    2020, 4, 'so_tu_dong', 'xang',   5.2, 'Đỏ',      'Đô thị',    400000,  9500000, 'Tin mẫu',                 250, 3000, 'Hà Nội',    'Cầu Giấy',    '(DEMO) gần Cầu Giấy',        array['cam_lui','ban_do'],                                    3, 30),
  ( 4, 'Mazda',         'CX-5',       2022, 5, 'so_tu_dong', 'xang',   7.5, 'Xám',     'Gầm cao',   950000, 21000000, 'Tin mẫu',                 300, 6000, 'Hà Nội',    'Hoàn Kiếm',   '(DEMO) khu phố cổ',          array['camera_360','cua_so_troi','adas','gps','ghe_da'],      4, 30),
  ( 5, 'VinFast',       'VF 6',       2024, 5, 'so_tu_dong', 'dien',   null,'Xanh lam','Gầm cao',   900000, 20000000, 'Tin mẫu',                 null,null, 'Đà Nẵng',   'Hải Châu',    '(DEMO) gần cầu Rồng',        array['camera_360','adas','tui_khi','ban_do'],                5, 30),
  ( 6, 'Toyota',        'Innova',     2021, 7, 'so_tu_dong', 'xang',   8.0, 'Bạc',     'Gia đình',  850000, 19000000, 'Tin mẫu',                 300, 5000, 'TP.HCM',    'Thủ Đức',     '(DEMO) khu công nghệ cao',   array['cam_lui','cam_bien_lop','gps','etc'],                  6, 30),
  ( 7, 'Ford',          'Ranger',     2022, 5, 'so_tu_dong', 'dau',    9.0, 'Đen',     'Gầm cao',  1100000, 24000000, 'Tin mẫu',                 350, 6000, 'Cần Thơ',   'Ninh Kiều',   '(DEMO) trung tâm Ninh Kiều', array['cam_lui','lop_du_phong','gps'],                        7, 30),
  ( 8, 'Mitsubishi',    'Xpander',    2023, 7, 'so_tu_dong', 'xang',   7.0, 'Trắng',   'Gia đình',  800000, 18000000, 'Tin mẫu',                 300, 5000, 'Hải Phòng', 'Ngô Quyền',   '(DEMO) gần trung tâm',       array['cam_lui','tui_khi','ban_do'],                          8, 30),
  ( 9, 'Honda',         'CR-V',       2022, 7, 'so_tu_dong', 'xang',   7.8, 'Trắng',   'Gia đình', 1200000, 26000000, 'Tin mẫu',                 300, 6000, 'Đà Nẵng',   'Sơn Trà',     '(DEMO) gần biển Mỹ Khê',     array['camera_360','cua_so_troi','adas','cam_bien_va_cham'],  9, 30),
  (10, 'Mercedes-Benz', 'C-Class',    2021, 5, 'so_tu_dong', 'xang',   8.5, 'Đen',     'Công tác', 2500000, null,     'Tin mẫu',                 250, 10000,'TP.HCM',    'Quận 1',      '(DEMO) trung tâm Quận 1',    array['ghe_da','cua_so_troi','camera_360','adas','gps'],     10,  2)
)
insert into listings (
  id, owner_id, status,
  brand_id, model_id, brand_text, model_text, year, seats, transmission, fuel, fuel_consumption,
  color, body_style, description,
  price_per_day, price_per_month, deposit_note, limit_km_per_day, extra_km_fee,
  province_id, district_id, address_text, amenity_codes,
  contact_phone, is_verified, published_at, expires_at
)
select
  ('de000000-0000-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  'de000000-0000-4000-8000-000000000000'::uuid,
  -- Tin còn ≤ 3 ngày là `sap_het_han`, khớp NGUONG_SAP_HET_HAN của app.
  case when m.con_ngay <= 3 then 'sap_het_han' else 'dang_hien_thi' end::listing_status,
  b.id, md.id, m.hang, m.dong, m.nam, m.cho, m.hop_so::transmission, m.nhien_lieu::fuel_type, m.tieu_hao,
  m.mau_xe, m.kieu,
  '[DEMO] Tin mẫu để xem thử giao diện — không phải xe thật, không cho thuê được.',
  m.gia_ngay, m.gia_thang, m.coc, m.gioi_han_km, m.phi_km,
  p.id, d.id, m.dia_chi, m.tien_nghi,
  '0000000000', false,
  now() - make_interval(hours => m.gio_truoc),
  now() + make_interval(days => m.con_ngay)
from mau m
left join brands    b  on b.name = m.hang
left join models    md on md.brand_id = b.id and md.name = m.dong
left join provinces p  on p.name = m.tinh
left join districts d  on d.province_id = p.id and d.name = m.quan
on conflict (id) do nothing;

commit;

-- Kiểm tra nhanh: phải ra 10 dòng, cột `co_id_tinh` và `co_id_hang` đều true.
select l.model_text, l.status, l.price_per_day,
       l.province_id is not null as co_id_tinh,
       l.brand_id is not null    as co_id_hang
from listings l
where l.owner_id = 'de000000-0000-4000-8000-000000000000' and l.deleted_at is null
order by l.published_at desc;
