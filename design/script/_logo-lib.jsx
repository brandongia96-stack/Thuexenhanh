// _logo-lib.jsx — Thư viện dựng logo Thuê Xe Nhanh trên lưới U (luồng 15 Designer).
// Hình cơ bản → Pathfinder; 7 chữ t h u e x n a; các icon chữ n; tiện ích đặt / tô màu / vẽ lưới trên artboard.
// Không tự chạy: script khác `#include "_logo-lib.jsx"`, rồi tạo doc + các lớp lopNen/lopLuoi/lopDung/lopLogo/lopChu và gán AB.

app.coordinateSystem = CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
var THU_MUC = File($.fileName).parent.parent; // design/
var K = 0.5523; // tay nắm Bézier cho ¼ cung tròn

function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0, 2), 16); c.green = parseInt(hex.substr(2, 2), 16); c.blue = parseInt(hex.substr(4, 2), 16); return c; }
var MAU = {
    navy: rgb('0B2E6F'), chinh: rgb('2563EB'), sang: rgb('3B82F6'), nhat: rgb('EFF6FF'), sangToi: rgb('93C5FD'),
    den: rgb('141414'), vua: rgb('4B4F56'), mo: rgb('8A8F9A'), trang: rgb('FFFFFF'), nen: rgb('F5F5F7'), vien: rgb('E8E8EC'),
    luoi: rgb('D9DCE2'), luoiDam: rgb('B9BEC7')
};

// ---------- Lưới chữ (đơn vị U = độ dày nét đứng) ----------
var X = 4;      // x-height
var ASC = 5.5;  // chữ h
var TT = 5;     // chữ t
var H = 0.9;    // nét ngang = 90% nét đứng (chỉnh thị giác)
var O = 0.08;   // overshoot chữ tròn = 2% x-height

// ---------- Hình học cơ bản ----------
function pt(c, x, y) { var q = c.tf ? c.tf(x, y) : [x, y]; return [c.ox + q[0] * c.s, c.oy + q[1] * c.s]; }
function sao(c) { var o = {}; for (var k in c) o[k] = c[k]; return o; }
function donVi(x, y) { var d = Math.sqrt(x * x + y * y); return [x / d, y / d]; }
function gan(a, b) { return Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6; }

function kieuNet(c, p) {
    if (c.mode == 'fill') { p.filled = true; p.fillColor = MAU.den; p.stroked = false; return; }
    p.filled = false; p.stroked = true;
    if (c.mode == 'vong') { p.strokeColor = MAU.sang; p.strokeWidth = 0.75; p.strokeDashes = [3, 3]; }
    else { p.strokeColor = MAU.vua; p.strokeWidth = 0.9; }
}

function taoPath(c, an, kin) {
    var p = c.L.pathItems.add();
    for (var i = 0; i < an.length; i++) {
        var q = p.pathPoints.add(), a = an[i].a, l = an[i].l || a, r = an[i].r || a;
        q.anchor = pt(c, a[0], a[1]); q.leftDirection = pt(c, l[0], l[1]); q.rightDirection = pt(c, r[0], r[1]);
    }
    p.closed = kin; kieuNet(c, p);
    return p;
}

