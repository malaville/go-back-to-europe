export type Advisory = {
  id: string;
  severity: "info" | "high" | "critical";
  message: string;
  link?: string;
  active: boolean;
};

/**
 * Active travel advisories shown as a banner above route results.
 * Update manually when the situation changes.
 */
export const activeAdvisories: Advisory[] = [
  {
    id: "gulf-2026-03",
    severity: "critical",
    message:
      "Gulf airspace disruptions ongoing since March 1, 2026. All routes on this app avoid Middle East airspace and Gulf-hub airlines. SEA-to-Europe flights may still add 60-90 min due to global rerouting.",
    link: "https://www.visahq.com/news/2026-03-01/ae/etihad-airways-grounds-all-abu-dhabi-departures-as-gulf-airspace-shuts/",
    active: true,
  },
];
