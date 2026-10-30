# NỐT · Food & Drink

Sổ trải nghiệm cá nhân để chọn quán hợp gu, giá và vị trí; chạy trên web hoặc cài từ Chrome trên Android. Bản triển khai: https://tuanthaidnc.github.io/drink-rate-a56/

## Dùng ứng dụng

- Chấm điểm một lần trải nghiệm; ghi món nên gọi, ảnh, địa chỉ và ghim đã kiểm tra. Chọn quán hoặc mở Maps không tự ghi đã ghé.
- Ghi lượt ghé riêng với ngày, món và tiền thực trả. Tiền để trống được hiển thị là chưa biết, không suy từ giá chấm điểm.
- Tìm/lọc cùng một tập quán trong danh sách, bản đồ, vòng quay và thống kê quán. Chi tiêu chu kỳ được ghi rõ là toàn bộ quán thật.
- Xuất JSON ở Thống kê. File gồm đánh giá, ảnh, lịch sử điểm, lượt ghé và tùy chọn; giữ một bản ngoài ứng dụng trước khi đổi máy hoặc xóa dữ liệu Chrome.
- Khi hiện “Sẵn sàng dùng ngoại tuyến”, có thể mở lại các màn hình và lưu dữ liệu không cần mạng. Nền bản đồ, tra địa chỉ và Google Maps cần mạng.
- Bản cập nhật hiện nút Cập nhật; lưu hoặc hủy bản nháp trước khi áp dụng. Giữ nguyên URL và ứng dụng đã cài để giữ cùng kho dữ liệu.

## Công thức đã chốt

| Loại               | Trọng số                                                    |
| ------------------ | ----------------------------------------------------------- |
| Nước mang đi       | Vị 50%, giá 25%, lượng 20%, vỏ ly 5%                        |
| Nước ngồi lại      | Vị 35%, không gian 20%, giá 20%, lượng 20%, vỏ ly 5%        |
| Ăn bình dân/vỉa hè | Ngon 40%, chất lượng 25%, sạch 15%, giá 15%, không gian 5%  |
| Ăn quán/nhà hàng   | Ngon 35%, chất lượng 25%, sạch 15%, không gian 15%, giá 10% |

Nốt mang đi: 31k, vị 7, lượng ít (4), ly 9 → **6,50/10**. Điểm giá là bậc quy đổi trong `src/lib/scoring.ts`; khoảng giá liên tục kể cả giá có phần thập phân. Sao bằng điểm chia 2, không phải điểm cộng đồng.

Tần suất theo từng quán: ≤40k hai lượt/tuần; quán ăn >40–80k một lượt/tuần, >80k một lượt/tháng; quán nước >40–80k hai lượt/tháng (gợi ý cách khoảng hai tuần), >80k hai lượt/năm. Đây là gợi ý; vẫn ghi được số lượt thực tế vượt gợi ý. Tuần từ thứ Hai, tháng từ ngày 5, năm từ ngày 5/1, theo `Asia/Ho_Chi_Minh` bất kể múi giờ thiết bị. Vòng quay không mở rộng bộ lọc khi còn 0 hoặc 1 quán.

## Dữ liệu và chuyển đổi v12 → v13

IndexedDB `not-food-drink-personal` lưu văn bản, ảnh và 20 bản dự phòng trước thay đổi. Mỗi lần ghi là một giao dịch; chỉ báo thành công khi giao dịch hoàn tất. Các cửa sổ đọc lại bản hiện tại trong giao dịch, đồng bộ qua BroadcastChannel; sửa đánh giá cũ có kiểm tra xung đột.

Lần mở đầu đọc khóa localStorage mới nhất có tồn tại, kể cả `[]`. Chuỗi gốc được giữ nguyên và lưu thêm vào kho archives. Dữ liệu lỗi mở màn hình khôi phục, cho tải nguyên bản gốc, không tự thay bằng dữ liệu mẫu. Tọa độ cũ chuyển sang chưa xác nhận; không đoán ghim mới hoặc khoảng cách. Hai quán ăn mẫu đúng nguyên trạng v12 được đánh dấu minh họa; bản người dùng đã sửa được giữ là cá nhân. Không xóa các bản mẫu; người dùng có thể chấm lại hoặc bỏ riêng.

