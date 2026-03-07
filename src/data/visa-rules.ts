export type VisaCategory = "free" | "evisa" | "warning" | "easy" | "hard";

export type VisaRuleData = {
  nationality: string; // passport country code
  destinationCountry: string; // ISO 3166-1 alpha-2
  category: VisaCategory;
  maxDays: number | null;
  notes: string;
};

/**
 * Visa rules for EU nationals (FR, DE, IT, ES, NL, GB, PL, RO, SE, BE, AT).
 * Most SEA/transit countries treat all EU passports identically.
 * Exceptions are noted where they exist (e.g., GB post-Brexit).
 */

// List of EU nationalities covered
const EU_NATIONALITIES = [
  "FR", "DE", "IT", "ES", "NL", "GB", "PL", "RO", "SE", "BE", "AT",
  "FI", "DK", "IE", "GR", "PT", "HU", "CZ", "HR", "BG", "SK", "LT", "LV", "EE", "SI", "LU", "MT", "CY",
  "NO", "IS", "CH", // EEA + Switzerland
];

// Base rules (apply to all EU nationalities unless overridden)
type BaseRule = Omit<VisaRuleData, "nationality">;

const BASE_RULES: BaseRule[] = [
  // Southeast Asia
  { destinationCountry: "TH", category: "free", maxDays: 60, notes: "Visa exemption for 60 days" },
  { destinationCountry: "VN", category: "evisa", maxDays: 90, notes: "E-visa available online, 90-day stay" },
  { destinationCountry: "KH", category: "easy", maxDays: 30, notes: "Visa on arrival or e-visa, ~$30" },
  { destinationCountry: "LA", category: "easy", maxDays: 30, notes: "Visa on arrival at airports, ~$40" },
  { destinationCountry: "MM", category: "evisa", maxDays: 28, notes: "E-visa required; check travel advisories" },
  { destinationCountry: "MY", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { destinationCountry: "SG", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { destinationCountry: "ID", category: "easy", maxDays: 30, notes: "Visa on arrival ~$35, extendable 30 days" },
  { destinationCountry: "PH", category: "free", maxDays: 30, notes: "Visa exemption for 30 days" },

  // East Asia
  { destinationCountry: "KR", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { destinationCountry: "JP", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { destinationCountry: "TW", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },

  // South Asia
  { destinationCountry: "IN", category: "evisa", maxDays: 90, notes: "E-visa available, multiple categories" },
  { destinationCountry: "LK", category: "evisa", maxDays: 30, notes: "ETA e-visa required, ~$50" },

  // Central Asia
  { destinationCountry: "KZ", category: "free", maxDays: 30, notes: "Visa exemption for 30 days" },
  { destinationCountry: "UZ", category: "free", maxDays: 30, notes: "Visa exemption for 30 days" },

  // East Asia (continued)
  { destinationCountry: "HK", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { destinationCountry: "MO", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { destinationCountry: "MN", category: "free", maxDays: 30, notes: "Visa exemption for 30 days" },

  // South Asia (continued)
  { destinationCountry: "NP", category: "easy", maxDays: 90, notes: "Visa on arrival at airport, ~$30" },
  { destinationCountry: "MV", category: "free", maxDays: 30, notes: "Visa on arrival, free" },

  // Central Asia (continued)
  { destinationCountry: "KG", category: "free", maxDays: 60, notes: "Visa exemption for 60 days" },
  { destinationCountry: "TJ", category: "evisa", maxDays: 45, notes: "E-visa available online" },

  // Africa
  { destinationCountry: "ET", category: "evisa", maxDays: 90, notes: "E-visa available online, ~$82" },
  { destinationCountry: "KE", category: "evisa", maxDays: 90, notes: "E-visa or ETA required" },
  { destinationCountry: "TZ", category: "evisa", maxDays: 90, notes: "E-visa available, ~$50" },
  { destinationCountry: "MA", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { destinationCountry: "TN", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { destinationCountry: "ZA", category: "free", maxDays: 90, notes: "Visa exemption for 90 days" },
  { destinationCountry: "MU", category: "free", maxDays: 60, notes: "Visa exemption for 60 days" },
  { destinationCountry: "RW", category: "evisa", maxDays: 30, notes: "E-visa or visa on arrival, ~$30" },

  // China (144-hour visa-free transit)
  { destinationCountry: "CN", category: "free", maxDays: 6, notes: "144h visa-free transit — must have onward ticket to third country within 144h" },

  // Caucasus / Near-Europe
  { destinationCountry: "GE", category: "free", maxDays: 365, notes: "Visa exemption for 1 year" },
  { destinationCountry: "TR", category: "free", maxDays: 90, notes: "Visa exemption for 90 days in 180-day period" },
  { destinationCountry: "AM", category: "free", maxDays: 180, notes: "Visa exemption for 180 days" },
  { destinationCountry: "AZ", category: "evisa", maxDays: 30, notes: "E-visa available, ~$26" },
];

// Generate all combinations: base rules for all EU nationalities
const baseRules: VisaRuleData[] = [];
for (const nat of EU_NATIONALITIES) {
  for (const rule of BASE_RULES) {
    baseRules.push({ ...rule, nationality: nat });
  }
}

// Exceptions (where specific nationalities differ from base rules)
// Most SEA/transit countries treat all EU identically, so this is minimal
const exceptions: VisaRuleData[] = [
  // GB-specific exceptions if any (currently identical to others)
  // Can add more if discovered
];

export const visaRules: VisaRuleData[] = [...baseRules, ...exceptions];
