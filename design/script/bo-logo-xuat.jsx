// bo-logo-xuat.jsx — Xuất bộ file logo đã chốt (AC2) cho app, từ cùng một nguồn hình (luồng 15 Designer).
// Chạy: powershell -ExecutionPolicy Bypass -File scripts\adobe\chay.ps1 -App ai -Script design\script\bo-logo-xuat.jsx
// Sau đó: python design/script/bo-logo-hoan-thien.py  (favicon.ico nhiều cỡ, logo.webp, nén PNG).
// Kết quả trong design/xuat/bo-logo/:
//   logo-ngang.svg, logo-ngang-sang.svg (nền đậm), logo-doc.svg, icon.svg   — vector
//   logo.png 108 (đầu trang, hiện 36 px), logo-192.png, logo-512.png, favicon-16/32/48.png — icon dương bản, góc trong suốt
//   apple-touch-icon.png 180 (vuông kín nền xanh, iOS tự bo), og-image.jpg 1200×630

#include "_logo-lib.jsx"

var RA = new Folder(THU_MUC.fsName + '/xuat/bo-logo');
if (!RA.exists) RA.create();

var doc = app.documents.add(DocumentColorSpace.RGB, 1920, 1080);
AB = doc.artboards[0].artboardRect;
var lopNen = doc.layers[0]; lopNen.name = 'Nen';
var lopLuoi = doc.layers.add(), lopDung = doc.layers.add(), lopLogo = doc.layers.add(), lopChu = doc.layers.add();

var ic = PA_CHOT.icon();
var goc = dungLogo(PA_CHOT, ic, SX(100), SY(500), 20); // U = 20 pt
toBan(goc, 'mau');
var duong = dungIconDuong(PA_CHOT, ic, SX(100), SY(900), 20);
var doc1 = logoDoc(goc, 20); toBan(doc1, 'mau');

// Chép các hình sang một file tạm kích thước w×h, co vừa (chừa lề `le`), xuất rồi đóng không lưu.
function xuat(ds, w, h, le, nen, ten, kieu, ve) {
    var d = app.documents.add(DocumentColorSpace.RGB, w, h), L = d.layers[0], r = d.artboards[0].artboardRect;
    if (nen) { var bg = L.pathItems.rectangle(r[1], r[0], w, h); bg.fillColor = nen; bg.stroked = false; }
    var g = L.groupItems.add();
    // chép sang file khác phải vào lớp trước (chép thẳng vào nhóm báo lỗi PARM), rồi mới gom nhóm
    for (var i = 0; i < ds.length; i++) ds[i].duplicate(L, ElementPlacement.PLACEATBEGINNING).move(g, ElementPlacement.PLACEATEND);
    var b = g.geometricBounds, k = Math.min((w - 2 * le) / (b[2] - b[0]), (h - 2 * le) / (b[1] - b[3]));
    g.resize(k * 100, k * 100);
    b = g.geometricBounds;
    g.translate((r[0] + r[2]) / 2 - (b[0] + b[2]) / 2, (r[1] + r[3]) / 2 - (b[1] + b[3]) / 2);
    if (ve) ve(d, L, r, g);
    var f = new File(RA.fsName + '/' + ten);
    if (kieu == 'svg') {
        d.artboards[0].artboardRect = g.geometricBounds;
        var o = new ExportOptionsSVG();
        o.embedRasterImages = false; o.cssProperties = SVGCSSPropertyLocation.PRESENTATIONATTRIBUTES;
        o.fontSubsetting = SVGFontSubsetting.None; o.documentEncoding = SVGDocumentEncoding.UTF8;
        o.coordinatePrecision = 2; o.DTD = SVGDTDVersion.SVG1_1; o.preserveEditability = false;
        o.optimizeForSVGViewer = false; o.includeFileInfo = false; o.includeVariablesAndDatasets = false; o.compressed = false;
        d.exportFile(f, ExportType.SVG, o);
    } else if (kieu == 'jpg') {
        var j = new ExportOptionsJPEG(); j.artBoardClipping = true; j.antiAliasing = true; j.qualitySetting = 82; j.optimization = true;
        d.exportFile(f, ExportType.JPEG, j);
    } else {
        var p = new ExportOptionsPNG24(); p.artBoardClipping = true; p.antiAliasing = true; p.transparency = !nen;
        d.exportFile(f, ExportType.PNG24, p);
    }
    d.close(SaveOptions.DONOTSAVECHANGES);
    app.activeDocument = doc;
    return ten + ' ' + f.length + 'B';
}

var kq = [];
// Vector
kq.push(xuat([goc], 600, 70, 0, null, 'logo-ngang.svg', 'svg'));
var sang = goc.duplicate(); toBan(sang, 'sang');
kq.push(xuat([sang], 600, 70, 0, null, 'logo-ngang-sang.svg', 'svg'));
kq.push(xuat([doc1], 400, 300, 0, null, 'logo-doc.svg', 'svg'));
kq.push(xuat([duong], 64, 64, 0, null, 'icon.svg', 'svg'));
// Icon PNG (góc trong suốt)
var co = [['logo.png', 108], ['logo-192.png', 192], ['logo-512.png', 512], ['favicon-16.png', 16], ['favicon-32.png', 32], ['favicon-48.png', 48]];
for (var i = 0; i < co.length; i++) kq.push(xuat([duong], co[i][1], co[i][1], 0, null, co[i][0], 'png'));
// Apple touch: vuông kín nền xanh (iOS tự bo góc) — khối trùng màu nền nên chỉ còn chữ n trắng
kq.push(xuat([duong], 180, 180, 0, MAU.chinh, 'apple-touch-icon.png', 'png'));
// Ảnh chia sẻ 1200×630: nền navy, logo bản sáng + câu mô tả đúng với trang (không số liệu)
kq.push(xuat([sang], 1200, 630, 220, MAU.navy, 'og-image.jpg', 'jpg', function (d, L, r, g) {
    var b = g.geometricBounds; g.translate(0, (r[1] - 250) - (b[1] + b[3]) / 2);
    function dong(s, y, co, font, mau) {
        var t = L.textFrames.add(); t.contents = s;
        var ca = t.textRange.characterAttributes; ca.textFont = app.textFonts.getByName('PlusJakartaSans-' + font); ca.size = co; ca.fillColor = mau;
        t.position = [(r[0] + r[2]) / 2 - t.width / 2, r[1] - y];
    }
    dong('Thuê xe tự lái — liên hệ thẳng chủ xe', 370, 40, 'Bold', MAU.trang);
    dong('Không qua trung gian · không ăn hoa hồng', 432, 26, 'Medium', MAU.sangToi);
}));

doc.close(SaveOptions.DONOTSAVECHANGES);
kq.join(' | ');