// Đa giác vuông góc, mỗi góc một bán kính: [[x, y, r]] hoặc [[x, y, rx, ry]] (góc lồi lẫn góc lõm).
function rpoly(c, pts) {
    var n = pts.length, an = [], vong = [];
    for (var i = 0; i < n; i++) {
        var P = pts[i], A = pts[(i + n - 1) % n], B = pts[(i + 1) % n];
        var rx = P[2] || 0, ry = (P.length > 3) ? P[3] : rx;
        if (!rx) { an.push({ a: [P[0], P[1]] }); continue; }
        var dA = donVi(A[0] - P[0], A[1] - P[1]), dB = donVi(B[0] - P[0], B[1] - P[1]);
        var rA = Math.abs(dA[0]) > 0.5 ? rx : ry, rB = Math.abs(dB[0]) > 0.5 ? rx : ry;
        var T1 = [P[0] + dA[0] * rA, P[1] + dA[1] * rA], T2 = [P[0] + dB[0] * rB, P[1] + dB[1] * rB];
        an.push({ a: T1, l: T1, r: [T1[0] + (P[0] - T1[0]) * K, T1[1] + (P[1] - T1[1]) * K] });
        an.push({ a: T2, l: [T2[0] + (P[0] - T2[0]) * K, T2[1] + (P[1] - T2[1]) * K], r: T2 });
        if (c.vong && rx >= 0.45 && rx == ry) vong.push([P[0] + dA[0] * rA + dB[0] * rB, P[1] + dA[1] * rA + dB[1] * rB, rx]);
    }
    var ra = [];
    for (var j = 0; j < an.length; j++) {
        var cu = ra.length ? ra[ra.length - 1] : null;
        if (cu && gan(cu.a, an[j].a)) { cu.r = an[j].r; continue; }
        ra.push(an[j]);
    }
    if (ra.length > 1 && gan(ra[0].a, ra[ra.length - 1].a)) { ra[0].l = ra[ra.length - 1].l; ra.pop(); }
    var p = taoPath(c, ra, true);
    for (var v = 0; v < vong.length; v++) { var cv = sao(c); cv.mode = 'vong'; cv.vong = false; elip(cv, vong[v][0] - vong[v][2], vong[v][1] - vong[v][2], vong[v][0] + vong[v][2], vong[v][1] + vong[v][2]); }
    return p;
}
function rrect(c, x0, y0, x1, y1, rs) {
    var r = (typeof rs == 'number') ? [rs, rs, rs, rs] : rs, m = Math.min((x1 - x0) / 2, (y1 - y0) / 2);
    return rpoly(c, [[x0, y0, Math.min(r[0], m)], [x1, y0, Math.min(r[1], m)], [x1, y1, Math.min(r[2], m)], [x0, y1, Math.min(r[3], m)]]);
}
function elip(c, x0, y0, x1, y1) {
    var rx = (x1 - x0) / 2, ry = (y1 - y0) / 2, c2 = sao(c); c2.vong = false;
    return rpoly(c2, [[x0, y0, rx, ry], [x1, y0, rx, ry], [x1, y1, rx, ry], [x0, y1, rx, ry]]);
}
function chon(it) { app.activeDocument.selection = null; it.selected = true; }
// Nét có độ dày → Outline Stroke thành vùng tô.
function net(c, an, w, dau) {
    var p = taoPath(c, an, false);
    if (c.mode != 'fill') return p;
    p.filled = false; p.stroked = true; p.strokeColor = MAU.den; p.strokeWidth = w * c.s; p.strokeCap = dau; p.strokeJoin = StrokeJoin.ROUNDENDJOIN;
    chon(p); app.executeMenuCommand('OffsetPath v22');
    return app.activeDocument.selection[0];
}
function pf(c, ds, lenh) {
    if (ds.length == 1) return ds[0];
    var g = c.L.groupItems.add();
    for (var i = 0; i < ds.length; i++) ds[i].move(g, ElementPlacement.PLACEATBEGINNING); // phần tử đầu nằm dưới cùng
    chon(g);
    app.executeMenuCommand(lenh); app.executeMenuCommand('expandStyle');
    // Cắt ra nhiều mảnh (vd. chữ n có khe) thì Expand có thể để các mảnh rời nhau → gom lại một nhóm.
    var sel = app.activeDocument.selection, manh = [];
    for (var j = 0; j < sel.length; j++) manh.push(sel[j]);
    if (manh.length == 1) return manh[0];
    var g2 = c.L.groupItems.add();
    for (j = 0; j < manh.length; j++) manh[j].move(g2, ElementPlacement.PLACEATEND);
    return g2;
}

