// ============================================================================
// DỮ LIỆU ĐỊA LÝ HÀNH CHÍNH VIỆT NAM CHÍNH THỨC MỚI NHẤT (SAU SÁP NHẬP 2025/2026)
// Mô hình 2 cấp địa phương: 34 Tỉnh/Thành phố -> Phường/Xã -> Đường/Phố
// Kết hợp cơ sở dữ liệu nội tuyến toàn diện & đồng bộ trực tiếp OpenStreetMap
// ============================================================================

export interface ProvinceData {
  name: string;
  type: 'Thành phố TW' | 'Tỉnh';
  mergedFrom: string;
  adminCenter: string;
  lat: number;
  lng: number;
  wards: string[];
  streetsByWard: Record<string, string[]>;
  defaultStreets: string[];
  wardCoords?: Record<string, [number, number]>;
  streetCoords?: Record<string, [number, number]>;
}

export const VIETNAM_34_PROVINCES_DATA: ProvinceData[] = [
  // ==========================================================================
  // 1. THÀNH PHỐ ĐÀ NẴNG (Đà Nẵng + Quảng Nam - 23 Phường đô thị mới & các Xã)
  // ==========================================================================
  {
    name: 'Đà Nẵng',
    type: 'Thành phố TW',
    mergedFrom: 'TP. Đà Nẵng + Tỉnh Quảng Nam',
    adminCenter: 'Phường Hải Châu, TP. Đà Nẵng',
    lat: 16.0678,
    lng: 108.2208,
    wards: [
      // 23 Phường đô thị chính thức sau sáp nhập
      'Thanh Khê',
      'Hải Châu',
      'Hòa Cường',
      'An Khê',
      'An Hải',
      'Sơn Trà',
      'Ngũ Hành Sơn',
      'Hòa Khánh',
      'Hải Vân',
      'Liên Chiểu',
      'Cẩm Lệ',
      'Hòa Xuân',
      'Hội An',
      'Hội An Đông',
      'Hội An Tây',
      'Tam Kỳ',
      'An Phú',
      'Quảng Phú',
      'Bàn Thạch',
      'Điện Bàn',
      'Điện Bàn Bắc',
      'Điện Bàn Đông',
      'An Thắng',
      // Các Xã & Đặc khu tiêu biểu
      'Xã Hòa Vang',
      'Xã Hòa Tiến',
      'Xã Bà Nà',
      'Xã Núi Thành',
      'Xã Duy Xuyên',
      'Xã Đại Lộc',
      'Xã Thăng Bình',
      'Xã Tân Hiệp (Cù Lao Chàm)',
      'Đặc khu Hoàng Sa',
    ],
    wardCoords: {
      'Thanh Khê': [16.0664, 108.1956],
      'Hải Châu': [16.0718, 108.2215],
      'Hòa Cường': [16.0412, 108.2218],
      'An Khê': [16.0558, 108.1795],
      'An Hải': [16.0615, 108.2385],
      'Sơn Trà': [16.0912, 108.2435],
      'Ngũ Hành Sơn': [16.0185, 108.2512],
      'Hòa Khánh': [16.0752, 108.1518],
      'Hải Vân': [16.1255, 108.1245],
      'Liên Chiểu': [16.0885, 108.1425],
      'Cẩm Lệ': [16.0195, 108.2025],
      'Hòa Xuân': [16.0085, 108.2195],
      'Hội An': [15.8801, 108.338],
      'Hội An Đông': [15.8855, 108.356],
      'Hội An Tây': [15.8825, 108.321],
      'Tam Kỳ': [15.5736, 108.474],
      'Điện Bàn': [15.8915, 108.245],
    },
    streetCoords: {
      'Phan Thanh': [16.0618, 108.2088],
      'Hàm Nghi': [16.0605, 108.2102],
      'Lê Duẩn': [16.0688, 108.2145],
      'Nguyễn Văn Linh': [16.0602, 108.2165],
      'Hùng Vương': [16.0682, 108.2185],
      'Điện Biên Phủ': [16.0658, 108.1925],
      'Bạch Đằng': [16.0695, 108.2248],
      'Trần Phú': [16.0702, 108.2232],
      'Nguyễn Chí Thanh': [16.0735, 108.2212],
      'Yên Bái': [16.0692, 108.2214],
      'Hoàng Diệu': [16.0585, 108.2192],
      'Ông Ích Khiêm': [16.0698, 108.2152],
      'Trần Cao Vân': [16.0725, 108.2015],
      'Nguyễn Tất Thành': [16.0815, 108.1895],
      'Võ Nguyên Giáp': [16.0625, 108.2468],
      'Phạm Văn Đồng': [16.0715, 108.2385],
      'Châu Thị Vĩnh Tế': [16.0465, 108.2415],
      'Phan Châu Trinh': [16.0642, 108.2205],
      'Trưng Nữ Vương': [16.0512, 108.2198],
      'Núi Thành': [16.0425, 108.2235],
      '2 Tháng 9': [16.0485, 108.2255],
    },
    streetsByWard: {
      'Thanh Khê': [
        'Phan Thanh',
        'Hàm Nghi',
        'Lê Duẩn',
        'Điện Biên Phủ',
        'Trần Cao Vân',
        'Nguyễn Tất Thành',
        'Hùng Vương',
        'Ông Ích Khiêm',
        'Hải Phòng',
        'Đặng Thai Mai',
        'Nguyễn Tri Phương',
        'Nguyễn Hoàng',
        'Lê Đình Lý',
        'Văn Cao',
        'Đỗ Quang',
        'Hoàng Hoa Thám',
        'Lý Thái Tổ',
        'Thái Thị Bôi',
        'Hà Huy Tập',
        'Kỳ Đồng',
        'Nguyễn Đức Trung',
        'Dũng Sĩ Thanh Khê',
      ],
      'Hải Châu': [
        'Bạch Đằng',
        'Trần Phú',
        'Nguyễn Văn Linh',
        'Lê Duẩn',
        'Phan Châu Trinh',
        'Hoàng Diệu',
        'Nguyễn Chí Thanh',
        'Yên Bái',
        'Lê Đình Dương',
        'Hùng Vương',
        'Ông Ích Khiêm',
        'Quang Trung',
        'Đống Đa',
        'Lý Tự Trọng',
        'Pasteur',
        'Ngô Gia Tự',
        'Triệu Nữ Vương',
        'Lê Lợi',
        'Trần Quốc Toản',
        'Thái Phiên',
        'Nguyễn Thị Minh Khai',
        'Hải Phòng',
        '3 Tháng 2',
        'Như Nguyệt',
      ],
      'Hòa Cường': [
        '2 Tháng 9',
        'Núi Thành',
        'Trưng Nữ Vương',
        'Phan Đăng Lưu',
        'Lê Thanh Nghị',
        'Tiểu La',
        'Nguyễn Hữu Thọ',
        'Lêợi',
        'Xô Viết Nghệ Tĩnh',
        'Nguyễn Sơn Trà',
        'Hoàng Diệu',
        'Trần Thủ Độ',
        'Lương Nhữ Hộc',
        'Tố Hữu',
        '30 Tháng 4',
      ],
      'An Khê': [
        'Tôn Đức Thắng',
        'Trường Chinh',
        'Nguyễn Phước Nguyên',
        'Cù Chính Lan',
        'Lê Trọng Tấn',
        'Bắc Sơn',
        'Yên Thế',
        'Ngô Chân Lưu',
        'Nguyễn Đình Tựu',
        'Hà Huy Tập',
      ],
      'An Hải': [
        'Phạm Văn Đồng',
        'Võ Văn Kiệt',
        'Võ Nguyên Giáp',
        'Ngô Quyền',
        'Trần Hưng Đạo',
        'Nguyễn Công Trứ',
        'Loseby',
        'An Hải Đông 1',
        'Hà Chương',
        'Dương Đình Nghệ',
        'Hồ Nghinh',
        'Nguyễn Văn Thoại',
        'Lê Quang Đạo',
      ],
      'Sơn Trà': [
        'Lê Đức Thọ',
        'Hoàng Sa',
        'Trần Hưng Đạo',
        'Ngô Quyền',
        'Yết Kiêu',
        'Khúc Hạo',
        'Vương Thừa Vũ',
        'Chu Huy Mân',
        'Dương Vân Nga',
        'Nguyễn Phan Vinh',
      ],
      'Ngũ Hành Sơn': [
        'Châu Thị Vĩnh Tế',
        'Ngô Thì Sĩ',
        'Lê Quang Đạo',
        'Phan Tứ',
        'Nguyễn Văn Thoại',
        'Trần Bạch Đằng',
        'Đỗ Bá',
        'Hồ Xuân Hương',
        'Lê Văn Hiến',
        'Trường Sa',
        'Non Nước',
        'Huyền Trân Công Chúa',
      ],
      'Hòa Khánh': [
        'Tôn Đức Thắng',
        'Nguyễn Lương Bằng',
        'Âu Cơ',
        'Phạm Như Xương',
        'Ngô Văn Sở',
        'Nguyễn Sinh Sắc',
        'Hoàng Thị Loan',
        'Kinh Dương Vương',
        'Nguyễn Chánh',
        'Đặng Dung',
      ],
      'Liên Chiểu': [
        'Nguyễn Lương Bằng',
        'Tạ Quang Bửu',
        'Lạc Long Quân',
        'Nguyễn Tất Thành Nối Dài',
        'Đoàn Phú Tứ',
        'Nam Cao',
      ],
      'Hải Vân': [
        'Nguyễn Lương Bằng',
        'Đèo Hải Vân',
        'Suối Lương',
        'Tạ Quang Bửu',
        'Đường ĐT601',
      ],
      'Cẩm Lệ': [
        'Cách Mạng Tháng 8',
        'Ông Ích Đường',
        'Nguyễn Hữu Thọ',
        'Thăng Long',
        'Trần Quý Hai',
        'Lê Đại Hành',
        'Bình Thái 1',
        'Phan Khoang',
      ],
      'Hòa Xuân': [
        'Phạm Hùng',
        'Võ Chí Công',
        'Nguyễn Phước Lan',
        '29 Tháng 3',
        'Đô Đốc Lân',
        'Bùi Trang Chước',
        'Văn Tiến Dũng',
      ],
      'Hội An': [
        'Trần Phú',
        'Nguyễn Thái Học',
        'Bạch Đằng',
        'Hai Bà Trưng',
        'Lý Thường Kiệt',
        'Phan Chu Trinh',
        'Lê Lợi',
        'Cửa Đại',
        'Nguyễn Duy Hiệu',
      ],
      'Hội An Đông': [
        'Cửa Đại',
        'Âu Cơ',
        'Lạc Long Quân',
        'Trần Nhân Tông',
        'Nguyễn Phan Vinh',
      ],
      'Hội An Tây': [
        'Hùng Vương',
        'Nguyễn Tất Thành',
        'Lý Thường Kiệt',
        'Tôn Đức Thắng',
        'Hai Bà Trưng',
      ],
      'Tam Kỳ': [
        'Phan Châu Trinh',
        'Hùng Vương',
        'Trần Cao Vân',
        'Nguyễn Chí Thanh',
        'Huỳnh Thúc Kháng',
        'Lý Thường Kiệt',
        'Trưng Nữ Vương',
      ],
      'Điện Bàn': [
        'Trần Nhân Tông',
        'Hoàng Diệu',
        'Nguyễn Tất Thành',
        'Mẹ Thứ',
        'Đường ĐT607',
      ],
    },
    defaultStreets: [
      'Phan Thanh',
      'Hàm Nghi',
      'Lê Duẩn',
      'Nguyễn Văn Linh',
      'Bạch Đằng',
      'Trần Phú',
      'Hùng Vương',
      'Điện Biên Phủ',
      'Châu Thị Vĩnh Tế',
      'Võ Nguyên Giáp',
      'Phạm Văn Đồng',
      '2 Tháng 9',
      'Núi Thành',
      'Trưng Nữ Vương',
      'Phan Châu Trinh',
      'Hoàng Diệu',
      'Nguyễn Chí Thanh',
      'Yên Bái',
      'Ông Ích Khiêm',
      'Trần Cao Vân',
    ],
  },

  // ==========================================================================
  // 2. THÀNH PHỐ HỒ CHÍ MINH (TP.HCM + Bình Dương + Bà Rịa - Vũng Tàu)
  // ==========================================================================
  {
    name: 'TP. Hồ Chí Minh',
    type: 'Thành phố TW',
    mergedFrom: 'TP. Hồ Chí Minh + Bình Dương + Bà Rịa - Vũng Tàu',
    adminCenter: 'Phường Sài Gòn, TP. Hồ Chí Minh',
    lat: 10.7769,
    lng: 106.7009,
    wards: [
      'Sài Gòn',
      'Bến Thành',
      'Tân Định',
      'Cầu Ông Lãnh',
      'Bàn Cờ',
      'Xuân Hòa',
      'Nhiêu Lộc',
      'Chợ Quán',
      'An Đông',
      'Chợ Lớn',
      'Phú Lâm',
      'Gia Định',
      'Bình Thạnh',
      'Thạnh Mỹ Tây',
      'Phú Nhuận',
      'Đức Nhuận',
      'Tân Sơn Nhất',
      'Tân Bình',
      'Tân Phú',
      'Phú Thạnh',
      'Thảo Điền',
      'An Khánh',
      'Thủ Đức',
      'Hiệp Bình',
      'Tân Hưng',
      'Phú Mỹ Hưng',
      'Gò Vấp',
      'Hạnh Thông',
      'Thủ Dầu Một',
      'Thuận An',
      'Dĩ An',
      'Bến Cát',
      'Tân Uyên',
      'Vũng Tàu',
      'Tam Thắng',
      'Bà Rịa',
      'Đặc khu Côn Đảo',
    ],
    streetsByWard: {
      'Sài Gòn': [
        'Nguyễn Huệ',
        'Đồng Khởi',
        'Lê Lợi',
        'Hàm Nghi',
        'Lê Thánh Tôn',
        'Lý Tự Trọng',
        'Pasteur',
        'Tôn Đức Thắng',
        'Hai Bà Trưng',
        'Nguyễn Du',
        'Mạc Thị Bưởi',
        'Ngô Đức Kế',
      ],
      'Bến Thành': [
        'Lê Lai',
        'Lê Thánh Tôn',
        'Phan Bội Châu',
        'Phan Chu Trinh',
        'Bùi Viện',
        'Phạm Ngũ Lão',
        'Đề Thám',
        'Trần Hưng Đạo',
        'Nguyễn Thái Học',
        'Cách Mạng Tháng 8',
      ],
      'Tân Định': [
        'Hai Bà Trưng',
        'Trần Quang Khải',
        'Đinh Tiên Hoàng',
        'Nguyễn Văn Thủ',
        'Điện Biên Phủ',
        'Võ Thị Sáu',
        'Phan Kế Bính',
        'Mai Thị Lựu',
      ],
      'Bàn Cờ': [
        'Nguyễn Đình Chiểu',
        'Nguyễn Thiện Thuật',
        'Cao Thắng',
        'Điện Biên Phủ',
        'Võ Văn Tần',
        'Cách Mạng Tháng 8',
      ],
      'Xuân Hòa': [
        'Võ Văn Tần',
        'Phạm Ngọc Thạch',
        'Pasteur',
        'Nam Kỳ Khởi Nghĩa',
        'Tú Xương',
        'Trương Định',
        'Bà Huyện Thanh Quan',
      ],
      'Thảo Điền': [
        'Xuân Thủy',
        'Thảo Điền',
        'Nguyễn Văn Hưởng',
        'Quốc Hương',
        'Trần Ngọc Diện',
        'Tống Hữu Định',
      ],
      'Vũng Tàu': [
        'Thùy Vân',
        'Hạ Long',
        'Quang Trung',
        'Trần Phú',
        'Hoàng Hoa Thám',
        'Nguyễn Trường Tộ',
        'Ba Cu',
        'Lê Hồng Phong',
      ],
      'Thủ Dầu Một': [
        'Đại lộ Bình Dương',
        'Yersin',
        'Bạch Đằng',
        'Cách Mạng Tháng 8',
        '30 Tháng 4',
        'Thích Quảng Đức',
      ],
    },
    defaultStreets: [
      'Nguyễn Huệ',
      'Đồng Khởi',
      'Lê Lợi',
      'Pasteur',
      'Hai Bà Trưng',
      'Võ Văn Tần',
      'Nguyễn Đình Chiểu',
      'Phan Xích Long',
      'Xuân Thủy',
      'Sư Vạn Hạnh',
      'Nguyễn Trãi',
      'Trần Hưng Đạo',
      'Điện Biên Phủ',
      'Phạm Ngọc Thạch',
      'Bùi Viện',
    ],
  },

  // ==========================================================================
  // 3. THÀNH PHỐ HÀ NỘI
  // ==========================================================================
  {
    name: 'Hà Nội',
    type: 'Thành phố TW',
    mergedFrom: 'Giữ nguyên TP. Hà Nội (Sắp xếp còn 51 Phường & 75 Xã)',
    adminCenter: 'Phường Hoàn Kiếm, TP. Hà Nội',
    lat: 21.0285,
    lng: 105.8542,
    wards: [
      'Hoàn Kiếm',
      'Cửa Nam',
      'Ba Đình',
      'Ngọc Hà',
      'Giảng Võ',
      'Đống Đa',
      'Văn Miếu - Quốc Tử Giám',
      'Kim Liên',
      'Láng',
      'Ô Chợ Dừa',
      'Hai Bà Trưng',
      'Bạch Mai',
      'Vĩnh Tuy',
      'Tây Hồ',
      'Quảng An',
      'Cầu Giấy',
      'Dịch Vọng',
      'Nghĩa Đô',
      'Yên Hòa',
      'Thanh Xuân',
      'Nhân Chính',
      'Hà Đông',
      'Mộ Lao',
      'Long Biên',
      'Bồ Đề',
      'Hoàng Mai',
      'Nam Từ Liêm',
      'Mỹ Đình',
      'Bắc Từ Liêm',
      'Sơn Tây',
    ],
    streetsByWard: {
      'Hoàn Kiếm': [
        'Đinh Tiên Hoàng',
        'Hàng Đào',
        'Hàng Bạc',
        'Hàng Buồm',
        'Tạ Hiện',
        'Nhà Thờ',
        'Ấu Triệu',
        'Hàng Gai',
        'Lý Thái Tổ',
        'Tràng Tiền',
        'Hàng Bài',
        'Phùng Hưng',
      ],
      'Cửa Nam': [
        'Phan Chu Trinh',
        'Trần Hưng Đạo',
        'Lý Thường Kiệt',
        'Hai Bà Trưng',
        'Quang Trung',
        'Bà Triệu',
        'Lê Duẩn',
      ],
      'Ba Đình': [
        'Phan Đình Phùng',
        'Quán Thánh',
        'Trúc Bạch',
        'Đội Cấn',
        'Kim Mã',
        'Liễu Giai',
        'Văn Cao',
        'Nguyễn Thái Học',
      ],
      'Đống Đa': [
        'Chùa Bộc',
        'Thái Hà',
        'Tây Sơn',
        'Đặng Văn Ngữ',
        'Phạm Ngọc Thạch',
        'Xã Đàn',
        'Tôn Đức Thắng',
        'Hồ Đắc Di',
      ],
      'Tây Hồ': [
        'Nguyễn Đình Thi',
        'Trích Sài',
        'Quảng An',
        'Xuân Diệu',
        'Tô Ngọc Vân',
        'Lạc Long Quân',
        'Thụy Khuê',
      ],
      'Cầu Giấy': [
        'Cầu Giấy',
        'Xuân Thủy',
        'Trần Thái Tông',
        'Duy Tân',
        'Trung Hòa',
        'Tô Hiệu',
        'Nguyễn Khánh Toàn',
      ],
    },
    defaultStreets: [
      'Đinh Tiên Hoàng',
      'Tạ Hiện',
      'Nhà Thờ',
      'Tràng Tiền',
      'Lý Thường Kiệt',
      'Phan Đình Phùng',
      'Thái Hà',
      'Chùa Bộc',
      'Xuân Thủy',
      'Tô Hiệu',
      'Bà Triệu',
      'Phố Huế',
      'Trích Sài',
      'Xuân Diệu',
    ],
  },

  // ==========================================================================
  // 4. THÀNH PHỐ HẢI PHÒNG (Hải Phòng + Hải Dương)
  // ==========================================================================
  {
    name: 'Hải Phòng',
    type: 'Thành phố TW',
    mergedFrom: 'TP. Hải Phòng + Tỉnh Hải Dương',
    adminCenter: 'Phường Hồng Bàng, TP. Hải Phòng',
    lat: 20.8449,
    lng: 106.6881,
    wards: [
      'Hồng Bàng',
      'Ngô Quyền',
      'Lê Chân',
      'Hải An',
      'Kiến An',
      'Đồ Sơn',
      'Thủy Nguyên',
      'An Dương',
      'Hải Dương',
      'Chí Linh',
      'Kinh Môn',
      'Đặc khu Cát Hải - Cát Bà',
      'Đặc khu Bạch Long Vĩ',
    ],
    streetsByWard: {},
    defaultStreets: [
      'Lạch Tray',
      'Cầu Đất',
      'Điện Biên Phủ',
      'Lê Hồng Phong',
      'Trần Phú',
      'Quang Trung',
      'Tô Hiệu',
      'Văn Cao',
      'Nguyễn Đức Cảnh',
      'Bạch Đằng',
    ],
  },

  // ==========================================================================
  // 5. THÀNH PHỐ HUẾ
  // ==========================================================================
  {
    name: 'Huế',
    type: 'Thành phố TW',
    mergedFrom: 'Giữ nguyên TP. Huế trực thuộc Trung ương',
    adminCenter: 'Phường Thuận Hóa, TP. Huế',
    lat: 16.4637,
    lng: 107.5909,
    wards: [
      'Thuận Hóa',
      'Phú Xuân',
      'Vỹ Dạ',
      'An Cựu',
      'Phú Hội',
      'Phú Nhuận',
      'Trường An',
      'Kim Long',
      'Hương Thủy',
      'Hương Trà',
      'Phong Điền',
      'Thuận An',
    ],
    streetsByWard: {},
    defaultStreets: [
      'Lê Lợi',
      'Hùng Vương',
      'Bến Nghé',
      'Nguyễn Huệ',
      'Đống Đa',
      'Bà Triệu',
      'Chu Văn An',
      'Phạm Ngũ Lão',
      'Võ Thị Sáu',
      'Trần Hưng Đạo',
      'Mai Thúc Loan',
    ],
  },

  // ==========================================================================
  // 6. THÀNH PHỐ CẦN THƠ (Cần Thơ + Sóc Trăng + Hậu Giang)
  // ==========================================================================
  {
    name: 'Cần Thơ',
    type: 'Thành phố TW',
    mergedFrom: 'TP. Cần Thơ + Tỉnh Sóc Trăng + Tỉnh Hậu Giang',
    adminCenter: 'Phường Ninh Kiều, TP. Cần Thơ',
    lat: 10.0452,
    lng: 105.7469,
    wards: [
      'Ninh Kiều',
      'Cái Khế',
      'Tân An',
      'Xuân Khánh',
      'Hưng Lợi',
      'Bình Thủy',
      'Cái Răng',
      'Ô Môn',
      'Thốt Nốt',
      'Sóc Trăng',
      'Vị Thanh',
      'Ngã Bảy',
    ],
    streetsByWard: {},
    defaultStreets: [
      'Hai Bà Trưng',
      'Ninh Kiều',
      '30 Tháng 4',
      'Mậu Thân',
      'Nguyễn Văn Cừ',
      'Trần Hưng Đạo',
      'Lý Tự Trọng',
      'Đề Thám',
      'Nguyễn Trãi',
    ],
  },

  // ==========================================================================
  // 7 - 34: 28 TỈNH TRÊN TOÀN QUỐC SAU SÁP NHẬP 2025
  // ==========================================================================
  {
    name: 'Khánh Hòa',
    type: 'Tỉnh',
    mergedFrom: 'Khánh Hòa + Ninh Thuận',
    adminCenter: 'Phường Nha Trang, Khánh Hòa',
    lat: 12.2388,
    lng: 109.1967,
    wards: ['Nha Trang', 'Lộc Thọ', 'Vạn Thạnh', 'Vĩnh Hải', 'Cam Ranh', 'Ninh Hòa', 'Phan Rang - Tháp Chàm'],
    streetsByWard: {},
    defaultStreets: ['Trần Phú', 'Nguyễn Thị Minh Khai', 'Hùng Vương', 'Lê Thánh Tôn', 'Thái Nguyên', 'Yersin', '2 Tháng 4'],
  },
  {
    name: 'Lâm Đồng',
    type: 'Tỉnh',
    mergedFrom: 'Lâm Đồng + Bình Thuận + Đắk Nông',
    adminCenter: 'Phường Đà Lạt, Lâm Đồng',
    lat: 11.9404,
    lng: 108.4583,
    wards: ['Đà Lạt', 'Xuân Hương', 'Lâm Viên', 'Bảo Lộc', 'Phan Thiết', 'Mũi Né', 'La Gi', 'Gia Nghĩa'],
    streetsByWard: {},
    defaultStreets: ['Nguyễn Chí Thanh', 'Khu Hòa Bình', 'Phan Đình Phùng', 'Ba Tháng Tư', 'Trần Phú', 'Bùi Thị Xuân', 'Nguyễn Đình Chiểu'],
  },
  {
    name: 'Gia Lai',
    type: 'Tỉnh',
    mergedFrom: 'Gia Lai + Bình Định',
    adminCenter: 'Phường Quy Nhơn / Pleiku',
    lat: 13.7829,
    lng: 109.2196,
    wards: ['Quy Nhơn', 'Ghềnh Ráng', 'Lê Hồng Phong', 'Pleiku', 'Diên Hồng', 'An Khê', 'Ayun Pa', 'An Nhơn', 'Hoài Nhơn'],
    streetsByWard: {},
    defaultStreets: ['Xuân Diệu', 'An Dương Vương', 'Nguyễn Tất Thành', 'Trần Hưng Đạo', 'Lê Duẩn', 'Hùng Vương', 'Phan Đình Phùng'],
  },
  {
    name: 'Đắk Lắk',
    type: 'Tỉnh',
    mergedFrom: 'Đắk Lắk + Phú Yên',
    adminCenter: 'Phường Buôn Ma Thuột, Đắk Lắk',
    lat: 12.6667,
    lng: 108.05,
    wards: ['Buôn Ma Thuột', 'Tân An', 'Thắng Lợi', 'Tuy Hòa', 'Phú Đông', 'Sông Cầu', 'Đông Hòa', 'Buôn Hồ'],
    streetsByWard: {},
    defaultStreets: ['Nguyễn Tất Thành', 'Lê Duẩn', 'Phan Chu Trinh', 'Ama Khê', 'Hùng Vương', 'Độc Lập', 'Trần Hưng Đạo'],
  },
  {
    name: 'Quảng Ngãi',
    type: 'Tỉnh',
    mergedFrom: 'Quảng Ngãi + Kon Tum',
    adminCenter: 'Phường Quảng Ngãi',
    lat: 15.1214,
    lng: 108.8044,
    wards: ['Quảng Ngãi', 'Lê Hồng Phong', 'Trần Hưng Đạo', 'Đức Phổ', 'Kon Tum', 'Măng Đen', 'Đặc khu Lý Sơn'],
    streetsByWard: {},
    defaultStreets: ['Quang Trung', 'Hùng Vương', 'Phan Đình Phùng', 'Lê Trung Đình', 'Trần Hưng Đạo', 'Nguyễn Nghiêm'],
  },
  {
    name: 'Quảng Trị',
    type: 'Tỉnh',
    mergedFrom: 'Quảng Bình + Quảng Trị',
    adminCenter: 'Phường Đồng Hới',
    lat: 17.4689,
    lng: 106.6223,
    wards: ['Đồng Hới', 'Hải Thành', 'Đồng Phú', 'Đông Hà', 'Quảng Trị', 'Ba Đồn', 'Khe Sanh', 'Phong Nha'],
    streetsByWard: {},
    defaultStreets: ['Trương Pháp', 'Trần Hưng Đạo', 'Lý Thường Kiệt', 'Hùng Vương', 'Quang Trung', 'Lê Duẩn'],
  },
  {
    name: 'Nghệ An',
    type: 'Tỉnh',
    mergedFrom: 'Giữ nguyên Tỉnh Nghệ An',
    adminCenter: 'Phường Vinh, Nghệ An',
    lat: 18.6796,
    lng: 105.6813,
    wards: ['Vinh', 'Trường Thi', 'Hưng Bình', 'Quang Trung', 'Cửa Lò', 'Hoàng Mai', 'Thái Hòa'],
    streetsByWard: {},
    defaultStreets: ['Nguyễn Văn Cừ', 'Lê Hồng Phong', 'Hồ Tùng Mậu', 'Quang Trung', 'Trần Phú', 'Bình Minh'],
  },
  {
    name: 'Thanh Hóa',
    type: 'Tỉnh',
    mergedFrom: 'Giữ nguyên Tỉnh Thanh Hóa',
    adminCenter: 'Phường Hạc Thành, Thanh Hóa',
    lat: 19.8067,
    lng: 105.7852,
    wards: ['Hạc Thành', 'Điện Biên', 'Lam Sơn', 'Đông Hương', 'Sầm Sơn', 'Bỉm Sơn', 'Nghi Sơn'],
    streetsByWard: {},
    defaultStreets: ['Lê Hoàn', 'Đại lộ Lê Lợi', 'Trần Phú', 'Hồ Xuân Hương', 'Nguyễn Trãi', 'Phan Chu Trinh'],
  },
  {
    name: 'Hà Tĩnh',
    type: 'Tỉnh',
    mergedFrom: 'Giữ nguyên Tỉnh Hà Tĩnh',
    adminCenter: 'Phường Thành Sen, Hà Tĩnh',
    lat: 18.3428,
    lng: 105.9057,
    wards: ['Thành Sen', 'Trần Phú', 'Bắc Hà', 'Nam Hà', 'Hồng Lĩnh', 'Kỳ Anh', 'Thiên Cầm'],
    streetsByWard: {},
    defaultStreets: ['Hà Huy Tập', 'Trần Phú', 'Nguyễn Công Trứ', 'Phan Đình Phùng', 'Hàm Nghi', 'Xuân Diệu'],
  },
  {
    name: 'Quảng Ninh',
    type: 'Tỉnh',
    mergedFrom: 'Giữ nguyên Tỉnh Quảng Ninh',
    adminCenter: 'Phường Hạ Long, Quảng Ninh',
    lat: 20.9599,
    lng: 107.0425,
    wards: ['Hạ Long', 'Bãi Cháy', 'Hồng Gai', 'Cẩm Phả', 'Uông Bí', 'Móng Cái', 'Đông Triều', 'Quảng Yên', 'Đặc khu Vân Đồn', 'Đặc khu Cô Tô'],
    streetsByWard: {},
    defaultStreets: ['Hạ Long', 'Trần Quốc Nghiễn', 'Lê Thánh Tông', 'Nguyễn Văn Cừ', 'Hậu Cần', 'Giếng Đồn'],
  },
  {
    name: 'Ninh Bình',
    type: 'Tỉnh',
    mergedFrom: 'Ninh Bình + Nam Định + Hà Nam',
    adminCenter: 'Phường Hoa Lư, Ninh Bình',
    lat: 20.2506,
    lng: 105.9745,
    wards: ['Hoa Lư', 'Đông Thành', 'Tam Điệp', 'Nam Định', 'Vị Xuyên', 'Phủ Lý', 'Duy Tiên', 'Tràng An'],
    streetsByWard: {},
    defaultStreets: ['Trần Hưng Đạo', 'Lương Văn Thăng', 'Đinh Tiên Hoàng', 'Tràng An', 'Lê Hồng Phong', 'Biên Hòa'],
  },
  {
    name: 'Bắc Ninh',
    type: 'Tỉnh',
    mergedFrom: 'Bắc Ninh + Bắc Giang',
    adminCenter: 'Phường Bắc Giang / Kinh Bắc',
    lat: 21.1861,
    lng: 106.0763,
    wards: ['Kinh Bắc', 'Suối Hoa', 'Võ Cường', 'Từ Sơn', 'Bắc Giang', 'Việt Yên', 'Quế Võ', 'Thuận Thành'],
    streetsByWard: {},
    defaultStreets: ['Lý Thái Tổ', 'Nguyễn Gia Thiều', 'Ngọc Hân Công Chúa', 'Trần Hưng Đạo', 'Hoàng Văn Thụ', 'Nguyễn Thị Lưu'],
  },
  {
    name: 'Hưng Yên',
    type: 'Tỉnh',
    mergedFrom: 'Hưng Yên + Thái Bình',
    adminCenter: 'Phường Phố Hiến, Hưng Yên',
    lat: 20.6464,
    lng: 106.0511,
    wards: ['Phố Hiến', 'Lê Lợi', 'Văn Giang', 'Ecopark', 'Mỹ Hào', 'Thái Bình', 'Kỳ Bá', 'Tiền Hải'],
    streetsByWard: {},
    defaultStreets: ['Điện Biên', 'Bãi Sậy', 'Chu Mạnh Trinh', 'Lê Thái Tổ', 'Lý Bôn', 'Trần Hưng Đạo'],
  },
  {
    name: 'Phú Thọ',
    type: 'Tỉnh',
    mergedFrom: 'Phú Thọ + Vĩnh Phúc + Hòa Bình',
    adminCenter: 'Phường Việt Trì, Phú Thọ',
    lat: 21.3227,
    lng: 105.4019,
    wards: ['Việt Trì', 'Gia Cẩm', 'Nông Trang', 'Vĩnh Yên', 'Phúc Yên', 'Tam Đảo', 'Hòa Bình', 'Mai Châu'],
    streetsByWard: {},
    defaultStreets: ['Hùng Vương', 'Nguyễn Tất Thành', 'Trần Phú', 'Mê Linh', 'Ngô Quyền', 'Cù Chính Lan'],
  },
  {
    name: 'Thái Nguyên',
    type: 'Tỉnh',
    mergedFrom: 'Thái Nguyên + Bắc Kạn',
    adminCenter: 'Phường Phan Đình Phùng, Thái Nguyên',
    lat: 21.5942,
    lng: 105.8482,
    wards: ['Phan Đình Phùng', 'Hoàng Văn Thụ', 'Quang Trung', 'Phổ Yên', 'Sông Công', 'Bắc Kạn', 'Ba Bể'],
    streetsByWard: {},
    defaultStreets: ['Lương Ngọc Quyến', 'Hoàng Văn Thụ', 'Cách Mạng Tháng 8', 'Bắc Sơn', 'Phan Đình Phùng'],
  },
  {
    name: 'Lào Cai',
    type: 'Tỉnh',
    mergedFrom: 'Lào Cai + Yên Bái',
    adminCenter: 'Phường Yên Bái / Lào Cai',
    lat: 22.4856,
    lng: 103.9707,
    wards: ['Sa Pa', 'Lào Cai', 'Cốc Lếu', 'Kim Tân', 'Yên Bái', 'Nghĩa Lộ', 'Mù Cang Chải'],
    streetsByWard: {},
    defaultStreets: ['Cầu Mây', 'Fansipan', 'Xuân Viên', 'Hoàng Liên', 'An Dương Vương', 'Điện Biên'],
  },
  {
    name: 'Tuyên Quang',
    type: 'Tỉnh',
    mergedFrom: 'Tuyên Quang + Hà Giang',
    adminCenter: 'Phường Tân Quang, Tuyên Quang',
    lat: 21.8236,
    lng: 105.2142,
    wards: ['Tân Quang', 'Phan Thiết', 'Minh Xuân', 'Hà Giang', 'Đồng Văn', 'Mèo Vạc', 'Yên Minh'],
    streetsByWard: {},
    defaultStreets: ['Bình Thuận', 'Quang Trung', '17 Tháng 8', 'Trần Phú', 'Nguyễn Trãi'],
  },
  {
    name: 'Cao Bằng',
    type: 'Tỉnh',
    mergedFrom: 'Giữ nguyên Tỉnh Cao Bằng',
    adminCenter: 'Phường Hợp Giang, Cao Bằng',
    lat: 22.6657,
    lng: 106.2579,
    wards: ['Hợp Giang', 'Sông Bằng', 'Sông Hiến', 'Đề Thám', 'Trùng Khánh'],
    streetsByWard: {},
    defaultStreets: ['Kim Đồng', 'Vườn Cam', 'Hoàng Đình Giong', 'Bế Văn Đàn'],
  },
  {
    name: 'Lạng Sơn',
    type: 'Tỉnh',
    mergedFrom: 'Giữ nguyên Tỉnh Lạng Sơn',
    adminCenter: 'Phường Đông Kinh, Lạng Sơn',
    lat: 21.8537,
    lng: 106.7615,
    wards: ['Đông Kinh', 'Hoàng Văn Thụ', 'Vĩnh Trại', 'Chi Lăng', 'Đồng Đăng', 'Hữu Lũng'],
    streetsByWard: {},
    defaultStreets: ['Bà Triệu', 'Lê Lợi', 'Trần Đăng Ninh', 'Bắc Sơn', 'Hùng Vương'],
  },
  {
    name: 'Sơn La',
    type: 'Tỉnh',
    mergedFrom: 'Giữ nguyên Tỉnh Sơn La',
    adminCenter: 'Phường Chiềng Lề, Sơn La',
    lat: 21.3256,
    lng: 103.9188,
    wards: ['Chiềng Lề', 'Tô Hiệu', 'Quyết Thắng', 'Mộc Châu', 'Thảo Nguyên'],
    streetsByWard: {},
    defaultStreets: ['Trường Chinh', 'Tô Hiệu', 'Chu Văn Thịnh', 'Lò Văn Giá'],
  },
  {
    name: 'Điện Biên',
    type: 'Tỉnh',
    mergedFrom: 'Giữ nguyên Tỉnh Điện Biên',
    adminCenter: 'Phường Điện Biên Phủ',
    lat: 21.386,
    lng: 103.023,
    wards: ['Điện Biên Phủ', 'Mường Thanh', 'Tân Thanh', 'Him Lam', 'Mường Lay'],
    streetsByWard: {},
    defaultStreets: ['Võ Nguyên Giáp', 'Nguyễn Hữu Thọ', 'Trường Chinh', 'Hoàng Công Chất'],
  },
  {
    name: 'Lai Châu',
    type: 'Tỉnh',
    mergedFrom: 'Giữ nguyên Tỉnh Lai Châu',
    adminCenter: 'Phường Đoàn Kết, Lai Châu',
    lat: 22.3964,
    lng: 103.4582,
    wards: ['Đoàn Kết', 'Tân Phong', 'Quyết Thắng', 'Tam Đường', 'Phong Thổ'],
    streetsByWard: {},
    defaultStreets: ['Trần Phú', 'Võ Nguyên Giáp', '30 Tháng 4', 'Lê Duẩn'],
  },
  {
    name: 'Đồng Nai',
    type: 'Tỉnh',
    mergedFrom: 'Đồng Nai + Bình Phước',
    adminCenter: 'Phường Biên Hòa, Đồng Nai',
    lat: 10.9574,
    lng: 106.8427,
    wards: ['Biên Hòa', 'Trấn Biên', 'Tân Tiến', 'Thống Nhất', 'Long Khánh', 'Long Thành', 'Đồng Xoài', 'Phước Long', 'Bình Long'],
    streetsByWard: {},
    defaultStreets: ['Phạm Văn Thuận', 'Đồng Khởi', 'Nguyễn Ái Quốc', 'Võ Thị Sáu', 'Hà Huy Giáp', 'Phú Riềng Đỏ'],
  },
  {
    name: 'Tây Ninh',
    type: 'Tỉnh',
    mergedFrom: 'Tây Ninh + Long An',
    adminCenter: 'Phường Tân An / Tây Ninh',
    lat: 11.3107,
    lng: 106.0983,
    wards: ['Tây Ninh', 'Hiệp Ninh', 'Hòa Thành', 'Trảng Bàng', 'Tân An', 'Kiến Tường', 'Bến Lức', 'Đức Hòa'],
    streetsByWard: {},
    defaultStreets: ['Cách Mạng Tháng 8', '30 Tháng 4', 'Lạc Long Quân', 'Hùng Vương', 'Nguyễn Trung Trực'],
  },
  {
    name: 'Đồng Tháp',
    type: 'Tỉnh',
    mergedFrom: 'Đồng Tháp + Tiền Giang',
    adminCenter: 'Phường Cao Lãnh / Mỹ Tho',
    lat: 10.4598,
    lng: 105.6326,
    wards: ['Cao Lãnh', 'Sa Đéc', 'Hồng Ngự', 'Mỹ Tho', 'Gò Công', 'Cai Lậy'],
    streetsByWard: {},
    defaultStreets: ['Nguyễn Huệ', '30 Tháng 4', 'Lý Thường Kiệt', 'Ấp Bắc', 'Nam Kỳ Khởi Nghĩa', 'Hùng Vương'],
  },
  {
    name: 'Vĩnh Long',
    type: 'Tỉnh',
    mergedFrom: 'Vĩnh Long + Bến Tre + Trà Vinh',
    adminCenter: 'Phường Vĩnh Long',
    lat: 10.2537,
    lng: 105.9722,
    wards: ['Vĩnh Long', 'Long Châu', 'Bình Minh', 'Bến Tre', 'Phú Khương', 'Trà Vinh', 'Duyên Hải'],
    streetsByWard: {},
    defaultStreets: ['Trưng Nữ Vương', 'Phạm Thái Bường', 'Nguyễn Thị Minh Khai', 'Đồng Khởi', 'Lê Lợi'],
  },
  {
    name: 'An Giang',
    type: 'Tỉnh',
    mergedFrom: 'An Giang + Kiên Giang',
    adminCenter: 'Phường Rạch Giá / Long Xuyên',
    lat: 10.3864,
    lng: 105.4352,
    wards: ['Long Xuyên', 'Mỹ Bình', 'Châu Đốc', 'Rạch Giá', 'Hà Tiên', 'Đặc khu Phú Quốc', 'Đặc khu Thổ Châu'],
    streetsByWard: {},
    defaultStreets: ['Hai Bà Trưng', 'Hùng Vương', 'Trần Hưng Đạo', 'Nguyễn Trung Trực', '30 Tháng 4', 'Tôn Đức Thắng'],
  },
  {
    name: 'Cà Mau',
    type: 'Tỉnh',
    mergedFrom: 'Cà Mau + Bạc Liêu',
    adminCenter: 'Phường Cà Mau',
    lat: 9.1768,
    lng: 105.1524,
    wards: ['Cà Mau', 'An Xuyên', 'Tân Thành', 'Bạc Liêu', 'Giá Rai', 'Năm Căn', 'Đất Mũi'],
    streetsByWard: {},
    defaultStreets: ['Ngô Quyền', 'Trần Hưng Đạo', 'Phan Ngọc Hiển', 'Lý Thường Kiệt', 'Trần Phú'],
  },
];

