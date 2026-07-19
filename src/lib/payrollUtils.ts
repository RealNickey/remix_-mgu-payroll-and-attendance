import type { Contract } from "./types"

const wordsMap: Record<number, string> = {
  0: "Zero",
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
  10: "Ten",
  11: "Eleven",
  12: "Twelve",
  13: "Thirteen",
  14: "Fourteen",
  15: "Fifteen",
  16: "Sixteen",
  17: "Seventeen",
  18: "Eighteen",
  19: "Nineteen",
  20: "Twenty",
  21: "Twenty One",
  22: "Twenty Two",
  23: "Twenty Three",
  24: "Twenty Four",
  25: "Twenty Five",
  26: "Twenty Six",
  27: "Twenty Seven",
  28: "Twenty Eight",
  29: "Twenty Nine",
  30: "Thirty",
  31: "Thirty One",
}

export function daysToWords(days: number): string {
  const integerPart = Math.floor(days)
  const isHalf = days % 1 !== 0

  const intWord = wordsMap[integerPart] || String(integerPart)

  if (isHalf) {
    if (integerPart === 0) {
      return "Zero and a Half"
    }
    return `${intWord} and a Half`
  }
  return intWord
}

export function computeEndDate(startDateStr: string): string {
  if (!startDateStr) return ""
  const parts = startDateStr.split("-").map(Number)
  const start = new Date(parts[0], parts[1] - 1, parts[2])
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 89
  )

  const y = end.getFullYear()
  const m = String(end.getMonth() + 1).padStart(2, "0")
  const d = String(end.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function getContractStatus(
  startDateStr: string,
  endDateStr: string
): "Upcoming" | "Active" | "Expired" {
  const todayStr = formatDateKey(new Date())
  if (todayStr < startDateStr) {
    return "Upcoming"
  } else if (todayStr > endDateStr) {
    return "Expired"
  } else {
    return "Active"
  }
}

export function isDateCoveredByContract(
  contracts: Contract[],
  employeeId: string,
  dateStr: string
): boolean {
  return contracts.some(
    (c) =>
      c.employeeId === employeeId &&
      c.startDate <= dateStr &&
      dateStr <= c.endDate
  )
}

export function doIntervalsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 <= end2 && end1 >= start2
}

export function getBillingCycleDates(
  year: number,
  month: number,
  startDay: number = 26,
  endDay: number = 25
): Date[] {
  // month is 1-indexed (1 to 12)
  const endMonthIndex = month - 1 // JS month is 0-indexed

  let startDate: Date
  let endDate: Date

  if (startDay === 1 && (endDay >= 28 || endDay === 0 || endDay === 31)) {
    // Standard full calendar month (1st to last day of selected month)
    startDate = new Date(year, endMonthIndex, 1)
    endDate = new Date(year, endMonthIndex + 1, 0)
  } else if (startDay > endDay) {
    // Cross-month cycle (e.g. 26th of previous month to 25th of current month)
    const startMonthIndex = month === 1 ? 11 : month - 2
    const startYear = month === 1 ? year - 1 : year
    startDate = new Date(startYear, startMonthIndex, startDay)
    endDate = new Date(year, endMonthIndex, endDay)
  } else {
    // Same-month cycle (e.g. 1st to 20th of current month)
    startDate = new Date(year, endMonthIndex, startDay)
    endDate = new Date(year, endMonthIndex, endDay)
  }

  const dates: Date[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}


export function formatIndianRupees(amount: number): string {
  const fixedAmount = amount.toFixed(2)
  const parts = fixedAmount.split(".")
  let numStr = parts[0]
  const decStr = parts[1]

  let lastThree = numStr.substring(numStr.length - 3)
  const otherParts = numStr.substring(0, numStr.length - 3)
  if (otherParts !== "") {
    lastThree = "," + lastThree
  }
  const formattedInt =
    otherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree
  return `Rs. ${formattedInt}.${decStr}`
}

export function getEmployeeInitials(name: string): string {
  if (!name) return ""
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z]/g, "")[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
}

export function getContractDurationDays(
  startDateStr: string,
  endDateStr: string
): number {
  if (!startDateStr || !endDateStr) return 0
  const startParts = startDateStr.split("-").map(Number)
  const endParts = endDateStr.split("-").map(Number)
  const start = new Date(startParts[0], startParts[1] - 1, startParts[2])
  const end = new Date(endParts[0], endParts[1] - 1, endParts[2])
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

export function isValidContractDuration(
  startDateStr: string,
  endDateStr: string,
  maxDays: number = 90
): boolean {
  const duration = getContractDurationDays(startDateStr, endDateStr)
  return duration >= 1 && duration <= maxDays
}

export function validateConsecutiveContractsGap(
  c1EndStr: string,
  c2StartStr: string
): { isValid: boolean; gapDays: number } {
  if (!c1EndStr || !c2StartStr) return { isValid: false, gapDays: 0 }
  const c1Parts = c1EndStr.split("-").map(Number)
  const c2Parts = c2StartStr.split("-").map(Number)
  const c1End = new Date(c1Parts[0], c1Parts[1] - 1, c1Parts[2])
  const c2Start = new Date(c2Parts[0], c2Parts[1] - 1, c2Parts[2])
  const diffTime = c2Start.getTime() - c1End.getTime()
  const gapDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) - 1
  return {
    isValid: gapDays >= 1,
    gapDays,
  }
}

