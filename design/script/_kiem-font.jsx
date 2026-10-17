// Kiểm Illustrator nhận font Plus Jakarta Sans chưa (không tạo/sửa file).
var ds = [];
for (var i = 0; i < app.textFonts.length; i++) { var f = app.textFonts[i]; if (/Jakarta/i.test(f.name)) ds.push(f.name); }
app.name + ' ' + app.version + ' | ' + (ds.length ? ds.join(', ') : 'KHONG THAY Jakarta');
