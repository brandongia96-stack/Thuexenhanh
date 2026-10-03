-- ============================================================
-- 0019 — Tự lấy giá xăng/dầu mỗi ngày (Edge Function `gia-nhien-lieu`).
-- Chạy SAU 0018. Chạy lại được. Cần CRON_SECRET + Vault như 0017.
--
--   · `reference_price_now` thêm `checked_at` (= updated_at) ở CUỐI view:
--     mốc lần cuối hệ thống kiểm lại giá. Giao diện ẩn giá quá 10 ngày chưa
--     kiểm lại được — nguồn hỏng thì thà không hiện còn hơn hiện số cũ mãi.
--   · Mã xăng chốt lại: `xang_e10` (Xăng E10 RON95-III) thay `xang_ron95` —
--     từ 2026 bảng giá Petrolimex không còn bán RON95-III thường.
-- ============================================================

create or replace view reference_price_now with (security_invoker = true) as
select distinct on (code)
  code, label, unit, price, source, source_url, effective_date,
  updated_at as checked_at
from reference_prices
where deleted_at is null and effective_date <= current_date
order by code, effective_date desc;

grant select on reference_price_now to anon, authenticated;

-- 06:00 và 16:00 giờ VN (23:00, 09:00 UTC). Giá thường đổi chiều thứ Năm.
select cron.schedule('gia-nhien-lieu', '0 9,23 * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/gia-nhien-lieu',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$$);
