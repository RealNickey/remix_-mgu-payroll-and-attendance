import { useState } from "react"
import { useMguDb } from "@/lib/db"
import type { JobCategory, Employee } from "@/lib/types"
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
  RiEditLine,
  RiSave2Line,
} from "@remixicon/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export const EmployeeProfiles = () => {
  const { employees, contracts, addEmployee, updateEmployee, deleteEmployee, saveEmployees } =
    useMguDb()

  // Form states
  const [name, setName] = useState("")
  const [category, setCategory] = useState<JobCategory | "">("")
  const [bankAccount, setBankAccount] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Validation errors
  const [nameError, setNameError] = useState(false)
  const [categoryError, setCategoryError] = useState(false)
  const [bankAccountError, setBankAccountError] = useState(false)
  const [addressError, setAddressError] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Edit states
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null)

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

    if (!address.trim()) {
      setAddressError(true)
      hasError = true
    } else {
      setAddressError(false)
    }

    const isPhoneValid = /^\d{10}$/.test(phone.trim())
    if (!phone.trim()) {
      setPhoneError("Phone number is required.")
      hasError = true
    } else if (!isPhoneValid) {
      setPhoneError("Phone number must be exactly 10 digits.")
      hasError = true
    } else {
      setPhoneError(null)
    }

    if (hasError) {
      toast.error("Please correct the errors in the form.")
      return
    }

    const previousEmployees = [...employees]
    if (editingEmployeeId) {
      updateEmployee(editingEmployeeId, {
        name: name.trim(),
        category: category as JobCategory,
        bankAccount: bankAccount.trim(),
        address: address.trim(),
        phone: phone.trim(),
      })
      toast.success(`Employee "${name.trim()}" updated successfully.`)
      setEditingEmployeeId(null)
    } else {
      addEmployee(name.trim(), category as JobCategory, bankAccount.trim(), address.trim(), phone.trim())
      toast.success(`Employee "${name.trim()}" registered successfully.`, {
        action: {
          label: "Undo",
          onClick: () => saveEmployees(previousEmployees),
        },
      })
    }

    // Reset form
    setName("")
    setCategory("")
    setBankAccount("")
    setAddress("")
    setPhone("")
  }

  const handleStartEdit = (emp: Employee) => {
    setEditingEmployeeId(emp.id)
    setName(emp.name)
    setCategory(emp.category)
    setBankAccount(emp.bankAccount)
    setAddress(emp.address || "")
    setPhone(emp.phone || "")
    setNameError(false)
    setCategoryError(false)
    setBankAccountError(false)
    setAddressError(false)
    setPhoneError(null)
  }

  const handleCancelEdit = () => {
    setEditingEmployeeId(null)
    setName("")
    setCategory("")
    setBankAccount("")
    setAddress("")
    setPhone("")
    setNameError(false)
    setCategoryError(false)
    setBankAccountError(false)
    setAddressError(false)
    setPhoneError(null)
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
    if (editingEmployeeId === id) {
      handleCancelEdit()
    }
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
              {editingEmployeeId ? (
                <>
                  <RiEditLine className="size-5 text-primary" />
                  Edit Employee
                </>
              ) : (
                <>
                  <RiUserAddLine className="size-5 text-primary" />
                  Register Employee
                </>
              )}
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              {editingEmployeeId
                ? "Modify the selected employee's details."
                : "Add a new contractual staff member to the portal registry."}
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

                <Field data-invalid={phoneError ? "true" : undefined}>
                  <FieldLabel htmlFor="phone">Phone Number (10 digits)</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "")
                      setPhone(val)
                      if (val.length === 10) setPhoneError(null)
                    }}
                    aria-invalid={phoneError ? "true" : undefined}
                  />
                  {phoneError && <FieldError>{phoneError}</FieldError>}
                </Field>

                <Field data-invalid={addressError ? "true" : undefined}>
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <Input
                    id="address"
                    name="address"
                    placeholder="e.g. Ward 5, MG University Campus, Kottayam"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      if (e.target.value.trim()) setAddressError(false)
                    }}
                    aria-invalid={addressError ? "true" : undefined}
                  />
                  {addressError && <FieldError>Address is required.</FieldError>}
                </Field>
              </FieldGroup>

              <div className="flex gap-2 mt-2">
                {editingEmployeeId && (
                  <Button type="button" variant="outline" className="flex-1" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" className="flex-1">
                  {editingEmployeeId ? (
                    <>
                      <RiSave2Line data-icon="inline-start" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <RiUserAddLine data-icon="inline-start" />
                      Add Employee
                    </>
                  )}
                </Button>
              </div>
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
                          <div className="mt-1.5 flex flex-col gap-1 text-[11px] text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-3">
                            <span>A/C: {emp.bankAccount}</span>
                            {emp.phone && <span>Ph: {emp.phone}</span>}
                            {emp.address && <span className="max-w-xs truncate sm:max-w-md">Addr: {emp.address}</span>}
                          </div>
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
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 opacity-0 transition-opacity group-hover/row:opacity-100"
                          onClick={() => handleStartEdit(emp)}
                          title="Edit Profile"
                        >
                          <RiEditLine className="size-4" />
                        </Button>
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
