import {
  BadgeCheck,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  Copy,
  Edit3,
  Eye,
  Filter,
  Gauge,
  ImagePlus,
  LayoutGrid,
  MapPin,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  UserRoundCog,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Heart,
  MessageSquare,
  Zap,
  Settings,
  Users
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile } from "./firebase";
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";
import "./styles.css";

const STORAGE_KEY = "web-thue-xe-cars";

// ─── COMPREHENSIVE CAR DATABASE ───
const carModelsData = {
  Toyota: ["Vios", "Innova", "Innova Cross", "Camry", "Fortuner", "Corolla Altis", "Corolla Cross", "Yaris", "Yaris Cross", "Raize", "Hilux", "Land Cruiser", "Land Cruiser Prado", "Alphard", "Avanza Premio", "Veloz Cross"],
  Hyundai: ["Grand i10", "Accent", "Elantra", "Creta", "Tucson", "Santa Fe", "Palisade", "Stargazer", "Custin", "Ioniq 5", "Venue", "Kona", "Solati"],
  Kia: ["Morning", "Soluto", "K3", "K5", "Sonet", "Seltos", "Sportage", "Sorento", "Carnival", "Carens", "Cerato", "Sedona"],
  Mazda: ["Mazda 2", "Mazda 3", "Mazda 6", "CX-3", "CX-30", "CX-5", "CX-8", "BT-50"],
  Honda: ["Brio", "City", "Civic", "Accord", "HR-V", "CR-V", "BR-V"],
  Ford: ["Ranger", "Everest", "Explorer", "Territory", "Transit", "EcoSport", "Focus"],
  Mitsubishi: ["Attrage", "Xpander", "Xpander Cross", "Outlander", "Pajero Sport", "Triton"],
  VinFast: ["Fadil", "VF 3", "VF 5", "VF e34", "VF 6", "VF 7", "VF 8", "VF 9", "Lux A2.0", "Lux SA2.0", "President"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "GLS", "Maybach", "G-Class", "V-Class", "EQB", "EQE", "EQS"],
  BMW: ["3 Series", "5 Series", "7 Series", "X3", "X4", "X5", "X6", "X7", "Z4", "i4", "i7", "iX3"],
  Audi: ["A3", "A4", "A6", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron"],
  Lexus: ["ES", "LS", "NX", "RX", "GX", "LX", "LM", "IS"],
  Volvo: ["XC40", "XC60", "XC90", "S90", "V60"],
  Porsche: ["Macan", "Cayenne", "Panamera", "Taycan", "911"],
  Peugeot: ["2008", "3008", "5008", "408", "Traveller"],
  Subaru: ["Forester", "Outback", "BRZ", "WRX"],
  Nissan: ["Almera", "Kicks", "Navara", "Terra"],
  Suzuki: ["Swift", "Ertiga", "XL7", "Jimny", "Ciaz", "Blind Van"],
  Isuzu: ["D-Max", "mu-X"],
  MG: ["MG5", "ZS", "HS", "RX5"],
  Skoda: ["Karoq", "Kodiaq"],
  Haval: ["H6"],
  Wuling: ["HongGuang MiniEV"],
  BYD: ["Atto 3", "Dolphin", "Seal"],
  Chevrolet: ["Colorado", "Trailblazer", "Cruze", "Spark"],
  Volkswagen: ["Teramont", "Tiguan", "Touareg", "Virtus", "T-Cross"]
};
const brandOptions = Object.keys(carModelsData);

const colorOptions = ["Trắng", "Đen", "Bạc", "Đỏ", "Xám", "Xanh lam", "Vàng", "Nâu", "Khác"];
const seatOptions = ["4", "5", "7", "9", "16", "29", "45"];
const yearOptions = Array.from({length: new Date().getFullYear() - 1999}, (_, i) => (new Date().getFullYear() - i).toString());
const bodyStyleOptions = ["Đô thị", "Gia đình", "Gầm cao", "Du lịch", "Công tác", "Dịch vụ"];
const AMENITY_OPTIONS = [
  "Bản đồ VM", "Camera 360", "Cam hành trình", "Cam lùi", "Cảm biến lốp", "GPS", "ETC", "Túi khí", "Lốp dự phòng", "Cảm biến va chạm", "Cửa sổ trời", "ADAS", "Ghế da"
];

const provinceDistricts = {
  "TP.HCM": ["Quận 1","Quận 3","Quận 4","Quận 5","Quận 6","Quận 7","Quận 8","Quận 10","Quận 11","Quận 12","Bình Thạnh","Gò Vấp","Phú Nhuận","Tân Bình","Tân Phú","Bình Tân","Bình Chánh","Cần Giờ","Củ Chi","Hóc Môn","Nhà Bè","Thủ Đức","TP.Thủ Đức"],
  "Hà Nội": ["Hoàn Kiếm","Ba Đình","Đống Đa","Hai Bà Trưng","Hoàng Mai","Long Biên","Tây Hồ","Cầu Giấy","Thanh Xuân","Hà Đông","Đông Anh","Gia Lâm","Sóc Sơn","Từ Liêm","Thường Tín","Mê Linh"],
  "Đà Nẵng": ["Hải Châu","Thanh Khê","Liên Chiểu","Ngũ Hành Sơn","Sơn Trà","Cẩm Lệ","Hòa Vang"],
  "Hải Phòng": ["Hồng Bàng","Ngô Quyền","Lê Chân","Kiến An","Hải An","Đồ Sơn","Dương Kinh","Thuỷ Nguyên","An Dương","An Lão","Kiến Thụy","Tiên Lãng","Vĩnh Bảo","Cát Hải"],
  "Cần Thơ": ["Ninh Kiều","Bình Thủy","Cái Răng","Ô Môn","Thốt Nốt","Phong Điền","Cờ Đỏ","Thới Lai","Vĩnh Thạnh"]
};

const locationProvinces = [
  "TP.HCM","Hà Nội","Đà Nẵng","Hải Phòng","Cần Thơ",
  "Bà Rịa - Vũng Tàu","Bình Dương","Đồng Nai","Khánh Hòa","Lâm Đồng",
  "Quảng Ninh","Thanh Hóa","Nghệ An","Thừa Thiên Huế","Quảng Nam",
  "Bình Định","Phú Yên","Bình Thuận","Ninh Thuận","Gia Lai",
  "Đắk Lắk","Lào Cai","Vĩnh Phúc","Bắc Ninh","Hải Dương",
  "Hưng Yên","Nam Định","Thái Bình","Ninh Bình","Long An",
  "Tiền Giang","Kiên Giang","An Giang","Sóc Trăng","Cà Mau","Đắk Nông","Kon Tum","Bình Phước","Tây Ninh"
];

const locationOptions = locationProvinces;
const operatingAreaOptions = ["Hà Nội", "TP.HCM", "Đà Nẵng", "Hà Nội và tỉnh lân cận", "TP.HCM, Vũng Tàu, Đà Lạt", "Toàn quốc"];

const seedCars = [
  {
    id: "CAR-001",
    createdAt: "2026-06-01",
    updatedAt: "2026-06-08",
    basicInfo: {
      name: "Toyota Innova Cross",
      brand: "Toyota",
      model: "Innova Cross",
      version: "Hybrid Premium",
      year: 2025,
      plate: "30K-889.12",
      exteriorColor: "Trắng ngọc trai",
      interiorColor: "Đen",
      seats: 7,
      vehicleType: "MPV",
      bodyStyle: "Gia đình"
    },
    technicalInfo: {
      fuel: "Hybrid",
      engine: "2.0L",
      transmission: "Số tự động",
      drivetrain: "FWD",
      fuelConsumption: "5.8L/100km",
      mileage: 8200
    },
    rentalInfo: {
      status: "available",
      dayPrice: 1250000,
      hourPrice: 180000,
      monthPrice: 28500000,
      deposit: 15000000,
      dailyKmLimit: 250,
      overKmFee: 5000,
      pickupLocation: "Cầu Giấy, Hà Nội",
      operatingArea: "Hà Nội và tỉnh lân cận",
      deliverySupport: true,
      driverIncluded: false,
      rentalType: "Tự lái",
      rentalCondition: "CCCD, GPLX B2, đặt cọc"
    },
    documents: {
      registrationExpiry: "2027-04-10",
      insuranceExpiry: "2027-01-25",
      lastMaintenance: "2026-05-20",
      nextMaintenance: "2026-08-20",
      requiredDocuments: "CCCD, bằng lái, hợp đồng thuê"
    },
    status: {
      condition: "Tốt",
      visibility: "Đang hiển thị",
      popularity: 92,
      dataWarning: "",
      isVerified: true
    },
    images: [
      {
        name: "Toyota Innova Cross",
        url: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=82",
        role: "Ảnh đại diện"
      }
    ],
    descriptions: {
      short: "MPV 7 chỗ rộng, tiết kiệm nhiên liệu, phù hợp gia đình.",
      detail: "Xe đời mới, khoang nội thất rộng, trang bị an toàn tốt và vận hành êm.",
      amenities: ["Camera 360", "Cruise Control", "Apple CarPlay", "Ghế da"]
    },
    internalNotes: "Ưu tiên lịch thuê cuối tuần, kiểm tra lốp trước chuyến xa."
  },
  {
    id: "CAR-002",
    createdAt: "2026-05-14",
    updatedAt: "2026-06-03",
    basicInfo: {
      name: "Ford Everest Titanium",
      brand: "Ford",
      model: "Everest",
      version: "Titanium 4x4",
      year: 2024,
      plate: "51K-728.44",
      exteriorColor: "Xanh ánh kim",
      interiorColor: "Nâu",
      seats: 7,
      vehicleType: "SUV",
      bodyStyle: "Gầm cao"
    },
    technicalInfo: {
      fuel: "Diesel",
      engine: "2.0L Bi-Turbo",
      transmission: "Số tự động",
      drivetrain: "4WD",
      fuelConsumption: "8.1L/100km",
      mileage: 19400
    },
    rentalInfo: {
      status: "rented",
      dayPrice: 1750000,
      hourPrice: 250000,
      monthPrice: 39800000,
      deposit: 25000000,
      dailyKmLimit: 220,
      overKmFee: 7000,
      pickupLocation: "Quận 1, TP.HCM",
      operatingArea: "TP.HCM, Vũng Tàu, Đà Lạt",
      deliverySupport: true,
      driverIncluded: true,
      rentalType: "Có tài xế",
      rentalCondition: "Đặt cọc, lịch trình rõ ràng"
    },
    documents: {
      registrationExpiry: "2026-12-18",
      insuranceExpiry: "2026-09-14",
      lastMaintenance: "2026-04-28",
      nextMaintenance: "2026-07-28",
      requiredDocuments: "CCCD, thông tin chuyến đi"
    },
    status: {
      condition: "Tốt",
      visibility: "Đang hiển thị",
      popularity: 88,
      dataWarning: "",
      isVerified: true
    },
    images: [
      {
        name: "Ford Everest",
        url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=82",
        role: "Ảnh đại diện"
      }
    ],
    descriptions: {
      short: "SUV 7 chỗ mạnh mẽ, hợp đi tỉnh và địa hình xấu.",
      detail: "Xe gầm cao, nhiều công nghệ hỗ trợ lái, cách âm tốt.",
      amenities: ["Cửa sổ trời", "Camera 360", "Màn hình Android", "Ghế da"]
    },
    internalNotes: "Đang có khách thuê tới 14/06/2026."
  },
  {
    id: "CAR-003",
    createdAt: "2026-06-07",
    updatedAt: "2026-06-07",
    basicInfo: {
      name: "Mazda 3 Luxury",
      brand: "Mazda",
      model: "Mazda 3",
      version: "Luxury",
      year: 2023,
      plate: "29A-601.35",
      exteriorColor: "Đỏ",
      interiorColor: "Đen",
      seats: 5,
      vehicleType: "Sedan",
      bodyStyle: "Đô thị"
    },
    technicalInfo: {
      fuel: "Xăng",
      engine: "1.5L",
      transmission: "Số tự động",
      drivetrain: "FWD",
      fuelConsumption: "6.5L/100km",
      mileage: 30200
    },
    rentalInfo: {
      status: "maintenance",
      dayPrice: 850000,
      hourPrice: 130000,
      monthPrice: 19000000,
      deposit: 12000000,
      dailyKmLimit: 250,
      overKmFee: 4000,
      pickupLocation: "Tây Hồ, Hà Nội",
      operatingArea: "Hà Nội",
      deliverySupport: false,
      driverIncluded: false,
      rentalType: "Tự lái",
      rentalCondition: "CCCD, GPLX, đặt cọc"
    },
    documents: {
      registrationExpiry: "2026-08-02",
      insuranceExpiry: "2026-11-09",
      lastMaintenance: "2026-06-07",
      nextMaintenance: "2026-06-16",
      requiredDocuments: "CCCD, GPLX"
    },
    status: {
      condition: "Cần bảo dưỡng",
      visibility: "Tạm ẩn",
      popularity: 74,
      dataWarning: "Thiếu ảnh nội thất",
      isVerified: false
    },
    images: [
      {
        name: "Mazda 3",
        url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=82",
        role: "Ảnh đại diện"
      }
    ],
    descriptions: {
      short: "Sedan 5 chỗ gọn, dễ lái trong phố, giá thuê hợp lý.",
      detail: "Phù hợp đi làm, công tác ngắn ngày hoặc di chuyển nội thành.",
      amenities: ["Điều hòa tự động", "Cruise Control"]
    },
    internalNotes: "Chờ thay dầu và kiểm tra phanh."
  }
];

const emptyForm = {
  basicInfo: {
    brand: "",
    model: "",
    version: "",
    year: "",
    plate: "",
    exteriorColor: "",
    interiorColor: "",
    seats: "",
    vehicleType: "",
    bodyStyle: ""
  },
  technicalInfo: {
    fuel: "",
    engine: "",
    transmission: "",
    drivetrain: "",
    fuelConsumption: "",
    mileage: ""
  },
  rentalInfo: {
    status: "available",
    dayPrice: "",
    hourPrice: "",
    monthPrice: "",
    deposit: "",
    dailyKmLimit: "",
    overKmFee: "",
    pickupLocation: "",
    operatingArea: "",
    deliverySupport: false,
    driverIncluded: false,
    rentalCondition: "",
    blockedDates: []
  },
  documents: {
    registrationExpiry: "",
    insuranceExpiry: "",
    lastMaintenance: "",
    nextMaintenance: "",
    requiredDocuments: ""
  },
  descriptions: {
    detail: "",
    amenities: []
  },
  ownerInfo: {
    name: "",
    phone: "",
    zaloPhone: ""
  },
  status: {
    condition: "Tốt",
    popularity: 50,
    dataWarning: "",
    isVerified: false
  },
  images: [],
  depositType: "cash",
  depositAmount: 15000000,
  internalNotes: ""
};

const getFieldGroups = (form, packageType = "premium") => {
  const basicFields = [
    {
      module: "Module_BasicInfoSection",
      title: "Thông tin cơ bản",
      description: "Tên xe, hãng, dòng xe và số chỗ.",
      fields: [
        ["basicInfo.brand", "Hãng xe", "select", true, brandOptions],
        ["basicInfo.model", "Dòng xe", "select", true, carModelsData[form.basicInfo.brand] || []],
        ["basicInfo.year", "Năm sản xuất", "select", true, yearOptions],
        ["basicInfo.plate", "Biển số xe", "text", true],
        ["basicInfo.seats", "Số chỗ ngồi", "select", true, seatOptions]
      ]
    },
    {
      module: "Module_RentalInfoSection",
      title: "Giá cho thuê",
      description: "Giá theo ngày và địa điểm nhận xe.",
      fields: [
        ["rentalInfo.status", "Trạng thái", "select", true, [
          ["available", "Xe trống"],
          ["busy", "Xe bận"]
        ]],
        ["rentalInfo.dayPrice", "Giá thuê theo ngày", "number", true],
        ["rentalInfo.deposit", "Tiền cọc", "number"],
        ["rentalInfo.pickupLocation", "Địa điểm nhận xe", "select", true, locationOptions]
      ]
    },
    {
      module: "Module_OwnerContactSection",
      title: "Thông tin chủ xe",
      description: "Số điện thoại để khách liên hệ.",
      fields: [
        ["ownerInfo.name", "Tên chủ xe", "text", true],
        ["ownerInfo.phone", "SĐT chủ xe", "tel", true]
      ]
    }
  ];

  if (packageType === "basic") return basicFields;

  return [
    {
      module: "Module_BasicInfoSection",
      title: "Thông tin cơ bản",
      description: "Nhận diện xe, phân loại và các thông tin hiển thị chính.",
      fields: [
        ["basicInfo.brand", "Hãng xe", "select", true, brandOptions],
        ["basicInfo.model", "Dòng xe", "select", true, carModelsData[form.basicInfo.brand] || []],
        ["basicInfo.version", "Phiên bản", "text"],
        ["basicInfo.year", "Năm sản xuất", "select", true, yearOptions],
        ["basicInfo.plate", "Biển số xe", "text", true],
        ["basicInfo.exteriorColor", "Màu xe", "select", false, colorOptions],
        ["basicInfo.seats", "Số chỗ ngồi", "select", true, seatOptions],
        ["basicInfo.vehicleType", "Loại xe", "select", false, ["Sedan", "SUV", "MPV", "Hatchback", "Pickup", "Minivan"]]
      ]
    },
    {
      module: "Module_TechnicalInfoSection",
      title: "Thông tin kỹ thuật",
      description: "Thông số vận hành giúp lọc và tư vấn xe chính xác.",
      fields: [
        ["technicalInfo.fuel", "Loại nhiên liệu", "select", true, ["Xăng", "Diesel", "Hybrid", "Điện"]],
        ...(form.technicalInfo?.fuel === "Điện" ? [
          ["technicalInfo.engine", "Mã lực / Moment xoắn", "select", false, ["Dưới 150 HP", "150 - 200 HP", "200 - 300 HP", "Trên 300 HP"]],
          ["technicalInfo.fuelConsumption", "Mức tiêu hao (km / 1% pin)", "select", false, ["Dưới 3 km", "3 - 5 km", "5 - 7 km", "Trên 7 km"]]
        ] : [
          ["technicalInfo.engine", "Dung tích động cơ", "select", false, ["1.0L", "1.5L", "2.0L", "2.0L Bi-Turbo", "2.4L", "2.5L"]],
          ["technicalInfo.fuelConsumption", "Mức tiêu hao nhiên liệu", "select", false, ["4-5L/100km", "5-6L/100km", "6-7L/100km", "7-8L/100km", "8L+/100km"]]
        ]),
        ["technicalInfo.transmission", "Hộp số", "select", true, ["Số tự động", "Số sàn"]],
        ["technicalInfo.drivetrain", "Hệ dẫn động", "select", false, ["FWD", "RWD", "AWD", "4WD"]]
      ]
    },
    {
      module: "Module_RentalInfoSection",
      title: "Thông tin cho thuê",
      description: "Giá, điều kiện, khu vực hoạt động và trạng thái khai thác.",
      fields: [
        ["rentalInfo.status", "Trạng thái cho thuê", "select", true, [
          ["available", "Xe trống"],
          ["busy", "Xe bận"]
        ]],
        ["rentalInfo.dayPrice", "Giá thuê theo ngày", "number", true],
        ["rentalInfo.pickupLocation", "Địa điểm nhận xe", "select", true, locationOptions],
        ["rentalInfo.hourPrice", "Giá thuê theo giờ", "toggle_number"],
        ["rentalInfo.monthPrice", "Giá thuê theo tháng", "toggle_number"],
        ["rentalInfo.dailyKmLimit", "Giới hạn km mỗi ngày", "number"],
        ["rentalInfo.overKmFee", "Phí vượt km", "number"],
        ...(form.technicalInfo?.fuel === "Điện" ? [["rentalInfo.chargeFee", "Phí sạc pin (VNĐ/1%)", "toggle_number"]] : [])
      ]
    },
    {
      module: "Module_DocumentInfoSection",
      title: "Giấy tờ",
      description: "Hạn đăng kiểm, bảo hiểm và giấy tờ yêu cầu.",
      fields: [
        ["documents.requiredDocuments", "Yêu cầu giấy tờ", "textarea"],
        ["documents.registrationExpiry", "Hạn đăng kiểm", "date"],
        ["documents.insuranceExpiry", "Hạn bảo hiểm", "date"]
      ]
    },
    {
      module: "Module_OwnerContactSection",
      title: "Thông tin chủ xe",
      description: "Số điện thoại và Zalo dùng cho khách liên hệ trực tiếp.",
      fields: [
        ["ownerInfo.name", "Tên chủ xe", "text", true],
        ["ownerInfo.phone", "SĐT chủ xe", "tel", true],
        ["ownerInfo.zaloPhone", "SĐT Zalo", "tel"]
      ]
    }
  ];
};

function LoginScreen({ onLogin }) {
  const [step, setStep] = useState("google");
  const [userData, setUserData] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      
      // Check Firestore to see if user profile already exists
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        onLogin({
          uid: user.uid,
          name: data.name || user.displayName,
          email: data.email || user.email,
          avatar: data.avatar || user.photoURL,
          role: data.role
        });
      } else {
        const newUserData = {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          avatar: user.photoURL
        };
        setUserData(newUserData);
        setStep("role");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
      alert("Đăng nhập thất bại. Vui lòng kiểm tra lại kết nối.");
    }
  };

  const handleSelectRole = async (role) => {
    try {
      const fullUserData = { ...userData, role };
      if (!userData.isGuest) {
        // Save user profile to Firestore only for authenticated Google users
        await setDoc(doc(db, "users", userData.uid), {
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          role: role,
          createdAt: new Date().toISOString()
        });
      }
      onLogin(fullUserData);
    } catch (error) {
      console.error("Lỗi khi lưu vai trò:", error);
      alert("Lỗi lưu vai trò: " + error.message);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-left">
        <div className="brand" style={{ gap: 10 }}>
          <div style={{ background: '#fff', borderRadius: '50%', padding: 8, display: 'inline-flex' }}>
            <Zap size={28} color="var(--m-green)" fill="var(--m-green)" />
          </div>
          <h2 style={{ margin: 0 }}>Thuexenhanh</h2>
        </div>
        <div className="login-hero-text">
          <h1>Thuê xe tự lái<br/>siêu tốc & tiện lợi</h1>
          <p>Nền tảng kết nối hàng nghìn chủ xe và khách hàng trên toàn quốc.</p>
        </div>
      </div>
      <div className="login-right">
        {step === "google" && (
          <div className="login-box">
            <h2>Đăng nhập</h2>
            <p>Sử dụng tài khoản Google để tiếp tục</p>
            <button className="google-btn" onClick={handleGoogleLogin}>
              <svg width="24" height="24" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Tiếp tục với Google
            </button>
            <button className="skip-btn" style={{ background: 'none', border: 'none', color: 'var(--m-subtle)', marginTop: 16, cursor: 'pointer', fontSize: 14 }} onClick={() => {
              setUserData({
                name: "Khách Xem Thử",
                email: "demo@thuexenhanh.vn",
                avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                isGuest: true
              });
              setStep("role");
            }}>
              Bỏ qua đăng nhập, xem thử
            </button>
          </div>
        )}
        {step === "role" && (
          <div className="login-box">
            <h2>Bạn là ai?</h2>
            <p>Vui lòng chọn vai trò để chúng tôi tối ưu trải nghiệm cho bạn.</p>
            <div className="role-cards">
              <div className="role-card" onClick={() => handleSelectRole("owner")}>
                <UserRoundCog size={32} />
                <h3>Chủ xe</h3>
                <p>Tôi muốn đăng cho thuê xe</p>
              </div>
              <div className="role-card" onClick={() => handleSelectRole("guest")}>
                <MapPin size={32} />
                <h3>Khách thuê</h3>
                <p>Tôi muốn tìm thuê xe</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchLocationPicker({ value, onChange }) {
  const [province, setProvince] = useState(() => {
    if (!value) return '';
    for (const p of locationProvinces) {
      if (value === p || value.endsWith(`, ${p}`)) return p;
    }
    return value;
  });
  const [district, setDistrict] = useState(() => {
    if (!value) return '';
    const parts = value.split(', ');
    if (parts.length >= 2) return parts[0];
    return '';
  });

  useEffect(() => {
    if (!value) { setProvince(''); setDistrict(''); }
  }, [value]);

  const districts = provinceDistricts[province] || [];

  const handleProvince = (p) => {
    setProvince(p);
    setDistrict('');
    onChange(p);
  };
  const handleDistrict = (d) => {
    setDistrict(d);
    onChange(d ? `${d}, ${province}` : province);
  };

  return (
    <>
      <div className="search-box location-search-box" style={{ flex: 'none', width: '180px', marginLeft: '12px', background: '#fff', padding: 0 }}>
        <select value={province} onChange={e => handleProvince(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', padding: '0 12px', fontSize: 14, fontWeight: 500, color: province ? 'var(--m-dark)' : 'var(--m-subtle)', cursor: 'pointer', appearance: 'none' }}>
          <option value="" disabled hidden>Tỉnh/Thành</option>
          <option value="">Tất cả địa điểm</option>
          {locationProvinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      {districts.length > 0 && (
        <div className="search-box location-search-box" style={{ flex: 'none', width: '180px', marginLeft: '12px', background: '#fff', padding: 0 }}>
          <select value={district} onChange={e => handleDistrict(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', padding: '0 12px', fontSize: 14, fontWeight: 500, color: district ? 'var(--m-dark)' : 'var(--m-subtle)', cursor: 'pointer', appearance: 'none' }}>
            <option value="">Tất cả Quận/Huyện</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}
    </>
  );
}

function AccountSettingsScreen({ user, onClose, onSave, cars, onToggleFavorite }) {
  const [currentView, setCurrentView] = useState("menu");
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!user.isGuest) {
        await updateDoc(doc(db, "users", user.uid), {
          name,
          phone
        });
      }
      onSave({ ...user, name, phone });
      setCurrentView("menu");
    } catch (error) {
      console.error("Lỗi cập nhật tài khoản:", error);
      alert("Lỗi cập nhật tài khoản: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    alert("Đã copy link trang web: " + window.location.origin);
  };

  const favoriteCars = cars.filter(c => user.favorites?.includes(c.id));

  return (
    <ModuleFrame className="account-screen" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {currentView === "menu" && (
        <div className="account-menu">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Tài khoản</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--m-border)' }}>
            <img src={user.avatar} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ marginTop: 8, fontWeight: 600, color: 'var(--m-dark)' }}>{user.name || user.email}</div>
            <div style={{ fontSize: 12, color: 'var(--m-subtle)' }}>Vai trò: {user.role === 'owner' ? 'Chủ xe' : 'Khách thuê'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            <button className="menu-btn" onClick={() => setCurrentView("profile")}>👤 Cập nhật hồ sơ</button>
            <button className="menu-btn" onClick={() => setCurrentView("favorites")}>❤️ Xe yêu thích ({favoriteCars.length})</button>
            <button className="menu-btn" onClick={() => setCurrentView("reviews")}>⭐ Đánh giá của tôi</button>
            <button className="menu-btn" onClick={handleCopyLink}>🎁 Giới thiệu bạn bè (Copy Link)</button>
            <button className="menu-btn" onClick={() => setCurrentView("policy")}>🛡️ Chính sách bảo vệ dữ liệu</button>
            <button className="menu-btn" style={{ color: 'var(--m-red)' }} onClick={() => alert('Tính năng đang phát triển')}>🗑️ Xóa tài khoản</button>
          </div>
        </div>
      )}

      {currentView === "profile" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => setCurrentView("menu")}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Cập nhật hồ sơ</h2>
           </div>
           <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--m-subtle)', marginBottom: 4 }}>Tên hiển thị</label>
            <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--m-subtle)', marginBottom: 4 }}>Số điện thoại</label>
            <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại..." />
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentView("menu")}>Hủy</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
          </div>
        </div>
      )}

      {currentView === "favorites" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => setCurrentView("menu")}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Xe yêu thích</h2>
           </div>
           {favoriteCars.length === 0 ? (
             <p style={{ textAlign: 'center', color: 'var(--m-subtle)', marginTop: 40 }}>Chưa có xe yêu thích nào.</p>
           ) : (
             <div className="car-grid">
               {favoriteCars.map(car => (
                 <CarCard key={car.id} car={car} adminMode={false} onView={() => alert("Tính năng xem chi tiết đang phát triển")} onMap={() => {}} liked={true} onToggleLike={() => onToggleFavorite(car.id)} />
               ))}
             </div>
           )}
        </div>
      )}

      {currentView === "reviews" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => setCurrentView("menu")}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Đánh giá của tôi</h2>
           </div>
           <div style={{ textAlign: 'center', color: 'var(--m-subtle)', marginTop: 40, padding: 24, background: 'var(--m-surface)', borderRadius: 12, border: '1px solid var(--m-border)' }}>
             <Star size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
             <p>Bạn chưa có đánh giá nào.</p>
           </div>
        </div>
      )}

      {currentView === "policy" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => setCurrentView("menu")}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Chính sách bảo mật</h2>
           </div>
           <div style={{ fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--m-border)' }}>
             <h3 style={{marginTop: 0}}>1. Thu thập thông tin</h3>
             <p>Chúng tôi thu thập các thông tin cơ bản bao gồm tên, email, số điện thoại và thông tin đăng nhập Google để định danh người dùng và hỗ trợ liên lạc trong quá trình thuê xe.</p>
             <h3>2. Sử dụng thông tin</h3>
             <p>Thông tin của bạn được sử dụng riêng cho mục đích kết nối giữa chủ xe và khách thuê, quản lý lịch trình và cải thiện chất lượng dịch vụ. Chúng tôi cam kết không bán dữ liệu cho bên thứ ba.</p>
             <h3>3. Bảo mật dữ liệu</h3>
             <p>Dữ liệu của bạn được lưu trữ an toàn trên máy chủ Firebase của Google với các lớp bảo mật chuẩn quốc tế. Mật khẩu và token xác thực được mã hóa toàn trình.</p>
             <h3>4. Quyền của người dùng</h3>
             <p>Bạn có quyền yêu cầu xem, sửa đổi hoặc xóa toàn bộ thông tin cá nhân của mình trên hệ thống của chúng tôi bất cứ lúc nào thông qua chức năng Xóa tài khoản trong ứng dụng.</p>
           </div>
        </div>
      )}
    </ModuleFrame>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("web-thue-xe-user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editingId, setEditingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const adminMode = currentUser?.role === "owner";

  // Sync authentication state from Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userData = {
              uid: firebaseUser.uid,
              name: data.name || firebaseUser.displayName,
              email: data.email || firebaseUser.email,
              avatar: data.avatar || firebaseUser.photoURL,
              role: data.role,
              favorites: data.favorites || []
            };
            setCurrentUser(userData);
            localStorage.setItem("web-thue-xe-user", JSON.stringify(userData));
          } else {
            // Handled in LoginScreen when selecting a role
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Lỗi đồng bộ thông tin user:", error);
        }
      } else {
        const saved = localStorage.getItem("web-thue-xe-user");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.isGuest) {
              setAuthLoading(false);
              return;
            }
          } catch (e) {}
        }
        setCurrentUser(null);
        localStorage.removeItem("web-thue-xe-user");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync cars collection from Firestore
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Nếu chạy offline (giao thức file://) hoặc tài khoản khách demo, đồng bộ local storage/seedCars ngay lập tức
    if (window.location.protocol === 'file:' || currentUser.isGuest) {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      setCars(Array.isArray(parsed) ? parsed : seedCars);
      setLoading(false);
      return;
    }

    setLoading(true);
    const carsRef = collection(db, "cars");
    const unsubscribe = onSnapshot(carsRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seeding database with default cars if empty
        try {
          for (const car of seedCars) {
            await setDoc(doc(db, "cars", car.id), car);
          }
        } catch (err) {
          console.error("Lỗi khi tạo dữ liệu mẫu trên Firestore:", err);
          // Fallback to local storage
          const saved = localStorage.getItem(STORAGE_KEY);
          const parsed = saved ? JSON.parse(saved) : null;
          setCars(Array.isArray(parsed) ? parsed : seedCars);
        }
      } else {
        const carsList = [];
        snapshot.forEach((doc) => {
          carsList.push(doc.data());
        });
        // Sort descending by creation date
        carsList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setCars(carsList);
        
        // Backup to local storage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(carsList));
        } catch (err) {
          console.error("Lỗi lưu dự phòng local storage:", err);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Lỗi lắng nghe Firestore, chuyển sang Offline Storage:", error);
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      setCars(Array.isArray(parsed) ? parsed : seedCars);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSaveCar = async (car) => {
    try {
      const carId = car.id || `CAR-${String(Date.now()).slice(-6)}`;
      const todayStr = today();
      const updatedCar = {
        ...car,
        id: carId,
        createdAt: car.createdAt || todayStr,
        updatedAt: todayStr
      };
      
      // Tự động ghép tên xe
      updatedCar.basicInfo.name = `${updatedCar.basicInfo.brand || ''} ${updatedCar.basicInfo.model || ''} ${updatedCar.basicInfo.version || ''} ${updatedCar.basicInfo.year || ''}`.replace(/\s+/g, ' ').trim();

      if (window.location.protocol === 'file:' || currentUser?.isGuest) {
        setCars((current) => {
          let next;
          if (car.id && current.some((item) => item.id === car.id)) {
            next = current.map((item) => (item.id === car.id ? updatedCar : item));
          } else {
            next = [updatedCar, ...current];
          }
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch (err) {
            console.error("Lỗi lưu offline:", err);
          }
          return next;
        });
      } else {
        await setDoc(doc(db, "cars", carId), updatedCar);
      }
      setEditingId(null);
      setActiveTab("overview");
    } catch (err) {
      console.error("Lỗi lưu thông tin xe:", err);
      alert("Lỗi lưu thông tin xe: " + err.message);
    }
  };

  const editingCar = cars.find((car) => car.id === editingId);

  useEffect(() => {
    if (!adminMode && activeTab === "add") {
      setActiveTab("overview");
      setEditingId(null);
    }
  }, [adminMode, activeTab]);

  const appLoading = authLoading || (currentUser && loading);

  if (appLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--m-bg)', color: 'var(--m-dark)', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: 'var(--m-blue)', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--m-subtle)' }}>Đang tải giao diện offline...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={(user) => {
      setCurrentUser(user);
      localStorage.setItem("web-thue-xe-user", JSON.stringify(user));
    }} />;
  }

  return (
    <div className="app-shell">
      {/* ── HEADER ── */}
      <ModuleFrame className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-mark" style={{ background: 'var(--m-blue)', flex: 'none' }}>
            <Zap size={22} color="white" fill="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px' }}>Thuexenhanh</h1>
            <p className="hide-mobile" style={{ margin: 0, fontSize: '12px', color: 'var(--m-subtle)' }}>Nền tảng thuê xe tự lái siêu tốc</p>
          </div>
        </div>
        <div className="user-profile" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }} className="hide-mobile">
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--m-dark)' }}>{currentUser.name}</div>
            <div style={{ fontSize: 12, color: 'var(--m-subtle)' }}>
              {currentUser.role === 'owner' ? 'Chủ xe' : 'Khách thuê'}
            </div>
          </div>
          <img 
            src={currentUser.avatar} 
            alt="Avatar" 
            style={{ width: 40, height: 40, borderRadius: '50%', cursor: 'pointer' }} 
            onClick={() => setActiveTab("account")}
            title="Cài đặt tài khoản"
          />
          <button className="icon-button" title="Đăng xuất" onClick={async () => {
            try {
              await logout();
            } catch (e) {
              console.error("Lỗi khi đăng xuất Firebase:", e);
            }
            setCurrentUser(null);
          }}>
            <LogOut size={18} />
          </button>
        </div>
      </ModuleFrame>

      {/* ── TABS ── */}
      <ModuleFrame className="tabs">
        <button id="tab-overview" className={activeTab === "overview" ? "selected" : ""} onClick={() => setActiveTab("overview")}>
          <LayoutGrid size={17} />
          {adminMode ? "Xe của tôi" : "Danh sách xe"}
        </button>
        {adminMode && (
          <button id="tab-add" className={activeTab === "add" ? "selected" : ""} onClick={() => setActiveTab("add")}>
            {editingId ? "Chỉnh sửa xe" : "Thêm xe mới"}
          </button>
        )}
        <button id="tab-account" className={activeTab === "account" ? "selected" : "hide-desktop"} onClick={() => setActiveTab("account")} style={{ marginLeft: 'auto' }}>
          <User size={17} />
          Tài khoản
        </button>
      </ModuleFrame>

      {activeTab === "overview" && (
        <Overview
          cars={cars}
          adminMode={adminMode}
          currentUser={currentUser}
          onToggleFavorite={toggleFavorite}
          onEdit={(id) => {
            setEditingId(id);
            setActiveTab("add");
          }}
          onDelete={async (id) => {
            if (window.confirm("Bạn có chắc chắn muốn xóa xe này?")) {
              try {
                if (window.location.protocol === 'file:' || currentUser?.isGuest) {
                  setCars((current) => {
                    const next = current.filter((car) => car.id !== id);
                    try {
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                    } catch (err) {
                      console.error("Lỗi lưu offline:", err);
                    }
                    return next;
                  });
                } else {
                  await deleteDoc(doc(db, "cars", id));
                }
              } catch (err) {
                console.error("Lỗi xóa xe:", err);
                alert("Lỗi xóa xe: " + err.message);
              }
            }
          }}
          onDuplicate={async (car) => {
            try {
              const newId = `CAR-${String(Date.now()).slice(-6)}`;
              const todayStr = today();
              const duplicatedCar = {
                ...car,
                id: newId,
                createdAt: todayStr,
                updatedAt: todayStr
              };

              if (window.location.protocol === 'file:' || currentUser?.isGuest) {
                setCars((current) => {
                  const next = [duplicatedCar, ...current];
                  try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                  } catch (err) {
                    console.error("Lỗi lưu offline:", err);
                  }
                  return next;
                });
              } else {
                await setDoc(doc(db, "cars", newId), duplicatedCar);
              }
            } catch (err) {
              console.error("Lỗi nhân bản xe:", err);
              alert("Lỗi nhân bản xe: " + err.message);
            }
          }}
          onStatus={async (id, status) => {
            try {
              if (window.location.protocol === 'file:' || currentUser?.isGuest) {
                setCars((current) => {
                  const next = current.map((car) =>
                    car.id === id
                      ? { ...car, rentalInfo: { ...car.rentalInfo, status }, updatedAt: today() }
                      : car
                  );
                  try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                  } catch (err) {
                    console.error("Lỗi lưu offline:", err);
                  }
                  return next;
                });
              } else {
                const carRef = doc(db, "cars", id);
                await updateDoc(carRef, {
                  "rentalInfo.status": status,
                  updatedAt: today()
                });
              }
            } catch (err) {
              console.error("Lỗi cập nhật trạng thái:", err);
              alert("Lỗi cập nhật trạng thái: " + err.message);
            }
          }}
        />
      )}
      
      {activeTab === "add" && (
        <AddCarForm editingCar={editingCar} onSave={handleSaveCar} onCancel={() => { setEditingId(null); setActiveTab("overview"); }} />
      )}

      {activeTab === "account" && (
        <AccountSettingsScreen 
          user={currentUser} 
          onClose={() => setActiveTab("overview")} 
          onSave={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem("web-thue-xe-user", JSON.stringify(updatedUser));
          }} 
        />
      )}
    </div>
  );
}

