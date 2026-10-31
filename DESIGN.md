# NỐT · Kinetic journal

Một sổ quán cá nhân với điểm, giá và địa chỉ làm nội dung chính. Giao diện bỏ lời chào, mô tả cách dùng, phiên bản, trạng thái ngoại tuyến bình thường và hướng dẫn lặp lại. Nhãn thao tác, dữ liệu, lỗi lưu, cảnh báo bỏ thay đổi thực sự và xác nhận thay thế bản sao vẫn còn.

## Nguồn và cấu trúc

- [React Bits](https://github.com/DavidHDev/react-bits), commit `e12c22192ac7b4b452c5e2feb9b586d74765d696`: `src/ts-default/Animations/ClickSpark/ClickSpark.tsx` được đưa vào ứng dụng tại `src/components/motion/ClickSpark.tsx`. Hiệu ứng chạm dùng canvas nhỏ theo từng điểm chạm, không có vòng vẽ nền khi đứng yên. MIT + Commons Clause, giữ thông báo gốc tại `public/licenses/react-bits.txt`.
- [Motion Primitives](https://github.com/ibelick/motion-primitives), commit `120f64f6ca60348e251f929e9c81f11ccbe45eda`: `animated-number.tsx` và `transition-panel.tsx` được điều chỉnh trong `src/components/motion/kinetic.tsx`. Thêm số thập phân, giá trị cuối cho trình đọc màn hình, màn hình đang thoát không nhận tương tác và chế độ giảm chuyển động không giữ DOM cũ. MIT, giữ thông báo gốc tại `public/licenses/motion-primitives.txt`.
- [Animate UI](https://github.com/imskyleen/animate-ui): tiếp tục dùng Dialog, Slider, ToggleGroup, BottomNavigation thật từ `@animate-ui/react`. Dialog đóng có thời gian thoát, trả focus về nút mở. Bộ lọc chỉ remount phần highlight khi đổi theme, giữ hộp lọc và focus.
- [shadcn/ui](https://github.com/shadcn-ui/ui): giữ hệ thống trường nhập và nút. [Magic UI](https://github.com/magicuidesign/magicui) được đối chiếu; không thêm một runtime animation khác.

## Hình thức

`src/styles.css` giữ nền tảng điều khiển/bản đồ; `src/kinetic.css` là lớp thiết kế mới. Nền mực `#0b0d0c`, bề mặt `#151816`, xanh acid `#d7ff3f`, tím `#b8a4ff`, chữ trắng `#f4f6ee`. Chế độ sáng dùng nền trắng và màu biểu đồ đậm để giữ tương phản. Plus Jakarta Sans, tiêu đề và điểm lớn, nhịp khoảng cách 8/12/18/24/32.

Điện thoại có thẻ quán dạng vé, vòng điểm và bốn tiêu chí ngay trên thẻ, dock nổi. Máy tính có rail, danh sách và khung điểm/tiêu chí bên phải. Form đưa tên, giá, loại quán và hình thức lên trước tiêu chí; bỏ phần thương hiệu khi đang nhập trên điện thoại. Ảnh, ngày, món, ghi chú, giờ mở và lịch sử điểm vẫn có thể truy cập.

## Chuyển động thật

| Thao tác       | Chuyển động                                            |
| -------------- | ------------------------------------------------------ |
| Đổi tab        | Fade-through: thoát 120ms, vào 240ms, trượt 18px; chỉ một màn; gỡ DOM khi thoát |
| Hiện thẻ quán  | Trượt/scale/fade 450ms khi vào vùng nhìn, trễ tối đa 375ms; không chạy điểm ngoài màn hình |
| Mở thẻ         | Chiều cao tự nhiên và opacity 380ms                    |
| Điểm           | Vòng vẽ 950ms; số chạy bằng spring 120/22              |
| Thanh tiêu chí | Thanh mở từ trái 750–800ms                             |
| Điều hướng     | Pill dùng chung layoutId, spring và icon nhún          |
| Chạm           | 7 tia + vòng nhỏ, 460ms; canvas chỉ chạy khi có burst  |
| Hộp thoại      | Hiện/ẩn 280ms và nền mờ; trả focus sau đóng            |

Giữ tùy chọn giảm chuyển động của hệ thống và ứng dụng. Không quảng bá FPS hoặc độ mượt trên A56 khi chưa đo trên thiết bị thật. Kiểm thử trình duyệt phải đo được nhiều vị trí chuyển màn và nhiều giá trị trung gian của điểm; kiểm tra canvas chạm và việc tắt hiệu ứng khi giảm chuyển động.

Điểm trung bình dùng foreground tối trên nền acid, được kiểm tra tương phản từ style đã render. Điện thoại đặt điểm trung bình trên hàng riêng; số quán và giá nằm dưới. Vòng điểm giữ box vuông, SVG preserveAspectRatio và vòng nền đủ rõ. Biểu đồ dùng viewBox theo kích thước thực để chữ trục không bị thu nhỏ theo cả ảnh.

Rà soát theo [Impeccable](https://github.com/pbakaus/impeccable), commit `02523aec3e4c4580102d996d1b6a71fbe062e03f`: audit, polish, optimize và craft-floor. Detector là một phần kiểm tra, không thay thế ảnh render, thao tác thật và kiểm tra hồi quy. Android giữ nhận diện và bố cục web, thêm insets, mục tiêu chạm, IME, Back và tôn trọng tắt hoạt ảnh hệ thống.

## Các điều chỉnh có chủ ý so với ảnh concept

Giữ ba nhóm Tất cả/Nước/Ăn, không thêm nhóm Ăn vặt mà ảnh desktop tự sinh. Giữ bốn tab gốc, không thêm tab Ăn gì trong form. Giá nhập bằng số, không có slider thay đổi điểm giá trực tiếp. Giữ đủ năm mức lượng và trọng số gốc. Form mới để trống tên; điểm đã lưu chỉ đổi khi lưu thật. Không dựng đồng hồ/pin điện thoại giả, avatar hoặc ảnh quán giả. Không đặt hồ sơ Thanh Hương vào form quán khác.

Nốt Tea vẫn 6,5 từ các tiêu chí 7/7/4/9, tại 38 Phan Thanh theo Maps đã kiểm tra. Bếp Trang mẫu được bỏ; Thanh Hương chỉ là ứng viên địa điểm. Thiết kế và animation không sửa công thức, lượt ghé, lịch sử hoặc chi tiêu.

Dock: four equal icon rows (34 px), captions aligned at 12 px, non-shrinking circular review action. The glyph rotates inside the circle. Height expands with larger text; Android dock and modal backdrop avoid costly blur.

Ảnh: hàng thao tác Chụp / Thư viện, lưới tối đa ba ảnh vuông, nút bỏ ảnh tròn 48px. Chạm ảnh mở bản đầy đủ trong Dialog có Back/Escape và trả focus. Chỉ hiện trạng thái trong lúc xử lý. Nén ảnh trong worker riêng, lần lượt từng ảnh để giới hạn RAM; không giữ worker khi xong. IDB v2 thêm capture-drafts, giữ nguyên document schema 13 và bốn store dữ liệu cũ. Hiệu ứng giữ vùng vẽ riêng cho vòng điểm/thẻ; chỉ gợi ý lớp compositor trong thời gian chuyển màn, không đo lại layout mọi thẻ trong mỗi render.
