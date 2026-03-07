export type RouteLeg = {
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  transport: "flight" | "bus" | "train" | "ferry";
  airline?: string;
  duration: string; // e.g., "3h 20m"
  durationMinutes: number;
  price: number; // USD
  visaStatus: "free" | "evisa" | "warning" | "easy" | "hard" | "none";
  visaNote?: string;
};

export type RouteOption = {
  id: string;
  legs: RouteLeg[];
  totalPrice: number;
  totalDurationMinutes: number;
  totalDuration: string;
  warnings: string[];
  tags: string[]; // e.g., "Cheapest", "Fastest", "Most comfortable"
};

export const mockRoutes: RouteOption[] = [
  {
    id: "route-1",
    legs: [
      {
        from: "Ho Chi Minh City",
        to: "Bangkok",
        fromCode: "SGN",
        toCode: "BKK",
        transport: "flight",
        airline: "VietJet Air",
        duration: "1h 45m",
        durationMinutes: 105,
        price: 65,
        visaStatus: "free",
        visaNote: "60-day visa exemption",
      },
      {
        from: "Bangkok",
        to: "Seoul",
        fromCode: "BKK",
        toCode: "ICN",
        transport: "flight",
        airline: "T'way Air",
        duration: "5h 10m",
        durationMinutes: 310,
        price: 145,
        visaStatus: "free",
        visaNote: "90-day visa exemption",
      },
      {
        from: "Seoul",
        to: "Paris",
        fromCode: "ICN",
        toCode: "CDG",
        transport: "flight",
        airline: "Air France",
        duration: "12h 30m",
        durationMinutes: 750,
        price: 380,
        visaStatus: "none",
      },
    ],
    totalPrice: 590,
    totalDurationMinutes: 1165,
    totalDuration: "19h 25m (+ layovers)",
    warnings: [],
    tags: ["Cheapest"],
  },
  {
    id: "route-2",
    legs: [
      {
        from: "Ho Chi Minh City",
        to: "Kuala Lumpur",
        fromCode: "SGN",
        toCode: "KUL",
        transport: "flight",
        airline: "AirAsia",
        duration: "2h 10m",
        durationMinutes: 130,
        price: 55,
        visaStatus: "free",
        visaNote: "90-day visa exemption",
      },
      {
        from: "Kuala Lumpur",
        to: "Istanbul",
        fromCode: "KUL",
        toCode: "IST",
        transport: "flight",
        airline: "Turkish Airlines",
        duration: "11h 15m",
        durationMinutes: 675,
        price: 290,
        visaStatus: "free",
        visaNote: "90-day visa exemption",
      },
      {
        from: "Istanbul",
        to: "Paris",
        fromCode: "IST",
        toCode: "CDG",
        transport: "flight",
        airline: "Turkish Airlines",
        duration: "3h 40m",
        durationMinutes: 220,
        price: 95,
        visaStatus: "none",
      },
    ],
    totalPrice: 440,
    totalDurationMinutes: 1025,
    totalDuration: "17h 05m (+ layovers)",
    warnings: [],
    tags: ["Best value"],
  },
  {
    id: "route-3",
    legs: [
      {
        from: "Ho Chi Minh City",
        to: "Singapore",
        fromCode: "SGN",
        toCode: "SIN",
        transport: "flight",
        airline: "Scoot",
        duration: "2h 05m",
        durationMinutes: 125,
        price: 70,
        visaStatus: "free",
        visaNote: "90-day visa exemption",
      },
      {
        from: "Singapore",
        to: "Paris",
        fromCode: "SIN",
        toCode: "CDG",
        transport: "flight",
        airline: "Singapore Airlines",
        duration: "13h 20m",
        durationMinutes: 800,
        price: 520,
        visaStatus: "none",
      },
    ],
    totalPrice: 590,
    totalDurationMinutes: 925,
    totalDuration: "15h 25m (+ layover)",
    warnings: [],
    tags: ["Fastest", "Most comfortable"],
  },
  {
    id: "route-4",
    legs: [
      {
        from: "Ho Chi Minh City",
        to: "Phnom Penh",
        fromCode: "SGN",
        toCode: "PNH",
        transport: "bus",
        duration: "6h 30m",
        durationMinutes: 390,
        price: 15,
        visaStatus: "easy",
        visaNote: "Visa on arrival ~$30",
      },
      {
        from: "Phnom Penh",
        to: "Bangkok",
        fromCode: "PNH",
        toCode: "BKK",
        transport: "flight",
        airline: "Cambodia Angkor Air",
        duration: "1h 15m",
        durationMinutes: 75,
        price: 80,
        visaStatus: "free",
        visaNote: "60-day visa exemption",
      },
      {
        from: "Bangkok",
        to: "Tbilisi",
        fromCode: "BKK",
        toCode: "TBS",
        transport: "flight",
        airline: "FlyDubai",
        duration: "9h 50m",
        durationMinutes: 590,
        price: 180,
        visaStatus: "free",
        visaNote: "1-year visa exemption",
      },
      {
        from: "Tbilisi",
        to: "Paris",
        fromCode: "TBS",
        toCode: "CDG",
        transport: "flight",
        airline: "Wizz Air",
        duration: "5h 10m",
        durationMinutes: 310,
        price: 85,
        visaStatus: "none",
      },
    ],
    totalPrice: 360,
    totalDurationMinutes: 1365,
    totalDuration: "22h 45m (+ layovers)",
    warnings: [
      "Long total travel time — consider stopping in Tbilisi for a night",
      "Bus leg to Phnom Penh — plan extra time for border crossing",
    ],
    tags: ["Adventure route"],
  },
  {
    id: "route-5",
    legs: [
      {
        from: "Ho Chi Minh City",
        to: "Taipei",
        fromCode: "SGN",
        toCode: "TPE",
        transport: "flight",
        airline: "Starlux Airlines",
        duration: "3h 30m",
        durationMinutes: 210,
        price: 110,
        visaStatus: "free",
        visaNote: "90-day visa exemption",
      },
      {
        from: "Taipei",
        to: "Amsterdam",
        fromCode: "TPE",
        toCode: "AMS",
        transport: "flight",
        airline: "China Airlines",
        duration: "13h 10m",
        durationMinutes: 790,
        price: 410,
        visaStatus: "none",
      },
    ],
    totalPrice: 520,
    totalDurationMinutes: 1000,
    totalDuration: "16h 40m (+ layover)",
    warnings: [],
    tags: ["Direct to NL"],
  },
];
