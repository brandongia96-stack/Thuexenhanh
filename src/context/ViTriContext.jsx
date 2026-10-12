// context/ViTriContext — quản lý trạng thái vị trí người dùng, xin quyền và tính khoảng cách xe.

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { tinhKhoangCachToiXe } from '../lib/toadoDiaGioi'

const KHOA_BAT = 'txn_vi_tri_bat'
const KHOA_TOA_DO = 'txn_vi_tri_toado'
const KHOA_DA_HOI = 'txn_vi_tri_da_hoi'

const ViTriContext = createContext(null)

export function ViTriProvider({ children }) {
  // Trạng thái bật/tắt vị trí trong cài đặt
  const [batViTri, setBatViTriState] = useState(() => {
    const v = localStorage.getItem(KHOA_BAT)
    return v === 'true'
  })

  // Đã từng hỏi vị trí chưa (để không hiện banner làm phiền nếu user bấm Để sau)
  const [daHoiViTri, setDaHoiViTriState] = useState(() => {
    return localStorage.getItem(KHOA_DA_HOI) === 'true'
  })

  // Toạ độ hiện tại { lat, lng, time }
  const [viTri, setViTriState] = useState(() => {
    try {
      const luu = localStorage.getItem(KHOA_TOA_DO)
      return luu ? JSON.parse(luu) : null
    } catch {
      return null
    }
  })

  const [dangLay, setDangLay] = useState(false)
  const [loiViTri, setLoiViTri] = useState(null)

  // Lưu toạ độ
  const capNhatToaDo = useCallback((toado) => {
    setViTriState(toado)
    if (toado) {
      try {
        localStorage.setItem(KHOA_TOA_DO, JSON.stringify(toado))
      } catch {}
    } else {
      localStorage.removeItem(KHOA_TOA_DO)
    }
  }, [])

  // Xin quyền vị trí từ trình duyệt
  const xinQuyenViTri = useCallback((onSuccess, onError) => {
    if (!navigator.geolocation) {
      const err = 'Trình duyệt không hỗ trợ định vị GPS.'
      setLoiViTri(err)
      onError?.(err)
      return
    }

    setDangLay(true)
    setLoiViTri(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const toado = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          time: Date.now(),
        }
        capNhatToaDo(toado)
        setBatViTriState(true)
        setDaHoiViTriState(true)
        localStorage.setItem(KHOA_BAT, 'true')
        localStorage.setItem(KHOA_DA_HOI, 'true')
        setDangLay(false)
        onSuccess?.(toado)
      },
      (err) => {
        let thongBao = 'Không thể lấy vị trí hiện tại.'
        if (err.code === 1) { // PERMISSION_DENIED
          thongBao = 'Bạn đã từ chối quyền truy cập vị trí trên trình duyệt.'
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          thongBao = 'Vị trí hiện không khả dụng.'
        } else if (err.code === 3) { // TIMEOUT
          thongBao = 'Hết thời gian chờ định vị.'
        }
        setLoiViTri(thongBao)
        setDangLay(false)
        setDaHoiViTriState(true)
        localStorage.setItem(KHOA_DA_HOI, 'true')
        onError?.(thongBao)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }, [capNhatToaDo])

  // Đổi trạng thái bật/tắt vị trí trong cài đặt
  const doiBatViTri = useCallback((bat) => {
    if (bat) {
      xinQuyenViTri()
    } else {
      setBatViTriState(false)
      capNhatToaDo(null)
      localStorage.setItem(KHOA_BAT, 'false')
    }
  }, [xinQuyenViTri, capNhatToaDo])

  // Bỏ qua hỏi vị trí (bấm "Để sau" trên banner)
  const boQuaHoiViTri = useCallback(() => {
    setDaHoiViTriState(true)
    localStorage.setItem(KHOA_DA_HOI, 'true')
  }, [])

  // Nếu người dùng đã từng bật vị trí, tự động làm mới toạ độ ngầm khi vào app
  useEffect(() => {
    if (batViTri && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          capNhatToaDo({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            time: Date.now(),
          })
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      )
    }
  }, [batViTri, capNhatToaDo])

  // Hàm tính khoảng cách từ vị trí người dùng tới một xe
  const tinhKhoangCach = useCallback((the) => {
    if (!batViTri || !viTri) return null
    return tinhKhoangCachToiXe(viTri, the)
  }, [batViTri, viTri])

  const value = useMemo(() => ({
    batViTri,
    viTri,
    dangLay,
    loiViTri,
    daHoiViTri,
    xinQuyenViTri,
    doiBatViTri,
    boQuaHoiViTri,
    tinhKhoangCach,
  }), [batViTri, viTri, dangLay, loiViTri, daHoiViTri, xinQuyenViTri, doiBatViTri, boQuaHoiViTri, tinhKhoangCach])

  return (
    <ViTriContext.Provider value={value}>
      {children}
    </ViTriContext.Provider>
  )
}

export function useViTri() {
  const ctx = useContext(ViTriContext)
  if (!ctx) {
    // Giá trị an toàn dự phòng nếu nằm ngoài Provider
    return {
      batViTri: false,
      viTri: null,
      dangLay: false,
      loiViTri: null,
      daHoiViTri: true,
      xinQuyenViTri: () => {},
      doiBatViTri: () => {},
      boQuaHoiViTri: () => {},
      tinhKhoangCach: () => null,
    }
  }
  return ctx
}
