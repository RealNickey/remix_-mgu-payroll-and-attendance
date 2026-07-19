export type JobCategory =
  | "Gardeners"
  | "Drivers"
  | "Cooks"
  | "Helpers"
  | (string & {})

export interface Employee {
  id: string
  name: string
  category: JobCategory
  bankAccount: string
  avatarSeed?: string
  address?: string
  phone?: string
}

export interface Contract {
  id: string
  employeeId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD (startDate + 89 days)
  goNumber: string
  goDate: string // YYYY-MM-DD
}

export interface AttendanceRecord {
  fn: boolean
  an: boolean
  ot: boolean
  holiday: boolean
}

// Stored as employeeId -> dateStr -> AttendanceRecord
export type AttendanceData = Record<string, Record<string, AttendanceRecord>>

export interface BillingCycleConfig {
  startDay: number // e.g. 26
  endDay: number // e.g. 25
}

export interface WageSettings {
  categories?: string[]
  wageRates: Record<string, number>
  otRates: Record<string, number>
  otCeilings: Record<string, number>
  billingCycle?: BillingCycleConfig
  otRate?: number // kept for backward compatibility
  section: "Ad.B5" | "Ad.B7" | "Estate 1" | "Estate 2"
}

