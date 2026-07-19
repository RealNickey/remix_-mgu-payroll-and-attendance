import { describe, it, expect } from "vitest"
import {
  computeEndDate,
  formatDateKey,
  getContractStatus,
  isDateCoveredByContract,
  doIntervalsOverlap,
  getBillingCycleDates,
  formatIndianRupees,
  daysToWords,
  getEmployeeInitials,
  getContractDurationDays,
  isValidContractDuration,
  validateConsecutiveContractsGap,
} from "../payrollUtils"
import type {
  Employee,
  Contract,
  AttendanceData,
  WageSettings,
} from "../types"

// Default settings as defined in business rules
const defaultSettings: WageSettings = {
  wageRates: {
    Gardeners: 525,
    Drivers: 700,
    Cooks: 645,
    Helpers: 525,
  },
  otRates: {
    Gardeners: 0,
    Drivers: 100,
    Cooks: 100,
    Helpers: 100,
  },
  otCeilings: {
    Gardeners: 0,
    Drivers: 2000,
    Cooks: Number.POSITIVE_INFINITY,
    Helpers: Number.POSITIVE_INFINITY,
  },
  section: "Ad.B5",
}

// Pure implementation of calculatePayroll matching db.tsx for test verification
function calculatePayrollTest(
  employees: Employee[],
  contracts: Contract[],
  attendance: AttendanceData,
  settings: WageSettings,
  year: number,
  month: number
) {
  const dates = getBillingCycleDates(year, month)
  if (dates.length === 0) return []

  const cycleStartDateStr = formatDateKey(dates[0])
  const cycleEndDateStr = formatDateKey(dates[dates.length - 1])

  const results: any[] = []

  employees.forEach((emp) => {
    const empContracts = contracts.filter((c) => c.employeeId === emp.id)

    const hasOverlappingContract = empContracts.some((c) =>
      doIntervalsOverlap(
        c.startDate,
        c.endDate,
        cycleStartDateStr,
        cycleEndDateStr
      )
    )

    if (!hasOverlappingContract) return

    let regularDays = 0
    let otDays = 0
    let holidayDays = 0

    const empAttendance = attendance[emp.id] || {}

    dates.forEach((date) => {
      const dateStr = formatDateKey(date)

      const isCovered = empContracts.some(
        (c) => c.startDate <= dateStr && dateStr <= c.endDate
      )
      if (!isCovered) return

      const record = empAttendance[dateStr]
      if (!record) return

      if (record.fn) regularDays += 0.5
      if (record.an) regularDays += 0.5
      if (record.ot && record.fn && record.an) otDays += 1
      if (record.holiday && (record.fn || record.an)) holidayDays += 1
    })

    if (regularDays === 0) return

    const relevantContract =
      empContracts.length > 0
        ? empContracts[empContracts.length - 1]
        : undefined

    const baseRate = settings.wageRates[emp.category] || 0
    const regularPay = regularDays * baseRate

    const otRate = settings.otRates?.[emp.category] ?? settings.otRate ?? 0
    const otCeiling =
      settings.otCeilings?.[emp.category] ?? defaultSettings.otCeilings[emp.category]
    let otPay = otDays * otRate
    if (otPay > otCeiling) {
      otPay = otCeiling
    }
    const totalPay = regularPay + otPay

    results.push({
      employeeId: emp.id,
      name: emp.name,
      category: emp.category,
      bankAccount: emp.bankAccount,
      regularDays,
      otDays,
      holidayDays,
      regularPay,
      otPay,
      totalPay,
      relevantContract,
    })
  })

  return results
}

