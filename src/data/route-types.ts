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
  departDate?: string; // ISO date, e.g. "2026-03-25" — set on flight legs
  departTime?: string; // Local departure time, e.g. "15:15" — from API when available
  flightNumber?: string; // Full flight number, e.g. "5J 112" — from API when available
};

export type RouteOption = {
  id: string;
  legs: RouteLeg[];
  totalPrice: number; // estimated real price (after K(d) correction)
  veryUnderestimatedPrice: number; // raw cached price from Aviasales (optimistic, often wrong for last-minute)
  totalDurationMinutes: number; // flight time only
  totalDuration: string;
  estimatedTotalMinutes: number; // flight + estimated layovers
  estimatedTotalDuration: string; // "~17h 30m"
  ticketType: "separate" | "alliance" | "single-carrier";
  warnings: string[];
  tags: string[]; // e.g., "Cheapest", "Fastest", "Recommended"
  departureDate: string; // ISO date of first departure, e.g., "2026-03-25"
  tier: "preferred" | "extended"; // preferred = matches flex/land, extended = outside comfort zone
};

// Mock routes are no longer used — all routes come from the route engine.
// Keeping an empty array for backwards compatibility.
export const mockRoutes: RouteOption[] = [];
