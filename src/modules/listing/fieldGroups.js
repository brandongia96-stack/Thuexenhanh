// listing/fieldGroups — hai gói trường của form đăng tin.
//
// Khác v0.1 ở chỗ quan trọng: "Cơ Bản" và "Đầy Đủ" KHÔNG phải hai mức giá.
// Cả hai đều 10 token/xe/tháng. Gói Đầy Đủ chỉ là nhiều trường hơn, cho chủ xe
// nào muốn khai kỹ. Tích xanh xét theo giấy tờ, miễn phí (luồng 08) — không bán.
//
// Mô tả trường bằng DỮ LIỆU chứ không phải JSX: form render từ mảng này, nên
// thêm bớt trường không phải đụng vào giao diện.

import { BRANDS, modelsOf } from '../../data/brands'
import { PROVINCES, districtsOf } from '../../data/provinces'
import { TRANSMISSIONS, FUELS, SEAT_OPTIONS, COLORS, BODY_STYLES, YEARS } from '../../data/options'

export const GOI = {
  CO_BAN: 'co_ban',
  DAY_DU: 'day_du',
}

export const GOI_LABEL = {
  co_ban: 'Cơ bản',
  day_du: 'Đầy đủ',
}

// Mô tả gói cho người dùng. Nói thẳng là không khác giá — đừng để chủ xe
// tưởng mình đang bị bán thêm thứ gì.
export const GOI_MO_TA = {
  co_ban: 'Chỉ những thông tin tối thiểu để tin lên được. Điền nhanh, xong trong vài phút.',
  day_du: 'Khai thêm kỹ thuật, giấy tờ, giới hạn km và lịch bận. Cùng giá, chỉ nhiều thông tin hơn để khách đỡ phải gọi hỏi.',
}

const chon = (arr) => arr.map((v) => ({ value: v, label: String(v) }))

/**
 * Trả về danh sách nhóm trường theo gói.
 * @param {object} form  giá trị hiện tại — cần để đổ dòng xe theo hãng, quận theo tỉnh
 * @param {'co_ban'|'day_du'} goi
 */
