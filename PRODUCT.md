# NỐT

Ứng dụng cá nhân của một người dùng tại Đà Nẵng, dùng trên Samsung A56. Mục tiêu là chọn quán ăn/nước hợp gu, giá, vị trí và tần suất dựa trên trải nghiệm đã ghi, với số liệu trực quan. Không có nội dung marketing, tài khoản, mạng xã hội hay số sao cộng đồng.

Người dùng đã biết chức năng: chỉ giữ dữ liệu, nhãn thao tác và lỗi/xác nhận cần thiết. Hướng dẫn thường trực và phiên bản không nằm trên giao diện. Giữ thương hiệu nền mực, xanh acid, tím nhạt và font Plus Jakarta Sans. Chuyển động có mục đích, có chế độ giảm chuyển động và không được che nội dung.

Web/PWA triển khai ở https://tuanthaidnc.github.io/drink-rate-a56/. Android là APK Capacitor chứa tài nguyên cục bộ, không chỉ mở trang từ xa; dùng cùng React, công thức và schema 13. APK yêu cầu tần số quét cao trong phạm vi thiết bị hỗ trợ, không bảo đảm 120 fps khi chưa đo máy thật. Bản Android là ứng dụng hybrid WebView, không phải viết lại UI bằng Compose.

Năm nơi đến là Quán xá, Bản đồ, Chấm điểm ở giữa, Nhật ký và Thống kê: dock năm ô trên điện thoại, rail trên desktop. Nhật ký duyệt các đánh giá đang có theo ngày Việt Nam, gồm ngày có ảnh và các ô ảnh/giờ/điểm/tên/giá; theo lựa chọn của chủ ứng dụng, không tạo kho ảnh mới cho từng lượt ghé.

Đánh giá mới bắt đầu bằng Mang về hoặc Tại quán. Mang về lấy GPS mới tại quán hoặc ghim tay → xác nhận vị trí → giữ bản nháp bền vững → chụp ở nhà khi tiếp tục → chọn loại trải nghiệm, nhập giá và ba/bốn slider → Lưu. Tọa độ quán đã khóa không bị GPS tại nhà ghi đè khi chụp, xóa ảnh hay chụp lại. Tại quán mở camera trực tiếp; sau ảnh mới thử GPS nền một lần, không chặn Lưu khi GPS lỗi. Tên quán/ghi chú tùy chọn; tên trống dùng loại quán và thời gian, không đoán địa điểm. Chỉ Lưu ghi đánh giá với thời gian hiện tại; không nhập ngày hoặc giờ mở cửa, không reverse geocode ngầm.

Camera trong ứng dụng có khung vuông: Android dùng CameraX với ViewPort 1:1 chung cho preview/capture, web dùng getUserMedia và crop vuông ở tâm. Bấm chụp trả thẳng về form, không có màn xác nhận camera hệ thống. Đánh giá mới cần một ảnh; bản cũ chưa có ảnh vẫn sửa/lưu được. Có thể chọn một ảnh từ thư viện, xem lớn, xóa hoặc chụp lại. Thay ảnh chỉ áp dụng sau khi ảnh mới thành công; hủy giữ nguyên ảnh và dữ liệu nhập. Xóa/chụp lại giữ giá, tiêu chí và vị trí quán đã khóa. Ảnh món/đồ uống thuộc đánh giá quán, không có danh mục sản phẩm riêng; mảng ảnh lịch sử được bảo toàn. Ảnh được xoay đúng hướng, nén WebP tối đa 300 KB, bỏ EXIF/GPS, không tự lưu vào thư viện.

Có thể giữ nhiều đánh giá chưa hoàn tất trong kho bản nháp riêng, kể cả ảnh. Giữ snapshot trước camera Android, khi nhập và khi đổi tab để khôi phục sau khi tiến trình bị thu hồi. Lưu hoặc chủ động bỏ chỉ xóa bản nháp khớp đánh giá đó. Đổi tab không hỏi bỏ thay đổi; sửa đánh giá cũ không tự mở camera hay định vị lại.

Dải chọn quán dùng ảnh đánh giá thật, chọn kết quả bằng trọng số trước rồi mới chạy dải ảnh giảm tốc trong 4,6 giây, tối đa 37 ô và dùng chung blob URL. Giảm chuyển động hoặc chỉ một ứng viên cho kết quả ngay. Ảnh có sẵn không tăng xác suất chọn; không có quán phù hợp thì giữ trạng thái rỗng. Chọn kết quả hoặc mở Maps không tự ghi lượt ghé/chi tiêu; ghi lượt ghé là thao tác riêng.

Khẩu phần áp dụng cho mọi quán ăn cũ/mới. Theo quyết định chủ ứng dụng ngày 02/11/2026, quán ăn cũ thiếu khẩu phần được gán Vừa (`medium`, 7 điểm) và tính lại tổng; giữ các tiêu chí gốc, giá, ngày, lượt ghé và ảnh. Ăn mang về: ngon 35%, chất lượng 20%, sạch 10%, giá 15%, khẩu phần 20%. Ăn tại quán: ngon 30%, chất lượng 20%, sạch 10%, không gian 10%, giá 10%, khẩu phần 20%. Bậc giá vẫn theo `foodType`; nước giữ công thức cũ. Điểm Lạp xưởng suy từ đầu vào ra 9,0, không gán cứng. Công thức ăn cũ chỉ phục vụ đọc bản thô trước chuẩn hóa dữ liệu.

Kho dữ liệu web và APK độc lập. Chuyển bằng JSON có ảnh/lịch sử/lượt ghé; không gỡ hay xóa bản Chrome để chuyển đổi. Không gửi đánh giá/ảnh lên đám mây. JSON xuất đánh giá không thay cho kho bản nháp; giữ bản dự phòng riêng trước chuyển đổi. Sao lưu trong APK dùng bộ chia sẻ Android. Giữ nguyên nguồn thô, dự phòng và đối chiếu Nốt Tea. Ảnh người dùng giữ riêng ngoài Git; ảnh giả lập chỉ là bằng chứng QA, không phải raster phát hành.

Phải kiểm tra nhiều độ rộng, hai giao diện sáng/tối, chữ lớn, bàn phím, nút Back, ngoại tuyến, nhập/xuất và cập nhật. Kiểm tra chuyển tab nhanh với animation bật; không coi reduced-motion hoặc build thành công là đủ chứng minh không chồng màn. Bằng chứng giả lập và máy thật phải được ghi rõ.
