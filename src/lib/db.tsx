import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import type {
  Employee,
  Contract,
  AttendanceData,
  WageSettings,
  JobCategory,
  AttendanceRecord,
} from "./types"
import {
  getBillingCycleDates,
  formatDateKey,
  isDateCoveredByContract,
  doIntervalsOverlap,
} from "./payrollUtils"

interface MguDbContextType {
  employees: Employee[]
  contracts: Contract[]
  attendance: AttendanceData
  settings: WageSettings
  addEmployee: (
    name: string,
    category: JobCategory,
    bankAccount: string,
    address: string,
    phone: string
  ) => void
  updateEmployee: (id: string, updatedFields: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  addContract: (
    employeeId: string,
    startDate: string,
    endDate: string,
    goNumber: string,
    goDate: string
  ) => void
  voidContract: (id: string) => void
  updateAttendance: (
    employeeId: string,
    dateStr: string,
    record: Partial<AttendanceRecord>
  ) => void
  batchMarkWeekdays: (employeeId: string, dates: Date[]) => void
  batchMarkAllPresent: (employeeId: string, dates: Date[]) => void
  batchClearAll: (employeeId: string, dates: Date[]) => void
  saveSettings: (newSettings: WageSettings) => void
  calculatePayroll: (year: number, month: number) => PayrollRow[]
  saveEmployees: (employees: Employee[]) => void
  saveContracts: (contracts: Contract[]) => void
  saveAttendance: (attendance: AttendanceData) => void
}

export interface PayrollRow {
  employeeId: string
  name: string
  category: JobCategory
  bankAccount: string
  regularDays: number
  otDays: number
  holidayDays: number
  regularPay: number
  otPay: number
  totalPay: number
  relevantContract?: Contract
}

const MguDbContext = createContext<MguDbContextType | undefined>(undefined)

const defaultSettings: WageSettings = {
  wageRates: {
    Gardeners: 500,
    Drivers: 600,
    Cooks: 550,
    Helpers: 450,
  },
  otRates: {
    Gardeners: 0,
    Drivers: 100,
    Cooks: 100,
    Helpers: 100,
  },
  otCeilings: {
    Gardeners: 0,
    Drivers: 5000,
    Cooks: 5000,
    Helpers: 5000,
  },
}

export const MguDbProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [attendance, setAttendance] = useState<AttendanceData>({})
  const [settings, setSettings] = useState<WageSettings>(defaultSettings)

