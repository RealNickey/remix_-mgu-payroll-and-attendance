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

export function getBillingCycleDates(year: number, month: number): Date[] {
  // month is 1-indexed (1 to 12)
  // Start date: 26th of month - 1
  const startMonth = month === 1 ? 11 : month - 2 // JS month is 0-indexed
  const startYear = month === 1 ? year - 1 : year
  const startDate = new Date(startYear, startMonth, 26)

  // End date: 25th of selected month
  const endMonth = month - 1 // JS month is 0-indexed
  const endDate = new Date(year, endMonth, 25)

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
