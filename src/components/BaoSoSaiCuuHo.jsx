import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag } from 'lucide-react'

import { trySupabase } from '../lib/supabase'
import { useAuth } from '../modules/auth/AuthProvider'

/**
 * Nút "Báo số sai" cho MỘT số cứu hộ lấy từ bảng `rescue_contacts`.
 * Dùng chung cho `/cuu-ho` (shell) và khối cứu hộ trong Thư viện chủ xe
 * (owner/DanhBaCuuHoSection) — tách ra đây để không viết hai lần cùng một
 * luật (chưa đăng nhập thì mời đăng nhập, ghi `complaints` kind 'khac').
 *
 * CHỈ dùng cho số lấy từ CSDL (admin đã nhập, có thể sai lệch theo thời
 * gian) — KHÔNG gắn vào 113/114/115: đó là đầu số quốc gia cố định, không
 * có gì để "báo sai".
 *
 * @param {{id: string, ten: string, sdt: string}} contact
 */
export default function BaoSoSaiCuuHo({ contact }) {
  const { user, isLoggedIn } = useAuth()
  // idle | can_dang_nhap | dang_gui | xong | loi
  const [trang, setTrang] = useState('idle')

  async function baoSoSai() {
    if (!isLoggedIn) { setTrang('can_dang_nhap'); return }
    setTrang('dang_gui')
    const sb = await trySupabase()
    if (!sb) { setTrang('loi'); return }
    const { error } = await sb.from('complaints').insert({
      user_id: user.id,
      kind: 'khac',
      content: `Báo số cứu hộ sai: "${contact.ten}" — ${contact.sdt} (mã liên hệ ${contact.id}).`,
    })
    setTrang(error ? 'loi' : 'xong')
  }

  if (trang === 'xong') {
    return <p className="t-small">Đã gửi báo cáo, cảm ơn anh/chị.</p>
  }
  if (trang === 'can_dang_nhap') {
    return (
      <p className="t-small">
        Cần <Link to="/dang-nhap">đăng nhập</Link> để báo số sai.
      </p>
    )
  }
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={baoSoSai}
      disabled={trang === 'dang_gui'}
    >
      <Flag size={14} strokeWidth={1.8} />
      {trang === 'dang_gui' ? 'Đang gửi…' : trang === 'loi' ? 'Gửi lỗi, bấm lại' : 'Báo số sai'}
    </button>
  )
}
