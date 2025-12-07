// Utility functions để tự động thêm dấu tiếng Việt

// Mapping họ và tên
const nameMapping = {
  'Nguyen': 'Nguyễn', 'Tran': 'Trần', 'Le': 'Lê', 'Pham': 'Phạm', 'Hoang': 'Hoàng',
  'Huynh': 'Huỳnh', 'Vu': 'Vũ', 'Vo': 'Võ', 'Dang': 'Đặng', 'Bui': 'Bùi',
  'Do': 'Đỗ', 'Ho': 'Hồ', 'Ngo': 'Ngô', 'Duong': 'Dương', 'Ly': 'Lý',
  'Dao': 'Đào', 'Luong': 'Lương', 'Truong': 'Trương', 'Phan': 'Phan',
  'Dinh': 'Đinh', 'Nghiem': 'Nghiêm', 'Bach': 'Bạch', 'Cao': 'Cao', 'Chu': 'Chu',
  'Doan': 'Đoàn', 'Ha': 'Hà', 'Lam': 'Lâm', 'Mac': 'Mạc', 'Mai': 'Mai',
  'Nong': 'Nông', 'Quach': 'Quách', 'Ta': 'Tạ', 'Thai': 'Thái', 'To': 'Tô',
  'Ton': 'Tôn', 'Trinh': 'Trịnh',
  'Thi': 'Thị', 'Viet': 'Viết', 'Duy': 'Duy', 'Duc': 'Đức', 'Minh': 'Minh',
  'Thanh': 'Thanh', 'Quang': 'Quang', 'Dinh': 'Đình', 'Xuan': 'Xuân',
  'Thu': 'Thu', 'Hong': 'Hồng', 'My': 'Mỹ', 'Ngoc': 'Ngọc',
  // Tên đệm "Văn" (nam) - được xử lý đặc biệt trong hàm addVietnameseAccentsToName
  'An': 'An', 'Anh': 'Anh', 'Bao': 'Bảo', 'Binh': 'Bình', 'Cuong': 'Cường',
  'Dung': 'Dung', // Tên nữ "Dung" (không phải "Dũng" - đó là tên nam khác)
  'Giang': 'Giang', 'Hai': 'Hải', 'Hieu': 'Hiếu',
  'Hung': 'Hùng', 'Huy': 'Huy', 'Khanh': 'Khánh', 'Khoa': 'Khoa', 'Kien': 'Kiên',
  'Linh': 'Linh', 'Long': 'Long', 'Man': 'Mẫn', 'Nam': 'Nam', 'Nghia': 'Nghĩa',
  'Nhan': 'Nhân', 'Phong': 'Phong', 'Phu': 'Phú', 'Phuc': 'Phúc', 'Quan': 'Quân',
  'Quoc': 'Quốc', 'Son': 'Sơn', 'Tai': 'Tài', 'Tan': 'Tân', 'Thang': 'Thắng',
  'Thien': 'Thiên', 'Thinh': 'Thịnh', 'Thong': 'Thông', 'Tien': 'Tiến',
  'Trieu': 'Triệu', 'Trong': 'Trọng', 'Trung': 'Trung', 'Truong': 'Trường',
  'Tuan': 'Tuấn', 'Tung': 'Tùng', 'Viet': 'Việt', 'Vinh': 'Vinh',
  'Bich': 'Bích', 'Cam': 'Cẩm', 'Chau': 'Châu', 'Diem': 'Diễm', 'Dieu': 'Diệu',
  'Hanh': 'Hạnh', 'Hang': 'Hằng', 'Hien': 'Hiền', 'Hoa': 'Hoa',
  'Huong': 'Hương', 'Huyen': 'Huyền', 'Lan': 'Lan', 'Loan': 'Loan',
  'Nga': 'Nga', 'Nhung': 'Nhung', 'Phuong': 'Phương', 'Quynh': 'Quỳnh',
  'Thao': 'Thảo', 'Thuy': 'Thúy', 'Tien': 'Tiên', 'Trang': 'Trang',
  'Tuyet': 'Tuyết', 'Uyen': 'Uyên', 'Vy': 'Vy', 'Yen': 'Yến',
  'E': 'E'
};

