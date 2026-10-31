# NỐT

Ứng dụng cá nhân của một người dùng tại Đà Nẵng, dùng trên Samsung A56. Mục tiêu là chọn quán ăn/nước hợp gu, giá, vị trí và tần suất dựa trên trải nghiệm đã ghi, với số liệu trực quan. Không có nội dung marketing, tài khoản, mạng xã hội hay số sao cộng đồng.

Người dùng đã biết chức năng: chỉ giữ dữ liệu, nhãn thao tác và lỗi/xác nhận cần thiết. Hướng dẫn thường trực và phiên bản không nằm trên giao diện. Giữ thương hiệu nền mực, xanh acid, tím nhạt và font Plus Jakarta Sans. Chuyển động có mục đích, có chế độ giảm chuyển động và không được che nội dung.

Web/PWA triển khai ở https://tuanthaidnc.github.io/drink-rate-a56/. Android là APK Capacitor chứa tài nguyên cục bộ, không chỉ mở trang từ xa; dùng cùng React, công thức và schema 13. APK yêu cầu tần số quét cao trong phạm vi thiết bị hỗ trợ, không bảo đảm 120 fps khi chưa đo máy thật. Bản Android là ứng dụng hybrid WebView, không phải viết lại UI bằng Compose.

Kho dữ liệu web và APK độc lập. Chuyển bằng JSON có ảnh/lịch sử/lượt ghé; không gỡ hay xóa bản Chrome để chuyển đổi. Không gửi dữ liệu lên đám mây và không tự động lấy GPS. Quyền vị trí chỉ yêu cầu từ thao tác GPS. Ảnh món/đồ uống gắn vào đánh giá quán, tối đa ba ảnh: chụp bằng camera hệ thống hoặc chọn từ thư viện, xem lớn và bỏ ảnh chưa lưu. Không có danh mục sản phẩm riêng. Ảnh được xoay đúng hướng, nén WebP tối đa 300 KB, bỏ EXIF/GPS; không tự lưu vào thư viện. Trước khi mở camera Android, giữ riêng bản đang nhập để khôi phục nếu hệ thống thu hồi tiến trình. Chỉ nút Lưu mới ghi đánh giá. Sao lưu dùng bộ chia sẻ Android. Giữ nguyên nguồn thô, dự phòng, đối chiếu Nốt Tea và công thức trọng số.

Phải kiểm tra nhiều độ rộng, hai giao diện sáng/tối, chữ lớn, bàn phím, nút Back, ngoại tuyến, nhập/xuất và cập nhật. Kiểm tra chuyển tab nhanh với animation bật; không coi reduced-motion hoặc build thành công là đủ chứng minh không chồng màn. Bằng chứng giả lập và máy thật phải được ghi rõ.
