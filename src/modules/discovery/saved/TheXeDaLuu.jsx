// Đã gộp vào thẻ xe dùng chung của luồng 04: `discovery/the-xe/TheXe.jsx`.
// Giữ file này làm lớp trỏ sang đó vì `shell/TrangChu.jsx` (luồng 14) và
// `TrangDaLuu.jsx` còn import đường dẫn cũ. Hai nơi đó đổi import xong thì xoá file này.
export { default } from '../the-xe/TheXe'