// -----------------------------------------------------------------------------
// 1. PAYMENT CALCULATION TESTS
// -----------------------------------------------------------------------------
describe("1. Payment Calculation Tests", () => {
  const empGardener: Employee = { id: "e1", name: "Ramesh", category: "Gardeners", bankAccount: "123" }
  const empDriver: Employee = { id: "e2", name: "Suresh", category: "Drivers", bankAccount: "456" }
  const empCook: Employee = { id: "e3", name: "Anitha", category: "Cooks", bankAccount: "789" }
  const empHelper: Employee = { id: "e4", name: "Kiran", category: "Helpers", bankAccount: "101" }

  const contractJul: Contract = {
    id: "c1",
    employeeId: "e1",
    startDate: "2026-06-26",
    endDate: "2026-07-25",
    goNumber: "GO/101",
    goDate: "2026-06-25",
  }

  it("PC-001: Gardener full month (30 days @ ₹525)", () => {
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e1: {} }
    dates.forEach((d) => { att.e1[formatDateKey(d)] = { fn: true, an: true, ot: false, holiday: false } })
    const res = calculatePayrollTest([empGardener], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(30)
    expect(res[0].regularPay).toBe(30 * 525) // 15,750
  })

  it("PC-002: Driver full month (30 days @ ₹700)", () => {
    const c2 = { ...contractJul, employeeId: "e2" }
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e2: {} }
    dates.forEach((d) => { att.e2[formatDateKey(d)] = { fn: true, an: true, ot: false, holiday: false } })
    const res = calculatePayrollTest([empDriver], [c2], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(30)
    expect(res[0].regularPay).toBe(30 * 700) // 21,000
  })

  it("PC-003: Cook full month (30 days @ ₹645)", () => {
    const c3 = { ...contractJul, employeeId: "e3" }
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e3: {} }
    dates.forEach((d) => { att.e3[formatDateKey(d)] = { fn: true, an: true, ot: false, holiday: false } })
    const res = calculatePayrollTest([empCook], [c3], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(30)
    expect(res[0].regularPay).toBe(30 * 645) // 19,350
  })

  it("PC-004: Helper full month (30 days @ ₹525)", () => {
    const c4 = { ...contractJul, employeeId: "e4" }
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e4: {} }
    dates.forEach((d) => { att.e4[formatDateKey(d)] = { fn: true, an: true, ot: false, holiday: false } })
    const res = calculatePayrollTest([empHelper], [c4], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(30)
    expect(res[0].regularPay).toBe(30 * 525) // 15,750
  })

  it("PC-005: Partial month (15 days Driver @ ₹700)", () => {
    const c2 = { ...contractJul, employeeId: "e2" }
    const dates = getBillingCycleDates(2026, 7).slice(0, 15)
    const att: AttendanceData = { e2: {} }
    dates.forEach((d) => { att.e2[formatDateKey(d)] = { fn: true, an: true, ot: false, holiday: false } })
    const res = calculatePayrollTest([empDriver], [c2], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(15)
    expect(res[0].regularPay).toBe(15 * 700) // 10,500
  })

  it("PC-006: Single day worked (Cook @ ₹645)", () => {
    const c3 = { ...contractJul, employeeId: "e3" }
    const att: AttendanceData = { e3: { "2026-07-01": { fn: true, an: true, ot: false, holiday: false } } }
    const res = calculatePayrollTest([empCook], [c3], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(1)
    expect(res[0].regularPay).toBe(645)
  })

  it("PC-007: Half day FN only (Helper @ ₹525)", () => {
    const c4 = { ...contractJul, employeeId: "e4" }
    const att: AttendanceData = { e4: { "2026-07-01": { fn: true, an: false, ot: false, holiday: false } } }
    const res = calculatePayrollTest([empHelper], [c4], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(0.5)
    expect(res[0].regularPay).toBe(262.5)
  })

  it("PC-008: Half day AN only (Gardener @ ₹525)", () => {
    const att: AttendanceData = { e1: { "2026-07-01": { fn: false, an: true, ot: false, holiday: false } } }
    const res = calculatePayrollTest([empGardener], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(0.5)
    expect(res[0].regularPay).toBe(262.5)
  })

  it("PC-009: Mix of full and half days (11.5 days Driver @ ₹700)", () => {
    const c2 = { ...contractJul, employeeId: "e2" }
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e2: {} }
    // 10 full days
    dates.slice(0, 10).forEach((d) => { att.e2[formatDateKey(d)] = { fn: true, an: true, ot: false, holiday: false } })
    // 3 FN-only days
    dates.slice(10, 13).forEach((d) => { att.e2[formatDateKey(d)] = { fn: true, an: false, ot: false, holiday: false } })
    const res = calculatePayrollTest([empDriver], [c2], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(11.5)
    expect(res[0].regularPay).toBe(11.5 * 700) // 8,050
  })

  it("PC-010: Zero attendance excluded from output", () => {
    const att: AttendanceData = { e1: {} }
    const res = calculatePayrollTest([empGardener], [contractJul], att, defaultSettings, 2026, 7)
    expect(res.length).toBe(0)
  })

  it("PC-011: Attendance marked outside contract dates is ignored", () => {
    const shortContract: Contract = { ...contractJul, startDate: "2026-07-01", endDate: "2026-07-10" }
    const att: AttendanceData = {
      e1: {
        "2026-06-28": { fn: true, an: true, ot: false, holiday: false }, // outside contract
        "2026-07-05": { fn: true, an: true, ot: false, holiday: false }, // inside contract
      },
    }
    const res = calculatePayrollTest([empGardener], [shortContract], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(1)
  })

  it("PC-012: Deleted employee not included in output", () => {
    const att: AttendanceData = { e1: { "2026-07-01": { fn: true, an: true, ot: false, holiday: false } } }
    // passing empty employee array
    const res = calculatePayrollTest([], [contractJul], att, defaultSettings, 2026, 7)
    expect(res.length).toBe(0)
  })

  it("PC-016: Attendance outside billing cycle ignored", () => {
    const longContract: Contract = { ...contractJul, startDate: "2026-05-01", endDate: "2026-08-31" }
    const att: AttendanceData = {
      e1: {
        "2026-05-15": { fn: true, an: true, ot: false, holiday: false }, // May (outside July cycle)
        "2026-07-01": { fn: true, an: true, ot: false, holiday: false }, // July cycle
      },
    }
    const res = calculatePayrollTest([empGardener], [longContract], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(1)
  })

  it("PC-018: Two non-overlapping contracts in cycle aggregated", () => {
    const c1: Contract = { id: "c1", employeeId: "e1", startDate: "2026-06-26", endDate: "2026-07-05", goNumber: "G1", goDate: "2026-06-25" }
    const c2: Contract = { id: "c2", employeeId: "e1", startDate: "2026-07-10", endDate: "2026-07-25", goNumber: "G2", goDate: "2026-07-09" }
    const att: AttendanceData = {
      e1: {
        "2026-07-01": { fn: true, an: true, ot: false, holiday: false }, // covered by c1
        "2026-07-15": { fn: true, an: true, ot: false, holiday: false }, // covered by c2
      },
    }
    const res = calculatePayrollTest([empGardener], [c1, c2], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(2)
    expect(res[0].relevantContract?.id).toBe("c2") // last added
  })
})

// -----------------------------------------------------------------------------
// 2. OVERTIME CALCULATION TESTS
// -----------------------------------------------------------------------------
describe("2. Overtime Calculation Tests", () => {
  const empDriver: Employee = { id: "e2", name: "Suresh", category: "Drivers", bankAccount: "456" }
  const empCook: Employee = { id: "e3", name: "Anitha", category: "Cooks", bankAccount: "789" }
  const empGardener: Employee = { id: "e1", name: "Ramesh", category: "Gardeners", bankAccount: "123" }
  const contractJul: Contract = { id: "c1", employeeId: "e2", startDate: "2026-06-26", endDate: "2026-07-25", goNumber: "GO/101", goDate: "2026-06-25" }

  it("OT-001: Driver OT 10 days below ceiling (10 × 100 = 1,000)", () => {
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e2: {} }
    dates.forEach((d, i) => { att.e2[formatDateKey(d)] = { fn: true, an: true, ot: i < 10, holiday: false } })
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].otDays).toBe(10)
    expect(res[0].otPay).toBe(1000)
  })

  it("OT-002: Driver OT exactly at ceiling (20 days × 100 = 2,000)", () => {
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e2: {} }
    dates.forEach((d, i) => { att.e2[formatDateKey(d)] = { fn: true, an: true, ot: i < 20, holiday: false } })
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].otDays).toBe(20)
    expect(res[0].otPay).toBe(2000)
  })

  it("OT-003: Driver OT exceeds ceiling (30 days × 100 = 3,000 -> capped at 2,000)", () => {
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e2: {} }
    dates.forEach((d) => { att.e2[formatDateKey(d)] = { fn: true, an: true, ot: true, holiday: false } })
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].otDays).toBe(30)
    expect(res[0].otPay).toBe(2000)
  })

  it("OT-004: Cook OT with no ceiling (30 days × 100 = 3,000 uncapped)", () => {
    const c3 = { ...contractJul, employeeId: "e3" }
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e3: {} }
    dates.forEach((d) => { att.e3[formatDateKey(d)] = { fn: true, an: true, ot: true, holiday: false } })
    const res = calculatePayrollTest([empCook], [c3], att, defaultSettings, 2026, 7)
    expect(res[0].otDays).toBe(30)
    expect(res[0].otPay).toBe(3000)
  })

  it("OT-007: Gardener OT rate = 0 (10 OT days -> 0 OT pay)", () => {
    const c1 = { ...contractJul, employeeId: "e1" }
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e1: {} }
    dates.forEach((d, i) => { att.e1[formatDateKey(d)] = { fn: true, an: true, ot: i < 10, holiday: false } })
    const res = calculatePayrollTest([empGardener], [c1], att, defaultSettings, 2026, 7)
    expect(res[0].otDays).toBe(10)
    expect(res[0].otPay).toBe(0)
  })

  it("OT-011: OT marked without full day (FN+AN) is NOT counted", () => {
    const att: AttendanceData = {
      e2: {
        "2026-07-01": { fn: true, an: true, ot: false, holiday: false }, // regular day
        "2026-07-02": { fn: false, an: false, ot: true, holiday: false }, // OT marked but absent -> 0 OT
        "2026-07-03": { fn: true, an: false, ot: true, holiday: false }, // OT marked but half day -> 0 OT
        "2026-07-04": { fn: true, an: true, ot: true, holiday: false }, // OT marked with full day -> 1 OT
      },
    }
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(2.5) // 1.0 + 0 + 0.5 + 1.0
    expect(res[0].otDays).toBe(1) // only 2026-07-04 has FN+AN+OT
    expect(res[0].otPay).toBe(100)
  })
})

