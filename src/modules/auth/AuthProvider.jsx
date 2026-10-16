import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { getSupabase, trySupabase } from '../../lib/supabase'
import { HAS_BACKEND } from '../../lib/config'
import { ROLE } from './rbac'
import { guiEmailChaoMung } from '../notify/emailChaoMung'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(HAS_BACKEND)
  const huy = useRef(false)

  // Lấy hồ sơ + vai trò. Hàng users được tạo bằng trigger phía Supabase khi
  // auth.users có dòng mới; ở đây chỉ đọc, không tự vá dữ liệu thiếu.
  const loadProfile = useCallback(async (userId) => {
    const sb = await trySupabase()
    if (!sb || !userId) {
      setProfile(null)
      setRoles([])
      return
    }
    const [{ data: u }, { data: r }] = await Promise.all([
      sb.from('users').select('*').eq('id', userId).maybeSingle(),
      sb.from('user_roles').select('role').eq('user_id', userId).is('deleted_at', null),
    ])
    if (huy.current) return
    // "Đã xác thực SĐT" CHỈ lấy từ CSDL. Không đọc localStorage để tự gán
    // `phone_verified_at` — cái đó là xác thực giả, ai sửa localStorage cũng
    // thành "đã xác thực".
    setProfile(u ?? null)
    setRoles(r?.map((x) => x.role) ?? [])
  }, [])

  useEffect(() => {
    huy.current = false
    let unsub = null

    ;(async () => {
      const sb = await trySupabase()
      if (!sb) {
        setLoading(false)
        return
      }
      const { data } = await sb.auth.getSession()
      if (huy.current) return
      setSession(data.session ?? null)
      await loadProfile(data.session?.user?.id)
      if (huy.current) return
      setLoading(false)

      const { data: sub } = sb.auth.onAuthStateChange(async (_e, s) => {
        if (huy.current) return
        setSession(s ?? null)
        await loadProfile(s?.user?.id)
        if (s?.user) {
          guiEmailChaoMung(s.user).catch(() => {})
        }
      })
      unsub = () => sub?.subscription?.unsubscribe()
    })()

    return () => {
      huy.current = true
      unsub?.()
    }
  }, [loadProfile])

  const signInWithGoogle = useCallback(async () => {
    const sb = await getSupabase()
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }
      },
    })
    if (error) throw error
  }, [])

  // Chỗ cắm cho OTP SĐT. OTP thật làm ở luồng 08 — ở đây chỉ giữ chữ ký hàm
  // để luồng sau không phải đổi giao diện AuthProvider.
  const signInWithPhone = useCallback(async () => {
    throw new Error('Đăng nhập bằng số điện thoại chưa mở. Sẽ có ở luồng 08.')
  }, [])

  const signInWithEmail = useCallback(async (email, password) => {
    const sb = await getSupabase()
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const sb = await trySupabase()
    if (sb) await sb.auth.signOut()
    setSession(null)
    setProfile(null)
    setRoles([])
  }, [])

  // Sau khi verify-otp THẬT chạy xong, server đã ghi `phone_verified_at`; nơi gọi
  // luôn `await reload()` ngay sau đó để đọc lại sự thật từ CSDL. Ở đây chỉ cập
  // nhật SĐT hiển thị cho mượt — KHÔNG tự gán `phone_verified_at`, KHÔNG ghi
  // localStorage (xác thực chỉ lấy từ CSDL).
  const capNhatSoDienThoaiXacThuc = useCallback((phone) => {
    setProfile((prev) => (prev ? { ...prev, phone } : prev))
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    roles,
    loading,
    isLoggedIn: Boolean(session),
    isOwner: roles.includes(ROLE.CHU_XE),
    isAdmin: roles.includes(ROLE.ADMIN),
    signInWithGoogle,
    signInWithPhone,
    signInWithEmail,
    signOut,
    capNhatSoDienThoaiXacThuc,
    reload: () => loadProfile(session?.user?.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
