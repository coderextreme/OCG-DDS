# Trình Soạn Thảo Đồ Thị Phân Tán Hỗ Trợ Object-Capability & Tiếp Cận (Tiếng Việt)

**Dự án:** Lattice · **Mã nguồn:** <https://github.com/coderextreme/OCG-DDS> · **Liên hệ:** `yottzumm@gmail.com`

Ứng dụng được xây dựng nhanh chóng với sự hỗ trợ của AI. Tác giả chưa đọc được chữ nổi Braille hay SignWriting và rất mong nhận được phản hồi hoặc sự đồng hành từ cộng đồng người khiếm thị, điếc-mù và người Điếc.

## Tính Năng Tiếp Cận
- **Trình đọc màn hình & bàn phím:** `Alt+1`–`Alt+4` chuyển mô-đun, `Alt+E` mở bảng nhập liệu, `ArrowLeft`/`ArrowRight`/`Home`/`End`, `?` mở hướng dẫn phím tắt và vùng `aria-live`.
- **Chữ nổi Braille:** Bộ đệm 40 ô (**Show Dots** `⠁`–`⠿`) và nhập liệu Perkins 6 điểm (`F D S` / `J K L`).
- **Protactile (PT):** Không phụ thuộc âm thanh, chế độ **High Contrast**, vùng chạm (`Zone A/B/C`) và nhịp rung (**Pulse Haptics**).
- **Ngôn ngữ ký hiệu & SignWriting:** Hỗ trợ **ASL** và **SignWriting** (`FSW`, `Unicode SWU`, khung SVG 2D) cho mọi ngôn ngữ ký hiệu quốc tế hoặc tùy chỉnh.

## Cài Đặt
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
*(Dữ liệu hiện chỉ lưu tạm trong bộ nhớ trình duyệt; mã nguồn cần được kiểm tra bảo mật.)*
