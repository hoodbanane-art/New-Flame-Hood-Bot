import { describe, expect, it } from "vitest";
import { parseDuration } from "../src/utils/duration.js";

describe("parseDuration", () => {
  it("parses minutes and days into Roblox seconds", () => {
    expect(parseDuration("30m")).toMatchObject({ robloxDuration: "1800s", seconds: 1800, permanent: false });
    expect(parseDuration("7d")).toMatchObject({ robloxDuration: "604800s", seconds: 604800, permanent: false });
  });

  it("parses month shorthand", () => {
    expect(parseDuration("1mo")).toMatchObject({ robloxDuration: "2592000s", permanent: false });
  });

  it("supports permanent bans", () => {
    expect(parseDuration("permanent")).toEqual({ label: "Permanent", permanent: true });
  });

  it("rejects invalid durations", () => {
    expect(() => parseDuration("soon")).toThrow();
    expect(() => parseDuration("0d")).toThrow();
  });
});
