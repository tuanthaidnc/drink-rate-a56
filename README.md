# NỐT · Food & Drink

Sổ trải nghiệm cá nhân để chọn quán hợp gu, giá và vị trí; chạy trên web hoặc cài từ Chrome trên Android. Bản triển khai: https://tuanthaidnc.github.io/drink-rate-a56/

## Dùng ứng dụng

- Chấm điểm mới tự mở camera; bắt buộc có ảnh trước khi tự lấy GPS. Sửa/ghim thủ công nếu cần, xác nhận vị trí rồi nhập tên/giá/điểm và lưu. Hủy camera không gọi GPS. Chỉnh sửa quán cũ giữ ảnh/tọa độ và không tự chụp hay định vị lại. Chọn quán hoặc mở Maps không tự ghi đã ghé.
- Ghi lượt ghé riêng với ngày, món và tiền thực trả. Tiền để trống được hiển thị là chưa biết, không suy từ giá chấm điểm.
- Tìm/lọc cùng một tập quán trong danh sách, bản đồ, vòng quay và thống kê quán. Chi tiêu chu kỳ được ghi rõ là toàn bộ quán thật.
- Xuất JSON ở Thống kê. File gồm đánh giá, ảnh, lịch sử điểm, lượt ghé và tùy chọn; giữ một bản ngoài ứng dụng trước khi đổi máy hoặc xóa dữ liệu Chrome.
- Ứng dụng chuẩn bị các màn hình để mở và lưu dữ liệu không cần mạng; chỉ hiện biểu tượng khi ngoại tuyến hoặc cần thử lại. Nền bản đồ, tra địa chỉ và Google Maps cần mạng.
- Bản cập nhật hiện biểu tượng ↻; chỉ cần lưu hoặc hủy nếu đã sửa nội dung. Mở form nhưng chưa sửa, hoặc sửa rồi hoàn tác, có thể đổi tab ngay. Giữ nguyên URL và ứng dụng đã cài để giữ cùng kho dữ liệu.

## Giao diện và chuyển động

Ảnh chụp là thẻ vuông có viền nhẹ, điểm/giá ở góc và tên/đường bên dưới. Điện thoại có lưới hai cột hoặc ba cột; máy tính có bốn/năm cột và rail. Chi tiết mở khi chạm ảnh, phân trang 24 quán. Nền sáng/mực, xanh acid và tím nhạt giữ vai trò điều khiển. Bỏ lời giới thiệu, hướng dẫn thường trực và phiên bản khỏi UI. Giữ dữ liệu, nhãn thao tác và phản hồi lỗi cần thiết.

