import { BadRequestException } from '@nestjs/common';

/**
 * Parses a time string (e.g., "10:00 AM", "1:00 PM", "10:00", "13:00", "2 PM")
 * into total minutes from midnight (0..1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') {
    throw new BadRequestException('Time string is required');
  }

  const trimmed = timeStr.trim();
  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const period = ampmMatch[3].toUpperCase();

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      throw new BadRequestException(
        `Invalid time value: "${timeStr}". Hour must be 1-12 and minutes 0-59.`,
      );
    }

    if (period === 'PM' && hour < 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    return hour * 60 + minute;
  }

  const militaryMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    const hour = parseInt(militaryMatch[1], 10);
    const minute = parseInt(militaryMatch[2], 10);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new BadRequestException(
        `Invalid time value: "${timeStr}". Hour must be 0-23 and minutes 0-59.`,
      );
    }

    return hour * 60 + minute;
  }

  throw new BadRequestException(
    `Invalid time format: "${timeStr}". Use "HH:mm" (e.g., "10:00") or "hh:mm AM/PM" (e.g., "10:00 AM").`,
  );
}

/**
 * Formats total minutes into "HH:mm" standard 24-hour string.
 */
export function formatMinutesToHHMM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}`;
}

/**
 * Normalizes any valid time string into standard "HH:mm" format.
 */
export function normalizeTimeString(timeStr: string): string {
  const minutes = parseTimeToMinutes(timeStr);
  return formatMinutesToHHMM(minutes);
}

/**
 * Validates that startTime is strictly before endTime.
 */
export function validateTimeRange(
  startTimeStr: string,
  endTimeStr: string,
): { startMinutes: number; endMinutes: number } {
  const startMinutes = parseTimeToMinutes(startTimeStr);
  const endMinutes = parseTimeToMinutes(endTimeStr);

  if (startMinutes >= endMinutes) {
    throw new BadRequestException(
      `Invalid time range: startTime (${startTimeStr}) must be strictly before endTime (${endTimeStr}).`,
    );
  }

  return { startMinutes, endMinutes };
}

/**
 * Checks whether two time intervals [startA, endA) and [startB, endB) overlap.
 */
export function isOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const minA = parseTimeToMinutes(startA);
  const maxA = parseTimeToMinutes(endA);
  const minB = parseTimeToMinutes(startB);
  const maxB = parseTimeToMinutes(endB);

  return minA < maxB && minB < maxA;
}

/**
 * Normalizes day of week to Capitalized form e.g. "Monday".
 */
export function normalizeDayOfWeek(day: string): string {
  if (!day || typeof day !== 'string') {
    throw new BadRequestException('Day of week is required');
  }
  const canonicalDays: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  const lower = day.trim().toLowerCase();
  if (!canonicalDays[lower]) {
    throw new BadRequestException(
      `Invalid day of week: "${day}". Expected one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.`,
    );
  }

  return canonicalDays[lower];
}

/**
 * Validates ISO date format YYYY-MM-DD.
 */
export function validateAndFormatDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new BadRequestException('Date is required');
  }

  const trimmed = dateStr.trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(trimmed)) {
    throw new BadRequestException(
      `Invalid date format: "${dateStr}". Expected YYYY-MM-DD (e.g., "2026-06-15").`,
    );
  }

  const dateObj = new Date(trimmed);
  if (isNaN(dateObj.getTime())) {
    throw new BadRequestException(`Invalid date: "${dateStr}".`);
  }

  // Ensure parts match ISO format components (prevents 2026-02-31 turning into 2026-03-03)
  const [year, month, day] = trimmed.split('-').map((s) => parseInt(s, 10));
  if (
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() + 1 !== month ||
    dateObj.getUTCDate() !== day
  ) {
    throw new BadRequestException(`Invalid date calendar day: "${dateStr}".`);
  }

  return trimmed;
}

/**
 * Returns canonical day of week (e.g., "Monday") for a given date YYYY-MM-DD.
 */
export function getDayOfWeekFromDate(dateStr: string): string {
  const formattedDate = validateAndFormatDate(dateStr);
  const [year, month, day] = formattedDate
    .split('-')
    .map((s) => parseInt(s, 10));
  const dateObj = new Date(Date.UTC(year, month - 1, day));

  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  return dayNames[dateObj.getUTCDay()];
}

/**
 * Generates discrete stream slots from start time to end time with slot duration and optional buffer.
 */
export function generateStreamSlots(
  startTimeStr: string,
  endTimeStr: string,
  slotDurationMinutes: number,
  bufferTimeMinutes: number = 0,
): { startTime: string; endTime: string }[] {
  if (slotDurationMinutes <= 0) {
    throw new BadRequestException(
      `Invalid slot duration: ${slotDurationMinutes}. Slot duration must be greater than 0.`,
    );
  }
  if (bufferTimeMinutes < 0) {
    throw new BadRequestException(
      `Invalid buffer time: ${bufferTimeMinutes}. Buffer time cannot be negative.`,
    );
  }

  const { startMinutes, endMinutes } = validateTimeRange(
    startTimeStr,
    endTimeStr,
  );
  const totalWindow = endMinutes - startMinutes;

  if (slotDurationMinutes > totalWindow) {
    throw new BadRequestException(
      `Invalid slot duration: ${slotDurationMinutes} mins exceeds total window duration of ${totalWindow} mins.`,
    );
  }

  const slots: { startTime: string; endTime: string }[] = [];
  let currentStart = startMinutes;

  while (currentStart + slotDurationMinutes <= endMinutes) {
    const currentEnd = currentStart + slotDurationMinutes;
    slots.push({
      startTime: formatMinutesToHHMM(currentStart),
      endTime: formatMinutesToHHMM(currentEnd),
    });
    currentStart = currentEnd + bufferTimeMinutes;
  }

  return slots;
}
