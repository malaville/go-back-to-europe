export type RouteLeg = {
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  transport: "flight" | "bus" | "train" | "ferry";
  airline?: string;
  airlineCode?: string;
  hiddenStop?: string; // e.g., "Likely connects via Shanghai" when MU flies SEL→PAR
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
  totalDurationMinutes: number; // flight time only
  totalDuration: string;
  estimatedTotalMinutes: number; // flight + estimated layovers
  estimatedTotalDuration: string; // "~17h 30m"
  searchUrl: string; // Aviasales affiliate search link
  ticketType: "separate" | "alliance" | "single-carrier";
  warnings: string[];
  tags: string[]; // e.g., "Cheapest", "Fastest", "Recommended"
};

// Mock routes are no longer used — all routes come from the route engine.
// Keeping an empty array for backwards compatibility.
export const mockRoutes: RouteOption[] = [];
