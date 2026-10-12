import fs from 'fs'
import path from 'path'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx'

const FONT_NAME = 'Times New Roman'

function taoDoanVan(chu, options = {}) {
  const {
    bold = false,
    italic = false,
    size = 24, // 12pt (docx size tính bằng half-points, 24 = 12pt)
    align = AlignmentType.LEFT,
    spaceBefore = 100,
    spaceAfter = 100,
  } = options

  return new Paragraph({
    alignment: align,
    spacing: { before: spaceBefore, after: spaceAfter },
    children: [
      new TextRun({
        text: chu,
        bold,
        italics: italic,
        font: FONT_NAME,
        size,
      }),
    ],
  })
}

function taoTieuDe(chu, level = HeadingLevel.HEADING_1, align = AlignmentType.CENTER) {
  return new Paragraph({
    alignment: align,
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({
        text: chu,
        bold: true,
        font: FONT_NAME,
        size: level === HeadingLevel.HEADING_1 ? 30 : 26,
      }),
    ],
  })
}

function taoDongDien(nhan, giaTri = '................................................................................................') {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text: nhan + ' ',
        bold: true,
        font: FONT_NAME,
        size: 24,
      }),
      new TextRun({
        text: giaTri,
        font: FONT_NAME,
        size: 24,
      }),
    ],
  })
}

function taoMucDieuKhoan(tenDieu, noiDung = []) {
  const doan = [
    new Paragraph({
      spacing: { before: 140, after: 80 },
      children: [
        new TextRun({
          text: tenDieu,
          bold: true,
          font: FONT_NAME,
          size: 25,
        }),
      ],
    }),
  ]

  for (const nd of noiDung) {
    doan.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        indent: { left: 360 },
        children: [
          new TextRun({
            text: nd,
            font: FONT_NAME,
            size: 24,
          }),
        ],
      })
    )
  }
  return doan
}

function taoBangKyTen(benA = 'BÊN CHO THUÊ (BÊN A)', benB = 'BÊN THUÊ (BÊN B)') {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              taoDoanVan(benA, { bold: true, align: AlignmentType.CENTER }),
              taoDoanVan('(Ký, ghi rõ họ tên)', { italic: true, align: AlignmentType.CENTER }),
              taoDoanVan('\n\n\n\n', { align: AlignmentType.CENTER }),
              taoDoanVan('......................................................', { align: AlignmentType.CENTER }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              taoDoanVan(benB, { bold: true, align: AlignmentType.CENTER }),
              taoDoanVan('(Ký, ghi rõ họ tên)', { italic: true, align: AlignmentType.CENTER }),
              taoDoanVan('\n\n\n\n', { align: AlignmentType.CENTER }),
              taoDoanVan('......................................................', { align: AlignmentType.CENTER }),
            ],
          }),
        ],
      }),
    ],
  })
}