// -----------------------------------------------------------------------------
// 3. ATTENDANCE & HOLIDAY COMBINATIONS
// -----------------------------------------------------------------------------
describe("3. Attendance Record Combinations", () => {
  const empDriver: Employee = { id: "e2", name: "Suresh", category: "Drivers", bankAccount: "456" }
  const contractJul: Contract = { id: "c1", employeeId: "e2", startDate: "2026-06-26", endDate: "2026-07-25", goNumber: "G1", goDate: "2026-06-25" }

  it("AT-006 & AT-007: OT marked on half-day or absent day is NOT applicable for OT pay", () => {
    const att: AttendanceData = {
      e2: {
        "2026-07-01": { fn: true, an: false, ot: true, holiday: false }, // Half-day + OT -> OT not applicable
        "2026-07-02": { fn: false, an: false, ot: true, holiday: false }, // Absent + OT -> OT not applicable
        "2026-07-03": { fn: true, an: true, ot: false, holiday: false }, // Full day regular
      },
    }
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(1.5) // 0.5 + 0 + 1.0
    expect(res[0].otDays).toBe(0) // Neither half-day nor absent day generates OT
    expect(res[0].otPay).toBe(0)
  })

  it("AT-008: Holiday pay is calculated at standard regular rate (same pay as normal day)", () => {
    const att: AttendanceData = {
      e2: {
        "2026-07-01": { fn: true, an: true, ot: false, holiday: true }, // Full day on holiday
        "2026-07-02": { fn: true, an: true, ot: false, holiday: false }, // Normal full day
      },
    }
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(2)
    expect(res[0].holidayDays).toBe(1)
    expect(res[0].regularPay).toBe(2 * 700) // Standard 700/day for both normal and holiday days
  })

  it("AT-009: Holiday without attendance (fn=false, an=false, holiday=true) -> holiday NOT counted", () => {
    const att: AttendanceData = {
      e2: {
        "2026-07-01": { fn: true, an: true, ot: false, holiday: false }, // regular day so employee has regularDays > 0
        "2026-07-02": { fn: false, an: false, ot: false, holiday: true }, // holiday only
      },
    }
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(1)
    expect(res[0].holidayDays).toBe(0)
  })

  it("AT-010 & AT-011: Holiday with half-day attendance -> holiday counted", () => {
    const att: AttendanceData = {
      e2: {
        "2026-07-01": { fn: true, an: false, ot: false, holiday: true }, // FN half day on holiday
        "2026-07-02": { fn: false, an: true, ot: false, holiday: true }, // AN half day on holiday
      },
    }
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(1)
    expect(res[0].holidayDays).toBe(2)
  })

  it("AT-012: All flags true (fn, an, ot, holiday) -> regular=1, ot=1, holiday=1", () => {
    const att: AttendanceData = { e2: { "2026-07-01": { fn: true, an: true, ot: true, holiday: true } } }
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].regularDays).toBe(1)
    expect(res[0].otDays).toBe(1)
    expect(res[0].holidayDays).toBe(1)
  })
})

