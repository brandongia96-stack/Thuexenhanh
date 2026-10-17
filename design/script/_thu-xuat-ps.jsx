// Thử xuất: tạo ảnh 800×450, tô nền --m-green-light, xuất WebP/JPG, đóng không lưu.
app.preferences.rulerUnits = Units.PIXELS;
var doc = app.documents.add(800, 450, 72, '_thu', NewDocumentMode.RGB, DocumentFill.WHITE);
var c = new SolidColor(); c.rgb.red = 239; c.rgb.green = 246; c.rgb.blue = 255;
doc.selection.selectAll(); doc.selection.fill(c); doc.selection.deselect();
var dich = new File(Folder(File($.fileName).parent.parent).fsName + '/xuat/_thu-ps.jpg');
var opt = new JPEGSaveOptions(); opt.quality = 9;
doc.saveAs(dich, opt, true, Extension.LOWERCASE);
doc.close(SaveOptions.DONOTSAVECHANGES);
dich.fsName;
