// listing/media/UploadAnh — chọn ảnh, nén ở client, sắp xếp, chọn ảnh bìa.
//
// Mỗi ảnh chủ xe chọn được sinh ngay bốn bản (xem imagePipeline.js) TRƯỚC KHI
// tải lên. Chủ xe cũng dùng 4G — nén ở máy họ tiết kiệm băng thông của họ.
//
// Sắp xếp bằng nút mũi tên chứ không kéo thả: kéo thả trên điện thoại vừa khó
// trúng vừa phải thêm thư viện, mà việc cần làm chỉ là đổi chỗ hai ảnh.

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, Upload } from 'lucide-react'
import { xuLyNhieuAnh, SO_ANH_TOI_DA, LOAI_CHAP_NHAN } from './imagePipeline'
import { nguonAnh } from './storage'
import './UploadAnh.css'

// Ảnh xe ngang 4:3 — cố định tỉ lệ để lưới không nhảy khi ảnh tải xong (CLS).
const TI_LE = '4 / 3'

function hienDungLuong(byte) {
  if (byte == null) return null
  return byte >= 1024 * 1024
    ? (byte / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB'
    : Math.round(byte / 1024) + ' KB'
}

/**
 * @param {Array} danhSach  mảng ảnh hợp nhất, mỗi phần tử là
 *   { loai:'cu', hang }   — ảnh đã lưu trong `listing_images`
 *   { loai:'moi', anh }   — ảnh vừa xử lý, chưa tải lên
 * @param {(ds:Array) => void} onChange
 */
export default function UploadAnh({ danhSach = [], onChange, toiDa = SO_ANH_TOI_DA }) {
  const inputRef = useRef(null)
  const [dangXuLy, setDangXuLy] = useState(null) // { xong, tong }
  const [loi, setLoi] = useState([])

  // Ảnh bìa là ảnh đầu tiên. Một quy tắc, không hai nguồn sự thật.
  const chiSoBia = 0

  // Thu hồi object URL khi rời trang, nếu không là rò bộ nhớ.
  useEffect(() => {
    return () => {
      danhSach.forEach((m) => m.loai === 'moi' && m.anh.thuHoi?.())
    }
    // Cố ý chạy một lần lúc unmount: thu hồi giữa chừng sẽ xoá ảnh đang xem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nhanFile = useCallback(async (files) => {
    setLoi([])
    const conCho = toiDa - danhSach.length
    if (conCho <= 0) {
      setLoi([{ message: `Tối đa ${toiDa} ảnh mỗi tin` }])
      return
    }

    const chon = Array.from(files).slice(0, conCho)
    const bo = Array.from(files).length - chon.length

    setDangXuLy({ xong: 0, tong: chon.length })
    const { anh, loi: loiXuLy } = await xuLyNhieuAnh(chon, (xong, tong) => setDangXuLy({ xong, tong }))
    setDangXuLy(null)

    if (anh.length) onChange([...danhSach, ...anh.map((a) => ({ loai: 'moi', anh: a }))])

    const tatCaLoi = [...loiXuLy]
    if (bo > 0) tatCaLoi.push({ message: `Bỏ qua ${bo} ảnh vì vượt quá ${toiDa} ảnh` })
    setLoi(tatCaLoi)

    if (inputRef.current) inputRef.current.value = ''
  }, [danhSach, onChange, toiDa])

  function doiCho(i, j) {
    if (j < 0 || j >= danhSach.length) return
    const ds = [...danhSach]
    ;[ds[i], ds[j]] = [ds[j], ds[i]]
    onChange(ds)
  }

  function datLamBia(i) {
    if (i === 0) return
    const ds = [...danhSach]
    const [m] = ds.splice(i, 1)
    onChange([m, ...ds])
  }

  function xoa(i) {
    const m = danhSach[i]
    if (m.loai === 'moi') m.anh.thuHoi?.()
    onChange(danhSach.filter((_, k) => k !== i))
  }

  const conCho = toiDa - danhSach.length

  return (
    <div className="ua">
      <div
        className="ua-tha"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); nhanFile(e.dataTransfer.files) }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={LOAI_CHAP_NHAN.join(',')}
          multiple
          hidden
          onChange={(e) => nhanFile(e.target.files)}
        />

        {dangXuLy ? (
          <>
            <Loader2 size={26} strokeWidth={1.8} className="ua-quay" />
            <strong>Đang tối ưu ảnh {dangXuLy.xong}/{dangXuLy.tong}…</strong>
            <span className="t-small">Ảnh được thu nhỏ ngay trên máy anh để đỡ tốn 4G</span>
          </>
        ) : (
          <>
            <Upload size={26} strokeWidth={1.8} />
            <strong>Kéo thả hoặc bấm để chọn ảnh</strong>
            <span className="t-small">
              JPG, PNG, WebP · còn {conCho > 0 ? conCho : 0} chỗ · ảnh đầu tiên là ảnh bìa
            </span>
          </>
        )}
      </div>

      {loi.length > 0 && (
        <ul className="ua-loi">
          {loi.map((l, i) => (
            <li key={i} className="field-error">{l.ten ? `${l.ten}: ` : ''}{l.message}</li>
          ))}
        </ul>
      )}

      {danhSach.length > 0 ? (
        <ul className="ua-luoi">
          {danhSach.map((m, i) => {
            const nguon = m.loai === 'moi'
              ? { url: m.anh.xemTruoc, blur: m.anh.blur, width: m.anh.rong, height: m.anh.cao }
              : nguonAnh(m.hang, 'thumb')

            return (
              <li key={m.loai === 'moi' ? m.anh.id : m.hang.id} className="ua-o">
                <div
                  className="ua-khung"
                  style={{
                    aspectRatio: TI_LE,
                    // Bản mờ base64 làm nền: ô có hình ngay, không phải ô xám.
                    backgroundImage: nguon?.blur ? `url(${nguon.blur})` : undefined,
                  }}
                >
                  {nguon?.url && (
                    <img
                      src={nguon.url}
                      alt={`Ảnh xe ${i + 1}`}
                      width={nguon.width ?? 400}
                      height={nguon.height ?? 300}
                      loading={i < 3 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  )}

                  {i === chiSoBia && (
                    <span className="ua-nhan-bia">
                      <Star size={12} strokeWidth={2} fill="currentColor" />
                      Ảnh bìa
                    </span>
                  )}

                  {m.loai === 'moi' && (
                    <span className="ua-nhan-moi">
                      {hienDungLuong(m.anh.dungLuong.goc)} → {hienDungLuong(m.anh.dungLuong.thumb)}
                    </span>
                  )}
                </div>

                <div className="ua-nut">
                  <button type="button" onClick={() => doiCho(i, i - 1)} disabled={i === 0} aria-label="Chuyển lên trước">
                    <ArrowLeft size={15} strokeWidth={2} />
                  </button>
                  <button type="button" onClick={() => doiCho(i, i + 1)} disabled={i === danhSach.length - 1} aria-label="Chuyển ra sau">
                    <ArrowRight size={15} strokeWidth={2} />
                  </button>
                  <button type="button" onClick={() => datLamBia(i)} disabled={i === chiSoBia} aria-label="Đặt làm ảnh bìa">
                    <Star size={15} strokeWidth={2} />
                  </button>
                  <button type="button" className="ua-xoa" onClick={() => xoa(i)} aria-label="Xoá ảnh">
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        !dangXuLy && (
          <div className="empty">
            <ImagePlus size={22} strokeWidth={1.8} />
            <span className="empty-title">Chưa có ảnh nào</span>
            <span className="t-small">Thêm ảnh thật của xe để khách biết chiếc xe trông thế nào.</span>
          </div>
        )
      )}
    </div>
  )
}
