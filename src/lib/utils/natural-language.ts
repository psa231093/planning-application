import {
  addDays,
  addWeeks,
  setHours,
  setMinutes,
  startOfTomorrow,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
  isToday,
  startOfToday,
} from "date-fns";

export interface ParsedTask {
  title: string;
  scheduledStart: Date | null;
  estimatedMinutes: number | null;
  priority: "low" | "medium" | "high" | "urgent" | null;
  categoryMatch: string | null;
}

interface ParseToken {
  type: "date" | "time" | "duration" | "priority" | "category";
  value: string;
  parsed: unknown;
  start: number;
  end: number;
}

const TIME_REGEX = /\b(\d{1,2}):?(\d{2})?\s*(am|pm)?\b/i;
const DURATION_REGEX = /\b(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minutes?)\b/i;
const PRIORITY_REGEX = /\b(!!|urgent|high\s*(?:priority)?|low\s*(?:priority)?|medium\s*(?:priority)?)\b/i;

const DATE_KEYWORDS: Record<string, () => Date> = {
  today: () => startOfToday(),
  tomorrow: () => startOfTomorrow(),
  monday: () => nextMonday(new Date()),
  tuesday: () => nextTuesday(new Date()),
  wednesday: () => nextWednesday(new Date()),
  thursday: () => nextThursday(new Date()),
  friday: () => nextFriday(new Date()),
  saturday: () => nextSaturday(new Date()),
  sunday: () => nextSunday(new Date()),
};

// "next week" => adds 7 days
const RELATIVE_DATES: Record<string, () => Date> = {
  "next week": () => addWeeks(startOfToday(), 1),
  "in 2 days": () => addDays(startOfToday(), 2),
  "in 3 days": () => addDays(startOfToday(), 3),
};