// -----------------------------------------------------------------------------
// 4. CONTRACT DURATION TESTS
// -----------------------------------------------------------------------------
describe("4. Contract Duration Tests", () => {
  it("CD-001: Standard 90-day contract end date calculation", () => {
    expect(computeEndDate("2026-01-01")).toBe("2026-03-31")
    expect(getContractDurationDays("2026-01-01", "2026-03-31")).toBe(90)
    expect(isValidContractDuration("2026-01-01", "2026-03-31")).toBe(true)
  })

  it("CD-002: 1-day short contract", () => {
    expect(getContractDurationDays("2026-06-15", "2026-06-15")).toBe(1)
    expect(isValidContractDuration("2026-06-15", "2026-06-15")).toBe(true)
  })

  it("CD-003: 30-day contract", () => {
    expect(getContractDurationDays("2026-03-01", "2026-03-30")).toBe(30)
    expect(isValidContractDuration("2026-03-01", "2026-03-30")).toBe(true)
  })

  it("CD-007: 91-day contract fails 90-day validation limit", () => {
    expect(getContractDurationDays("2026-01-01", "2026-04-01")).toBe(91)
    expect(isValidContractDuration("2026-01-01", "2026-04-01")).toBe(false)
  })

  it("CD-009: Negative duration (end before start) fails validation", () => {
    expect(isValidContractDuration("2026-06-15", "2026-06-10")).toBe(false)
  })

  it("CD-012: Contract spanning year boundary (2026-12-01 to 2027-02-28)", () => {
    expect(computeEndDate("2026-12-01")).toBe("2027-02-28")
    expect(getContractDurationDays("2026-12-01", "2027-02-28")).toBe(90)
  })

  it("CD-013: Contract spanning leap year Feb 29 (2028-02-01)", () => {
    expect(computeEndDate("2028-02-01")).toBe("2028-04-30")
    expect(getContractDurationDays("2028-02-01", "2028-04-30")).toBe(90)
  })
})

