export type JobCategory = "Gardeners" | "Drivers" | "Cooks" | "Helpers"

export interface Employee {
  id: string
  name: string
  category: JobCategory
  bankAccount: string
  avatarSeed?: string
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

export interface WageSettings {
  wageRates: Record<JobCategory, number>
  otRate: number
}