async function taoFileHopDong() {
  const doc = new Document({
    sections: [
      // ═══════════════════════════════════════════════════════════════
      // PHẦN 1: HỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI
      // ═══════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 }, // Lề chuẩn A4: trên 2cm, dưới 2cm, phải 2cm, trái 2.5cm
          },
        },
        children: [
          taoDoanVan('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { bold: true, align: AlignmentType.CENTER, size: 26 }),
          taoDoanVan('Độc lập - Tự do - Hạnh phúc', { bold: true, align: AlignmentType.CENTER, size: 26 }),
          taoDoanVan('-----------------------------------', { align: AlignmentType.CENTER, size: 24, spaceAfter: 200 }),

          taoTieuDe('HỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI', HeadingLevel.HEADING_1),
          taoDoanVan('Số: ......./HĐTX-TL', { italic: true, align: AlignmentType.CENTER, spaceAfter: 180 }),

          taoDoanVan('Hôm nay, ngày ...... tháng ...... năm 20......, tại địa chỉ: ............................................................................', { italic: true, spaceAfter: 120 }),
          taoDoanVan('Chúng tôi gồm có:', { bold: true, spaceAfter: 80 }),

          taoDoanVan('I. BÊN CHO THUÊ XE (sau đây gọi là BÊN A):', { bold: true, size: 24 }),
          taoDongDien('Họ và tên / Tổ chức:'),
          taoDongDien('Số CCCD / Mã số thuế:', '..................................... Ngày cấp: ................. Nơi cấp: .................................'),
          taoDongDien('Địa chỉ thường trú:'),
          taoDongDien('Số điện thoại liên hệ:'),
          taoDongDien('Số tài khoản ngân hàng:', '..................................... Tại Ngân hàng: .............................................'),

          taoDoanVan('II. BÊN THUÊ XE (sau đây gọi là BÊN B):', { bold: true, size: 24, spaceBefore: 120 }),
          taoDongDien('Họ và tên:'),
          taoDongDien('Số CCCD:', '..................................... Ngày cấp: ................. Nơi cấp: .................................'),
          taoDongDien('Giấy phép lái xe số:', '..................................... Hạng: ............ Ngày hết hạn: .................................'),
          taoDongDien('Địa chỉ thường trú:'),
          taoDongDien('Số điện thoại liên hệ:'),

          taoDoanVan('Sau khi bàn bạc thảo luận, hai bên cùng thống nhất ký kết Hợp đồng thuê xe ô tô tự lái với các điều khoản sau đây:', { italic: true, spaceBefore: 100, spaceAfter: 120 }),

          ...taoMucDieuKhoan('ĐIỀU 1. ĐỐI TƯỢNG HỢP ĐỒNG', [
            'Bên A đồng ý cho Bên B thuê 01 xe ô tô với các đặc điểm kỹ thuật và pháp lý như sau:',
            '1.1. Nhãn hiệu, Dòng xe: ............................................................................................................................',
            '1.2. Biển kiểm soát: .................................................... Năm sản xuất: .......................................................',
            '1.3. Số chỗ ngồi: ....................... Màu sơn: ............................ Số khung/Số máy: .........................................',
            '1.4. Tình trạng kỹ thuật chung: Xe đang hoạt động bình thường, đầy đủ giấy tờ hợp pháp đủ điều kiện lưu hành.',
          ]),

          ...taoMucDieuKhoan('ĐIỀU 2. THỜI HẠN THUÊ VÀ ĐỊA ĐIỂM GIAO NHẬN XE', [
            '2.1. Thời gian nhận xe: .......... giờ .......... phút, ngày .......... / .......... / 20..........',
            '2.2. Thời gian trả xe: .......... giờ .......... phút, ngày .......... / .......... / 20..........',
            '2.3. Tổng thời gian thuê xe: .................... ngày (hoặc .................... giờ).',
            '2.4. Địa điểm giao nhận xe: .........................................................................................................................',
          ]),

          ...taoMucDieuKhoan('ĐIỀU 3. GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN', [
            '3.1. Đơn giá thuê: ..................................................... VNĐ/ngày (hoặc VNĐ/giờ).',
            '3.2. Tổng số tiền thuê: ..................................................... VNĐ (Bằng chữ: ....................................................)',
            '3.3. Phương thức thanh toán: Thanh toán bằng tiền mặt hoặc chuyển khoản ngân hàng.',
            '3.4. Thời điểm thanh toán: Bên B thanh toán 100% tiền thuê ngay khi ký hợp đồng và nhận bàn giao xe.',
            '3.5. Chi phí chưa bao gồm: Xăng/dầu (hoặc tiền sạc điện), phí cầu đường, bến bãi, rửa xe và các khoản vi phạm luật giao thông.',
          ]),

          ...taoMucDieuKhoan('ĐIỀU 4. TIỀN ĐẶT CỌC VÀ THẾ CHẤP TÀI SẢN', [
            '4.1. Bên B đặt cọc cho Bên A để đảm bảo thực hiện hợp đồng:',
            '- Bằng tiền mặt / chuyển khoản: ..................................................... VNĐ',
            '- Hoặc bằng tài sản thế chấp: 01 Xe máy nhãn hiệu ................................., BKS ................................. kèm bản chính Giấy đăng ký xe số ..................................................... mang tên .....................................................',
            '4.2. Số tiền cọc / tài sản thế chấp sẽ được Bên A hoàn trả lại cho Bên B ngay sau khi bàn giao xe và thanh toán hết các chi phí phát sinh (nếu có).',
            '4.3. Trường hợp hai bên thoả thuận giữ lại một khoản tiền để đảm bảo nghĩa vụ phạt nguội: Bên A được giữ lại số tiền là ................................. VNĐ trong vòng .......... ngày. Sau thời hạn trên nếu không phát sinh thông báo vi phạm, Bên A có trách nhiệm chuyển khoản trả lại đủ cho Bên B.',
          ]),

          ...taoMucDieuKhoan('ĐIỀU 5. GIỚI HẠN KM VÀ NHIÊN LIỆU / PIN', [
            '5.1. Giới hạn số km: .................... km/ngày. Phí vượt định mức: .................... VNĐ/km.',
            '5.2. Nhiên liệu / Pin: Bên B nhận xe ở mức nào thì có trách nhiệm hoàn trả xe ở mức đó. Nếu thiếu hụt, Bên B phải thanh toán tiền bù trừ theo giá thực tế tại thời điểm trả xe.',
            '5.3. Phí trả xe trễ giờ: .................... VNĐ/giờ. Trễ quá 05 giờ tính tròn 01 ngày thuê.',
          ]),

          ...taoMucDieuKhoan('ĐIỀU 6. QUYỀN VÀ NGHĨA VỤ CỦA BÊN A (BÊN CHO THUÊ)', [
            '6.1. Bàn giao xe đúng thời gian, địa điểm, đảm bảo xe hoạt động an toàn, sạch sẽ kèm các giấy tờ xe hợp lệ (bản sao công chứng Đăng ký xe, Giấy chứng nhận Đăng kiểm, Bảo hiểm TNDS bắt buộc còn hạn).',
            '6.2. Hoàn trả tiền đặt cọc và giấy tờ thế chấp cho Bên B đúng cam kết khi hợp đồng thanh lý.',
            '6.3. Không can thiệp vào lộ trình di chuyển hợp pháp của Bên B trong thời gian thuê.',
          ]),

          ...taoMucDieuKhoan('ĐIỀU 7. QUYỀN VÀ NGHĨA VỤ CỦA BÊN B (BÊN THUÊ)', [
            '7.1. Trực tiếp điều khiển xe (hoặc người có GPLX hợp lệ được Bên A đồng ý). Tuyệt đối không cho người khác thuê lại, không sử dụng xe để cầm cố, thế chấp hoặc dùng vào mục đích phi pháp, chở hàng cấm.',
            '7.2. Chấp hành nghiêm chỉnh Luật Giao thông Đường bộ. Bên B chịu trách nhiệm 100% trước pháp luật và chịu toàn bộ chi phí đối với mọi lỗi vi phạm giao thông (kể cả phạt trực tiếp và phạt nguội qua camera) trong suốt thời gian nhận xe đến lúc hoàn trả xe.',
            '7.3. Bảo quản xe cẩn thận. Không được tự ý thay đổi kết cấu xe, tráo đổi phụ tùng. Khi xe gặp sự cố hoặc va chạm, phải thông báo ngay cho Bên A để cùng phối hợp giải quyết, không tự ý đưa vào xưởng sửa chữa khi chưa có sự đồng ý của Bên A.',
          ]),

          ...taoMucDieuKhoan('ĐIỀU 8. TRÁCH NHIỆM KHI XẢY RA SỰ CỐ VÀ BỒI THƯỜNG', [
            '8.1. Trường hợp xe bị trầy xước, móp méo, hư hỏng do lỗi Bên B: Bên B phải bồi thường toàn bộ chi phí sửa chữa phục hồi nguyên trạng tại garage chính hãng hoặc do hai bên thống nhất, đồng thời bồi thường tiền thuê xe trong những ngày xe phải nằm xưởng sửa chữa (50% - 100% giá thuê/ngày).',
            '8.2. Trường hợp xe có bảo hiểm vật chất (2 chiều): Bên B chịu phí miễn thường theo hợp đồng bảo hiểm và chi phí ngày xe nằm xưởng theo thoả thuận.',
          ]),

          ...taoMucDieuKhoan('ĐIỀU 9. ĐIỀU KHOẢN CHUNG VÀ CAM KẾT THI HÀNH', [
            '9.1. Hợp đồng này được lập trên tinh thần tự nguyện, bình đẳng và trung thực của hai bên.',
            '9.2. Mọi tranh chấp phát sinh sẽ được hai bên ưu tiên giải quyết thông qua thương lượng hoà giải. Nếu không thống nhất được, vụ việc sẽ được đưa ra Toà án có thẩm quyền để giải quyết theo quy định của pháp luật.',
            '9.3. Hợp đồng có hiệu lực kể từ thời điểm ký kết và tự động thanh lý khi Bên B hoàn trả xe, thanh toán xong toàn bộ chi phí và Bên A hoàn trả đủ tiền cọc.',
            'Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để theo dõi thực hiện.',
          ]),

          taoDoanVan('', { spaceBefore: 120 }),
          taoBangKyTen('ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)', 'ĐẠI DIỆN BÊN THUÊ (BÊN B)'),
        ],
      },

      // ═══════════════════════════════════════════════════════════════
      // PHẦN 2: BIÊN BẢN BÀN GIAO VÀ NGHIỆM THU XE (LÚC NHẬN & LÚC TRẢ)
      // ═══════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
          },
        },
        children: [
          taoDoanVan('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { bold: true, align: AlignmentType.CENTER, size: 26 }),
          taoDoanVan('Độc lập - Tự do - Hạnh phúc', { bold: true, align: AlignmentType.CENTER, size: 26 }),
          taoDoanVan('-----------------------------------', { align: AlignmentType.CENTER, size: 24, spaceAfter: 200 }),

          taoTieuDe('BIÊN BẢN BÀN GIAO VÀ NGHIỆM THU XE TỰ LÁI', HeadingLevel.HEADING_1),
          taoDoanVan('(Kèm theo Hợp đồng thuê xe số: ......./HĐTX-TL)', { italic: true, align: AlignmentType.CENTER, spaceAfter: 160 }),

          taoDongDien('Xe cho thuê (Nhãn hiệu, dòng xe):'),
          taoDongDien('Biển kiểm soát:', '.................................................... Màu sơn: ....................................................'),

          taoDoanVan('PHẦN A. BIÊN BẢN BÀN GIAO LÚC NHẬN XE', { bold: true, size: 26, spaceBefore: 160, spaceAfter: 80 }),
          taoDongDien('Thời điểm bàn giao nhận xe:', '.......... giờ .......... phút, ngày .......... / .......... / 20..........'),
          taoDongDien('Địa điểm giao xe:'),
          taoDongDien('Chỉ số đồng hồ quãng đường (ODO lúc nhận):', '.................................................... km'),
          taoDongDien('Mức nhiên liệu xăng/dầu (hoặc Dung lượng Pin %):', '....................................................'),
          
          taoDoanVan('1. Tình trạng ngoại thất xe:', { bold: true }),
          taoDoanVan('- Cản trước, cản sau, nắp capo: .....................................................................................................................'),
          taoDoanVan('- Cánh cửa, gương chiếu hậu, mui xe: ...........................................................................................................'),
          taoDoanVan('- Đèn chiếu sáng, đèn hậu, kính chắn gió: ....................................................................................................'),
          taoDoanVan('- Lốp xe, lazang (mâm): .................................................................................................................................'),
          taoDoanVan('- Ghi chú các vết trầy xước / móp méo có sẵn từ trước: .............................................................................'),

          taoDoanVan('2. Tình trạng nội thất & Trang thiết bị:', { bold: true, spaceBefore: 80 }),
          taoDoanVan('- Ghế da/nỉ, taplo, màn hình giải trí, điều hòa: Hoạt động tốt ☐  Khác: ...................................................'),
          taoDoanVan('- Lốp dự phòng, con đội (kích), cờ lê mở ốc, tẩu sạc/dây sạc di động: Đầy đủ ☐'),
          taoDoanVan('- Camera hành trình (thẻ nhớ kèm theo): Hoạt động tốt ☐'),

          taoDoanVan('3. Giấy tờ xe giao cho Bên B mang theo:', { bold: true, spaceBefore: 80 }),
          taoDoanVan('- Bản sao công chứng Cà vẹt xe: Có ☐   - Giấy chứng nhận Đăng kiểm: Có ☐   - Bảo hiểm TNDS: Có ☐'),

          taoDoanVan('4. Xác nhận hình ảnh hiện trạng:', { bold: true, spaceBefore: 80 }),
          taoDoanVan('Hai bên đã chụp ảnh / quay video toàn bộ 4 góc xe, đồng hồ ODO và mức nhiên liệu lúc bàn giao. Số lượng ảnh đã chụp: ............ tấm (đã lưu vào điện thoại 2 bên).'),

          taoDoanVan('', { spaceBefore: 100 }),
          taoBangKyTen('BÊN GIAO XE LÚC ĐẦU', 'BÊN NHẬN XE LÚC ĐẦU'),

          // PHẦN TRẢ XE
          taoDoanVan('PHẦN B. BIÊN BẢN NGHIỆM THU HOÀN TRẢ XE', { bold: true, size: 26, spaceBefore: 300, spaceAfter: 80 }),
          taoDongDien('Thời điểm hoàn trả xe thực tế:', '.......... giờ .......... phút, ngày .......... / .......... / 20..........'),
          taoDongDien('Chỉ số đồng hồ quãng đường (ODO lúc trả):', '.................................................... km'),
          taoDongDien('Tổng quãng đường xe đã đi trong chuyến:', '.................................................... km'),
          taoDongDien('Số km vượt giới hạn (nếu có):', '.................... km × .................... đ/km = .................................... VNĐ'),
          taoDongDien('Mức nhiên liệu xăng/dầu (hoặc Pin %) lúc trả:', '....................................................'),
          taoDongDien('Chênh lệch nhiên liệu/pin cần thanh toán bù:', '................................................................................ VNĐ'),

          taoDoanVan('1. Tình trạng xe lúc trả:', { bold: true, spaceBefore: 80 }),
          taoDoanVan('- Tình trạng thân vỏ, ngoại thất sau chuyến đi: Nguyên vẹn như lúc nhận ☐  Phát sinh vết mới ☐'),
          taoDoanVan('- Chi tiết vết hư hỏng mới phát sinh (nếu có): ................................................................................................'),
          taoDoanVan('- Phương án xử lý thống nhất: ......................................................................................................................'),

          taoDoanVan('2. Quyết toán tiền cọc và chi phí phát sinh:', { bold: true, spaceBefore: 80 }),
          taoDoanVan('A. Tiền đặt cọc ban đầu Bên A nhận: ........................................................................................... VNĐ'),
          taoDoanVan('B. Tiền phụ trội km vượt mức: ................................................................................................... VNĐ'),
          taoDoanVan('C. Tiền bù trừ nhiên liệu / pin: ................................................................................................. VNĐ'),
          taoDoanVan('D. Phí phát sinh khác (rửa xe, trễ giờ, hư hỏng): ................................................................... VNĐ'),
          taoDoanVan('E. Tiền giữ lại bảo đảm phạt nguội (nếu có): ........................................................................... VNĐ'),
          taoDoanVan('=> TỔNG SỐ TIỀN BÊN A HOÀN TRẢ LẠI CHO BÊN B: .................................................... VNĐ'),
          taoDoanVan('(Bằng chữ: .................................................................................................................................................)'),

          taoDoanVan('Hai bên xác nhận đã nhận đủ xe, giấy tờ và hoàn trả đầy đủ tiền cọc, cam kết không có bất kỳ tranh chấp hay khiếu nại nào về sau.', { italic: true, spaceBefore: 80, spaceAfter: 100 }),

          taoBangKyTen('ĐẠI DIỆN BÊN NHẬN LẠI XE (BÊN A)', 'ĐẠI DIỆN BÊN HOÀN TRẢ XE (BÊN B)'),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const outputPath = path.resolve('public', 'mau-hop-dong-thue-xe.docx')
  fs.writeFileSync(outputPath, buffer)
  console.log('✅ Đã tạo thành công file Word:', outputPath)
}

taoFileHopDong().catch((err) => {
  console.error('❌ Lỗi tạo file docx:', err)
  process.exit(1)
})