// -----------------------------------------------------------------------------
// 5. CONSECUTIVE CONTRACTS TESTS
// -----------------------------------------------------------------------------
describe("5. Consecutive Contracts Tests", () => {
  it("CC-001: 1-day gap between contracts is valid", () => {
    const val = validateConsecutiveContractsGap("2026-03-31", "2026-04-02")
    expect(val.isValid).toBe(true)
    expect(val.gapDays).toBe(1)
  })

  it("CC-005: Adjacent contracts (0-day gap) is invalid", () => {
    const val = validateConsecutiveContractsGap("2026-03-31", "2026-04-01")
    expect(val.isValid).toBe(false)
    expect(val.gapDays).toBe(0)
  })

  it("CC-008 & CC-009: Overlapping contracts overlap check", () => {
    expect(doIntervalsOverlap("2026-01-01", "2026-03-31", "2026-03-01", "2026-05-29")).toBe(true)
    expect(doIntervalsOverlap("2026-01-01", "2026-03-31", "2026-03-31", "2026-06-28")).toBe(true)
    expect(doIntervalsOverlap("2026-01-01", "2026-03-31", "2026-04-02", "2026-06-30")).toBe(false)
  })
})

// -----------------------------------------------------------------------------
// 6. BILLING CYCLE TESTS
// -----------------------------------------------------------------------------
describe("6. Billing Cycle Tests", () => {
  it("BC-001: January cycle starts Dec 26 of previous year", () => {
    const dates = getBillingCycleDates(2026, 1)
    expect(formatDateKey(dates[0])).toBe("2025-12-26")
    expect(formatDateKey(dates[dates.length - 1])).toBe("2026-01-25")
  })

  it("BC-002: July cycle starts June 26 to July 25", () => {
    const dates = getBillingCycleDates(2026, 7)
    expect(formatDateKey(dates[0])).toBe("2026-06-26")
    expect(formatDateKey(dates[dates.length - 1])).toBe("2026-07-25")
    expect(dates.length).toBe(30)
  })

  it("BC-005: Leap year March cycle includes Feb 29", () => {
    const dates = getBillingCycleDates(2028, 3)
    const feb29Str = formatDateKey(new Date(2028, 1, 29))
    const hasFeb29 = dates.some((d) => formatDateKey(d) === feb29Str)
    expect(hasFeb29).toBe(true)
  })
})

