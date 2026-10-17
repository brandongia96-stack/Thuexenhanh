// Thử 2 lệnh menu dùng trong skill thiet-ke-logo: gộp shape + nét→vùng tô. File tạm, đóng không lưu.
var doc = app.documents.add(DocumentColorSpace.RGB, 300, 300);
var a = doc.pathItems.rectangle(250, 50, 60, 200);
var b = doc.pathItems.ellipse(250, 50, 200, 200);
var g = doc.groupItems.add(); a.moveToBeginning(g); b.moveToBeginning(g);
doc.selection = null; g.selected = true;
app.executeMenuCommand('Live Pathfinder Add'); app.executeMenuCommand('expandStyle');
var sauGop = doc.selection.length + ' doi tuong, loai ' + doc.selection[0].typename;
var l = doc.pathItems.add(); l.setEntirePath([[20, 20], [280, 20]]);
l.filled = false; l.stroked = true; l.strokeWidth = 30; l.strokeCap = StrokeCap.ROUNDENDCAP;
doc.selection = null; l.selected = true;
app.executeMenuCommand('OffsetPath v22');
var s = doc.selection[0];
var sauOutline = s.typename + ' filled=' + s.filled + ' stroked=' + s.stroked;
doc.close(SaveOptions.DONOTSAVECHANGES);
'gop: ' + sauGop + ' | outline: ' + sauOutline;
