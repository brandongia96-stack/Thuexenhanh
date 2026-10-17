// brand-guideline.jsx — Brand guideline đợt 2 cho logo đã chốt AC2 (luồng 15 Designer, brief design/BRIEF-LOGO.md §7).
// 9 trang 1920×1080: bìa · logo · cấu trúc & lưới · khoảng trống & cỡ nhỏ nhất · màu · chữ · logo trên nền · không được làm · bộ file.
// Chạy SAU bo-logo-xuat.jsx + bo-logo-hoan-thien.py (trang 9 đặt chính các file đã xuất):
//   powershell -ExecutionPolicy Bypass -File scripts\adobe\chay.ps1 -App ai -Script design\script\brand-guideline.jsx
// Kết quả: design/nguon/brand-guideline.ai · design/xuat/brand-guideline.pdf · design/xuat/brand/trang-01…09.png

#include "_logo-lib.jsx"

var BO_LOGO_DIR = THU_MUC.fsName + '/xuat/bo-logo/';
var SO_TRANG = 9;
var doc = app.documents.add(DocumentColorSpace.RGB, 1920, 1080);
var r0 = doc.artboards[0].artboardRect;
doc.artboards[0].name = 'trang-01';
// Xếp lưới 3×3 (một hàng 9 trang vượt giới hạn canvas của Illustrator)
for (var i = 1; i < SO_TRANG; i++) {
    var dx = 2100 * (i % 3), dy = -1300 * Math.floor(i / 3);
    doc.artboards.add([r0[0] + dx, r0[1] + dy, r0[2] + dx, r0[3] + dy]).name = 'trang-0' + (i + 1);
}
var lopNen = doc.layers[0]; lopNen.name = 'Nen';
var lopLuoi = doc.layers.add(); lopLuoi.name = 'Luoi';
var lopDung = doc.layers.add(); lopDung.name = 'Dung hinh';
var lopLogo = doc.layers.add(); lopLogo.name = 'Logo';
var lopChu = doc.layers.add(); lopChu.name = 'Chu thich';
var lopGoc = doc.layers.add(); lopGoc.name = 'Goc (an)';
var mauTen = [['TXN Navy', '0B2E6F'], ['TXN Xanh chinh', '2563EB'], ['TXN Xanh sang', '3B82F6'], ['TXN Xanh tren nen dam', '93C5FD'], ['TXN Nen nhat', 'EFF6FF'], ['TXN Den chu', '141414']];
for (var m = 0; m < mauTen.length; m++) { var sw = doc.swatches.add(); sw.name = mauTen[m][0]; sw.color = rgb(mauTen[m][1]); }
var DO = rgb('E8364B');

// ---------- Bản gốc (dựng một lần, ngoài artboard, lớp ẩn) ----------
AB = r0;
var ic = PA_CHOT.icon();
var goc = dungLogo(PA_CHOT, ic, SX(-2600), SY(300), 20); toBan(goc, 'mau');          // U = 20 pt
var gb = goc.geometricBounds, RONG_GOC = gb[2] - gb[0];                                  // rộng bản ngang ở U = 20
var gDoc = logoDoc(goc, 20); toBan(gDoc, 'mau'); gDoc.translate(0, -400);
var gChu = logoChu(goc); toBan(gChu, 'mau'); gChu.translate(0, -800);
var gIcon = phan(goc, 'icon');
var gDuong = dungIconDuong(PA_CHOT, ic, SX(-2600), SY(1500), 20);
var DS_GOC = [goc, gDoc, gChu, gDuong];
for (i = 0; i < DS_GOC.length; i++) DS_GOC[i].move(lopGoc, ElementPlacement.PLACEATEND);
function U_khi(rong) { return 20 * rong / RONG_GOC; } // U (pt) khi bản ngang rộng `rong`

