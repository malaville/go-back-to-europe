export type ExcludedRegionData = {
  countryCode: string;
  countryName: string;
  reason: string;
  isDefault: boolean;
};

export const excludedRegions: ExcludedRegionData[] = [
  { countryCode: "IQ", countryName: "Iraq", reason: "Armed conflict", isDefault: true },
  { countryCode: "SY", countryName: "Syria", reason: "Armed conflict", isDefault: true },
  { countryCode: "YE", countryName: "Yemen", reason: "Armed conflict", isDefault: true },
  { countryCode: "IR", countryName: "Iran", reason: "Geopolitical risk — sanctions and restricted airspace", isDefault: true },
  { countryCode: "IL", countryName: "Israel", reason: "Active conflict zone", isDefault: true },
  { countryCode: "PS", countryName: "Palestine", reason: "Active conflict zone", isDefault: true },
  { countryCode: "LB", countryName: "Lebanon", reason: "Instability and conflict spillover", isDefault: true },
];
