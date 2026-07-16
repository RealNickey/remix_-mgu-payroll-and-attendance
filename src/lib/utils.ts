import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addDays, eachDayOfInterval, endOfMonth, format, parse, startOfMonth } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBillingCycleDates(year: number, month: number) {
  // month is 1-12
  // Billing cycle for month X is 26th of month X-1 to 25th of month X.
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const startDateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-26`;
  const endDateStr = `${year}-${String(month).padStart(2, '0')}-25`;

  const startDate = parse(startDateStr, 'yyyy-MM-dd', new Date());
  const endDate = parse(endDateStr, 'yyyy-MM-dd', new Date());

  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  return {
    startDate,
    endDate,
    startDateStr,
    endDateStr,
    dates: dates.map(d => format(d, 'yyyy-MM-dd'))
  };
}

export function getCalendarMonthDates(year: number, month: number) {
  const start = parse(`${year}-${String(month).padStart(2, '0')}-01`, 'yyyy-MM-dd', new Date());
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}

export function generateSequence(length: number) {
  return Array.from({ length }, (_, i) => i + 1);
}
