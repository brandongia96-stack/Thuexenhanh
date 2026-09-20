-- ============================================================
-- Luồng 06 — VÍ TOKEN: hàm phía server. Chạy SAU 0001, 0002, 0003.
-- Độc lập với `src/modules/trust/server/0004_trust.sql` (luồng 08) —
-- hai file không đụng nhau, chạy thứ tự nào cũng được.
--
-- Nằm ở đây, không nằm trong `supabase/migrations/`, vì thư mục đó sinh tự
-- động từ contracts/ và chỉ luồng 01 được sửa. Luồng 01 xem xét rồi gộp.
--
-- KHÔNG sửa bảng nào của contracts/schema.sql. File này chỉ THÊM:
--   · hàm security definer để service_role gọi từ Edge Function
--   · view sổ ví có cột "số dư sau" tính bằng cửa sổ trượt
--   · trigger chặn số dư âm
--   · hàm đối soát + hàm cron hết hạn
--
-- Sáu luật kế toán (LUONG-CHAT/06-vi-token.md) được cưỡng chế ở đây,
-- không phải chỉ "nhớ mà làm đúng" trong JavaScript:
--   1. Sổ chỉ ghi thêm       -> trigger wallet_tx_append_only (đã có ở 0001)
--   2. Số dư = tổng các dòng -> wallet_so_du(), view wallet_balances. Không có cột balance.
--   3. Tách nạp / tiêu       -> view wallet_balances (đã có ở 0001)
--   4. Mỗi dòng đủ thông tin -> view wallet_ledger: loại, số token, SỐ DƯ SAU, lý do, tham chiếu, thời điểm
--   5. Trừ/cộng idempotent   -> unique(idem_key) trên sổ + kiểm tra charges.idem_key
--   6. Client không ghi ví   -> mọi hàm dưới đây revoke khỏi anon/authenticated
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. ĐỌC SỐ DƯ — nguồn sự thật duy nhất
-- ─────────────────────────────────────────────
-- Số dư KHÔNG BAO GIỜ được lưu rời thành một cột rồi tự cộng trừ.
-- Lệch một dòng là mất dấu vết vĩnh viễn. Luôn cộng lại từ sổ.
create or replace function wallet_so_du(p_user_id uuid) returns int
language sql stable security definer set search_path = public as $fn$
  select coalesce(sum(t.amount), 0)::int
  from wallets w
  left join wallet_transactions t on t.wallet_id = w.id
  where w.user_id = p_user_id
$fn$;

-- Ví có thể chưa tồn tại nếu tài khoản được tạo trước trigger 0002.
create or replace function ensure_wallet(p_user_id uuid) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare v_id uuid;
begin
  select id into v_id from wallets where user_id = p_user_id;
  if v_id is null then
    insert into wallets (user_id) values (p_user_id)
    on conflict (user_id) do update set updated_at = now()
    returning id into v_id;
  end if;
  return v_id;
end $fn$;

-- ─────────────────────────────────────────────
-- 2. SỔ VÍ CHO NGƯỜI DÙNG XEM
--    Luật 4 đòi mỗi dòng phải có "số dư sau". Schema KHÔNG có cột đó —
--    và đó là chủ ý: cột lưu sẵn sẽ sai khi có dòng chèn muộn. Tính bằng
--    cửa sổ trượt lúc đọc thì luôn khớp với tổng sổ, không thể lệch.
--    security_invoker -> RLS của wallet_transactions vẫn áp: chỉ thấy ví mình.
-- ─────────────────────────────────────────────
create or replace view wallet_ledger with (security_invoker = true) as
select
  t.id,
  w.user_id,
  t.wallet_id,
  t.kind,
  t.amount,
  sum(t.amount) over (partition by t.wallet_id
                      order by t.created_at, t.id
                      rows between unbounded preceding and current row)::int as so_du_sau,
  t.note,
  t.topup_id,
  t.charge_id,
  c.listing_id,
  c.kind as charge_kind,
  t.created_at
from wallet_transactions t
join wallets w on w.id = t.wallet_id
left join charges c on c.id = t.charge_id;

