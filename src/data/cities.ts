export type CityData = {
  name: string;
  country: string; // ISO 3166-1 alpha-2
  region: "sea" | "europe" | "east_asia";
  lat: number;
  lng: number;
  nearbyAirports: { code: string; name: string; distanceKm: number; travelTimeHours: number }[];
};

export const cities: CityData[] = [
  // ── Southeast Asia ────────────────────────────────────────────
  {
    name: "Bangkok",
    country: "TH",
    region: "sea",
    lat: 13.7563,
    lng: 100.5018,
    nearbyAirports: [
      { code: "BKK", name: "Suvarnabhumi Airport", distanceKm: 30, travelTimeHours: 0.75 },
      { code: "DMK", name: "Don Mueang Airport", distanceKm: 24, travelTimeHours: 0.7 },
    ],
  },
  {
    name: "Ho Chi Minh City",
    country: "VN",
    region: "sea",
    lat: 10.8231,
    lng: 106.6297,
    nearbyAirports: [
      { code: "SGN", name: "Tan Son Nhat Airport", distanceKm: 8, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Hanoi",
    country: "VN",
    region: "sea",
    lat: 21.0285,
    lng: 105.8542,
    nearbyAirports: [
      { code: "HAN", name: "Noi Bai Airport", distanceKm: 25, travelTimeHours: 0.6 },
    ],
  },
  {
    name: "Da Lat",
    country: "VN",
    region: "sea",
    lat: 11.9404,
    lng: 108.4583,
    nearbyAirports: [
      { code: "DLI", name: "Lien Khuong Airport", distanceKm: 30, travelTimeHours: 0.7 },
    ],
  },
  {
    name: "Chiang Mai",
    country: "TH",
    region: "sea",
    lat: 18.7883,
    lng: 98.9853,
    nearbyAirports: [
      { code: "CNX", name: "Chiang Mai Airport", distanceKm: 4, travelTimeHours: 0.2 },
    ],
  },
  {
    name: "Bali",
    country: "ID",
    region: "sea",
    lat: -8.3405,
    lng: 115.092,
    nearbyAirports: [
      { code: "DPS", name: "Ngurah Rai Airport", distanceKm: 13, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Kuala Lumpur",
    country: "MY",
    region: "sea",
    lat: 3.139,
    lng: 101.6869,
    nearbyAirports: [
      { code: "KUL", name: "Kuala Lumpur International Airport", distanceKm: 50, travelTimeHours: 1.0 },
      { code: "SZB", name: "Sultan Abdul Aziz Shah Airport", distanceKm: 25, travelTimeHours: 0.5 },
    ],
  },
  {
    name: "Singapore",
    country: "SG",
    region: "sea",
    lat: 1.3521,
    lng: 103.8198,
    nearbyAirports: [
      { code: "SIN", name: "Changi Airport", distanceKm: 20, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Phnom Penh",
    country: "KH",
    region: "sea",
    lat: 11.5564,
    lng: 104.9282,
    nearbyAirports: [
      { code: "PNH", name: "Phnom Penh International Airport", distanceKm: 10, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Vientiane",
    country: "LA",
    region: "sea",
    lat: 17.9757,
    lng: 102.6331,
    nearbyAirports: [
      { code: "VTE", name: "Wattay International Airport", distanceKm: 4, travelTimeHours: 0.2 },
    ],
  },
  {
    name: "Koh Tao",
    country: "TH",
    region: "sea",
    lat: 10.0956,
    lng: 99.8374,
    nearbyAirports: [
      { code: "USM", name: "Samui Airport (ferry from Koh Tao)", distanceKm: 70, travelTimeHours: 2.5 },
    ],
  },
  {
    name: "Koh Samui",
    country: "TH",
    region: "sea",
    lat: 9.5120,
    lng: 100.0136,
    nearbyAirports: [
      { code: "USM", name: "Samui Airport", distanceKm: 5, travelTimeHours: 0.2 },
    ],
  },
  {
    name: "Phuket",
    country: "TH",
    region: "sea",
    lat: 7.8804,
    lng: 98.3923,
    nearbyAirports: [
      { code: "HKT", name: "Phuket International Airport", distanceKm: 32, travelTimeHours: 0.7 },
    ],
  },
  {
    name: "Yangon",
    country: "MM",
    region: "sea",
    lat: 16.8661,
    lng: 96.1951,
    nearbyAirports: [
      { code: "RGN", name: "Yangon International Airport", distanceKm: 15, travelTimeHours: 0.5 },
    ],
  },
  {
    name: "Manila",
    country: "PH",
    region: "sea",
    lat: 14.5995,
    lng: 120.9842,
    nearbyAirports: [
      { code: "MNL", name: "Ninoy Aquino International Airport", distanceKm: 12, travelTimeHours: 0.5 },
    ],
  },

  // ── East Asian hubs ───────────────────────────────────────────
  {
    name: "Seoul",
    country: "KR",
    region: "east_asia",
    lat: 37.5665,
    lng: 126.978,
    nearbyAirports: [
      { code: "ICN", name: "Incheon International Airport", distanceKm: 52, travelTimeHours: 1.1 },
      { code: "GMP", name: "Gimpo International Airport", distanceKm: 18, travelTimeHours: 0.5 },
    ],
  },
  {
    name: "Tokyo",
    country: "JP",
    region: "east_asia",
    lat: 35.6762,
    lng: 139.6503,
    nearbyAirports: [
      { code: "NRT", name: "Narita International Airport", distanceKm: 65, travelTimeHours: 1.3 },
      { code: "HND", name: "Haneda Airport", distanceKm: 15, travelTimeHours: 0.5 },
    ],
  },
  {
    name: "Taipei",
    country: "TW",
    region: "east_asia",
    lat: 25.033,
    lng: 121.5654,
    nearbyAirports: [
      { code: "TPE", name: "Taiwan Taoyuan International Airport", distanceKm: 40, travelTimeHours: 0.8 },
      { code: "TSA", name: "Taipei Songshan Airport", distanceKm: 5, travelTimeHours: 0.2 },
    ],
  },

  // ── European destinations ─────────────────────────────────────
  {
    name: "Paris",
    country: "FR",
    region: "europe",
    lat: 48.8566,
    lng: 2.3522,
    nearbyAirports: [
      { code: "CDG", name: "Charles de Gaulle Airport", distanceKm: 26, travelTimeHours: 0.6 },
      { code: "ORY", name: "Orly Airport", distanceKm: 14, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Amsterdam",
    country: "NL",
    region: "europe",
    lat: 52.3676,
    lng: 4.9041,
    nearbyAirports: [
      { code: "AMS", name: "Schiphol Airport", distanceKm: 15, travelTimeHours: 0.3 },
    ],
  },
  {
    name: "London",
    country: "GB",
    region: "europe",
    lat: 51.5074,
    lng: -0.1278,
    nearbyAirports: [
      { code: "LHR", name: "Heathrow Airport", distanceKm: 24, travelTimeHours: 0.6 },
      { code: "LGW", name: "Gatwick Airport", distanceKm: 47, travelTimeHours: 0.8 },
      { code: "STN", name: "Stansted Airport", distanceKm: 56, travelTimeHours: 1.0 },
    ],
  },
  {
    name: "Brussels",
    country: "BE",
    region: "europe",
    lat: 50.8503,
    lng: 4.3517,
    nearbyAirports: [
      { code: "BRU", name: "Brussels Airport", distanceKm: 12, travelTimeHours: 0.3 },
      { code: "CRL", name: "Brussels South Charleroi Airport", distanceKm: 55, travelTimeHours: 1.0 },
    ],
  },
  {
    name: "Lyon",
    country: "FR",
    region: "europe",
    lat: 45.764,
    lng: 4.8357,
    nearbyAirports: [
      { code: "LYS", name: "Lyon-Saint Exupery Airport", distanceKm: 25, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Berlin",
    country: "DE",
    region: "europe",
    lat: 52.52,
    lng: 13.405,
    nearbyAirports: [
      { code: "BER", name: "Berlin Brandenburg Airport", distanceKm: 22, travelTimeHours: 0.5 },
    ],
  },
  {
    name: "Warsaw",
    country: "PL",
    region: "europe",
    lat: 52.2297,
    lng: 21.0122,
    nearbyAirports: [
      { code: "WAW", name: "Warsaw Chopin Airport", distanceKm: 10, travelTimeHours: 0.3 },
      { code: "WMI", name: "Warsaw Modlin Airport", distanceKm: 40, travelTimeHours: 0.7 },
    ],
  },
  {
    name: "Budapest",
    country: "HU",
    region: "europe",
    lat: 47.4979,
    lng: 19.0402,
    nearbyAirports: [
      { code: "BUD", name: "Budapest Ferenc Liszt Airport", distanceKm: 16, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Prague",
    country: "CZ",
    region: "europe",
    lat: 50.0755,
    lng: 14.4378,
    nearbyAirports: [
      { code: "PRG", name: "Vaclav Havel Airport", distanceKm: 17, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Barcelona",
    country: "ES",
    region: "europe",
    lat: 41.3874,
    lng: 2.1686,
    nearbyAirports: [
      { code: "BCN", name: "Barcelona-El Prat Airport", distanceKm: 13, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Madrid",
    country: "ES",
    region: "europe",
    lat: 40.4168,
    lng: -3.7038,
    nearbyAirports: [
      { code: "MAD", name: "Adolfo Suarez Madrid-Barajas Airport", distanceKm: 13, travelTimeHours: 0.3 },
    ],
  },
  {
    name: "Lisbon",
    country: "PT",
    region: "europe",
    lat: 38.7223,
    lng: -9.1393,
    nearbyAirports: [
      { code: "LIS", name: "Humberto Delgado Airport", distanceKm: 7, travelTimeHours: 0.3 },
    ],
  },
  {
    name: "Rome",
    country: "IT",
    region: "europe",
    lat: 41.9028,
    lng: 12.4964,
    nearbyAirports: [
      { code: "FCO", name: "Leonardo da Vinci Airport", distanceKm: 30, travelTimeHours: 0.6 },
      { code: "CIA", name: "Ciampino Airport", distanceKm: 15, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Milan",
    country: "IT",
    region: "europe",
    lat: 45.4642,
    lng: 9.19,
    nearbyAirports: [
      { code: "MXP", name: "Malpensa Airport", distanceKm: 49, travelTimeHours: 0.9 },
      { code: "LIN", name: "Linate Airport", distanceKm: 8, travelTimeHours: 0.3 },
      { code: "BGY", name: "Bergamo Orio al Serio Airport", distanceKm: 50, travelTimeHours: 0.9 },
    ],
  },
  {
    name: "Vienna",
    country: "AT",
    region: "europe",
    lat: 48.2082,
    lng: 16.3738,
    nearbyAirports: [
      { code: "VIE", name: "Vienna International Airport", distanceKm: 18, travelTimeHours: 0.4 },
    ],
  },
  {
    name: "Helsinki",
    country: "FI",
    region: "europe",
    lat: 60.1695,
    lng: 24.9354,
    nearbyAirports: [
      { code: "HEL", name: "Helsinki Airport", distanceKm: 17, travelTimeHours: 0.3 },
    ],
  },
  {
    name: "Athens",
    country: "GR",
    region: "europe",
    lat: 37.9838,
    lng: 23.7275,
    nearbyAirports: [
      { code: "ATH", name: "Athens International Airport", distanceKm: 33, travelTimeHours: 0.6 },
    ],
  },
  {
    name: "Stockholm",
    country: "SE",
    region: "europe",
    lat: 59.3293,
    lng: 18.0686,
    nearbyAirports: [
      { code: "ARN", name: "Stockholm Arlanda Airport", distanceKm: 40, travelTimeHours: 0.7 },
    ],
  },
  {
    name: "Copenhagen",
    country: "DK",
    region: "europe",
    lat: 55.6761,
    lng: 12.5683,
    nearbyAirports: [
      { code: "CPH", name: "Copenhagen Airport", distanceKm: 8, travelTimeHours: 0.2 },
    ],
  },
  {
    name: "Dublin",
    country: "IE",
    region: "europe",
    lat: 53.3498,
    lng: -6.2603,
    nearbyAirports: [
      { code: "DUB", name: "Dublin Airport", distanceKm: 13, travelTimeHours: 0.3 },
    ],
  },
  {
    name: "Bucharest",
    country: "RO",
    region: "europe",
    lat: 44.4268,
    lng: 26.1025,
    nearbyAirports: [
      { code: "OTP", name: "Henri Coanda International Airport", distanceKm: 16, travelTimeHours: 0.3 },
    ],
  },
  {
    name: "Munich",
    country: "DE",
    region: "europe",
    lat: 48.1351,
    lng: 11.582,
    nearbyAirports: [
      { code: "MUC", name: "Munich Airport", distanceKm: 28, travelTimeHours: 0.5 },
    ],
  },
];
