import { addDays, addMinutes, isBefore, startOfDay } from "date-fns";

/** Fixed visit length for conflict detection (matches product default). */
export const APPOINTMENT_DURATION_MINUTES = 30;

export type ScheduleBlockRow = {
  start_at: string;
  end_at: string;
  is_full_day: boolean;
};

export type BusyAppointment = {
  appt_id: number;
  date_time: string;
};

function parseTimeLabelTo24h(label: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim());
  if (!match) {
    throw new Error(`Invalid time label: ${label}`);
  }
  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const mer = match[3].toUpperCase();
  if (mer === "PM" && hour !== 12) hour += 12;
  if (mer === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

/** Combine a calendar day with a slot label like `9:00 AM` in the browser's local timezone. */
export function combineDayAndTimeLabel(day: Date, timeLabel: string): Date {
  const { hour, minute } = parseTimeLabelTo24h(timeLabel);
  const d = startOfDay(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function slotBlockedBySchedule(slotStart: Date, slotEnd: Date, blocks: ScheduleBlockRow[]): boolean {
  for (const block of blocks) {
    const bStart = new Date(block.start_at);
    const bEnd = new Date(block.end_at);
    if (intervalsOverlap(slotStart, slotEnd, bStart, bEnd)) {
      return true;
    }
  }
  return false;
}

function slotBlockedByOtherAppointments(
  slotStart: Date,
  slotEnd: Date,
  appointments: BusyAppointment[],
  excludeApptId?: number,
): boolean {
  for (const appt of appointments) {
    if (excludeApptId != null && appt.appt_id === excludeApptId) {
      continue;
    }
    const aStart = new Date(appt.date_time);
    const aEnd = addMinutes(aStart, APPOINTMENT_DURATION_MINUTES);
    if (intervalsOverlap(slotStart, slotEnd, aStart, aEnd)) {
      return true;
    }
  }
  return false;
}

export function getAvailableTimeSlotLabels(
  day: Date,
  allLabels: string[],
  blocks: ScheduleBlockRow[],
  scheduledAppointments: BusyAppointment[],
  excludeApptId?: number,
): string[] {
  return allLabels.filter((label) => {
    const slotStart = combineDayAndTimeLabel(day, label);
    const slotEnd = addMinutes(slotStart, APPOINTMENT_DURATION_MINUTES);
    if (slotBlockedBySchedule(slotStart, slotEnd, blocks)) {
      return false;
    }
    if (slotBlockedByOtherAppointments(slotStart, slotEnd, scheduledAppointments, excludeApptId)) {
      return false;
    }
    return true;
  });
}

/** Dates where `is_full_day` blocks apply — used for calendar styling + disabling whole days. */
export function getFullDayBlockedDates(blocks: ScheduleBlockRow[]): Date[] {
  const out: Date[] = [];
  for (const block of blocks) {
    if (!block.is_full_day) {
      continue;
    }
    const start = new Date(block.start_at);
    const end = new Date(block.end_at);
    let cursor = startOfDay(start);
    const endBoundary = startOfDay(end);
    while (isBefore(cursor, endBoundary)) {
      out.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
  }
  return out;
}

export function isWeekend(date: Date): boolean {
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}