-- ─────────────────────────────────────────────
-- 3. CẤM SỐ DƯ ÂM
--    Hàng phòng thủ thứ hai. Hàng thứ nhất là khoá dòng ví trong
--    charge_and_publish. Nếu có ai đó viết đường trừ token mới mà quên
--    kiểm tra số dư, tầng này chặn — không phải code review chặn.
-- ─────────────────────────────────────────────
create or replace function check_wallet_non_negative() returns trigger
language plpgsql set search_path = public as $fn$
declare v_so_du int;
begin
  select coalesce(sum(amount), 0) into v_so_du
  from wallet_transactions where wallet_id = new.wallet_id;
  if v_so_du < 0 then
    raise exception 'So du vi % se bi am (%). Giao dich bi tu choi.', new.wallet_id, v_so_du
      using errcode = 'check_violation';
  end if;
  return null;
end $fn$;

drop trigger if exists wallet_tx_non_negative on wallet_transactions;
create trigger wallet_tx_non_negative
  after insert on wallet_transactions
  for each row execute function check_wallet_non_negative();

-- ─────────────────────────────────────────────
-- 4. CỘNG TOKEN KHI TIỀN VỀ  (webhook ngân hàng gọi)
--
--    Idempotent theo mã giao dịch của nhà cung cấp. Webhook bắn 2 lần,
--    10 lần, hay bắn lại sau 3 ngày -> vẫn chỉ đúng MỘT dòng sổ, vì
--    wallet_transactions.idem_key là UNIQUE và ta để CSDL từ chối bản thứ hai
--    thay vì tự đi kiểm tra "đã có chưa" (kiểm tra kiểu đó thua race condition).
-- ─────────────────────────────────────────────
create or replace function credit_topup(
  p_topup_id     uuid,
  p_provider     text,
  p_provider_ref text,
  p_vnd_received int default null
) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  v_topup  topups%rowtype;
  v_wallet uuid;
  v_idem   text;
  v_tx     uuid;
begin
  if p_provider_ref is null or length(trim(p_provider_ref)) = 0 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le',
                              'message', 'Thiếu mã giao dịch ngân hàng');
  end if;

  select * into v_topup from topups where id = p_topup_id for update;
  if not found then
    return jsonb_build_object('error', 'khong_tim_thay',
                              'message', 'Không tìm thấy yêu cầu nạp');
  end if;

  -- Trả thiếu thì KHÔNG cộng. Ghi nhận để người thật xử lý, không tự đoán ý.
  if p_vnd_received is not null and p_vnd_received < v_topup.vnd_amount then
    return jsonb_build_object('error', 'sai_so_tien',
                              'message', 'Số tiền nhận được nhỏ hơn số tiền của yêu cầu nạp',
                              'da_nhan', p_vnd_received, 'can_co', v_topup.vnd_amount);
  end if;

  v_wallet := ensure_wallet(v_topup.user_id);
  v_idem   := 'topup:' || coalesce(p_provider, 'bank') || ':' || p_provider_ref;

  -- Chuyển khoản dư thì vẫn chỉ cộng đúng số token đã đặt. Phần dư ghi vào note,
  -- không âm thầm quy đổi thành token — tiền của người ta, phải nói rõ.
  insert into wallet_transactions (wallet_id, kind, amount, topup_id, idem_key, note)
  values (v_wallet, 'nap', v_topup.token_amount, v_topup.id, v_idem,
          'Nạp ' || v_topup.token_amount || ' token · mã ' || v_topup.transfer_code ||
          case when p_vnd_received is not null and p_vnd_received > v_topup.vnd_amount
               then ' · chuyển dư ' || (p_vnd_received - v_topup.vnd_amount) || 'đ, chưa quy đổi'
               else '' end)
  on conflict (idem_key) do nothing
  returning id into v_tx;

  if v_tx is null then
    -- Webhook gửi lại. Không cộng lần hai. Không coi là lỗi.
    return jsonb_build_object('da_xu_ly', true, 'topup_id', v_topup.id,
                              'so_du', wallet_so_du(v_topup.user_id));
  end if;

  update topups
     set status = 'da_thanh_toan', paid_at = now(),
         provider = coalesce(p_provider, provider), provider_ref = p_provider_ref
   where id = v_topup.id and status = 'cho_thanh_toan';

  insert into notifications (user_id, kind, title, body, link)
  values (v_topup.user_id, 'nap_thanh_cong',
          'Đã cộng ' || v_topup.token_amount || ' token',
          'Yêu cầu nạp ' || v_topup.transfer_code || ' đã được ghi nhận.',
          '/chu-xe/vi');

  insert into events (kind, actor_id, meta)
  values ('topup', v_topup.user_id,
          jsonb_build_object('topup_id', v_topup.id, 'token', v_topup.token_amount));

  return jsonb_build_object('da_xu_ly', false, 'topup_id', v_topup.id,
                            'token_credited', v_topup.token_amount,
                            'so_du', wallet_so_du(v_topup.user_id));
