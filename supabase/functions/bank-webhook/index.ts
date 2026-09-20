// POST /bank-webhook  — nhà cung cấp gọi, KHÔNG có token người dùng.
// (contracts/api.md ghi đường dẫn là `/webhook/bank`; tên Edge Function không
//  chứa dấu `/` nên đường thật là `/functions/v1/bank-webhook`.)
//
// Xác thực bằng khoá bí mật của nhà cung cấp, không bằng gì khác. Endpoint này
// cộng tiền vào ví người ta — ai gọi được là in được token.
//
// SePay gửi dạng:
//   Authorization: Apikey <SEPAY_WEBHOOK_KEY>
//   { id, gateway, transferType: 'in'|'out', transferAmount, content, code,
//     referenceCode, accountNumber, transactionDate }
//
// Idempotent hoàn toàn: khoá 'topup:<provider>:<referenceCode>' là UNIQUE trong
// sổ ví. Nhà cung cấp bắn lại 10 lần thì vẫn đúng một dòng sổ, một lần cộng.
// Ta KHÔNG tự đi kiểm tra "đã xử lý chưa" rồi mới ghi — hai webhook về cùng lúc
// sẽ cùng thấy "chưa", cùng ghi. Để UNIQUE của Postgres từ chối bản thứ hai.

import { preflight, docBody, json } from '../_shared/http.ts'
import { admin } from '../_shared/db.ts'
import { timMaDoiSoat } from '../_shared/vietqr.ts'

type SePay = {
  id?: number | string
  gateway?: string
  transferType?: string
  transferAmount?: number
  content?: string
  code?: string | null
  referenceCode?: string
  description?: string
}

// So sánh chuỗi kiểu thường (a === b) thoát sớm ở ký tự đầu khác nhau, đủ để
// dò khoá theo thời gian phản hồi. So từng ký tự, luôn chạy hết.
function bangNhau(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let khac = 0
  for (let i = 0; i < a.length; i++) khac |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return khac === 0
}

Deno.serve(async (req) => {
  const p = preflight(req)
  if (p) return p

  const khoa = Deno.env.get('BANK_WEBHOOK_KEY') ?? ''
  if (!khoa) {
    console.error('bank-webhook: chua dat BANK_WEBHOOK_KEY')
    return json({ success: false, error: 'chua_cau_hinh' }, 500)
  }

  const gui = (req.headers.get('Authorization') ?? '').replace(/^Apikey\s+/i, '').trim()
  if (!bangNhau(gui, khoa)) {
    return json({ success: false, error: 'khong_co_quyen' }, 401)
  }

  const body = await docBody<SePay>(req)
  if (!body) return json({ success: false, error: 'du_lieu_khong_hop_le' }, 400)

  // Chỉ quan tâm tiền VÀO. Tiền ra khỏi tài khoản không liên quan tới ví token.
  if (body.transferType && body.transferType !== 'in') {
    return json({ success: true, bo_qua: 'khong_phai_tien_vao' })
  }

  const ma = timMaDoiSoat(body.code, body.content, body.description)
  const ref = String(body.referenceCode ?? body.id ?? '')
  const provider = Deno.env.get('BANK_PROVIDER') ?? 'sepay'

  if (!ma || !ref) {
    // Tiền có về thật nhưng không khớp mã nào. KHÔNG được im lặng: đây là tiền
    // của một người thật đang chờ token. Trả 200 để nhà cung cấp thôi gửi lại
    // (gửi lại cũng không khớp được), và để lại log đủ để tra tay.
    console.error('bank-webhook KHONG KHOP', JSON.stringify({ ref, content: body.content }))
    return json({ success: true, matched: false })
  }

  const sb = admin()
  const { data: topup, error: loiTim } = await sb
    .from('topups')
    .select('id')
    .eq('transfer_code', ma)
    .maybeSingle()

  if (loiTim) {
    console.error('bank-webhook tim topup', loiTim)
    return json({ success: false }, 500)   // 500 -> nhà cung cấp gửi lại, an toàn vì idempotent
  }
  if (!topup) {
    console.error('bank-webhook KHONG CO YEU CAU NAP', JSON.stringify({ ma, ref }))
    return json({ success: true, matched: false })
  }

  const { data, error } = await sb.rpc('credit_topup', {
    p_topup_id: topup.id,
    p_provider: provider,
    p_provider_ref: ref,
    p_vnd_received: Number(body.transferAmount) || null,
  })

  if (error) {
    console.error('bank-webhook credit_topup', error)
    return json({ success: false }, 500)
  }
  if ((data as { error?: string })?.error) {
    // Ví dụ chuyển thiếu tiền. Ghi log cho người thật xử lý, không tự quyết.
    console.error('bank-webhook tu choi cong', JSON.stringify({ ma, ref, data }))
    return json({ success: true, matched: true, ket_qua: data })
  }

  return json({ success: true, matched: true, ket_qua: data })
})