// Cây dựng hình: lá = hàm vẽ; nút = {op: 'cong'|'tru', k: [...], tf?}
function HR(x0, y0, x1, y1, rs) { return function (c) { return rrect(c, x0, y0, x1, y1, rs); }; }
function HE(x0, y0, x1, y1) { return function (c) { return elip(c, x0, y0, x1, y1); }; }
function HP(pts) { return function (c) { return rpoly(c, pts); }; }
function HN(an, w, dau) { return function (c) { return net(c, an, w, dau); }; }
function cong() { return { op: 'cong', k: Array.prototype.slice.call(arguments) }; }
function tru() { return { op: 'tru', k: Array.prototype.slice.call(arguments) }; }
function dung(c, nut) {
    if (typeof nut == 'function') return nut(c);
    var cc = c;
    if (nut.tf) { cc = sao(c); cc.tf = nut.tf; }
    var ds = [];
    for (var i = 0; i < nut.k.length; i++) ds.push(dung(cc, nut.k[i]));
    if (c.mode != 'fill') return ds;
    return pf(cc, ds, nut.op == 'cong' ? 'Live Pathfinder Add' : 'Live Pathfinder Subtract');
}

// ---------- 7 chữ: t h u e x n a ----------
// G = { rt: bán kính đầu nét, khia: có khía chỗ vòm nối thân (kiểu chữ đậm hiện đại) }
function gN(G, cao, tf) { // n (cao = X), h (cao = ASC), u = n xoay 180°
    var w = 3.5, rt = G.rt, Yb = 1.5, vom, ruot;
    var than = HR(0, 0, 1, cao, [rt, rt, rt, rt]);
    var chan = HR(w - 1, 0, w, 2, [rt, rt, 0, 0]);
    if (G.khia) { // vòm mọc từ giữa thân → khía chữ V nhỏ, chỗ nối mảnh lại
        vom = HP([[0.5, Yb], [w, Yb], [w, X + O, 1.5], [1, X + O, 0.8], [1, X - 1.2], [0.5, X - 1.2]]);
        ruot = HR(1, Yb - 1, w - 1, X + O - H, [0, 0, 0.5, 0.5]);
    } else {
        vom = HP([[0.5, Yb], [w, Yb], [w, X, 1.5], [0.5, X]]);
        ruot = HR(1, Yb - 1, w - 1, X - H, [0, 0, 0.5, 0.3]);
    }
    var nut = cong(than, chan, tru(vom, ruot));
    if (tf) nut.tf = tf;
    return { w: w, nut: nut };
}
function gU(G) { return gN(G, X, function (x, y) { return [3.5 - x, X - y]; }); }
function gE(G) {
    var w = 3.7;
    var vanh = tru(HE(0, -O, w, X + O), HE(1.05, -O + H, w - 1.05, X + O - H)); // nét cong dày 1,05U (cong trông mảnh hơn)
    return { w: w, nut: tru(cong(vanh, HR(0.6, 1.6, w - 0.6, 2.4, 0)), HR(2, 0.92, w + 0.5, 1.6, 0)) };
}
function gX(G) {
    var w = 3.3;
    if (G.tron) { var r = 0.475; return { w: w, nut: cong(HN([{ a: [r, r] }, { a: [w - r, X - r] }], 0.95, StrokeCap.ROUNDENDCAP), HN([{ a: [r, X - r] }, { a: [w - r, r] }], 0.95, StrokeCap.ROUNDENDCAP)) }; }
    var b = 1.086; // nét chéo dày 0,95U đo vuông góc
    return { w: w, nut: cong(HP([[0, 0], [b, 0], [w, X], [w - b, X]]), HP([[w - b, 0], [w, 0], [b, X], [0, X]])) };
}
function gA(G) {
    var w = 3.6, rt = G.rt;
    return { w: w, nut: cong(tru(HE(0, -O, 3.3, X + O), HE(1.05, -O + H, 2.6, X + O - H)), HR(2.6, 0, w, X, [rt, rt, rt, rt])) };
}
function gT(G) {
    var rt = G.rt, rb = G.tron ? 0.45 : rt;
    return { w: 2.65, nut: cong(
        HP([[0.55, 0, 1], [2.65, 0, rb], [2.65, 0.9, rb], [1.55, 0.9, 0.35], [1.55, TT, rt], [0.55, TT, rt]]),
        HR(0, X - 0.9, 2.65, X, rb)) };
}
// Khoảng cách theo mắt: đứng–đứng 0,75U, đứng–tròn 0,6U, chéo–tròn 0,45U
var KHOANG = [0.55, 0.75, 0.6, 0.45, 0.45, 0.6, 0.75, 0.6, 0.75, 0.75];
function dungChu(L, G, ox, oy, s) {
    var gl = [gT(G), gN(G, ASC), gU(G), gE(G), gX(G), gE(G), G.nKhe ? gNKhe(G) : gN(G, X), gN(G, ASC), gA(G), gN(G, X), gN(G, ASC)];
    var x = 0, ds = [];
    for (var i = 0; i < gl.length; i++) {
        ds.push(dung({ L: L, ox: ox + x * s, oy: oy, s: s, mode: 'fill' }, gl[i].nut));
        x += gl[i].w + (i < KHOANG.length ? KHOANG[i] : 0);
    }
    var c0 = { L: L, ox: ox, oy: oy, s: s, mode: 'fill' };
    var a = pf(c0, ds.slice(0, 6), 'Live Pathfinder Add'); a.name = 'thuexe';
    var b = pf(c0, ds.slice(6), 'Live Pathfinder Add'); b.name = 'nhanh';
    return { a: a, b: b, w: x };
}

