export type CostOfLivingData = {
  countryCode: string;
  countryName: string;
  dailyCostUsd: number;
  source: string;
};

/**
 * Estimated daily budget-traveler cost (accommodation + food + local transport)
 * in USD. These are rough averages for a backpacker-style trip.
 */
export const costOfLiving: CostOfLivingData[] = [
  // Southeast Asia
  { countryCode: "TH", countryName: "Thailand", dailyCostUsd: 30, source: "manual" },
  { countryCode: "VN", countryName: "Vietnam", dailyCostUsd: 25, source: "manual" },
  { countryCode: "KH", countryName: "Cambodia", dailyCostUsd: 22, source: "manual" },
  { countryCode: "LA", countryName: "Laos", dailyCostUsd: 20, source: "manual" },
  { countryCode: "MM", countryName: "Myanmar", dailyCostUsd: 25, source: "manual" },
  { countryCode: "MY", countryName: "Malaysia", dailyCostUsd: 30, source: "manual" },
  { countryCode: "SG", countryName: "Singapore", dailyCostUsd: 70, source: "manual" },
  { countryCode: "ID", countryName: "Indonesia", dailyCostUsd: 25, source: "manual" },
  { countryCode: "PH", countryName: "Philippines", dailyCostUsd: 25, source: "manual" },

  // East Asia
  { countryCode: "KR", countryName: "South Korea", dailyCostUsd: 55, source: "manual" },
  { countryCode: "JP", countryName: "Japan", dailyCostUsd: 60, source: "manual" },
  { countryCode: "TW", countryName: "Taiwan", dailyCostUsd: 40, source: "manual" },

  // South Asia
  { countryCode: "IN", countryName: "India", dailyCostUsd: 18, source: "manual" },
  { countryCode: "LK", countryName: "Sri Lanka", dailyCostUsd: 22, source: "manual" },

  // Central Asia
  { countryCode: "KZ", countryName: "Kazakhstan", dailyCostUsd: 28, source: "manual" },
  { countryCode: "UZ", countryName: "Uzbekistan", dailyCostUsd: 20, source: "manual" },

  // Caucasus / Near-Europe
  { countryCode: "GE", countryName: "Georgia", dailyCostUsd: 30, source: "manual" },
  { countryCode: "TR", countryName: "Turkey", dailyCostUsd: 35, source: "manual" },
];
