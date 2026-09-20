// listing/editor/useFormDangTin — toàn bộ trạng thái của form đăng tin.
//
// Tách khỏi giao diện để phần "lưu thế nào, hợp lệ chưa" không lẫn vào JSX.
// Thứ tự lưu luôn là: tin → ảnh → lịch chặn. Tin phải có id trước thì ảnh mới
// biết đường dẫn Storage mà nằm vào.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { validateListing } from '../../../lib/validate'
import { GOI, tenTruongCuaGoi } from '../fieldGroups'
import { coTheSua, coTheGuiDuyet, STATUS } from '../lifecycle/vongDoi'
import {
  docTin, hangSangForm, taoNhap, capNhatTin, guiDuyet,
  luuAnhMoi, sapXepAnh, xoaAnh, luuNgayChan,
} from '../listingApi'

const FORM_RONG = {
  brand_text: '', model_text: '', year: '', plate: '', color: '', seats: '',
  transmission: '', fuel: '', fuel_consumption: '', body_style: '', description: '',
  price_per_day: '', price_per_month: '', deposit_note: '', delivery_fee_note: '',
  limit_km_per_day: '', extra_km_fee: '',
  province: '', district: '', address_text: '',
  amenity_codes: [],
  contact_phone: '', contact_zalo: '',
}