export function nhomTruong(form, goi = GOI.DAY_DU) {
  const quanHuyen = districtsOf(form.province)

  const coBan = [
    {
      key: 'xe',
      title: 'Chiếc xe',
      desc: 'Khách lọc và tìm xe theo những thông tin này, nên điền đúng như giấy tờ xe.',
      fields: [
        { name: 'brand_text', label: 'Hãng xe', type: 'select', required: true, options: chon(BRANDS) },
        { name: 'model_text', label: 'Dòng xe', type: 'select', required: true, options: chon(modelsOf(form.brand_text)), disabled: !form.brand_text, hint: form.brand_text ? null : 'Chọn hãng xe trước' },
        { name: 'year', label: 'Năm sản xuất', type: 'select', required: true, options: chon(YEARS) },
        { name: 'seats', label: 'Số chỗ', type: 'select', required: true, options: SEAT_OPTIONS.map((s) => ({ value: s, label: `${s} chỗ` })) },
        // Hộp số nằm ở gói Cơ Bản vì là một bộ lọc chính của trang tìm kiếm
        // (luồng 04), và lib/validate.js coi là bắt buộc cho mọi tin.
        { name: 'transmission', label: 'Hộp số', type: 'select', required: true, options: TRANSMISSIONS },
        { name: 'plate', label: 'Biển số xe', type: 'text', placeholder: '51A-123.45', hint: 'Bắt buộc khi gửi duyệt. Dùng để đối chiếu giấy tờ và chống đăng trùng một xe.' },
      ],
    },
    {
      key: 'gia',
      title: 'Giá thuê',
      desc: 'Ghi đúng giá thật. Khách gọi mà nghe báo giá khác là một lý do để khách báo cáo tin.',
      fields: [
        { name: 'price_per_day', label: 'Giá theo ngày', type: 'money', required: true, suffix: 'đ / ngày' },
        { name: 'deposit_note', label: 'Tiền cọc', type: 'text', placeholder: 'VD: 15 triệu hoặc xe máy + giấy tờ', hint: 'Ghi bằng lời cũng được. App không giữ tiền cọc, hai bên tự thoả thuận.' },
      ],
    },
    {
      key: 'noi_nhan',
      title: 'Nơi nhận xe',
      fields: [
        { name: 'province', label: 'Tỉnh / Thành phố', type: 'select', required: true, options: chon(PROVINCES) },
        ...(quanHuyen.length
          ? [{ name: 'district', label: 'Quận / Huyện', type: 'select', options: chon(quanHuyen) }]
          : []),
        { name: 'address_text', label: 'Địa chỉ giao xe', type: 'text', placeholder: 'VD: gần sân bay Tân Sơn Nhất' },
      ],
    },
    {
      key: 'lien_he',
      title: 'Liên hệ',
      desc: 'Khách bấm "Xem số điện thoại" rồi gọi thẳng cho anh. App không nhận đặt xe, không ăn hoa hồng.',
      fields: [
        { name: 'contact_phone', label: 'Số điện thoại', type: 'tel', required: true, placeholder: '0901234567' },
      ],
    },
  ]

  if (goi === GOI.CO_BAN) return coBan

  // ─── Gói Đầy Đủ: chèn thêm trường vào đúng nhóm, không dựng mảng thứ hai
  //     (v0.1 chép lại toàn bộ hai lần — sửa một chỗ quên chỗ kia). ───
  const them = {
    xe: [
      { name: 'color', label: 'Màu xe', type: 'select', options: chon(COLORS) },
      { name: 'body_style', label: 'Kiểu xe', type: 'select', options: chon(BODY_STYLES) },
    ],
    gia: [
      { name: 'price_per_month', label: 'Giá theo tháng', type: 'money', suffix: 'đ / tháng', hint: 'Bỏ trống nếu không cho thuê tháng.' },
      { name: 'limit_km_per_day', label: 'Giới hạn km mỗi ngày', type: 'number', suffix: 'km' },
      { name: 'extra_km_fee', label: 'Phí vượt km', type: 'money', suffix: 'đ / km' },
      { name: 'delivery_fee_note', label: 'Phí giao xe', type: 'text', placeholder: 'VD: miễn phí trong 10km, ngoài ra 15k/km' },
    ],
    lien_he: [
      { name: 'contact_zalo', label: 'Số Zalo', type: 'tel', hint: 'Bỏ trống nếu dùng chung số điện thoại ở trên.' },
    ],
  }

  const kyThuat = {
    key: 'ky_thuat',
    title: 'Thông số kỹ thuật',
    desc: 'Khai thêm thì khách đỡ phải gọi hỏi. Bỏ trống thì khối này tự ẩn ở trang xe.',
    fields: [
      { name: 'fuel', label: 'Nhiên liệu', type: 'select', options: FUELS },
      {
        name: 'fuel_consumption',
        label: form.fuel === 'dien' ? 'Quãng đường mỗi 1% pin' : 'Mức tiêu hao nhiên liệu',
        type: 'number',
        step: '0.1',
        suffix: form.fuel === 'dien' ? 'km / 1%' : 'lít / 100km',
      },
    ],
  }

  const moTa = {
    key: 'mo_ta',
    title: 'Mô tả & giấy tờ',
    fields: [
      { name: 'description', label: 'Mô tả xe', type: 'textarea', maxLength: 2000, placeholder: 'Tình trạng xe, giấy tờ khách cần mang, điều kiện thuê…' },
    ],
  }

  const boSung = (nhom) => ({ ...nhom, fields: [...nhom.fields, ...(them[nhom.key] ?? [])] })

  return [
    boSung(coBan[0]),
    kyThuat,
    boSung(coBan[1]),
    boSung(coBan[2]),
    moTa,
    boSung(coBan[3]),
  ]
}

// Tất cả tên trường thuộc một gói — dùng để lọc dữ liệu trước khi lưu,
// tránh gửi lên cột mà gói đó không khai.
export function tenTruongCuaGoi(form, goi) {
  return nhomTruong(form, goi).flatMap((n) => n.fields.map((f) => f.name))
}
