// admin — khối "Đối soát ví". CHỈ BÁO, không sửa gì.
//
// Gọi doi_soat_vi() (0004_billing.sql) qua admin-ops. Mỗi dòng trả về là một
// chỗ sổ sách có vấn đề; không có dòng nào = sổ khớp. Muốn sửa thì xử lý tay
// ở màn "Người dùng & ví" (ghi thêm dòng sổ có lý do), không có nút tự sửa ở đây.

import { RefreshCw, ShieldCheck } from 'lucide-react'
import Badge from '../../components/Badge'
import { Skeleton } from '../../components/Loading'
import { doiSoatVi } from './adminApi'
import { useTai, thongDiepLoi } from './useTai'

// Bốn loại vấn đề doi_soat_vi() có thể trả về.
const LOAI = {
  so_du_am: {
    ten: 'Số dư âm',
    giaiThich: 'Ví có số dư dưới 0. Không bao giờ được xảy ra — trigger chặn số dư âm đã bị lách.',
  },
  nap_lech_chung_tu: {
    ten: 'Nạp lệch chứng từ',
    giaiThich: 'Token "nạp" trên sổ ví khác tổng các lệnh nạp đã thanh toán (topups).',
  },
  tieu_lech_chung_tu: {
    ten: 'Tiêu lệch chứng từ',
    giaiThich: 'Token "tiêu" trên sổ ví khác tổng các khoản phí (charges).',
  },
  topup_quen_cong: {
    ten: 'Đã thu tiền, quên cộng token',
    giaiThich: 'Lệnh nạp đã thanh toán nhưng không có dòng sổ nào tham chiếu tới.',
  },
}

function ChiTiet({ d }) {
  return (
    <span className="t-small">
      {Object.entries(d ?? {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}
    </span>
  )
}

export default function DoiSoatVi() {
  const { data, loi, dangTai, taiLai } = useTai(() => doiSoatVi(), [])
  const items = data?.items ?? []

  return (
    <section className="card ad-item" aria-label="Đối soát ví">
      <div className="row" style={{ justifyContent: 'space-between', gap: 'var(--sp-3)' }}>
        <div className="t-h3">Đối soát ví</div>
        <button className="btn btn-sm btn-ghost" onClick={taiLai} disabled={dangTai}>
          <RefreshCw size={14} strokeWidth={2} /> Chạy lại
        </button>
      </div>

      {dangTai && !data ? <Skeleton height={60} /> : loi ? (
        <div className="ad-loi" role="alert">Không chạy được đối soát: {thongDiepLoi(loi)}</div>
      ) : items.length === 0 ? (
        <div className="row" style={{ gap: 'var(--sp-2)' }}>
          <Badge tone="verified" icon={ShieldCheck}>Sổ khớp</Badge>
          <span className="t-small">Không phát hiện vấn đề nào ở 4 hạng mục.</span>
        </div>
      ) : (
        <>
          <div className="ad-canh-bao" role="alert">
            Phát hiện {items.length} vấn đề. Trang này chỉ báo — không tự sửa dữ liệu.
          </div>
          <table className="ad-bang">
            <thead><tr><th>Vấn đề</th><th>Người dùng</th><th>Chi tiết</th></tr></thead>
            <tbody>
              {items.map((r, i) => {
                const l = LOAI[r.van_de]
                return (
                  <tr key={`${r.van_de}-${r.user_id}-${i}`}>
                    <td>
                      <Badge tone="danger">{l?.ten ?? r.van_de}</Badge>
                      {l && <div className="t-small">{l.giaiThich}</div>}
                    </td>
                    <td><code>{r.user_id?.slice(0, 8)}</code></td>
                    <td><ChiTiet d={r.chi_tiet} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