export const VIETNAM_34_PROVINCE_NAMES = VIETNAM_34_PROVINCES_DATA.map((p) => p.name);

export function getProvinceInfo(city: string): ProvinceData {
  return (
    VIETNAM_34_PROVINCES_DATA.find((p) => p.name === city) ||
    VIETNAM_34_PROVINCES_DATA[0]
  );
}

export function getWardsForCity(city: string): string[] {
  const p = getProvinceInfo(city);
  return p.wards;
}

export function getStreetsForCityAndWard(city: string, ward?: string): string[] {
  const p = getProvinceInfo(city);
  if (ward && p.streetsByWard[ward] && p.streetsByWard[ward].length > 0) {
    // Kết hợp danh sách đường của phường lên đầu + các đường chính của thành phố
    return Array.from(new Set([...p.streetsByWard[ward], ...p.defaultStreets]));
  }
  return p.defaultStreets;
}

// ============================================================================
// ĐỊNH VỊ TỌA ĐỘ THÔNG MINH (OFFLINE DETERMINISTIC + ONLINE OSM NOMINATIM)
// ============================================================================
function hashOffset(str: string, scale = 0.0045): [number, number] {
  let h1 = 2166136261;
  let h2 = 16777619;
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 16777619);
    h2 ^= str.charCodeAt(i) * (i + 1);
    h2 = Math.imul(h2, 2166136261);
  }
  const n1 = ((h1 >>> 0) % 1000) / 1000 - 0.5;
  const n2 = ((h2 >>> 0) % 1000) / 1000 - 0.5;
  return [n1 * scale, n2 * scale];
}

