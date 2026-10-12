# backup-master.ps1 - Nhan ban TOAN BO thu muc du an + nen zip, giu toi da 3 ban.
#
# Chay:  powershell -ExecutionPolicy Bypass -File scripts\backup-master.ps1
# Anh nhan "backup" trong luong nen tang la chay script nay.
#
# Ket qua (nam NGOAI thu muc du an, canh no):
#   ..\_Backup master\Webthuexe-Claude_yyyy-MM-dd_HHmm\      <- ban nhan doi, mo ra dung ngay
#   ..\_Backup master\Webthuexe-Claude_yyyy-MM-dd_HHmm.zip   <- ban nen cua chinh thu muc do
#
# Co ca .git (toan bo lich su), .env, _archive, _scratch.
# Bo qua 3 thu KHONG phai ma nguon, tao lai duoc:
#   node_modules  (npm install la co lai)
#   dist          (npm run build la co lai)
#   _backup       (cac ban zip cu cua scripts\backup.ps1 - backup long backup)
#
# Khac voi scripts\backup.ps1: file do la anh chup nhanh truoc moi phien sua
# (khong co .git, giu 20 ban). File nay la ban sao DAY DU de phuc hoi ca du an.

$ErrorActionPreference = "Stop"

$GIU_TOI_DA = 3
$BO_QUA = @("node_modules", "dist", "_backup")

$root = Split-Path -Parent $PSScriptRoot
$ten = Split-Path -Leaf $root
$dich = Join-Path (Split-Path -Parent $root) "_Backup master"
$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$banSao = Join-Path $dich "${ten}_$stamp"
$zip = "$banSao.zip"

if (-not (Test-Path $dich)) { New-Item -ItemType Directory -Path $dich | Out-Null }
if (Test-Path $banSao) { throw "Da co ban sao trong phut nay: $banSao" }

Write-Host "Nhan ban: $root"
Write-Host "    ->    $banSao"

# 1. Nhan ban. robocopy: nhanh, chiu duoc duong dan dai, giu ngay gio file.
#    Ma thoat < 8 la thanh cong (1 = da chep, 0 = khong co gi moi).
$thamSo = @($root, $banSao, "/E", "/R:1", "/W:1", "/NFL", "/NDL", "/NJH", "/NP", "/XD") + $BO_QUA
& robocopy @thamSo | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy loi, ma $LASTEXITCODE" }

# 2. Nen bang .NET ZipFile. (tar.exe cua Windows sap 0xC0000005 voi thu muc nay;
#    Compress-Archive thi cham va hong voi file > 2 GB.)
Write-Host "Nen zip..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $banSao, $zip, [System.IO.Compression.CompressionLevel]::Optimal, $true)

$soFile = (Get-ChildItem -Path $banSao -Recurse -File -Force | Measure-Object).Count
$mbThuMuc = [math]::Round(((Get-ChildItem -Path $banSao -Recurse -File -Force | Measure-Object Length -Sum).Sum) / 1MB, 0)
$mbZip = [math]::Round((Get-Item $zip).Length / 1MB, 0)

# 3. Chi giu $GIU_TOI_DA ban moi nhat (ten co dau thoi gian nen xep theo ten la dung).
$mau = "${ten}_????-??-??_????"
$cu = Get-ChildItem -Path $dich -Directory -Filter $mau | Sort-Object Name -Descending | Select-Object -Skip $GIU_TOI_DA
foreach ($d in $cu) {
    Remove-Item -LiteralPath $d.FullName -Recurse -Force
    Write-Host "Da xoa ban cu: $($d.Name)"
}
$zipCu = Get-ChildItem -Path $dich -File -Filter "$mau.zip" | Sort-Object Name -Descending | Select-Object -Skip $GIU_TOI_DA
foreach ($z in $zipCu) {
    Remove-Item -LiteralPath $z.FullName -Force
    Write-Host "Da xoa zip cu: $($z.Name)"
}

Write-Host ""
Write-Host "OK - $soFile file"
Write-Host "     Thu muc: $banSao  ($mbThuMuc MB)"
Write-Host "     Zip:     $zip  ($mbZip MB)"
Write-Host "     Dang giu: $((Get-ChildItem -Path $dich -Directory -Filter $mau).Count) / $GIU_TOI_DA ban"