function Overview({ cars, adminMode, currentUser, showFavorites, onEdit, onDelete, onDuplicate, onStatus, onToggleFavorite }) {
  const [query, setQuery] = useState("");
  const [selectedCar, setSelectedCar] = useState(null);
  const [mapLocation, setMapLocation] = useState(null);
  const likedCars = currentUser?.favorites || [];
  
  const [filters, setFilters] = useState({
    brand: "",
    seats: "",
    vehicleType: "",
    transmission: "",
    fuel: "",
    status: "",
    location: "",
    maxPrice: "",
    driver: ""
  });
  const [expanded, setExpanded] = useState(false);
  const [sort, setSort] = useState("newest");
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [rentalTimeRange, setRentalTimeRange] = useState({
    startDate: null,
    endDate: null
  });

  const smartFilters = useMemo(() => inferSmartFilters(query), [query]);
  const mergedFilters = { ...filters, ...smartFilters };
  const chips = activeChips(mergedFilters, query);

  const filteredCars = useMemo(() => {
    const normalizedQuery = normalize(query);
    return cars
      .filter((car) => {
        if (showFavorites && !likedCars.includes(car.id)) return false;
        if (adminMode && car.ownerId !== currentUser.uid) return false;
        
        const haystack = normalize([
          car.basicInfo.name,
          car.basicInfo.brand,
          car.basicInfo.model,
          car.basicInfo.vehicleType,
          car.basicInfo.plate,
          car.basicInfo.exteriorColor,
          car.technicalInfo.fuel,
          car.technicalInfo.transmission,
          car.rentalInfo.pickupLocation,
          car.rentalInfo.rentalType,
          car.descriptions.short
        ].join(" "));
        const queryMatch = !normalizedQuery || normalizedQuery.split(" ").every((term) => haystack.includes(term) || ["xe", "oto", "o", "to"].includes(term));
        const priceMatch = !mergedFilters.maxPrice || Number(car.rentalInfo.dayPrice) <= Number(mergedFilters.maxPrice);
        const brandMatch = !mergedFilters.brand || car.basicInfo.brand === mergedFilters.brand;
        const seatsMatch = !mergedFilters.seats || Number(car.basicInfo.seats) === Number(mergedFilters.seats);
        const typeMatch = !mergedFilters.vehicleType || car.basicInfo.vehicleType === mergedFilters.vehicleType;
        const transmissionMatch = !mergedFilters.transmission || car.technicalInfo.transmission === mergedFilters.transmission;
        const fuelMatch = !mergedFilters.fuel || car.technicalInfo.fuel === mergedFilters.fuel;
        const normalizedCarStatus = car.rentalInfo.status === 'available' ? 'available' : 'busy';
        const statusMatch = !mergedFilters.status || normalizedCarStatus === mergedFilters.status;
        const locationMatch = !mergedFilters.location || normalize(car.rentalInfo.pickupLocation).includes(normalize(mergedFilters.location));
        const driverMatch = !mergedFilters.driver || String(car.rentalInfo.driverIncluded) === mergedFilters.driver;
        const dateMatch = (() => {
          if (!rentalTimeRange.startDate || !rentalTimeRange.endDate) return true;
          if (car.rentalInfo.status !== 'available') return false;
          const blocked = car.rentalInfo.blockedDates || [];
          const cur = new Date(rentalTimeRange.startDate);
          const end = new Date(rentalTimeRange.endDate);
          while (cur <= end) {
            const key = cur.toISOString().slice(0, 10);
            if (blocked.includes(key)) return false;
            cur.setDate(cur.getDate() + 1);
          }
          return true;
        })();
        return queryMatch && priceMatch && brandMatch && seatsMatch && typeMatch && transmissionMatch && fuelMatch && statusMatch && locationMatch && driverMatch && dateMatch;
      })
      .sort(sorters[sort]);
  }, [cars, query, mergedFilters, sort, showFavorites, likedCars, adminMode, currentUser]);

  return (
    <main className="content">
      {/* Filter Panel */}
      <ModuleFrame className="filter-panel">
        <div className="search-line">
          <div className="search-box">
            <Search size={18} />
            <input
              id="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm: Toyota 7 chỗ, SUV còn trống, xe xăng dưới 1 triệu..."
            />
          </div>
          {!adminMode && (
             <SearchLocationPicker value={filters.location} onChange={(val) => setFilters({ ...filters, location: val })} />
          )}
          <div 
             className="search-box" 
             style={{ width: '220px', flex: 'none', marginLeft: '12px', cursor: 'pointer', background: '#fff' }} 
             onClick={() => setIsTimePickerOpen(true)}
          >
            <CalendarDays size={18} />
            <div style={{ flex: 1, padding: '4px 0', fontSize: 14, fontWeight: 500, color: rentalTimeRange.startDate ? 'var(--m-dark)' : 'var(--m-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {rentalTimeRange.startDate && rentalTimeRange.endDate
                ? `${formatShortDate(rentalTimeRange.startDate)} → ${formatShortDate(rentalTimeRange.endDate)}`
                : "Chọn ngày thuê"}
            </div>
            {rentalTimeRange.startDate && (
              <button onClick={(e) => { e.stopPropagation(); setRentalTimeRange({ startDate: null, endDate: null }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--m-mid)', padding: 0, display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button id="btn-filter-toggle" className="icon-text" onClick={() => setExpanded((v) => !v)}>
            <Filter size={16} />
            Bộ lọc
            <ChevronDown size={15} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
          </button>
        </div>

        {expanded && (
          <div className="filter-grid">
            <FilterSelect label="Hãng xe" value={filters.brand} options={brandOptions} onChange={(brand) => setFilters({ ...filters, brand })} />
            <FilterSelect label="Số chỗ" value={filters.seats} options={seatOptions} onChange={(seats) => setFilters({ ...filters, seats })} />
            <FilterSelect label="Loại xe" value={filters.vehicleType} options={unique(cars.map((c) => c.basicInfo.vehicleType))} onChange={(vehicleType) => setFilters({ ...filters, vehicleType })} />
            <FilterSelect label="Hộp số" value={filters.transmission} options={unique(cars.map((c) => c.technicalInfo.transmission))} onChange={(transmission) => setFilters({ ...filters, transmission })} />
            <FilterSelect label="Nhiên liệu" value={filters.fuel} options={["Xăng", "Dầu (Diesel)", "Điện", "Hybrid"]} onChange={(fuel) => setFilters({ ...filters, fuel })} />
            <FilterSelect label="Trạng thái" value={filters.status} options={[
              ["available", "Xe trống"],
              ["busy", "Xe bận"]
            ]} onChange={(status) => setFilters({ ...filters, status })} />
            {adminMode && <FilterSelect label="Địa điểm" value={filters.location} options={locationOptions} onChange={(location) => setFilters({ ...filters, location })} />}
            <label>
              Giá tối đa/ngày
              <input type="text" value={filters.maxPrice ? parseInt(filters.maxPrice).toLocaleString('vi-VN') : ''} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value.replace(/\D/g, '') })} placeholder="1.000.000" style={{ height: 38, padding: "0 10px", borderRadius: 8, border: "1.5px solid var(--m-border)", outline: "none", fontSize: 13, background: "#fff", color: "var(--m-dark)" }} />
            </label>
            <FilterSelect label="Tài xế" value={filters.driver} options={[["false", "Tự lái"], ["true", "Có tài xế"]]} onChange={(driver) => setFilters({ ...filters, driver })} />
          </div>
        )}

        <div className="chip-row">
          {chips.map((chip) => (
            <span className="chip" key={chip.key}>
              {chip.label}
              <button onClick={() => chip.key === "query" ? setQuery("") : setFilters({ ...filters, [chip.key]: "" })} aria-label={`Xóa ${chip.label}`}>
                <X size={12} />
              </button>
            </span>
          ))}
          {chips.length > 0 && (
            <button className="clear-link" onClick={() => { setQuery(""); setFilters({ brand: "", seats: "", vehicleType: "", transmission: "", fuel: "", status: "", location: "", maxPrice: "", driver: "" }); }}>
              Xóa tất cả
            </button>
          )}
        </div>
      </ModuleFrame>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <select id="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sắp xếp" style={{ height: 42, padding: "0 12px", borderRadius: "var(--r-md)", border: "1.5px solid var(--m-border)", background: "var(--m-surface)", fontSize: 14, fontWeight: 600, color: "var(--m-dark)", outline: "none", cursor: "pointer", width: 200 }}>
          <option value="newest">Chọn</option>
          <option value="priceAsc">Giá thấp → cao</option>
          <option value="priceDesc">Giá cao → thấp</option>
          <option value="yearDesc">Năm sản xuất</option>
          <option value="popular">Yêu thích</option>
        </select>
      </div>

      {/* Car Grid */}
      <ModuleFrame className="car-grid">
        {filteredCars.map((car) => (
          <CarCard key={car.id} car={car} adminMode={adminMode}
            liked={likedCars.has(car.id)}
            likeCount={car.status.popularity || 0}
            onToggleLike={() => toggleLike(car.id)}
            onView={setSelectedCar} onMap={setMapLocation} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onStatus={onStatus} />
        ))}
        {filteredCars.length === 0 && (
          <div className="empty-state">
            <Search size={40} strokeWidth={1.5} />
            <h2>Không tìm thấy xe phù hợp</h2>
            <p>Hãy thử thay đổi bộ lọc hoặc giảm điều kiện tìm kiếm.</p>
          </div>
        )}
      </ModuleFrame>

      {selectedCar && <CarDetailModal car={selectedCar} adminMode={adminMode} currentUser={currentUser} onMap={setMapLocation} onClose={() => setSelectedCar(null)} onEdit={(id) => { setSelectedCar(null); onEdit(id); }} />}
      {mapLocation && <MapModal location={mapLocation} onClose={() => setMapLocation(null)} />}
      {isTimePickerOpen && (
        <DateTimePickerModal
          initialStart={rentalTimeRange.startDate}
          initialEnd={rentalTimeRange.endDate}
          onClose={() => setIsTimePickerOpen(false)}
          onApply={(range) => {
            setRentalTimeRange(range);
            setIsTimePickerOpen(false);
          }}
        />
      )}
    </main>
  );
}

function ImageSlider({ images, alt }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div className="image-fallback"><Car size={36} strokeWidth={1.5} /></div>;
  }

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="image-slider">
      <img src={images[currentIndex].url} alt={alt} onError={(e) => { e.currentTarget.style.display = "none"; }} />
      {images.length > 1 && (
        <>
          <button className="slider-btn prev" onClick={prevSlide}><ChevronLeft size={20} /></button>
          <button className="slider-btn next" onClick={nextSlide}><ChevronRight size={20} /></button>
          <div className="slider-dots">
            {images.map((_, idx) => (
              <span key={idx} className={`dot ${idx === currentIndex ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CarCard({ car, adminMode, onView, onMap, onEdit, onDelete, onDuplicate, onStatus, liked, likeCount, onToggleLike }) {
  const [contactStep, setContactStep] = useState(0);
  const owner = getOwnerInfo(car);
  const zaloPhone = phoneDigits(owner.zaloPhone || owner.phone);

  return (
    <ModuleFrame className={`car-card ${car.status.isVerified ? 'verified-card' : ''}`} onClick={() => !adminMode && onView(car)} style={{ cursor: !adminMode ? 'pointer' : 'default' }}>
      {/* Image area */}
      <ModuleFrame className="car-image">
        <ImageSlider images={car.images} alt={`${car.basicInfo.brand} ${car.basicInfo.model}`} />
        {/* Transmission badge */}
        <span className="badge-transmission">
          {car.technicalInfo.transmission}
        </span>
        {/* Status badge */}
        <StatusBadge status={car.rentalInfo.status} />
        {/* Verified Badge */}
        {car.status.isVerified && (
          <span className="badge-verified" style={{ position: 'absolute', top: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 4, height: 26, padding: '0 10px', borderRadius: 'var(--r-full)', background: 'var(--m-blue)', color: '#fff', fontSize: 11, fontWeight: 700, zIndex: 10, backdropFilter: 'blur(6px)' }}>
            <BadgeCheck size={14} /> Xác minh
          </span>
        )}
      </ModuleFrame>

      {/* Body */}
      <div className="card-body">
        {/* Car name + view button */}
        <div className="card-title-row">
          <h2 title={`${car.basicInfo.brand} ${car.basicInfo.model} ${car.basicInfo.year}`}>
            {car.basicInfo.brand} {car.basicInfo.model} {car.basicInfo.year}
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {!adminMode && (
              <button className="icon-button" title={liked ? "Bỏ lưu xe" : "Lưu xe"} onClick={(e) => { e.stopPropagation(); onToggleLike && onToggleLike(); }}>
                <Heart size={17} fill={liked ? "var(--m-red)" : "none"} color={liked ? "var(--m-red)" : "currentColor"} />
              </button>
            )}
            {adminMode && (
              <button className="icon-button" title="Xem nhanh" onClick={(e) => { e.stopPropagation(); onView(car); }}>
                <Eye size={17} />
              </button>
            )}
          </div>
        </div>

        {/* Rating + likes */}
        <div className="card-meta">
          <span className="rating">
            <Star size={14} fill="currentColor" />
            {((car.status.popularity / 100) * 1.5 + 3.5).toFixed(1)}
            <Heart size={12} fill="var(--m-red)" color="var(--m-red)" style={{marginLeft: 6}} />
            <span className="trip-count">{likeCount}</span>
          </span>
        </div>

        {/* Compact spec grid */}
        <div className="spec-grid">
          <span><Gauge size={14} />{car.technicalInfo.transmission || 'N/A'}</span>
          <span><ShieldCheck size={14} />{car.technicalInfo.fuel || 'N/A'}</span>
          <span><Users size={14} />{car.basicInfo?.seats || '4'} chỗ</span>
          <button type="button" className="map-link" onClick={(e) => { e.stopPropagation(); onMap(car.rentalInfo.pickupLocation); }}>
            <MapPin size={14} />{car.rentalInfo.pickupLocation || 'Chưa cập nhật'}
          </button>
        </div>

        {/* Divider */}
        <div className="card-divider" />

        {/* Price row */}
        <ModuleFrame className="price-row">
          <strong>{formatCurrency(car.rentalInfo.dayPrice)}</strong>
          <span>/ ngày</span>
          <small>Cọc {formatCurrency(car.rentalInfo.deposit)}</small>
        </ModuleFrame>

        {/* Admin actions */}
        {adminMode && (
          <ModuleFrame className="action-row">
            <button onClick={() => onEdit(car.id)}><Edit3 size={14} />Sửa</button>
            <button onClick={() => onDuplicate(car)}><Copy size={14} />Nhân bản</button>
            <select value={car.rentalInfo.status === 'available' ? 'available' : 'busy'} onChange={(e) => onStatus(car.id, e.target.value)} aria-label="Đổi trạng thái">
              <option value="available">Xe trống</option>
              <option value="busy">Xe bận</option>
            </select>
            <button className="danger" onClick={() => window.confirm("Xóa xe này?") && onDelete(car.id)}><Trash2 size={14} />Xóa</button>
          </ModuleFrame>
        )}

        {/* Guest actions */}
        {!adminMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {contactStep === 0 && (
              <button className="primary" style={{ width: '100%', height: 38 }} onClick={(e) => { e.stopPropagation(); setContactStep(1); }}>Liên hệ chủ xe</button>
            )}
            {contactStep === 1 && (
              <button className="secondary" style={{ width: '100%', height: 38 }} onClick={(e) => { e.stopPropagation(); setContactStep(2); }}>{owner.phone}</button>
            )}
            {contactStep === 2 && (
              <div style={{ display: 'flex', gap: 8 }}>
                 <a className="secondary" style={{ flex: 1, height: 38 }} href={`tel:${phoneDigits(owner.phone)}`} onClick={e => e.stopPropagation()}>Gọi điện</a>
                 <a className="zalo-button" style={{ flex: 1, height: 38 }} href={`https://zalo.me/${zaloPhone}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Nhắn Zalo</a>
              </div>
            )}
          </div>
        )}

        {adminMode && (
          <div className="tech-meta">
            ID {car.id} · Cập nhật {car.updatedAt}{car.status.dataWarning ? ` · ⚠ ${car.status.dataWarning}` : ""}
          </div>
        )}
      </div>
    </ModuleFrame>
  );
}

function CarDetailModal({ car, adminMode, currentUser = null, onMap, onClose, onEdit }) {
  const [contactStep, setContactStep] = useState(0);
  const [liked, setLiked] = useState(false);
  const owner = getOwnerInfo(car);
  const zaloPhone = phoneDigits(owner.zaloPhone || owner.phone);
  const specs = [
    ["Hãng xe", car.basicInfo.brand],
    ["Dòng xe", car.basicInfo.model],
    ["Phiên bản", car.basicInfo.version],
    ["Năm sản xuất", car.basicInfo.year],
    ["Biển số", car.basicInfo.plate],
    ["Số chỗ", `${car.basicInfo.seats} chỗ`],
    ["Nhiên liệu", car.technicalInfo.fuel],
    ["Hộp số", car.technicalInfo.transmission],
    ["Động cơ", car.technicalInfo.engine],
    ["Dẫn động", car.technicalInfo.drivetrain],
    ["Số km", `${Number(car.technicalInfo.mileage || 0).toLocaleString("vi-VN")} km`],
    ["Tiêu hao", car.technicalInfo.fuelConsumption]
  ];
  const depositLabel = car.depositType === 'motorbike'
    ? 'Xe máy thế chấp (~15.000.000đ)'
    : formatCurrency(car.depositAmount || car.rentalInfo.deposit);
  const rental = [
    ["Theo ngày", formatCurrency(car.rentalInfo.dayPrice)],
    ["Theo giờ", formatCurrency(car.rentalInfo.hourPrice)],
    ["Theo tháng", formatCurrency(car.rentalInfo.monthPrice)],
    ["Tiền cọc", depositLabel],
    ["Giới hạn km", car.rentalInfo.dailyKmLimit ? `${Number(car.rentalInfo.dailyKmLimit).toLocaleString('vi-VN')} km/ngày` : ''],
    ["Phí vượt km", formatCurrency(car.rentalInfo.overKmFee)],
    ["Nhận xe", car.rentalInfo.pickupLocation]
  ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <ModuleFrame className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-hero">
          <ImageSlider images={car.images} alt={car.basicInfo.name} />
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            <X size={17} />
          </button>
        </div>
        <div className="detail-content">
          <div className="detail-title">
            <div>
              <StatusBadge status={car.rentalInfo.status} />
              <h2>
                {car.basicInfo.name}
                {car.status.isVerified && <BadgeCheck size={22} fill="var(--m-green)" color="#fff" style={{marginLeft: 8, display: 'inline-block', verticalAlign: 'text-bottom'}} title="Xe đã kiểm định" />}
              </h2>
              <p>{car.descriptions.short}</p>
            </div>
            <div className="detail-price">
              <strong>{formatCurrency(car.rentalInfo.dayPrice)}</strong>
              <span>/ ngày</span>
            </div>
          </div>

          <div className="detail-actions">
            <button type="button" onClick={() => onMap(car.rentalInfo.pickupLocation)}><MapPin size={14} />{car.rentalInfo.pickupLocation}</button>
            <span><CalendarDays size={14} />Bảo dưỡng: {car.documents.nextMaintenance || "Chưa có"}</span>
            <span><Star size={14} fill="var(--m-amber)" strokeWidth={0} />5.0 · {car.status.popularity}% phổ biến</span>
          </div>

          <div className="owner-contact">
            <div>
              <h3>Chủ xe</h3>
              <p>{owner.name}</p>
            </div>
            <div className="contact-actions">
              {contactStep === 0 && (
                <button className="primary" onClick={() => setContactStep(1)}>Liên hệ</button>
              )}
              {contactStep === 1 && (
                <button className="secondary" onClick={() => setContactStep(2)}>{owner.phone}</button>
              )}
              {contactStep === 2 && (
                <>
                  <a className="secondary" href={`tel:${phoneDigits(owner.phone)}`}>Gọi điện</a>
                  <a className="zalo-button" href={`https://zalo.me/${zaloPhone}`} target="_blank" rel="noreferrer">Nhắn Zalo</a>
                </>
              )}
            </div>
          </div>

          <div className="detail-columns">
            <InfoPanel title="Thông số xe" items={specs} />
            <InfoPanel title="Thông tin thuê" items={rental} />
          </div>

          <div className="detail-note">
            <h3>Mô tả chi tiết</h3>
            <p>{car.descriptions.detail || "Không có mô tả chi tiết."}</p>
            <h3>Tiện nghi nổi bật</h3>
            <p>{car.descriptions.amenities || "Không có thông tin tiện nghi."}</p>
            <h3>Điều kiện thuê</h3>
            <p>{car.rentalInfo.rentalCondition || "Không có điều kiện đặc biệt."}</p>
            
            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--m-border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3>Đánh giá & Bình luận</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {!adminMode && (
                  <button className="secondary" style={{ padding: '6px 12px', fontSize: 13, height: 32 }} onClick={() => {
                    if (currentUser?.isGuest) {
                      alert("Vui lòng đăng nhập bằng Google để lưu xe.");
                      return;
                    }
                    setLiked(!liked);
                  }}>
                    <Heart size={14} style={{ marginRight: 6 }} fill={liked ? "var(--m-red)" : "none"} color={liked ? "var(--m-red)" : "currentColor"} />
                    {liked ? "Đã lưu" : "Lưu xe"}
                  </button>
                )}
                <button className="secondary" style={{ padding: '6px 12px', fontSize: 13, height: 32 }} onClick={() => {
                  if (currentUser?.isGuest) {
                    alert("Vui lòng đăng nhập bằng Google để bình luận.");
                    return;
                  }
                  alert("Chức năng đang phát triển");
                }}>
                  <MessageSquare size={14} style={{ marginRight: 6 }}/>Viết bình luận
                </button>
              </div>
            </div>
            <div className="comments-section" style={{ background: 'var(--m-bg)', padding: '16px 0', borderRadius: 12 }}>
              <div style={{ padding: '0 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <img src="https://i.pravatar.cc/150?u=1" alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                  <strong style={{ fontSize: 13 }}>Nguyễn Hoàng Anh</strong>
                  <span style={{ fontSize: 12, color: 'var(--m-subtle)' }}>• 2 ngày trước</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 4 }}>
                  <Star size={12} fill="var(--m-amber)" color="var(--m-amber)" strokeWidth={0} />
                  <Star size={12} fill="var(--m-amber)" color="var(--m-amber)" strokeWidth={0} />
                  <Star size={12} fill="var(--m-amber)" color="var(--m-amber)" strokeWidth={0} />
                  <Star size={12} fill="var(--m-amber)" color="var(--m-amber)" strokeWidth={0} />
                  <Star size={12} fill="var(--m-amber)" color="var(--m-amber)" strokeWidth={0} />
                </div>
                <p style={{ fontSize: 13, margin: 0, color: 'var(--m-mid)', lineHeight: 1.5 }}>Xe rất mới, chủ xe nhiệt tình giao xe tận nơi. Sẽ tiếp tục ủng hộ lần sau!</p>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--m-border)', margin: '16px 0' }} />
              <div style={{ padding: '0 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <img src="https://i.pravatar.cc/150?u=2" alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                  <strong style={{ fontSize: 13 }}>Trần Lê Tuấn</strong>
                  <span style={{ fontSize: 12, color: 'var(--m-subtle)' }}>• 1 tuần trước</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 4 }}>
                  <Star size={12} fill="var(--m-amber)" color="var(--m-amber)" strokeWidth={0} />
                  <Star size={12} fill="var(--m-amber)" color="var(--m-amber)" strokeWidth={0} />
                  <Star size={12} fill="var(--m-amber)" color="var(--m-amber)" strokeWidth={0} />
                  <Star size={12} fill="var(--m-amber)" color="var(--m-amber)" strokeWidth={0} />
                  <Star size={12} color="var(--m-border)" strokeWidth={2} />
                </div>
                <p style={{ fontSize: 13, margin: 0, color: 'var(--m-mid)', lineHeight: 1.5 }}>Xe đi êm, điều hoà mát lạnh. Giá cả hợp lý trong phân khúc.</p>
              </div>
            </div>
          </div>

          {adminMode && (
            <div className="modal-footer">
              <span>ID {car.id} · Cập nhật {car.updatedAt}</span>
              <button className="primary" onClick={() => onEdit(car.id)}><Edit3 size={15} />Sửa xe</button>
            </div>
          )}
        </div>
      </ModuleFrame>
    </div>
  );
}

function UpgradeModal({ plan, onClose }) {
  const [isPaid, setIsPaid] = useState(false);

  if (isPaid) {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
        <section className="map-modal" style={{ maxWidth: 400, padding: 32, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--m-green-light)', color: 'var(--m-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
             <Check size={32} />
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Đang xử lý thanh toán</h2>
          <p style={{ color: 'var(--m-mid)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>Tài khoản của bạn đang được xử lý, chúng tôi sẽ có Email thông báo khi bạn được cập nhật thành công.</p>
          <button className="primary" style={{ width: '100%', padding: '12px 0' }} onClick={onClose}>Đóng</button>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="map-modal" style={{ maxWidth: 400, padding: 24, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Nâng cấp {plan.title}</h2>
          <button className="modal-close inline-close" onClick={onClose} aria-label="Đóng" style={{ top: 'auto', right: 'auto', position: 'static' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ background: 'var(--m-green-light)', color: 'var(--m-green)', padding: '12px', borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 18 }}>
          {plan.price}
        </div>

        <ul style={{ textAlign: 'left', fontSize: 14, lineHeight: 1.6, marginBottom: 20, paddingLeft: 20, color: 'var(--m-mid)' }}>
          <li>Hiển thị <strong>đầy đủ thông số</strong> kỹ thuật xe</li>
          <li>Nổi bật viền thẻ xe với huy hiệu <strong style={{color: 'var(--m-green)'}}>Tích Xanh</strong></li>
          {plan.id === 'forever' && (
            <li><strong>Ưu tiên hiển thị</strong> trên đầu kết quả tìm kiếm</li>
          )}
        </ul>

        <div style={{ border: '2px dashed var(--m-border)', padding: 16, borderRadius: 12, marginBottom: 16, display: 'inline-block' }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ThanhToanGoiTichXanh_${plan.id}`} alt="Mã QR Thanh Toán" style={{ width: 150, height: 150, display: 'block', margin: '0 auto' }} />
          <p style={{ fontSize: 12, color: 'var(--m-subtle)', marginTop: 8, marginBottom: 0 }}>Quét mã QR bằng ứng dụng ngân hàng</p>
        </div>

        <a
          className="primary"
          style={{ width: '100%', padding: '12px 0', display: 'block', textAlign: 'center', textDecoration: 'none' }}
          href={`mailto:admin@miotofleet.com?subject=Yêu%20cầu%20kích%20hoạt%20Gói%20Tích%20Xanh%20-%20${encodeURIComponent(plan.id)}&body=Gói%3A%20${encodeURIComponent(plan.title)}%0AGiá%3A%20${encodeURIComponent(plan.price)}%0A%0ATiền%20đã%20chuyển%20khoản%20xong.%20Vui%20lòng%20kiểm%20tra%20và%20kích%20hoạt%20gói%20cho%20tôi.`}
          onClick={() => setIsPaid(true)}
        >
          Tôi đã thanh toán
        </a>
      </section>
    </div>
  );
}

function formatShortDate(d) {
  if (!d) return "";
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dayName = days[d.getDay()];
  const dateStr = d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dayName}, ${dateStr}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

// Helper: local date → 'YYYY-MM-DD' (tránh lỗi UTC timezone)
const toLocalKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

// Helper: 'YYYY-MM-DD' → '26.06 (Thứ Sáu)'
const VN_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const fmtRangeDate = (key) => {
  if (!key) return '';
  const d = new Date(key + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} (${VN_DAYS[d.getDay()]})`;
};
const fmtRangeLabel = (r) => r.start === r.end
  ? fmtRangeDate(r.start)
  : `${fmtRangeDate(r.start)} – ${fmtRangeDate(r.end)}`;

// --- Reusable calendar render helper (used by both picker & blocked-date manager) ---
function renderCalendarMonth({ year, month, label, start, end, hoverDate, blockedSet, blockedNotes, onDayClick, onDayHover, onEditNote, onDelete, onPrev, onNext, selectMode, ranges, dateToRange, hoverBlockedSet }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="dt-cal">
      <div className="dt-cal-header">
        {label === 'left' && <button type="button" className="dt-cal-btn prev" onClick={onPrev}><ChevronLeft size={16}/></button>}
        Tháng {month + 1} năm {year}
        {label === 'right' && <button type="button" className="dt-cal-btn next" onClick={onNext}><ChevronRight size={16}/></button>}
      </div>
      <div className="dt-days-header">
        <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
      </div>
      <div className="dt-days-grid" onMouseLeave={() => onDayHover && onDayHover(null)}>
        {days.map((d, i) => {
          if (!d) return <div key={i} className="dt-day empty" />;
          const dateObj = new Date(year, month, d);
          const isPast = dateObj.getTime() < today.getTime();
          const key = toLocalKey(dateObj);
          const isBlocked = blockedSet && blockedSet.has(key);
          const isHoverBlocked = hoverBlockedSet?.has(key);
          const time = dateObj.getTime();
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

          let cls = 'dt-day';
          if (isWeekend) cls += ' weekend';
          if (isPast) cls += ' disabled';

          if (selectMode === 'blocked') {
            if (isBlocked) {
              cls += ' blocked';
              const range = ranges?.[dateToRange?.[key]];
              if (range) {
                if (range.tag === 'rented') cls += ' blocked-tag-rented';
                else cls += ' blocked-tag-busy';
                const prevKey = toLocalKey(new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() - 1));
                const nextKey = toLocalKey(new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1));
                const prevSame = dateToRange?.[prevKey] === dateToRange?.[key];
                const nextSame = dateToRange?.[nextKey] === dateToRange?.[key];
                if (!prevSame && !nextSame) cls += ' blocked-solo';
                else if (!prevSame) cls += ' blocked-start';
                else if (!nextSame) cls += ' blocked-end';
                if (range.note) cls += ' blocked-has-note';
              }
            } else if (isHoverBlocked) {
              cls += ' blocked blocked-hover';
              const prevKey = toLocalKey(new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() - 1));
              const nextKey = toLocalKey(new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1));
              const prevH = hoverBlockedSet.has(prevKey);
              const nextH = hoverBlockedSet.has(nextKey);
              if (!prevH && !nextH) cls += ' blocked-solo';
              else if (!prevH) cls += ' blocked-start';
              else if (!nextH) cls += ' blocked-end';
            }
          }

          if (selectMode === 'range') {
            const isStart = start && time === start.getTime();
            const isEnd = end && time === end.getTime();
            if (isStart || isEnd) cls += ' selected';
            if (isStart) cls += ' range-start';
            if (isEnd) cls += ' range-end';
            if (start && end && time > start.getTime() && time < end.getTime()) cls += ' in-range';
            if (start && !end && hoverDate && time > start.getTime() && time <= hoverDate.getTime()) cls += ' in-range';
            if (start && !end && hoverDate && time === hoverDate.getTime()) cls += ' range-end';
          }

          return (
            <div
              key={i}
              className={cls}
              onClick={() => !isPast && onDayClick && onDayClick(year, month, d, key)}
              onMouseEnter={() => {
                if (selectMode === 'range') { onDayHover && !isPast && onDayHover(new Date(year, month, d)); }
                else { onDayHover && !isPast && onDayHover(key); }
              }}
              style={{ position: 'relative', cursor: isPast ? 'not-allowed' : 'pointer' }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateTimePickerModal({ initialStart, initialEnd, onClose, onApply }) {
  const [baseDate, setBaseDate] = useState(() => {
    const d = initialStart || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [hoverDate, setHoverDate] = useState(null);

  const leftYear = baseDate.getFullYear();
  const leftMonth = baseDate.getMonth();
  
  const rightDate = new Date(leftYear, leftMonth + 1, 1);
  const rightYear = rightDate.getFullYear();
  const rightMonth = rightDate.getMonth();

  const handleNextMonth = () => setBaseDate(new Date(leftYear, leftMonth + 1, 1));
  const handlePrevMonth = () => {
    const today = new Date();
    if (leftYear > today.getFullYear() || (leftYear === today.getFullYear() && leftMonth > today.getMonth())) {
      setBaseDate(new Date(leftYear, leftMonth - 1, 1));
    }
  };

  const handleDayClick = (y, m, d) => {
    const clicked = new Date(y, m, d);
    if (!start || (start && end)) {
      setStart(clicked); setEnd(null);
    } else {
      if (clicked.getTime() < start.getTime()) { setStart(clicked); setEnd(null); }
      else setEnd(clicked);
    }
  };

  const duration = (start && end) ? Math.round((end - start) / 86400000) : 0;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="dt-modal" onClick={e => e.stopPropagation()}>
        <div className="dt-header">
          <h2>Chọn ngày thuê</h2>
          <button className="dt-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="dt-body">
          <div className="dt-calendars">
            {renderCalendarMonth({ year: leftYear, month: leftMonth, label: 'left', start, end, hoverDate, selectMode: 'range', onDayClick: handleDayClick, onDayHover: d => { if (start && !end) setHoverDate(d); else setHoverDate(null); }, onPrev: handlePrevMonth, onNext: null })}
            {renderCalendarMonth({ year: rightYear, month: rightMonth, label: 'right', start, end, hoverDate, selectMode: 'range', onDayClick: handleDayClick, onDayHover: d => { if (start && !end) setHoverDate(d); else setHoverDate(null); }, onPrev: null, onNext: handleNextMonth })}
          </div>
        </div>
        <div className="dt-footer">
          <div className="dt-summary">
            <div className="dt-summary-text">
              {start ? formatShortDate(start) : 'Chọn ngày bắt đầu'} {end ? `→ ${formatShortDate(end)}` : ''}
            </div>
            <div className="dt-summary-duration">
              {duration > 0 ? <><span>{duration} ngày</span> thuê xe</> : 'Chọn ngày nhận và trả xe'}
            </div>
          </div>
          <button className="primary" disabled={!start || !end} onClick={() => onApply({ startDate: start, endDate: end })}>Áp dụng</button>
        </div>
      </div>
    </div>
  );
}

// --- BlockedDates Manager (dùng cho Chủ xe trong AddCarForm) ---
// ranges = [{start:'YYYY-MM-DD', end:'YYYY-MM-DD', note:''}]
function BlockedDatesManager({ blockedDates = [], onChange }) {
  const [baseDate, setBaseDate] = useState(() => {
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [pickStart, setPickStart] = useState(null);   // string YYYY-MM-DD
  const [hoverKey, setHoverKey] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [editTag, setEditTag] = useState('busy');
  const [popover, setPopover] = useState(null); // { idx, key }

  // Normalize legacy string[] → range[]
  const ranges = (() => {
    if (!blockedDates.length) return [];
    if (typeof blockedDates[0] === 'object' && blockedDates[0].start) return blockedDates;
    // convert old individual dates to single-day ranges
    return blockedDates.map(d => {
      const s = typeof d === 'string' ? d : d.date;
      return { start: s, end: s, note: typeof d === 'object' ? d.note : '' };
    });
  })();

  // Build a map: dateKey → range index
  const dateToRange = {};
  ranges.forEach((r, idx) => {
    let cur = new Date(r.start + 'T00:00:00');
    const last = new Date(r.end + 'T00:00:00');
    while (cur <= last) {
      dateToRange[toLocalKey(cur)] = idx;
      cur.setDate(cur.getDate() + 1);
    }
  });

  const blockedSet = new Set(Object.keys(dateToRange));

  const leftYear = baseDate.getFullYear();
  const leftMonth = baseDate.getMonth();
  const rightDate = new Date(leftYear, leftMonth + 1, 1);

  // Determine which keys would be in the prospective hover range
  const hoverBlockedSet = new Set();
  if (pickStart && hoverKey && hoverKey >= pickStart) {
    let c = new Date(pickStart + 'T00:00:00');
    const last = new Date(hoverKey + 'T00:00:00');
    while (c <= last) { hoverBlockedSet.add(toLocalKey(c)); c.setDate(c.getDate()+1); }
  }

  const handleDayClick = (y, m, d, key) => {
    if (blockedSet.has(key)) {
      // Show popover for this range
      const idx = dateToRange[key];
      setPopover({ idx, key });
      return;
    }
    if (!pickStart) {
      setPickStart(key);
    } else {
      if (key < pickStart) { setPickStart(key); return; }
      const newRange = { start: pickStart, end: key, note: '', tag: 'busy' };
      const newRanges = [...ranges, newRange];
      onChange(newRanges);
      setPickStart(null);
      setHoverKey(null);
      // Open note editor for the new range
      setEditingIdx(newRanges.length - 1);
      setEditNote('');
    }
  };

  const deleteRange = (idx) => {
    const next = ranges.filter((_, i) => i !== idx);
    onChange(next);
    setPopover(null);
  };

  const startEditNote = (idx) => {
    setEditingIdx(idx);
    setEditNote(ranges[idx].note || '');
    setEditTag(ranges[idx].tag || 'busy');
    setPopover(null);
  };

  const saveNote = () => {
    const next = ranges.map((r, i) => i === editingIdx ? { ...r, note: editNote, tag: editTag } : r);
    onChange(next);
    setEditingIdx(null);
  };

  const handleNextMonth = () => setBaseDate(new Date(leftYear, leftMonth + 1, 1));
  const handlePrevMonth = () => {
    const now = new Date();
    if (leftYear > now.getFullYear() || (leftYear === now.getFullYear() && leftMonth > now.getMonth()))
      setBaseDate(new Date(leftYear, leftMonth - 1, 1));
  };

  const totalDays = ranges.reduce((acc, r) => {
    const diff = Math.round((new Date(r.end + 'T00:00:00') - new Date(r.start + 'T00:00:00')) / 86400000) + 1;
    return acc + diff;
  }, 0);

  return (
    <div onClick={() => setPopover(null)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {pickStart ? (
          <span style={{ fontSize: 13, color: 'var(--m-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={14} /> Đã chọn từ <strong>{fmtRangeDate(pickStart)}</strong> — bấm ngày kết thúc hoặc
            <button type="button" onClick={() => setPickStart(null)} style={{ fontSize: 12, color: 'var(--m-red)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>hủy</button>
          </span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--m-mid)' }}>Bấm ngày bắt đầu → ngày kết thúc để chặn. <strong style={{ color: 'var(--m-dark)' }}>{ranges.length} đợt • {totalDays} ngày bận.</strong></span>
        )}
        {ranges.length > 0 && !pickStart && <button type="button" onClick={() => { onChange([]); }} style={{ fontSize: 12, color: 'var(--m-red)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Xóa tất cả</button>}
      </div>

      <div className="dt-calendars" style={{ border: '1px solid var(--m-border)', borderRadius: 8, padding: 16 }}>
        {renderCalendarMonth({ year: leftYear, month: leftMonth, label: 'left', blockedSet, hoverBlockedSet, dateToRange, ranges, pickStart, popover, onDayClick: handleDayClick, onDayHover: k => setHoverKey(k), onPopover: (idx, key, e) => { e.stopPropagation(); setPopover({ idx, key }); }, onPrev: handlePrevMonth, onNext: null, selectMode: 'blocked' })}
        {renderCalendarMonth({ year: rightDate.getFullYear(), month: rightDate.getMonth(), label: 'right', blockedSet, hoverBlockedSet, dateToRange, ranges, pickStart, popover, onDayClick: handleDayClick, onDayHover: k => setHoverKey(k), onPopover: (idx, key, e) => { e.stopPropagation(); setPopover({ idx, key }); }, onPrev: null, onNext: handleNextMonth, selectMode: 'blocked' })}
      </div>

      {/* Popover action bar (floating) */}
      {popover && (
        <div style={{ marginTop: 12, background: '#fff', border: '1.5px solid var(--m-border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} onClick={e => e.stopPropagation()}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--m-dark)' }}>
              {fmtRangeLabel(ranges[popover.idx] || {})}
            </div>
            <div style={{ fontSize: 12, color: 'var(--m-mid)', marginTop: 2 }}>
              <span style={{ color: ranges[popover.idx]?.tag === 'rented' ? '#3b82f6' : '#dc2626', fontWeight: 600, marginRight: 4 }}>
                [{ranges[popover.idx]?.tag === 'rented' ? 'Khách thuê' : 'Lịch bận'}]
              </span>
              {ranges[popover.idx]?.note}
            </div>
          </div>
          <button type="button" onClick={() => startEditNote(popover.idx)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid var(--m-border)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--m-dark)', fontWeight: 500 }}>
            <Edit3 size={13} /> Ghi chú
          </button>
          <button type="button" onClick={() => deleteRange(popover.idx)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', cursor: 'pointer', fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
            <Trash2 size={13} /> Xóa đợt
          </button>
        </div>
      )}

      {/* Inline note editor */}
      {editingIdx !== null && (
        <div style={{ marginTop: 12, background: 'var(--m-bg)', border: '1.5px solid var(--m-green)', borderRadius: 8, padding: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Edit3 size={15} style={{ color: 'var(--m-green)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--m-mid)', flexShrink: 0, fontWeight: 600 }}>
            {fmtRangeLabel(ranges[editingIdx] || {})}:
          </span>
          <select value={editTag} onChange={e => setEditTag(e.target.value)} style={{ height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid var(--m-border)', fontSize: 13, outline: 'none', background: '#fff' }}>
            <option value="busy">Lịch bận</option>
            <option value="rented">Khách thuê</option>
          </select>
          <input autoFocus type="text" value={editNote} onChange={e => setEditNote(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveNote(); if (e.key === 'Escape') setEditingIdx(null); }}
            placeholder="Ghi chú (vd: Khách đặt, Bảo dưỡng...)"
            style={{ flex: 1, minWidth: 200, height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--m-border)', fontSize: 13, outline: 'none' }} />
          <button type="button" onClick={saveNote} style={{ padding: '6px 14px', background: 'var(--m-green)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Lưu</button>
          <button type="button" onClick={() => setEditingIdx(null)} style={{ padding: '6px 10px', background: 'none', color: 'var(--m-mid)', border: '1px solid var(--m-border)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Hủy</button>
        </div>
      )}

      {/* Range list summary */}
      {ranges.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ranges.map((r, idx) => {
            const isRented = r.tag === 'rented';
            const color = isRented ? '#3b82f6' : '#dc2626';
            const bg = isRented ? 'rgba(59,130,246,0.05)' : 'rgba(220,38,38,0.05)';
            const border = isRented ? 'rgba(59,130,246,0.14)' : 'rgba(220,38,38,0.14)';
            return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--m-mid)', padding: '5px 10px', background: bg, borderRadius: 7, border: `1px solid ${border}` }}>
              <span style={{ width: 8, height: 8, background: color, borderRadius: '50%', flexShrink: 0 }} />
              <span style={{ color: color, fontWeight: 600, flexShrink: 0 }}>{fmtRangeLabel(r)}</span>
              <span style={{ flex: 1, color: 'var(--m-mid)' }}>{r.note || <em style={{ opacity: 0.5 }}>Chưa có ghi chú</em>}</span>
              <button type="button" onClick={() => startEditNote(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--m-mid)', padding: '2px 4px', borderRadius: 4 }} title="Sửa ghi chú"><Edit3 size={12} /></button>
              <button type="button" onClick={() => deleteRange(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px 4px', borderRadius: 4 }} title="Xóa đợt này"><Trash2 size={12} /></button>
            </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12, color: 'var(--m-mid)' }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(59,130,246,0.82)', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }}></span>Khách thuê</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(220,38,38,0.82)', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }}></span>Lịch bận</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(52,199,89,0.15)', border: '1.5px solid var(--m-green)', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }}></span>Còn trống</span>
      </div>
    </div>
  );
}

function MapModal({ location, onClose }) {
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <div>
            <h2>Vị trí nhận xe</h2>
            <p>{location}</p>
          </div>
          <button className="modal-close inline-close" onClick={onClose} aria-label="Đóng">
            <X size={17} />
          </button>
        </div>
        <iframe title={`Google Map ${location}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        <a className="primary map-open" href={openUrl} target="_blank" rel="noreferrer">Mở Google Maps</a>
      </section>
    </div>
  );
}

function InfoPanel({ title, items }) {
  return (
    <div className="info-panel">
      <h3>{title}</h3>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "Chưa có"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AddCarForm({ editingCar, onSave, onCancel }) {
  const [form, setForm] = useState(() => editingCar ? normalizeCarForm(editingCar) : clone(emptyForm));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [packageType, setPackageType] = useState(editingCar?.status?.isVerified ? "premium" : "basic");
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    setForm(editingCar ? normalizeCarForm(editingCar) : clone(emptyForm));
    setPackageType(editingCar?.status?.isVerified ? "premium" : "basic");
    setErrors({});
  }, [editingCar]);

  const setPathValue = (path, value) => {
    setForm((current) => {
      let updated = setAtPath(current, path, value);
      if (path === "basicInfo.brand") {
        updated = setAtPath(updated, "basicInfo.model", ""); // reset model khi đổi brand
      }
      return updated;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    
    // Tự động tạo tên xe cho gói cơ bản vì gói này không có trường nhập tên
    const finalForm = { ...form };
    if (packageType === 'basic' && !finalForm.basicInfo.name) {
      finalForm.basicInfo = { 
        ...finalForm.basicInfo, 
        name: `${finalForm.basicInfo.brand || ''} ${finalForm.basicInfo.model || ''} ${finalForm.basicInfo.year || ''}`.trim() 
      };
    }

    const validation = validateCar(finalForm, packageType);
    setErrors(validation);
    if (Object.keys(validation).length) {
      alert("Vui lòng điền đủ thông tin bắt buộc!");
      return;
    }
    setSaving(true);
    await delay(450);
    onSave({
      ...finalForm,
      status: {
        ...finalForm.status,
        isVerified: packageType === "premium"
      },
      id: editingCar?.id || finalForm.id,
      createdAt: editingCar?.createdAt || today(),
      updatedAt: today()
    });
    setSaving(false);
  };

  const disableForm = packageType === 'premium' && !editingCar?.status?.isVerified;

  return (
    <main className="content">
      <form className="form-layout" onSubmit={submit}>
        <ModuleFrame className="form-header">
          <div>
            <h2>{editingCar ? "Chỉnh sửa thông tin xe" : "Thêm xe mới"}</h2>
            <p>Chọn gói đăng phù hợp với nhu cầu của bạn.</p>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary" onClick={onCancel}>Hủy</button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? <RefreshCcw className="spin" size={16} /> : <Save size={16} />}
              {saving ? "Đang lưu..." : "Lưu xe"}
            </button>
          </div>
        </ModuleFrame>

        <div className="package-selector" style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div
            className={`pkg-card ${packageType === 'basic' ? 'active' : ''}`}
            onClick={() => setPackageType('basic')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <h3>Gói Cơ Bản</h3>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--m-green)', background: 'var(--m-green-light)', padding: '2px 8px', borderRadius: 20 }}>MIỄN PHÍ</span>
            </div>
            <p>Đăng nhanh chỉ 5 trường. Thích hợp cho ai muốn liệt kê xe nhanh.</p>
          </div>
          <div
            className={`pkg-card premium-pkg ${packageType === 'premium' ? 'active' : ''}`}
            onClick={() => setPackageType('premium')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <h3>Gói Tích Xanh</h3>
              <BadgeCheck size={18} fill="var(--m-green)" color="#fff" />
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--m-green)', padding: '2px 8px', borderRadius: 20 }}>TRẢ PHÍ</span>
            </div>
            <p>Đầy đủ thông số kỹ thuật, giới hạn Km, tích xanh xác nhận. Thu hút khách hàng gấp 3 lần.</p>
            {editingCar?.status?.isVerified ? (
              <div style={{ marginTop: 16, padding: '12px', background: '#fff', borderRadius: 8, border: '1px solid var(--m-green)' }}>
                <div style={{ color: 'var(--m-green)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Đã kích hoạt Gói Tích Xanh</div>
                <div style={{ fontSize: 13, color: 'var(--m-mid)' }}>Gói: {editingCar.status.verifiedPlan || 'Vĩnh viễn'} • Hết hạn: {editingCar.status.verifiedExpiry || 'Không thời hạn'}</div>
              </div>
            ) : packageType === 'premium' && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                {[
                  { id: '1m', label: '1 Tháng - 39K', title: 'Gói 1 Tháng', price: '39.000đ' },
                  { id: '3m', label: '3 Tháng - 99K', title: 'Gói 3 Tháng', price: '99.000đ' },
                  { id: 'forever', label: 'Vĩnh viễn - 199K', title: 'Gói Vĩnh Viễn', price: '199.000đ' }
                ].map(plan => (
                  <button 
                    key={plan.id}
                    type="button" 
                    className={selectedPlan?.id === plan.id ? "primary" : "secondary"} 
                    style={{ 
                      flex: 1, 
                      padding: '8px 0', 
                      fontSize: 13, 
                      borderColor: 'var(--m-green)', 
                      color: selectedPlan?.id === plan.id ? '#fff' : 'var(--m-green)',
                      background: selectedPlan?.id === plan.id ? 'var(--m-green)' : '#fff'
                    }} 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedPlan(plan); 
                    }}
                  >
                    {plan.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ pointerEvents: disableForm ? 'none' : 'auto', opacity: disableForm ? 0.6 : 1 }}>
        {getFieldGroups(form, packageType).map((group) => (
          <ModuleFrame key={group.module} className="form-section">
            <div className="section-title">
              <h3>{group.title}</h3>
              <p>{group.description}</p>
            </div>
            <div className="fields-grid">
              {group.fields.map(([path, label, type, required, options]) => {
                // Replace pickup location with the province+district picker
                if (path === 'rentalInfo.pickupLocation') {
                  return (
                    <LocationPicker
                      key={path}
                      label={label}
                      value={form.rentalInfo.pickupLocation}
                      required={required}
                      error={errors[path]}
                      onChange={(v) => setPathValue(path, v)}
                    />
                  );
                }
                if (type === 'toggle_number') {
                  const parts = path.split('.');
                  const isChecked = form[parts[0]]?.[parts[1]] != null;
                  return (
                    <div key={path}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--m-dark)', marginBottom: 6, fontWeight: 600 }}>
                        <input type="checkbox" checked={isChecked} onChange={(e) => {
                          if (e.target.checked) setPathValue(path, 0);
                          else {
                            const clone = { ...form };
                            delete clone[parts[0]][parts[1]];
                            setPathValue(parts[0], clone[parts[0]]);
                          }
                        }} style={{ width: 16, height: 16, accentColor: 'var(--m-green)' }} />
                        {label}
                      </label>
                      {isChecked && (
                         <input type="text" value={fmtNum(getAtPath(form, path)) ?? ""} onChange={e => {
                            const raw = e.target.value.replace(/\./g, '');
                            if (raw === '' || !isNaN(raw)) setPathValue(path, raw === '' ? '' : Number(raw));
                         }} style={{ width: '100%', height: 40, padding: '0 10px', borderRadius: 8, border: '1.5px solid var(--m-border)', fontSize: 14, outline: 'none' }} />
                      )}
                    </div>
                  );
                }
                return (
                  <Field
                    key={path}
                    path={path}
                    label={label}
                    type={type}
                    required={required}
                    options={options}
                    value={getAtPath(form, path)}
                    error={errors[path]}
                    onChange={(value) => {
                      setPathValue(path, value);
                      if (path === 'technicalInfo.fuel' && value === 'Điện') {
                        setPathValue('technicalInfo.engine', 'Điện');
                        setPathValue('technicalInfo.fuelConsumption', 'Điện');
                      }
                    }}
                  />
                );
              })}
              {group.module === "Module_RentalInfoSection" && (
                <>
                  <DepositField
                    depositType={form.depositType || 'cash'}
                    depositAmount={form.depositAmount != null ? form.depositAmount : 15000000}
                    onChange={(type, amount) => {
                      setPathValue('depositType', type);
                      setPathValue('depositAmount', amount);
                    }}
                  />
                  <div className="toggle-group">
                    <Toggle label="Hỗ trợ giao xe" checked={form.rentalInfo.deliverySupport} onChange={(v) => setPathValue('rentalInfo.deliverySupport', v)} />
                  </div>
                </>
              )}
            </div>
          </ModuleFrame>
        ))}

        <ModuleFrame className="form-section">
          <div className="section-title">
            <h3>Mô tả & Tiện nghi</h3>
            <p>Mô tả xe và các tiện nghi khách muốn biết.</p>
          </div>
          <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--m-dark)', display: 'block', marginBottom: 8 }}>Mô tả xe</label>
          <textarea
            value={form.descriptions.detail || ''}
            onChange={e => setPathValue('descriptions.detail', e.target.value)}
            placeholder="Mô tả chi tiết về xe..."
            style={{ width: '100%', minHeight: 100, padding: '10px 12px', border: '1.5px solid var(--m-border)', borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', marginBottom: 16 }}
          />
          <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--m-dark)', display: 'block', marginBottom: 8 }}>Tiện nghi</label>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: 'var(--m-green)', fontWeight: 600, userSelect: 'none' }}>
              <input type="checkbox" checked={form.descriptions.amenities?.length === AMENITY_OPTIONS.length} onChange={(e) => {
                if (e.target.checked) setPathValue('descriptions.amenities', [...AMENITY_OPTIONS]);
                else setPathValue('descriptions.amenities', []);
              }} style={{ width: 16, height: 16, accentColor: 'var(--m-green)', cursor: 'pointer' }} />
              Chọn tất cả
            </label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AMENITY_OPTIONS.map(opt => {
              const checked = Array.isArray(form.descriptions.amenities) && form.descriptions.amenities.includes(opt);
              return (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: 'var(--m-dark)', userSelect: 'none' }}>
                  <input type="checkbox" checked={checked} onChange={() => {
                    const cur = Array.isArray(form.descriptions.amenities) ? form.descriptions.amenities : [];
                    setPathValue('descriptions.amenities', checked ? cur.filter(x => x !== opt) : [...cur, opt]);
                  }} style={{ width: 16, height: 16, accentColor: 'var(--m-green)', cursor: 'pointer' }} />
                  {opt}
                </label>
              );
            })}
          </div>
        </ModuleFrame>
        {/* Quản lý ngày bận cho xe */}
        {packageType === 'premium' && (
          <ModuleFrame className="form-section">
            <div className="section-title">
              <h3>📅 Lịch xe</h3>
              <p>Đánh dấu các ngày xe không cho thuê (đã đặt, bảo dưỡng, cá nhân...). Tính năng đặc quyền cho Gói Tích Xanh.</p>
            </div>
            <BlockedDatesManager
              blockedDates={form.rentalInfo.blockedDates || []}
              onChange={(dates) => setPathValue("rentalInfo.blockedDates", dates)}
            />
          </ModuleFrame>
        )}

        {packageType !== 'premium' && (
          <ImageUploadOptimizer images={form.images} onChange={(images) => setPathValue("images", images)} />
        )}
        {packageType === 'premium' && (
          <ModuleFrame className="upload-section">
            <div className="section-title" style={{ opacity: 0.5 }}>
              <h3>Hình ảnh xe</h3>
              <p>Chỉ hiển thị, không thể chỉnh sửa ảnh ở Gói Tích Xanh.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', pointerEvents: 'none', opacity: 0.6 }}>
              {form.images.map((img, i) => (
                <img key={i} src={img.url} alt={img.name} style={{ width: 90, height: 65, objectFit: 'cover', borderRadius: 8 }} />
              ))}
              {form.images.length === 0 && <span style={{ color: 'var(--m-subtle)', fontSize: 13 }}>Không có ảnh nào.</span>}
            </div>
          </ModuleFrame>
        )}
        
        </div>
      </form>
      {selectedPlan && (
        <UpgradeModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}
    </main>
  );
}

function ImageUploadOptimizer({ images, onChange }) {
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const accepted = Array.from(files).filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type));
    if (!accepted.length) return;
    setProcessing(true);
    try {
      const optimized = [];
      for (const file of accepted) {
        optimized.push(await optimizeImage(file));
      }
      onChange([...images, ...optimized]);
    } catch (err) {
      alert("Không thể xử lý ảnh này, vui lòng thử ảnh khác.");
      console.error(err);
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <ModuleFrame className="upload-section">
      <div className="section-title">
        <h3>Hình ảnh xe</h3>
        <p>Thêm hình ảnh xe ngoại thất và nội thất</p>
      </div>
      <div
        className="dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
        {processing ? <RefreshCcw className="spin" size={28} strokeWidth={1.8} /> : <Upload size={28} strokeWidth={1.8} />}
        <strong>{processing ? "Đang tối ưu ảnh..." : "Kéo thả hoặc nhấn để chọn ảnh"}</strong>
        <span>Hỗ trợ JPG, PNG, WebP · Ảnh đầu tiên là ảnh đại diện</span>
      </div>
      <div className="image-list">
        {images.map((img, idx) => (
          <div className="thumb" key={`${img.url}-${idx}`}>
            <img src={img.url} alt={img.name || `Ảnh xe ${idx + 1}`} />
            <div>
              <strong>{idx === 0 ? "Ảnh đại diện" : img.role || "Ảnh xe"}</strong>
              <span>{img.name}</span>
            </div>
            <button type="button" className="icon-button" onClick={() => onChange(images.filter((_, i) => i !== idx))}>
              <X size={15} />
            </button>
          </div>
        ))}
        {!images.length && (
          <div className="no-images">
            <ImagePlus size={20} strokeWidth={1.8} />
            Chưa có ảnh xe nào.
          </div>
        )}
      </div>
    </ModuleFrame>
  );
}

/* ─── Reusable Components ─── */

function ModuleFrame({ className = "", children, ...props }) {
  // Đã bỏ admin-outline và module-label
  return (
    <section className={`module-frame ${className}`} {...props}>
      {children}
    </section>
  );
}

function StatusBadge({ status }) {
  const label = status === "available" ? "Xe trống" : "Xe bận";
  return (
    <ModuleFrame className={`status-badge ${status}`}>
      <BadgeCheck size={12} />
      {label}
    </ModuleFrame>
  );
}

function Field({ path, label, type = "text", required, options, value, error, onChange, readOnly }) {
  const inputId = path.replaceAll(".", "-");
  return (
    <label className={`${type === "textarea" ? "wide-field" : ""} ${readOnly ? "field-readonly" : ""}`} htmlFor={inputId}>
      <span>{label}{required ? " *" : ""}</span>
      {type === "select" ? (
        <select id={inputId} value={value ?? ""} onChange={(e) => onChange(e.target.value)} disabled={readOnly}>
          <option value="">Chọn</option>
          {options?.map((opt) => Array.isArray(opt)
            ? <option key={opt[0]} value={opt[0]}>{opt[1]}</option>
            : <option key={opt} value={opt}>{opt}</option>
          )}
        </select>
      ) : type === "textarea" ? (
        <textarea id={inputId} value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} readOnly={readOnly} />
      ) : type === "number" ? (
        <input id={inputId} type="text" value={fmtNum(value) ?? ""} onChange={(e) => {
          const raw = e.target.value.replace(/\./g, '');
          if (raw === '' || !isNaN(raw)) onChange(raw);
        }} readOnly={readOnly} />
      ) : (
        <input id={inputId} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} />
      )}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: disabled ? 'default' : 'pointer', fontSize: 14, color: 'var(--m-dark)', userSelect: 'none', opacity: disabled ? 0.6 : 1, padding: '10px 0' }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--m-green)', cursor: disabled ? 'default' : 'pointer' }} />
      {label}
    </label>
  );
}

function LocationPicker({ label, value, required, error, onChange }) {
  const [province, setProvince] = useState(() => {
    if (!value) return '';
    for (const p of locationProvinces) {
      if (value === p || value.endsWith(`, ${p}`)) return p;
    }
    return value;
  });
  const [district, setDistrict] = useState(() => {
    if (!value) return '';
    const parts = value.split(', ');
    if (parts.length >= 2) return parts[0];
    return '';
  });

  const districts = provinceDistricts[province] || [];

  const handleProvince = (p) => {
    setProvince(p);
    setDistrict('');
    onChange(p);
  };
  const handleDistrict = (d) => {
    setDistrict(d);
    onChange(d ? `${d}, ${province}` : province);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: 'span 2' }}>
      <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--m-dark)', display: 'flex', alignItems: 'center' }}>
        {label}{required && <span style={{ color: '#000', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={province} onChange={e => handleProvince(e.target.value)} style={{ flex: 1, height: 40, padding: '0 10px', borderRadius: 8, border: `1.5px solid ${error ? 'var(--m-red)' : 'var(--m-border)'}`, fontSize: 14, outline: 'none', background: '#fff' }}>
          <option value="">Chọn tỉnh/thành</option>
          {locationProvinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {districts.length > 0 && (
          <select value={district} onChange={e => handleDistrict(e.target.value)} style={{ flex: 1, height: 40, padding: '0 10px', borderRadius: 8, border: '1.5px solid var(--m-border)', fontSize: 14, outline: 'none', background: '#fff' }}>
            <option value="">Chọn quận/huyện</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>
      {error && <small style={{ color: 'var(--m-red)', fontSize: 12 }}>{error}</small>}
    </div>
  );
}

function DepositField({ depositType, depositAmount, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, gridColumn: 'span 2' }}>
      <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--m-dark)' }}>Tiền cọc</label>
      <div style={{ display: 'flex', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: depositType === 'cash' ? 'var(--m-dark)' : 'var(--m-mid)', fontWeight: depositType === 'cash' ? 600 : 400 }}>
          <input type="checkbox" checked={depositType === 'cash'} onChange={() => onChange('cash', depositAmount)} style={{ width: 16, height: 16, accentColor: 'var(--m-green)', cursor: 'pointer' }} />
          Tiền mặt
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: depositType === 'motorbike' ? 'var(--m-dark)' : 'var(--m-mid)', fontWeight: depositType === 'motorbike' ? 600 : 400 }}>
          <input type="checkbox" checked={depositType === 'motorbike'} onChange={() => onChange('motorbike', 15000000)} style={{ width: 16, height: 16, accentColor: 'var(--m-green)', cursor: 'pointer' }} />
          Xe máy thế chấp
        </label>
      </div>
      {depositType === 'cash' ? (
        <input
          type="text"
          value={fmtNum(depositAmount) ?? ""}
          onChange={e => {
             const raw = e.target.value.replace(/\./g, '');
             if (raw === '' || !isNaN(raw)) onChange('cash', Number(raw));
          }}
          placeholder="15.000.000"
          style={{ height: 40, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--m-border)', fontSize: 14, outline: 'none' }}
        />
      ) : (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--m-bg)', fontSize: 14, color: 'var(--m-mid)', border: '1.5px solid var(--m-border)' }}>
          Xe máy – giá trị tương đương {(15000000).toLocaleString('vi-VN')}đ
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Tất cả</option>
        {options.map((opt) => Array.isArray(opt)
          ? <option key={opt[0]} value={opt[0]}>{opt[1]}</option>
          : <option key={opt} value={opt}>{opt}</option>
        )}
      </select>
    </label>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`stat stat-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* ─── Utility Functions ─── */

const getCarWeight = (car) => {
  if (!car.status.isVerified) return 0;
  const pkg = car.status.package || 'basic';
  if (pkg === '1_year') return 4;
  if (pkg === '3_months') return 3;
  if (pkg === '1_month') return 2;
  return 1;
};

const sorters = {
  newest: (a, b) => getCarWeight(b) - getCarWeight(a) || new Date(b.createdAt) - new Date(a.createdAt),
  priceAsc: (a, b) => getCarWeight(b) - getCarWeight(a) || a.rentalInfo.dayPrice - b.rentalInfo.dayPrice,
  priceDesc: (a, b) => getCarWeight(b) - getCarWeight(a) || b.rentalInfo.dayPrice - a.rentalInfo.dayPrice,
  yearDesc: (a, b) => getCarWeight(b) - getCarWeight(a) || b.basicInfo.year - a.basicInfo.year,
  seatsDesc: (a, b) => getCarWeight(b) - getCarWeight(a) || b.basicInfo.seats - a.basicInfo.seats,
  available: (a, b) => getCarWeight(b) - getCarWeight(a) || Number(b.rentalInfo.status === "available") - Number(a.rentalInfo.status === "available"),
  popular: (a, b) => getCarWeight(b) - getCarWeight(a) || b.status.popularity - a.status.popularity
};

function inferSmartFilters(query) {
  const text = normalize(query);
  const inferred = {};
  const seats = text.match(/(\d+)\s*cho/);
  const price = text.match(/duoi\s*(\d+(?:[.,]\d+)?)\s*(trieu|k|nghin|ngan)?/);
  if (seats) inferred.seats = seats[1];
  if (text.includes("tu dong")) inferred.transmission = "Số tự động";
  if (text.includes("so san")) inferred.transmission = "Số sàn";
  if (text.includes("suv")) inferred.vehicleType = "SUV";
  if (text.includes("sedan")) inferred.vehicleType = "Sedan";
  if (text.includes("xang")) inferred.fuel = "Xăng";
  if (text.includes("diesel")) inferred.fuel = "Diesel";
  if (text.includes("hybrid")) inferred.fuel = "Hybrid";
  if (text.includes("con trong") || text.includes("ranh")) inferred.status = "available";
  if (text.includes("bao duong")) inferred.status = "maintenance";
  if (text.includes("ha noi")) inferred.location = "Hà Nội";
  if (text.includes("tp hcm") || text.includes("sai gon")) inferred.location = "TP.HCM";
  if (text.includes("co tai xe")) inferred.driver = "true";
  if (text.includes("tu lai")) inferred.driver = "false";
  if (price) {
    const number = Number(price[1].replace(",", "."));
    inferred.maxPrice = price[2] === "trieu" ? number * 1000000 : number * 1000;
  }
  return inferred;
}

function activeChips(filters, query) {
  const labels = {
    brand: "Hãng",
    seats: "Số chỗ",
    vehicleType: "Loại xe",
    transmission: "Hộp số",
    fuel: "Nhiên liệu",
    status: "Trạng thái",
    location: "Địa điểm",
    maxPrice: "Giá tối đa",
    driver: "Tài xế"
  };
  const chips = Object.entries(filters)
    .filter(([, v]) => v !== "")
    .map(([key, value]) => ({
      key,
      label: key === "maxPrice" ? `Dưới ${formatCurrency(value)}/ngày` : `${labels[key]}: ${statusText(value)}`
    }));
  if (query) chips.unshift({ key: "query", label: query });
  return chips;
}

function validateCar(form, packageType = "full") {
  const errors = {};
  const year = Number(form.basicInfo.year);
  if (!form.basicInfo.name) errors["basicInfo.name"] = "Vui lòng nhập tên xe.";
  if (!form.basicInfo.brand) errors["basicInfo.brand"] = "Vui lòng chọn hãng xe.";
  if (!form.basicInfo.model) errors["basicInfo.model"] = "Vui lòng chọn dòng xe.";
  if (!form.basicInfo.plate) errors["basicInfo.plate"] = "Biển số không được để trống.";
  if (!year || year > new Date().getFullYear() || year < 1990) errors["basicInfo.year"] = "Năm sản xuất phải hợp lệ.";
  if (!Number(form.basicInfo.seats)) errors["basicInfo.seats"] = "Số chỗ phải là số hợp lệ.";
  
  if (packageType !== "basic") {
    if (!form.technicalInfo.fuel) errors["technicalInfo.fuel"] = "Chọn loại nhiên liệu.";
    if (!form.technicalInfo.transmission) errors["technicalInfo.transmission"] = "Chọn hộp số.";
  }
  
  if (!Number(form.rentalInfo.dayPrice)) errors["rentalInfo.dayPrice"] = "Giá thuê ngày phải là số hợp lệ.";
  if (!form.rentalInfo.pickupLocation) errors["rentalInfo.pickupLocation"] = "Vui lòng nhập địa điểm nhận xe.";
  if (!form.ownerInfo?.name) errors["ownerInfo.name"] = "Vui lòng nhập tên chủ xe.";
  if (!phoneDigits(form.ownerInfo?.phone).match(/^0?\d{9,11}$/)) errors["ownerInfo.phone"] = "SĐT chủ xe chưa hợp lệ.";
  return errors;
}

function getOwnerInfo(car) {
  return {
    name: car.ownerInfo?.name || "Anh Minh - Chủ xe",
    phone: car.ownerInfo?.phone || "090 123 4567",
    zaloPhone: car.ownerInfo?.zaloPhone || car.ownerInfo?.phone || "0901234567"
  };
}

function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

async function optimizeImage(file) {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/webp'
  };
  
  let compressedFile = file;
  try {
    compressedFile = await imageCompression(file, options);
  } catch (error) {
    console.error("Lỗi nén ảnh, sử dụng ảnh gốc:", error);
  }

  // Thử tải lên Firebase Storage
  try {
    const storagePath = `images/${Date.now()}_${compressedFile.name}`;
    const downloadUrl = await uploadFile(compressedFile, storagePath);
    return {
      name: compressedFile.name,
      role: "Ảnh xe",
      url: downloadUrl,
      originalSize: file.size,
      optimizedSize: compressedFile.size
    };
  } catch (storageError) {
    console.warn("Lỗi tải lên Storage, chuyển sang lưu Base64 Data URL dự phòng:", storageError);
    const url = await blobToDataUrl(compressedFile);
    return {
      name: compressedFile.name,
      role: "Ảnh xe",
      url,
      originalSize: file.size,
      optimizedSize: compressedFile.size
    };
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function getAtPath(obj, path) {
  return path.split(".").reduce((v, k) => v?.[k], obj);
}

function setAtPath(obj, path, value) {
  const copy = clone(obj);
  const parts = path.split(".");
  let pointer = copy;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!pointer[parts[i]]) pointer[parts[i]] = {};
    pointer = pointer[parts[i]];
  }
  pointer[parts.at(-1)] = value;
  return copy;
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function normalizeCarForm(car) {
  return {
    ...clone(emptyForm),
    ...clone(car),
    basicInfo: { ...emptyForm.basicInfo, ...clone(car.basicInfo || {}) },
    technicalInfo: { ...emptyForm.technicalInfo, ...clone(car.technicalInfo || {}) },
    rentalInfo: { ...emptyForm.rentalInfo, ...clone(car.rentalInfo || {}) },
    documents: { ...emptyForm.documents, ...clone(car.documents || {}) },
    descriptions: { ...emptyForm.descriptions, ...clone(car.descriptions || {}) },
    ownerInfo: { ...emptyForm.ownerInfo, ...clone(car.ownerInfo || {}) },
    status: { ...emptyForm.status, ...clone(car.status || {}) },
    images: clone(car.images || [])
  };
}

function normalize(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function formatCurrency(value) {
  if (!value && value !== 0) return '';
  const n = Number(value);
  if (!n) return '';
  return n.toLocaleString('vi-VN') + 'đ';
}
function fmtNum(value) {
  const n = Number(value);
  if (!n && n !== 0) return '';
  return n.toLocaleString('vi-VN');
}

function statusText(value) {
  return {
    available: "Còn trống",
    rented: "Đang thuê",
    maintenance: "Bảo dưỡng",
    hidden: "Tạm ẩn",
    true: "Có tài xế",
    false: "Tự lái"
  }[value] || value;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default App;
