// Thử xuất: tạo file 512×512, vẽ ô bo góc màu --m-green (#3b82f6), xuất PNG, đóng không lưu.
var doc = app.documents.add(DocumentColorSpace.RGB, 512, 512);
var c = new RGBColor(); c.red = 59; c.green = 130; c.blue = 246;
var o = doc.pathItems.roundedRectangle(456, 56, 400, 400, 48, 48);
o.fillColor = c; o.stroked = false;
var dich = new File(Folder(File($.fileName).parent.parent).fsName + '/xuat/_thu-ai.png');
var opt = new ExportOptionsPNG24(); opt.artBoardClipping = true; opt.transparency = true;
doc.exportFile(dich, ExportType.PNG24, opt);
doc.close(SaveOptions.DONOTSAVECHANGES);
dich.fsName;