export function resolveCoordinates(
  city: string,
  ward?: string,
  street?: string,
  shopName?: string
): { lat: number; lng: number } {
  const p = getProvinceInfo(city);
  let baseLat = p.lat;
  let baseLng = p.lng;

  if (ward && p.wardCoords && p.wardCoords[ward]) {
    [baseLat, baseLng] = p.wardCoords[ward];
  } else if (ward) {
    const [dLat, dLng] = hashOffset(`${city}-${ward}`, 0.025);
    baseLat += dLat;
    baseLng += dLng;
  }

  if (street && p.streetCoords && p.streetCoords[street]) {
    [baseLat, baseLng] = p.streetCoords[street];
    if (shopName) {
      const [sLat, sLng] = hashOffset(shopName, 0.0018);
      baseLat += sLat;
      baseLng += sLng;
    }
  } else if (street) {
    const [dLat, dLng] = hashOffset(`${street}-${shopName || ''}`, 0.006);
    baseLat += dLat;
    baseLng += dLng;
  }

  return {
    lat: Math.round(baseLat * 100000) / 100000,
    lng: Math.round(baseLng * 100000) / 100000,
  };
}

// ============================================================================
// TÍCH HỢP OPENSTREETMAP (NOMINATIM & OVERPASS) TRA CỨU TỰ ĐỘNG ĐƯỜNG/PHỐ
// ============================================================================
const OSM_CACHE_KEY = 'not_osm_location_cache_v1';

