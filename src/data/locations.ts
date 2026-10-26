export interface WardData {
  name: string;
  formerArea?: string; // Ghi chú khu vực sáp nhập để dễ tra cứu (không dùng cấp Quận)
  streets: string[];
}

export interface ProvinceData {
  id: string;
  name: string;
  type: 'Thành phố TW' | 'Tỉnh';
  mergedFrom?: string;
  wards: WardData[];
}

/**
 * DANH MỤC 34 ĐƠN VỊ HÀNH CHÍNH CẤP TỈNH CHÍNH THỨC CỦA VIỆT NAM (MÔ HÌNH MỚI - BỎ CẤP QUẬN/HUYỆN)
 * Cấu trúc chuẩn 3 cấp trực tiếp: Tỉnh/Thành phố -> Phường -> Đường
 */
export const OFFICIAL_34_PROVINCES: ProvinceData[] = [
  {
    id: 'da-nang',
    name: 'Đà Nẵng',
    type: 'Thành phố TW',
    mergedFrom: 'TP. Đà Nẵng & Quảng Nam',
    wards: [
      {
        name: 'Thanh Khê',
        formerArea: 'Thạc Gián, Chính Gián, Xuân Hà, Thanh Khê Đông/Tây',
        streets: [
          'Phan Thanh',
          'Hàm Nghi',
          'Nguyễn Văn Linh',
          'Điện Biên Phủ',
          'Lê Đình Lý',
          'Hùng Vương',
          'Hải Phòng',
          'Lê Độ',
          'Trần Cao Vân',
          'Ông Ích Khiêm',
          'Hoàng Hoa Thám',
          'Nguyễn Tất Thành',
          'Đặng Thai Mai',
          'Tản Đà',
          'Nguyễn Tri Phương',
          'Hà Huy Tập',
          'Thái Thị Bôi',
        ],
      },
      {
        name: 'Hải Châu',
        formerArea: 'Hải Châu, Thạch Thang, Phước Ninh, Thanh Bình, Thuận Phước',
        streets: [
          'Bạch Đằng',
          'Trần Phú',
          'Nguyễn Văn Linh',
          'Lê Duẩn',
          'Phan Châu Trinh',
          'Hoàng Diệu',
          'Ông Ích Khiêm',
          'Hùng Vương',
          'Nguyễn Chí Thanh',
          'Đống Đa',
          'Quang Trung',
          'Lý Tự Trọng',
          'Nguyễn Thái Học',
          'Yên Bái',
          'Pasteur',
          'Thái Phiên',
          'Huỳnh Thúc Kháng',
          'Triệu Nữ Vương',
        ],
      },
      {
        name: 'Hòa Cường',
        formerArea: 'Bình Thuận, Hòa Thuận Tây, Hòa Cường Bắc, Hòa Cường Nam',
        streets: [
          'Đường 2 Tháng 9',
          'Núi Thành',
          'Trưng Nữ Vương',
          'Nguyễn Hữu Thọ',
          'Duy Tân',
          'Lê Thanh Nghị',
          'Phan Đăng Lưu',
          'Đường 30 Tháng 4',
          'Tố Hữu',
          'Thi Sách',
          'Hoàng Diệu',
          'Chu Văn An',
          'Tiểu La',
        ],
      },
      {
        name: 'An Khê',
        formerArea: 'An Khê, Hòa An, Hòa Phát',
        streets: [
          'Điện Biên Phủ',
          'Hà Huy Tập',
          'Tôn Đức Thắng',
          'Trường Chinh',
          'Nguyễn Phước Nguyên',
          'Cù Chính Lan',
          'Lê Trọng Tấn',
          'Bắc Sơn',
        ],
      },
      {
        name: 'An Hải',
        formerArea: 'Phước Mỹ, An Hải Bắc, An Hải Nam',
        streets: [
          'Phạm Văn Đồng',
          'Võ Văn Kiệt',
          'Võ Nguyên Giáp',
          'Trần Hưng Đạo',
          'Ngô Quyền',
          'Nguyễn Văn Thoại',
          'Hồ Nghinh',
          'Hà Bổng',
          'Dương Đình Nghệ',
          'Loseby',
          'Morrison',
          'Lý Nam Đế',
        ],
      },
      {
        name: 'Sơn Trà',
        formerArea: 'Thọ Quang, Nại Hiên Đông, Mân Thái',
        streets: [
          'Ngô Quyền',
          'Lê Đức Thọ',
          'Hoàng Sa',
          'Chu Huy Mân',
          'Trần Hưng Đạo',
          'Khúc Hạo',
          'Trần Nhân Tông',
          'Vân Đồn',
        ],
      },
      {
        name: 'Ngũ Hành Sơn',
        formerArea: 'Mỹ An, Khuê Mỹ, Hòa Hải, Hòa Quý',
        streets: [
          'Châu Thị Vĩnh Tế',
          'Ngô Thì Sĩ',
          'Phan Tứ',
          'An Thượng 1',
          'An Thượng 2',
          'An Thượng 3',
          'An Thượng 4',
          'Hoàng Kế Viêm',
          'Nguyễn Văn Thoại',
          'Lê Quang Đạo',
          'Lê Văn Hiến',
          'Ngũ Hành Sơn',
          'Hồ Xuân Hương',
        ],
      },
      {
        name: 'Cẩm Lệ',
        formerArea: 'Khuê Trung, Hòa Thọ Đông, Hòa Thọ Tây',
        streets: [
          'Cách Mạng Tháng 8',
          'Ông Ích Đường',
          'Nguyễn Hữu Thọ',
          'Thăng Long',
          'Lê Đại Hành',
          'Trường Chinh',
        ],
      },
      {
        name: 'Hòa Xuân',
        formerArea: 'Hòa Xuân, Hòa Châu',
        streets: [
          'Phạm Hùng',
          'Nguyễn Phước Lan',
          'Võ Chí Công',
          'Mẹ Thứ',
          'Đô Đốc Lân',
          'Văn Tiến Dũng',
        ],
      },
      {
        name: 'Hòa Khánh',
        formerArea: 'Hòa Khánh Bắc, Hòa Khánh Nam, Hòa Minh',
        streets: [
          'Tôn Đức Thắng',
          'Nguyễn Lương Bằng',
          'Nguyễn Sinh Sắc',
          'Hoàng Thị Loan',
          'Âu Cơ',
          'Phạm Như Xương',
          'Ngô Văn Sở',
          'Kinh Dương Vương',
        ],
      },
      {
        name: 'Hải Vân',
        formerArea: 'Hòa Hiệp Bắc, Hòa Hiệp Nam',
        streets: [
          'Nguyễn Lương Bằng',
          'Nguyễn Tất Thành Nối Dài',
          'Đàm Quang Trung',
          'Suối Lương',
        ],
      },
      {
        name: 'Hội An',
        formerArea: 'Minh An, Cẩm Phô, Sơn Phong, Cẩm Châu',
        streets: [
          'Trần Phú',
          'Nguyễn Thái Học',
          'Bạch Đằng',
          'Phan Chu Trinh',
          'Hai Bà Trưng',
          'Lý Thường Kiệt',
          'Cửa Đại',
        ],
      },
      {
        name: 'Tam Kỳ',
        formerArea: 'Tân Thạnh, An Mỹ, Phước Hòa, An Xuân',
        streets: [
          'Phan Châu Trinh',
          'Hùng Vương',
          'Trần Cao Vân',
          'Huỳnh Thúc Kháng',
          'Nguyễn Chí Thanh',
        ],
      },
    ],
  },
  {
    id: 'tp-hcm',
    name: 'TP. Hồ Chí Minh',
    type: 'Thành phố TW',
    mergedFrom: 'TP.HCM, Bình Dương & Bà Rịa - Vũng Tàu',
    wards: [
      {
        name: 'Sài Gòn',
        formerArea: 'Bến Nghé, Nguyễn Thái Bình',
        streets: ['Nguyễn Huệ', 'Lê Lợi', 'Đồng Khởi', 'Pasteur', 'Lý Tự Trọng', 'Mạc Thị Bưởi', 'Hàm Nghi'],
      },
      {
        name: 'Bến Thành',
        formerArea: 'Bến Thành, Phạm Ngũ Lão, Cầu Ông Lãnh',
        streets: ['Lê Thánh Tôn', 'Nguyễn Thị Minh Khai', 'Trần Hưng Đạo', 'Bùi Viện', 'Cách Mạng Tháng 8'],
      },
      {
        name: 'Tân Định',
        formerArea: 'Tân Định, Đa Kao',
        streets: ['Hai Bà Trưng', 'Trần Quang Khải', 'Đinh Tiên Hoàng', 'Nguyễn Văn Thủ', 'Mạc Đĩnh Chi'],
      },
      {
        name: 'Xuân Hòa / Nhiêu Lộc',
        formerArea: 'Võ Thị Sáu, Khu vực trung tâm',
        streets: ['Võ Văn Tần', 'Nguyễn Đình Chiểu', 'Phạm Ngọc Thạch', 'Trương Định', 'Nam Kỳ Khởi Nghĩa'],
      },
      {
        name: 'Thảo Điền / An Khánh',
        formerArea: 'Thảo Điền, An Phú',
        streets: ['Xuân Thủy', 'Trần Ngọc Diện', 'Quốc Hương', 'Nguyễn Văn Hưởng', 'Tống Hữu Định'],
      },
      {
        name: 'Thủ Dầu Một',
        formerArea: 'Bình Dương cũ',
        streets: ['Đại lộ Bình Dương', 'Yersin', 'Cách Mạng Tháng 8', 'Bạch Đằng', 'Thích Quảng Đức'],
      },
      {
        name: 'Vũng Tàu',
        formerArea: 'Bà Rịa - Vũng Tàu cũ',
        streets: ['Thùy Vân', 'Hạ Long', 'Trần Phú', 'Ba Cu', 'Lê Hồng Phong', 'Nguyễn An Ninh'],
      },
    ],
  },
  {
    id: 'ha-noi',
    name: 'Hà Nội',
    type: 'Thành phố TW',
    wards: [
      {
        name: 'Hoàn Kiếm',
        formerArea: 'Hàng Trống, Hàng Bạc, Tràng Tiền',
        streets: ['Đinh Tiên Hoàng', 'Nhà Thờ', 'Hàng Gai', 'Lý Quốc Sư', 'Tạ Hiện', 'Tràng Tiền', 'Phố Huế'],
      },
      {
        name: 'Ba Đình',
        formerArea: 'Quán Thánh, Điện Biên, Kim Mã',
        streets: ['Phan Đình Phùng', 'Kim Mã', 'Nguyễn Thái Học', 'Đội Cấn', 'Liễu Giai'],
      },
      {
        name: 'Tây Hồ',
        formerArea: 'Quảng An, Xuân La, Thụy Khuê',
        streets: ['Nguyễn Đình Thi', 'Trích Sài', 'Tô Ngọc Vân', 'Xuân Diệu', 'Lạc Long Quân'],
      },
      {
        name: 'Đống Đa',
        formerArea: 'Láng Hạ, Trung Liệt, Ô Chợ Dừa',
        streets: ['Láng Hạ', 'Thái Hà', 'Chùa Bộc', 'Tôn Đức Thắng', 'Xã Đàn', 'Hoàng Cầu'],
      },
      {
        name: 'Cầu Giấy',
        formerArea: 'Dịch Vọng, Trung Hòa, Nghĩa Tân',
        streets: ['Cầu Giấy', 'Xuân Thủy', 'Trần Duy Hưng', 'Trung Hòa', 'Tô Hiệu'],
      },
    ],
  },
  {
    id: 'hue',
    name: 'Huế',
    type: 'Thành phố TW',
    wards: [
      {
        name: 'Thuận Hóa',
        formerArea: 'Phú Hội, Vĩnh Ninh, Xuân Phú',
        streets: ['Lê Lợi', 'Hùng Vương', 'Bến Nghé', 'Nguyễn Công Trứ', 'Chu Văn An', 'Hai Bà Trưng', 'Đống Đa'],
      },
      {
        name: 'Phú Xuân',
        formerArea: 'Thuận Hòa, Tây Lộc, Kim Long',
        streets: ['Trần Hưng Đạo', 'Lê Duẩn', 'Kim Long', 'Đặng Thái Thân', 'Mai Thúc Loan'],
      },
    ],
  },
  {
    id: 'hai-phong',
    name: 'Hải Phòng',
    type: 'Thành phố TW',
    mergedFrom: 'Hải Phòng & Hải Dương',
    wards: [
      {
        name: 'Hồng Bàng / Ngô Quyền',
        streets: ['Điện Biên Phủ', 'Lê Hồng Phong', 'Lạch Tray', 'Trần Phú', 'Cầu Đất'],
      },
      {
        name: 'Hải Dương',
        streets: ['Trần Hưng Đạo', 'Nguyễn Lương Bằng', 'Thanh Niên', 'Bạch Đằng'],
      },
    ],
  },
  {
    id: 'can-tho',
    name: 'Cần Thơ',
    type: 'Thành phố TW',
    mergedFrom: 'Cần Thơ, Sóc Trăng & Hậu Giang',
    wards: [
      {
        name: 'Ninh Kiều',
        streets: ['Đường 30 Tháng 4', 'Mậu Thân', 'Nguyễn Văn Cừ', 'Hai Bà Trưng', 'Hòa Bình'],
      },
    ],
  },
  // 28 TỈNH CÒN LẠI TRONG 34 TỈNH/THÀNH MỚI
  { id: 'lam-dong', name: 'Lâm Đồng', type: 'Tỉnh', mergedFrom: 'Lâm Đồng, Bình Thuận & Đắk Nông', wards: [{ name: 'Xuân Hương (Đà Lạt)', streets: ['Nguyễn Chí Thanh', 'Hồ Tùng Mậu', 'Trần Phú', 'Ba Tháng Tư', 'Phan Đình Phùng'] }, { name: 'Phan Thiết', streets: ['Nguyễn Đình Chiểu', 'Tôn Đức Thắng', 'Thủ Khoa Huân'] }] },
  { id: 'khanh-hoa', name: 'Khánh Hòa', type: 'Tỉnh', mergedFrom: 'Khánh Hòa & Ninh Thuận', wards: [{ name: 'Nha Trang', streets: ['Trần Phú', 'Nguyễn Thị Minh Khai', 'Lê Thánh Tôn', 'Hồng Bàng'] }, { name: 'Phan Rang', streets: ['Đường 16 Tháng 4', 'Thống Nhất', 'Ngô Gia Tự'] }] },
  { id: 'gia-lai', name: 'Gia Lai', type: 'Tỉnh', mergedFrom: 'Gia Lai & Bình Định', wards: [{ name: 'Quy Nhơn', streets: ['Xuân Diệu', 'Nguyễn Tất Thành', 'An Dương Vương', 'Ngô Mây'] }, { name: 'Pleiku', streets: ['Hùng Vương', 'Phạm Văn Đồng', 'Nguyễn Tất Thành'] }] },
  { id: 'dak-lak', name: 'Đắk Lắk', type: 'Tỉnh', mergedFrom: 'Đắk Lắk & Phú Yên', wards: [{ name: 'Buôn Ma Thuột', streets: ['Lê Duẩn', 'Nguyễn Tất Thành', 'Phan Chu Trinh'] }, { name: 'Tuy Hòa', streets: ['Hùng Vương', 'Độc Lập', 'Trần Hưng Đạo'] }] },
  { id: 'quang-ngai', name: 'Quảng Ngãi', type: 'Tỉnh', mergedFrom: 'Quảng Ngãi & Kon Tum', wards: [{ name: 'Cẩm Thành (Quảng Ngãi)', streets: ['Hùng Vương', 'Quang Trung', 'Phan Đình Phùng'] }, { name: 'Kon Tum', streets: ['Trần Phú', 'Bà Triệu', 'Lê Hồng Phong'] }] },
  { id: 'quang-tri', name: 'Quảng Trị', type: 'Tỉnh', mergedFrom: 'Quảng Trị & Quảng Bình', wards: [{ name: 'Đồng Hới', streets: ['Trương Pháp', 'Trần Hưng Đạo', 'Lý Thường Kiệt'] }, { name: 'Đông Hà', streets: ['Hùng Vương', 'Lê Duẩn', 'Quốc lộ 9'] }] },
  { id: 'nghe-an', name: 'Nghệ An', type: 'Tỉnh', wards: [{ name: 'Thành Vinh', streets: ['Quang Trung', 'Lê Mao', 'Nguyễn Văn Cừ', 'Hồ Tùng Mậu'] }] },
  { id: 'thanh-hoa', name: 'Thanh Hóa', type: 'Tỉnh', wards: [{ name: 'Hạc Thành', streets: ['Lê Hoàn', 'Trần Phú', 'Đại lộ Lê Lợi'] }] },
  { id: 'ha-tinh', name: 'Hà Tĩnh', type: 'Tỉnh', wards: [{ name: 'Thành Sen', streets: ['Hà Huy Tập', 'Trần Phú', 'Nguyễn Công Trứ'] }] },
  { id: 'quang-ninh', name: 'Quảng Ninh', type: 'Tỉnh', wards: [{ name: 'Hạ Long', streets: ['Hạ Long', 'Trần Quốc Nghiễn', 'Nguyễn Văn Cừ'] }] },
  { id: 'bac-ninh', name: 'Bắc Ninh', type: 'Tỉnh', mergedFrom: 'Bắc Ninh & Bắc Giang', wards: [{ name: 'Kinh Bắc', streets: ['Lý Thái Tổ', 'Nguyễn Gia Thiều', 'Trần Hưng Đạo'] }] },
  { id: 'hung-yen', name: 'Hưng Yên', type: 'Tỉnh', mergedFrom: 'Hưng Yên & Thái Bình', wards: [{ name: 'Phố Hiến', streets: ['Điện Biên', 'Tô Hiệu'] }, { name: 'Thái Bình', streets: ['Lê Lợi', 'Lý Bôn'] }] },
  { id: 'ninh-binh', name: 'Ninh Bình', type: 'Tỉnh', mergedFrom: 'Ninh Bình, Nam Định & Hà Nam', wards: [{ name: 'Hoa Lư', streets: ['Trần Hưng Đạo', 'Tràng An'] }, { name: 'Nam Định', streets: ['Trần Hưng Đạo', 'Đông A'] }] },
  { id: 'phu-tho', name: 'Phú Thọ', type: 'Tỉnh', mergedFrom: 'Phú Thọ, Vĩnh Phúc & Hòa Bình', wards: [{ name: 'Việt Trì', streets: ['Hùng Vương', 'Nguyễn Tất Thành'] }, { name: 'Vĩnh Yên', streets: ['Mê Linh', 'Nguyễn Tất Thành'] }] },
  { id: 'thai-nguyen', name: 'Thái Nguyên', type: 'Tỉnh', mergedFrom: 'Thái Nguyên & Bắc Kạn', wards: [{ name: 'Phan Đình Phùng', streets: ['Lương Ngọc Quyến', 'Hoàng Văn Thụ'] }] },
  { id: 'tuyen-quang', name: 'Tuyên Quang', type: 'Tỉnh', mergedFrom: 'Tuyên Quang & Hà Giang', wards: [{ name: 'Tân Quang', streets: ['Bình Thuận', '17 Tháng 8'] }, { name: 'Hà Giang', streets: ['Nguyễn Trãi', 'Trần Phú'] }] },
  { id: 'lao-cai', name: 'Lào Cai', type: 'Tỉnh', mergedFrom: 'Lào Cai & Yên Bái', wards: [{ name: 'Sa Pa', streets: ['Cầu Mây', 'Fansipan', 'Mường Hoa'] }, { name: 'Lào Cai', streets: ['Hoàng Liên', 'An Dương Vương'] }] },
  { id: 'cao-bang', name: 'Cao Bằng', type: 'Tỉnh', wards: [{ name: 'Hợp Giang', streets: ['Kim Đồng', 'Phố Cũ'] }] },
  { id: 'lang-son', name: 'Lạng Sơn', type: 'Tỉnh', wards: [{ name: 'Đông Kinh', streets: ['Bà Triệu', 'Lê Lợi'] }] },
  { id: 'son-la', name: 'Sơn La', type: 'Tỉnh', wards: [{ name: 'Tô Hiệu', streets: ['Trường Chinh', 'Chu Văn Thịnh'] }] },
  { id: 'dien-bien', name: 'Điện Biên', type: 'Tỉnh', wards: [{ name: 'Mường Thanh', streets: ['Võ Nguyên Giáp', 'Nguyễn Hữu Thọ'] }] },
  { id: 'lai-chau', name: 'Lai Châu', type: 'Tỉnh', wards: [{ name: 'Đoàn Kết', streets: ['Trần Phú', 'Võ Nguyên Giáp'] }] },
  { id: 'dong-nai', name: 'Đồng Nai', type: 'Tỉnh', mergedFrom: 'Đồng Nai & Bình Phước', wards: [{ name: 'Trấn Biên (Biên Hòa)', streets: ['Võ Thị Sáu', 'Phạm Văn Thuận', 'Đồng Khởi'] }] },
  { id: 'tay-ninh', name: 'Tây Ninh', type: 'Tỉnh', mergedFrom: 'Tây Ninh & Long An', wards: [{ name: 'Tây Ninh', streets: ['Cách Mạng Tháng 8', '30 Tháng 4'] }, { name: 'Tân An', streets: ['Hùng Vương', 'Nguyễn Đình Chiểu'] }] },
  { id: 'dong-thap', name: 'Đồng Tháp', type: 'Tỉnh', mergedFrom: 'Đồng Tháp & Tiền Giang', wards: [{ name: 'Mỹ Tho', streets: ['Ấp Bắc', 'Nam Kỳ Khởi Nghĩa'] }, { name: 'Cao Lãnh', streets: ['Nguyễn Huệ', '30 Tháng 4'] }] },
  { id: 'vinh-long', name: 'Vĩnh Long', type: 'Tỉnh', mergedFrom: 'Vĩnh Long, Bến Tre & Trà Vinh', wards: [{ name: 'Vĩnh Long', streets: ['Phạm Thái Bường', 'Trưng Nữ Vương'] }, { name: 'Bến Tre', streets: ['Đồng Khởi', 'Nguyễn Đình Chiểu'] }] },
  { id: 'an-giang', name: 'An Giang', type: 'Tỉnh', mergedFrom: 'An Giang & Kiên Giang', wards: [{ name: 'Long Xuyên', streets: ['Hà Hoàng Hổ', 'Nguyễn Trãi'] }, { name: 'Rạch Giá / Phú Quốc', streets: ['Nguyễn Trung Trực', 'Trần Hưng Đạo'] }] },
  { id: 'ca-mau', name: 'Cà Mau', type: 'Tỉnh', mergedFrom: 'Cà Mau & Bạc Liêu', wards: [{ name: 'An Xuyên (Cà Mau)', streets: ['Trần Hưng Đạo', 'Phan Ngọc Hiển'] }, { name: 'Bạc Liêu', streets: ['Trần Phú', 'Hai Bà Trưng'] }] },
];