// -----------------------------------------------------------------------------
// 7. TOTAL PAY CALCULATION TESTS
// -----------------------------------------------------------------------------
describe("7. Total Pay Calculation Tests", () => {
  const empDriver: Employee = { id: "e2", name: "Suresh", category: "Drivers", bankAccount: "456" }
  const empCook: Employee = { id: "e3", name: "Anitha", category: "Cooks", bankAccount: "789" }

  const contractJul: Contract = { id: "c1", employeeId: "e2", startDate: "2026-06-26", endDate: "2026-07-25", goNumber: "G1", goDate: "2026-06-25" }

  it("TP-001: Driver (25 regular days @ 700 + 10 OT days @ 100 = 17500 + 1000 = 18500)", () => {
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e2: {} }
    dates.slice(0, 25).forEach((d, i) => {
      att.e2[formatDateKey(d)] = { fn: true, an: true, ot: i < 10, holiday: false }
    })
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].regularPay).toBe(17500)
    expect(res[0].otPay).toBe(1000)
    expect(res[0].totalPay).toBe(18500)
  })

  it("TP-006: Driver with 30 OT days capped at ₹2,000 ceiling (21,000 + 2,000 = 23,000)", () => {
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e2: {} }
    dates.forEach((d) => {
      att.e2[formatDateKey(d)] = { fn: true, an: true, ot: true, holiday: false }
    })
    const res = calculatePayrollTest([empDriver], [contractJul], att, defaultSettings, 2026, 7)
    expect(res[0].regularPay).toBe(21000)
    expect(res[0].otPay).toBe(2000) // capped
    expect(res[0].totalPay).toBe(23000)
  })

  it("TP-002: Cook with 30 OT days uncapped (19,350 + 3,000 = 22,350)", () => {
    const c3 = { ...contractJul, employeeId: "e3" }
    const dates = getBillingCycleDates(2026, 7)
    const att: AttendanceData = { e3: {} }
    dates.forEach((d) => {
      att.e3[formatDateKey(d)] = { fn: true, an: true, ot: true, holiday: false }
    })
    const res = calculatePayrollTest([empCook], [c3], att, defaultSettings, 2026, 7)
    expect(res[0].regularPay).toBe(19350)
    expect(res[0].otPay).toBe(3000) // no cap
    expect(res[0].totalPay).toBe(22350)
  })
})