[React Bits](https://github.com/DavidHDev/react-bits) cung cấp ClickSpark; [Motion Primitives](https://github.com/ibelick/motion-primitives) cung cấp AnimatedNumber và TransitionPanel đã điều chỉnh cho điểm thập phân và khả năng truy cập. [Animate UI](https://github.com/imskyleen/animate-ui) tiếp tục xử lý Dialog, Slider, ToggleGroup và BottomNavigation; các trường nhập/nút dựa trên [shadcn/ui](https://github.com/shadcn-ui/ui). Ảnh có hiệu ứng hiện hình, lưới đổi mật độ/ấn thẻ, mở ảnh chi tiết, chuyển màn, điểm, thanh tiêu chí và dock có chuyển động. GPS có hiệu ứng chờ trong thời gian định vị; không có vòng vẽ nền thường trực. Giảm chuyển động theo hệ thống/ứng dụng vẫn được tôn trọng và cập nhật ngay khi đổi tùy chọn. Xem [DESIGN.md](DESIGN.md) về nguồn, thời gian và cấu trúc.

- Nốt được đối chiếu bằng [liên kết Maps do chủ ứng dụng cung cấp](https://maps.app.goo.gl/TSXSAzECjtmbwCVC9): **Nốt Tea, 38 Phan Thanh, Thanh Khê, Đà Nẵng**, ghim **16.06528, 108.2083**. Chỉ cập nhật địa điểm, giữ điểm cá nhân **6,50** và lịch sử. Ghim GPS/thủ công đã xác nhận được giữ.
- Bỏ mẫu **Bếp Trang** nguyên trạng theo yêu cầu. Nếu bản ghi có ảnh, lượt ghé, lịch sử điểm hoặc đã là trải nghiệm cá nhân thì giữ lại. Bản thô trước chuyển đổi và bản dự phòng vẫn có thể khôi phục.
- Hồ sơ Maps **Quán Bánh Canh Thanh Hương, 227 Trần Phú** chỉ là ứng viên. Bản cũ ghi Phan Thanh nhưng không có nguồn xác thực; bỏ ghim giả định, giữ điểm minh họa riêng và cho kiểm tra/xác nhận địa điểm. Không tự coi ứng viên là quán người dùng đã ghé.

Đối chiếu chạy tại chỗ khi mở dữ liệu cũ hoặc nhập bản sao cũ; không cần gửi dữ liệu lên máy chủ. Marker chuyển đổi giúp giữ chỉnh sửa địa chỉ về sau. Phiên bản cấu trúc dữ liệu vẫn là 13 để đọc được bản sao v13.

Giấy phép: shadcn/ui và Motion Primitives MIT; Animate UI và React Bits **MIT + Commons Clause**, được tích hợp như một phần của ứng dụng. Giữ thông báo gốc tại [public/licenses](public/licenses).

## Công thức đã chốt

| Loại               | Trọng số                                                    |
| ------------------ | ----------------------------------------------------------- |
| Nước mang đi       | Vị 50%, giá 25%, lượng 20%, vỏ ly 5%                        |
| Nước ngồi lại      | Vị 35%, không gian 20%, giá 20%, lượng 20%, vỏ ly 5%        |
| Ăn bình dân/vỉa hè | Ngon 40%, chất lượng 25%, sạch 15%, giá 15%, không gian 5%  |
| Ăn quán/nhà hàng   | Ngon 35%, chất lượng 25%, sạch 15%, không gian 15%, giá 10% |

Nốt mang đi: 31k, vị 7, lượng ít (4), ly 9 → **6,50/10**. Điểm giá là bậc quy đổi trong `src/lib/scoring.ts`; khoảng giá liên tục kể cả giá có phần thập phân. Sao bằng điểm chia 2, không phải điểm cộng đồng.

Tần suất theo từng quán: ≤40k hai lượt/tuần; quán ăn >40–80k một lượt/tuần, >80k một lượt/tháng; quán nước >40–80k hai lượt/tháng (gợi ý cách khoảng hai tuần), >80k hai lượt/năm. Đây là gợi ý; vẫn ghi được số lượt thực tế vượt gợi ý. Tuần từ thứ Hai, tháng từ ngày 5, năm từ ngày 5/1, theo `Asia/Ho_Chi_Minh` bất kể múi giờ thiết bị. Vòng quay không mở rộng bộ lọc khi còn 0 hoặc 1 quán.

## Dữ liệu và chuyển đổi v12 → v14

IndexedDB `not-food-drink-personal` lưu văn bản, ảnh và 20 bản dự phòng trước thay đổi. Mỗi lần ghi là một giao dịch; chỉ báo thành công khi giao dịch hoàn tất. Các cửa sổ đọc lại bản hiện tại trong giao dịch, đồng bộ qua BroadcastChannel; sửa đánh giá cũ có kiểm tra xung đột.

Lần mở đầu đọc khóa localStorage mới nhất có tồn tại, kể cả `[]`. Chuỗi gốc được giữ nguyên và lưu thêm vào kho archives. Dữ liệu lỗi mở màn hình khôi phục, cho tải nguyên bản gốc, không tự thay bằng dữ liệu mẫu. Tọa độ cũ chưa có nguồn chuyển sang chưa xác nhận; chỉ remap Nốt theo nguồn Maps đã kiểm tra nêu trên. Các quán ăn mẫu đúng nguyên trạng v12 được nhận diện trước khi áp dụng việc bỏ mẫu Bếp Trang; bản người dùng đã sửa được giữ là cá nhân.

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

## Android

`npm run android:sync` tạo build dành riêng cho Capacitor ở `build-android/`, rồi đồng bộ sang `android/`. Cần JDK 21, Android SDK 36 và Gradle wrapper để build: `cd android && ./gradlew assembleRelease`. Workflow NỐT Android tạo APK release chưa ký, chạy lint và instrumentation trên Android API 35; artifact gồm kết quả, ảnh emulator và công cụ apksigner từ Android SDK. Khóa release được giữ riêng trên máy chủ ứng dụng, không đưa lên Git hoặc artifact CI.

APK chứa tài nguyên web/font/danh mục để khởi động ngoại tuyến ngay lần đầu, không dùng service worker. MapLibre, bản đồ và tra địa chỉ vẫn cần mạng. Dùng một bản release ký cùng khóa để cập nhật về sau. Đây là APK hybrid Capacitor; không khẳng định hiệu năng bằng ứng dụng Compose hoặc 120 fps từ việc build thành công.

Chuyển từ Chrome: xuất JSON trong Tùy chọn/Thống kê, lưu file, mở APK rồi nhập file đó bằng luồng gộp/khôi phục hiện có. Kiểm tra số quán, ảnh và lượt ghé trước khi ngừng dùng bản cũ; không cần xóa hay gỡ PWA. Hai bản không tự đồng bộ. Xuất trong APK mở hộp chia sẻ hệ thống để chọn nơi lưu; nhập dùng bộ chọn file Android.

Android chọn mode cùng độ phân giải có tần số cao tối đa 120 Hz nếu được thiết bị cung cấp và gửi yêu cầu frame rate cho WebView từ API 35. Android vẫn quyết định theo màn hình, cấu hình, pin và nhiệt. Cần đo trên A56 thật để xác nhận; emulator không chứng minh 120 Hz.