// ---------- Tiện ích trang ----------
function o(x, y, w, h, mau, vien) {
    var r = lopNen.pathItems.roundedRectangle(SY(y), SX(x), w, h, 12, 12);
    r.fillColor = mau; r.stroked = !!vien; if (vien) { r.strokeColor = MAU.vien; r.strokeWidth = 1; }
    return r;
}
function chuPhai(s, xp, y, co, font, mau, gian) { var t = chu(s, 0, y, co, font, mau, gian); t.translate(SX(xp) - t.geometricBounds[2], 0); return t; }
function chuGiua(s, xg, y, co, font, mau, gian) { var t = chu(s, 0, y, co, font, mau, gian); var b = t.geometricBounds; t.translate(SX(xg) - (b[0] + b[2]) / 2, 0); return t; }
function sao2(it, ban) { var d = banSao(it); if (ban) toBan(d, ban); return d; }
function trang(i, tieuDe, moTa, nen) {
    AB = doc.artboards[i].artboardRect;
    oNen(0, 0, 1920, 1080, nen || MAU.trang);
    var toi = nen && nen === MAU.navy, mNhan = toi ? MAU.sangToi : MAU.mo;
    chu('THUÊ XE NHANH  ·  BỘ NHẬN DIỆN THƯƠNG HIỆU', 64, 44, 12, 'SemiBold', mNhan, 200);
    chuPhai((i < 9 ? '0' : '') + (i + 1) + ' / 0' + SO_TRANG, 1856, 44, 12, 'SemiBold', mNhan, 200);
    if (tieuDe) chu(tieuDe, 64, 70, 40, 'Bold', toi ? MAU.trang : MAU.den);
    if (moTa) chu(moTa, 64, 128, 16, 'Regular', toi ? MAU.sangToi : MAU.vua);
}
function nhanO(s, x, y, mau) { return chu(s, x, y, 14, 'SemiBold', mau || MAU.vua); }
function hex(m) { function h(v) { var s = Math.round(v).toString(16).toUpperCase(); return s.length < 2 ? '0' + s : s; } return '#' + h(m.red) + h(m.green) + h(m.blue); }
function doSang(m) { function k(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); } return 0.2126 * k(m.red) + 0.7152 * k(m.green) + 0.0722 * k(m.blue); }
function tuongPhan(a, b) { var l1 = doSang(a), l2 = doSang(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
function so(v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); }
function hang(t) { // ExtendScript tính sai toán tử ba ngôi lồng nhau → viết bằng if
    if (t >= 7) return 'AAA';
    if (t >= 4.5) return 'AA';
    if (t >= 3) return 'AA chữ lớn';
    return 'chỉ trang trí';
}
function dauX(cx, cy) { // huy hiệu tròn đỏ có dấu ✕
    var c = lopChu.pathItems.ellipse(SY(cy - 16), SX(cx - 16), 32, 32); c.fillColor = DO; c.stroked = false;
    var a = vach(lopChu, SX(cx - 6), SY(cy - 6), SX(cx + 6), SY(cy + 6), MAU.trang, 3), b = vach(lopChu, SX(cx + 6), SY(cy - 6), SX(cx - 6), SY(cy + 6), MAU.trang, 3);
    a.strokeCap = StrokeCap.ROUNDENDCAP; b.strokeCap = StrokeCap.ROUNDENDCAP;
}
function vienHoa(it) { // biến logo thành nét viền (để minh hoạ cách dùng sai)
    if (it.typename == 'GroupItem') { for (var i = 0; i < it.pageItems.length; i++) vienHoa(it.pageItems[i]); }
    else if (it.typename == 'CompoundPathItem') { for (var j = 0; j < it.pathItems.length; j++) vienHoa(it.pathItems[j]); }
    else if (it.typename == 'PathItem') { it.filled = true; it.fillColor = MAU.trang; it.stroked = true; it.strokeColor = MAU.chinh; it.strokeWidth = 1.5; }
}

// ===== 01 · Bìa =====
trang(0, null, null, MAU.navy);
dat(sao2(goc, 'sang'), 960, 470, 1100, null);
chu('Bộ nhận diện thương hiệu', 64, 880, 36, 'Bold', MAU.trang);
chu('Phiên bản 1.0  ·  10/2026  ·  Logo AC2 — khe tốc độ trong khối', 64, 938, 16, 'Medium', MAU.sangToi);

// ===== 02 · Logo =====
trang(1, 'Logo', 'Bản ngang là bản chính. Bản dọc cho chỗ vuông (ảnh đại diện, bảng hiệu đứng). Icon dùng riêng khi chỗ quá nhỏ cho chữ.');
o(64, 180, 600, 836, MAU.nen); dat(sao2(gDoc), 364, 580, 420, null); nhanO('Logo dọc', 96, 976);
o(696, 180, 1160, 400, MAU.nen); dat(sao2(goc), 1276, 372, 820, null); nhanO('Logo ngang  ·  bản chính', 728, 540);
o(696, 612, 564, 404, MAU.nen); dat(sao2(gIcon), 978, 800, null, 190); nhanO('Icon  ·  khối app', 728, 976);
o(1292, 612, 564, 404, MAU.nen); dat(sao2(gChu), 1574, 800, 440, null); nhanO('Logotype  ·  chỉ chữ', 1324, 976);

// ===== 03 · Cấu trúc & lưới =====
trang(2, 'Cấu trúc & lưới', 'Mọi số đo là bội của U — độ dày nét đứng của chữ. Chữ dựng bằng hình cơ bản rồi gộp/cắt (Pathfinder), không dùng font.');
o(64, 180, 1792, 400, MAU.nen);
var l3 = dat(sao2(goc), 860, 392, 1400, null), U3 = U_khi(1400), b3 = l3.geometricBounds, day3 = b3[3] + 0.25 * U3;
var dong3 = [[0, 'đường cơ sở', MAU.sang], [4, 'x-height · 4U', MAU.sang], [5, 'chữ t · 5U', MAU.luoiDam], [5.5, 'chữ h · 5,5U', MAU.luoiDam]];
for (i = 0; i < dong3.length; i++) {
    var y3 = day3 + dong3[i][0] * U3, v3 = vach(lopLuoi, SX(96), y3, SX(1590), y3, dong3[i][2], 0.8);
    if (i > 1) v3.strokeDashes = [4, 3];
    chu(dong3[i][1], 1610, AB[1] - y3 - 8 + [0, 0, 7, -9][i], 13, 'Medium', MAU.vua); // tách hai nhãn t / h đứng sát nhau
}
// thước 1U dưới thân chữ h đầu tiên (chữ thứ 2 của logotype)
var xh = b3[0] + (6 + 1.4 + 2.65 + 0.55) * U3, yU = day3 - 0.9 * U3;
vach(lopLuoi, xh, yU, xh + U3, yU, MAU.den, 1); vach(lopLuoi, xh, yU - 5, xh, yU + 5, MAU.den, 1); vach(lopLuoi, xh + U3, yU - 5, xh + U3, yU + 5, MAU.den, 1);
chu('U', (xh + U3 / 2 - AB[0]) - 4, AB[1] - yU + 6, 13, 'Bold', MAU.den);
o(64, 612, 860, 404, MAU.nen);
veLuoi(PA_CHOT, ic, 494, 814);
nhanO('Icon', 96, 640);
o(956, 612, 900, 404, MAU.nen);
var spec = [
    'Chữ: x-height 4U · chữ h 5,5U · chữ t 5U · nét đứng 1U, nét ngang 0,9U (mỏng hơn để cân mắt)',
    'Chữ tròn (e, a, u) nhô 2% qua đường cơ sở và x-height — nếu không sẽ trông nhỏ hơn',
    'Đầu nét bo 0,15U · khía nhỏ chỗ vòm nối thân chữ n, h, u, a — đọc rõ ở cỡ nhỏ',
    'Khe: rộng 0,4U, nghiêng 45°, mọc từ góc trong của vòm chữ n',
    'Khe có ở icon và ở chữ n đầu của "nhanh" — icon và chữ nói cùng một ý',
    'Icon: khối 6,5U bo 0,78U (12%) · chữ n cao 4U nghiêng 10°, cắt thủng khối',
    'Ghép ngang: khối cao 6U (thấp hơn đáy chữ 0,25U), cách chữ 1,4U',
    'Khoảng cách chữ chỉnh theo mắt: đứng–đứng 0,75U · đứng–tròn 0,6U · chéo–tròn 0,45U'];
for (i = 0; i < spec.length; i++) chu(spec[i], 996, 648 + i * 44, 15, 'Regular', MAU.den);

// ===== 04 · Khoảng trống & cỡ nhỏ nhất =====
trang(3, 'Khoảng trống & cỡ nhỏ nhất', 'Chừa trống quanh logo để logo thở; dưới cỡ tối thiểu thì chữ không còn đọc được — khi đó chỉ dùng icon.');
o(64, 180, 1160, 560, MAU.nen);
var U4 = U_khi(720), cs = 4 * U4;
var l4 = dat(sao2(goc), 644, 470, 720, null), b4 = l4.geometricBounds;
var vung = lopNen.pathItems.rectangle(b4[1] + cs, b4[0] - cs, b4[2] - b4[0] + 2 * cs, b4[1] - b4[3] + 2 * cs);
vung.fillColor = MAU.nhat; vung.strokeColor = MAU.sang; vung.strokeWidth = 1; vung.strokeDashes = [5, 4];
var o4 = lopLuoi.pathItems.rectangle(b4[1] + cs, b4[0] - cs, cs, cs); o4.filled = false; o4.strokeColor = MAU.sang; o4.strokeWidth = 1;
chu('x', (b4[0] - cs / 2 - AB[0]) - 5, AB[1] - (b4[1] + cs / 2) - 10, 18, 'Bold', MAU.chinh);
nhanO('Khoảng trống tối thiểu = x (bằng chiều cao chữ x = 4U) ở cả 4 phía', 96, 700);
o(1256, 180, 600, 560, MAU.nen);
var i4 = dat(sao2(gIcon), 1556, 440, null, 200), bi4 = i4.geometricBounds, cs2 = 50;
var vung2 = lopNen.pathItems.rectangle(bi4[1] + cs2, bi4[0] - cs2, bi4[2] - bi4[0] + 2 * cs2, bi4[1] - bi4[3] + 2 * cs2);
vung2.fillColor = MAU.nhat; vung2.strokeColor = MAU.sang; vung2.strokeWidth = 1; vung2.strokeDashes = [5, 4];
nhanO('Icon đứng riêng: chừa ¼ cạnh khối', 1288, 700);
o(64, 772, 1792, 244, MAU.nen);
chu('CỠ NHỎ NHẤT  ·  HIỆN ĐÚNG KÍCH THƯỚC THẬT', 96, 800, 12, 'SemiBold', MAU.mo, 200);
var l20 = dat(sao2(goc), 0, 880, null, 20), b20 = l20.geometricBounds; l20.translate(SX(96) - b20[0], 0);
chu('Logo ngang: cao ≥ 20 px trên màn hình · rộng ≥ 35 mm khi in', 96, 920, 15, 'Medium', MAU.den);
var i16 = dat(sao2(gIcon), 0, 880, null, 16), bi16 = i16.geometricBounds; i16.translate(SX(760) - bi16[0], 0);
chu('Icon: ≥ 16 px (favicon) · ≥ 6 mm khi in', 760, 920, 15, 'Medium', MAU.den);
chu('Nhỏ hơn 20 px → bỏ chữ, chỉ dùng icon', 1300, 920, 15, 'Medium', MAU.vua);

// ===== 05 · Màu =====
trang(4, 'Màu sắc', 'Hai tông xanh dương: navy cho sự tin cậy, xanh chính cho tốc độ. Tỉ lệ tương phản tính theo WCAG 2.');
var mauChinh = [
    [MAU.navy, 'Xanh navy', 'Chữ "thuexe" · nền đậm', MAU.trang, 'trắng'],
    [MAU.chinh, 'Xanh chính', 'Icon · chữ "nhanh" · = --m-green-hover', MAU.trang, 'trắng'],
    [MAU.sang, 'Xanh sáng', 'Khối lớn, điểm nhấn · = --m-green', MAU.trang, 'trắng'],
    [MAU.sangToi, 'Xanh trên nền đậm', '"nhanh" + icon khi nền navy', MAU.navy, 'navy']];
for (i = 0; i < 4; i++) {
    var x5 = 64 + i * 454, c5 = mauChinh[i], toi5 = doSang(c5[0]) < 0.3, mc = toi5 ? MAU.trang : MAU.navy, tp = tuongPhan(c5[0], c5[3]);
    o(x5, 180, 430, 400, c5[0]);
    chu(c5[1], x5 + 32, 212, 24, 'Bold', mc);
    chu(hex(c5[0]), x5 + 32, 252, 18, 'SemiBold', mc);
    chu('RGB ' + c5[0].red + ' ' + c5[0].green + ' ' + c5[0].blue, x5 + 32, 282, 14, 'Medium', mc);
    chu(c5[2], x5 + 32, 496, 14, 'Medium', mc);
    chu('Với ' + c5[4] + ': ' + so(tp) + ':1 · ' + hang(tp), x5 + 32, 524, 14, 'Medium', mc);
}
var mauPhu = [[MAU.nhat, 'Nền nhạt', '= --m-green-light'], [MAU.den, 'Đen chữ', 'Bản 1 màu · = --m-dark'], [MAU.nen, 'Nền xám', '= --m-bg'], [MAU.trang, 'Trắng', 'Nền chính']];
for (i = 0; i < 4; i++) {
    var x6 = 64 + i * 454, c6 = mauPhu[i], mc6 = doSang(c6[0]) < 0.3 ? MAU.trang : MAU.den;
    o(x6, 612, 430, 240, c6[0], doSang(c6[0]) > 0.85);
    chu(c6[1], x6 + 32, 644, 20, 'Bold', mc6);
    chu(hex(c6[0]) + '  ·  RGB ' + c6[0].red + ' ' + c6[0].green + ' ' + c6[0].blue, x6 + 32, 680, 14, 'SemiBold', mc6);
    chu(c6[2], x6 + 32, 800, 14, 'Medium', mc6);
}
chu('Chữ nhỏ trên nền trắng chỉ dùng navy hoặc xanh chính (đạt AA). Xanh sáng #3B82F6 chỉ cho khối lớn hoặc chữ từ 24 px.', 64, 900, 15, 'Regular', MAU.vua);
chu('Nút bấm của app đang dùng --m-green #3B82F6; logo dùng #2563EB (= --m-green-hover) nên khớp trạng thái bấm, không cần đổi token.', 64, 932, 15, 'Regular', MAU.vua);

// ===== 06 · Chữ =====
trang(5, 'Chữ', 'Plus Jakarta Sans cho giao diện và văn bản. Logotype là hình tự dựng — không gõ lại bằng font.');
o(64, 180, 560, 836, MAU.nhat);
chu('Aa', 104, 200, 240, 'Bold', MAU.chinh);
chu('Plus Jakarta Sans', 104, 560, 30, 'Bold', MAU.navy);
chu('Giấy phép SIL OFL — dùng thương mại miễn phí', 104, 608, 15, 'Medium', MAU.vua);
chu('Cỡ gốc giao diện 15 px', 104, 636, 15, 'Medium', MAU.vua);
var kieu = [['ExtraLight', 'Thin'], ['Light', 'Light'], ['Regular', 'Regular'], ['Medium', 'Medium'], ['SemiBold', 'SemiBold'], ['Bold', 'Bold'], ['ExtraBold', 'ExtraBold']];
for (i = 0; i < kieu.length; i++) chu(kieu[i][0], 680, 196 + i * 58, 34, kieu[i][0], MAU.den);
chu('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 1140, 200, 26, 'SemiBold', MAU.den);
chu('abcdefghijklmnopqrstuvwxyz', 1140, 244, 26, 'SemiBold', MAU.den);
chu('ă â đ ê ô ơ ư  ·  á à ả ã ạ  ·  ế ề ể ễ ệ', 1140, 288, 26, 'SemiBold', MAU.den);
chu('0123456789  ·  đ  ·  %', 1140, 332, 26, 'SemiBold', MAU.den);
chu('Thuê xe tự lái, liên hệ thẳng chủ xe.', 1140, 400, 26, 'Regular', MAU.vua);
o(680, 612, 1176, 404, MAU.nen);
var thang = [['Tiêu đề trang', 32, 'Bold', '32 px · Bold'], ['Tiêu đề khối', 20, 'SemiBold', '20 px · SemiBold'], ['Nội dung — cỡ gốc', 15, 'Regular', '15 px · Regular'], ['Chú thích, nhãn nhỏ', 13, 'Medium', '13 px · Medium']];
var yt = 650;
for (i = 0; i < thang.length; i++) { chu(thang[i][0], 720, yt, thang[i][1], thang[i][2], MAU.den); chuPhai(thang[i][3], 1816, yt + 4, 14, 'Medium', MAU.mo); yt += thang[i][1] + 52; }

// ===== 07 · Logo trên các nền =====
trang(6, 'Logo trên các nền', 'Nền sáng dùng bản màu; nền đậm dùng bản sáng; nền xanh chính hoặc ảnh tối dùng bản toàn trắng.');
var nen7 = [
    [MAU.trang, 'mau', 'Nền trắng — bản màu (chính)', true], [MAU.nhat, 'mau', 'Nền xanh nhạt — bản màu', false], [MAU.nen, 'den', 'Bản 1 màu đen — in đen trắng, đóng dấu', false],
    [MAU.navy, 'sang', 'Nền navy — bản sáng', false], [MAU.chinh, 'trang', 'Nền xanh chính — toàn trắng', false], [MAU.den, 'trang', 'Nền tối, ảnh tối — toàn trắng', false]];
for (i = 0; i < 6; i++) {
    var x7 = 64 + (i % 3) * 608, y7 = i < 3 ? 180 : 612, n7 = nen7[i];
    o(x7, y7, 576, 404, n7[0], n7[3]);
    dat(sao2(goc, n7[1]), x7 + 288, y7 + 190, 420, null);
    nhanO(n7[2], x7 + 32, y7 + 356, doSang(n7[0]) < 0.3 ? MAU.trang : MAU.vua);
}

// ===== 08 · Không được làm =====
trang(7, 'Không được làm', 'Luôn dùng file logo gốc. Mọi kiểu dưới đây đều làm logo mất nhận diện.');
function oSai(k, tieu, nenO) {
    var x8 = 64 + (k % 4) * 454, y8 = k < 4 ? 180 : 604;
    o(x8, y8, 430, 380, nenO || MAU.nen);
    dauX(x8 + 398, y8 + 32);
    chu(tieu, x8 + 28, y8 + 336, 15, 'SemiBold', nenO ? MAU.trang : DO); // chữ đỏ không đọc được trên nền xanh
    return [x8 + 215, y8 + 170];
}
var t8 = oSai(0, 'Không kéo dãn, bóp méo'); var s8 = sao2(goc); s8.resize(135, 70); dat(s8, t8[0], t8[1], 330, null);
t8 = oSai(1, 'Không đổi màu ngoài bảng màu'); s8 = sao2(goc); toPhan(s8, 'icon', rgb('F59E0B')); toPhan(s8, 'thuexe', rgb('16A34A')); toPhan(s8, 'nhanh', rgb('F59E0B')); dat(s8, t8[0], t8[1], 330, null);
t8 = oSai(2, 'Không xoay, không nghiêng thêm'); s8 = sao2(goc); s8.rotate(-15); dat(s8, t8[0], t8[1], 330, null);
t8 = oSai(3, 'Không thêm viền, bóng, hiệu ứng'); s8 = sao2(goc); vienHoa(s8); dat(s8, t8[0], t8[1], 330, null);
t8 = oSai(4, 'Không đặt trên nền thiếu tương phản', MAU.sang); s8 = sao2(goc); dat(s8, t8[0], t8[1], 330, null);
t8 = oSai(5, 'Không gõ lại chữ bằng font');
s8 = lopLogo.groupItems.add(); phan(goc, 'icon').duplicate(s8, ElementPlacement.PLACEATEND);
var tf8 = s8.textFrames.add(); tf8.contents = 'thuexenhanh';
var ca8 = tf8.textRange.characterAttributes; ca8.textFont = app.textFonts.getByName('PlusJakartaSans-ExtraBold'); ca8.size = 150; ca8.fillColor = MAU.navy;
var bI8 = s8.pageItems[1].geometricBounds; tf8.position = [bI8[2] + 28, bI8[1] + 32];
for (i = 6; i < 11; i++) tf8.textRange.characters[i].characterAttributes.fillColor = MAU.chinh;
dat(s8, t8[0], t8[1], 330, null);
t8 = oSai(6, 'Không tách hay giãn chữ, icon'); s8 = sao2(goc); phan(s8, 'nhanh').translate(60, 0); phan(s8, 'icon').translate(-50, 0); dat(s8, t8[0], t8[1], 330, null);
t8 = oSai(7, 'Không đổi chỗ icon'); s8 = sao2(goc);
var bS8 = s8.geometricBounds, iS8 = phan(s8, 'icon'), biS8 = iS8.geometricBounds, w8 = biS8[2] - biS8[0] + 1.4 * 20;
phan(s8, 'thuexe').translate(-w8, 0); phan(s8, 'nhanh').translate(-w8, 0); iS8.translate(bS8[2] - biS8[2], 0);
dat(s8, t8[0], t8[1], 330, null);

// ===== 09 · Bộ file cho app =====
trang(8, 'Bộ file cho app', 'Xuất từ cùng một nguồn hình (design/script/bo-logo-xuat.jsx). Ảnh dưới đây là chính các file đã xuất.');
function kb(ten) { var f = new File(BO_LOGO_DIR + ten); return f.exists ? (f.length < 1024 ? f.length + ' B' : so(f.length / 1024) + ' KB') : 'chưa có'; }
function datAnh(ten, x, y, toiDa) {
    var p = lopLogo.placedItems.add(); p.file = new File(BO_LOGO_DIR + ten);
    var k = Math.min(1, toiDa / Math.max(p.width, p.height)); p.resize(k * 100, k * 100);
    p.position = [SX(x + (64 - p.width) / 2), SY(y + (64 - p.height) / 2)];
    p.embed();
}
var tep = [
    ['favicon.ico', 'favicon-48.png', '16 · 32 · 48 px trong một file', 'Tab trình duyệt (index.html)'],
    ['favicon-32.png', 'favicon-32.png', '32 × 32', 'Tab trình duyệt (index.html)'],
    ['apple-touch-icon.png', 'apple-touch-icon.png', '180 × 180, nền kín (iOS tự bo góc)', 'Màn hình chính iPhone'],
    ['logo.png  ·  logo.webp', 'logo.png', '108 × 108, hiện 36 px', 'Đầu trang (Header.jsx)'],
    ['logo-192.png  ·  logo-512.png', 'logo-512.png', '192 · 512 px', 'Biểu tượng app, Google (schema.org logo)'],
    ['og-image.jpg', null, '1200 × 630', 'Ảnh khi chia sẻ link lên Facebook, Zalo'],
    ['icon.svg', null, 'vector', 'Icon dương bản: khối xanh + chữ n trắng'],
    ['logo-ngang.svg  ·  logo-ngang-sang.svg', null, 'vector', 'Logo ngang cho nền sáng / nền đậm'],
    ['logo-doc.svg', null, 'vector', 'Logo dọc']];
var vec = [null, null, null, null, null, null, gDuong, goc, gDoc];
for (i = 0; i < tep.length; i++) {
    var y9 = 184 + i * 92, t9 = tep[i], ds9 = t9[0].split('  ·  '), co9 = '';
    for (var j = 0; j < ds9.length; j++) co9 += (j ? ' + ' : '') + kb(ds9[j]);
    o(64, y9, 76, 76, MAU.nen);
    if (t9[1]) datAnh(t9[1], 70, y9 + 6, 64);
    else if (vec[i]) dat(sao2(vec[i]), 102, y9 + 38, i == 6 ? 56 : 64, null);
    else { var a9 = lopLogo.placedItems.add(); a9.file = new File(BO_LOGO_DIR + 'og-image.jpg'); a9.resize(5.3, 5.3); a9.position = [SX(102 - a9.width / 2), SY(y9 + 38 - a9.height / 2)]; a9.embed(); }
    chu(t9[0], 164, y9 + 12, 17, 'SemiBold', MAU.den);
    chu(t9[2] + '  ·  ' + co9 + '  ·  ' + t9[3], 164, y9 + 42, 14, 'Medium', MAU.vua);
}
o(1180, 184, 676, 420, MAU.nen);
var og = lopLogo.placedItems.add(); og.file = new File(BO_LOGO_DIR + 'og-image.jpg'); og.resize(50, 50); og.position = [SX(1218), SY(206)]; og.embed();
nhanO('og-image.jpg  ·  xem ở 50%', 1218, 548);
chu('Đã thay vào public/ (cùng tên file cũ, cùng kích thước) —', 1180, 650, 15, 'Medium', MAU.den);
chu('đầu trang, favicon, ảnh chia sẻ tự đổi, không phải sửa code.', 1180, 676, 15, 'Medium', MAU.den);
chu('Các file SVG để sẵn trong public/ cho lúc đầu trang', 1180, 716, 15, 'Regular', MAU.vua);
chu('chuyển sang logo ngang (việc của luồng sở hữu Header).', 1180, 742, 15, 'Regular', MAU.vua);

// ---------- Xuất ----------
lopGoc.visible = false; lopNen.locked = true; lopLuoi.locked = true;
doc.selection = null;
var RA = new Folder(THU_MUC.fsName + '/xuat/brand'); if (!RA.exists) RA.create();
var kq = [];
for (i = 0; i < SO_TRANG; i++) {
    doc.artboards.setActiveArtboardIndex(i);
    var f = new File(RA.fsName + '/trang-0' + (i + 1) + '.png');
    var opt = new ExportOptionsPNG24(); opt.artBoardClipping = true; opt.antiAliasing = true; opt.transparency = false;
    doc.exportFile(f, ExportType.PNG24, opt);
    kq.push(f.name);
}
doc.saveAs(new File(THU_MUC.fsName + '/nguon/brand-guideline.ai'), new IllustratorSaveOptions());
var po = new PDFSaveOptions(); po.compatibility = PDFCompatibility.ACROBAT7; po.preserveEditability = false; po.generateThumbnails = false; po.viewAfterSaving = false;
var pdf = new File(THU_MUC.fsName + '/xuat/brand-guideline.pdf');
doc.saveAs(pdf, po);
doc.close(SaveOptions.DONOTSAVECHANGES);
kq.join(', ') + ' | pdf ' + Math.round(pdf.length / 1024) + ' KB';