export function parseNaturalLanguage(
  input: string,
  userCategories: string[] = []
): ParsedTask {
  const tokens: ParseToken[] = [];
  let remaining = input;

  // Parse relative dates first (multi-word)
  for (const [keyword, dateFunc] of Object.entries(RELATIVE_DATES)) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    const match = remaining.match(regex);
    if (match && match.index !== undefined) {
      tokens.push({
        type: "date",
        value: match[0],
        parsed: dateFunc(),
        start: match.index,
        end: match.index + match[0].length,
      });
      remaining =
        remaining.slice(0, match.index) +
        remaining.slice(match.index + match[0].length);
    }
  }

  // Parse date keywords
  for (const [keyword, dateFunc] of Object.entries(DATE_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    const match = remaining.match(regex);
    if (match && match.index !== undefined) {
      // Don't double-count if we already have a date
      if (!tokens.find((t) => t.type === "date")) {
        tokens.push({
          type: "date",
          value: match[0],
          parsed: dateFunc(),
          start: match.index,
          end: match.index + match[0].length,
        });
        remaining =
          remaining.slice(0, match.index) +
          remaining.slice(match.index + match[0].length);
      }
    }
  }

  // Parse time
  const timeMatch = remaining.match(TIME_REGEX);
  if (timeMatch && timeMatch.index !== undefined) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;

    tokens.push({
      type: "time",
      value: timeMatch[0],
      parsed: { hours, minutes },
      start: timeMatch.index,
      end: timeMatch.index + timeMatch[0].length,
    });
    remaining =
      remaining.slice(0, timeMatch.index) +
      remaining.slice(timeMatch.index + timeMatch[0].length);
  }

  // Parse duration
  const durationMatch = remaining.match(DURATION_REGEX);
  if (durationMatch && durationMatch.index !== undefined) {
    const amount = parseFloat(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    const minutes =
      unit.startsWith("h") ? Math.round(amount * 60) : Math.round(amount);

    tokens.push({
      type: "duration",
      value: durationMatch[0],
      parsed: minutes,
      start: durationMatch.index,
      end: durationMatch.index + durationMatch[0].length,
    });
    remaining =
      remaining.slice(0, durationMatch.index) +
      remaining.slice(durationMatch.index + durationMatch[0].length);
  }

  // Parse priority
  const priorityMatch = remaining.match(PRIORITY_REGEX);
  if (priorityMatch && priorityMatch.index !== undefined) {
    const raw = priorityMatch[1].toLowerCase().trim();
    let priority: "low" | "medium" | "high" | "urgent" = "medium";
    if (raw === "!!" || raw === "urgent") priority = "urgent";
    else if (raw.startsWith("high")) priority = "high";
    else if (raw.startsWith("low")) priority = "low";
    else if (raw.startsWith("medium")) priority = "medium";

    tokens.push({
      type: "priority",
      value: priorityMatch[0],
      parsed: priority,
      start: priorityMatch.index,
      end: priorityMatch.index + priorityMatch[0].length,
    });
    remaining =
      remaining.slice(0, priorityMatch.index) +
      remaining.slice(priorityMatch.index + priorityMatch[0].length);
  }

  // Parse category (match against user's category names)
  let categoryMatch: string | null = null;
  for (const cat of userCategories) {
    const regex = new RegExp(`\\b${escapeRegex(cat)}\\b`, "i");
    const match = remaining.match(regex);
    if (match && match.index !== undefined) {
      categoryMatch = cat;
      tokens.push({
        type: "category",
        value: match[0],
        parsed: cat,
        start: match.index,
        end: match.index + match[0].length,
      });
      remaining =
        remaining.slice(0, match.index) +
        remaining.slice(match.index + match[0].length);
      break;
    }
  }

  // Build scheduled date
  let scheduledStart: Date | null = null;
  const dateToken = tokens.find((t) => t.type === "date");
  const timeToken = tokens.find((t) => t.type === "time");

  if (dateToken) {
    scheduledStart = dateToken.parsed as Date;
    if (timeToken) {
      const { hours, minutes } = timeToken.parsed as {
        hours: number;
        minutes: number;
      };
      scheduledStart = setMinutes(setHours(scheduledStart, hours), minutes);
    }
  } else if (timeToken) {
    // Time without date = today
    const { hours, minutes } = timeToken.parsed as {
      hours: number;
      minutes: number;
    };
    scheduledStart = setMinutes(setHours(startOfToday(), hours), minutes);
  }

  // Clean up title
  const title = remaining
    .replace(/\s*[-–—]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title,
    scheduledStart,
    estimatedMinutes: (tokens.find((t) => t.type === "duration")?.parsed as number) ?? null,
    priority: (tokens.find((t) => t.type === "priority")?.parsed as ParsedTask["priority"]) ?? null,
    categoryMatch,
  };
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getTokens(
  input: string,
  userCategories: string[] = []
): ParseToken[] {
  const tokens: ParseToken[] = [];

  // Check date keywords
  for (const keyword of Object.keys({ ...DATE_KEYWORDS, ...RELATIVE_DATES })) {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "gi");
    let match;
    while ((match = regex.exec(input)) !== null) {
      tokens.push({
        type: "date",
        value: match[0],
        parsed: null,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Check time
  const timeMatch = TIME_REGEX.exec(input);
  if (timeMatch && timeMatch.index !== undefined) {
    tokens.push({
      type: "time",
      value: timeMatch[0],
      parsed: null,
      start: timeMatch.index,
      end: timeMatch.index + timeMatch[0].length,
    });
  }

  // Check duration
  const durMatch = DURATION_REGEX.exec(input);
  if (durMatch && durMatch.index !== undefined) {
    tokens.push({
      type: "duration",
      value: durMatch[0],
      parsed: null,
      start: durMatch.index,
      end: durMatch.index + durMatch[0].length,
    });
  }

  // Check priority
  const priMatch = PRIORITY_REGEX.exec(input);
  if (priMatch && priMatch.index !== undefined) {
    tokens.push({
      type: "priority",
      value: priMatch[0],
      parsed: null,
      start: priMatch.index,
      end: priMatch.index + priMatch[0].length,
    });
  }

  // Check categories
  for (const cat of userCategories) {
    const regex = new RegExp(`\\b${escapeRegex(cat)}\\b`, "i");
    const match = regex.exec(input);
    if (match && match.index !== undefined) {
      tokens.push({
        type: "category",
        value: match[0],
        parsed: cat,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return tokens;
}
