import { googleFlightsUrl } from "../google-flights-url";

describe("googleFlightsUrl", () => {
  it("generates a valid URL without date", () => {
    const url = googleFlightsUrl("BKK", "CTU");
    expect(url).toContain("google.com/travel/flights");
    expect(url).toContain("BKK");
    expect(url).toContain("CTU");
    expect(url).toContain("curr=EUR");
  });

  it("generates a protobuf-encoded URL with date", () => {
    const url = googleFlightsUrl("MNL", "LHR", "2026-03-08");
    expect(url).toContain("google.com/travel/flights/search");
    expect(url).toContain("tfs=");
    expect(url).toContain("curr=EUR");
    // tfs param should be base64url (no +, /, or trailing =)
    const tfs = new URL(url).searchParams.get("tfs")!;
    expect(tfs).toBeTruthy();
    expect(tfs).not.toMatch(/[+/=]/);
  });

  it("is deterministic for the same inputs", () => {
    const a = googleFlightsUrl("TPE", "LHR", "2026-03-15");
    const b = googleFlightsUrl("TPE", "LHR", "2026-03-15");
    expect(a).toBe(b);
  });
});
