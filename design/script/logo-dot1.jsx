// logo-dot1.jsx — Logo đợt 1: 3 artboard phương án A / B / C (luồng 15 Designer, brief design/BRIEF-LOGO.md).
// Bộ phương án kết hợp A + C (anh chọn 17/10): chạy design/script/logo-dot1-ac.jsx (đặt BO_LOGO = 'AC' rồi #include file này).
// Mọi hình dựng từ hình cơ bản (hình chữ nhật bo góc, elip, nét) trên lưới đơn vị U,
// rồi gộp / cắt bằng Pathfinder (Live Pathfinder Add / Subtract + Expand). Không dùng font cho logo.
// Chạy: powershell -ExecutionPolicy Bypass -File scripts\adobe\chay.ps1 -App ai -Script design\script\logo-dot1.jsx
// Kết quả: design/nguon/logo-dot1.ai + design/xuat/logo-dot1-A|B|C.png (1920×1080).

#include "_logo-lib.jsx"

// ---------- 3 phương án ----------
var PA = [
    { ten: 'A', tieuDe: 'Khe tốc độ', icon: iconA, G: { rt: 0.15, khia: true }, ki: ASC / X, dy: 0, gap: 1.5, sg: 60,
        y: 'Một khe chéo 45° tách thân và vòm chữ n như vệt xe lướt qua: nhanh, mà khối chữ vẫn vững.',
        chuThich: 'Wordmark: khía nhỏ chỗ vòm nối thân (đọc rõ ở cỡ nhỏ), đầu nét bo 0,15U.' },
    { ten: 'B', tieuDe: 'Con đường', icon: iconB, G: { rt: 0.5, khia: false, tron: true }, ki: ASC / X, dy: 0, gap: 1.4, sg: 54,
        y: 'Vòm chữ n là một cung đường, vạch đứt ở giữa là làn xe: thuê xe là lên đường.',
        chuThich: 'Wordmark: đầu nét tròn hẳn (0,5U), chữ x nét đầu tròn — thân thiện, mềm.' },
    { ten: 'C', tieuDe: 'Khối app', icon: iconC, G: { rt: 0.06, khia: false }, ki: 6 / 6.5, dy: -0.25, gap: 1.4, sg: 40,
        y: 'Chữ n âm bản nghiêng 10° trong khối vuông bo góc: gọn, nhận ra ngay trên màn hình điện thoại.',
        chuThich: 'Wordmark: đầu nét gần vuông (0,06U), không khía — chắc, nghiêm, "uy tín".', khoi: true }
];
var BO = (typeof BO_LOGO != 'undefined') ? BO_LOGO : 'ABC';
if (BO == 'AC') PA = [ // Anh chọn A, muốn chữ n có khe vào "nhanh" + khung khối của C
    { ten: 'AC1', nhan: 'A + C · KHỐI ĐỨNG', tieuDe: 'Khe tốc độ trong khối', khoi: true, sg: 40,
        icon: function () { return iconKhoi(nKhe(0.1), 0, 'U = {U} pt  ·  khối 6,5U bo 0,78U (12%)  ·  chữ n cao 4U, nét 1U  ·  khe 0,4U nghiêng 45° từ góc ruột'); },
        G: { rt: 0.15, khia: true, nKhe: true }, ki: 6 / 6.5, dy: -0.25, gap: 1.4,
        y: 'Icon A đặt trong khối app của C; chữ n đầu của "nhanh" mang đúng khe 45° ấy — icon và chữ nói cùng một ý.',
        chuThich: 'Wordmark A (khía nhỏ, đầu nét bo 0,15U); riêng chữ n đầu "nhanh" là n có khe như icon.' },
    { ten: 'AC2', nhan: 'A + C · KHỐI NGHIÊNG', tieuDe: 'Khe tốc độ, khối nghiêng', khoi: true, sg: 40,
        icon: function () { return iconKhoi(nKhe(0.1), 10, 'U = {U} pt  ·  khối 6,5U bo 0,78U (12%)  ·  chữ n cao 4U, nét 1U, nghiêng 10°  ·  khe 0,4U'); },
        G: { rt: 0.15, khia: true, nKhe: true }, ki: 6 / 6.5, dy: -0.25, gap: 1.4,
        y: 'Như AC1 nhưng chữ n trong khối nghiêng 10° về phía trước — thêm cảm giác chạy; chữ "nhanh" vẫn đứng.',
        chuThich: 'Wordmark A (khía nhỏ, đầu nét bo 0,15U); riêng chữ n đầu "nhanh" là n có khe như icon.' }
];

