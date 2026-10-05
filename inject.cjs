const fs = require('fs');
const content = fs.readFileSync('src/modules/auth/TrangTaiKhoan.jsx', 'utf8');

const injection = `
  if (view === 'referral') {
    const daNhapMa = profile?.referred_by_id != null
    const [maNhap, setMaNhap] = useState('')
    const [dangXuLy, setDangXuLy] = useState(false)
    const [loiGT, setLoiGT] = useState(null)
    const [thanhCongGT, setThanhCongGT] = useState(false)

    async function submitReferral(e) {
      e.preventDefault()
      if (!maNhap.trim()) return
      setDangXuLy(true)
      setLoiGT(null)
      try {
        const { getSupabase } = await import('../../lib/supabase')
        const sb = await getSupabase()
        const { data, error } = await sb.rpc('apply_referral', { ref_phone: maNhap.trim() })
        if (error) throw error
        if (data.error) throw new Error(data.error)
        setThanhCongGT(true)
        const { data: { session } } = await sb.auth.getSession()
        const { data: u } = await sb.from('users').select('*').eq('id', session.user.id).single()
        setProfile(u)
      } catch (err) {
        setLoiGT(err.message)
      } finally {
        setDangXuLy(false)
      }
    }

    return (
      <div className="tk-container">
        <div className="tk-header">
          <button className="btn btn-ghost" onClick={() => setView('menu')} style={{ padding: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="t-h3" style={{ margin: 0, flex: 1, textAlign: 'center', paddingRight: 36 }}>Mã giới thiệu</h2>
        </div>
        
        <div className="tk-content stack" style={{ gap: 'var(--sp-6)' }}>
          <div className="card card-pad stack" style={{ gap: 'var(--sp-3)', background: 'var(--m-green-bg)' }}>
            <h3 className="t-h3" style={{ color: 'var(--m-green)' }}>Chia sẻ cho bạn bè</h3>
            <p className="t-body">Khi bạn bè nhập mã giới thiệu của bạn, cả hai sẽ nhận được <strong>10 Token (Tương đương 1 lượt đăng xe miễn phí)</strong>.</p>
            <div className="stack" style={{ gap: 4 }}>
              <label className="t-small">Mã giới thiệu của bạn (SĐT):</label>
              <div className="row" style={{ gap: 'var(--sp-2)' }}>
                <input className="input" value={profile?.phone || 'Vui lòng cập nhật số điện thoại trước'} readOnly style={{ fontWeight: 'bold', flex: 1, background: '#fff' }} />
                <button className="btn btn-soft" onClick={() => navigator.clipboard.writeText(profile?.phone || '')}>Copy</button>
              </div>
            </div>
          </div>

          <div className="card card-pad stack" style={{ gap: 'var(--sp-3)' }}>
            <h3 className="t-h4">Bạn có mã giới thiệu?</h3>
            {daNhapMa ? (
              <div style={{ color: 'var(--m-green)', padding: 'var(--sp-3)', background: 'var(--m-green-light)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                ✓ Bạn đã nhập mã giới thiệu thành công.
              </div>
            ) : thanhCongGT ? (
              <div style={{ color: 'var(--m-green)', padding: 'var(--sp-3)', background: 'var(--m-green-light)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                🎉 Chúc mừng! Bạn và người giới thiệu vừa nhận được 10 Token.
              </div>
            ) : (
              <form onSubmit={submitReferral} className="stack" style={{ gap: 'var(--sp-3)' }}>
                <p className="t-small">Nhập mã (số điện thoại) của người đã giới thiệu bạn để nhận 10 Token.</p>
                <div className="row" style={{ gap: 'var(--sp-2)' }}>
                  <input className="input" style={{ flex: 1 }} value={maNhap} onChange={e => setMaNhap(e.target.value)} placeholder="Nhập số điện thoại người giới thiệu..." required />
                  <button type="submit" className="btn btn-primary" disabled={dangXuLy || !maNhap.trim()}>
                    {dangXuLy ? 'Đang gửi...' : 'Nhận Quà'}
                  </button>
                </div>
                {loiGT && <div className="ad-loi" style={{ marginTop: 0 }}>{loiGT}</div>}
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── GIAO DIỆN MENU CHÍNH (MỚI) ───
  return (
`;

const replaced = content.replace(/\s*\/\/\s*───\s*GIAO\s*DIỆN\s*MENU\s*CHÍNH\s*\(MỚI\)\s*───\s*return\s*\(/, injection);

fs.writeFileSync('src/modules/auth/TrangTaiKhoan.jsx', replaced, 'utf8');
console.log('Injected referral UI successfully!');