end $fn$;

-- ─────────────────────────────────────────────
-- 5. TRỪ TOKEN + BẬT HIỂN THỊ  — MỘT GIAO DỊCH
--
--    Trừ tiền rồi mới bật tin ở hai lệnh riêng là cách mất tiền của người
--    khác: lỗi ở giữa thì token bay mà tin không lên. Hàm plpgsql này chạy
--    trong một transaction — hoặc cả hai xong, hoặc không gì xảy ra.
--
--    Giá: 10 token / 1 xe / 1 tháng, TUYẾN TÍNH (CLAUDE.md mục 6).
--    Server là nguồn sự thật của giá. Client gửi lên bao nhiêu token cũng
--    không được tin — hàm tự tính lại từ số tháng.
-- ─────────────────────────────────────────────
create or replace function charge_and_publish(
  p_user_id    uuid,
  p_listing_id uuid,
  p_months     int,
  p_idem_key   text
) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  c_token_per_month constant int := 10;   -- khớp src/lib/config.js TOKENS_PER_MONTH
  v_listing listings%rowtype;
  v_charge  charges%rowtype;
  v_wallet  uuid;
  v_so_du   int;
  v_tokens  int;
  v_bat_dau timestamptz;
  v_het_han timestamptz;
  v_kind    charge_kind;
begin
  if p_months is null or p_months < 1 or p_months > 12 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le',
                              'message', 'Số tháng phải từ 1 đến 12',
                              'fields', jsonb_build_object('months', 'khong_hop_le'));
  end if;
  if p_idem_key is null or length(trim(p_idem_key)) = 0 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le',
                              'message', 'Thiếu idem_key — mọi lần trừ token bắt buộc có khoá');
  end if;

  -- Gửi lại cùng khoá -> trả lại kết quả lần đầu. KHÔNG trừ lần hai.
  select * into v_charge from charges where idem_key = p_idem_key;
  if found then
    select * into v_listing from listings where id = v_charge.listing_id;
    return jsonb_build_object('da_xu_ly', true,
                              'charge_id', v_charge.id,
                              'token_charged', v_charge.token_amount,
                              'expires_at', v_listing.expires_at,
                              'so_du', wallet_so_du(p_user_id));
  end if;

  select * into v_listing from listings
   where id = p_listing_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('error', 'khong_tim_thay', 'message', 'Không tìm thấy tin đăng');
  end if;
  if v_listing.owner_id <> p_user_id then
    return jsonb_build_object('error', 'khong_co_quyen', 'message', 'Tin này không phải của bạn');
  end if;
  if v_listing.status not in ('cho_duyet', 'dang_hien_thi', 'sap_het_han', 'het_han') then
    return jsonb_build_object('error', 'trang_thai_khong_hop_le',
                              'message', 'Tin chưa sẵn sàng để hiển thị',
                              'status', v_listing.status);
  end if;

  -- Chưa từng đăng thì phải qua kiểm duyệt trước khi được trả phí (luồng 08).
  -- Không lấy tiền của chủ xe cho một tin có thể bị từ chối ngay sau đó.
  if v_listing.published_at is null
     and not exists (select 1 from moderation_queue
                      where listing_id = v_listing.id and status = 'da_duyet') then
    return jsonb_build_object('error', 'trang_thai_khong_hop_le',
                              'message', 'Tin đang chờ kiểm duyệt, chưa thu phí hiển thị');
  end if;

  v_tokens := p_months * c_token_per_month;
  v_kind   := case when v_listing.published_at is null then 'dang_tin' else 'gia_han' end;

  -- Khoá dòng ví trước khi đọc số dư: hai tab bấm cùng lúc thì tab sau phải
  -- xếp hàng, không được đọc cùng một số dư cũ rồi cùng trừ.
  v_wallet := ensure_wallet(p_user_id);
  perform 1 from wallets where id = v_wallet for update;

  v_so_du := wallet_so_du(p_user_id);
  if v_so_du < v_tokens then
    return jsonb_build_object('error', 'khong_du_token',
                              'message', 'Số dư không đủ để hiển thị tin',
                              'so_du', v_so_du, 'can_co', v_tokens);
  end if;

  -- Gia hạn khi tin CÒN hạn thì nối tiếp từ ngày hết hạn cũ, không cắt ngắn
  -- phần chủ xe đã trả. Tin đã hết hạn thì tính từ hôm nay.
  v_bat_dau := greatest(coalesce(v_listing.expires_at, now()), now());
  v_het_han := v_bat_dau + (p_months || ' months')::interval;

  insert into charges (user_id, listing_id, kind, token_amount, months,
                       period_start, period_end, idem_key)
  values (p_user_id, v_listing.id, v_kind, v_tokens, p_months,
          v_bat_dau, v_het_han, p_idem_key)
  returning * into v_charge;

  insert into wallet_transactions (wallet_id, kind, amount, charge_id, idem_key, note)
  values (v_wallet, 'tieu', -v_tokens, v_charge.id, 'charge:' || v_charge.id,
          case when v_kind = 'dang_tin' then 'Hiển thị tin ' else 'Gia hạn tin ' end
          || v_listing.brand_text || ' ' || v_listing.model_text
          || ' · ' || p_months || ' tháng');

  update listings
     set status       = 'dang_hien_thi',
         published_at = coalesce(published_at, now()),
         expires_at   = v_het_han
   where id = v_listing.id;

  insert into notifications (user_id, kind, title, body, link)
  values (p_user_id, 'tru_token',
          'Đã trừ ' || v_tokens || ' token',
          v_listing.brand_text || ' ' || v_listing.model_text
            || ' hiển thị tới ' || to_char(v_het_han, 'DD/MM/YYYY'),
          '/chu-xe/vi');

  insert into events (kind, listing_id, owner_id, actor_id, meta)
  values ('renew', v_listing.id, p_user_id, p_user_id,
          jsonb_build_object('charge_id', v_charge.id, 'token', v_tokens,
                             'months', p_months, 'charge_kind', v_kind));

  return jsonb_build_object('da_xu_ly', false,
                            'charge_id', v_charge.id,
                            'token_charged', v_tokens,
                            'expires_at', v_het_han,
                            'so_du', wallet_so_du(p_user_id));
