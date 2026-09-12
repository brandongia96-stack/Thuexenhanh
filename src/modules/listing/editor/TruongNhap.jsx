// listing/editor/TruongNhap — vẽ một ô nhập từ mô tả trường trong fieldGroups.js.
//
// Một chỗ duy nhất biết cách vẽ ô nhập → thêm trường mới chỉ là thêm một dòng
// vào fieldGroups.js, không phải sờ vào giao diện.

const nf = new Intl.NumberFormat('vi-VN')

// "1500000" → "1.500.000" để chủ xe khỏi đếm số 0.
function hienTien(v) {
  if (v === '' || v == null) return ''
  const n = Number(String(v).replace(/\D/g, ''))
  return Number.isFinite(n) && n !== 0 ? nf.format(n) : ''
}

export default function TruongNhap({ truong, giaTri, loi, onChange }) {
  const { name, label, type, required, options, hint, placeholder, suffix, disabled, maxLength, step } = truong
  const id = `f-${name}`
  const moTaId = loi ? `${id}-loi` : hint ? `${id}-hint` : undefined

  const chung = {
    id,
    'aria-invalid': loi ? 'true' : undefined,
    'aria-describedby': moTaId,
    disabled,
  }

  let o
  if (type === 'select') {
    o = (
      <select
        {...chung}
        className="select"
        value={giaTri ?? ''}
        onChange={(e) => onChange(name, e.target.value)}
      >
        <option value="">— Chọn —</option>
        {options?.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
    )
  } else if (type === 'textarea') {
    o = (
      <textarea
        {...chung}
        className="textarea"
        rows={5}
        maxLength={maxLength}
        placeholder={placeholder}
        value={giaTri ?? ''}
        onChange={(e) => onChange(name, e.target.value)}
      />
    )
  } else if (type === 'money') {
    o = (
      <input
        {...chung}
        className="input"
        // inputMode numeric để điện thoại bật bàn phím số, nhưng type text
        // để còn chèn được dấu chấm ngăn cách hàng nghìn.
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={hienTien(giaTri)}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '')
          onChange(name, raw === '' ? '' : Number(raw))
        }}
      />
    )
  } else if (type === 'number') {
    o = (
      <input
        {...chung}
        className="input"
        type="number"
        inputMode="decimal"
        step={step}
        placeholder={placeholder}
        value={giaTri ?? ''}
        onChange={(e) => onChange(name, e.target.value)}
      />
    )
  } else {
    o = (
      <input
        {...chung}
        className="input"
        type={type === 'tel' ? 'tel' : 'text'}
        inputMode={type === 'tel' ? 'tel' : undefined}
        autoComplete={type === 'tel' ? 'tel' : 'off'}
        maxLength={maxLength}
        placeholder={placeholder}
        value={giaTri ?? ''}
        onChange={(e) => onChange(name, e.target.value)}
      />
    )
  }

  return (
    <div className={`field${type === 'textarea' ? ' field-rong' : ''}`}>
      <label className="field-label" htmlFor={id}>
        {label}{required && <span className="field-sao"> *</span>}
      </label>

      {suffix ? (
        <div className="field-co-duoi">
          {o}
          <span className="field-duoi">{suffix}</span>
        </div>
      ) : o}

      {/* Thiếu dữ liệu thì ẩn cả dòng, không để chỗ trống chờ sẵn. */}
      {loi ? (
        <span className="field-error" id={`${id}-loi`}>{loi}</span>
      ) : hint ? (
        <span className="field-hint" id={`${id}-hint`}>{hint}</span>
      ) : null}
    </div>
  )
}