interface OsmCache {
  [key: string]: {
    streets: string[];
    wards: string[];
    ts: number;
  };
}

function readOsmCache(): OsmCache {
  try {
    const raw = localStorage.getItem(OSM_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeOsmCache(cache: OsmCache) {
  try {
    localStorage.setItem(OSM_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage quota
  }
}

export async function fetchLiveOsmStreetsAndWards(
  city: string,
  ward?: string
): Promise<{ wards: string[]; streets: string[] }> {
  const cacheKey = `${city}__${ward || 'ALL'}`;
  const cache = readOsmCache();
  if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < 1000 * 60 * 60 * 24 * 7) {
    return {
      wards: cache[cacheKey].wards,
      streets: cache[cacheKey].streets,
    };
  }

  const p = getProvinceInfo(city);
  let centerLat = p.lat;
  let centerLng = p.lng;
  if (ward && p.wardCoords?.[ward]) {
    [centerLat, centerLng] = p.wardCoords[ward];
  }

  try {
    // Query Overpass API around the ward/city center (radius 3500m) for named highways
    const radius = ward ? 2800 : 4500;
    const overpassQuery = `[out:json][timeout:6];way["highway"]["name"](around:${radius},${centerLat},${centerLng});out tags 120;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
    });

    if (!res.ok) throw new Error('Overpass busy');
    const data = await res.json();
    const foundStreets = new Set<string>();

    for (const el of data.elements || []) {
      const rawName: string | undefined = el.tags?.name;
      if (rawName) {
        const cleaned = rawName
          .replace(/^(Đường|Phố|Hẻm|Kiệt)\s+/i, '')
          .trim();
        if (cleaned.length > 2 && !/^\d+$/.test(cleaned)) {
          foundStreets.add(cleaned);
        }
      }
    }

    const streets = Array.from(foundStreets).sort((a, b) =>
      a.localeCompare(b, 'vi')
    );

    const updated = {
      wards: p.wards,
      streets,
      ts: Date.now(),
    };
    cache[cacheKey] = updated;
    writeOsmCache(cache);

    return { wards: p.wards, streets };
  } catch {
    return {
      wards: getWardsForCity(city),
      streets: getStreetsForCityAndWard(city, ward),
    };
  }
}

export async function geocodeAddressOsm(
  shopName: string,
  street: string,
  ward: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  const queries = [
    `${street}, ${ward}, ${city}, Việt Nam`,
    `${street}, ${city}, Việt Nam`,
  ];

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q=${encodeURIComponent(
        q
      )}`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'vi' },
      });
      if (!res.ok) continue;
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        const lat = parseFloat(items[0].lat);
        const lng = parseFloat(items[0].lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          const [sLat, sLng] = hashOffset(shopName || street, 0.0012);
          return {
            lat: Math.round((lat + sLat) * 100000) / 100000,
            lng: Math.round((lng + sLng) * 100000) / 100000,
          };
        }
      }
    } catch {
      // Fallback to deterministic coordinate resolver
    }
  }
  return null;
}

// Tính khoảng cách đường chim bay / lộ trình ước tính (km)
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Nhân hệ số đường phố thực tế ~1.25x
  return Math.round(R * c * 1.25 * 10) / 10;
}
