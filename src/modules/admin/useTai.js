// Hook tải dữ liệu cho trang quản trị: { data, loi, dangTai, taiLai }.
// Trang admin ít người dùng, mạng tốt (HIEU-NANG.md mục 7) — giữ đơn giản.

import { useCallback, useEffect, useRef, useState } from 'react'

export function useTai(fn, deps = []) {
  const [state, setState] = useState({ data: null, loi: null, dangTai: true })
  const lanGoi = useRef(0)

  const tai = useCallback(() => {
    const lan = ++lanGoi.current
    setState((s) => ({ ...s, dangTai: true, loi: null }))
    Promise.resolve()
      .then(fn)
      .then((data) => lan === lanGoi.current && setState({ data, loi: null, dangTai: false }))
      .catch((e) => lan === lanGoi.current && setState({ data: null, loi: e, dangTai: false }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { tai() }, [tai])
  return { ...state, taiLai: tai }
}

// Thông báo lỗi tiếng Việt cho người dùng, không lộ chi tiết kỹ thuật.
export function thongDiepLoi(e) {
  return e?.message && e?.code ? e.message : 'Không thực hiện được. Kiểm tra mạng rồi thử lại.'
}
