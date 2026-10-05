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
import {
  TRANSMISSIONS, FUELS, SEAT_OPTIONS, COLORS, BODY_STYLES, YEARS,
  CHARGE_POLICY, BATTERY_OWNERSHIP,
} from '../../data/options'

export const GOI = {
  CO_BAN: 'co_ban',
  DAY_DU: 'day_du',
}

export const GOI_LABEL = {
  co_ban: 'Cơ bản (10 Token)',
  day_du: 'Đầy đủ (20 Token - Cấp Tích Xanh)',
}

export const GOI_MO_TA = {
  co_ban: 'Chỉ những thông tin tối thiểu. Không yêu cầu tải giấy tờ.',
  day_du: 'Khai báo chi tiết. Quét giấy tờ xe tự động bằng AI (Giả lập OCR) và tự động nhận Tích Xanh uy tín.',
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
        // Gói Đầy Đủ có thêm ô "Tiền cọc" dạng số (them.gia) — khi đó trường
        // này chỉ còn là ghi chú, nên đổi nhãn để khỏi trùng tên hai ô.
        goi === GOI.DAY_DU
          ? { name: 'deposit_note', label: 'Ghi chú thêm về cọc', type: 'text', placeholder: 'VD: hoàn lại khi xe còn nguyên vẹn' }
          : { name: 'deposit_note', label: 'Tiền cọc', type: 'text', placeholder: 'VD: 15 triệu hoặc xe máy + giấy tờ', hint: 'Ghi bằng lời cũng được. App không giữ tiền cọc, hai bên tự thoả thuận.' },
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
      { name: 'price_per_hour', label: 'Giá theo giờ', type: 'money', suffix: 'đ / giờ', hint: 'Bỏ trống nếu không cho thuê theo giờ.' },
      { name: 'limit_km_per_day', label: 'Giới hạn km mỗi ngày', type: 'number', suffix: 'km' },
      { name: 'extra_km_fee', label: 'Phí vượt km', type: 'money', suffix: 'đ / km' },
      // Số để bảng tính (luồng 05) dùng được; ô ghi chú ở trên vẫn còn cho
      // những điều kiện chỉ nói bằng lời mới đủ (NGHIEN-CUU-XE-DIEN.md mục 3).
      { name: 'deposit_amount', label: 'Tiền cọc', type: 'money', suffix: 'đ', hint: 'App không giữ số tiền này — chỉ hiển thị cho khách biết trước khi gọi.' },
      // Thế chấp KHÁC cọc tiền: giữ xe máy, giữ giấy tờ thay vì tiền.
      { name: 'collateral_required', label: 'Yêu cầu thế chấp (xe máy / giấy tờ)', type: 'checkbox', hint: 'Khác tiền cọc — đây là giữ vật hoặc giấy tờ.' },
      ...(form.collateral_required
        ? [{ name: 'collateral_note', label: 'Thế chấp cụ thể gì', type: 'text', placeholder: 'VD: xe máy có cà vẹt, hoặc CCCD gốc' }]
        : []),
      { name: 'delivery_fee', label: 'Phí giao xe', type: 'money', suffix: 'đ / lần' },
      { name: 'delivery_radius_km', label: 'Bán kính giao miễn phí', type: 'number', suffix: 'km', hint: 'Ngoài bán kính này mới tính phí giao xe.' },
      { name: 'delivery_fee_note', label: 'Ghi chú thêm về giao xe', type: 'text', placeholder: 'VD: ngoài nội thành tính thêm theo km' },
    ],
    lien_he: [
      { name: 'contact_zalo', label: 'Số Zalo', type: 'tel', hint: 'Bỏ trống nếu dùng chung số điện thoại ở trên.' },
    ],
  }

  // ─── Khối Xe điện — CHỈ hiện khi đã chọn nhiên liệu Điện ───
  // Số liệu do CHỦ XE KHAI, không phải thông số hãng (CLAUDE.md 1.2) —
  // nói rõ điều đó ngay trong mô tả khối, đừng để khách tưởng là cam kết.
  const xeDien = form.fuel === 'dien' ? {
    key: 'xe_dien',
    title: 'Xe điện',
    desc: 'Thông tin do anh tự khai, không phải thông số hãng công bố. Khách thuê xem đây để biết trước chi phí sạc.',
    fields: [
      { name: 'ev_range_km', label: 'Quãng đường khi đầy pin', type: 'number', suffix: 'km' },
      { name: 'battery_kwh', label: 'Dung lượng pin', type: 'number', step: '0.1', suffix: 'kWh' },
      { name: 'battery_ownership', label: 'Pin', type: 'select', options: BATTERY_OWNERSHIP, hint: 'Pin thuê thường kèm giới hạn km của hãng — khách cần biết trước.' },
      { name: 'charge_policy', label: 'Chính sách sạc', type: 'select', options: CHARGE_POLICY },
      // Hai ô dưới chỉ có nghĩa với đúng một lựa chọn chính sách sạc tương ứng.
      ...(form.charge_policy === 'mien_phi_gioi_han'
        ? [{ name: 'free_charge_km', label: 'Miễn phí trong', type: 'number', suffix: 'km', hint: 'Đi quá quãng đường này khách tự trả tiền sạc phần vượt.' }]
        : []),
      ...(form.charge_policy === 'tinh_theo_phan_tram'
        ? [{ name: 'charge_fee_per_pct', label: 'Phí sạc', type: 'money', suffix: 'đ / 1% pin' }]
        : []),
      { name: 'pickup_min_pct', label: 'Giao xe còn tối thiểu', type: 'number', suffix: '% pin' },
      { name: 'return_min_pct', label: 'Yêu cầu trả xe còn', type: 'number', suffix: '% pin' },
      { name: 'has_portable_charger', label: 'Có kèm dây sạc di động', type: 'checkbox' },
      { name: 'battery_policy_note', label: 'Quy định Pin (Tuỳ chỉnh)', type: 'textarea', placeholder: 'VD: Giao xe pin 80%, nếu trả dưới 80% bù 5.000đ/1% pin. Sạc quá 100% không hoàn lại tiền...', hint: 'Ghi rõ quy định bù trừ tiền pin để tránh cãi vã khi trả xe.' },
    ],
  } : null

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
    ...(xeDien ? [xeDien] : []),
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