end $fn$;

-- ─────────────────────────────────────────────
-- 6. HOÀN TOKEN  (chỉ admin gọi — luồng 10 / chính sách hoàn token luồng 12)
--    Không UPDATE dòng cũ. Ghi một dòng ĐẢO NGƯỢC. Sổ luôn kể đủ câu chuyện.
-- ─────────────────────────────────────────────
create or replace function refund_tokens(
  p_user_id  uuid,
  p_tokens   int,
  p_ly_do    text,
  p_idem_key text
) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_wallet uuid; v_tx uuid;
begin
  if p_tokens is null or p_tokens <= 0 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le', 'message', 'Số token hoàn phải dương');
  end if;
  if p_ly_do is null or length(trim(p_ly_do)) = 0 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le', 'message', 'Hoàn token bắt buộc có lý do');
  end if;
  if p_idem_key is null or length(trim(p_idem_key)) = 0 then
    return jsonb_build_object('error', 'du_lieu_khong_hop_le', 'message', 'Thiếu idem_key');
  end if;

  v_wallet := ensure_wallet(p_user_id);
  insert into wallet_transactions (wallet_id, kind, amount, idem_key, note)
  values (v_wallet, 'hoan', p_tokens, p_idem_key, p_ly_do)
  on conflict (idem_key) do nothing
  returning id into v_tx;

  return jsonb_build_object('da_xu_ly', v_tx is null,
                            'so_du', wallet_so_du(p_user_id));
end $fn$;

-- ─────────────────────────────────────────────
-- 7. CRON HẾT HẠN
--    Hết token -> tin ẩn khỏi tìm kiếm. DỮ LIỆU GIỮ NGUYÊN, không xoá gì.
--    Nạp vào rồi gia hạn là tin hiện lại nguyên vẹn.
-- ─────────────────────────────────────────────
create or replace function expire_listings() returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_sap int; v_het int;
begin
  with u as (
    update listings set status = 'het_han'
     where status in ('dang_hien_thi', 'sap_het_han')
       and expires_at is not null and expires_at <= now()
       and deleted_at is null
    returning id, owner_id, brand_text, model_text
  ), n as (
    insert into notifications (user_id, kind, title, body, link)
    select owner_id, 'het_han', 'Tin đã hết hạn hiển thị',
           brand_text || ' ' || model_text || ' đã ẩn khỏi tìm kiếm. Gia hạn là hiện lại nguyên vẹn.',
           '/chu-xe'
    from u returning 1
  )
  select count(*) into v_het from u;

  with u as (
    update listings set status = 'sap_het_han'
     where status = 'dang_hien_thi'
       and expires_at is not null
       and expires_at <= now() + interval '3 days'
       and deleted_at is null
    returning id, owner_id, brand_text, model_text, expires_at
  ), n as (
    insert into notifications (user_id, kind, title, body, link)
    select owner_id, 'sap_het_han', 'Tin sắp hết hạn',
           brand_text || ' ' || model_text || ' hết hạn ngày '
             || to_char(expires_at, 'DD/MM/YYYY') || '.',
           '/chu-xe'
    from u returning 1
  )
  select count(*) into v_sap from u;

  return jsonb_build_object('het_han', v_het, 'sap_het_han', v_sap);
