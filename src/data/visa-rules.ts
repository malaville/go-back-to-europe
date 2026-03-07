export type VisaCategory = "free" | "evisa" | "warning" | "easy" | "hard";

export type VisaRuleData = {
  nationality: string; // passport country code
  destinationCountry: string; // ISO 3166-1 alpha-2
  category: VisaCategory;
  maxDays: number | null;
  notes: string;
};

/**
 * Simplified visa rules for French (FR) nationals for common transit countries.
 * Categories:
 *  - "free"    = visa-free entry
 *  - "evisa"   = electronic visa available online
 *  - "warning" = entry possible but restrictions / instability
 *  - "easy"    = visa on arrival or simple process
 *  - "hard"    = complex visa process, may require embassy visit
 */
export const visaRules: VisaRuleData[] = [
  // Southeast Asia
  { nationality: "FR", destinationCountry: "TH", category: "free", maxDays: 60, notes: "Visa exemption for 60 days" },
  { nationality: "FR", destinationCountry: "VN", category: "evisa", maxDays: 90, notes: "E-visa available online, 90-day stay" },
  { nationality: "FR", destinationCountry: "KH", category: "easy", maxDays: 30, notes: "Visa on arrival or e-visa, ~$30" },
  { nationality: "FR", destinationCountry: "LA", category: "easy", maxDays: 30, notes: "Visa on arrival at airports, ~$40" },
  { nationality: "FR", destinationCountry: "MM", category: "evisa", maxDays: 28, notes: "E-visa required; check travel advisories" },
  { nationality: "FR", destinationCountry: "MY", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { nationality: "FR", destinationCountry: "SG", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { nationality: "FR", destinationCountry: "ID", category: "easy", maxDays: 30, notes: "Visa on arrival ~$35, extendable 30 days" },
  { nationality: "FR", destinationCountry: "PH", category: "free", maxDays: 30, notes: "Visa exemption for 30 days" },

  // East Asia
  { nationality: "FR", destinationCountry: "KR", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { nationality: "FR", destinationCountry: "JP", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { nationality: "FR", destinationCountry: "TW", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },

  // South Asia
  { nationality: "FR", destinationCountry: "IN", category: "evisa", maxDays: 90, notes: "E-visa available, multiple categories" },
  { nationality: "FR", destinationCountry: "LK", category: "evisa", maxDays: 30, notes: "ETA e-visa required, ~$50" },

  // Central Asia
  { nationality: "FR", destinationCountry: "KZ", category: "free", maxDays: 30, notes: "Visa exemption for 30 days" },
  { nationality: "FR", destinationCountry: "UZ", category: "free", maxDays: 30, notes: "Visa exemption for 30 days" },

  // East Asia (continued)
  { nationality: "FR", destinationCountry: "HK", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { nationality: "FR", destinationCountry: "MO", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { nationality: "FR", destinationCountry: "MN", category: "free", maxDays: 30, notes: "Visa exemption for 30 days" },

  // South Asia (continued)
  { nationality: "FR", destinationCountry: "NP", category: "easy", maxDays: 90, notes: "Visa on arrival at airport, ~$30" },
  { nationality: "FR", destinationCountry: "MV", category: "free", maxDays: 30, notes: "Visa on arrival, free" },

  // Central Asia (continued)
  { nationality: "FR", destinationCountry: "KG", category: "free", maxDays: 60, notes: "Visa exemption for 60 days" },
  { nationality: "FR", destinationCountry: "TJ", category: "evisa", maxDays: 45, notes: "E-visa available online" },

  // Africa
  { nationality: "FR", destinationCountry: "ET", category: "evisa", maxDays: 90, notes: "E-visa available online, ~$82" },
  { nationality: "FR", destinationCountry: "KE", category: "evisa", maxDays: 90, notes: "E-visa or ETA required" },
  { nationality: "FR", destinationCountry: "TZ", category: "evisa", maxDays: 90, notes: "E-visa available, ~$50" },
  { nationality: "FR", destinationCountry: "MA", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { nationality: "FR", destinationCountry: "TN", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { nationality: "FR", destinationCountry: "ZA", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { nationality: "FR", destinationCountry: "MU", category: "free", maxDays: 60, notes: "Visa exemption for 60 days" },
  { nationality: "FR", destinationCountry: "RW", category: "evisa", maxDays: 30, notes: "E-visa or visa on arrival, ~$30" },

  // China (144-hour visa-free transit)
  { nationality: "FR", destinationCountry: "CN", category: "free", maxDays: 6, notes: "144h visa-free transit — must have onward ticket to third country within 144h" },

  // Caucasus / Near-Europe
  { nationality: "FR", destinationCountry: "GE", category: "free", maxDays: 365, notes: "Visa exemption for 1 year" },
  { nationality: "FR", destinationCountry: "TR", category: "free", maxDays: 90, notes: "Visa exemption for 90 days in 180-day period" },
  { nationality: "FR", destinationCountry: "AM", category: "free", maxDays: 180, notes: "Visa exemption for 180 days" },
  { nationality: "FR", destinationCountry: "AZ", category: "evisa", maxDays: 30, notes: "E-visa available, ~$26" },
];