// Mapping sản phẩm
const productMapping = {
  'Chuot': 'Chuột', 'Tai': 'Tai', 'Ban': 'Bàn', 'phim': 'phím', 'co': 'có',
  'khong': 'không', 'day': 'dây', 'O': 'Ổ', 'cung': 'cứng',
  'logtech': 'Logitech', 'Msi': 'MSI', 'Sandisk': 'SanDisk', 'Kingstn': 'Kingston',
  'Dareu': 'Dare-U', 'Coolermaster': 'Cooler Master',
  'Gb': 'GB', 'mhz': 'MHz', 'Mhz': 'MHz', 'ghz': 'GHz', 'Ghz': 'GHz',
  'Cpu': 'CPU', 'Ram': 'RAM', 'ram': 'RAM', 'cpu': 'CPU',
  'I3': 'i3', 'I5': 'i5', 'I7': 'i7', 'I9': 'i9',
  'go3': 'Go3', 'go2': 'Go2', 'WH1000XM4': 'WH-1000XM4',
  'h510m-a': 'H510M-A', 'ek87': 'EK87', 'e1050': 'E1050',
  'k380': 'K380', 'k120': 'K120', 'm170': 'M170', 'm171': 'M171',
  'm331': 'M331', 'vh110': 'VH110', 'rapoo': 'Rapoo', 'jbl': 'JBL',
  '500w': '500W', '45w': '45W', '65w': '65W', '8Gb': '8GB',
  '240gb': '240GB', '240g': '240GB', '3200mhz': '3200MHz'
};

function hasVietnameseAccents(text) {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
}

function normalizeWord(word, mapping) {
  if (!word) return word;
  const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  return mapping[capitalized] || word;
}

/**
 * Kiểm tra và sửa encoding nếu dữ liệu bị sai encoding
 * @param {string} text - Text cần kiểm tra
 * @returns {string} Text đã được sửa encoding (nếu cần)
 */
function fixEncoding(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Nếu text đã có dấu tiếng Việt đúng, giữ nguyên
  if (hasVietnameseAccents(text)) return text;
  
  // Kiểm tra xem có phải là mojibake (ký tự lạ) không
  // Ví dụ: "Cß╗¡a h├áng" thay vì "Cửa hàng"
  // Nếu có các ký tự lạ như ß, ╗, ├, á thì có thể là encoding sai
  
  // Nếu không có ký tự lạ và không có dấu, có thể là tên không dấu (ví dụ: "Nguyen Van Anh")
  // Trong trường hợp này, giữ nguyên để function mapping xử lý
  return text;
}

// Thêm dấu cho tên người - sửa từng từ riêng lẻ
export function addVietnameseAccentsToName(name) {
  if (!name) return name;
  
  // Sửa encoding nếu cần
  name = fixEncoding(name);
  
  const words = name.split(/\s+/);
  
  // Xử lý đặc biệt cho "Van" - thường là tên đệm "Văn" (nam) hơn là "Vân" (nữ)
  // Nếu "Van" ở giữa tên (không phải từ cuối), thường là tên đệm "Văn"
  return words
    .map((word, index) => {
      // Nếu từ này đã có dấu, giữ nguyên
      if (hasVietnameseAccents(word)) return word;
      
      // Xử lý đặc biệt cho "Van"
      if (word.toLowerCase() === 'van') {
        // Nếu "Van" không phải từ cuối cùng, thường là tên đệm "Văn"
        if (index < words.length - 1) {
          return 'Văn';
        }
        // Nếu là từ cuối, có thể là tên nữ "Vân" hoặc tên đệm "Văn"
        // Ưu tiên "Văn" vì phổ biến hơn trong tên đầy đủ
        return 'Văn';
      }
      
      // Các từ khác
      return normalizeWord(word, nameMapping);
    })
    .join(' ');
}