end $fn$;

-- ─────────────────────────────────────────────
-- 8. ĐỐI SOÁT SỔ SÁCH
--    Chạy tay hoặc theo cron. Trả về dòng nào là có chuyện — bảng RỖNG là tốt.
--    Bốn câu hỏi: có ví nào âm không, sổ có khớp chứng từ nạp không,
--    có khớp chứng từ trừ không, có khoản đã thu tiền mà quên cộng token không.
-- ─────────────────────────────────────────────
create or replace function doi_soat_vi()
returns table (van_de text, user_id uuid, chi_tiet jsonb)
language sql stable security definer set search_path = public as $fn$
  -- a. Số dư âm — không bao giờ được phép xảy ra.
  select 'so_du_am'::text, b.user_id,
         jsonb_build_object('so_du', b.so_du)
  from wallet_balances b where b.so_du < 0

  union all
  -- b. Token đã nạp trên sổ != tổng chứng từ nạp đã thanh toán.
  select 'nap_lech_chung_tu'::text, w.user_id,
         jsonb_build_object('so_theo_so_vi', coalesce(l.nap, 0),
                            'so_theo_topups', coalesce(t.nap, 0))
  from wallets w
  left join (select tx.wallet_id, sum(tx.amount) nap from wallet_transactions tx
              where tx.kind = 'nap' group by 1) l on l.wallet_id = w.id
  left join (select tp.user_id, sum(tp.token_amount) nap from topups tp
              where tp.status = 'da_thanh_toan' group by 1) t on t.user_id = w.user_id
  where coalesce(l.nap, 0) <> coalesce(t.nap, 0)

  union all
  -- c. Token đã tiêu trên sổ != tổng chứng từ trừ.
  select 'tieu_lech_chung_tu'::text, w.user_id,
         jsonb_build_object('so_theo_so_vi', coalesce(-l.tieu, 0),
                            'so_theo_charges', coalesce(c.tieu, 0))
  from wallets w
  left join (select tx.wallet_id, sum(tx.amount) tieu from wallet_transactions tx
              where tx.kind = 'tieu' group by 1) l on l.wallet_id = w.id
  left join (select ch.user_id, sum(ch.token_amount) tieu from charges ch group by 1) c
         on c.user_id = w.user_id
  where coalesce(-l.tieu, 0) <> coalesce(c.tieu, 0)

  union all
  -- d. Đã báo thanh toán nhưng không có dòng sổ nào tham chiếu tới.
  select 'topup_quen_cong'::text, tp.user_id,
         jsonb_build_object('topup_id', tp.id, 'transfer_code', tp.transfer_code)
  from topups tp
  where tp.status = 'da_thanh_toan'
    and not exists (select 1 from wallet_transactions t where t.topup_id = tp.id)
$fn$;

-- ─────────────────────────────────────────────
-- 9. QUYỀN GỌI — luật 6: client KHÔNG BAO GIỜ chạm vào ví
--    Mặc định Postgres cho public execute mọi hàm. Thu lại hết, chỉ
--    service_role (Edge Function) được gọi. Hàm chạy security definer mà
--    quên revoke thì bằng mở toang cửa két.
-- ─────────────────────────────────────────────
do $blk$
declare f text;
begin
  foreach f in array array[
    'credit_topup(uuid,text,text,int)',
    'charge_and_publish(uuid,uuid,int,text)',
    'refund_tokens(uuid,int,text,text)',
    'expire_listings()',
    'doi_soat_vi()',
    'ensure_wallet(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $blk$;

-- wallet_so_du nhận user_id làm tham số nên ai gọi được là đọc được số dư của
-- người khác. Chỉ server gọi. Client đọc số dư của mình qua view
-- `wallet_balances` — view đó có RLS, không lộ ví người khác.
revoke all on function wallet_so_du(uuid) from public, anon, authenticated;
grant execute on function wallet_so_du(uuid) to service_role;

grant select on wallet_ledger to authenticated;