// ---------- 3 icon chữ n ----------
// Chữ n có khe chéo 45° mọc từ góc ruột, tách thân và vòm (phương án A). Dùng cho icon lẫn chữ n đầu của "nhanh".
function nKhe(rt) {
    var w = 3.5;
    var than = HR(0, 0, 1, X, [rt, rt, 0, rt]), chan = HR(w - 1, 0, w, 2, [rt, rt, 0, 0]);
    var vom = HP([[0.5, 1.5], [w, 1.5], [w, X, 1.5], [0.5, X]]), ruot = HR(1, 0.5, w - 1, X - H, [0, 0, 0.5, 0]);
    var d = [0.7071, 0.7071], b = 0.4, t = 1.9, L0 = [1, X - H], R0 = [L0[0] + 0.7071 * b, L0[1] - 0.7071 * b];
    var khe = HP([L0, R0, [R0[0] + d[0] * t, R0[1] + d[1] * t], [L0[0] + d[0] * t, L0[1] + d[1] * t]]);
    return tru(cong(than, chan, tru(vom, ruot)), khe);
}
function gNKhe(G) { return { w: 3.5, nut: nKhe(G.rt) }; }
function iconA() {
    return { w: 3.5, h: X, nut: nKhe(0.15), phu: [],
        spec: 'U = {U} pt  ·  cao 4U  ·  nét 1U  ·  vai R 1,5U  ·  ruột R 0,5U  ·  khe 0,4U nghiêng 45° từ góc ruột' };
}
// Đường gồm các đoạn thẳng / cung (cung đi theo chiều kim đồng hồ). Trả về cách lấy điểm & cắt đoạn.
function duongDi(segs) {
    var tong = 0;
    for (var i = 0; i < segs.length; i++) { var g = segs[i]; g.s0 = tong; g.len = g.c ? Math.abs(g.a0 - g.a1) * g.r : Math.sqrt(Math.pow(g.p1[0] - g.p0[0], 2) + Math.pow(g.p1[1] - g.p0[1], 2)); tong += g.len; }
    function diem(g, s) {
        var u = (s - g.s0) / g.len;
        if (!g.c) return [g.p0[0] + (g.p1[0] - g.p0[0]) * u, g.p0[1] + (g.p1[1] - g.p0[1]) * u];
        var th = g.a0 + (g.a1 - g.a0) * u; return [g.c[0] + g.r * Math.cos(th), g.c[1] + g.r * Math.sin(th)];
    }
    function doan(s0, s1) { // anchor của đoạn [s0, s1]
        var an = [];
        for (var i = 0; i < segs.length; i++) {
            var g = segs[i], a = Math.max(s0, g.s0), b = Math.min(s1, g.s0 + g.len);
            if (b - a < 1e-6) continue;
            var pA = { a: diem(g, a) }, pB = { a: diem(g, b) };
            if (g.c) {
                var ta = g.a0 + (g.a1 - g.a0) * (a - g.s0) / g.len, tb = g.a0 + (g.a1 - g.a0) * (b - g.s0) / g.len;
                var h = 4 / 3 * Math.tan(Math.abs(ta - tb) / 4) * g.r; // cung đi chiều kim đồng hồ: tiếp tuyến (sinθ, −cosθ)
                pA.r = [pA.a[0] + Math.sin(ta) * h, pA.a[1] - Math.cos(ta) * h];
                pB.l = [pB.a[0] - Math.sin(tb) * h, pB.a[1] + Math.cos(tb) * h];
            }
            if (an.length && gan(an[an.length - 1].a, pA.a)) { if (pA.r) an[an.length - 1].r = pA.r; } else an.push(pA);
            an.push(pB);
        }
        return an;
    }
    return { tong: tong, doan: doan };
}
function iconB() { // Con đường: chữ n một nét đầu tròn, vai phải rộng như khúc cua, vạch đứt giữa đường
    var sw = 1.5, Lx = 0.75, r1 = 0.75, r2 = 1.5, Rx = 3.5, dinh = X - 0.75, y0 = 0.75;
    var dd = duongDi([
        { p0: [Lx, y0], p1: [Lx, dinh - r1] },
        { c: [Lx + r1, dinh - r1], r: r1, a0: Math.PI, a1: Math.PI / 2 },
        { p0: [Lx + r1, dinh], p1: [Rx - r2, dinh] },
        { c: [Rx - r2, dinh - r2], r: r2, a0: Math.PI / 2, a1: 0 },
        { p0: [Rx, dinh - r2], p1: [Rx, y0] }]);
    var duong = HN(dd.doan(0, dd.tong), sw, StrokeCap.ROUNDENDCAP);
    // vạch đứt: 6 vạch 0,55U, hở 0,42U, căn giữa chiều dài đường
    var nV = 6, dv = 0.55, hv = 0.42, batDau = (dd.tong - (nV * dv + (nV - 1) * hv)) / 2, vach = [];
    for (var v = 0; v < nV; v++) { var s0 = batDau + v * (dv + hv); vach.push(HN(dd.doan(s0, s0 + dv), 0.28, StrokeCap.BUTTENDCAP)); }
    var c2 = [Rx - r2, dinh - r2], c1 = [Lx + r1, dinh - r1];
    return { w: Rx + Lx, h: X, nut: tru(duong, { op: 'cong', k: vach }),
        phu: [HE(c2[0] - 2.25, c2[1] - 2.25, c2[0] + 2.25, c2[1] + 2.25), HE(c2[0] - 0.75, c2[1] - 0.75, c2[0] + 0.75, c2[1] + 0.75), HE(c2[0] - 1.5, c2[1] - 1.5, c2[0] + 1.5, c2[1] + 1.5),
            HE(c1[0] - 1.5, c1[1] - 1.5, c1[0] + 1.5, c1[1] + 1.5)],
        spec: 'U = {U} pt  ·  cao 4U  ·  nét đường 1,5U đầu tròn  ·  vai phải R 1,5U, góc trái R 0,75U (tâm nét)  ·  vạch 0,28U × 0,55U' };
}
// Khối app: chữ n âm bản (cắt thủng) trong khối vuông 6,5U bo 12%, nghiêng `goc` độ.
function iconKhoi(chuN, goc, spec) {
    var S = 6.5, w = 3.5, dx = (S - w) / 2, dy = (S - X) / 2, tg = Math.tan(goc * Math.PI / 180);
    chuN.tf = function (x, y) { return [x + (y - X / 2) * tg + dx, y + dy]; };
    return { w: S, h: S, nut: tru(HR(0, 0, S, S, 0.78), chuN), phu: [], spec: spec };
}
function iconC() {
    var w = 3.5, rt = 0.1;
    var chuN = cong(HR(0, 0, 1, X, [rt, rt, 0, rt]), HR(w - 1, 0, w, 2, [rt, rt, 0, 0]),
        tru(HP([[0.5, 1.5], [w, 1.5], [w, X, 1.5], [0.5, X]]), HR(1, 0.5, w - 1, X - H, [0, 0, 0.5, 0.3])));
    return iconKhoi(chuN, 10, 'U = {U} pt  ·  khối 6,5U bo 0,78U (12%)  ·  chữ n cao 4U, nét 1U  ·  nghiêng 10°');
}

