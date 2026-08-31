export type ParsedDuration = {
  label: string;
  robloxDuration?: string;
  seconds?: number;
  permanent: boolean;
};

const unitSeconds: Record<string, number> = {
  s: 1,
  sec: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  minute: 60,
  minutes: 60,
  h: 60 * 60,
  hour: 60 * 60,
  hours: 60 * 60,
  d: 24 * 60 * 60,
  day: 24 * 60 * 60,
  days: 24 * 60 * 60,
  w: 7 * 24 * 60 * 60,
  week: 7 * 24 * 60 * 60,
  weeks: 7 * 24 * 60 * 60,
  mo: 30 * 24 * 60 * 60,
  month: 30 * 24 * 60 * 60,
  months: 30 * 24 * 60 * 60,
  y: 365 * 24 * 60 * 60,
  year: 365 * 24 * 60 * 60,
  years: 365 * 24 * 60 * 60
};

const permanentValues = new Set(["permanent", "perm", "forever", "infinite", "never"]);

export function parseDuration(input: string): ParsedDuration {
  const value = input.trim().toLowerCase();

  if (permanentValues.has(value)) {
    return {
      label: "Permanent",
      permanent: true
    };
  }

  const match = value.match(/^(\d+)\s*([a-z]+)$/);
  if (!match) {
    throw new Error("Duration must look like 30m, 7d, 1mo, 1y, or permanent.");
  }

  const amount = Number.parseInt(match[1] ?? "", 10);
  const unit = match[2] ?? "";
  const multiplier = unitSeconds[unit];

  if (!Number.isSafeInteger(amount) || amount <= 0 || !multiplier) {
    throw new Error("Duration must use a positive number and a supported unit.");
  }

  const seconds = amount * multiplier;
  if (!Number.isSafeInteger(seconds) || seconds <= 0) {
    throw new Error("Duration is too large.");
  }

  return {
    label: `${amount}${unit}`,
    robloxDuration: `${seconds}s`,
    seconds,
    permanent: false
  };
}
