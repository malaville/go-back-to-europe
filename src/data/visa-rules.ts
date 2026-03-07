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

  // Caucasus / Near-Europe
  { nationality: "FR", destinationCountry: "GE", category: "free", maxDays: 365, notes: "Visa exemption for 1 year" },
  { nationality: "FR", destinationCountry: "TR", category: "free", maxDays: 90, notes: "Visa exemption for 90 days in 180-day period" },
];