  // Load from local storage
  useEffect(() => {
    try {
      const storedEmployees = localStorage.getItem("mgu_employees")
      if (storedEmployees) setEmployees(JSON.parse(storedEmployees))

      const storedContracts = localStorage.getItem("mgu_contracts")
      if (storedContracts) setContracts(JSON.parse(storedContracts))

      const storedAttendance = localStorage.getItem("mgu_attendance")
      if (storedAttendance) setAttendance(JSON.parse(storedAttendance))

      const storedSettings = localStorage.getItem("mgu_settings")
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings)
        const normalized: WageSettings = {
          wageRates: parsed.wageRates || defaultSettings.wageRates,
          otRates: parsed.otRates || {
            Gardeners: 0,
            Drivers: parsed.otRate !== undefined ? parsed.otRate : 100,
            Cooks: parsed.otRate !== undefined ? parsed.otRate : 100,
            Helpers: parsed.otRate !== undefined ? parsed.otRate : 100,
          },
          otCeilings: parsed.otCeilings || {
            Gardeners: 0,
            Drivers: 5000,
            Cooks: 5000,
            Helpers: 5000,
          },
          otRate: parsed.otRate,
        }
        setSettings(normalized)
      }
    } catch (e) {
      console.error("Error loading MGU data from localStorage", e)
    }
  }, [])

  // Save helpers
  const saveEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees)
    localStorage.setItem("mgu_employees", JSON.stringify(newEmployees))
  }

  const saveContracts = (newContracts: Contract[]) => {
    setContracts(newContracts)
    localStorage.setItem("mgu_contracts", JSON.stringify(newContracts))
  }

  const saveAttendance = (newAttendance: AttendanceData) => {
    setAttendance(newAttendance)
    localStorage.setItem("mgu_attendance", JSON.stringify(newAttendance))
  }

  const saveWageSettings = (newSettings: WageSettings) => {
    setSettings(newSettings)
    localStorage.setItem("mgu_settings", JSON.stringify(newSettings))
  }

  // Actions
  const addEmployee = (
    name: string,
    category: JobCategory,
    bankAccount: string,
    address: string,
    phone: string
  ) => {
    const newEmployee: Employee = {
      id: crypto.randomUUID(),
      name,
      category,
      bankAccount,
      address,
      phone,
      avatarSeed: Math.random().toString(36).substring(2, 10),
    }
    saveEmployees([...employees, newEmployee])
  }

  const updateEmployee = (id: string, updatedFields: Partial<Employee>) => {
    const updatedEmployees = employees.map((emp) =>
      emp.id === id ? { ...emp, ...updatedFields } : emp
    )
    saveEmployees(updatedEmployees)
  }

  const deleteEmployee = (id: string) => {
    // Delete employee from list.
    // Edge Case: Deleting an employee does NOT automatically delete their contracts or attendance.
    saveEmployees(employees.filter((e) => e.id !== id))
  }

  const addContract = (
    employeeId: string,
    startDate: string,
    endDate: string,
    goNumber: string,
    goDate: string
  ) => {
    const newContract: Contract = {
      id: crypto.randomUUID(),
      employeeId,
      startDate,
      endDate,
      goNumber,
      goDate,
    }
    saveContracts([...contracts, newContract])
  }

  const voidContract = (id: string) => {
    saveContracts(contracts.filter((c) => c.id !== id))
  }

  const updateAttendance = (
    employeeId: string,
    dateStr: string,
    recordUpdate: Partial<AttendanceRecord>
  ) => {
    const employeeAttendance = attendance[employeeId] || {}
    const currentRecord = employeeAttendance[dateStr] || {
      fn: false,
      an: false,
      ot: false,
      holiday: false,
    }

    const updatedRecord = {
      ...currentRecord,
      ...recordUpdate,
    }

    const updatedAttendance = {
      ...attendance,
      [employeeId]: {
        ...employeeAttendance,
        [dateStr]: updatedRecord,
      },
    }

    saveAttendance(updatedAttendance)
  }

  const batchMarkWeekdays = (employeeId: string, dates: Date[]) => {
    const employeeAttendance = { ...(attendance[employeeId] || {}) }

    dates.forEach((date) => {
      const dateStr = formatDateKey(date)
      const day = date.getDay()
      const isWeekday = day !== 0 && day !== 6 // Mon-Fri

      // Only apply to dates covered by contract
      if (
        isWeekday &&
        isDateCoveredByContract(contracts, employeeId, dateStr)
      ) {
        const currentRecord = employeeAttendance[dateStr] || {
          fn: false,
          an: false,
          ot: false,
          holiday: false,
        }
        employeeAttendance[dateStr] = {
          ...currentRecord,
          fn: true,
          an: true,
        }
      }
    })

    saveAttendance({
      ...attendance,
      [employeeId]: employeeAttendance,
    })
  }

  const batchMarkAllPresent = (employeeId: string, dates: Date[]) => {
    const employeeAttendance = { ...(attendance[employeeId] || {}) }

    dates.forEach((date) => {
      const dateStr = formatDateKey(date)
      const isSunday = date.getDay() === 0
      // Only apply to dates covered by contract and not Sunday
      if (!isSunday && isDateCoveredByContract(contracts, employeeId, dateStr)) {
        const currentRecord = employeeAttendance[dateStr] || {
          fn: false,
          an: false,
          ot: false,
          holiday: false,
        }
        employeeAttendance[dateStr] = {
          ...currentRecord,
          fn: true,
          an: true,
        }
      }
    })

    saveAttendance({
      ...attendance,
      [employeeId]: employeeAttendance,
    })
  }

  const batchClearAll = (employeeId: string, dates: Date[]) => {
    const employeeAttendance = { ...(attendance[employeeId] || {}) }

    dates.forEach((date) => {
      const dateStr = formatDateKey(date)
      if (isDateCoveredByContract(contracts, employeeId, dateStr)) {
        employeeAttendance[dateStr] = {
          fn: false,
          an: false,
          ot: false,
          holiday: false,
        }
      }
    })

    saveAttendance({
      ...attendance,
      [employeeId]: employeeAttendance,
    })
  }

  const saveSettings = (newSettings: WageSettings) => {
    saveWageSettings(newSettings)
  }

  // Payroll Calculation
  const calculatePayroll = (year: number, month: number): PayrollRow[] => {
    // 1. Cycle Start & End Strings
    const dates = getBillingCycleDates(year, month)
    if (dates.length === 0) return []

    const cycleStartDateStr = formatDateKey(dates[0])
    const cycleEndDateStr = formatDateKey(dates[dates.length - 1])

    const results: PayrollRow[] = []

    // Process all employees (including those whose profiles are deleted?
    // The spec says: "Find all employees who have at least one contract that overlaps with the billing cycle...
    // Payroll calculations that reference the deleted employee ID produce no output."
    // So we only process currently registered employees.
    employees.forEach((emp) => {
      // Find all contracts for this employee
      const empContracts = contracts.filter((c) => c.employeeId === emp.id)

      // Check if employee has at least one contract overlapping the billing cycle
      const hasOverlappingContract = empContracts.some((c) =>
        doIntervalsOverlap(
          c.startDate,
          c.endDate,
          cycleStartDateStr,
          cycleEndDateStr
        )
      )

      if (!hasOverlappingContract) return

      // Sum up attendance for dates covered by any contract for this employee
      let regularDays = 0
      let otDays = 0
      let holidayDays = 0

      const empAttendance = attendance[emp.id] || {}

      dates.forEach((date) => {
        const dateStr = formatDateKey(date)

        // Is this date covered by a contract?
        const isCovered = empContracts.some(
          (c) => c.startDate <= dateStr && dateStr <= c.endDate
        )
        if (!isCovered) return

        const record = empAttendance[dateStr]
        if (!record) return

        // Sum attendance
        if (record.fn) regularDays += 0.5
        if (record.an) regularDays += 0.5

        // Overtime: based on category rate
        if (record.ot) {
          otDays += 1
        }

        // Holiday days: both holiday and at least one of FN/AN marked
        if (record.holiday && (record.fn || record.an)) {
          holidayDays += 1
        }
      })

      // Exclude employee from payroll output if they have 0.0 regular days attended
      if (regularDays === 0) return

      // Find relevant contract for the order reference (most recently added contract)
      // Spec: "The receipt always uses the last (most recently added) contract in the employee's list for the order reference information."
      const relevantContract =
        empContracts.length > 0
          ? empContracts[empContracts.length - 1]
          : undefined

      const baseRate = settings.wageRates[emp.category] || 0
      const regularPay = regularDays * baseRate
      
      const otRate = settings.otRates?.[emp.category] ?? settings.otRate ?? 0
      const otCeiling = settings.otCeilings?.[emp.category] ?? 5000
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

  return (
    <MguDbContext.Provider
      value={{
        employees,
        contracts,
        attendance,
        settings,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addContract,
        voidContract,
        updateAttendance,
        batchMarkWeekdays,
        batchMarkAllPresent,
        batchClearAll,
        saveSettings,
        calculatePayroll,
        saveEmployees,
        saveContracts,
        saveAttendance,
      }}
    >
      {children}
    </MguDbContext.Provider>
  )
}

export const useMguDb = () => {
  const context = useContext(MguDbContext)
  if (!context) {
    throw new Error("useMguDb must be used within an MguDbProvider")
  }
  return context
}
