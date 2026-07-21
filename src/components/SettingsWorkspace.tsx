import { useState, useEffect } from "react"
import { useMguDb } from "@/lib/db"
import type { WageSettings } from "@/lib/types"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  RiSettings4Line,
  RiSave2Line,
  RiInformationLine,
  RiDatabase2Line,
  RiDownload2Line,
  RiUpload2Line,
  RiAlertLine,
  RiAddLine,
  RiCalendarEventLine,
  RiBriefcaseLine,
  RiLockPasswordLine,
  RiKeyLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { generateSettingsPreview } from "@/lib/pdfGenerator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const DEFAULT_CATEGORIES = ["Gardeners", "Drivers", "Cooks", "Helpers"]

export const SettingsWorkspace = () => {
  const {
    settings,
    saveSettings,
    employees,
    contracts,
    attendance,
    saveEmployees,
    saveContracts,
    saveAttendance,
  } = useMguDb()

  // Category & Rate states
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES)
  const [wageRates, setWageRates] = useState<Record<string, number | "">>({})
  const [otRates, setOtRates] = useState<Record<string, number | "">>({})
  const [otCeilings, setOtCeilings] = useState<Record<string, number | "">>({})

  // Section state
  const [selectedSection, setSelectedSection] = useState<
    "Ad.B5" | "Ad.B7" | "Estate 1" | "Estate 2"
  >("Ad.B5")

  // Billing Cycle states
  const [cycleStartDay, setCycleStartDay] = useState<number | "">(26)
  const [cycleEndDay, setCycleEndDay] = useState<number | "">(25)

  // New Category Creation state
  const [newCatName, setNewCatName] = useState("")
  const [newCatWage, setNewCatWage] = useState<number | "">(525)
  const [newCatOtRate, setNewCatOtRate] = useState<number | "">(100)
  const [newCatOtCeiling, setNewCatOtCeiling] = useState<number | "">(2000)

  // Import states
  const [importData, setImportData] = useState<any>(null)
  const [importFileName, setImportFileName] = useState<string>("")
  const [importPreview, setImportPreview] = useState<{
    employeeCount: number
    contractCount: number
    attendanceCount: number
    hasSettings: boolean
  } | null>(null)

  // Load settings into draft
  useEffect(() => {
    if (settings) {
      const cats =
        settings.categories && settings.categories.length > 0
          ? settings.categories
          : DEFAULT_CATEGORIES

      setCategoriesList(cats)

      const wMap: Record<string, number | ""> = {}
      const oMap: Record<string, number | ""> = {}
      const cMap: Record<string, number | ""> = {}

      cats.forEach((cat) => {
        wMap[cat] = settings.wageRates?.[cat] ?? (cat === "Drivers" ? 700 : cat === "Cooks" ? 645 : 525)
        oMap[cat] = settings.otRates?.[cat] ?? (cat === "Gardeners" ? 0 : 100)
        cMap[cat] =
          settings.otCeilings?.[cat] ??
          (cat === "Gardeners"
            ? 0
            : cat === "Drivers"
              ? 2000
              : Number.POSITIVE_INFINITY)
      })

      setWageRates(wMap)
      setOtRates(oMap)
      setOtCeilings(cMap)
      setSelectedSection(settings.section || "Ad.B5")

      setCycleStartDay(settings.billingCycle?.startDay ?? 26)
      setCycleEndDay(settings.billingCycle?.endDay ?? 25)
    }
  }, [settings])

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

      if (isInput || isSelectTrigger) {
        const isExpanded =
          activeElement.getAttribute("aria-expanded") === "true"
        if (isExpanded) return

        e.preventDefault()

        const form = e.currentTarget
        const selector =
          'input:not([disabled]):not([type="hidden"]), button[data-slot="select-trigger"]:not([disabled])'
        const fields = Array.from(form.querySelectorAll<HTMLElement>(selector))

        const currentIndex = fields.indexOf(activeElement as HTMLElement)
        if (currentIndex > -1 && currentIndex < fields.length - 1) {
          const nextField = fields[currentIndex + 1]
          nextField.focus()
          if (
            nextField instanceof HTMLInputElement &&
            nextField.type === "text"
          ) {
            nextField.select()
          }
        }
      }
    }
  }

  // Create dynamic category
  const handleAddCategory = () => {
    const trimmed = newCatName.trim()
    if (!trimmed) {
      toast.error("Please enter a category name.")
      return
    }

    if (categoriesList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Category "${trimmed}" already exists.`)
      return
    }

    const updated = [...categoriesList, trimmed]
    setCategoriesList(updated)
    setWageRates((prev) => ({ ...prev, [trimmed]: Number(newCatWage) || 0 }))
    setOtRates((prev) => ({ ...prev, [trimmed]: Number(newCatOtRate) || 0 }))
    setOtCeilings((prev) => ({
      ...prev,
      [trimmed]: Number(newCatOtCeiling) || 0,
    }))

    setNewCatName("")
    setNewCatWage(525)
    setNewCatOtRate(100)
    setNewCatOtCeiling(2000)

    toast.success(`Category "${trimmed}" added! Click "Save Changes" to persist.`)
  }

  // Delete dynamic category
  const handleDeleteCategory = (catToDelete: string) => {
    const inUse = employees.filter((e) => e.category === catToDelete).length
    if (inUse > 0) {
      toast.error(
        `Cannot remove "${catToDelete}" because ${inUse} employee(s) are currently assigned to this category.`
      )
      return
    }

    setCategoriesList((prev) => prev.filter((c) => c !== catToDelete))
    toast.success(`Category "${catToDelete}" removed from draft list.`)
  }

  // Password lock state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState(false)

  // Execute actual saving after password authentication
  const executeSaveSettings = () => {
    const finalWageRates: Record<string, number> = {}
    const finalOtRates: Record<string, number> = {}
    const finalOtCeilings: Record<string, number> = {}

    categoriesList.forEach((cat) => {
      finalWageRates[cat] = Number(wageRates[cat]) || 0
      finalOtRates[cat] = Number(otRates[cat]) || 0
      finalOtCeilings[cat] = Number(otCeilings[cat]) || 0
    })

    const start = Math.min(Math.max(Number(cycleStartDay) || 1, 1), 31)
    const end = Math.min(Math.max(Number(cycleEndDay) || 1, 1), 31)

    const updatedSettings: WageSettings = {
      categories: categoriesList,
      wageRates: finalWageRates,
      otRates: finalOtRates,
      otCeilings: finalOtCeilings,
      billingCycle: {
        startDay: start,
        endDay: end,
      },
      section: selectedSection,
    }

    const previousSettings = { ...settings }
    saveSettings(updatedSettings)
    toast.success(
      "Settings updated successfully. All payroll summaries and billing cycles have been updated.",
      {
        action: {
          label: "Undo",
          onClick: () => saveSettings(previousSettings),
        },
      }
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    // Trigger password lock verification dialog
    setPasswordInput("")
    setPasswordError(false)
    setShowPasswordModal(true)
  }

  const handleConfirmPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const requiredPassword = import.meta.env.VITE_SETTINGS_PASSWORD || "admin123"
    if (passwordInput === requiredPassword) {
      setShowPasswordModal(false)
      setPasswordInput("")
      setPasswordError(false)
      executeSaveSettings()
    } else {
      setPasswordError(true)
      toast.error("Incorrect password! Settings were not saved.")
    }
  }

  const handlePdfPreview = () => {
    const finalWageRates: Record<string, number> = {}
    const finalOtRates: Record<string, number> = {}
    const finalOtCeilings: Record<string, number> = {}

    categoriesList.forEach((cat) => {
      finalWageRates[cat] = Number(wageRates[cat]) || 0
      finalOtRates[cat] = Number(otRates[cat]) || 0
      finalOtCeilings[cat] = Number(otCeilings[cat]) || 0
    })

    const previewSettings: WageSettings = {
      categories: categoriesList,
      wageRates: finalWageRates,
      otRates: finalOtRates,
      otCeilings: finalOtCeilings,
      billingCycle: {
        startDay: Number(cycleStartDay) || 26,
        endDay: Number(cycleEndDay) || 25,
      },
      section: selectedSection,
    }
    generateSettingsPreview(previewSettings)
  }

  const handleExport = () => {
    try {
      const backupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        employees,
        contracts,
        attendance,
        settings,
      }
      const dataStr = JSON.stringify(backupData, null, 2)
      const blob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const dateStr = new Date().toISOString().split("T")[0]
      link.href = url
      link.download = `mgu_payroll_backup_${dateStr}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success("Database exported successfully.")
    } catch (error) {
      console.error(error)
      toast.error("Failed to export database.")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        if (!json || typeof json !== "object") {
          throw new Error("Invalid JSON file structure.")
        }

        const hasEmployees = Array.isArray(json.employees)
        const hasContracts = Array.isArray(json.contracts)
        const hasAttendance =
          json.attendance && typeof json.attendance === "object"
        const hasSettings = json.settings && typeof json.settings === "object"

        if (!hasEmployees && !hasContracts && !hasAttendance && !hasSettings) {
          throw new Error(
            "JSON file does not contain valid database keys (employees, contracts, attendance, settings)."
          )
        }

        setImportPreview({
          employeeCount: hasEmployees ? json.employees.length : 0,
          contractCount: hasContracts ? json.contracts.length : 0,
          attendanceCount: hasAttendance
            ? Object.values(json.attendance).reduce(
                (sum: number, r: any) => sum + Object.keys(r || {}).length,
                0
              )
            : 0,
          hasSettings,
        })
        setImportData(json)
      } catch (err: any) {
        toast.error(`Invalid backup file: ${err.message || err}`)
        setImportData(null)
        setImportPreview(null)
        setImportFileName("")
        e.target.value = ""
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = () => {
    if (!importData) return
    try {
      if (importData.employees) saveEmployees(importData.employees)
      if (importData.contracts) saveContracts(importData.contracts)
      if (importData.attendance) saveAttendance(importData.attendance)
      if (importData.settings) saveSettings(importData.settings)

      toast.success("Database imported successfully.")
      setImportData(null)
      setImportPreview(null)
      setImportFileName("")
    } catch (err: any) {
      toast.error(`Failed to import data: ${err.message || err}`)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Policy Notice */}
      <Alert className="border-primary/20 bg-primary/5 text-foreground">
        <RiInformationLine className="size-5 text-primary" />
        <AlertTitle className="font-heading text-sm font-bold">
          Policy & System Configuration Notice
        </AlertTitle>
        <AlertDescription className="mt-1 text-xs">
          Configuring job categories, billing cycle dates, and daily base/OT rates
          will immediately recompute payroll calculations for all active and
          historical billing cycles across the portal.
        </AlertDescription>
      </Alert>

      {/* Main Settings Form */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
            <RiSettings4Line className="size-5 text-primary" />
            Wage & Billing System Settings
          </CardTitle>
          <CardDescription>
            Configure office section, billing cycle dates, job categories, and wage policies.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave} onKeyDown={handleFormKeyDown}>
          <CardContent className="flex flex-col gap-6">
            {/* Section Selection & Billing Cycle Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Office Section Designation */}
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
                <h4 className="mb-3 font-heading text-xs font-bold tracking-wider text-primary uppercase">
                  Office Section Designation
                </h4>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="section-select">
                      Active Office Section
                    </FieldLabel>
                    <Select
                      value={selectedSection}
                      onValueChange={(val) =>
                        setSelectedSection(
                          val as "Ad.B5" | "Ad.B7" | "Estate 1" | "Estate 2"
                        )
                      }
                    >
                      <SelectTrigger id="section-select" className="w-full">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Ad.B5">Ad.B5</SelectItem>
                          <SelectItem value="Ad.B7">Ad.B7</SelectItem>
                          <SelectItem value="Estate 1">Estate 1</SelectItem>
                          <SelectItem value="Estate 2">Estate 2</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </div>

              {/* Billing Cycle Dates Provision */}
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 font-heading text-xs font-bold tracking-wider text-primary uppercase">
                    <RiCalendarEventLine className="size-4" />
                    Billing Cycle Dates
                  </h4>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={() => {
                        setCycleStartDay(26)
                        setCycleEndDay(25)
                      }}
                      title="Set Standard 26th-25th Cycle"
                    >
                      MGU (26–25)
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={() => {
                        setCycleStartDay(1)
                        setCycleEndDay(31)
                      }}
                      title="Set Full Month Cycle (1st–31st)"
                    >
                      Month (1–31)
                    </Button>
                  </div>
                </div>

                <FieldGroup>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel htmlFor="cycle-start-day" className="text-xs">
                        Cycle Start Day
                      </FieldLabel>
                      <Input
                        id="cycle-start-day"
                        type="number"
                        min={1}
                        max={31}
                        value={cycleStartDay}
                        onChange={(e) =>
                          setCycleStartDay(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="cycle-end-day" className="text-xs">
                        Cycle End Day
                      </FieldLabel>
                      <Input
                        id="cycle-end-day"
                        type="number"
                        min={1}
                        max={31}
                        value={cycleEndDay}
                        onChange={(e) =>
                          setCycleEndDay(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                      />
                    </Field>
                  </div>
                </FieldGroup>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Current rule:{" "}
                  <span className="font-semibold text-foreground">
                    {Number(cycleStartDay) > Number(cycleEndDay)
                      ? `${cycleStartDay}th of prev month to ${cycleEndDay}th of current month`
                      : `${cycleStartDay}st to ${cycleEndDay}th of current month`}
                  </span>
                </p>
              </div>
            </div>

            {/* Create Additional Job Categories Provision */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="mb-2 flex items-center gap-1.5 font-heading text-xs font-bold tracking-wider text-primary uppercase">
                <RiBriefcaseLine className="size-4" />
                Create Additional Job Category
              </h4>
              <p className="mb-4 text-xs text-muted-foreground">
                Introduce custom job roles into the system with specific base wages, overtime rates, and monthly ceilings.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <Field className="sm:col-span-1">
                  <FieldLabel htmlFor="newCatName" className="text-xs">
                    Category Name
                  </FieldLabel>
                  <Input
                    id="newCatName"
                    placeholder="e.g. Security"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                </Field>
                <Field className="sm:col-span-1">
                  <FieldLabel htmlFor="newCatWage" className="text-xs">
                    Base Wage (₹)
                  </FieldLabel>
                  <Input
                    id="newCatWage"
                    type="number"
                    value={newCatWage}
                    onChange={(e) =>
                      setNewCatWage(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </Field>
                <Field className="sm:col-span-1">
                  <FieldLabel htmlFor="newCatOtRate" className="text-xs">
                    OT Rate (₹/Day)
                  </FieldLabel>
                  <Input
                    id="newCatOtRate"
                    type="number"
                    value={newCatOtRate}
                    onChange={(e) =>
                      setNewCatOtRate(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </Field>
                <Field className="sm:col-span-1">
                  <FieldLabel htmlFor="newCatOtCeiling" className="text-xs">
                    OT Ceiling (₹)
                  </FieldLabel>
                  <Input
                    id="newCatOtCeiling"
                    type="number"
                    value={newCatOtCeiling}
                    onChange={(e) =>
                      setNewCatOtCeiling(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </Field>
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddCategory}
                  className="cursor-pointer"
                >
                  <RiAddLine className="mr-1 size-4" />
                  Add Category
                </Button>
              </div>
            </div>

            {/* Accordion for Category Rates */}
            <Accordion
              defaultValue={["base-wages", "ot-rates"]}
              className="w-full"
            >
              <AccordionItem
                value="base-wages"
                className="border-b border-border/50"
              >
                <AccordionTrigger className="py-3 font-heading text-xs font-bold tracking-wider text-muted-foreground uppercase hover:no-underline">
                  Daily Base Wage Rates by Category (in ₹)
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {categoriesList.map((cat) => {
                        const isCustom = !DEFAULT_CATEGORIES.includes(cat)
                        return (
                          <Field key={cat}>
                            <div className="flex items-center justify-between">
                              <FieldLabel htmlFor={`wage-${cat}`}>
                                {cat} Rate (₹)
                              </FieldLabel>
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="text-xs text-rose-500 hover:underline"
                                  title={`Delete custom category ${cat}`}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <Input
                              id={`wage-${cat}`}
                              type="number"
                              value={wageRates[cat] ?? ""}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                setWageRates((prev) => ({
                                  ...prev,
                                  [cat]: val,
                                }))
                              }}
                            />
                          </Field>
                        )
                      })}
                    </div>
                  </FieldGroup>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ot-rates" className="border-b-0">
                <AccordionTrigger className="py-3 font-heading text-xs font-bold tracking-wider text-muted-foreground uppercase hover:no-underline">
                  Overtime & Monthly Ceiling Configuration
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="flex flex-col gap-4">
                    {categoriesList.map((cat) => (
                      <div
                        key={`ot-box-${cat}`}
                        className="rounded-lg border border-border/40 bg-muted/20 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-heading text-xs font-bold tracking-wider text-primary uppercase">
                            {cat}
                          </h4>
                          {!DEFAULT_CATEGORIES.includes(cat) && (
                            <Badge variant="outline" className="text-[10px]">
                              Custom Role
                            </Badge>
                          )}
                        </div>
                        <FieldGroup>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field>
                              <FieldLabel htmlFor={`otRate-${cat}`}>
                                Overtime Rate (₹ / Day)
                              </FieldLabel>
                              <Input
                                id={`otRate-${cat}`}
                                type="number"
                                value={otRates[cat] ?? ""}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value)
                                  setOtRates((prev) => ({
                                    ...prev,
                                    [cat]: val,
                                  }))
                                }}
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor={`otCeiling-${cat}`}>
                                Monthly Ceiling (₹)
                              </FieldLabel>
                              <Input
                                id={`otCeiling-${cat}`}
                                type="number"
                                placeholder="e.g. 2000 (0 for none/uncapped)"
                                value={
                                  otCeilings[cat] === Number.POSITIVE_INFINITY
                                    ? ""
                                    : (otCeilings[cat] ?? "")
                                }
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value)
                                  setOtCeilings((prev) => ({
                                    ...prev,
                                    [cat]: val,
                                  }))
                                }}
                              />
                            </Field>
                          </div>
                        </FieldGroup>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={handlePdfPreview}>
              <RiDownload2Line data-icon="inline-start" />
              PDF Preview Policy
            </Button>
            <Button type="submit">
              <RiSave2Line data-icon="inline-start" />
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Backup & Restore Card */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
            <RiDatabase2Line className="size-5 text-primary" />
            Data Backup & Restore
          </CardTitle>
          <CardDescription>
            Export all system data to a JSON backup file, or restore a previous
            backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-foreground">
                Export Database
              </h4>
              <p className="text-xs text-muted-foreground">
                Download a JSON file containing all employee profiles,
                contracts, attendance records, and system settings.
              </p>
              <Button
                variant="outline"
                onClick={handleExport}
                className="w-full sm:w-auto"
              >
                <RiDownload2Line className="size-4" data-icon="inline-start" />
                Export Data (JSON)
              </Button>
            </div>

            <div className="flex-1 space-y-2 border-t border-border/50 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <h4 className="text-sm font-bold text-foreground">
                Restore Database
              </h4>
              <p className="text-xs text-muted-foreground">
                Upload a previously exported JSON file to restore portal data.
              </p>
              <div className="relative">
                <input
                  type="file"
                  id="import-file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                  onClick={(e) => {
                    ;(e.target as HTMLInputElement).value = ""
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("import-file")?.click()
                  }
                  className="w-full sm:w-auto"
                >
                  <RiUpload2Line className="size-4" data-icon="inline-start" />
                  Import Data (JSON)
                </Button>
              </div>
            </div>
          </div>

          {/* Import Preview */}
          {importPreview && (
            <div className="animate-in rounded-lg border border-border/80 bg-muted/40 p-4 duration-200 fade-in-50">
              <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-xs font-bold text-foreground">
                  Backup File Preview
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {importFileName}
                </span>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-md border border-border/50 bg-background/55 p-2">
                  <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    Employees
                  </div>
                  <div className="font-heading text-base font-bold text-foreground">
                    {importPreview.employeeCount}
                  </div>
                </div>
                <div className="rounded-md border border-border/50 bg-background/55 p-2">
                  <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    Contracts
                  </div>
                  <div className="font-heading text-base font-bold text-foreground">
                    {importPreview.contractCount}
                  </div>
                </div>
                <div className="rounded-md border border-border/50 bg-background/55 p-2">
                  <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    Attendance Logs
                  </div>
                  <div className="font-heading text-base font-bold text-foreground">
                    {importPreview.attendanceCount}
                  </div>
                </div>
                <div className="rounded-md border border-border/50 bg-background/55 p-2">
                  <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    Wage Settings
                  </div>
                  <div className="mt-0.5 font-heading text-xs font-bold text-foreground">
                    {importPreview.hasSettings ? "✓ Included" : "✗ Not Found"}
                  </div>
                </div>
              </div>

              <Alert variant="destructive" className="mb-4">
                <RiAlertLine className="size-5" />
                <AlertTitle className="font-bold">
                  Caution: Destructive Action
                </AlertTitle>
                <AlertDescription className="text-xs">
                  Confirming this restore will delete current database entries and replace them with data from the backup file.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImportData(null)
                    setImportPreview(null)
                    setImportFileName("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmImport}
                >
                  Confirm & Overwrite
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Lock Modal for Saving Settings */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RiLockPasswordLine className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-heading text-base font-bold">
                  Password Required to Save Settings
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Settings are locked. Enter password (from .env) to save changes.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleConfirmPassword} className="flex flex-col gap-4 py-2">
            <Field data-invalid={passwordError}>
              <FieldLabel htmlFor="settings-password">Admin Password</FieldLabel>
              <Input
                id="settings-password"
                type="password"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value)
                  if (passwordError) setPasswordError(false)
                }}
                autoFocus
                aria-invalid={passwordError}
              />
              {passwordError && (
                <p className="mt-1 text-xs text-destructive">
                  Incorrect password. Check VITE_SETTINGS_PASSWORD in your .env file.
                </p>
              )}
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                <RiKeyLine data-icon="inline-start" className="size-4" />
                Unlock & Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
