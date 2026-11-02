---
name: 'NỐT · Photo journal'
description: 'Album ảnh cá nhân để nhận ra quán, đọc điểm và giá, rồi mở đánh giá cần xem.'
colors:
  acid: '#d7ff3f'
  lilac: '#b8a4ff'
  acid-ink-light: '#162000'
  acid-ink-dark: '#182100'
  lilac-ink: '#241a42'
  active-ink-light: '#425a00'
  secondary-accent-light: '#6e51b6'
  canvas-light: '#f7f8f5'
  canvas-dark: '#0b0d0c'
  surface-light: '#f6f7f3'
  surface-dark: '#151816'
  elevated-light: '#edf0e7'
  elevated-dark: '#1c201c'
  text-light: '#12170e'
  text-dark: '#f4f6ee'
  secondary-text-light: '#4b5346'
  secondary-text-dark: '#b9beb2'
  muted-text-light: '#6c7467'
  muted-text-dark: '#858b7e'
  divider-light: '#e0e4d9'
  divider-dark: '#2b3029'
  hairline-light: '#d3d8c9'
  hairline-dark: '#373d33'
  selection-soft-light: '#eaf5bc'
  selection-soft-dark: '#29301b'
  empty-photo-light: '#e9ede4'
  empty-photo-dark: '#1e2620'
  food-soft-light: '#ffedd9'
  food-soft-dark: '#35261c'
  destructive-light: '#b8283c'
  destructive-dark: '#ff8b99'
  slider-track-light: '#dce2d4'
  slider-track-dark: '#2d322b'
  chart-fill-light: '#6b8100'
  focus-ring: '#849e19'
  photo-overlay: '#0b100de6'
  photo-overlay-text: '#fff'
  photo-control: '#171c17'
  camera-ground: '#0e110d'
  camera-empty: '#1e211d'
  reel-scrim: 'rgb(0 0 0 / 85%)'
  calendar-scrim: '#0008'
  photo-text-shadow: '#000'
typography:
  brand:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '28px'
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: '-0.04em'
  headline:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '25px'
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: '-0.035em'
  headline-desktop:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '32px'
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: '-0.035em'
  form-title:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '24px'
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: '-0.035em'
  title:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '13px'
    fontWeight: 750
    lineHeight: 1.45
  body:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.5
  input:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.45
  action:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '13px'
    fontWeight: 700
    lineHeight: 1.45
  label:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '11px'
    fontWeight: 400
    lineHeight: 1.5
  photo-score:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '17px'
    fontWeight: 750
    lineHeight: 1
    letterSpacing: '-0.025em'
  photo-price:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '13px'
    fontWeight: 650
    lineHeight: 1
  quick-total:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '30px'
    fontWeight: 800
    lineHeight: 1.25
  quick-price:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '27px'
    fontWeight: 650
    lineHeight: 1.25
  slider-label:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 650
    lineHeight: 1.5
  slider-value:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '17px'
    fontWeight: 700
    lineHeight: 1.5
  metadata:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '12px'
  status:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '15px'
    fontWeight: 500
  section-title:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '20px'
  dialog-title:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '22px'
  experience-title:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '21px'
    lineHeight: 1.2
  journal-title:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '19px'
  calendar-count:
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    fontSize: '10px'
rounded:
  photo: '20px'
  photo-compact: '16px'
  capture: '24px'
  dialog: '25px'
  field: '13px'
  tabs: '14px'
  tab-option: '11px'
  badge: '9px'
  pill: '99px'
  circle: '50%'
  track: '4px'
  compact-control: '12px'
  journal-badge: '8px'
spacing:
  micro: '4px'
  compact: '8px'
  control: '12px'
  section: '16px'
  row: '18px'
  panel: '20px'
  wide: '24px'
  desktop: '32px'
