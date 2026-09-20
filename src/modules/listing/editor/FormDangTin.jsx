// listing/editor/FormDangTin — form đăng / sửa một chiếc xe.
//
// Ba luật nhìn thấy rõ nhất trong file này:
//   1. Không có nút "Đặt xe ngay". Khách chỉ bấm "Xem số điện thoại" rồi gọi.
//   2. Không hứa hẹn tin sẽ lên ngay — tin đi qua kiểm duyệt và tốn token.
//   3. Chủ xe không tự đặt được tích xanh. Không có ô nào cho việc đó.

import { AlertCircle, CheckCircle2, Info, Loader2, Save, Send } from 'lucide-react'
import { AMENITIES } from '../../../data/amenities'
import { TOKENS_PER_MONTH } from '../../../lib/config'
import { vndForMonths } from '../../../lib/pricing'
import { formatVnd } from '../../../lib/format'
import { GOI, GOI_LABEL, GOI_MO_TA, nhomTruong } from '../fieldGroups'
import { nhanTrangThai, STATUS } from '../lifecycle/vongDoi'
import LichChanNgay from '../availability/LichChanNgay'
import UploadAnh from '../media/UploadAnh'
import TruongNhap from './TruongNhap'
import './FormDangTin.css'

export default function FormDangTin({ dieuKhien, onXong }) {
  const {
    goi, doiGoi,
    form, doiTruong, doiTienNghi,
    anh, doiAnh,
    ngayChan, setNgayChan,
    tin, trangThai, khoaSua, guiDuyetDuoc,
    dangTai, dangLuu, tienDoAnh,
    loiTruong, loiChung,
    luuNhap, luuVaGuiDuyet,
  } = dieuKhien

  if (dangTai) {
    return (
      <div className="fdt stack" aria-busy="true">
        {[220, 320, 260].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, borderRadius: 'var(--r-lg)' }} />
        ))}
      </div>
    )
  }

  const nhom = nhomTruong(form, goi)
  const dangChay = dangLuu != null
  const nhan = nhanTrangThai(trangThai)

  async function nhanLuuNhap() {
    const id = await luuNhap()
    if (id) onXong?.(id, 'nhap')
  }

  async function nhanGuiDuyet() {
    const id = await luuVaGuiDuyet()
    if (id) onXong?.(id, 'duyet')
  }

  return (
    <form className="fdt" onSubmit={(e) => e.preventDefault()}>
      {/* ─── Trạng thái tin: chỉ hiện khi đang sửa tin đã có ─── */}
      {tin && (
        <div className="card card-pad fdt-trang-thai">
          <span className={`badge badge-${nhan.tone}`}>{nhan.label}</span>
          {trangThai === STATUS.TU_CHOI && tin.reject_reason && (
            <p className="t-small fdt-ly-do">
              <AlertCircle size={14} strokeWidth={1.8} />
              Lý do bị từ chối: {tin.reject_reason}
            </p>
          )}
          {khoaSua && (
            <p className="t-small">
              Tin đang chờ kiểm duyệt nên tạm khoá sửa. Duyệt xong là sửa lại được.
            </p>
          )}
        </div>
      )}

      {/* ─── Chọn gói trường ─── */}
      <div className="card card-pad stack">
        <div>
          <h2 className="t-h3">Khai báo bao nhiêu thông tin?</h2>
          <p className="t-small">Hai lựa chọn dưới đây <strong>cùng một giá</strong>. Khác nhau ở số trường phải điền, không phải ở tiền.</p>
        </div>

        <div className="fdt-goi" role="radiogroup" aria-label="Mức khai thông tin">
          {[GOI.CO_BAN, GOI.DAY_DU].map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={goi === g}
              className={`fdt-goi-o${goi === g ? ' fdt-goi-chon' : ''}`}
              onClick={() => doiGoi(g)}
              disabled={khoaSua}
            >
              <strong>{GOI_LABEL[g]}</strong>
              <span className="t-small">{GOI_MO_TA[g]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Các nhóm trường ─── */}
      {nhom.map((n) => (
        <section key={n.key} className="card card-pad stack">
          <div>
            <h2 className="t-h3">{n.title}</h2>
            {n.desc && <p className="t-small">{n.desc}</p>}
          </div>

          <div className="fdt-luoi">
            {n.fields.map((t) => (
              <TruongNhap
                key={t.name}
                truong={{ ...t, disabled: t.disabled || khoaSua }}
                giaTri={form[t.name]}
                loi={loiTruong[t.name]}
                onChange={doiTruong}
              />
            ))}
          </div>

          {/* Tiện nghi đi kèm nhóm kỹ thuật, chỉ ở gói Đầy Đủ. */}
          {n.key === 'ky_thuat' && (
            <div className="stack">
              <span className="field-label">Tiện nghi trên xe</span>
              <div className="fdt-tien-nghi">
                {AMENITIES.map((a) => {
                  const chon = form.amenity_codes?.includes(a.code)
                  return (
                    <button
                      key={a.code}
                      type="button"
                      className={`fdt-chip${chon ? ' fdt-chip-chon' : ''}`}
                      aria-pressed={chon}
                      onClick={() => doiTienNghi(a.code)}
                      disabled={khoaSua}
                    >
                      {a.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      ))}

      {/* ─── Ảnh ─── */}
      <section className="card card-pad stack">
        <div>
          <h2 className="t-h3">Ảnh xe</h2>
          <p className="t-small">
            Ảnh được thu nhỏ ngay trên máy anh trước khi gửi đi, nên đăng bằng 4G cũng nhanh.
            Ảnh đầu tiên là ảnh khách nhìn thấy trong danh sách.
          </p>
        </div>
        <UploadAnh danhSach={anh} onChange={doiAnh} />
      </section>

      {/* ─── Lịch chặn ngày: chỉ ở gói Đầy Đủ ─── */}
      {goi === GOI.DAY_DU && (
        <section className="card card-pad stack">
          <div>
            <h2 className="t-h3">Lịch xe bận</h2>
            <p className="t-small">
              Đánh dấu ngày xe đã có người thuê hoặc đi bảo dưỡng. Khách xem trang xe sẽ thấy
              ngay, đỡ gọi vào lúc anh không có xe.
            </p>
          </div>
          <LichChanNgay khoang={ngayChan} onChange={setNgayChan} />
        </section>
      )}

      {/* ─── Giá hiển thị tin: nói thẳng trước khi bấm gửi ─── */}
      <div className="card card-pad fdt-gia">
        <Info size={18} strokeWidth={1.8} />
        <div>
          <strong>Hiển thị tin tốn {TOKENS_PER_MONTH} token cho 1 tháng</strong>
          <p className="t-small">
            Tương đương {formatVnd(vndForMonths(1))}. Token chỉ bị trừ sau khi tin được duyệt và
            anh xác nhận đăng — gửi duyệt chưa mất gì. Tin luôn có hạn, hết hạn thì gia hạn tiếp.
          </p>
        </div>
      </div>

      {loiChung && (
        <p className="field-error fdt-loi-chung">
          <AlertCircle size={15} strokeWidth={1.8} />
          {loiChung}
        </p>
      )}

      {/* ─── Nút ─── */}
      <div className="fdt-thanh-nut">
        <button type="button" className="btn btn-ghost" onClick={nhanLuuNhap} disabled={dangChay || khoaSua}>
          {dangLuu === 'nhap'
            ? <Loader2 size={17} strokeWidth={1.8} className="fdt-quay" />
            : <Save size={17} strokeWidth={1.8} />}
          Lưu nháp
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={nhanGuiDuyet}
          disabled={dangChay || khoaSua || (tin != null && !guiDuyetDuoc)}
        >
          {dangLuu === 'duyet'
            ? <Loader2 size={17} strokeWidth={1.8} className="fdt-quay" />
            : <Send size={17} strokeWidth={1.8} />}
          Gửi duyệt
        </button>

        {tienDoAnh && (
          <span className="t-small fdt-tien-do">
            Đang tải ảnh {tienDoAnh.xong}/{tienDoAnh.tong}…
          </span>
        )}

        {tin != null && !guiDuyetDuoc && !khoaSua && (
          <span className="t-small">
            <CheckCircle2 size={14} strokeWidth={1.8} />
            Tin này đã qua duyệt rồi, sửa xong bấm Lưu nháp là được.
          </span>
        )}
      </div>

      <p className="disclaimer">
        Thuexenhanh chỉ đăng tin và kết nối. Giao dịch, tiền cọc và mọi thoả thuận là giữa anh và
        khách thuê — app không đứng giữa, không giữ tiền, không ăn hoa hồng.
      </p>
    </form>
  )
}
