// owner/BieuDo — biểu đồ đường 30 ngày, vẽ tay bằng SVG.
//
// Vì sao không dùng thư viện biểu đồ: HIEU-NANG.md mục 3 — "trước khi thêm thư
// viện mới, cân xem tự viết 30 dòng có xong không". Recharts kéo theo ~100KB
// gzip, bằng 2/3 ngân sách JS của cả app, để vẽ đúng hai đường thẳng.
//
// CLS: SVG có `viewBox` + `width:100%` thì trình duyệt tự tính chiều cao theo
// đúng tỷ lệ ngay trước khi vẽ → khung không bao giờ nhảy (HIEU-NANG.md 1.3).

import { formatDate } from '../../lib/format'

const W = 320
const H = 96
const PAD = { tren: 8, duoi: 16, trai: 4, phai: 4 }

// Hai chuỗi số, hai màu token. Không đặt mã màu mới (CLAUDE.md 1.3).
export const MAU = {
  view_listing: 'var(--m-green)',
  reveal_phone: 'var(--m-green-ok)',
}

function toaDo(chuoi, lay, dinh) {
  const n = chuoi.length
  const rong = W - PAD.trai - PAD.phai
  const cao = H - PAD.tren - PAD.duoi
  return chuoi.map((d, i) => {
    const x = PAD.trai + (n === 1 ? rong / 2 : (i * rong) / (n - 1))
    const y = H - PAD.duoi - (dinh === 0 ? 0 : (lay(d) / dinh) * cao)
    return [x, y]
  })
}

const duong = (diem) => diem.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')

/**
 * @param {{day:string, view_listing:number, reveal_phone:number}[]} chuoi
 * Chuỗi phải đủ N ngày, ngày không có dữ liệu là 0 — xem `soLieu.chuoiDayDu`.
 */
export default function BieuDo({ chuoi }) {
  if (!chuoi?.length) return null

  const dinh = Math.max(1, ...chuoi.map((d) => Math.max(d.view_listing, d.reveal_phone)))
  const xem = toaDo(chuoi, (d) => d.view_listing, dinh)
  const laySo = toaDo(chuoi, (d) => d.reveal_phone, dinh)
  const nen = `${duong(xem)} L${xem[xem.length - 1][0].toFixed(1)} ${H - PAD.duoi} L${xem[0][0].toFixed(1)} ${H - PAD.duoi} Z`

  const tongXem = chuoi.reduce((s, d) => s + d.view_listing, 0)
  const tongLaySo = chuoi.reduce((s, d) => s + d.reveal_phone, 0)

  return (
    <figure className="bd">
      <svg
        className="bd-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Biểu đồ ${chuoi.length} ngày: ${tongXem} lượt xem, ${tongLaySo} lượt lấy số. Ngày cao nhất ${dinh} lượt.`}
      >
        {/* Vạch mốc đỉnh và vạch đáy — đủ để đọc độ lớn, không cần lưới dày. */}
        <line x1="0" y1={PAD.tren} x2={W} y2={PAD.tren} className="bd-luoi" />
        <line x1="0" y1={H - PAD.duoi} x2={W} y2={H - PAD.duoi} className="bd-truc" />

        <path d={nen} className="bd-nen" />
        <path d={duong(xem)} className="bd-duong bd-xem" />
        <path d={duong(laySo)} className="bd-duong bd-lay-so" />

        {/* Chấm ngày cuối: chỗ mắt người tìm đến đầu tiên. */}
        <circle cx={xem[xem.length - 1][0]} cy={xem[xem.length - 1][1]} r="3" className="bd-cham bd-xem-cham" />
        <circle cx={laySo[laySo.length - 1][0]} cy={laySo[laySo.length - 1][1]} r="3" className="bd-cham bd-lay-so-cham" />
      </svg>

      <figcaption className="bd-chan">
        <span className="t-small">{formatDate(chuoi[0].day)}</span>
        <span className="t-small">Cao nhất {dinh} lượt/ngày</span>
        <span className="t-small">{formatDate(chuoi[chuoi.length - 1].day)}</span>
      </figcaption>
    </figure>
  )
}

/** Biểu đồ tí hon trong thẻ xe: chỉ đường lượt xem, không nhãn, không trục. */
export function BieuDoNho({ chuoi, mau = MAU.view_listing }) {
  if (!chuoi?.length) return null
  const dinh = Math.max(1, ...chuoi.map((d) => d.view_listing))
  const diem = toaDo(chuoi, (d) => d.view_listing, dinh)
  return (
    <svg className="bd-nho" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={duong(diem)} fill="none" stroke={mau} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/** Chú giải hai đường. Tách riêng để trang số liệu đặt ở đâu cũng được. */
export function ChuGiai() {
  return (
    <div className="bd-chu-giai">
      <span><i style={{ background: MAU.view_listing }} />Lượt xem</span>
      <span><i style={{ background: MAU.reveal_phone }} />Lượt lấy số</span>
    </div>
  )
}