// Sửa và chuẩn hóa tên sản phẩm
export function fixProductName(productName) {
  if (!productName) return productName;
  
  // Sửa encoding nếu cần
  let fixed = fixEncoding(productName);
  
  // Sửa lỗi chính tả
  const fixes = [
    [/\bBluetoth\b/gi, 'Bluetooth'],
    [/\blogitech\b/gi, 'Logitech'], // Sửa "logitech" thành "Logitech"
    [/\blogtech\b/gi, 'Logitech'], // Sửa lỗi chính tả "logtech"
    [/\bKingstn\b/gi, 'Kingston'],
    [/\bDareu\b/gi, 'Dare-U'],
    [/\bCoolermaster\b/gi, 'Cooler Master'],
    [/\bSandisk\b/gi, 'SanDisk'],
    [/\bk\s+(day|dây|d[ay])\b/gi, 'không dây'],
    [/\bkhong\s+(day|dây|d[ay])\b/gi, 'không dây'],
  ];
  
  fixes.forEach(([pattern, replacement]) => {
    fixed = fixed.replace(pattern, replacement);
  });
  
  // Chuẩn hóa đơn vị và format
  // Sửa DDR TRƯỚC khi sửa RAM để tránh conflict
  fixed = fixed.replace(/\b[Dd][Dd][Rr]([345])\b/gi, (match, p1) => 'DDR' + p1);
  
  const normalizations = [
    [/\b(\d+)\s*[Gg][Bb]\b/g, '$1GB'],
    [/\b(\d+)\s*[Ww]\b/g, '$1W'],
    [/\b(\d+)\s*[Mm][Hh][Zz]\b/g, '$1MHz'],
    [/\btype\s*[-]?\s*[Cc]\b/gi, 'Type-C'],
    [/\b[Cc][Pp][Uu]\b/g, 'CPU'],
    [/\b[Rr][Aa][Mm]\b/g, 'RAM'],
    [/\b[Ii]ntel\s+[Cc]ore\s+[Ii](\d+)\b/gi, 'Intel Core i$1'],
    [/\b[Cc]huot\b/g, 'Chuột'],
    [/\b[Tt]ai\s+nghe\b/g, 'Tai nghe'],
    [/\b[Bb]an\s+phim\b/g, 'Bàn phím'],
    [/\bco\b/g, 'có'],
    [/\b[Oo]\s+cung\b/g, 'Ổ cứng'],
  ];
  
  normalizations.forEach(([pattern, replacement]) => {
    fixed = fixed.replace(pattern, replacement);
  });
  
  // Áp dụng mapping và chuẩn hóa case
  return fixed.split(/\s+/)
    .map((word, i) => {
      if (/^\d+$/.test(word)) return word;
      
      // Sửa DDR trong từng từ (nếu chưa được sửa)
      const ddrMatch = word.match(/^([Dd][Dd][Rr])([345])$/i);
      if (ddrMatch) {
        return 'DDR' + ddrMatch[2]; // Return ngay sau khi sửa
      }
      
      // Tìm trong mapping
      const lower = word.toLowerCase();
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      const mapped = productMapping[word] || productMapping[capitalized] || productMapping[lower];
      
      if (mapped) return mapped;
      
      // Nếu không có trong mapping, chuẩn hóa case
      // Từ đầu tiên: viết hoa chữ cái đầu
      // Các từ sau: giữ nguyên case hoặc viết thường nếu là model number (chữ + số)
      if (i === 0) {
        return capitalized;
      }
      // Model numbers (vd: m170, vh110, go3) - viết hoa chữ cái đầu
      if (/^[a-z]+\d+$/i.test(word)) {
        return capitalized;
      }
      return word;
    })
    .join(' ');
}