Nhập JSON có kiểm tra toàn bộ cấu trúc, giá, ngày, điểm đầu vào, mã trùng, tọa độ và ảnh trước khi viết. Mặc định gộp và giữ quán đang có khi trùng mã. Thay toàn bộ cần xác nhận riêng, kể cả danh sách rỗng. Ảnh nhập được cấp mã mới để không phá ảnh trong dự phòng. Ảnh không còn tham chiếu trong dữ liệu hiện tại hoặc 20 dự phòng được thu hồi; ảnh khi phục hồi dữ liệu hỏng được giữ nguyên.

Chưa có tài khoản hay đồng bộ đám mây. Dữ liệu máy tính và điện thoại độc lập. Cài ứng dụng không thay cho sao lưu ngoài thiết bị.

## Nguồn địa điểm và bản đồ

- Danh mục 34 tỉnh/thành và 3.321 phường/xã/đặc khu theo [Quyết định 19/2025/QĐ-TTg](https://vanban.chinhphu.vn/?docid=214409&pageid=27160). Bản chuyển dạng từ [VietnamProvinces](https://provinces.open-api.vn/), tải 30/10/2026, lưu cùng app. Kiểm tra số lượng/mã duy nhất; chưa đối chiếu thủ công toàn bộ với PDF ký số hoặc xác nhận mọi thay đổi sau 01/07/2025.
- MapLibre GL + [OpenFreeMap](https://openfreemap.org/), OpenMapTiles và OpenStreetMap. Style địa phương giữ tên đường, bỏ nhãn POI. Không dùng tham số Google tile không công bố; không vẽ lộ trình giả.
- Tra địa chỉ Nominatim chỉ khi người dùng bấm, có cache và giới hạn tối thiểu 1,1 giây/đề nghị, khóa đồng thời giữa cửa sổ. Không tự động tra khi lưu. [Chính sách nguồn](https://operations.osmfoundation.org/policies/nominatim/).
- Font Plus Jakarta Sans và JetBrains Mono được lưu tại chỗ, kèm giấy phép OFL. Làm mới bằng `python scripts/vendor-fonts.py`.

## Phát triển và kiểm tra

Node 22.15+ và Chrome. `npm ci`, `npm test`, `npm run build`, `npm run preview -- --host 127.0.0.1 --port 4173`, `npm run test:e2e`, `node --experimental-strip-types tests/pwa-update.mjs`.

Kiểm thử trình duyệt dùng Playwright library và Chrome đã cài, hồ sơ tạm riêng; không chạm dữ liệu Chrome cá nhân. Đặt `TEST_OUTPUT` tới thư mục bằng chứng ngoài repository, `TEST_URL` nếu muốn kiểm tra một bản triển khai khác. Kiểm thử update dùng server riêng trên cổng ngẫu nhiên. CI giữ ảnh và kết quả ở artifact, không đưa vào mã nguồn.

Build vào **build/** để tách khỏi thư mục dist cũ từng chứa checkout triển khai. Không đưa `.git`, node_modules hoặc dữ liệu kiểm thử vào precache hay bản triển khai. `scripts/pwa-plugin.ts` tạo cache từ toàn bộ tài nguyên cục bộ, worker, font, danh mục và chunk tải sau; redirect `/assets/index.html` và 404 quay về gốc bằng đường dẫn tuyệt đối. Worker chỉ dọn cache của NỐT, không xóa kho của ứng dụng khác trên cùng GitHub Pages origin.

Triển khai bằng commit nối tiếp lên `gh-pages`, không force push. Giữ bản bundle Git trước nâng cấp và commit triển khai cũ để quay lại nếu cần. Kiểm tra build hash trong `version.json`, giao diện, chuyển đổi dữ liệu và ngoại tuyến sau khi Pages báo hoàn tất.

Kiểm thử mô phỏng Chrome không thay thế việc chạy trực tiếp trên Samsung A56; GPS, bàn phím One UI, biểu tượng launcher và hành vi nút Back cần xác nhận trên máy thật.
