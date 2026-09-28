-- ============================================================
-- Luồng 02 — BUCKET ẢNH XE + quyền upload/đọc. Chạy SAU 0010.
-- An toàn chạy lại nhiều lần.
--
-- Vì sao cần: supabase/README.md bước 4 bảo tạo bucket bằng tay trên dashboard,
-- nhưng chưa ai làm — kiểm 28/09 cho thấy `listing-images` trả `Bucket not found`,
-- nên mọi lần tải ảnh của chủ xe đều thất bại và `listing_images` có 0 dòng.
-- Đưa vào migration thì bucket + quyền nằm trong git, dựng lại được ở dự án khác.
--
-- Đường dẫn (contracts/api.md mục 5, code ở src/modules/listing/media/storage.js):
--     <owner_id>/<listing_id>/<uuid>_<thumb|medium|full>.webp
-- Thư mục cấp 1 CHÍNH LÀ id người sở hữu — quyền ghi bám vào đó.
-- ============================================================

-- ── 1. Bucket ──
-- public = true: URL dạng /object/public/... tải được không cần đăng nhập, là thứ
-- thẻ xe trong danh sách cần (ảnh có tên chứa UUID, cache 1 năm — HIEU-NANG mục 5).
--
-- Giới hạn ngay ở bucket, không tin client:
--   · 1 MiB/file. Mục tiêu của bản lớn nhất (`full`) là < 200 KB; chừa dư vì bước
--     nén có thể không xuống được ngưỡng ở ảnh nhiều chi tiết. ~5× ngân sách là
--     đủ rộng cho ảnh thật, đủ hẹp để không ai dùng làm chỗ chứa file tuỳ ý.
--   · Chỉ WebP và JPEG — đúng hai định dạng imagePipeline.js xuất ra (JPEG là
--     đường lui cho trình duyệt không xuất được WebP).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── 2. Quyền trên storage.objects ──
-- (RLS đã bật sẵn trên storage.objects; không có policy = từ chối hết.)

-- Ai cũng đọc được ảnh xe. Bucket public đã cho tải qua URL công khai; policy này
-- thêm cho việc liệt kê/`download()` qua API, và chỉ trong ĐÚNG bucket này.
drop policy if exists listing_images_doc on storage.objects;
create policy listing_images_doc on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'listing-images');

-- Chỉ người đăng nhập, và CHỈ vào thư mục mang id của chính mình.
-- Người khác ghi vào <id-của-anh>/... là bị chặn; anon không ghi được gì.
drop policy if exists listing_images_ghi on storage.objects;
create policy listing_images_ghi on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Cần cho `upload(..., { upsert: true })` mà media/storage.js dùng: thử lại sau
-- lỗi mạng ghi đè file dở dang của lần trước thay vì báo trùng. Cũng chỉ trong
-- thư mục của chính mình, cả file cũ (using) lẫn file mới (with check).
drop policy if exists listing_images_sua on storage.objects;
create policy listing_images_sua on storage.objects
  for update to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- CỐ Ý KHÔNG có policy DELETE: client không xoá file. Gỡ ảnh khỏi tin là xoá MỀM
-- dòng `listing_images` (CLAUDE.md §1.3); file ở Storage giữ nguyên, dọn định kỳ
-- bằng service_role nếu cần.
--
-- `verify-docs` (giấy tờ xét tích xanh, riêng tư) CHƯA tạo ở đây: luồng 08 chưa
-- dựng màn tải giấy tờ. Tạo cùng lúc với policy "chỉ admin đọc" khi có màn đó,
-- đừng tạo bucket rỗng rồi để đó.
