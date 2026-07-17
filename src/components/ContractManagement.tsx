import { useState } from "react"
import { useMguDb } from "@/lib/db"
import { getContractStatus } from "@/lib/payrollUtils"
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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { EmployeeAvatar } from "@/components/ui/employee-avatar"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  RiFilePaperLine,
  RiFileAddLine,
  RiSearchLine,
  RiFileList3Line,
  RiAlertLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { addDays } from "date-fns"
import { type DateRange } from "react-day-picker"
import { useMemo } from "react"

interface ContractManagementProps {
  onNavigateToEmployees: () => void
}

export const ContractManagement = ({
  onNavigateToEmployees,
}: ContractManagementProps) => {
  const { employees, contracts, addContract, voidContract, saveContracts } =
    useMguDb()

  // Form states
  const [employeeId, setEmployeeId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [goNumber, setGoNumber] = useState("")
  const [goDate, setGoDate] = useState("")

  const [isSelectingTo, setIsSelectingTo] = useState(false)

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return undefined
    const parts = dateStr.split("-").map(Number)
    if (parts.length !== 3) return undefined
    return new Date(parts[0], parts[1] - 1, parts[2])
  }

  const formatLocalDate = (date: Date): string => {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!startDate) return undefined
    const from = parseLocalDate(startDate)
    const to = endDate ? parseLocalDate(endDate) : undefined
    return { from, to }
  }, [startDate, endDate])

  const handleRangeSelect = (_range: DateRange | undefined, selectedDay: Date) => {
    if (!selectedDay) {
      setStartDate("")
      setEndDate("")
      setIsSelectingTo(false)
      return
    }

    if (!isSelectingTo) {
      // User clicked a start date. We automatically select 90 days.
      const fromStr = formatLocalDate(selectedDay)
      // Automatically calculate 90 days (start date + 89 days)
      const toDate = addDays(selectedDay, 89)
      const toStr = formatLocalDate(toDate)

      setStartDate(fromStr)
      setEndDate(toStr)
      setIsSelectingTo(true)
      setStartDateError(false)
    } else {
      // User is selecting the end date
      const start = startDate ? parseLocalDate(startDate) : undefined
      if (start && selectedDay < start) {
        // If clicked date is before 'from', treat it as a new 'from' date
        const fromStr = formatLocalDate(selectedDay)
        const toDate = addDays(selectedDay, 89)
        const toStr = formatLocalDate(toDate)

        setStartDate(fromStr)
        setEndDate(toStr)
        setIsSelectingTo(true)
      } else {
        // Confirm / change the end date
        const toStr = formatLocalDate(selectedDay)
        setEndDate(toStr)
        setIsSelectingTo(false)
      }
    }
  }

  // Search filter
  const [searchQuery, setSearchQuery] = useState("")

  // Validation
  const [empError, setEmpError] = useState(false)
  const [startDateError, setStartDateError] = useState(false)
  const [goError, setGoError] = useState(false)
  const [goDateError, setGoDateError] = useState(false)

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const activeElement = document.activeElement
      if (!activeElement) return

      const tagName = activeElement.tagName
      const type = (activeElement as HTMLInputElement).type

      if (tagName === "TEXTAREA" || type === "submit") {
        return
      }

      const isInput = tagName === "INPUT"
      const isSelectTrigger =
        activeElement.getAttribute("data-slot") === "select-trigger"
      const isDatePicker =
        tagName === "BUTTON" &&
        activeElement.classList.contains("h-9") &&
        activeElement.classList.contains("w-full") &&
        activeElement.classList.contains("justify-start")

      if (isInput || isSelectTrigger || isDatePicker) {
        const isExpanded = activeElement.getAttribute("aria-expanded") === "true"
        if (isExpanded) {
          return
        }

        const nameAttr = activeElement.getAttribute("name")
        if (nameAttr === "employee-select" && !employeeId) {
          return
        }
        if (activeElement.classList.contains("justify-start")) {
          const idAttr = activeElement.getAttribute("id")
          if (idAttr === "goDate") {
            if (!goDate) return
          } else if (idAttr === "contractPeriod") {
            if (!startDate || !endDate) return
          }
        }

        e.preventDefault()

        const form = e.currentTarget
        const selector =
          'input:not([disabled]):not([type="hidden"]), button[data-slot="select-trigger"]:not([disabled]), button.h-9.w-full.justify-start:not([disabled])'
        const fields = Array.from(form.querySelectorAll<HTMLElement>(selector))

        const currentIndex = fields.indexOf(activeElement as HTMLElement)
        if (currentIndex > -1 && currentIndex < fields.length - 1) {
          const nextField = fields[currentIndex + 1]
          nextField.focus()
          if (nextField instanceof HTMLInputElement && nextField.type === "text") {
            nextField.select()
          }
        } else if (currentIndex === fields.length - 1) {
          form.requestSubmit()
        }
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let hasError = false
    if (!employeeId) {
      setEmpError(true)
      hasError = true
    } else {
      setEmpError(false)
    }

    if (!startDate || !endDate) {
      setStartDateError(true)
      hasError = true
    } else {
      setStartDateError(false)
    }

    if (!goNumber.trim()) {
      setGoError(true)
      hasError = true
    } else {
      setGoError(false)
    }

    if (!goDate) {
      setGoDateError(true)
      hasError = true
    } else {
      setGoDateError(false)
    }

    if (hasError) {
      toast.error("Please fill in all required fields.")
      return
    }

    const previousContracts = [...contracts]
    addContract(
      employeeId,
      startDate,
      endDate,
      goNumber.trim(),
      goDate
    )
    const emp = employees.find((e) => e.id === employeeId)
    toast.success(`Service contract issued for ${emp?.name || "employee"}.`, {
      action: {
        label: "Undo",
        onClick: () => saveContracts(previousContracts),
      },
    })

    // Reset Form
    setEmployeeId("")
    setStartDate("")
    setEndDate("")
    setGoNumber("")
    setGoDate("")
    setIsSelectingTo(false)
  }

  const handleVoid = (id: string, goNo: string) => {
    const previousContracts = [...contracts]
    voidContract(id)
    toast.success(`Contract ${goNo} has been voided.`, {
      action: {
        label: "Undo",
        onClick: () => saveContracts(previousContracts),
      },
    })
  }

  // Get employee name for a contract row
  const getEmployeeNameAndCategory = (empId: string) => {
    const emp = employees.find((e) => e.id === empId)
    if (!emp) {
      return { name: "Unknown Employee", category: "", initials: "?" }
    }
    return { name: emp.name, category: emp.category }
  }

  // Live status badge styling
  const getStatusBadge = (start: string, end: string) => {
    const status = getContractStatus(start, end)
    switch (status) {
      case "Active":
        return (
          <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            Active
          </Badge>
        )
      case "Upcoming":
        return (
          <Badge className="border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
            Upcoming
          </Badge>
        )
      case "Expired":
        return (
          <Badge className="border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
            Expired
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  // Filtered contracts
  const filteredContracts = contracts.filter((c) => {
    const q = searchQuery.toLowerCase()
    const empDetails = getEmployeeNameAndCategory(c.employeeId)
    return (
      empDetails.name.toLowerCase().includes(q) ||
      empDetails.category.toLowerCase().includes(q) ||
      c.goNumber.toLowerCase().includes(q)
    )
  })

  // KPI calculations
  const totalContracts = contracts.length
  const activeContractsCount = contracts.filter(
    (c) => getContractStatus(c.startDate, c.endDate) === "Active"
  ).length

  return (
    <div className="flex flex-col gap-6">
      {/* Prerequisite warning: No employees */}
      {employees.length === 0 ? (
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/20"
        >
          <RiAlertLine className="size-5" />
          <AlertTitle className="font-heading text-sm font-bold">
            No Employees Registered
          </AlertTitle>
          <AlertDescription className="mt-1 text-xs">
            You must register at least one employee in the system before you can
            issue service contracts.
            <Button
              variant="link"
              onClick={onNavigateToEmployees}
              className="ml-1 h-auto p-0 align-baseline font-medium text-destructive underline"
            >
              Go to Employee Profiles workspace.
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* KPI Summary Cards */}
          <Card className="border-border/60 bg-card/40">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Total Contracts
                </p>
                <h3 className="mt-1 font-heading font-mono text-3xl font-bold">
                  {totalContracts}
                </h3>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <RiFileList3Line className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/40">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Active Contracts
                </p>
                <h3 className="mt-1 font-heading font-mono text-3xl font-bold text-emerald-500">
                  {activeContractsCount}
                </h3>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-500">
                <RiFilePaperLine className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {employees.length > 0 && (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Issue Contract Panel */}
          <div className="w-full lg:w-1/3">
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
                  <RiFileAddLine className="size-5 text-primary" />
                  Issue Service Contract
                </CardTitle>
                <CardDescription>
                  Create a service contract for an employee under a University
                  Order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4" onKeyDown={handleFormKeyDown}>
                  <FieldGroup>
                    <Field data-invalid={empError ? "true" : undefined}>
                      <FieldLabel>Select Employee</FieldLabel>
                      <Combobox
                        value={employeeId}
                        onValueChange={(val) => {
                          setEmployeeId(val as string)
                          setEmpError(false)
                        }}
                        itemToStringLabel={(val) => {
                          if (!val) return ""
                          const emp = employees.find((e) => e.id === val)
                          return emp ? emp.name : ""
                        }}
                        itemToStringValue={(val) => val as string}
                      >
                        <ComboboxInput placeholder="Choose employee…" name="employee-select" aria-label="Select employee" autoComplete="off" />
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
                      {empError && (
                        <FieldError>Employee is required.</FieldError>
                      )}
                    </Field>

                    <Field data-invalid={startDateError ? "true" : undefined}>
                      <FieldLabel htmlFor="contractPeriod">Contract Period</FieldLabel>
                      <div className="flex items-center gap-2">
                        <DatePickerWithRange
                          id="contractPeriod"
                          className="flex-1"
                          date={dateRange}
                          setDate={() => {}}
                          onSelect={handleRangeSelect}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setStartDate("")
                            setEndDate("")
                            setIsSelectingTo(false)
                          }}
                          disabled={!startDate && !endDate}
                          className="h-9 px-3 shrink-0"
                        >
                          Reset
                        </Button>
                      </div>
                      {startDateError && (
                        <FieldError>
                          Contract period is required.
                        </FieldError>
                      )}
                      {startDate && endDate && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Selected Duration:{" "}
                          <span className="font-semibold text-foreground">
                            {parseLocalDate(startDate)?.toLocaleDateString("en-GB")}
                          </span>{" "}
                          to{" "}
                          <span className="font-semibold text-foreground">
                            {parseLocalDate(endDate)?.toLocaleDateString("en-GB")}
                          </span>{" "}
                          (Total {Math.round((parseLocalDate(endDate)!.getTime() - parseLocalDate(startDate)!.getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
                        </p>
                      )}
                    </Field>

                    <Field data-invalid={goError ? "true" : undefined}>
                      <FieldLabel htmlFor="goNumber">
                        University Order No. (U.O.)
                      </FieldLabel>
                      <Input
                        id="goNumber"
                        name="goNumber"
                        spellCheck={false}
                        placeholder="e.g. Ad.B3/928/2026/MGU"
                        value={goNumber}
                        onChange={(e) => {
                          setGoNumber(e.target.value)
                          if (e.target.value.trim()) setGoError(false)
                        }}
                        aria-invalid={goError ? "true" : undefined}
                      />
                      {goError && (
                        <FieldError>U.O. Number is required.</FieldError>
                      )}
                    </Field>

                    <Field data-invalid={goDateError ? "true" : undefined}>
                      <FieldLabel htmlFor="goDate">Order Issue Date</FieldLabel>
                      <DatePicker
                        id="goDate"
                        value={goDate}
                        onChange={(val) => {
                          setGoDate(val)
                          setGoDateError(false)
                        }}
                      />
                      {goDateError && (
                        <FieldError>Order Issue Date is required.</FieldError>
                      )}
                    </Field>
                  </FieldGroup>

                  <Button type="submit" className="mt-2 w-full">
                    <RiFileAddLine data-icon="inline-start" />
                    Issue Contract
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Registry Table */}
          <div className="flex-1">
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
                    <RiFileList3Line className="size-5 text-primary" />
                    Contract Registry
                  </CardTitle>
                  <CardDescription>
                    History and active logs of contracts.
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-64">
                  <RiSearchLine className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Employee/U.O. (e.g., Ramesh)…"
                    name="contract-search"
                    aria-label="Search contracts"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>

              <CardContent>
                {filteredContracts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                    <Empty>
                      <div className="text-center">
                        <p className="mb-2 text-muted-foreground">
                          No contracts found.
                        </p>
                        {searchQuery && (
                          <p className="text-xs text-muted-foreground/80">
                            Try refining your search query.
                          </p>
                        )}
                      </div>
                    </Empty>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Contract Term</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>U.O. / Issue Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContracts.map((c) => {
                          const empInfo = getEmployeeNameAndCategory(
                            c.employeeId
                          )
                          const isOrphan = empInfo.name === "Unknown Employee"

                          // Format display dates
                          const startDisplay = new Date(
                            c.startDate
                          ).toLocaleDateString("en-GB")
                          const endDisplay = new Date(
                            c.endDate
                          ).toLocaleDateString("en-GB")
                          const goDateDisplay = new Date(
                            c.goDate
                          ).toLocaleDateString("en-GB")

                          return (
                            <TableRow key={c.id} className="group/row">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {!isOrphan ? (
                                    <EmployeeAvatar
                                      employee={employees.find(
                                        (e) => e.id === c.employeeId
                                      )!}
                                      size="sm"
                                      className="border-border/60"
                                    />
                                  ) : (
                                    <div className="flex size-6 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[9px] font-bold text-rose-500 uppercase">
                                      ?
                                    </div>
                                  )}
                                  <div>
                                    <p
                                      className={`leading-tight font-medium ${isOrphan ? "text-rose-500 italic" : "text-foreground"}`}
                                    >
                                      {empInfo.name}
                                    </p>
                                    {!isOrphan && (
                                      <p className="mt-0.5 text-xs text-muted-foreground">
                                        {empInfo.category}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                <div>{startDisplay}</div>
                                <div className="text-muted-foreground">
                                  to {endDisplay}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(c.startDate, c.endDate)}
                              </TableCell>
                              <TableCell className="text-xs">
                                <div className="font-mono">{c.goNumber}</div>
                                <div className="mt-0.5 font-sans text-muted-foreground">
                                  Issued: {goDateDisplay}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger
                                    render={
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="opacity-0 transition-opacity group-hover/row:opacity-100"
                                      >
                                        Void
                                      </Button>
                                    }
                                  />
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Void Service Contract?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-sm text-muted-foreground">
                                        Are you sure you want to void contract{" "}
                                        <strong className="text-foreground">
                                          {c.goNumber}
                                        </strong>
                                        ?
                                        <br />
                                        <br />
                                        <span className="font-medium text-destructive">
                                          Warning:
                                        </span>{" "}
                                        Voiding this contract will affect
                                        payroll calculation for dates within its
                                        duration, as there will be no covering
                                        contract. This cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleVoid(c.id, c.goNumber)
                                        }
                                        className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                                      >
                                        Void Contract
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
