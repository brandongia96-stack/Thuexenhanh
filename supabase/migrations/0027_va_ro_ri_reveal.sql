-- ============================================================
-- 0027 (đổi số từ 0025 ngày 17/10, trùng số) — Vá rò rỉ SĐT qua reveal-phone (rà bảo mật 12/10/2026).
-- Chạy SAU 0021 (nơi tạo reveal_da_xem_24h). Chạy lại nhiều lần được.
--
-- Lỗ: hàm đếm hạn mức, khi KHÔNG xác định được danh tính (p_actor null VÀ
-- p_ip null), rơi vào nhánh `meta->>'ip' = NULL` → luôn sai → count = 0 →
-- khách ẩn danh xem số VÔ HẠN. Cộng với Edge Function cũ tin X-Forwarded-For
-- do client khai, kẻ cào gửi IP giả mỗi request là lấy sạch danh bạ chủ xe
-- mà không cần đăng nhập.
--
-- Vá hai lớp:
--   · Edge Function reveal-phone: chỉ tin IP ở phần phải nhất của XFF; ẩn danh
--     không có IP tin cậy thì chặn thẳng (đã sửa trong index.ts).
--   · Hàm này: danh tính không xác định = coi như ĐÃ kịch trần, trả số lớn để
--     caller luôn chặn. Hàng rào thứ hai, phòng caller khác quên kiểm.
-- ============================================================

create or replace function reveal_da_xem_24h(p_actor uuid, p_ip text, p_listing uuid)
returns int language sql stable security definer set search_path = public as $fn$
  select case
    -- Không biết là ai, cũng không biết từ đâu → không cho qua.
    when p_actor is null and p_ip is null then 2147483647
    else (
      select count(distinct listing_id)::int
      from events
      where kind = 'reveal_phone'
        and created_at > now() - interval '24 hours'
        and listing_id <> p_listing
        and (case when p_actor is not null then actor_id = p_actor
                  else actor_id is null and meta->>'ip' = p_ip end)
    )
  end
$fn$;

revoke all on function reveal_da_xem_24h(uuid, text, uuid) from public, anon, authenticated;
grant execute on function reveal_da_xem_24h(uuid, text, uuid) to service_role;
