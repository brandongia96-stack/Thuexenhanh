import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { daLuuChua, luuXe, boLuu } from './savedApi'
import { ghiLuuXe } from '../ghiSuKien'

/**
 * Nút tim "Lưu xe" — đổi màu NGAY, gọi API ngầm, lỗi thì hoàn lại
 * (HIEU-NANG.md mục 6: mọi nút phải phản hồi dưới 100ms).
 *
 * Khác v0.1: lần này ghi thật vào CSDL, tải lại trang vẫn còn.
 *
 * @returns {{
 *   daLuu: boolean, dangCho: boolean, canDangNhap: boolean,
 *   loi: string|null, batTat: () => void
 * }}
 */
export function useLuuXe(tin) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const listingId = tin?.id ?? null

  const [daLuu, setDaLuu] = useState(false)
  const [dangCho, setDangCho] = useState(false)
  const [loi, setLoi] = useState(null)
  const huy = useRef(false)

  useEffect(() => {
    huy.current = false
    if (!userId || !listingId) {
      setDaLuu(false)
      return () => {}
    }
    daLuuChua(userId, listingId)
      .then((v) => {
        if (!huy.current) setDaLuu(v)
      })
      .catch(() => {
        /* không đọc được thì coi như chưa lưu, đừng làm hỏng trang vì cái tim */
      })
    return () => {
      huy.current = true
    }
  }, [userId, listingId])

  const batTat = useCallback(async () => {
    if (!userId || !listingId || dangCho) return

    const truoc = daLuu
    setDaLuu(!truoc) // ① đổi màu trước, không bắt khách chờ mạng
    setLoi(null)
    setDangCho(true)

    try {
      if (truoc) await boLuu(userId, listingId)
      else {
        await luuXe(userId, listingId)
        ghiLuuXe(tin, userId)
      }
    } catch {
      if (!huy.current) {
        setDaLuu(truoc) // ② hỏng thì hoàn lại đúng trạng thái cũ
        setLoi('Chưa lưu được, mạng đang chập chờn. Thử lại giúp em.')
      }
    } finally {
      if (!huy.current) setDangCho(false)
    }
  }, [userId, listingId, daLuu, dangCho, tin])

  return { daLuu, dangCho, canDangNhap: !userId, loi, batTat }
}