// ---------- Tiện ích trên artboard (doc, các lớp lop* và AB do script gọi tạo) ----------
var AB; // [trái, trên, phải, dưới] của artboard đang vẽ
function SX(x) { return AB[0] + x; }
function SY(y) { return AB[1] - y; }
function oNen(x, y, w, h, mau) { var r = lopNen.pathItems.rectangle(SY(y), SX(x), w, h); r.fillColor = mau; r.stroked = false; return r; }
function vach(L, x0, y0, x1, y1, mau, w) { var p = L.pathItems.add(); p.setEntirePath([[x0, y0], [x1, y1]]); p.filled = false; p.stroked = true; p.strokeColor = mau; p.strokeWidth = w; return p; }
function chu(s, x, y, co, font, mau, gian) {
    var t = lopChu.textFrames.add(); t.contents = s;
    var ca = t.textRange.characterAttributes;
    ca.textFont = app.textFonts.getByName('PlusJakartaSans-' + font); ca.size = co; ca.fillColor = mau; if (gian) ca.tracking = gian;
    t.position = [SX(x), SY(y)];
    return t;
}
function to(it, mau) {
    if (it.typename == 'GroupItem') { for (var i = 0; i < it.pageItems.length; i++) to(it.pageItems[i], mau); }
    else if (it.typename == 'CompoundPathItem') { for (var j = 0; j < it.pathItems.length; j++) to(it.pathItems[j], mau); }
    else if (it.typename == 'PathItem') { it.filled = true; it.fillColor = mau; it.stroked = false; }
}
function phan(g, ten) { return g.pageItems.getByName(ten); }
function toLogo(g, mIcon, mA, mB) { to(phan(g, 'icon'), mIcon); to(phan(g, 'thuexe'), mA); to(phan(g, 'nhanh'), mB); }
// Đặt bản sao vào giữa (cx, cy) màn hình, theo rộng hoặc cao; bám điểm ảnh nguyên.
function dat(it, cx, cy, rong, cao) {
    var b = it.geometricBounds, w = b[2] - b[0], h = b[1] - b[3], k = rong ? rong / w : cao / h;
    it.resize(k * 100, k * 100);
    b = it.geometricBounds;
    it.translate(SX(cx) - (b[0] + b[2]) / 2, SY(cy) - (b[1] + b[3]) / 2);
    b = it.geometricBounds;
    it.translate(Math.round(b[0]) - b[0], Math.round(b[1]) - b[1]);
    return it;
}
function banSao(it) { return it.duplicate(lopLogo, ElementPlacement.PLACEATBEGINNING); }
function khoiApp(icon, cx, cy, size) { // icon trắng trên khối xanh bo 12%
    var r = lopLogo.pathItems.roundedRectangle(SY(cy - size / 2), SX(cx - size / 2), size, size, size * 0.12, size * 0.12);
    r.fillColor = MAU.chinh; r.stroked = false;
    var n = banSao(icon); to(n, MAU.trang); dat(n, cx, cy, null, size * 0.56);
}