// -----------------------------------------------------------------------------
// 8. UTILITY & EDGE CASE TESTS
// -----------------------------------------------------------------------------
describe("8. Utility & Formatting Edge Cases", () => {
  it("EC-021 through EC-026: formatIndianRupees formatting", () => {
    expect(formatIndianRupees(0)).toBe("Rs. 0.00")
    expect(formatIndianRupees(525)).toBe("Rs. 525.00")
    expect(formatIndianRupees(1000)).toBe("Rs. 1,000.00")
    expect(formatIndianRupees(100000)).toBe("Rs. 1,00,000.00")
    expect(formatIndianRupees(1234567.89)).toBe("Rs. 12,34,567.89")
  })

  it("EC-027 through EC-031: daysToWords conversion", () => {
    expect(daysToWords(0)).toBe("Zero")
    expect(daysToWords(1)).toBe("One")
    expect(daysToWords(31)).toBe("Thirty One")
    expect(daysToWords(0.5)).toBe("Zero and a Half")
    expect(daysToWords(15.5)).toBe("Fifteen and a Half")
  })

  it("getEmployeeInitials helper", () => {
    expect(getEmployeeInitials("Ramesh Kumar")).toBe("RK")
    expect(getEmployeeInitials("Suresh")).toBe("S")
    expect(getEmployeeInitials("")).toBe("")
  })
})

// -----------------------------------------------------------------------------
// 9. CONTRACT VALIDATION BUSINESS LOGIC TESTS
// -----------------------------------------------------------------------------
describe("9. Contract Validation Business Rules", () => {
  function validateNewContract(
    existingContracts: Contract[],
    employeeId: string,
    startDate: string,
    endDate: string
  ): { success: boolean; error?: string } {
    const duration = getContractDurationDays(startDate, endDate)
    if (duration > 90) {
      return { success: false, error: "Contract duration exceeds maximum period of 90 days." }
    }
    if (duration < 1) {
      return { success: false, error: "Contract end date must be on or after start date." }
    }

    const empContracts = existingContracts.filter((c) => c.employeeId === employeeId)
    for (const c of empContracts) {
      if (doIntervalsOverlap(c.startDate, c.endDate, startDate, endDate)) {
        return { success: false, error: "Contract dates overlap with an existing contract." }
      }
      if (c.endDate < startDate) {
        const gap = validateConsecutiveContractsGap(c.endDate, startDate)
        if (!gap.isValid) {
          return { success: false, error: "Must have at least 1 full-day gap between contracts." }
        }
      }
      if (endDate < c.startDate) {
        const gap = validateConsecutiveContractsGap(endDate, c.startDate)
        if (!gap.isValid) {
          return { success: false, error: "Must have at least 1 full-day gap between contracts." }
        }
      }
    }
    return { success: true }
  }

  const existing: Contract = {
    id: "c1",
    employeeId: "e1",
    startDate: "2026-01-01",
    endDate: "2026-03-31", // 90 days
    goNumber: "GO/1",
    goDate: "2025-12-30",
  }

  it("CD-VAL-001: Duration exceeding 90 days (91 days) is rejected", () => {
    const res = validateNewContract([], "e1", "2026-01-01", "2026-04-01")
    expect(res.success).toBe(false)
    expect(res.error).toContain("exceeds maximum period of 90 days")
  })

  it("CD-VAL-002: Duration <= 90 days is accepted", () => {
    const res = validateNewContract([], "e1", "2026-01-01", "2026-03-31")
    expect(res.success).toBe(true)
  })

  it("CC-VAL-001: Overlapping contract dates rejected", () => {
    const res = validateNewContract([existing], "e1", "2026-03-15", "2026-06-12")
    expect(res.success).toBe(false)
    expect(res.error).toContain("overlap")
  })

  it("CC-VAL-002: Adjacent contract with 0-day gap (starts 2026-04-01) rejected", () => {
    const res = validateNewContract([existing], "e1", "2026-04-01", "2026-06-29")
    expect(res.success).toBe(false)
    expect(res.error).toContain("at least 1 full-day gap")
  })

  it("CC-VAL-003: Consecutive contract with 1-day gap (starts 2026-04-02) accepted", () => {
    const res = validateNewContract([existing], "e1", "2026-04-02", "2026-06-30")
    expect(res.success).toBe(true)
  })
})