components:
  button-primary:
    backgroundColor: '{colors.acid}'
    textColor: '{colors.acid-ink-light}'
    typography: '{typography.action}'
    rounded: '{rounded.pill}'
    padding: '10px 16px'
    height: '44px'
  button-secondary:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.secondary-text-light}'
    typography: '{typography.action}'
    rounded: '{rounded.pill}'
    padding: '10px 16px'
    height: '44px'
  button-secondary-hover:
    backgroundColor: '{colors.elevated-light}'
  search-field:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.text-light}'
    rounded: '{rounded.field}'
    padding: '0 12px'
    height: '44px'
  category-option:
    textColor: '{colors.secondary-text-light}'
    rounded: '{rounded.tab-option}'
    padding: '7px 12px'
    height: '38px'
  category-option-selected:
    backgroundColor: '{colors.acid}'
    textColor: '{colors.acid-ink-light}'
    rounded: '{rounded.tab-option}'
  album-cover:
    backgroundColor: '{colors.empty-photo-light}'
    rounded: '{rounded.photo}'
    width: '100%'
  photo-score:
    backgroundColor: '{colors.photo-overlay}'
    textColor: '{colors.photo-overlay-text}'
    typography: '{typography.photo-score}'
    rounded: '{rounded.badge}'
    padding: '7px 8px'
  photo-price:
    backgroundColor: '{colors.photo-overlay}'
    textColor: '{colors.photo-overlay-text}'
    typography: '{typography.photo-price}'
    rounded: '{rounded.badge}'
    padding: '6px 8px'
  input-field:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.text-light}'
    typography: '{typography.input}'
    rounded: '{rounded.field}'
    padding: '10px 12px'
    height: '44px'
  input-field-quick:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.text-light}'
    typography: '{typography.input}'
    rounded: '{rounded.field}'
    padding: '10px 12px'
    height: '48px'
  capture-cover:
    backgroundColor: '{colors.empty-photo-light}'
    rounded: '{rounded.capture}'
    width: '100%'
  bottom-dock:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.secondary-text-light}'
    rounded: '{rounded.pill}'
    padding: '7px'
    height: '82px'
  dialog:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.text-light}'
    rounded: '{rounded.dialog}'
  button-save:
    backgroundColor: '{colors.acid}'
    textColor: '{colors.acid-ink-light}'
    typography: '{typography.action}'
    rounded: '{rounded.tabs}'
    padding: '10px 16px'
    height: '48px'
  quick-photo:
    backgroundColor: '{colors.empty-photo-light}'
    rounded: '{rounded.photo}'
    width: '112px'
    height: '112px'
  quick-price:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.text-light}'
    typography: '{typography.quick-price}'
    rounded: '{rounded.tabs}'
    padding: '8px 12px'
    height: '56px'
  quick-total:
    textColor: '{colors.active-ink-light}'
    typography: '{typography.quick-total}'
  slider-track:
    backgroundColor: '{colors.slider-track-light}'
    rounded: '{rounded.track}'
    height: '5px'
  slider-range:
    backgroundColor: '{colors.chart-fill-light}'
    rounded: '{rounded.track}'
    height: '100%'
  slider-thumb:
    backgroundColor: '{colors.text-light}'
    rounded: '{rounded.circle}'
    size: '28px'
  experience-option:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.text-light}'
    rounded: '{rounded.photo-compact}'
    padding: '20px'
    height: '172px'
  reel-photo:
    backgroundColor: '{colors.empty-photo-light}'
    rounded: '{rounded.compact-control}'
    width: 'clamp(112px, 36vw, 172px)'
  journal-day:
    backgroundColor: '{colors.elevated-light}'
    textColor: '{colors.secondary-text-light}'
    rounded: '{rounded.tabs}'
    height: '48px'
  journal-photo:
    backgroundColor: '{colors.empty-photo-light}'
    rounded: '{rounded.photo-compact}'
    width: '100%'
  photo-action:
    backgroundColor: '{colors.photo-control}'
    textColor: '{colors.photo-overlay-text}'
    rounded: '{rounded.compact-control}'
    size: '44px'
  photo-action-android:
    size: '48px'
  square-viewfinder:
    backgroundColor: '{colors.camera-empty}'
    rounded: '{rounded.photo-compact}'
    width: 'min(100%, calc(100dvh - 260px), 560px)'
---

# Design System: NỐT · Photo journal

## Overview

**Creative North Star: "Album ảnh cá nhân"**

NỐT dùng ảnh thật làm điểm nhận diện quán: nhìn ảnh, đọc điểm và giá ở hai góc cố định, rồi mở đánh giá cần xem. Nền sáng dịu hoặc nền mực lùi lại; xanh acid đánh dấu lựa chọn, tím nhạt nhận diện thao tác chụp. Plus Jakarta Sans được giữ để nối liền nhận diện cũ và đọc tiếng Việt rõ trong bố cục gọn.

Đây là giao diện React dùng chung cho web/PWA và APK Capacitor WebView. Album thay thế danh sách vé lớn; phần chấm điểm, bản đồ và thống kê tiếp tục dùng hệ điều khiển cùng màu và chữ. Nhãn tiếng Việt ngắn, dữ liệu và lỗi/xác nhận cần thiết là nội dung chính. Chuyển động giải thích sự thay đổi trạng thái, không thay cho trạng thái đã xác nhận.

**Key Characteristics:**

