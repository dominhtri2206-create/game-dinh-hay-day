# 📈 ĐỈNH HAY ĐÁY? - Sàn Đấu Đầu Tư Siêu Tốc

Web game mô phỏng giao dịch đầu tư tài chính (Cổ phiếu Trà Sữa **TRS** và Lan Đột Biến **LAN**) với cơ chế chu kỳ kinh tế và hệ thống Tin Nóng thời gian thực.

Xây dựng bằng **HTML, CSS và JavaScript thuần (Vanilla JS)**, vẽ biểu đồ đường giá theo thời gian thực bằng **HTML5 Canvas**, tối ưu hóa hiển thị và điều khiển mượt mà trên cả điện thoại di động và máy tính.

---

## 🎮 Tính năng nổi bật

1. **Giao diện Trading Terminal (Dark Mode)**:
   - Đồng hồ đếm ngược 180 giây (1 giây = 1 tick, chuẩn 1000ms).
   - Bảng theo dõi Tổng tài sản (Vốn ban đầu: 100.000.000 VNĐ), Tiền mặt, % Lời/Lỗ và Pha kinh tế hiện tại.
   - 2 mã tài sản đặc thù:
     - **TRS (Trà Sữa Quốc Dân)**: Cổ phiếu tăng trưởng vừa, biến động ổn định, phí giao dịch 0.1%.
     - **LAN (Lan Đột Biến 5 Cánh)**: Tài sản đầu cơ giật gân, biên độ dao động mạnh, phí giao dịch 0.15%.

2. **Hệ thống 2 khung Tin Nóng riêng biệt**:
   - **Khung TRS**: Chuyên cập nhật tin tức nội tại cổ phiếu Trà Sữa.
   - **Khung LAN**: Chuyên cập nhật tin tức đội lái, thổi giá hoặc thanh tra Lan Var.
   - **Tin Vĩ Mô**: Khi có sự kiện vĩ mô (lãi suất, kích cầu...), cả 2 khung sẽ hiển thị đồng loạt với viền đỏ phát sáng rực rỡ (`.macro-alert`).
   - Mỗi tin tức có nhãn độ tin cậy nguồn tin (**Báo chính thống / Chuyên gia / Tin đồn**) và thanh đếm ngược **4.5 giây** trước khi tác động trực tiếp vào đường giá.

3. **Màn hình chờ & Nút bắt đầu**:
   - Mở web ở trạng thái chờ: biểu đồ cố định ở giá tham chiếu, khóa toàn bộ nút lệnh.
   - Bấm **"BẮT ĐẦU GIAO DỊCH"** để mở khóa các nút và chính thức bước vào phiên đấu trí 180s.

4. **Bộ nút điều khiển ngón cái (Thumb-friendly)**:
   - Các nút lệnh to rõ: **MUA 25%**, **MUA 50%**, **ALL-IN**, **BÁN 50%**, **BÁN HẾT**.
   - Cơ chế cooldown chống spam lệnh 0.5s.
   - Đánh dấu trực tiếp điểm **MUA (▲)** và **BÁN (▼)** trên đường giá biểu đồ.

5. **Tổng kết ván & Hệ thống Danh hiệu**:
   - Kết thúc 180 giây: tự động tất toán danh mục và trao các danh hiệu hài hước:
     - 🦈 **Cá Mập Phố Wall** (> +500%)
     - 🚀 **Phù Thủy Đầu Tư** (+200% đến +500%)
     - 📈 **Nhà Đầu Tư Bản Lĩnh** (+50% đến +200%)
     - ☕ **Trader Trà Đá** (+10% đến +50%)
     - 🛡️ **Thần Giữ Của** (-10% đến +10%)
     - 📉 **F0 Lạc Lối** (-10% đến -40%)
     - 🤡 **Thợ Cắt Lỗ Chuyên Nghiệp** (-40% đến -70%)
     - 🧗 **Chiến Thần Đu Đỉnh** (< -70%)
   - Hỗ trợ sao chép thành tích khoe bạn bè và nút Chơi ván mới.

---

## 🛠️ Công nghệ sử dụng
- **HTML5**: Cấu trúc ngữ nghĩa, Semantic layout, HTML5 Canvas API.
- **CSS3**: Grid, Flexbox, Glassmorphism, CSS Custom Properties, Keyframe Animations.
- **Vanilla JavaScript**: Quản lý Game Loop, mô hình bước ngẫu nhiên (Geometric Brownian Motion + Regime Drift), tổng hợp âm thanh bằng Web Audio API thuần (không cần file âm thanh bên ngoài).

---

## 🚀 Cách chạy game
Mở trực tiếp file `index.html` bằng bất kỳ trình duyệt hiện đại nào (Chrome, Edge, Safari, Firefox) trên máy tính hoặc điện thoại di động.