export function useFormDangTin({ listingId = null, ownerId, sdtMacDinh = '' }) {
  const [goi, setGoi] = useState(GOI.DAY_DU)
  const [form, setForm] = useState({ ...FORM_RONG, contact_phone: sdtMacDinh })
  const [anh, setAnh] = useState([])         // mảng hợp nhất cho UploadAnh
  const [ngayChan, setNgayChan] = useState([])
  const [anhDaXoa, setAnhDaXoa] = useState([])

  const [tin, setTin] = useState(null)       // hàng gốc, để biết status
  const [dangTai, setDangTai] = useState(Boolean(listingId))
  const [dangLuu, setDangLuu] = useState(null) // null | 'nhap' | 'duyet'
  const [tienDoAnh, setTienDoAnh] = useState(null)
  const [loiTruong, setLoiTruong] = useState({})
  const [loiChung, setLoiChung] = useState(null)

  // Id của tin đang làm việc. Tin mới chưa có id; ngay khi bản nháp được tạo thì
  // nhớ lại ở đây. Không nhớ thì lưu hỏng giữa chừng rồi bấm lại sẽ đẻ ra bản nháp
  // thứ hai — chủ xe thấy hai tin y hệt trong danh sách.
  const idRef = useRef(listingId)

  // Đổ một tin từ CSDL vào form. Dùng cho lần mở trang VÀ sau mỗi lần lưu: nạp
  // lại để ảnh vừa tải lên thành ảnh "cũ" có id thật, nếu không lưu lần hai sẽ
  // tải trùng ảnh.
  const napTin = useCallback(async (id, { chiTaiLaiAnh = false } = {}) => {
    const l = await docTin(id)
    if (!l) return null
    setTin(l)
    setAnh((l.listing_images ?? []).map((hang) => ({ loai: 'cu', hang })))
    setAnhDaXoa([])
    setNgayChan((l.listing_blocked_dates ?? []).map((d) => ({
      date_from: d.date_from, date_to: d.date_to, note: d.note ?? '',
    })))
    if (chiTaiLaiAnh) return l
    setForm(await hangSangForm(l))
    // Tin đã khai trường của gói Đầy Đủ thì mở sẵn gói đó, đừng bắt
    // chủ xe tự bấm lại rồi tưởng mất dữ liệu.
    const coTruongDayDu = l.fuel || l.limit_km_per_day || l.description || l.contact_zalo
    setGoi(coTruongDayDu ? GOI.DAY_DU : GOI.CO_BAN)
    return l
  }, [])

  // ─── Nạp tin có sẵn khi sửa ───
  useEffect(() => {
    if (!listingId) return
    let huy = false
    idRef.current = listingId

    ;(async () => {
      setDangTai(true)
      try {
        await napTin(listingId)
      } catch (e) {
        if (!huy) setLoiChung(e.message)
      } finally {
        if (!huy) setDangTai(false)
      }
    })()

    return () => { huy = true }
  }, [listingId, napTin])

  const doiTruong = useCallback((ten, giaTri) => {
    setForm((truoc) => {
      const sau = { ...truoc, [ten]: giaTri }
      // Đổi hãng thì dòng xe cũ không còn đúng nữa. Đổi tỉnh thì quận cũng vậy.
      if (ten === 'brand_text') sau.model_text = ''
      if (ten === 'province') sau.district = ''
      return sau
    })
    // Xoá lỗi của đúng ô vừa sửa — để nguyên là mắng người ta lần thứ hai.
    setLoiTruong((truoc) => (truoc[ten] ? { ...truoc, [ten]: undefined } : truoc))
  }, [])

  const doiTienNghi = useCallback((code) => {
    setForm((truoc) => {
      const dang = truoc.amenity_codes ?? []
      return {
        ...truoc,
        amenity_codes: dang.includes(code) ? dang.filter((c) => c !== code) : [...dang, code],
      }
    })
  }, [])

  // Đổi gói không được làm mất dữ liệu đã nhập — chỉ ẩn trường đi. Chủ xe bấm
  // nhầm rồi bấm lại là thấy nguyên vẹn.
  const doiGoi = useCallback((goiMoi) => setGoi(goiMoi), [])

  const doiAnh = useCallback((ds) => {
    // Ảnh cũ bị gỡ khỏi danh sách thì nhớ lại để lúc lưu còn xoá mềm dưới CSDL.
    // Tính NGOÀI updater của setState: StrictMode chạy updater hai lần, đặt
    // setAnhDaXoa trong đó là ghi trùng id.
    const conLai = new Set(ds.filter((m) => m.loai === 'cu').map((m) => m.hang.id))
    const biGo = anh.filter((m) => m.loai === 'cu' && !conLai.has(m.hang.id))
    if (biGo.length) setAnhDaXoa((x) => [...new Set([...x, ...biGo.map((m) => m.hang.id)])])
    setAnh(ds)
  }, [anh])

  const truongCuaGoi = useMemo(() => new Set(tenTruongCuaGoi(form, goi)), [form, goi])

  function kiemTra() {
    const { ok, fields } = validateListing(form)
    // Chỉ báo lỗi ở trường gói hiện tại đang hiện. Bắt lỗi một ô người ta
    // không nhìn thấy là bế tắc — bấm lưu mãi không được mà không biết vì sao.
    const loc = Object.fromEntries(
      Object.entries(fields).filter(([k]) => truongCuaGoi.has(k) || k === 'province_id'),
    )
    // validate.js đặt tên lỗi tỉnh/thành là `province_id`, form gọi là `province`.
    if (loc.province_id) {
      loc.province = loc.province_id
      delete loc.province_id
    }
    setLoiTruong(loc)
    setLoiChung(null)
    return ok || Object.keys(loc).length === 0
  }

  /** Lưu nội dung + ảnh + lịch chặn. Trả về id của tin. */
  async function luu() {
    let id = idRef.current
    if (id) {
      await capNhatTin(id, form, ownerId)
    } else {
      const moi = await taoNhap(form, ownerId)
      id = moi.id
      idRef.current = id
    }

    // Ảnh cũ bị gỡ
    for (const imgId of anhDaXoa) await xoaAnh(imgId)
    setAnhDaXoa([])

    // Ảnh mới: tải lên và chèn hàng trước, đặt thứ tự + ảnh bìa sau. Mảng `anh`
    // là nguồn sự thật của thứ tự; ảnh đầu mảng là ảnh bìa (một quy tắc duy nhất).
    const anhMoi = anh.filter((m) => m.loai === 'moi')
    let hangMoi = []
    if (anhMoi.length) {
      setTienDoAnh({ xong: 0, tong: anhMoi.length })
      hangMoi = await luuAnhMoi(id, ownerId, anhMoi.map((m) => m.anh), {
        batDauTu: anh.filter((m) => m.loai === 'cu').length,
        onTienDo: (xong, tong) => setTienDoAnh({ xong, tong }),
      })
      setTienDoAnh(null)
    }

    // Ghép id theo đúng thứ tự trên màn hình: ảnh cũ có sẵn id, ảnh mới lấy
    // lần lượt từ các hàng vừa chèn (PostgREST trả về đúng thứ tự chèn).
    let dem = 0
    const idTheoThuTu = anh.map((m) => (m.loai === 'cu' ? m.hang.id : hangMoi[dem++]?.id)).filter(Boolean)
    await sapXepAnh(id, idTheoThuTu)

    await luuNgayChan(id, ngayChan)
    return id
  }

  // Nạp lại sau khi lưu xong, chỉ khi đang ở trang sửa (tin mới thì trang sẽ
  // chuyển hướng và tự nạp). Lỗi nạp lại không được biến lần lưu thành thất bại.
  async function napLaiSauLuu(id) {
    if (!listingId) return
    try { await napTin(id, { chiTaiLaiAnh: true }) } catch { /* dữ liệu đã lưu, bỏ qua */ }
  }

  async function luuNhap() {
    if (!kiemTra()) return null
    setDangLuu('nhap')
    setLoiChung(null)
    try {
      const id = await luu()
      await napLaiSauLuu(id)
      return id
    } catch (e) {
      setLoiChung(e.message ?? 'Không lưu được, thử lại giúp em')
      return null
    } finally {
      setDangLuu(null)
      setTienDoAnh(null)
    }
  }

  /**
   * Lưu rồi gửi đi duyệt. Client KHÔNG tự đẩy sang `dang_hien_thi` —
   * việc đó là của Edge Function sau khi trừ token (luồng 06).
   */
  async function luuVaGuiDuyet() {
    if (!kiemTra()) return null
    setDangLuu('duyet')
    setLoiChung(null)
    try {
      const id = await luu()
      await guiDuyet(id)
      return id
    } catch (e) {
      setLoiChung(e.message ?? 'Không gửi duyệt được, thử lại giúp em')
      return null
    } finally {
      setDangLuu(null)
      setTienDoAnh(null)
    }
  }

  const trangThai = tin?.status ?? STATUS.NHAP

  return {
    goi, doiGoi,
    form, doiTruong, doiTienNghi,
    anh, doiAnh,
    ngayChan, setNgayChan,
    tin, trangThai,
    khoaSua: !coTheSua(trangThai),
    guiDuyetDuoc: coTheGuiDuyet(trangThai),
    dangTai, dangLuu, tienDoAnh,
    loiTruong, loiChung,
    luuNhap, luuVaGuiDuyet,
    // Sau khi trả phí ở HopTraPhi: đọc lại status/expires_at mà SERVER vừa ghi.
    taiLaiTin: () => (idRef.current ? napTin(idRef.current, { chiTaiLaiAnh: true }) : null),
  }
}