- Ảnh vuông có một đường viền đều bốn cạnh; tên và địa chỉ nằm dưới ảnh.
- Điểm ở góc trên phải, giá ở góc dưới trái; vị trí giữ nguyên qua sắp xếp và đổi mật độ.
- Acid cho lựa chọn, lilac cho chụp; nền và chữ đổi theo sáng/tối.
- Năm nơi đến cùng một hệ điều khiển; dải chọn ảnh, nhật ký và camera giữ ảnh vuông làm điểm neo.
- Hiệu ứng có giới hạn và tôn trọng giảm chuyển động của ứng dụng, trình duyệt và Android.

### Nguồn và giấy phép được giữ

- [React Bits](https://github.com/DavidHDev/react-bits), commit `e12c22192ac7b4b452c5e2feb9b586d74765d696`: `src/ts-default/Animations/ClickSpark/ClickSpark.tsx` được đưa vào `src/components/motion/ClickSpark.tsx`. Canvas vẽ theo từng lần chạm, không có vòng vẽ nền khi đứng yên. MIT + Commons Clause; thông báo gốc tại `public/licenses/react-bits.txt`.
- [Motion Primitives](https://github.com/ibelick/motion-primitives), commit `120f64f6ca60348e251f929e9c81f11ccbe45eda`: `animated-number.tsx` và `transition-panel.tsx` được điều chỉnh trong `src/components/motion/kinetic.tsx`. Giữ số thập phân, giá trị cuối cho trình đọc màn hình, màn hình thoát không nhận tương tác và chế độ giảm chuyển động không giữ DOM cũ. MIT; thông báo gốc tại `public/licenses/motion-primitives.txt`.
- [Animate UI](https://github.com/imskyleen/animate-ui): dùng Dialog, Slider, ToggleGroup và BottomNavigation từ `@animate-ui/react`. Dialog có thời gian thoát và trả focus về nút mở; đổi theme chỉ remount highlight bộ lọc, giữ hộp lọc và focus.
- [shadcn/ui](https://github.com/shadcn-ui/ui): giữ cấu trúc trường nhập và nút. [Magic UI](https://github.com/magicuidesign/magicui) đã được đối chiếu; không thêm runtime animation từ nguồn này.
- [Impeccable](https://github.com/pbakaus/impeccable), commit `02523aec3e4c4580102d996d1b6a71fbe062e03f`: nguồn rà soát audit, polish, optimize và craft-floor của hệ cũ. Hồ sơ finish của album hiện tại ở `.impeccable/surfaces/src-app-tsx.md` và báo cáo bằng chứng của lần thay đổi này.
- Font tự lưu trong `public/fonts`; giữ thông báo OFL của Plus Jakarta Sans và JetBrains Mono. Raster biểu tượng đang phát hành giữ provenance nhúng tham chiếu repository tại commit `5b5176b6`. Không thêm hình ảnh mới vào gói ứng dụng trong lần thay đổi album; ảnh concept và ảnh QA tổng hợp nằm ngoài kho mã, không phải ảnh đánh giá của người dùng.

Nguồn triển khai quyết định token là thứ tự import `src/styles.css` → `src/kinetic.css` → `src/photo-journal.css` → `src/experience.css` trong `src/main.tsx`. Đây là phần mở rộng đã được chủ ứng dụng duyệt của hệ album hiện có; không biến selector vé cũ thành mẫu mới. Luồng và quy tắc dữ liệu chuẩn nằm trong `PRODUCT.md`.

## Colors

Màu lá acid và tím nhạt nằm trên một họ neutral hơi xanh; ảnh thật cung cấp phần lớn sắc độ của album. Frontmatter là bảng giá trị chuẩn, các tên bên dưới chỉ mô tả vai trò.

### Primary

- **Acid** (`acid`): nền lựa chọn category, nút chính, ghim và vùng giá trị slider ở theme tối. Chữ trên acid dùng `acid-ink-light` hoặc `acid-ink-dark` theo theme.
- **Olive rõ nét** (`active-ink-light`): chữ/trạng thái hoạt động trên nền sáng. Ở nền tối, cùng vai trò `--accent-bright` chuyển về acid để giữ khả năng đọc.

### Secondary

- **Lilac** (`lilac`): vòng camera trong dock và vùng chọn chữ. Chữ/icon trên lilac dùng `lilac-ink`; trạng thái capture hoạt động dùng `secondary-accent-light` ở theme sáng và lilac ở theme tối.

### Neutral

- **Canvas sáng / mực** (`canvas-light`, `canvas-dark`): nền bao quanh ảnh và app header; không dùng nền slate cũ.
- **Bề mặt / bề mặt nâng** (`surface-*`, `elevated-*`): điều khiển, trường nhập, dialog, dock và hover nút phụ.
- **Chữ chính / phụ / mờ** (`text-*`, `secondary-text-*`, `muted-text-*`): tên và nội dung; địa chỉ và nhãn phụ; placeholder hoặc metadata nhẹ.
- **Đường chia / hairline** (`divider-*`, `hairline-*`): nhóm form, điều khiển và một viền đều quanh ảnh. Viền ảnh được chọn dùng `--accent-bright`.
- **Ảnh còn thiếu** (`empty-photo-*`): ô chữ cái đầu và icon camera. Ô quán ăn trộn `food-soft-*` với nền ảnh còn thiếu; không lấp bằng ảnh giả.
- **Nền nhãn ảnh** (`photo-overlay`, `photo-overlay-text`): nhãn điểm, giá và số ảnh dùng cùng nền mực gần đục và chữ trắng ở cả hai theme.
- **Tương phản trên ảnh** (`photo-control`, `reel-scrim`, `calendar-scrim`, `photo-text-shadow`): nền nút ảnh/nhãn nhật ký, scrim dưới tên trong reel, scrim ngày có ảnh và bóng chữ ngày. Đây là hỗ trợ đọc trên ảnh, không phải màu nhấn mới hoặc gradient chữ.
- **Camera** (`camera-ground`, `camera-empty`): nền tối cố định quanh viewfinder và nền chờ của camera vuông; giữ chữ/icon trắng trong cả hai theme ứng dụng.
- **Slider** (`slider-track-*`, `chart-fill-light`): rãnh trung tính theo theme và phần giá trị olive trên nền sáng; nền tối dùng acid cho phần giá trị. Thumb dùng màu chữ chính.
- **Trạng thái** (`destructive-*`, `focus-ring`, `selection-soft-*`): lỗi/xóa, vòng focus và nền chỉ báo điều hướng đang chọn.

**The Accent Roles Rule.** Giữ acid cho lựa chọn và hành động chính; giữ lilac làm dấu nhận diện chụp. Dùng màu chữ theo theme thay vì viết chữ acid nhạt trên nền sáng.

## Typography

**Display Font:** Plus Jakarta Sans, dự phòng system-ui và sans-serif.

**Body Font:** Plus Jakarta Sans, cùng bộ font tự lưu.

**Label/Mono Font:** Plus Jakarta Sans cho nhãn album và số điểm; JetBrains Mono chỉ còn ở dữ liệu kỹ thuật có lớp mono, không phải font tiêu đề hay điểm của album.

**Character:** Một họ sans dùng chung giữ giao diện cá nhân, gọn và ổn định khi có dấu tiếng Việt. Tiêu đề và điểm dùng trọng lượng mạnh; địa chỉ và metadata dùng màu phụ, không tranh diện tích với ảnh.

### Hierarchy

- **Brand:** vai trò `brand`; ở desktop rail giảm còn (26px), điện thoại dùng giá trị frontmatter.
- **Headline:** vai trò `headline`; từ breakpoint desktop dùng `headline-desktop`. Tiêu đề form dùng `form-title`; quick toolbar giữ cùng cỡ (24px) trên desktop. Khi chấm điểm, tiêu đề chỉ dành cho trình đọc màn hình để nhường chỗ cho tổng điểm và Lưu.
- **Title:** vai trò `title` cho tên quán tối đa hai dòng; tên tăng thành (14px) từ (650px), mật độ nhỏ dùng (12px).
- **Body / Input:** vai trò `body` cho nội dung và `input` cho trường nhập. Nhãn form dùng (12px), dòng (1.5), trọng lượng (500).
- **Label:** vai trò `label` cho địa chỉ album một dòng có ellipsis; từ (650px) tăng thành (12px). Dock dùng nhãn (12px), dòng (1.4), giảm thành (11px) ở tối đa (360px) và cho xuống dòng khi cỡ chữ tăng.
- **Numbers:** `photo-score` và `photo-price` dùng tabular numerals; mật độ nhỏ giảm điểm thành (14px), giá thành (12px). Điểm đang nhập dùng `quick-total`, giảm thành (27px) ở tối đa (360px), với `/10` (12px); giá dùng `quick-price`. Nhãn và giá trị slider dùng `slider-label` / `slider-value`. Vòng điểm trong dialog chi tiết dùng (30px).
- **Extension roles:** `metadata` dùng cho reel, tuần lịch, giờ/điểm nhật ký và số đánh giá; `status` cho trạng thái reel. `section-title` dùng tên kết quả và tháng; `dialog-title` dùng tiêu đề sheet reel/camera; `experience-title` dùng hai lựa chọn bắt đầu; `journal-title` dùng ngày đang xem. `calendar-count` chỉ dành cho badge số lượng bổ sung trên ngày có nhiều đánh giá, không dùng cho tên, giá, điểm hoặc thao tác chính.

Toolbar camera Android dùng chữ nền tảng cho nhãn ngắn; ngoại lệ giới hạn ở native chrome, không thay họ display của ứng dụng.

**The One Family Rule.** Giữ Plus Jakarta Sans cho toàn bộ nhận diện, tiêu đề, nhãn album và điểm; không chuyển số điểm sang mono theo selector cũ.

## Layout

Album có grid tự co bằng `minmax(0, 1fr)`. Dưới (650px) có hai cột mặc định hoặc ba cột mật độ nhỏ, khoảng cách hàng/cột lần lượt (18px / 12px) và (14px / 9px). Từ (650px), grid thành ba hoặc bốn cột với khoảng cách (24px / 18px) và (20px / 14px). Từ (1100px), grid thành bốn hoặc năm cột với khoảng cách (28px / 20px) và (24px / 16px). Ở tối đa (360px), lề ngang giảm còn (12px); không đổi ảnh vuông thành thẻ ngang.

Điện thoại có header gọn (62px) cộng safe area trên Android; vùng nội dung thường có lề ngang (16px). Form ẩn header để dành diện tích cho ảnh, giá và các slider; mang về có màn ghim quán trước chụp, còn chỉnh ghim trong form là dialog. Dock năm ô ở dưới dùng chiều cao nội dung thực qua `ResizeObserver`, để phần cuối trang không bị che; inset hệ thống được cộng vào khoảng trống dưới. Từ desktop, rail rộng (100px), app main có padding (26px 32px), vùng nội dung tối đa (1320px); quick form tối đa (560px) và đặt giữa.

Search thu gọn thành nút ở điện thoại; khi mở, trường tìm kiếm chiếm cả hàng dưới category. Từ (650px), trường tìm kiếm luôn hiện cạnh category. Mỗi trang album tối đa (24) đánh giá, dùng nút trang thay vì dựng toàn bộ ảnh cùng lúc.

Quick toolbar sticky chứa Back, tổng điểm và Lưu, tối thiểu (52px), cách nhau (10px); nút Back và Lưu cao (48px). Ảnh và giá nằm cạnh nhau: cột ảnh (112px), gap (18px), xuống (96px / 12px) ở tối đa (360px), lên (144px / 24px) trên desktop. Form có gap (12px), giảm thành (10px) trên điện thoại hẹp; nhóm slider có gap (8px), tăng thành (12px) trên desktop. Bàn phím dùng vùng nhìn thực, khoảng cuộn theo safe area và ẩn dock khi đang nhập, giữ hình học ảnh/giá ổn định.

Hai lựa chọn bắt đầu chia hai cột, gap (12px); mỗi vùng tối thiểu theo `experience-option`. Reel nằm trong sheet tối đa (520px), rộng viewport trừ (24px), các ảnh vuông cách (10px), marker nằm cố định ở giữa. Nhật ký tối đa (680px), lịch bảy cột và ảnh ngày hai cột; từ (1100px) thành hai vùng (320px / phần còn lại), cách (40px), tối đa (1000px).

**The Square Anchor Rule.** Giữ cover tỉ lệ (1:1), điểm trên phải và giá dưới trái ở mọi mật độ. Đổi số cột không đổi thứ tự đọc của từng đánh giá.

## Elevation & Depth

Album phẳng ở trạng thái nghỉ: không shadow quanh từng ảnh, quick toolbar và tổng điểm không shadow, phân lớp bằng nền, khoảng cách và hairline. Shadow chỉ còn ở vật nổi có chức năng như dock, dialog, toast, nhóm điều khiển map, ghim và thumb slider. Không dùng shadow lệch cứng để tạo chất liệu album.

### Shadow Vocabulary

- **Dock nhẹ** (`0 8px 24px #00000014`): dock điện thoại trên nội dung cuộn; nền đặc và không backdrop blur.
- **Soft control sáng** (`0 12px 30px #18210005`) / **tối** (`0 12px 35px #0000000d`): token `--shadow-soft`, đang dùng cho nhóm điều khiển map.
- **Overlay sáng** (`0 24px 70px #0f172a30`) / **tối** (`0 24px 80px #0009`): dialog ở trên backdrop.
- **Pin** (`0 3px 8px #0004`): ghim tròn tương tác trên map.
- **Slider thumb** (`0 2px 6px #0003`): thumb tròn; hover thêm halo (`0 0 0 6px color-mix(in srgb, var(--accent) 14%, transparent)`).
- **Toast** (`0 10px 35px #0002`): thông báo ngắn, không làm kiểu shadow cho ảnh.

Dialog dùng backdrop (`#0009`); web giữ blur (6px), Android tắt blur. Layer overlay gốc là (80), dialog cao hơn một lớp. Focus mặc định là outline (2px) lệch ngoài (3px); album tile dùng outline (3px) lệch ngoài (4px).

Ảnh trong reel chỉ có scrim dưới caption; ngày có ảnh trong lịch dùng scrim và bóng chữ (`0 1px 4px` với `photo-text-shadow`) để giữ số ngày rõ. Marker và viền kết quả dùng olive/acid theo theme, không tạo độ nổi giả.

**The Photo Flatness Rule.** Cover ảnh và nhãn góc đứng trên một mặt phẳng; không thêm bóng cho từng tile để mô phỏng chồng ảnh.

## Shapes

Cover và map dùng góc cong vừa, không tạo rãnh vé hoặc giấy. Cover album dùng `photo`, mật độ nhỏ dùng `photo-compact`; màn chụp dùng `capture`. Cover chờ chụp tối đa (300px); ảnh ở quick form theo kích thước responsive của Layout, bo (20px), giảm bo còn (18px) trên điện thoại hẹp. Crop ảnh dùng `object-fit: cover`; dialog ảnh đầy đủ dùng `contain` để xem toàn ảnh.

Badge điểm và giá dùng `badge`. Trường thường và search dùng `field`, khung category album dùng `tabs`, lựa chọn bên trong dùng `tab-option`. Nút thường dùng `pill`; Lưu trên quick toolbar bo (14px). Icon đơn và slider thumb dùng `circle`, dialog dùng `dialog`. Border một pixel bao đủ bốn cạnh ảnh, không tăng dày riêng một cạnh.

Reel và nút ảnh dùng `compact-control`; nhãn giờ/điểm nhật ký dùng `journal-badge`. Ảnh nhật ký và viewfinder dùng `photo-compact`. Ô ngày dùng `tabs`, với viền nền (3px), giảm còn (2px) trên điện thoại hẹp; outline chọn nằm trong ảnh, không đẩy hình học lịch.

## Components

### Buttons

Hành động rõ, nhãn ngắn và mục tiêu chạm có khoảng trống.

- **Primary:** acid với chữ mực theo theme, pill, padding theo `button-primary`. Height trong frontmatter là chiều cao tối thiểu; nút được cao thêm khi chữ lớn. Xác nhận ghim mang về và nút quay có mức tối thiểu (52px); Lưu dùng `button-save`, bo theo `tabs`, cao (48px), không bị GPS đang chạy khóa khi ảnh/giá hợp lệ.
- **Secondary:** nền surface, chữ phụ và hairline; hover chuyển sang elevated. Icon button cơ sở (44px). Back/xóa/chụp lại trong form Android có cả width, height, min-width, min-height (48px); nút xóa/chụp lại dùng `photo-action` trên web và `photo-action-android` trên Android, chữ trắng trên nền tối.
- **Hover / Focus:** nút thường giảm brightness còn (0.97), chuyển nền/viền/opacity (160ms); outline focus lấy `--ring`. Nút disabled giảm opacity còn (0.5); nhãn chọn ảnh bị khóa dùng (0.45). Không dùng hiệu ứng để thay cho nhãn đang xử lý.

### Chips

Bộ lọc album chỉ có Tất cả / Nước / Ăn. Khung surface có viền, padding (3px), bo theo `tabs`; lựa chọn bo theo `tab-option`, selected dùng acid với chữ mực. Bộ lọc được áp dụng có một tóm tắt chữ gọn để mở lại dialog. Quick form có hai lựa chọn Nước / Ăn, rồi hai lựa chọn hình thức tương ứng; chia hai cột đều, gap (6px), bo (13px). Không thêm category từ ảnh concept.

### Cards / Containers

Album entry là một nút gồm cover vuông và caption bên dưới, không bọc thêm một panel nền. Cover dùng hairline; tên tối đa hai dòng, địa chỉ một dòng. Điểm cách góc trên/phải (8px), giá cách góc dưới/trái (8px); mật độ nhỏ đổi inset thành (6px). Mảng ảnh lịch sử vẫn được giữ; album hiện còn badge số ảnh cho bản cũ có nhiều ảnh, trong khi quick form không có bộ đếm ảnh. Đánh giá không có ảnh dùng chữ đầu và camera được gắn nhãn “Chưa có ảnh”.

Hover bằng chuột zoom ảnh nhẹ (1.035) trong (320ms) và đổi viền; nhấn co tile còn (0.96). Entry vào trong (280ms), trễ theo index tối đa (140ms). Đổi mật độ dựng lại grid và chạy entry bằng scale/dịch chuyển có giới hạn; từng tile không dùng layout projection hay nội suy vị trí khi reflow. Chọn tile có glint một lần (600ms). Đổi sang reduced motion bỏ các hiệu ứng này, giữ lựa chọn và khả năng mở chi tiết.

Dialog chi tiết giữ tên ở header, ảnh vuông tối đa (380px), thumbnail (72px), thao tác, địa chỉ, điểm/tiêu chí và ghi chú. Không khôi phục inspector thường trực bên cạnh album. Dialog ảnh đầy đủ cho Back/Escape và trả focus về điểm mở.

### Inputs / Fields

Trường nhập nền surface, viền hairline, cỡ chữ `input`; trường thường dùng bo `field`, padding (10px 12px), tối thiểu (44px). Quick form dùng `input-field-quick`, tối thiểu (48px); riêng giá dùng `quick-price`, cao (56px), bo (14px), padding (8px 12px). Giá là text input với bàn phím decimal và `enterKeyHint="done"`, nhận dấu phẩy hoặc chấm; không dùng spinner số hay slider giá. Search là khung bo theo `field`, cao (44px), input chữ (13px) và icon SVG. Focus dùng vòng rõ thay vì chỉ đổi màu placeholder. Lỗi có nhãn tiếng Việt và `role="alert"`; trạng thái xử lý dùng `role="status"`.

### Navigation

Năm vị trí là Quán xá, Bản đồ, Chấm điểm, Nhật ký và Thống kê. Dock điện thoại là pill, khung tối thiểu `bottom-dock`, tối đa rộng (500px); mỗi ô có hàng icon (34px) và nhãn (11px), không xuống dòng theo override hiện tại. Camera ở vị trí thứ ba luôn có vòng lilac; chỉ glyph xoay, vòng không méo. Desktop rail giữ cùng thứ tự. Active indicator dùng nền mềm trong dock, acid trong rail. Các icon là SVG Lucide, không dùng ký tự text làm icon.

Indicator chung dùng spring (stiffness 360, damping 25); glyph dùng damping (20). Đổi tab thoát (120ms), vào (240ms), dịch ngang từ (18px); màn đang thoát inert và chỉ một màn hoạt động. Giảm chuyển động đưa trực tiếp tới trạng thái cuối. Đổi tab khi đang nhập giữ bản nháp để tiếp tục, tự lưu snapshot và không hiện modal hỏi bỏ thay đổi; “Bỏ bản nháp” là thao tác riêng trong phần mở rộng. Thời gian là thông số triển khai, không phải bằng chứng FPS máy thật.

### Capture and Quick Scoring

Hai vùng Mang về/Tại quán mở luồng phù hợp: mang về xác nhận ghim trước và giữ dòng nháp gọn trên album; tại quán mở camera trực tiếp. Camera vuông trong ứng dụng trả thẳng về form khi bấm chụp: CameraX dùng ViewPort 1:1 chung preview/capture, web dùng getUserMedia và crop vuông ở tâm. Không thêm màn xác nhận hệ thống. Viewfinder trên nền tối cố định, nút đóng/đổi camera tối thiểu (48px), shutter web tròn (88px) có viền sáng (6px). Ảnh thành công phát triển trong (480ms); hàng ảnh/giá vào trong (280ms), dịch từ (8px).

Form giữ ảnh và giá cạnh nhau, tổng điểm/Lưu ở toolbar; ba slider cho nước mang đi, bốn cho nước ngồi lại hoặc ăn. Slider có vùng tương tác cơ sở (44px), rãnh (5px), thumb tròn (28px), `touch-action: pan-y`; Android áp dụng các mục tiêu chạm đã khai báo tối thiểu (48px). Điểm thường (1–10), bước (0.5); lượng/khẩu phần có năm nấc (0–4), bước (1), hiển thị tên và điểm. Không gian ăn tại quán nằm trong Thông tin thêm; giá có trường riêng, không có slider chấm giá.

Giữ một ảnh cho đánh giá mới, nút xóa/chụp lại rõ và không làm mất giá/tiêu chí/ghim đã khóa. Hủy giữ ảnh cũ; bản cũ chưa có ảnh vẫn sửa được. GPS nền sau ảnh chỉ dành cho tại quán; không lấy GPS ở nhà để thay ghim mang về. Có nhiều nháp bền vững, dòng pending chỉ hiện khi có; Lưu/bỏ chỉ xóa nháp khớp. Không thêm ngày, giờ mở cửa hay bộ đếm ảnh vào quick form. Điều kiện lưu và migration khẩu phần của mọi quán ăn nằm trong `PRODUCT.md`.

### Photo Reel

Dải ảnh ngang dùng ảnh đánh giá thật hoặc ô thiếu ảnh trung thực, một marker giữa rộng (2px) với hai đầu hình thoi (10px), viền kết quả (2px), caption trên scrim. Kết quả được chọn bằng trọng số trước khi dựng dải; hiệu ứng giảm tốc (4,6 giây), easing `cubic-bezier(.09,.68,.12,1)`, tối đa (37) ô dùng chung blob URL. Ưu tiên ảnh chỉ ở preview nghỉ, không thay xác suất. Kết quả có tên/điểm/giá, một nút chính và thao tác phụ nhẹ. Reduced motion hoặc một ứng viên cho kết quả tức thì; không tự ghi lượt ghé/chi tiêu.

### Review Journal

Lịch tháng bảy cột dùng ảnh đầu tiên của đánh giá trong ngày hoặc dấu nhỏ nếu chưa có ảnh; ngày chọn có outline olive/acid, hôm nay gạch chân. Entries vuông có giờ trên trái, điểm trên phải, tên/giá bên dưới. Ngày/giờ tính theo Việt Nam, chỉ từ các đánh giá đang có; không phát sinh kho ảnh từng lượt ghé. Đổi tháng dịch (14px) và hiện trong (300ms), bỏ chuyển động khi quiet/reduced motion; nhấn ảnh co còn (0.97).

### Android Chrome

SystemBars gửi kiểu glyph trước; NotDisplay giữ theme hiện hành và áp dụng đồng bộ nền decor/WebView bằng token canvas cùng kiểu icon sáng/tối cho cả status bar và navigation bar. Từ API 29, tắt lớp tương phản navigation tự động của OS để ứng dụng kiểm soát nền và độ tương phản cùng nhau.

Đồng bộ lúc startup/đổi theme, áp dụng lại sau resume, đổi cấu hình và cạnh thay đổi hiển thị IME. Observer global-layout theo dõi IME không thay listener inset/keyboard của Capacitor và được gỡ khi destroy. Kiểm tra cả appearance flags thực tế và glyph navigation hiển thị trên ảnh chụp OS, với tương phản tối thiểu (3:1); không suy khả năng đọc chỉ từ màu nền hoặc status bar. Yêu cầu tần số quét cao không phải bảo đảm 120 fps.

Phần chưa chuẩn hóa thành hệ: map còn marker quán dùng emoji/ký tự sao và màu riêng từ lớp cũ. Đây là drift hiện có ngoài phạm vi album/capture, không phải mẫu icon hoặc palette để màn hình mới kế thừa; lần ghi tài liệu này không sửa mã ứng dụng.

## Do's and Don'ts

### Do:

- Do dùng ảnh người dùng thật; biểu diễn thiếu ảnh bằng chữ đầu và camera có nhãn.
- Do giữ ảnh vuông, hairline đều và góc điểm/giá cố định ở mọi số cột.
- Do dùng token sáng/tối tương ứng và Plus Jakarta Sans tự lưu cho chữ tiếng Việt.
- Do giữ focus thấy rõ, nhãn truy cập, mục tiêu chạm phù hợp và dock tăng cao theo chữ.
- Do xác nhận ghim mang về trước khi chụp ở nhà, giữ ghim đã khóa; tại quán lấy GPS nền sau ảnh và cho Lưu khi ảnh/giá hợp lệ.
- Do giữ giờ/điểm/tên/giá của đánh giá trong nhật ký; dùng ảnh thật trong reel và kết quả trọng số có sẵn.
- Do tôn trọng giảm chuyển động, giới hạn một trang album ở 24 đánh giá và dừng hiệu ứng trạng thái khi xong.

### Don't:

- Don't đưa ảnh concept, ảnh QA tổng hợp, avatar hoặc ảnh quán bịa vào đánh giá người dùng.
- Don't dùng các rãnh vé, vòng điểm lớn và inspector thường trực của danh sách cũ làm mẫu cho album mới.
- Don't biến mỗi tile thành một thẻ có bóng hoặc thêm mô tả thường trực, phiên bản hay lời chào vào chrome.
- Don't dùng chữ acid nhạt trên nền sáng hoặc thay họ neutral mực bằng slate cũ.
- Don't bỏ ảnh bắt buộc của đánh giá mới, chặn Lưu tại quán vì GPS, ép nhập tên, tự mở camera khi sửa hay thay ghim mang về bằng GPS tại nhà.
- Don't biến nhật ký thành kho ảnh lượt ghé, tăng xác suất vì có ảnh hoặc tự ghi lượt ghé/chi tiêu từ kết quả reel.
- Don't thêm ngày/giờ mở cửa/bộ đếm ảnh vào quick form hoặc hỏi bỏ bản nháp chỉ vì đổi tab.
- Don't coi build, ảnh chụp trình duyệt hoặc thông số animation là bằng chứng 120 fps hay kiểm thử camera/GPS trên thiết bị thật.
