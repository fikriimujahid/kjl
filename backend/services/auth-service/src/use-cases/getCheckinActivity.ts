import { listUserSessionCheckins } from "../repositories/checkinRepository";

export interface CheckinActivityWeek {
  label: string;
  values: number[];
}

export interface GetCheckinActivityInput {
  userId: string;
  weekCount: number;
}

export interface GetCheckinActivityResult {
  streakDays: number;
  totalActiveDays: number;
  totalDays: number;
  activityWeeks: CheckinActivityWeek[];
}

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

const toJakartaDateKey = (date: Date): string => {
  const jakartaDate = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  const year = jakartaDate.getUTCFullYear();
  const month = String(jakartaDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jakartaDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const buildWindowDateKeys = (dayCount: number): string[] => {
  const keys: string[] = [];

  for (let daysAgo = dayCount - 1; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
    keys.push(toJakartaDateKey(date));
  }

  return keys;
};

const buildWeekLabel = (weekIndex: number, weekCount: number): string => {
  const weeksAgo = weekCount - weekIndex - 1;

  if (weeksAgo === 0) {
    return "Minggu Ini";
  }

  if (weeksAgo === 1) {
    return "Minggu Lalu";
  }

  return `${weeksAgo} Minggu Lalu`;
};

const buildActivityWeeks = (
  dateKeys: string[],
  activeDateSet: Set<string>,
  weekCount: number
): CheckinActivityWeek[] => {
  const weeks: CheckinActivityWeek[] = [];

  for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
    const startIndex = weekIndex * 7;
    const weekDateKeys = dateKeys.slice(startIndex, startIndex + 7);

    weeks.push({
      label: buildWeekLabel(weekIndex, weekCount),
      values: weekDateKeys.map((dateKey) => (activeDateSet.has(dateKey) ? 100 : 0))
    });
  }

  return weeks;
};

const calculateStreakDays = (dateKeys: string[], activeDateSet: Set<string>): number => {
  let streakDays = 0;

  for (let index = dateKeys.length - 1; index >= 0; index -= 1) {
    if (!activeDateSet.has(dateKeys[index])) {
      break;
    }

    streakDays += 1;
  }

  return streakDays;
};

export const getCheckinActivity = async (
  input: GetCheckinActivityInput
): Promise<GetCheckinActivityResult> => {
  const weekCount = Math.max(1, Math.min(12, Math.floor(input.weekCount)));
  const totalDays = weekCount * 7;
  const windowDateKeys = buildWindowDateKeys(totalDays);
  const fromActivityDate = windowDateKeys[0];
  const toActivityDate = windowDateKeys[windowDateKeys.length - 1];

  const checkins = await listUserSessionCheckins({
    userId: input.userId,
    fromActivityDate,
    toActivityDate
  });

  const activeDateSet = new Set(
    checkins
      .map((checkin) => checkin.activityDate)
      .filter((dateValue): dateValue is string => typeof dateValue === "string" && dateValue.length > 0)
  );

  return {
    streakDays: calculateStreakDays(windowDateKeys, activeDateSet),
    totalActiveDays: windowDateKeys.reduce(
      (count, dateKey) => count + (activeDateSet.has(dateKey) ? 1 : 0),
      0
    ),
    totalDays,
    activityWeeks: buildActivityWeeks(windowDateKeys, activeDateSet, weekCount)
  };
};
