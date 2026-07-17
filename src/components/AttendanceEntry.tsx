import { useState, useMemo, useEffect, useCallback } from "react"
import { useMguDb } from "@/lib/db"
import {
  getBillingCycleDates,
  formatDateKey,
  isDateCoveredByContract,
  doIntervalsOverlap,
} from "@/lib/payrollUtils"

// UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { Toggle } from "@/components/ui/toggle"
import { EmployeeAvatar } from "@/components/ui/employee-avatar"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

// Icons
import {
  RiCalendarEventLine,
  RiAlertLine,
  RiSearchLine,
  RiListCheck,
  RiUserLine,
  RiCheckDoubleLine,
  RiDeleteBinLine,
  RiCalendarLine,
  RiTimeLine,
  RiSunLine,
  RiArrowRightLine,
  RiInformationLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AttendanceEntryProps {
  onNavigateToEmployees: () => void
  onNavigateToContracts: () => void
}

const MONTHS = [
  { value: 1, label: "January", short: "Jan" },
  { value: 2, label: "February", short: "Feb" },
  { value: 3, label: "March", short: "Mar" },
  { value: 4, label: "April", short: "Apr" },
  { value: 5, label: "May", short: "May" },
  { value: 6, label: "June", short: "Jun" },
  { value: 7, label: "July", short: "Jul" },
  { value: 8, label: "August", short: "Aug" },
  { value: 9, label: "September", short: "Sep" },
  { value: 10, label: "October", short: "Oct" },
  { value: 11, label: "November", short: "Nov" },
  { value: 12, label: "December", short: "Dec" },
]

const CATEGORY_COLORS: Record<string, string> = {
  Cooks: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20",
  Helpers:
    "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20",
  Drivers:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
  Gardeners:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
}

export const AttendanceEntry: React.FC<AttendanceEntryProps> = ({
  onNavigateToEmployees,
  onNavigateToContracts,
}) => {
  const {
    employees,
    contracts,
    attendance,
    updateAttendance,
    batchMarkWeekdays,
    batchMarkAllPresent,
    batchClearAll,
    saveAttendance,
    settings,
  } = useMguDb()

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState(7)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")

  const years = [currentYear - 1, currentYear, currentYear + 1]

  // Billing cycle dates
  const billingCycleDates = useMemo(
    () => getBillingCycleDates(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  )

  const cycleStartDateStr = useMemo(
    () =>
      billingCycleDates.length > 0 ? formatDateKey(billingCycleDates[0]) : "",
    [billingCycleDates]
  )
  const cycleEndDateStr = useMemo(
    () =>
      billingCycleDates.length > 0
        ? formatDateKey(billingCycleDates[billingCycleDates.length - 1])
        : "",
    [billingCycleDates]
  )

  // Helpers
  const hasOverlappingContract = useCallback(
    (empId: string) => {
      const empContracts = contracts.filter((c) => c.employeeId === empId)
      return empContracts.some((c) =>
        doIntervalsOverlap(
          c.startDate,
          c.endDate,
          cycleStartDateStr,
          cycleEndDateStr
        )
      )
    },
    [contracts, cycleStartDateStr, cycleEndDateStr]
  )

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.category.toLowerCase().includes(q)
    )
  }, [employees, searchQuery])

  // Auto-select first employee
  useEffect(() => {
    if (filteredEmployees.length > 0) {
      const exists = filteredEmployees.some((e) => e.id === selectedEmployeeId)
      if (!exists) setSelectedEmployeeId(filteredEmployees[0].id)
    } else {
      setSelectedEmployeeId("")
    }
  }, [filteredEmployees, selectedEmployeeId])

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  )

  const isSelectedEmpCoveredForCycle = useMemo(() => {
    if (!selectedEmployeeId) return false
    return hasOverlappingContract(selectedEmployeeId)
  }, [selectedEmployeeId, hasOverlappingContract])

  // Days marked for an employee (for sidebar list)
  const getDaysMarkedInCycle = useCallback(
    (empId: string) => {
      const empAttendance = attendance[empId] || {}
      const empContracts = contracts.filter((c) => c.employeeId === empId)
      let total = 0
      let coveredDays = 0
      billingCycleDates.forEach((date) => {
        const dateStr = formatDateKey(date)
        const isCovered = empContracts.some(
          (c) => c.startDate <= dateStr && dateStr <= c.endDate
        )
        if (!isCovered) return
        coveredDays++
        const record = empAttendance[dateStr]
        if (record) {
          if (record.fn) total += 0.5
          if (record.an) total += 0.5
        }
      })
      return { total, coveredDays }
    },
    [attendance, billingCycleDates, contracts]
  )

  // Live summary metrics
  const liveSummary = useMemo(() => {
    if (!selectedEmployeeId)
      return { regularDays: 0, otDays: 0, holidayDays: 0, coveredDays: 0 }
    const empAttendance = attendance[selectedEmployeeId] || {}
    const empContracts = contracts.filter(
      (c) => c.employeeId === selectedEmployeeId
    )
    let regularDays = 0
    let otDays = 0
    let holidayDays = 0
    let coveredDays = 0

    billingCycleDates.forEach((date) => {
      const dateStr = formatDateKey(date)
      const isCovered = empContracts.some(
        (c) => c.startDate <= dateStr && dateStr <= c.endDate
      )
      if (!isCovered) return
      coveredDays++
      const record = empAttendance[dateStr]
      if (record) {
        if (record.fn) regularDays += 0.5
        if (record.an) regularDays += 0.5
        if (record.ot && selectedEmployee && (settings.otRates?.[selectedEmployee.category] ?? settings.otRate ?? 0) > 0) otDays += 1
        if (record.holiday && (record.fn || record.an)) holidayDays += 1
      }
    })
    return { regularDays, otDays, holidayDays, coveredDays }
  }, [
    selectedEmployeeId,
    attendance,
    billingCycleDates,
    contracts,
    selectedEmployee,
    settings,
  ])

  const attendancePct = liveSummary.coveredDays
    ? Math.round((liveSummary.regularDays / liveSummary.coveredDays) * 100)
    : 0

  // Attendance record helper
  const getAttendanceRecord = useCallback(
    (dateStr: string) => {
      if (!selectedEmployeeId)
        return { fn: false, an: false, ot: false, holiday: false }
      return (
        attendance[selectedEmployeeId]?.[dateStr] || {
          fn: false,
          an: false,
          ot: false,
          holiday: false,
        }
      )
    },
    [selectedEmployeeId, attendance]
  )

  const handleToggle = useCallback(
    (dateStr: string, flag: "fn" | "an" | "ot" | "holiday") => {
      if (!selectedEmployeeId) return
      const current = getAttendanceRecord(dateStr)
      updateAttendance(selectedEmployeeId, dateStr, { [flag]: !current[flag] })
    },
    [selectedEmployeeId, getAttendanceRecord, updateAttendance]
  )

  // Batch actions
  const handleBatchMarkWeekdays = () => {
    if (!selectedEmployeeId) return
    const prev = JSON.parse(JSON.stringify(attendance))
    batchMarkWeekdays(selectedEmployeeId, billingCycleDates)
    toast.success("Marked all weekdays as present.", {
      action: { label: "Undo", onClick: () => saveAttendance(prev) },
    })
  }

  const handleBatchMarkAllPresent = () => {
    if (!selectedEmployeeId) return
    const prev = JSON.parse(JSON.stringify(attendance))
    batchMarkAllPresent(selectedEmployeeId, billingCycleDates)
    toast.success("Marked Monday–Saturday dates as present.", {
      action: { label: "Undo", onClick: () => saveAttendance(prev) },
    })
  }

  const handleBatchClearAll = () => {
    if (!selectedEmployeeId) return
    const prev = JSON.parse(JSON.stringify(attendance))
    batchClearAll(selectedEmployeeId, billingCycleDates)
    toast.success("Cleared all attendance for this cycle.", {
      action: { label: "Undo", onClick: () => saveAttendance(prev) },
    })
  }

  const isWeekend = (date: Date) => {
    const d = date.getDay()
    return d === 0 || d === 6
  }

  const isSunday = (date: Date) => date.getDay() === 0

  const formatDateLabel = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0")
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" })
    return { day, weekday }
  }

  const selectedMonthLabel =
    MONTHS.find((m) => m.value === selectedMonth)?.label ?? ""
  const categoryColor = selectedEmployee
    ? (CATEGORY_COLORS[selectedEmployee.category] ??
      "bg-muted text-muted-foreground")
    : ""

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col gap-0">
      {/* ── Sticky top toolbar ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col justify-between gap-3 px-0 sm:flex-row sm:items-center">
        {/* Cycle selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <RiCalendarEventLine className="size-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Billing Cycle
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <Select
            value={String(selectedMonth)}
            onValueChange={(val) => setSelectedMonth(Number(val))}
          >
            <SelectTrigger className="h-8 w-36 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MONTHS.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={String(m.value)}
                    className="text-xs"
                  >
                    {m.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="h-8 w-24 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {employees.length > 0 && (
            <>
              <Separator
                orientation="vertical"
                className="hidden h-4 sm:block"
              />
              <div className="flex items-center gap-1.5">
                <RiUserLine className="size-3.5 shrink-0 text-primary" />
                <Combobox
                  value={selectedEmployeeId}
                  onValueChange={(val) => {
                    if (val) setSelectedEmployeeId(val as string)
                  }}
                  itemToStringLabel={(val) => {
                    if (!val) return ""
                    const emp = employees.find((e) => e.id === val)
                    return emp ? emp.name : ""
                  }}
                  itemToStringValue={(val) => val as string}
                >
                  <ComboboxInput
                    placeholder="Select employee…"
                    name="employee-select"
                    aria-label="Select employee"
                    className="h-8 w-56 text-xs font-semibold"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No employee found.</ComboboxEmpty>
                    <ComboboxList>
                      {employees.map((emp) => (
                        <ComboboxItem
                          key={emp.id}
                          value={emp.id}
                          className="flex items-center gap-2"
                        >
                          <EmployeeAvatar employee={emp} size="sm" />
                          <span>
                            {emp.name} ({emp.category})
                          </span>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            </>
          )}
        </div>

        {/* Cycle date range info */}
        {billingCycleDates.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/60 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
            <RiCalendarLine className="size-3.5 shrink-0" />
            <span>
              {new Date(cycleStartDateStr).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })}
              &nbsp;→&nbsp;
              {new Date(cycleEndDateStr).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <Separator orientation="vertical" className="mx-0.5 h-3" />
            <span className="font-semibold">{billingCycleDates.length}d</span>
          </div>
        )}
      </div>

      {/* ── Empty state: no employees ──────────────────────────────────────────── */}
      {employees.length === 0 ? (
        <Card className="flex flex-1 flex-col items-center justify-center border-dashed border-border/80 bg-card/30 py-20">
          <Empty>
            <div className="flex max-w-sm flex-col items-center gap-4 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <RiUserLine className="size-7 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-heading text-base font-bold">
                  No Employees Found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add employees to the portal before marking attendance.
                </p>
              </div>
              <Button onClick={onNavigateToEmployees} className="w-full">
                <RiArrowRightLine data-icon="inline-end" />
                Go to Employee Profiles
              </Button>
            </div>
          </Empty>
        </Card>
      ) : (
        /* ── Two-panel layout ─────────────────────────────────────────────────── */
        <div
          className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row"
          style={{ height: "calc(100vh - 210px)" }}
        >
          {/* ── LEFT: Staff panel ─────────────────────────────────────────────── */}
          <div className="flex min-h-0 w-full shrink-0 flex-col gap-3 lg:w-72">
            <Card className="flex min-h-0 flex-1 flex-col border-border/40 bg-card shadow-sm">
              <CardHeader className="shrink-0 border-b border-border/40 px-4 pt-4 pb-2 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-1.5 font-heading text-sm font-bold">
                    <RiListCheck className="size-4 text-primary" />
                    Staff
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="h-5 font-mono text-[10px]"
                  >
                    {filteredEmployees.length}
                  </Badge>
                </div>
                {/* Search */}
                <div className="relative mt-3 flex w-full items-center">
                  <div className="relative flex-1">
                    <RiSearchLine className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search staff (e.g., John)…"
                      name="staff-search"
                      aria-label="Search staff"
                      className={cn(
                        "h-8 pl-8 text-xs",
                        searchQuery
                          ? "rounded-r-none border-r-0 focus-visible:z-10"
                          : ""
                      )}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-l-none bg-muted/30 px-2.5 text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <Separator />

              <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-1 p-2">
                  {filteredEmployees.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      No results found.
                    </p>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const { total, coveredDays } = getDaysMarkedInCycle(
                        emp.id
                      )
                      const hasContract = hasOverlappingContract(emp.id)
                      const isActive = selectedEmployeeId === emp.id
                      const pct =
                        coveredDays > 0
                          ? Math.round((total / coveredDays) * 100)
                          : 0
                      const catColor =
                        CATEGORY_COLORS[emp.category] ??
                        "bg-muted text-muted-foreground"

                      return (
                        <Tooltip key={emp.id}>
                          <TooltipTrigger
                            render={
                              <button
                                onClick={() => setSelectedEmployeeId(emp.id)}
                                className={cn(
                                  "w-full rounded-lg border p-2.5 text-left transition-all",
                                  isActive
                                    ? "border-primary/30 bg-primary/10 shadow-sm"
                                    : "border-transparent bg-transparent hover:border-border/40 hover:bg-muted/60"
                                )}
                              />
                            }
                          >
                            <div className="flex items-start gap-2">
                              {/* Avatar circle */}
                              <EmployeeAvatar
                                employee={emp}
                                size="sm"
                                className={cn(
                                  "mt-0.5 shrink-0",
                                  isActive
                                    ? "border-primary ring-1 ring-primary/30"
                                    : "border-border/40"
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <p
                                    className={cn(
                                      "truncate text-xs leading-none font-semibold",
                                      isActive
                                        ? "text-primary"
                                        : "text-foreground"
                                    )}
                                  >
                                    {emp.name}
                                  </p>
                                  {/* Contract warning dot / days count */}
                                  {!hasContract ? (
                                    <span className="relative flex size-2 shrink-0">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                                      <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                                    </span>
                                  ) : (
                                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                      {total.toFixed(1)}d
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "mt-1 inline-flex items-center rounded-full border px-1.5 py-px text-[9px] font-semibold",
                                    catColor
                                  )}
                                >
                                  {emp.category}
                                </span>
                                {/* Progress bar */}
                                {hasContract && (
                                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all",
                                        pct >= 90
                                          ? "bg-emerald-500"
                                          : pct >= 60
                                            ? "bg-primary"
                                            : pct > 0
                                              ? "bg-amber-500"
                                              : "bg-muted-foreground/30"
                                      )}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {hasContract
                              ? `${total} / ${coveredDays} days marked (${pct}%)`
                              : "No contract for this cycle — attendance locked"}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* ── RIGHT: Attendance grid ─────────────────────────────────────────── */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {!selectedEmployee ? (
              <Card className="flex flex-1 flex-col items-center justify-center border-dashed bg-card/30 p-8">
                <Empty>
                  <div className="flex max-w-sm flex-col items-center gap-4 px-6 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <RiUserLine className="size-6" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-heading text-base font-bold">
                        Select an Employee
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Choose an employee from the staff list or use the search
                        box below to get started.
                      </p>
                    </div>
                    {employees.length > 0 && (
                      <div className="mt-2 w-full">
                        <Combobox
                          value={selectedEmployeeId}
                          onValueChange={(val) => {
                            if (val) setSelectedEmployeeId(val as string)
                          }}
                          itemToStringLabel={(val) => {
                            if (!val) return ""
                            const emp = employees.find((e) => e.id === val)
                            return emp ? emp.name : ""
                          }}
                          itemToStringValue={(val) => val as string}
                        >
                          <ComboboxInput
                            placeholder="Search and select employee…"
                            name="employee-search"
                            aria-label="Search and select employee"
                            className="h-9 w-full text-xs"
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>No employee found.</ComboboxEmpty>
                            <ComboboxList>
                              {employees.map((emp) => (
                                <ComboboxItem
                                  key={emp.id}
                                  value={emp.id}
                                  className="flex items-center gap-2"
                                >
                                  <EmployeeAvatar employee={emp} size="sm" />
                                  <span>
                                    {emp.name} ({emp.category})
                                  </span>
                                </ComboboxItem>
                              ))}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      </div>
                    )}
                  </div>
                </Empty>
              </Card>
            ) : (
              <Card className="flex min-h-0 flex-1 flex-col border-border/40 bg-card shadow-sm">
                {/* ── Card header ─────────────────────────────────────────────── */}
                <CardHeader className="shrink-0 px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Employee identity */}
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar
                        employee={selectedEmployee}
                        size="lg"
                        className={cn(
                          "shrink-0 rounded-xl font-bold",
                          categoryColor
                        )}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="font-heading text-sm leading-none font-bold">
                            {selectedEmployee.name}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-1.5 py-0 text-[9px] font-bold",
                              categoryColor
                            )}
                          >
                            {selectedEmployee.category}
                          </Badge>
                        </div>
                        <CardDescription className="mt-0.5 text-[10px]">
                          {selectedMonthLabel} {selectedYear} · FN = Forenoon ·
                          AN = Afternoon
                          {selectedEmployee.category !== "Gardeners" &&
                            " · OT = Overtime"}
                          {" · HOL = Holiday duty"}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Batch actions toolbar */}
                    {isSelectedEmpCoveredForCycle && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={handleBatchMarkWeekdays}
                              />
                            }
                          >
                            <RiCalendarLine data-icon="inline-start" />
                            Weekdays
                          </TooltipTrigger>
                          <TooltipContent>
                            Mark all Mon–Fri as full-day present
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={handleBatchMarkAllPresent}
                              />
                            }
                          >
                            <RiCheckDoubleLine data-icon="inline-start" />
                            All Present
                          </TooltipTrigger>
                          <TooltipContent>
                            Mark Mon–Sat in cycle as present (FN + AN)
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                size="xs"
                                variant="destructive"
                                onClick={handleBatchClearAll}
                              />
                            }
                          >
                            <RiDeleteBinLine data-icon="inline-start" />
                            Clear
                          </TooltipTrigger>
                          <TooltipContent>
                            Clear all attendance flags for this cycle
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <Separator />

                {/* ── No contract warning ──────────────────────────────────────── */}
                {!isSelectedEmpCoveredForCycle && (
                  <div className="shrink-0 px-4 pt-3">
                    <Alert
                      variant="destructive"
                      className="border-destructive/20 bg-destructive/8 py-3"
                    >
                      <RiAlertLine className="size-4" />
                      <AlertTitle className="font-heading text-xs font-bold">
                        No Active Contract for This Cycle
                      </AlertTitle>
                      <AlertDescription className="mt-0.5 text-[11px]">
                        Attendance can only be marked within a valid contract
                        period.{" "}
                        <Button
                          variant="link"
                          onClick={onNavigateToContracts}
                          className="h-auto p-0 align-baseline text-[11px] font-semibold text-destructive underline"
                        >
                          Register a contract
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* ── Column headers ───────────────────────────────────────────── */}
                {isSelectedEmpCoveredForCycle && (
                  <div className="shrink-0 px-4 pt-3 pb-1">
                    <div className="grid grid-cols-[auto_1fr_repeat(4,auto)] items-center gap-x-2 pr-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      <span className="w-[80px]">Date</span>
                      <span />
                      <span className="w-9 text-center text-sky-600 dark:text-sky-400">
                        FN
                      </span>
                      <span className="w-9 text-center text-violet-600 dark:text-violet-400">
                        AN
                      </span>
                      {selectedEmployee.category !== "Gardeners" && (
                        <span className="w-9 text-center text-amber-600 dark:text-amber-400">
                          OT
                        </span>
                      )}
                      <span className="w-9 text-center text-purple-600 dark:text-purple-400">
                        HOL
                      </span>
                    </div>
                    <Separator className="mt-1" />
                  </div>
                )}

                {/* ── Scrollable date grid ─────────────────────────────────────── */}
                <ScrollArea className="min-h-0 flex-1">
                  <div className="flex flex-col gap-0.5 px-4 pt-1 pb-3">
                    {billingCycleDates.map((date) => {
                      const dateStr = formatDateKey(date)
                      const isCovered = isDateCoveredByContract(
                        contracts,
                        selectedEmployeeId,
                        dateStr
                      )
                      const record = getAttendanceRecord(dateStr)
                      const weekend = isWeekend(date)
                      const sunday = isSunday(date)
                      const { day, weekday } = formatDateLabel(date)

                      return (
                        <div
                          key={dateStr}
                          className={cn(
                            "grid grid-cols-[auto_1fr_repeat(4,auto)] items-center gap-x-2 rounded-md px-2 py-1.5 transition-colors border-l-2",
                            !isCovered
                              ? "opacity-40 border-transparent"
                              : sunday
                                ? "bg-rose-500/6 dark:bg-rose-500/10 border-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/15"
                                : weekend
                                  ? "bg-amber-500/6 dark:bg-amber-500/10 border-amber-500/60 hover:bg-amber-500/10 dark:hover:bg-amber-500/15"
                                  : "border-transparent hover:bg-muted/40"
                          )}
                        >
                          {/* Date label */}
                          <div className="flex w-[80px] shrink-0 items-center gap-1.5">
                            <span
                              className={cn(
                                "font-mono text-xs font-bold tabular-nums",
                                !isCovered
                                  ? "text-muted-foreground/50"
                                  : sunday
                                    ? "text-rose-500 dark:text-rose-400"
                                    : weekend
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-foreground"
                              )}
                            >
                              {day}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-semibold tracking-wide uppercase",
                                !isCovered
                                  ? "text-muted-foreground/40"
                                  : sunday
                                    ? "text-rose-400 dark:text-rose-500"
                                    : weekend
                                      ? "text-amber-500 dark:text-amber-600"
                                      : "text-muted-foreground"
                              )}
                            >
                              {weekday}
                            </span>
                          </div>

                          {/* Attendance fill indicator */}
                          <div className="flex items-center">
                            {isCovered && (
                              <div className="flex h-2.5 w-full max-w-[60px] gap-px">
                                <div
                                  className={cn(
                                    "flex-1 rounded-l-full transition-colors",
                                    record.fn ? "bg-sky-500" : "bg-muted/60"
                                  )}
                                />
                                <div
                                  className={cn(
                                    "flex-1 rounded-r-full transition-colors",
                                    record.an ? "bg-violet-500" : "bg-muted/60"
                                  )}
                                />
                              </div>
                            )}
                            {!isCovered && (
                              <span className="text-[9px] font-medium tracking-wide text-muted-foreground/50 italic">
                                outside contract
                              </span>
                            )}
                          </div>

                          {/* FN toggle */}
                          <Toggle
                            size="sm"
                            variant="outline"
                            pressed={record.fn}
                            onPressedChange={() =>
                              isCovered && handleToggle(dateStr, "fn")
                            }
                            disabled={!isCovered}
                            className={cn(
                              "size-9 text-[10px] font-bold transition-all",
                              record.fn
                                ? "border-sky-500 bg-sky-500 text-white hover:bg-sky-600 hover:text-white aria-pressed:bg-sky-500 aria-pressed:text-white"
                                : "text-muted-foreground"
                            )}
                          >
                            FN
                          </Toggle>

                          {/* AN toggle */}
                          <Toggle
                            size="sm"
                            variant="outline"
                            pressed={record.an}
                            onPressedChange={() =>
                              isCovered && handleToggle(dateStr, "an")
                            }
                            disabled={!isCovered}
                            className={cn(
                              "size-9 text-[10px] font-bold transition-all",
                              record.an
                                ? "border-violet-500 bg-violet-500 text-white hover:bg-violet-600 hover:text-white aria-pressed:bg-violet-500 aria-pressed:text-white"
                                : "text-muted-foreground"
                            )}
                          >
                            AN
                          </Toggle>

                          {/* OT toggle (hidden if OT rate is 0) */}
                          {(settings.otRates?.[selectedEmployee.category] ?? settings.otRate ?? 0) > 0 ? (
                            <Toggle
                              size="sm"
                              variant="outline"
                              pressed={record.ot}
                              onPressedChange={() =>
                                isCovered && handleToggle(dateStr, "ot")
                              }
                              disabled={!isCovered}
                              className={cn(
                                "size-9 text-[10px] font-bold transition-all",
                                record.ot
                                  ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:text-white aria-pressed:bg-amber-500 aria-pressed:text-white"
                                  : "text-muted-foreground"
                              )}
                            >
                              OT
                            </Toggle>
                          ) : (
                            <div className="size-9" />
                          )}

                          {/* HOL toggle */}
                          <Toggle
                            size="sm"
                            variant="outline"
                            pressed={record.holiday}
                            onPressedChange={() =>
                              isCovered && handleToggle(dateStr, "holiday")
                            }
                            disabled={!isCovered}
                            className={cn(
                              "size-9 text-[9px] font-bold transition-all",
                              record.holiday
                                ? "border-purple-500 bg-purple-500 text-white hover:bg-purple-600 hover:text-white aria-pressed:bg-purple-500 aria-pressed:text-white"
                                : "text-muted-foreground"
                            )}
                          >
                            HOL
                          </Toggle>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>

                {/* ── Live summary footer ──────────────────────────────────────── */}
                {isSelectedEmpCoveredForCycle && (
                  <>
                    <Separator />
                    <div className="flex shrink-0 flex-wrap gap-4 bg-muted/20 px-4 py-3">
                      {/* Attendance progress */}
                      <Progress
                        value={attendancePct}
                        className="min-w-[140px] flex-1"
                      >
                        <ProgressLabel className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                          <RiCalendarLine className="size-3" />
                          Attendance
                        </ProgressLabel>
                        <span className="ml-auto font-mono text-[10px] font-bold text-primary tabular-nums">
                          {liveSummary.regularDays.toFixed(1)} /{" "}
                          {liveSummary.coveredDays}d
                        </span>
                      </Progress>

                      {/* OT counter */}
                      {selectedEmployee.category !== "Gardeners" && (
                        <div className="flex shrink-0 items-center gap-2">
                          <RiTimeLine className="size-3.5 shrink-0 text-amber-500" />
                          <span className="text-[10px] font-medium text-muted-foreground">
                            OT
                          </span>
                          <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[12px] font-bold text-amber-600 dark:text-amber-400">
                            {liveSummary.otDays}d
                          </span>
                        </div>
                      )}

                      {/* Holiday duty */}
                      <div className="flex shrink-0 items-center gap-2">
                        <RiSunLine className="size-3.5 shrink-0 text-purple-500" />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Holiday
                        </span>
                        <span className="rounded bg-purple-500/10 px-2 py-0.5 font-mono text-[12px] font-bold text-purple-600 dark:text-purple-400">
                          {liveSummary.holidayDays}d
                        </span>
                      </div>

                      {/* Completion pct badge */}
                      <div className="ml-auto flex shrink-0 items-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <div className="flex cursor-default items-center gap-1" />
                            }
                          >
                            <RiInformationLine className="size-3.5 text-muted-foreground/60" />
                            <Badge
                              variant="secondary"
                              className={cn(
                                "h-6 px-2 font-mono text-[11px] font-bold",
                                attendancePct >= 90
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : attendancePct >= 60
                                    ? "bg-primary/10 text-primary"
                                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              )}
                            >
                              {attendancePct}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {attendancePct}% attendance rate for this billing
                            cycle
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
