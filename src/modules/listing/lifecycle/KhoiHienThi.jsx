// listing/lifecycle/KhoiHienThi — khối "Hiển thị tin" ở trang sửa tin.
//
// Khối này CHỈ mở hộp trả phí của luồng 06 (`HopTraPhi`). Luồng 02 không có cơ
// chế trừ token riêng, không tự gọi `publish-listing`: đường trừ token phải là
// một, để khi mô hình giá đổi chỉ có một chỗ phải sửa và kiểm lại.
//
// Ai làm gì:
//   · Luồng 02 (đây): cho chủ xe thấy tin đang ở đâu, còn bao ngày, và mở hộp.
//   · Luồng 06: HopTraPhi → Edge Function publish-listing → charge_and_publish.
//   · Server: tính giá, trừ token, đổi status, ghi expires_at. Client không ghi.

import { lazy, Suspense, useEffect, useState } from 'react'
import { CalendarClock, Eye } from 'lucide-react'
import { soDuVi } from '../../billing/billingApi'
import { formatDate } from '../../../lib/format'
import { STATUS, coTheGiaHan, loiNhacHan, trangThaiThuc } from './vongDoi'
// HopTraPhi dùng class của billing.css (chon-luoi, hop-nen…). Trang ví tự nạp
// file này; trang sửa tin không đi qua trang ví nên phải nạp ở đây.
import '../../billing/billing.css'

// Tải trễ: hộp trả phí chỉ cần khi chủ xe bấm nút, không đáng nằm trong gói form.
const HopTraPhi = lazy(() => import('../../billing').then((m) => ({ default: m.HopTraPhi })))

export default function KhoiHienThi({ tin, userId, onDoiTrangThai }) {
  const [moHop, setMoHop] = useState(false)
  const [soDu, setSoDu] = useState(0)

  // Số dư chỉ để HopTraPhi hiển thị. Số token thật do server kiểm lại.
  useEffect(() => {
    if (!moHop || !userId) return
    let huy = false
    soDuVi(userId)
      .then((v) => { if (!huy) setSoDu(v?.so_du ?? 0) })
      .catch(() => { if (!huy) setSoDu(0) })
    return () => { huy = true }
  }, [moHop, userId])

  if (!tin) return null

  const thuc = trangThaiThuc(tin)
  const choTraPhi = thuc === STATUS.CHO_DUYET
  const giaHanDuoc = coTheGiaHan(thuc)

  // Nháp / từ chối / đã ẩn: chưa có gì để trả phí. Ẩn cả khối, không hiện ô trống.
  if (!choTraPhi && !giaHanDuoc) return null

  const nhac = loiNhacHan(tin)

  return (
    <>
      <div className="card card-pad kht">
        <div className="kht-dau">
          {giaHanDuoc ? <CalendarClock size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          <strong className="t-h3">Hiển thị tin</strong>
        </div>

        {giaHanDuoc && nhac && (
          <p className={`badge badge-${nhac.tone === 'neutral' ? 'neutral' : nhac.tone}`} style={{ alignSelf: 'flex-start' }}>
            {nhac.text}
          </p>
        )}
        {giaHanDuoc && tin.expires_at && (
          <p className="t-small">Hiển thị tới hết ngày {formatDate(tin.expires_at)}.</p>
        )}

        {choTraPhi && (
          <p className="t-small">
            Khi kiểm duyệt duyệt tin, anh trả phí hiển thị ở đây để tin lên tìm kiếm. Bấm khi
            chưa được duyệt thì hệ thống báo lại và <b>không trừ token</b>.
          </p>
        )}

        <button type="button" className="btn btn-primary" onClick={() => setMoHop(true)}>
          {choTraPhi ? 'Trả phí hiển thị' : 'Gia hạn hiển thị'}
        </button>
      </div>

      {moHop && (
        <Suspense fallback={null}>
          <HopTraPhi
            listing={tin}
            soDu={soDu}
            onDong={() => setMoHop(false)}
            // `kq` null = vừa nạp thêm token, chưa trả phí: chỉ cập nhật số dư.
            onXong={(kq) => {
              if (!kq) {
                soDuVi(userId).then((v) => setSoDu(v?.so_du ?? 0)).catch(() => {})
                return
              }
              onDoiTrangThai?.()
            }}
          />
        </Suspense>
      )}
    </>
  )
}
