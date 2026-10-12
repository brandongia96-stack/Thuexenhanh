import { useState, useMemo } from 'react'
import {
  Phone, MapPin, Search, Copy, Check, Navigation,
  Clock, ShieldAlert, Sparkles, Filter, X
} from 'lucide-react'
import { DANH_BA_CUU_HO, LOAI_DICH_VU, DANH_SACH_VUNG } from '../../data/danhBaCuuHo'
import { useViTri } from '../../context/ViTriContext'
import { tinhKhoangCachKm, dinhDangKhoangCach } from '../../lib/toadoDiaGioi'
import './DanhBaCuuHoSection.css'

function boDau(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

export default function DanhBaCuuHoSection() {
  const { batViTri, viTri, dangLay, xinQuyenViTri } = useViTri()
  const [tuKhoa, setTuKhoa] = useState('')
  const [vungChon, setVungChon] = useState('tat-ca')
  const [dichVuChon, setDichVuChon] = useState('tat-ca')
  const [uuTienViTri, setUuTienViTri] = useState(true)
  const [daChepId, setDaChepId] = useState(null)

  // Xử lý sao chép SĐT
  function chepSdt(id, sdt) {
    try {
      navigator.clipboard.writeText(sdt)
      setDaChepId(id)
      setTimeout(() => setDaChepId(null), 2000)
    } catch {
      // fallback
    }
  }

  // Danh sách các tỉnh có trong danh bạ để làm dropdown
  const danhSachTinh = useMemo(() => {
    const setTinh = new Set()
    DANH_BA_CUU_HO.forEach((item) => {
      if (item.tinh && item.tinh !== 'Toàn quốc') {
        setTinh.add(item.tinh)
      }
    })
    return Array.from(setTinh).sort()
  }, [])

  // Tính khoảng cách và lọc danh sách
  const danhSachLoc = useMemo(() => {
    const qKd = boDau(tuKhoa.trim())

    let list = DANH_BA_CUU_HO.map((item) => {
      let km = null
      if (viTri?.lat && viTri?.lng && item.lat && item.lng) {
        km = tinhKhoangCachKm(viTri.lat, viTri.lng, item.lat, item.lng)
      }
      return { ...item, khoangCachKm: km }
    })

    // 1. Lọc theo từ khoá
    if (qKd) {
      list = list.filter((item) => {
        const textToanBo = boDau(
          `${item.ten} ${item.sdt} ${item.tinh} ${item.vung} ${item.dichVuText} ${item.ghiChu}`
        )
        return textToanBo.includes(qKd)
      })
    }

    // 2. Lọc theo vùng / tỉnh
    if (vungChon !== 'tat-ca') {
      list = list.filter((item) => {
        if (item.vung === vungChon || item.tinh === vungChon) return true
        if (item.tinh === 'Toàn quốc' && vungChon === 'Cao tốc') return item.dichVu.includes('CaoToc')
        return false
      })
    }

    // 3. Lọc theo loại dịch vụ
    if (dichVuChon !== 'tat-ca') {
      list = list.filter((item) => item.dichVu.includes(dichVuChon))
    }

    // 4. Sắp xếp: Ưu tiên khoảng cách gần nhất nếu có vị trí và bật ưu tiên vị trí
    if (uuTienViTri && viTri) {
      list.sort((a, b) => {
        // Đưa các số khẩn cấp toàn quốc lên trên nếu không có toạ độ
        if (a.uuTien && !b.uuTien) return -1
        if (!a.uuTien && b.uuTien) return 1
        if (a.khoangCachKm != null && b.khoangCachKm != null) {
          return a.khoangCachKm - b.khoangCachKm
        }
        if (a.khoangCachKm != null) return -1
        if (b.khoangCachKm != null) return 1
        return 0
      })
    }

    return list
  }, [tuKhoa, vungChon, dichVuChon, uuTienViTri, viTri])

  return (
    <section className="tv-section" id="danh-ba-cuu-ho">
      <div className="tv-section-header">
        <div>
          <h2 className="tv-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={22} color="var(--m-green)" />
            Danh bạ Cứu hộ Giao thông Toàn quốc 24/7
          </h2>
          <p className="t-small" style={{ color: 'var(--m-mid)', marginTop: 4 }}>
            Tổng hợp các đội cứu hộ giao thông uy tín, trực tuyến 24/7 trên các tuyến quốc lộ, cao tốc và 63 tỉnh thành.
          </p>
        </div>
      </div>

      {/* ─── Khung Công Cụ Lọc Thông Minh ─── */}
      <div className="dbch-congcu-card">
        {/* Hàng 1: Ô tìm kiếm từ khóa + Bộ lọc Tỉnh */}
        <div className="dbch-timkiem-row">
          <div className="dbch-tim-o">
            <Search size={18} className="dbch-tim-icon" />
            <input
              type="text"
              className="dbch-input-tim"
              placeholder="Tìm theo tên đơn vị, tỉnh thành, cao tốc, số điện thoại..."
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
            />
            {tuKhoa && (
              <button type="button" className="dbch-xoa-tim" onClick={() => setTuKhoa('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <select
            className="select dbch-select-vung"
            value={vungChon}
            onChange={(e) => setVungChon(e.target.value)}
            aria-label="Chọn khu vực hoặc tỉnh thành"
          >
            <option value="tat-ca">📍 Toàn quốc (Tất cả khu vực)</option>
            <optgroup label="Tuyến đường đặc biệt">
              <option value="Cao tốc">🛣️ Các tuyến Cao tốc</option>
            </optgroup>
            <optgroup label="Vùng miền">
              {DANH_SACH_VUNG.filter((v) => v.key !== 'tat-ca' && v.key !== 'CaoToc').map((v) => (
                <option key={v.key} value={v.key}>{v.label}</option>
              ))}
            </optgroup>
            <optgroup label="Tỉnh / Thành phố">
              {danhSachTinh.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Hàng 2: Bộ lọc Dịch vụ nhanh */}
        <div className="dbch-dichvu-chips">
          <span className="t-small" style={{ fontWeight: 600, color: 'var(--m-mid)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={14} /> Dịch vụ:
          </span>
          {LOAI_DICH_VU.map((dv) => (
            <button
              key={dv.key}
              type="button"
              className={`dbch-chip${dichVuChon === dv.key ? ' active' : ''}`}
              onClick={() => setDichVuChon(dv.key)}
            >
              {dv.label}
            </button>
          ))}
        </div>

        {/* Hàng 3: Trạng thái Vị trí & Tự động tìm gần nhất */}
        <div className="dbch-vitri-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Navigation size={16} color="var(--m-green)" />
            {viTri ? (
              <span className="t-small" style={{ color: 'var(--m-dark)' }}>
                Đang bật vị trí: <strong>Tự động đưa đội cứu hộ gần bạn nhất lên đầu</strong>
              </span>
            ) : (
              <span className="t-small" style={{ color: 'var(--m-subtle)' }}>
                Bật vị trí để tự động tính khoảng cách và tìm trạm cứu hộ gần bạn nhất trên bản đồ.
              </span>
            )}
          </div>

          {!viTri ? (
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={() => xinQuyenViTri()}
              disabled={dangLay}
            >
              <MapPin size={14} /> {dangLay ? 'Đang định vị...' : 'Bật vị trí của bạn'}
            </button>
          ) : (
            <label className="dbch-toggle-label">
              <input
                type="checkbox"
                checked={uuTienViTri}
                onChange={(e) => setUuTienViTri(e.target.checked)}
              />
              <span className="t-small">Ưu tiên gần nhất</span>
            </label>
          )}
        </div>
      </div>

      {/* ─── Số lượng kết quả ─── */}
      <div className="dbch-ketqua-dem">
        <span>Tìm thấy <strong>{danhSachLoc.length}</strong> đơn vị cứu hộ</span>
        {(tuKhoa || vungChon !== 'tat-ca' || dichVuChon !== 'tat-ca') && (
          <button
            type="button"
            className="dbch-xoa-het"
            onClick={() => {
              setTuKhoa('')
              setVungChon('tat-ca')
              setDichVuChon('tat-ca')
            }}
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* ─── Lưới Thẻ Cứu Hộ ─── */}
      {danhSachLoc.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: 'var(--sp-10)' }}>
          <ShieldAlert size={36} color="var(--m-subtle)" style={{ margin: '0 auto var(--sp-2)' }} />
          <h3 className="t-h3">Không tìm thấy đơn vị cứu hộ phù hợp</h3>
          <p className="t-small" style={{ marginTop: 4 }}>
            Thử tìm với từ khoá ngắn hơn hoặc chọn lại khu vực "Toàn quốc".
          </p>
        </div>
      ) : (
        <div className="dbch-grid">
          {danhSachLoc.map((item) => (
            <div key={item.id} className="dbch-card">
              <div>
                {/* Header thẻ */}
                <div className="dbch-card-header">
                  <div>
                    <span className="dbch-badge-vung">
                      <MapPin size={12} /> {item.tinh || item.vung}
                    </span>
                    {item.khoangCachKm != null && (
                      <span className="dbch-badge-km">
                        Cách ~{dinhDangKhoangCach(item.khoangCachKm)}
                      </span>
                    )}
                  </div>
                  {item.truc247 && (
                    <span className="dbch-badge-247">
                      <Clock size={12} /> 24/7
                    </span>
                  )}
                </div>

                {/* Tên đơn vị */}
                <h3 className="dbch-ten">{item.ten}</h3>

                {/* Mô tả dịch vụ */}
                <p className="dbch-dichvu-text">{item.dichVuText}</p>

                {item.ghiChu && (
                  <div className="dbch-ghichu">
                    📌 {item.ghiChu}
                  </div>
                )}
              </div>

              {/* Phần số điện thoại & Nút gọi */}
              <div className="dbch-card-bot">
                <div className="dbch-sdt-box">
                  <div className="dbch-sdt-label">Hotline cứu hộ:</div>
                  <div className="dbch-sdt-val">{item.sdtHienThi || item.sdt}</div>
                </div>

                <div className="dbch-nut-group">
                  <a
                    href={`tel:${item.sdt}`}
                    className="btn btn-primary btn-sm dbch-nut-goi"
                  >
                    <Phone size={15} /> Gọi ngay
                  </a>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => chepSdt(item.id, item.sdt)}
                    title="Sao chép số điện thoại"
                  >
                    {daChepId === item.id ? (
                      <Check size={15} color="var(--m-green)" />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
