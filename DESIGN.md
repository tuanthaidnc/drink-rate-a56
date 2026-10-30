# NỐT · Hệ thống giao diện v14

## Mục tiêu

Chọn quán theo trải nghiệm thật, mức giá và vị trí; chấm nhanh ngay sau khi ăn/uống. Điểm, giá và địa chỉ là thông tin chính. Lượt ghé và tiền thực trả là hành động riêng. Không tạo tài khoản, số liệu, ảnh món hoặc đánh giá cộng đồng giả để lấp giao diện.

## Nguồn thiết kế và thành phần

- [shadcn/ui](https://github.com/shadcn-ui/ui), tham khảo [Dashboard](https://ui.shadcn.com/examples/dashboard): phân cấp chữ, thanh điều hướng, bố cục danh sách và chi tiết, form và bề mặt. Chọn vì phù hợp React/Tailwind và ứng dụng dữ liệu cá nhân; đây là lựa chọn theo nhu cầu, không phải tuyên bố có một repo tốt nhất cho mọi sản phẩm.
- `src/components/ui/`: mã thành phần shadcn được thêm bằng CLI và chỉnh theo token NỐT. Cấu hình tại `components.json`; alias `@/lib/utils` dùng `clsx` + `tailwind-merge`.
- [Animate UI](https://github.com/imskyleen/animate-ui), `@animate-ui/react` 2.4.1: Radix Dialog, Slider, ToggleGroup và BottomNavigation được import trực tiếp. Dialog chung quản lý focus/Escape; thanh trượt có bàn phím; điều hướng và bộ lọc có chuyển động ngắn. Giữ bản quyền và điều kiện Commons Clause trong `public/licenses/animate-ui.txt`.
- Hình ly/bát điểm cũ trong `components/animate-ui/primitives.tsx` là thành phần riêng của NỐT, không phải mã upstream Animate UI.

## Token và bố cục

`src/styles.css` là nguồn token chung: canvas → header/card → control, màu chữ chính/phụ/mờ, border, focus ring, accent và trạng thái. Sáng dùng trắng/slate và xanh rừng; tối dùng slate đậm và xanh sáng có chữ tối. Màu cam chỉ phân biệt quán ăn. Không dùng nền gradient trang trí.

- Nhịp khoảng cách chủ yếu 4/8/12/16/24/32 px; card 12–16 px, control 8–12 px; bóng nhẹ cho lớp nổi, viền cho nhóm nội dung.
- Plus Jakarta Sans cho nội dung; JetBrains Mono cho điểm và giá. Tên trang → tên quán → nhãn/mô tả → dữ liệu. Không dùng chữ đậm đồng loạt.
- Dưới 1100 px: một cột, thẻ mở chi tiết, điều hướng dưới có safe area. Từ 1100 px: thanh bên, danh sách và khung chi tiết riêng; ảnh, ghi chú, lịch sử điểm, lượt ghé vẫn truy cập được.
- Form: kết quả dự kiến và lưu, thông tin quán, nhóm tiêu chí đánh số, ghi chú/ảnh, thông tin mở rộng. Địa chỉ mở khi cần; phần trăm trọng số nằm cùng tiêu chí.
- Bộ lọc dùng chung trên danh sách/bản đồ/vòng quay/thống kê. Phân biệt hồ sơ minh họa khỏi trải nghiệm cá nhân.

## Chuyển động và truy cập

Chuyển động dùng để chỉ lựa chọn và thay đổi trạng thái, không trì hoãn nhập liệu. `MotionConfig` nhận tùy chọn giảm chuyển động của ứng dụng và hệ điều hành. Giữ focus rõ, nhãn tiếng Việt, Tab/Escape, giá trị slider đọc được. Remount nhóm toggle khi đổi theme để lớp highlight của Animate UI nhận đúng màu mới.

Trạng thái bẩn của form so sánh nội dung với baseline. Mở form/focus/đổi tab không tự tạo thay đổi; các trường đã hoàn tác về baseline không giữ cảnh báo. Chỉ cảnh báo nếu có nội dung thực sự chưa lưu. Ghim mới do người dùng vừa tạo cũng là nội dung cần giữ.

## Giữ đúng mô hình sản phẩm

Ảnh concept dùng để chốt bố cục, không phải nguồn số liệu. Trong mã giữ đúng trọng số gốc (nước mang đi 50/25/20/5), không dùng tỷ lệ sai, avatar giả hoặc hàng Bếp Trang xuất hiện trong ảnh concept. Điểm sao là điểm cá nhân/2. Nốt Tea giữ 6,5; không lấy điểm Google thay thế. Thanh Hương còn là ứng viên địa điểm cho đến khi được xác nhận.

Nghiên cứu địa điểm ngày 30/10/2026: Nốt theo liên kết Maps của người dùng; Thanh Hương theo place ID `ChIJ07QGJs0ZQjERgw29Fx9idN0`. Lưu nguồn và trạng thái trong `placeResolution`, không biến việc tìm thấy cùng tên thành bằng chứng cùng quán.