function dungLogo(P, ic, ox, oy, s) {
    var iItem = dung({ L: lopLogo, ox: ox, oy: oy + P.dy * s, s: s * P.ki, mode: 'fill' }, ic.nut); iItem.name = 'icon';
    var ch = dungChu(lopLogo, P.G, ox + (ic.w * P.ki + P.gap) * s, oy, s);
    var g = lopLogo.groupItems.add();
    ch.b.move(g, ElementPlacement.PLACEATBEGINNING); ch.a.move(g, ElementPlacement.PLACEATBEGINNING); iItem.move(g, ElementPlacement.PLACEATBEGINNING);
    g.name = 'logo-' + P.ten;
    return g;
}

function veLuoi(P, ic, cx, cy) {
    var sg = P.sg, w = ic.w, h = ic.h, ox = SX(cx) - w * sg / 2, oy = SY(cy) - h * sg / 2;
    var c = { L: lopLuoi, ox: ox, oy: oy, s: sg };
    for (var k = -2; k <= Math.ceil(w * 2) + 2; k++) { var a = pt(c, k / 2, -1), b = pt(c, k / 2, h + 1); vach(lopLuoi, a[0], a[1], b[0], b[1], k % 2 ? MAU.luoi : MAU.luoiDam, k % 2 ? 0.4 : 0.6); }
    for (k = -2; k <= Math.ceil(h * 2) + 2; k++) { var a2 = pt(c, -1, k / 2), b2 = pt(c, w + 1, k / 2); vach(lopLuoi, a2[0], a2[1], b2[0], b2[1], k % 2 ? MAU.luoi : MAU.luoiDam, k % 2 ? 0.4 : 0.6); }
    var day = [0, h]; // đường cơ sở + đỉnh
    for (k = 0; k < 2; k++) { var a3 = pt(c, -1.6, day[k]), b3 = pt(c, w + 1.6, day[k]); vach(lopLuoi, a3[0], a3[1], b3[0], b3[1], MAU.sang, 0.9); }
    // bản tô mờ + nét dựng hình + đường tròn bán kính
    var nen = dung({ L: lopDung, ox: ox, oy: oy, s: sg, mode: 'fill' }, ic.nut); to(nen, MAU.chinh); nen.opacity = 16;
    dung({ L: lopDung, ox: ox, oy: oy, s: sg, mode: 'net', vong: true }, ic.nut);
    for (var i = 0; i < ic.phu.length; i++) ic.phu[i]({ L: lopDung, ox: ox, oy: oy, s: sg, mode: 'vong' });
    // thước 1U dưới thân trái
    var u0 = pt(c, 0, -0.55), u1 = pt(c, 1, -0.55);
    if (P.khoi) { u0 = pt(c, 0, -0.55); u1 = pt(c, 1, -0.55); }
    vach(lopLuoi, u0[0], u0[1], u1[0], u1[1], MAU.den, 1);
    vach(lopLuoi, u0[0], u0[1] - 5, u0[0], u0[1] + 5, MAU.den, 1); vach(lopLuoi, u1[0], u1[1] - 5, u1[0], u1[1] + 5, MAU.den, 1);
    var tu = lopChu.textFrames.add(); tu.contents = 'U';
    tu.textRange.characterAttributes.textFont = app.textFonts.getByName('PlusJakartaSans-Bold'); tu.textRange.characterAttributes.size = 13; tu.textRange.characterAttributes.fillColor = MAU.den;
    tu.position = [(u0[0] + u1[0]) / 2 - 4, u0[1] - 8];
}

