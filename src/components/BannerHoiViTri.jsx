import { MapPin, X, Loader2 } from 'lucide-react'
import { useViTri } from '../context/ViTriContext'
import './BannerHoiViTri.css'

export default function BannerHoiViTri() {
  const { batViTri, viTri, daHoiViTri, dangLay, loiViTri, xinQuyenViTri, boQuaHoiViTri } = useViTri()

  // Không hiển thị nếu đã bật, đã có toạ độ hoặc người dùng đã bấm bỏ qua
  if (batViTri || viTri || daHoiViTri) {
    return null
  }

  return (
    <div className="banner-vitri" role="region" aria-label="Hỏi quyền truy cập vị trí">
      <div className="banner-vitri-noi-dung">
        <div className="banner-vitri-trai">
          <MapPin size={18} className="banner-vitri-icon" />
          <span>
            {loiViTri ? (
              <strong style={{ color: 'var(--m-red)' }}>{loiViTri}</strong>
            ) : (
              <>
                <strong>Bật vị trí</strong> để xem khoảng cách chính xác từ xe tới bạn (số km).
              </>
            )}
          </span>
        </div>

        <div className="banner-vitri-nut">
          {!loiViTri && (
            <button
              type="button"
              className="banner-vitri-btn-bat"
              onClick={() => xinQuyenViTri()}
              disabled={dangLay}
            >
              {dangLay ? (
                <>
                  <Loader2 size={14} className="fdt-quay" /> Đang định vị...
                </>
              ) : (
                'Bật vị trí'
              )}
            </button>
          )}
          <button
            type="button"
            className="banner-vitri-btn-boqua"
            onClick={boQuaHoiViTri}
            title="Để sau"
          >
            {loiViTri ? 'Đóng' : 'Để sau'}
          </button>
        </div>
      </div>
    </div>
  )
}
