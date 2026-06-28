import type { PublicBusiness, Schedule } from "@/types/database";

const CAMPUS_TIME_ZONE = "America/La_Paz";

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type BusinessHoursStatus = {
  isOpenNow: boolean;
  nextStatusLabel: string;
  todayLabel: string;
  tone: "open" | "closing" | "closed" | "unknown";
};

type ScheduleLike = Pick<
  Schedule,
  "closes_at" | "day_of_week" | "is_closed" | "opens_at"
>;

function campusNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: CAMPUS_TIME_ZONE,
    weekday: "short",
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";

  return {
    dayOfWeek: weekdayMap[weekday] ?? 0,
    minutes: hour * 60 + minute,
  };
}

function minutesFromTime(value: string | null) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function scheduleForToday(business: PublicBusiness): ScheduleLike | null {
  const { dayOfWeek } = campusNow();
  const directSchedule = business.schedules.find(
    (schedule) => schedule.day_of_week === dayOfWeek,
  );

  if (directSchedule) {
    return directSchedule;
  }

  if (business.opens_at && business.closes_at) {
    return {
      closes_at: business.closes_at,
      day_of_week: dayOfWeek,
      is_closed: false,
      opens_at: business.opens_at,
    };
  }

  return null;
}

function isWithinSchedule(now: number, opens: number, closes: number) {
  if (opens <= closes) {
    return now >= opens && now < closes;
  }

  return now >= opens || now < closes;
}

export function getBusinessHoursStatus(
  business: PublicBusiness,
  date = new Date(),
): BusinessHoursStatus {
  const schedule = scheduleForToday(business);

  if (!schedule) {
    return {
      isOpenNow: false,
      nextStatusLabel: "Horario no disponible",
      todayLabel: "Horario no disponible",
      tone: "unknown",
    };
  }

  if (schedule.is_closed) {
    return {
      isOpenNow: false,
      nextStatusLabel: "Cerrado hoy",
      todayLabel: "Cerrado hoy",
      tone: "closed",
    };
  }

  const opens = minutesFromTime(schedule.opens_at);
  const closes = minutesFromTime(schedule.closes_at);

  if (opens === null || closes === null) {
    return {
      isOpenNow: false,
      nextStatusLabel: "Horario no disponible",
      todayLabel: "Horario no disponible",
      tone: "unknown",
    };
  }

  const now = campusNow(date).minutes;
  const isOpenNow = isWithinSchedule(now, opens, closes);
  const closesIn = closes >= now ? closes - now : closes + 24 * 60 - now;
  const todayLabel = `Hoy ${formatTime(schedule.opens_at)} - ${formatTime(
    schedule.closes_at,
  )}`;

  if (isOpenNow) {
    return {
      isOpenNow: true,
      nextStatusLabel: closesIn <= 45 ? "Cierra pronto" : "Abierto ahora",
      todayLabel,
      tone: closesIn <= 45 ? "closing" : "open",
    };
  }

  if (opens > now) {
    return {
      isOpenNow: false,
      nextStatusLabel: `Abre hoy ${formatTime(schedule.opens_at)}`,
      todayLabel,
      tone: "closed",
    };
  }

  return {
    isOpenNow: false,
    nextStatusLabel: "Cerrado ahora",
    todayLabel,
    tone: "closed",
  };
}
