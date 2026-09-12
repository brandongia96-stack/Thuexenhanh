// Hãng xe + dòng xe. Bê nguyên từ v0.1 (`Web thue xe/src/App.jsx` dòng 41–68).
// Đây là dữ liệu tĩnh, không phải dữ liệu giả — không vi phạm luật trung thực.
// Nguồn thật về sau: bảng `brands` / `models` trong Postgres.

export const CAR_MODELS = {
  Toyota: ['Vios', 'Innova', 'Innova Cross', 'Camry', 'Fortuner', 'Corolla Altis', 'Corolla Cross', 'Yaris', 'Yaris Cross', 'Raize', 'Hilux', 'Land Cruiser', 'Land Cruiser Prado', 'Alphard', 'Avanza Premio', 'Veloz Cross'],
  Hyundai: ['Grand i10', 'Accent', 'Elantra', 'Creta', 'Tucson', 'Santa Fe', 'Palisade', 'Stargazer', 'Custin', 'Ioniq 5', 'Venue', 'Kona', 'Solati'],
  Kia: ['Morning', 'Soluto', 'K3', 'K5', 'Sonet', 'Seltos', 'Sportage', 'Sorento', 'Carnival', 'Carens', 'Cerato', 'Sedona'],
  Mazda: ['Mazda 2', 'Mazda 3', 'Mazda 6', 'CX-3', 'CX-30', 'CX-5', 'CX-8', 'BT-50'],
  Honda: ['Brio', 'City', 'Civic', 'Accord', 'HR-V', 'CR-V', 'BR-V'],
  Ford: ['Ranger', 'Everest', 'Explorer', 'Territory', 'Transit', 'EcoSport', 'Focus'],
  Mitsubishi: ['Attrage', 'Xpander', 'Xpander Cross', 'Outlander', 'Pajero Sport', 'Triton'],
  VinFast: ['Fadil', 'VF 3', 'VF 5', 'VF e34', 'VF 6', 'VF 7', 'VF 8', 'VF 9', 'Lux A2.0', 'Lux SA2.0', 'President'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'Maybach', 'G-Class', 'V-Class', 'EQB', 'EQE', 'EQS'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i4', 'i7', 'iX3'],
  Audi: ['A3', 'A4', 'A6', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
  Lexus: ['ES', 'LS', 'NX', 'RX', 'GX', 'LX', 'LM', 'IS'],
  Volvo: ['XC40', 'XC60', 'XC90', 'S90', 'V60'],
  Porsche: ['Macan', 'Cayenne', 'Panamera', 'Taycan', '911'],
  Peugeot: ['2008', '3008', '5008', '408', 'Traveller'],
  Subaru: ['Forester', 'Outback', 'BRZ', 'WRX'],
  Nissan: ['Almera', 'Kicks', 'Navara', 'Terra'],
  Suzuki: ['Swift', 'Ertiga', 'XL7', 'Jimny', 'Ciaz', 'Blind Van'],
  Isuzu: ['D-Max', 'mu-X'],
  MG: ['MG5', 'ZS', 'HS', 'RX5'],
  Skoda: ['Karoq', 'Kodiaq'],
  Haval: ['H6'],
  Wuling: ['HongGuang MiniEV'],
  BYD: ['Atto 3', 'Dolphin', 'Seal'],
  Chevrolet: ['Colorado', 'Trailblazer', 'Cruze', 'Spark'],
  Volkswagen: ['Teramont', 'Tiguan', 'Touareg', 'Virtus', 'T-Cross'],
}

export const BRANDS = Object.keys(CAR_MODELS)

export function modelsOf(brand) {
  return CAR_MODELS[brand] ?? []
}