// ---------- Tài liệu ----------
var doc = app.documents.add(DocumentColorSpace.RGB, 1920, 1080);
var r0 = doc.artboards[0].artboardRect;
doc.artboards[0].name = PA[0].ten;
for (var i = 1; i < PA.length; i++) doc.artboards.add([r0[0] + 2100 * i, r0[1], r0[2] + 2100 * i, r0[3]]).name = PA[i].ten;
var lopNen = doc.layers[0]; lopNen.name = 'Nen';
var lopLuoi = doc.layers.add(); lopLuoi.name = 'Luoi';
var lopDung = doc.layers.add(); lopDung.name = 'Dung hinh';
var lopLogo = doc.layers.add(); lopLogo.name = 'Logo';
var lopChu = doc.layers.add(); lopChu.name = 'Chu thich';
var mauTen = [['TXN Navy', '0B2E6F'], ['TXN Xanh chinh', '2563EB'], ['TXN Xanh sang', '3B82F6'], ['TXN Xanh tren nen dam', '93C5FD'], ['TXN Nen nhat', 'EFF6FF']];
for (var m = 0; m < mauTen.length; m++) { var sw = doc.swatches.add(); sw.name = mauTen[m][0]; sw.color = rgb(mauTen[m][1]); }

var xuat = [];
for (var p = 0; p < PA.length; p++) {
    var P = PA[p];
    AB = doc.artboards[p].artboardRect;
    var ic = P.icon();

    // Nền các ô
    oNen(0, 0, 1240, 640, MAU.trang);
    oNen(1240, 0, 680, 640, MAU.nen);
    oNen(0, 640, 720, 440, MAU.navy);
    oNen(720, 640, 600, 440, MAU.trang);
    oNen(1320, 640, 600, 440, MAU.trang);
    vach(lopNen, SX(720), SY(640), SX(1920), SY(640), MAU.vien, 1);
    vach(lopNen, SX(1320), SY(640), SX(1320), SY(1080), MAU.vien, 1);

    // 1. Logo ngang lớn (dựng gốc ở đây)
    var goc = dungLogo(P, ic, SX(150), SY(380), 20);
    dat(goc, 620, 330, 940, null);
    toLogo(goc, MAU.chinh, MAU.navy, MAU.chinh);
    if (P.khoi) to(phan(goc, 'icon'), MAU.chinh);

    // 2. Lưới dựng hình icon
    veLuoi(P, ic, 1580, 330);
    chu('LƯỚI DỰNG HÌNH · ICON', 1280, 44, 12, 'SemiBold', MAU.mo, 180);
    chu(ic.spec.replace('{U}', P.sg), 1280, 600, 12, 'Medium', MAU.vua);

    // 3. Nền xanh đậm
    var toi = dat(banSao(goc), 360, 875, 560, null);
    toLogo(toi, P.khoi ? MAU.trang : MAU.sangToi, MAU.trang, MAU.sangToi);
    chu('NỀN XANH ĐẬM  #0B2E6F', 48, 680, 12, 'SemiBold', MAU.sangToi, 180);

    // 4. Một màu
    var mot = dat(banSao(goc), 1020, 875, 500, null);
    toLogo(mot, MAU.den, MAU.den, MAU.den);
    chu('1 MÀU', 760, 680, 12, 'SemiBold', MAU.mo, 180);

    // 5. Cỡ nhỏ thật (px)
    chu('CỠ NHỎ THẬT (PX)', 1360, 680, 12, 'SemiBold', MAU.mo, 180);
    var icGoc = phan(goc, 'icon'), co = [16, 24, 32, 48], xs = [1372, 1412, 1464, 1532];
    for (var k = 0; k < co.length; k++) {
        var cx = xs[k] + co[k] / 2;
        var i1 = banSao(icGoc); to(i1, MAU.chinh); dat(i1, cx, 740, null, P.khoi ? co[k] : Math.round(co[k] * 0.82));
        if (P.khoi) { var i2 = banSao(icGoc); to(i2, MAU.den); dat(i2, cx, 812, null, co[k]); }
        else khoiApp(icGoc, cx, 812, co[k]);
        chu(String(co[k]), cx - 6, 852, 11, 'Medium', MAU.mo);
    }
    if (P.khoi) { var ia = banSao(icGoc); to(ia, MAU.chinh); dat(ia, 1700, 776, null, 96); }
    else khoiApp(icGoc, 1700, 776, 96);
    chu('app icon 96', 1666, 840, 11, 'Medium', MAU.mo);
    var l20 = dat(banSao(goc), 1360, 920, null, 20); toLogo(l20, MAU.chinh, MAU.navy, MAU.chinh);
    var b20 = l20.geometricBounds; l20.translate(SX(1372) - b20[0], 0);
    var l32 = dat(banSao(goc), 1360, 980, null, 32); toLogo(l32, MAU.chinh, MAU.navy, MAU.chinh);
    var b32 = l32.geometricBounds; l32.translate(SX(1372) - b32[0], 0);
    chu('cao 20', 1600, 913, 11, 'Medium', MAU.mo);
    chu('cao 32', 1690, 973, 11, 'Medium', MAU.mo);

    // 6. Chú thích
    chu('PHƯƠNG ÁN ' + (P.nhan || P.ten), 64, 52, 13, 'Bold', MAU.chinh, 220);
    chu(P.tieuDe, 64, 76, 30, 'Bold', MAU.den);
    chu(P.y, 64, 122, 15, 'Regular', MAU.vua);
    var hex = [['0B2E6F', 'thuexe', MAU.navy], ['2563EB', 'nhanh + icon', MAU.chinh], ['93C5FD', 'trên nền đậm', MAU.sangToi]];
    for (k = 0; k < hex.length; k++) {
        var o = lopChu.pathItems.ellipse(SY(548), SX(64 + k * 200), 26, 26); o.fillColor = hex[k][2]; o.stroked = false;
        chu('#' + hex[k][0], 100 + k * 200, 548, 13, 'SemiBold', MAU.den);
        chu(hex[k][1], 100 + k * 200, 566, 11, 'Regular', MAU.mo);
    }
    chu(P.chuThich + '  Chữ dựng bằng hình trên lưới U (x-height 4U, chữ h 5,5U), không dùng font.', 64, 604, 12, 'Regular', MAU.vua);
}

lopNen.locked = true; lopLuoi.locked = true;
doc.selection = null;

// Xuất PNG từng artboard + lưu .ai
for (p = 0; p < PA.length; p++) {
    doc.artboards.setActiveArtboardIndex(p);
    var f = new File(THU_MUC.fsName + '/xuat/logo-dot1-' + PA[p].ten + '.png');
    var opt = new ExportOptionsPNG24(); opt.artBoardClipping = true; opt.antiAliasing = true; opt.transparency = false;
    doc.exportFile(f, ExportType.PNG24, opt);
    xuat.push(f.fsName);
}
var ai = new File(THU_MUC.fsName + (BO == 'AC' ? '/nguon/logo-dot1-ac.ai' : '/nguon/logo-dot1.ai'));
doc.saveAs(ai, new IllustratorSaveOptions());
doc.close(SaveOptions.DONOTSAVECHANGES);
xuat.join(' | ') + ' | ' + ai.fsName;
