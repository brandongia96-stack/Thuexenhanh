# chay.ps1 - Chay mot file ExtendScript (.jsx) trong Photoshop hoac Illustrator tren may nay.
#
# Dung (luong 15 designer):
#   powershell -ExecutionPolicy Bypass -File scripts\adobe\chay.ps1 -App ps -Script design\script\xuat-logo.jsx
#   powershell -ExecutionPolicy Bypass -File scripts\adobe\chay.ps1 -App ai -Script design\script\ve-icon.jsx
#
# Ket qua: in ra gia tri dong cuoi cung cua script (vd. duong dan file vua xuat).
# Chua mo app thi Windows tu mo (Photoshop mat 20-40 giay lan dau).
#
# Vi sao dung COM + ExtendScript thay vi bam chuot: chinh xac tung pixel, lap lai
# duoc, xuat file dung kich thuoc/dinh dang - cai luong designer can de dua vao app.

param(
    [Parameter(Mandatory = $true)][ValidateSet('ps', 'ai')][string]$App,
    [Parameter(Mandatory = $true)][string]$Script
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$duongDan = if ([System.IO.Path]::IsPathRooted($Script)) { $Script } else { Join-Path $root $Script }
if (-not (Test-Path -LiteralPath $duongDan)) { throw "Khong thay script: $duongDan" }
$duongDan = (Resolve-Path -LiteralPath $duongDan).Path

if ($App -eq 'ps') {
    $ung = New-Object -ComObject Photoshop.Application
    # Tat hop thoai de script khong bi treo cho nguoi bam.
    $ung.DisplayDialogs = 3   # psDisplayNoDialogs
    $kq = $ung.DoJavaScriptFile($duongDan)
} else {
    $ung = New-Object -ComObject Illustrator.Application
    $ung.UserInteractionLevel = -1   # aiDontDisplayAlerts
    $kq = $ung.DoJavaScriptFile($duongDan)
}
Write-Output $kq
