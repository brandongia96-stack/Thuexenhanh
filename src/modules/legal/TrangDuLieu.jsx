import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { getSupabase, trySupabase } from '../../lib/supabase'
import { formatDateTime } from '../../lib/format'
import { docDongY, dongYHopLe, ghiDongY, PHIEN_BAN_MUC } from './dongY'

const MUC_BAT_BUOC = [
  ['terms', 'Điều khoản sử dụng'],
  ['operation', 'Quy chế hoạt động'],
  ['privacy', 'Chính sách bảo vệ dữ liệu cá nhân'],
  ['age_18', 'Xác nhận đủ 18 tuổi'],
]

/**
 * Dữ liệu & Quyền riêng tư (trong Tài khoản). Ba việc:
 *   1. Xem trạng thái đồng ý từng mục; bật/tắt mục tuỳ chọn.
 *   2. Tải toàn bộ dữ liệu của mình (rpc xuat_du_lieu_cua_toi).
 *   3. Yêu cầu xoá tài khoản — chờ 7 ngày, huỷ được (rpc yeu_cau_xoa_tai_khoan).
 *
 * Mọi trạng thái đọc từ server; lỗi tải thì nói "chưa tải được", không đoán.
 */
export default function TrangDuLieu() {
  const { user, isOwner } = useAuth()
  const [tt, setTt] = useState(undefined)         // undefined = đang tải, null = lỗi
  const [xoa, setXoa] = useState(undefined)       // undefined = đang tải, null = không có yêu cầu
  const [viec, setViec] = useState(null)          // tên việc đang chạy
  const [loi, setLoi] = useState(null)
  const [xacNhanXoa, setXacNhanXoa] = useState(false)
  const [soDuToken, setSoDuToken] = useState(null)

  const userId = user?.id

  const taiYeuCauXoa = useCallback(async () => {
    try {
      const sb = await trySupabase()
      if (!sb) { setXoa(null); return }
      const { data, error } = await sb
        .from('account_deletion_requests')
        .select('status, execute_after')
        .eq('user_id', userId)
        .in('status', ['cho', 'cho_xu_ly_token'])
        .maybeSingle()
      if (error) throw error
      setXoa(data ?? null)
    } catch {
      setXoa(null)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let huy = false
    docDongY(userId).then((m) => { if (!huy) setTt(m) })
    taiYeuCauXoa()
    return () => { huy = true }
  }, [userId, taiYeuCauXoa])

  async function chay(ten, fn) {
    setViec(ten)
    setLoi(null)
    try {
      await fn()
    } catch (e) {
      setLoi(e?.message || 'Chưa làm được. Bạn thử lại giúp chúng tôi.')
    } finally {
      setViec(null)
    }
  }

  const batTatKhuyenMai = (bat) => chay('khuyen-mai', async () => {
    await ghiDongY(userId, [{ document: 'marketing', granted: bat }])
    setTt(await docDongY(userId))
  })

  const taiDuLieu = () => chay('tai', async () => {
    const sb = await getSupabase()
    const { data, error } = await sb.rpc('xuat_du_lieu_cua_toi')
    if (error) throw error
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `du-lieu-thuexenhanh-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })

  const yeuCauXoa = () => chay('xoa', async () => {
    const sb = await getSupabase()
    const { data, error } = await sb.rpc('yeu_cau_xoa_tai_khoan')
    if (error) throw error
    if (data?.error) throw new Error(data.message || 'Chưa gửi được yêu cầu xoá.')
    setSoDuToken(typeof data?.so_du_token === 'number' ? data.so_du_token : null)
    setXacNhanXoa(false)
    await taiYeuCauXoa()
  })

  const huyXoa = () => chay('huy', async () => {
    const sb = await getSupabase()
    const { data, error } = await sb.rpc('huy_yeu_cau_xoa_tai_khoan')
    if (error) throw error
    if (data?.ok !== true) throw new Error('Không còn yêu cầu xoá nào để huỷ.')
    setSoDuToken(null)
    await taiYeuCauXoa()
  })

  const khuyenMaiDangBat = tt ? tt.get('marketing')?.granted === true : false

  return (
    <div className="page" style={{ maxWidth: 640, paddingBottom: 'var(--sp-12)' }}>
      <div className="row" style={{ gap: 'var(--sp-3)', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
        <Link to="/tai-khoan" className="btn btn-ghost" aria-label="Quay lại Tài khoản" style={{ padding: 'var(--sp-2)' }}>
          <ArrowLeft size={22} strokeWidth={1.8} />
        </Link>
        <h1 className="t-h2" style={{ margin: 0 }}>Dữ liệu &amp; Quyền riêng tư</h1>
      </div>

      {loi && <p className="field-error">{loi}</p>}

      <div className="stack" style={{ gap: 'var(--sp-4)' }}>
        {/* 1. Đồng ý */}
        <section className="card card-pad stack">
          <h2 className="t-h3">Những gì bạn đã đồng ý</h2>
          {tt === undefined && <p className="t-small">Đang tải…</p>}
          {tt === null && <p className="t-small">Chưa tải được trạng thái đồng ý. Bạn thử tải lại trang.</p>}
          {tt && (
            <>
              <ul className="stack" style={{ gap: 'var(--sp-2)', paddingLeft: 0, listStyle: 'none' }}>
                {MUC_BAT_BUOC.map(([d, ten]) => {
                  const r = tt.get(d)
                  return (
                    <li key={d} className="t-body">
                      <b>{ten}</b> — bắt buộc.{' '}
                      {r?.granted
                        ? <>Đã đồng ý phiên bản {r.version}, lúc {formatDateTime(r.luc)}{dongYHopLe(tt, d) ? '' : ' (có bản mới hơn, bạn sẽ được hỏi lại)'}.</>
                        : 'Chưa đồng ý.'}
                    </li>
                  )
                })}
              </ul>
              <p className="t-small">
                Các mục bắt buộc là điều kiện để dùng nền tảng. Muốn rút, bạn dùng mục “Xoá tài khoản” bên dưới.
              </p>

              <label className="row t-body" style={{ gap: 'var(--sp-2)', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={khuyenMaiDangBat}
                  disabled={viec === 'khuyen-mai'}
                  onChange={(e) => batTatKhuyenMai(e.target.checked)}
                  style={{ marginTop: 4 }}
                />
                <span>
                  <b>Nhận thông tin khuyến mại</b> — tuỳ chọn.
                  <span className="t-small" style={{ display: 'block' }}>
                    {tt.get('marketing')
                      ? `Lựa chọn hiện tại ghi ngày ${formatDateTime(tt.get('marketing').luc)}, phiên bản ${PHIEN_BAN_MUC.marketing}.`
                      : 'Bạn chưa chọn.'}
                  </span>
                </span>
              </label>

              {isOwner && (
                <p className="t-small">
                  Chủ xe: việc cho khách xem số điện thoại của tin do bạn quản lý ở{' '}
                  <Link to="/chu-xe">Xe của tôi</Link>.
                </p>
              )}
            </>
          )}
        </section>

        {/* 2. Tải dữ liệu */}
        <section className="card card-pad stack">
          <h2 className="t-h3">Tải dữ liệu của tôi</h2>
          <p className="t-body">
            Nhận một tệp JSON gồm dữ liệu chúng tôi đang giữ về tài khoản của bạn: hồ sơ, tin đăng,
            lịch sử đồng ý và các giao dịch của bạn.
          </p>
          <div>
            <button className="btn btn-primary" onClick={taiDuLieu} disabled={viec === 'tai'}>
              <Download size={18} strokeWidth={1.8} />
              {viec === 'tai' ? 'Đang chuẩn bị…' : 'Tải dữ liệu của tôi'}
            </button>
          </div>
        </section>

        {/* 3. Xoá tài khoản */}
        <section className="card card-pad stack">
          <h2 className="t-h3">Xoá tài khoản</h2>

          {xoa === undefined && <p className="t-small">Đang tải…</p>}

          {xoa && (
            <div className="stack">
              <div className="disclaimer">
                {xoa.status === 'cho_xu_ly_token' ? (
                  <>
                    Yêu cầu xoá của bạn đang chờ xử lý vì <b>ví còn token</b>. Chúng tôi xử lý hoàn token
                    theo <Link to="/hoan-token">Chính sách hoàn token</Link> trước, rồi mới xoá tài khoản.
                  </>
                ) : (
                  <>
                    Tài khoản sẽ được xoá sau <b>{formatDateTime(xoa.execute_after)}</b>
                    {soDuToken > 0 && <>. Ví của bạn còn <b>{soDuToken} token</b> — chúng tôi sẽ xử lý hoàn token trước khi xoá</>}.
                  </>
                )}
              </div>
              <div>
                <button className="btn btn-ghost" onClick={huyXoa} disabled={viec === 'huy'}>
                  {viec === 'huy' ? 'Đang huỷ…' : 'Huỷ yêu cầu xoá'}
                </button>
              </div>
            </div>
          )}

          {xoa === null && (
            <>
              <p className="t-body"><b>Sau 7 ngày kể từ khi bạn gửi yêu cầu, chúng tôi sẽ:</b></p>
              <ul className="stack" style={{ paddingLeft: '1.2em' }}>
                <li className="t-body"><b>Xoá:</b> tên, email, số điện thoại, số Zalo của bạn; gỡ liên kết đăng nhập Google; ẩn toàn bộ tin đăng của bạn.</li>
                <li className="t-body"><b>Giữ lại:</b> sổ ví và giao dịch token (là sổ sách kế toán, không xoá được), bản ghi bạn đã đồng ý điều khoản, và hồ sơ khiếu nại bạn đã gửi.</li>
                <li className="t-body"><b>Chưa xoá nếu ví còn token:</b> chúng tôi xử lý hoàn token theo <Link to="/hoan-token">Chính sách hoàn token</Link> trước.</li>
              </ul>
              <p className="t-small">
                Trong 7 ngày chờ, bạn vẫn huỷ được yêu cầu bằng nút “Huỷ yêu cầu xoá” trên trang này.
                Sau khi xoá xong thì không khôi phục được.
              </p>

              {!xacNhanXoa ? (
                <div>
                  <button className="btn btn-danger" onClick={() => setXacNhanXoa(true)}>
                    <Trash2 size={18} strokeWidth={1.8} />
                    Xoá tài khoản
                  </button>
                </div>
              ) : (
                <div className="stack">
                  <p className="t-body"><b>Bạn chắc chắn muốn gửi yêu cầu xoá tài khoản?</b></p>
                  <div className="row" style={{ gap: 'var(--sp-2)' }}>
                    <button className="btn btn-danger" onClick={yeuCauXoa} disabled={viec === 'xoa'}>
                      {viec === 'xoa' ? 'Đang gửi…' : 'Gửi yêu cầu xoá'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setXacNhanXoa(false)} disabled={viec === 'xoa'}>
                      Không xoá nữa
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <p className="t-small">
          Chi tiết xem <Link to="/bao-mat">Chính sách bảo vệ dữ liệu cá nhân</Link>. Cần hỗ trợ thêm:{' '}
          <Link to="/lien-he">Liên hệ</Link>.
        </p>
      </div>
    </div>
  )
}
