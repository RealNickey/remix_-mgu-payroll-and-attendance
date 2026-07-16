import { useState } from "react"
import { useMguDb } from "@/lib/db"
import type { JobCategory } from "@/lib/types"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item"
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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { EmployeeAvatar } from "@/components/ui/employee-avatar"
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
  RiDeleteBinLine,
  RiUserAddLine,
  RiSearchLine,
  RiContactsLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export const EmployeeProfiles = () => {
  const { employees, contracts, addEmployee, deleteEmployee, saveEmployees } =
    useMguDb()

  // Form states
  const [name, setName] = useState("")
  const [category, setCategory] = useState<JobCategory | "">("")
  const [bankAccount, setBankAccount] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Validation errors
  const [nameError, setNameError] = useState(false)
  const [categoryError, setCategoryError] = useState(false)
  const [bankAccountError, setBankAccountError] = useState(false)

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

        if (isSelectTrigger && !category) {
          return
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
    if (!name.trim()) {
      setNameError(true)
      hasError = true
    } else {
      setNameError(false)
    }

    if (!category) {
      setCategoryError(true)
      hasError = true
    } else {
      setCategoryError(false)
    }

    if (!bankAccount.trim()) {
      setBankAccountError(true)
      hasError = true
    } else {
      setBankAccountError(false)
    }

    if (hasError) {
      toast.error("Please fill in all required fields.")
      return
    }

    const previousEmployees = [...employees]
    addEmployee(name.trim(), category as JobCategory, bankAccount.trim())
    toast.success(`Employee "${name.trim()}" registered successfully.`, {
      action: {
        label: "Undo",
        onClick: () => saveEmployees(previousEmployees),
      },
    })

    // Reset form
    setName("")
    setCategory("")
    setBankAccount("")
  }

  const handleDelete = (id: string, empName: string) => {
    const previousEmployees = [...employees]
    deleteEmployee(id)
    toast.success(`Employee "${empName}" has been deleted.`, {
      action: {
        label: "Undo",
        onClick: () => saveEmployees(previousEmployees),
      },
    })
  }

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase()
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.category.toLowerCase().includes(q) ||
      emp.bankAccount.toLowerCase().includes(q)
    )
  })

  const getContractCount = (empId: string) => {
    return contracts.filter((c) => c.employeeId === empId).length
  }

  // Category Color mapping for initial bubble
  const getCategoryColor = (cat: JobCategory) => {
    switch (cat) {
      case "Gardeners":
        return "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20"
      case "Drivers":
        return "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20"
      case "Cooks":
        return "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/20"
      case "Helpers":
        return "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Registration Section */}
      <div className="w-full lg:w-1/3">
        <Card className="border-border/40 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
              <RiUserAddLine className="size-5 text-primary" />
              Register Employee
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Add a new contractual staff member to the portal registry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" onKeyDown={handleFormKeyDown}>
              <FieldGroup>
                <Field data-invalid={nameError ? "true" : undefined}>
                  <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                  <Input
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    placeholder="e.g. Sri. Ramesh Kumar"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (e.target.value.trim()) setNameError(false)
                    }}
                    aria-invalid={nameError ? "true" : undefined}
                  />
                  {nameError && <FieldError>Full Name is required.</FieldError>}
                </Field>

                <Field data-invalid={categoryError ? "true" : undefined}>
                  <FieldLabel>Job Category</FieldLabel>
                  <Select
                    value={category}
                    onValueChange={(val) => {
                      setCategory(val as JobCategory)
                      setCategoryError(false)
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={categoryError ? "true" : undefined}
                    >
                      <SelectValue placeholder="Select category…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Gardeners">Gardeners</SelectItem>
                        <SelectItem value="Drivers">Drivers</SelectItem>
                        <SelectItem value="Cooks">Cooks</SelectItem>
                        <SelectItem value="Helpers">Helpers</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {categoryError && (
                    <FieldError>Job Category is required.</FieldError>
                  )}
                </Field>

                <Field data-invalid={bankAccountError ? "true" : undefined}>
                  <FieldLabel htmlFor="bankAccount">
                    Bank Account Number
                  </FieldLabel>
                  <Input
                    id="bankAccount"
                    name="bankAccount"
                    placeholder="e.g. SBI-1234567890"
                    spellCheck={false}
                    autoComplete="off"
                    value={bankAccount}
                    onChange={(e) => {
                      setBankAccount(e.target.value)
                      if (e.target.value.trim()) setBankAccountError(false)
                    }}
                    aria-invalid={bankAccountError ? "true" : undefined}
                  />
                  {bankAccountError && (
                    <FieldError>Bank Account Number is required.</FieldError>
                  )}
                </Field>
              </FieldGroup>

              <Button type="submit" className="mt-2 w-full">
                <RiUserAddLine data-icon="inline-start" />
                Add Employee
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Directory Section */}
      <div className="flex-1">
        <Card className="flex flex-1 flex-col border-border/40 bg-card shadow-sm">
          <CardHeader className="flex flex-col gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
                <RiContactsLine className="size-5 text-primary" />
                Employee Directory
              </CardTitle>
              <CardDescription className="mt-1 text-muted-foreground/80">
                Search and manage employee records.
              </CardDescription>
            </div>

            <div className="flex w-full items-center sm:w-72">
              <div className="relative flex-1">
                <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search directory (e.g., Ramesh)…"
                  name="directory-search"
                  aria-label="Search directory"
                  className={cn(
                    "h-9 pl-9",
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
                  className="h-9 rounded-l-none px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {filteredEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <Empty>
                  <div className="text-center">
                    <p className="mb-2 text-muted-foreground">
                      No employee records found.
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
              <ItemGroup className="gap-3">
                {filteredEmployees.map((emp) => {
                  const cCount = getContractCount(emp.id)

                  return (
                    <Item
                      key={emp.id}
                      variant="outline"
                      className="group/row bg-card p-3 hover:bg-muted/30"
                    >
                      <ItemMedia>
                        <EmployeeAvatar
                          employee={emp}
                          size="lg"
                          className={getCategoryColor(emp.category)}
                        />
                      </ItemMedia>
                      <ItemContent className="ml-2">
                        <ItemTitle className="text-base">{emp.name}</ItemTitle>
                        <ItemDescription>
                          <Badge
                            variant="outline"
                            className={`${getCategoryColor(emp.category)} mr-2 min-h-5 border-0 px-1.5 py-0 text-[10px] font-medium`}
                          >
                            {emp.category}
                          </Badge>
                          <span className="mr-2 font-mono text-xs text-muted-foreground">
                            ID: {emp.id.substring(0, 8)}
                          </span>
                          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                            A/C: {emp.bankAccount}
                          </span>
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions className="gap-3 sm:gap-4">
                        <div className="mr-1 flex flex-col items-end gap-1 sm:mr-2 sm:flex-row sm:items-center sm:gap-3">
                          <span className="hidden text-[10px] font-semibold text-muted-foreground uppercase sm:inline-block">
                            Contracts
                          </span>
                          <Badge
                            variant={cCount > 0 ? "secondary" : "ghost"}
                            className="font-mono font-semibold"
                          >
                            {cCount}
                          </Badge>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="destructive"
                                size="icon"
                                className="size-8 opacity-0 transition-opacity group-hover/row:opacity-100"
                              />
                            }
                          >
                            <RiDeleteBinLine className="size-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-sm text-muted-foreground">
                                This action will permanently delete{" "}
                                <strong className="text-foreground">
                                  {emp.name}
                                </strong>{" "}
                                from the system directory.
                                <br />
                                <br />
                                <span className="font-medium text-destructive">
                                  Warning:
                                </span>{" "}
                                Any contracts linked to this employee will
                                become orphaned. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(emp.id, emp.name)}
                                className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                              >
                                Delete Employee
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </ItemActions>
                    </Item>
                  )
                })}
              </ItemGroup>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
