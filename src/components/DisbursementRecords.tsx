import React, { useState, useMemo } from "react"
import { useMguDb } from "@/lib/db"
import {
  getBillingCycleDates,
  formatDateKey,
  formatIndianRupees,
} from "@/lib/payrollUtils"
import {
  generateSummaryReport,
  generateAttendanceReport,
  generateEmployeeReceipt,
  generateMonthlyAttendanceSheet,
} from "@/lib/pdfGenerator"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Empty } from "@/components/ui/empty"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { EmployeeAvatar } from "@/components/ui/employee-avatar"
import {
  RiCoinsLine,
  RiGroupLine,
  RiTimeLine,
  RiMoneyRupeeCircleLine,
  RiCalendarEventLine,
  RiFileDownloadLine,
  RiFilePaper2Line,
  RiEyeLine,
  RiFilter3Line,
  RiRestartLine,
  RiSearchLine,
  RiBriefcaseLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PdfViewer } from "@/components/ui/pdf-viewer"

export const DisbursementRecords: React.FC = () => {
  const { employees, contracts, attendance, settings, calculatePayroll } =
    useMguDb()

  // Date Selection
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState(7)

  // Multi-Criteria Filters
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterOtStatus, setFilterOtStatus] = useState<
    "all" | "has_ot" | "no_ot"
  >("all")
  const [filterMinDays, setFilterMinDays] = useState<string>("")
  const [filterMinPay, setFilterMinPay] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [previewPdf, setPreviewPdf] = useState<{
    url: string
    filename: string
    title: string
  } | null>(null)

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  const years = [currentYear - 1, currentYear, currentYear + 1]

  // Calculate current billing cycle dates
  const billingCycleDates = useMemo(() => {
    const startDay = settings.billingCycle?.startDay ?? 26
    const endDay = settings.billingCycle?.endDay ?? 25
    return getBillingCycleDates(selectedYear, selectedMonth, startDay, endDay)
  }, [selectedYear, selectedMonth, settings.billingCycle])

  const cycleStartStr = useMemo(() => {
    if (billingCycleDates.length === 0) return ""
    return new Date(formatDateKey(billingCycleDates[0])).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "long",
      }
    )
  }, [billingCycleDates])

  const cycleEndStr = useMemo(() => {
    if (billingCycleDates.length === 0) return ""
    return new Date(
      formatDateKey(billingCycleDates[billingCycleDates.length - 1])
    ).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }, [billingCycleDates])

  // Compute calculations for selected month
  const payrollData = useMemo(() => {
    return calculatePayroll(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth, employees, contracts, attendance, settings])

  // Available job categories list
  const availableCategories = useMemo(() => {
    if (settings.categories && settings.categories.length > 0) {
      return settings.categories
    }
    const catSet = new Set<string>(["Gardeners", "Drivers", "Cooks", "Helpers"])
    employees.forEach((e) => catSet.add(e.category))
    payrollData.forEach((r) => catSet.add(r.category))
    return Array.from(catSet)
  }, [settings.categories, employees, payrollData])

  // Filter payroll data by multi-criteria
  const filteredPayrollData = useMemo(() => {
    return payrollData.filter((r) => {
      // 1. Employee ID filter
      if (filterEmployeeId && r.employeeId !== filterEmployeeId) {
        return false
      }

      // 2. Job Category filter
      if (filterCategory !== "all" && r.category !== filterCategory) {
        return false
      }

      // 3. Overtime status filter
      if (filterOtStatus === "has_ot" && r.otDays <= 0) {
        return false
      }
      if (filterOtStatus === "no_ot" && r.otDays > 0) {
        return false
      }

      // 4. Min Regular Days filter
      if (filterMinDays !== "" && !isNaN(Number(filterMinDays))) {
        if (r.regularDays < Number(filterMinDays)) return false
      }

      // 5. Min Total Pay filter
      if (filterMinPay !== "" && !isNaN(Number(filterMinPay))) {
        if (r.totalPay < Number(filterMinPay)) return false
      }

      // 6. Free text search
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = r.name.toLowerCase().includes(q)
        const matchesCat = r.category.toLowerCase().includes(q)
        const matchesBank = r.bankAccount.toLowerCase().includes(q)
        const matchesUO =
          r.relevantContract?.goNumber.toLowerCase().includes(q) ?? false
        if (!matchesName && !matchesCat && !matchesBank && !matchesUO) {
          return false
        }
      }

      return true
    })
  }, [
    payrollData,
    filterEmployeeId,
    filterCategory,
    filterOtStatus,
    filterMinDays,
    filterMinPay,
    searchQuery,
  ])

  // Check active filter count
  const hasActiveFilters =
    !!filterEmployeeId ||
    filterCategory !== "all" ||
    filterOtStatus !== "all" ||
    filterMinDays !== "" ||
    filterMinPay !== "" ||
    searchQuery.trim() !== ""

  const handleResetFilters = () => {
    setFilterEmployeeId("")
    setFilterCategory("all")
    setFilterOtStatus("all")
    setFilterMinDays("")
    setFilterMinPay("")
    setSearchQuery("")
    toast.success("Filters reset.")
  }

  // KPI aggregates
  const activeStaff = payrollData.length

  const regularDaysLogged = useMemo(() => {
    return payrollData.reduce((sum, r) => sum + r.regularDays, 0)
  }, [payrollData])

  const overtimeDaysLogged = useMemo(() => {
    return payrollData.reduce((sum, r) => sum + r.otDays, 0)
  }, [payrollData])

  const grandTotalPayroll = useMemo(() => {
    return payrollData.reduce((sum, r) => sum + r.totalPay, 0)
  }, [payrollData])

  const monthLabel = useMemo(() => {
    return months.find((m) => m.value === selectedMonth)?.label || "Month"
  }, [selectedMonth])

  // Global report generation handlers using filtered data
  const dataForReports = filteredPayrollData

  const handleDownloadSummary = () => {
    if (dataForReports.length === 0) {
      toast.error("No records match the current filters.")
      return
    }
    try {
      const cycleStartStrFormatted = new Date(
        formatDateKey(billingCycleDates[0])
      ).toLocaleDateString("en-GB")
      const cycleEndStrFormatted = new Date(
        formatDateKey(billingCycleDates[billingCycleDates.length - 1])
      ).toLocaleDateString("en-GB")
      generateSummaryReport(
        dataForReports,
        monthLabel,
        selectedYear,
        cycleStartStrFormatted,
        cycleEndStrFormatted,
        settings.section
      )
      toast.success("Summary disbursement report downloaded.")
    } catch (e) {
      console.error(e)
      toast.error("Failed to generate PDF summary report.")
    }
  }

  const handlePreviewSummary = () => {
    if (dataForReports.length === 0) {
      toast.error("No records match the current filters.")
      return
    }
    try {
      const cycleStartStrFormatted = new Date(
        formatDateKey(billingCycleDates[0])
      ).toLocaleDateString("en-GB")
      const cycleEndStrFormatted = new Date(
        formatDateKey(billingCycleDates[billingCycleDates.length - 1])
      ).toLocaleDateString("en-GB")
      const result = generateSummaryReport(
        dataForReports,
        monthLabel,
        selectedYear,
        cycleStartStrFormatted,
        cycleEndStrFormatted,
        settings.section,
        true
      )
      if (result) {
        setPreviewPdf({
          url: result.url,
          filename: result.filename,
          title: `Disbursement Summary — ${monthLabel} ${selectedYear}`,
        })
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to preview PDF summary report.")
    }
  }

  const handleDownloadAttendanceReport = () => {
    if (dataForReports.length === 0) {
      toast.error("No records match the current filters.")
      return
    }
    try {
      generateAttendanceReport(
        dataForReports,
        monthLabel,
        selectedYear,
        settings.section
      )
      toast.success("General attendance report downloaded.")
    } catch (e) {
      console.error(e)
      toast.error("Failed to generate PDF attendance report.")
    }
  }

  const handlePreviewAttendanceReport = () => {
    if (dataForReports.length === 0) {
      toast.error("No records match the current filters.")
      return
    }
    try {
      const result = generateAttendanceReport(
        dataForReports,
        monthLabel,
        selectedYear,
        settings.section,
        true
      )
      if (result) {
        setPreviewPdf({
          url: result.url,
          filename: result.filename,
          title: `Attendance Report — ${monthLabel} ${selectedYear}`,
        })
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to preview PDF attendance report.")
    }
  }

  const handleDownloadMonthlyGridSheet = () => {
    if (dataForReports.length === 0) {
      toast.error("No records match the current filters.")
      return
    }
    try {
      generateMonthlyAttendanceSheet(
        dataForReports,
        attendance,
        contracts,
        billingCycleDates,
        monthLabel,
        selectedYear,
        "drivers",
        settings.section
      )
      toast.success("Monthly grid attendance sheet downloaded.")
    } catch (e) {
      console.error(e)
      toast.error("Failed to generate monthly grid attendance sheet PDF.")
    }
  }

  const handlePreviewMonthlyGridSheet = () => {
    if (dataForReports.length === 0) {
      toast.error("No records match the current filters.")
      return
    }
    try {
      const result = generateMonthlyAttendanceSheet(
        dataForReports,
        attendance,
        contracts,
        billingCycleDates,
        monthLabel,
        selectedYear,
        "drivers",
        settings.section,
        true
      )
      if (result) {
        setPreviewPdf({
          url: result.url,
          filename: result.filename,
          title: `Monthly Grid Attendance Sheet — ${monthLabel} ${selectedYear}`,
        })
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to preview monthly grid attendance sheet PDF.")
    }
  }

  const handleDownloadEmployeeReceipt = (row: any) => {
    try {
      const empAttendance = attendance[row.employeeId] || {}
      generateEmployeeReceipt(
        row,
        empAttendance,
        billingCycleDates,
        monthLabel,
        selectedYear,
        settings.section
      )
      toast.success(`Attendance receipt generated for ${row.name}.`)
    } catch (e) {
      console.error(e)
      toast.error("Failed to generate employee receipt PDF.")
    }
  }

  const handlePreviewEmployeeReceipt = (row: any) => {
    try {
      const empAttendance = attendance[row.employeeId] || {}
      const result = generateEmployeeReceipt(
        row,
        empAttendance,
        billingCycleDates,
        monthLabel,
        selectedYear,
        settings.section,
        true
      )
      if (result) {
        setPreviewPdf({
          url: result.url,
          filename: result.filename,
          title: `Receipt — ${row.name}`,
        })
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to preview employee receipt PDF.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top billing cycle bar */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <RiCalendarEventLine className="size-5 text-primary" />
            <div>
              <h3 className="font-heading text-sm leading-tight font-bold">
                Payroll Cycle Selection
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Billing Cycle: {cycleStartStr} to {cycleEndStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={String(selectedMonth)}
              onValueChange={(val) => setSelectedMonth(Number(val))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
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
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Staff */}
        <Card className="border-border/60 bg-card/40">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Active Staff
              </p>
              <h3 className="mt-1 font-heading font-mono text-2xl font-bold">
                {activeStaff}
              </h3>
            </div>
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <RiGroupLine className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Regular Days Logged */}
        <Card className="border-border/60 bg-card/40">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Regular Days
              </p>
              <h3 className="mt-1 font-heading font-mono text-2xl font-bold">
                {regularDaysLogged.toFixed(1)}
              </h3>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-500">
              <RiCalendarEventLine className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Overtime Days Logged */}
        <Card className="border-border/60 bg-card/40">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Overtime Days
              </p>
              <h3 className="mt-1 font-heading font-mono text-2xl font-bold">
                {overtimeDaysLogged}
              </h3>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-3 text-amber-500">
              <RiTimeLine className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Grand Total Payroll */}
        <Card className="border-border/60 bg-card/40">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Grand Total
              </p>
              <h3 className="mt-1 max-w-[170px] truncate font-heading font-mono text-2xl font-bold text-primary">
                {formatIndianRupees(grandTotalPayroll)}
              </h3>
            </div>
            <div className="rounded-lg bg-primary/15 p-3 text-primary">
              <RiCoinsLine className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MULTI-CRITERIA REPORT FILTERS BAR */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <CardTitle className="flex items-center gap-2 font-heading text-sm font-bold uppercase">
              <RiFilter3Line className="size-4 text-primary" />
              Report Criteria & Criteria Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                Showing {filteredPayrollData.length} of {payrollData.length} records
              </Badge>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleResetFilters}
                  className="h-7 text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                >
                  <RiRestartLine className="mr-1 size-3.5" />
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* 1. Free Search Input */}
            <div className="relative">
              <RiSearchLine className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search Name/U.O./Bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* 2. Employee Combobox */}
            <div>
              <Combobox
                value={filterEmployeeId}
                onValueChange={(val) =>
                  setFilterEmployeeId((val as string) || "")
                }
                itemToStringLabel={(val) => {
                  if (!val) return "All Staff"
                  const emp = employees.find((e) => e.id === val)
                  return emp ? emp.name : "All Staff"
                }}
                itemToStringValue={(val) => (val as string) || ""}
              >
                <ComboboxInput
                  placeholder="Select Employee..."
                  name="employee-filter"
                  aria-label="Filter by employee"
                  autoComplete="off"
                  className="h-8 w-full text-xs"
                  showClear={!!filterEmployeeId}
                />
                <ComboboxContent>
                  <ComboboxEmpty>No employee found.</ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxItem value="" className="flex items-center gap-2">
                      <span className="font-semibold text-xs">All Staff</span>
                    </ComboboxItem>
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

            {/* 3. Job Category Select */}
            <div>
              <Select
                value={filterCategory}
                onValueChange={(val) => setFilterCategory(val || "all")}
              >
                <SelectTrigger className="h-8 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <RiBriefcaseLine className="size-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* 4. OT Status Select */}
            <div>
              <Select
                value={filterOtStatus}
                onValueChange={(val) =>
                  setFilterOtStatus(val as "all" | "has_ot" | "no_ot")
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <RiTimeLine className="size-3.5 text-muted-foreground" />
                    <SelectValue placeholder="OT Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All OT Status</SelectItem>
                    <SelectItem value="has_ot">With Overtime</SelectItem>
                    <SelectItem value="no_ot">Without Overtime</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* 5. Min Days Input */}
            <div>
              <Input
                type="number"
                placeholder="Min Work Days..."
                value={filterMinDays}
                onChange={(e) => setFilterMinDays(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* 6. Min Pay Input */}
            <div>
              <Input
                type="number"
                placeholder="Min Pay (₹)..."
                value={filterMinPay}
                onChange={(e) => setFilterMinPay(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Sheet table */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
              <RiMoneyRupeeCircleLine className="size-5 text-primary" />
              Payroll Disbursement Report Sheet
            </CardTitle>
            <CardDescription>
              Disbursement previews for {monthLabel} {selectedYear} billing cycle ({cycleStartStr} to {cycleEndStr}).
            </CardDescription>
          </div>

          {payrollData.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg shadow-sm">
                <Button
                  onClick={handleDownloadSummary}
                  size="sm"
                  className="cursor-pointer rounded-r-none border-r border-primary-foreground/10"
                >
                  <RiFileDownloadLine className="mr-1.5 size-4" />
                  Summary Report
                </Button>
                <Button
                  onClick={handlePreviewSummary}
                  size="sm"
                  className="cursor-pointer rounded-l-none px-2.5"
                  title="Preview Summary Report"
                >
                  <RiEyeLine className="size-4" />
                </Button>
              </div>

              <div className="inline-flex rounded-lg shadow-sm">
                <Button
                  onClick={handleDownloadAttendanceReport}
                  size="sm"
                  variant="outline"
                  className="cursor-pointer rounded-r-none border-r-0"
                >
                  <RiFilePaper2Line className="mr-1.5 size-4" />
                  Attendance Report
                </Button>
                <Button
                  onClick={handlePreviewAttendanceReport}
                  size="sm"
                  variant="outline"
                  className="cursor-pointer rounded-l-none border-l-slate-200 px-2.5"
                  title="Preview Attendance Report"
                >
                  <RiEyeLine className="size-4" />
                </Button>
              </div>

              <div className="inline-flex rounded-lg shadow-sm">
                <Button
                  onClick={handleDownloadMonthlyGridSheet}
                  size="sm"
                  variant="secondary"
                  className="cursor-pointer rounded-r-none border-r border-secondary-foreground/10"
                >
                  <RiCalendarEventLine className="mr-1.5 size-4" />
                  Monthly Grid Sheet
                </Button>
                <Button
                  onClick={handlePreviewMonthlyGridSheet}
                  size="sm"
                  variant="secondary"
                  className="cursor-pointer rounded-l-none px-2.5"
                  title="Preview Monthly Grid Sheet"
                >
                  <RiEyeLine className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {payrollData.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <Empty>
                <div className="max-w-sm text-center">
                  <p className="mb-1 text-sm font-semibold text-muted-foreground">
                    No Payroll Data Available
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    No employees have overlapping active contracts and attendance logged for this billing cycle.
                  </p>
                </div>
              </Empty>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Job Category</TableHead>
                    <TableHead className="text-center font-mono">
                      Regular Days
                    </TableHead>
                    <TableHead className="text-center font-mono">
                      OT Days
                    </TableHead>
                    <TableHead className="text-right">Regular Pay</TableHead>
                    <TableHead className="text-right">OT Pay</TableHead>
                    <TableHead className="text-right">Total Pay</TableHead>
                    <TableHead className="text-right">Receipts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayrollData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-xs text-muted-foreground"
                      >
                        No employees match the selected criteria filters.
                        <Button
                          variant="link"
                          size="xs"
                          onClick={handleResetFilters}
                          className="ml-2 text-primary underline"
                        >
                          Clear criteria filters
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayrollData.map((row) => (
                      <TableRow key={row.employeeId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const emp = employees.find(
                                (e) => e.id === row.employeeId
                              )
                              return emp ? (
                                <EmployeeAvatar
                                  employee={emp}
                                  size="sm"
                                  className="border-border/60"
                                />
                              ) : (
                                <div className="flex size-6 items-center justify-center rounded-full border border-border/40 bg-muted text-[9px] font-bold text-muted-foreground uppercase">
                                  ?
                                </div>
                              )
                            })()}
                            <span>{row.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell className="text-center font-mono">
                          {row.regularDays.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {row.otDays}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatIndianRupees(row.regularPay)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatIndianRupees(row.otPay)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-primary">
                          {formatIndianRupees(row.totalPay)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex rounded-md shadow-xs">
                            <Button
                              size="xs"
                              variant="outline"
                              className="cursor-pointer rounded-r-none border-r-0"
                              onClick={() => handleDownloadEmployeeReceipt(row)}
                              title="Download Receipt"
                            >
                              <RiFileDownloadLine className="mr-1 size-3" />
                              Receipt PDF
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              className="cursor-pointer rounded-l-none border-l-slate-200 pr-1.5 pl-1.5"
                              onClick={() => handlePreviewEmployeeReceipt(row)}
                              title="Preview Receipt"
                            >
                              <RiEyeLine className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Preview Dialog */}
      <Dialog
        open={!!previewPdf}
        onOpenChange={(open) => {
          if (!open) {
            if (previewPdf) URL.revokeObjectURL(previewPdf.url)
            setPreviewPdf(null)
          }
        }}
      >
        <DialogContent className="flex h-[88vh] w-full max-w-[95vw] flex-col overflow-hidden p-0 sm:max-w-[85vw] sm:rounded-xl">
          {previewPdf && (
            <PdfViewer
              file={previewPdf.url}
              mode="scroll"
              className="h-full w-full rounded-none border-none"
              onDownload={() => {
                const a = document.createElement("a")
                a.href = previewPdf.url
                a.download = previewPdf.filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                toast.success("Downloaded", {
                  description: `${previewPdf.title} has been downloaded.`,
                })
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
