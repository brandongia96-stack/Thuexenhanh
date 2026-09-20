// owner/ChiSo — ô số liệu.
//
// Luật graceful degradation (CLAUDE.md 1.3): `giaTri == null` nghĩa là CHƯA BIẾT
// → ẩn hẳn ô, không render ô trống. Số 0 thì vẫn hiện, vì 0 là một con số thật.

export default function ChiSo({ icon: Icon, nhan, giaTri, phu, tone = 'neutral' }) {
  if (giaTri == null) return null
  return (
    <div className={`chi-so chi-so-${tone}`}>
      <div className="chi-so-nhan">
        {Icon && <Icon size={15} strokeWidth={1.8} />}
        {nhan}
      </div>
      <div className="chi-so-gia-tri">{giaTri}</div>
      {phu && <div className="t-small">{phu}</div>}
    </div>
  )
}

/** Một dòng số liệu nằm ngang, dùng trong thẻ xe cho gọn. */
export function DongSo({ nhan, giaTri, tone = 'neutral' }) {
  if (giaTri == null) return null
  return (
    <div className="dong-so">
      <span className="t-small">{nhan}</span>
      <strong className={`dong-so-gt dong-so-${tone}`}>{giaTri}</strong>
    </div>
  )
}
