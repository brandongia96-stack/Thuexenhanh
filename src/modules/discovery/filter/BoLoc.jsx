import { PROVINCES, districtsOf } from '../../../data/provinces'
import { BRANDS } from '../../../data/brands'
import { AMENITIES } from '../../../data/amenities'
import { SEAT_OPTIONS, TRANSMISSIONS, FUELS } from '../../../data/options'
import { KHOANG_GIA } from './loc'
import './BoLoc.css'

const chonGia = (loc) => {
  if (loc.giaMin == null && loc.giaMax == null) return ''
  const i = KHOANG_GIA.findIndex((k) => k.min === loc.giaMin && k.max === loc.giaMax)
  // Giá đoán từ câu chữ ("dưới 800k") không trùng khoảng nào → "Tuỳ chỉnh".
  return i >= 0 ? String(i) : 'tuy'
}

const bat = (mang, v) => (mang.includes(v) ? mang.filter((x) => x !== v) : [...mang, v])

/** Một nhóm nút bật/tắt. `on(v)` cho biết nút nào đang sáng, `bam(v)` xử lý bấm. */
function NhomChon({ tieuDe, muc, on, bam }) {
  return (
    <section className="boloc-nhom">
      <h3 className="boloc-tieude">{tieuDe}</h3>
      <div className="boloc-chon">
        {muc.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={'chon' + (on(value) ? ' on' : '')}
            aria-pressed={on(value)}
            onClick={() => bam(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}

const MUC_CHO = SEAT_OPTIONS.map((n) => ({ value: n, label: `${n} chỗ` }))
const MUC_TIEN_NGHI = AMENITIES.map((a) => ({ value: a.code, label: a.name }))

/**
 * Bảng bộ lọc DÙNG CHUNG. Không giữ state riêng: nhận `loc`, trả `onDoi(locMoi)`.
 * Nơi dùng quyết định lưu ở đâu (trang tìm kiếm lưu vào URL).
 * Import thẳng file này, không qua `discovery/index.js`.
 *
 * @param {ReturnType<import('./loc').locRong>} loc
 * @param {(loc: object) => void} onDoi
 */
export default function BoLoc({ loc, onDoi }) {
  const dsQuan = districtsOf(loc.tinh)

  return (
    <div className="boloc">
      <section className="boloc-nhom">
        <h3 className="boloc-tieude">Địa điểm</h3>
        <select
          className="select"
          value={loc.tinh}
          aria-label="Tỉnh / thành phố"
          onChange={(e) => onDoi({ ...loc, tinh: e.target.value, quan: '' })}
        >
          <option value="">Tất cả tỉnh / thành</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {dsQuan.length > 0 && (
          <select
            className="select"
            value={loc.quan}
            aria-label="Quận / huyện"
            onChange={(e) => onDoi({ ...loc, quan: e.target.value })}
          >
            <option value="">Tất cả quận / huyện</option>
            {dsQuan.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        )}
      </section>

      <section className="boloc-nhom">
        <h3 className="boloc-tieude">Giá thuê / ngày</h3>
        <select
          className="select"
          value={chonGia(loc)}
          aria-label="Khoảng giá"
          onChange={(e) => {
            const v = e.target.value
            if (v === 'tuy') return
            const k = KHOANG_GIA[Number(v)]
            onDoi({ ...loc, giaMin: k?.min ?? null, giaMax: k?.max ?? null })
          }}
        >
          <option value="">Mọi mức giá</option>
          {KHOANG_GIA.map((k, i) => <option key={k.label} value={i}>{k.label}</option>)}
          {chonGia(loc) === 'tuy' && <option value="tuy">Tuỳ chỉnh</option>}
        </select>
      </section>

      <NhomChon
        tieuDe="Số chỗ" muc={MUC_CHO}
        on={(v) => loc.cho.includes(v)}
        bam={(v) => onDoi({ ...loc, cho: bat(loc.cho, v) })}
      />
      <NhomChon
        tieuDe="Hộp số" muc={TRANSMISSIONS}
        on={(v) => loc.so === v}
        bam={(v) => onDoi({ ...loc, so: loc.so === v ? '' : v })}
      />
      <NhomChon
        tieuDe="Nhiên liệu" muc={FUELS}
        on={(v) => loc.nl === v}
        bam={(v) => onDoi({ ...loc, nl: loc.nl === v ? '' : v })}
      />

      <section className="boloc-nhom">
        <h3 className="boloc-tieude">Hãng xe</h3>
        <select
          className="select"
          value={loc.hang}
          aria-label="Hãng xe"
          onChange={(e) => onDoi({ ...loc, hang: e.target.value })}
        >
          <option value="">Tất cả hãng</option>
          {BRANDS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </section>

      <NhomChon
        tieuDe="Tiện nghi" muc={MUC_TIEN_NGHI}
        on={(v) => loc.tn.includes(v)}
        bam={(v) => onDoi({ ...loc, tn: bat(loc.tn, v) })}
      />
    </div>
  )
}
