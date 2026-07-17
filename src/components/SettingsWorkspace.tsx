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
  RiSettings4Line,
  RiSave2Line,
  RiInformationLine,
  RiDatabase2Line,
  RiDownload2Line,
  RiUpload2Line,
  RiAlertLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { generateSettingsPreview } from "@/lib/pdfGenerator"

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

  // Draft states
  const [gardenersRate, setGardenersRate] = useState<number | "">(500)
  const [driversRate, setDriversRate] = useState<number | "">(600)
  const [cooksRate, setCooksRate] = useState<number | "">(550)
  const [helpersRate, setHelpersRate] = useState<number | "">(450)

  const [gardenersOtRate, setGardenersOtRate] = useState<number | "">(0)
  const [driversOtRate, setDriversOtRate] = useState<number | "">(100)
  const [cooksOtRate, setCooksOtRate] = useState<number | "">(100)
  const [helpersOtRate, setHelpersOtRate] = useState<number | "">(100)

  const [gardenersOtCeiling, setGardenersOtCeiling] = useState<number | "">(0)
  const [driversOtCeiling, setDriversOtCeiling] = useState<number | "">(5000)
  const [cooksOtCeiling, setCooksOtCeiling] = useState<number | "">(5000)
  const [helpersOtCeiling, setHelpersOtCeiling] = useState<number | "">(5000)

  // Import states
  const [importData, setImportData] = useState<any>(null)
  const [importFileName, setImportFileName] = useState<string>("")
  const [importPreview, setImportPreview] = useState<{
    employeeCount: number
    contractCount: number
    attendanceCount: number
    hasSettings: boolean
  } | null>(null)

  // Initialize draft values when settings load
  useEffect(() => {
    if (settings) {
      setGardenersRate(settings.wageRates.Gardeners)
      setDriversRate(settings.wageRates.Drivers)
      setCooksRate(settings.wageRates.Cooks)
      setHelpersRate(settings.wageRates.Helpers)

      setGardenersOtRate(settings.otRates?.Gardeners ?? 0)
      setDriversOtRate(settings.otRates?.Drivers ?? 100)
      setCooksOtRate(settings.otRates?.Cooks ?? 100)
      setHelpersOtRate(settings.otRates?.Helpers ?? 100)

      setGardenersOtCeiling(settings.otCeilings?.Gardeners ?? 0)
      setDriversOtCeiling(settings.otCeilings?.Drivers ?? 5000)
      setCooksOtCeiling(settings.otCeilings?.Cooks ?? 5000)
      setHelpersOtCeiling(settings.otCeilings?.Helpers ?? 5000)
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedSettings: WageSettings = {
      wageRates: {
        Gardeners: Number(gardenersRate) || 0,
        Drivers: Number(driversRate) || 0,
        Cooks: Number(cooksRate) || 0,
        Helpers: Number(helpersRate) || 0,
      },
      otRates: {
        Gardeners: Number(gardenersOtRate) || 0,
        Drivers: Number(driversOtRate) || 0,
        Cooks: Number(cooksOtRate) || 0,
        Helpers: Number(helpersOtRate) || 0,
      },
      otCeilings: {
        Gardeners: Number(gardenersOtCeiling) || 0,
        Drivers: Number(driversOtCeiling) || 0,
        Cooks: Number(cooksOtCeiling) || 0,
        Helpers: Number(helpersOtCeiling) || 0,
      },
    }

    const previousSettings = { ...settings }
    saveSettings(updatedSettings)
    toast.success(
      "Settings updated successfully. All payroll summaries have been updated.",
      {
        action: {
          label: "Undo",
          onClick: () => saveSettings(previousSettings),
        },
      }
    )
  }

  const handlePdfPreview = () => {
    const previewSettings: WageSettings = {
      wageRates: {
        Gardeners: Number(gardenersRate) || 0,
        Drivers: Number(driversRate) || 0,
        Cooks: Number(cooksRate) || 0,
        Helpers: Number(helpersRate) || 0,
      },
      otRates: {
        Gardeners: Number(gardenersOtRate) || 0,
        Drivers: Number(driversOtRate) || 0,
        Cooks: Number(cooksOtRate) || 0,
        Helpers: Number(helpersOtRate) || 0,
      },
      otCeilings: {
        Gardeners: Number(gardenersOtCeiling) || 0,
        Drivers: Number(driversOtCeiling) || 0,
        Cooks: Number(cooksOtCeiling) || 0,
        Helpers: Number(helpersOtCeiling) || 0,
      },
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
        
        // Validation
        if (!json || typeof json !== "object") {
          throw new Error("Invalid JSON file structure.")
        }
        
        // Let's do basic validation
        const hasEmployees = Array.isArray(json.employees)
        const hasContracts = Array.isArray(json.contracts)
        const hasAttendance = json.attendance && typeof json.attendance === "object"
        const hasSettings = json.settings && typeof json.settings === "object"

        if (!hasEmployees && !hasContracts && !hasAttendance && !hasSettings) {
          throw new Error("JSON file does not contain valid database keys (employees, contracts, attendance, settings).")
        }

        let employeeCount = 0
        let contractCount = 0
        let attendanceCount = 0
        let containsSettings = false

        if (json.employees) {
          if (!Array.isArray(json.employees)) throw new Error("Employees key must be an array")
          for (const emp of json.employees) {
            if (typeof emp !== "object" || !emp.id || !emp.name || !emp.category) {
              throw new Error("Each employee record must be valid and contain an id, name, and category.")
            }
          }
          employeeCount = json.employees.length
        }

        if (json.contracts) {
          if (!Array.isArray(json.contracts)) throw new Error("Contracts key must be an array")
          for (const ctr of json.contracts) {
            if (typeof ctr !== "object" || !ctr.id || !ctr.employeeId || !ctr.startDate || !ctr.endDate) {
              throw new Error("Each contract record must be valid and contain an id, employeeId, startDate, and endDate.")
            }
          }
          contractCount = json.contracts.length
        }

        if (json.attendance) {
          if (typeof json.attendance !== "object" || Array.isArray(json.attendance)) throw new Error("Attendance key must be an object")
          for (const empId in json.attendance) {
            const records = json.attendance[empId]
            if (typeof records !== "object" || Array.isArray(records)) throw new Error("Attendance records must be objects")
            attendanceCount += Object.keys(records).length
          }
        }

        if (json.settings) {
          if (typeof json.settings !== "object") throw new Error("Settings key must be an object")
          containsSettings = true
        }

        setImportPreview({
          employeeCount,
          contractCount,
          attendanceCount,
          hasSettings: containsSettings,
        })
        importData // make eslint happy if it needs to see read
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
      if (importData.employees) {
        saveEmployees(importData.employees)
      }
      if (importData.contracts) {
        saveContracts(importData.contracts)
      }
      if (importData.attendance) {
        saveAttendance(importData.attendance)
      }
      if (importData.settings) {
        saveSettings(importData.settings)
      }

      toast.success("Database imported successfully. All tables and settings have been restored.")
      setImportData(null)
      setImportPreview(null)
      setImportFileName("")
    } catch (err: any) {
      toast.error(`Failed to import data: ${err.message || err}`)
    }
  }

  const handleCancelImport = () => {
    setImportData(null)
    setImportPreview(null)
    setImportFileName("")
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Information Banner */}
      <Alert className="border-primary/20 bg-primary/5 text-foreground">
        <RiInformationLine className="size-5 text-primary" />
        <AlertTitle className="font-heading text-sm font-bold">
          Policy Calculations Notice
        </AlertTitle>
        <AlertDescription className="mt-1 text-xs">
          Modifying these rates will immediately re-compute payroll totals for
          all billing cycles. Overtime charges and monthly ceilings are configured
          per employee category below.
        </AlertDescription>
      </Alert>

      {/* Wage rates Form */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
            <RiSettings4Line className="size-5 text-primary" />
            Wage Configuration Settings
          </CardTitle>
          <CardDescription>
            Configure daily base wages and overtime rates for contractual staff.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave} onKeyDown={handleFormKeyDown}>
          <CardContent className="flex flex-col gap-6">
            <Accordion
              defaultValue={["base-wages", "ot-rates"]}
              className="w-full"
            >
              <AccordionItem
                value="base-wages"
                className="border-b border-border/50"
              >
                <AccordionTrigger className="py-3 font-heading text-xs font-bold tracking-wider text-muted-foreground uppercase hover:no-underline">
                  Daily Base Wage Rates (in Rupees)
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="gardeners">
                          Gardeners Rate (₹)
                        </FieldLabel>
                        <Input
                          id="gardeners"
                          type="number"
                          value={gardenersRate}
                          onChange={(e) =>
                            setGardenersRate(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="drivers">
                          Drivers Rate (₹)
                        </FieldLabel>
                        <Input
                          id="drivers"
                          type="number"
                          value={driversRate}
                          onChange={(e) =>
                            setDriversRate(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="cooks">Cooks Rate (₹)</FieldLabel>
                        <Input
                          id="cooks"
                          type="number"
                          value={cooksRate}
                          onChange={(e) =>
                            setCooksRate(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="helpers">
                          Helpers Rate (₹)
                        </FieldLabel>
                        <Input
                          id="helpers"
                          type="number"
                          value={helpersRate}
                          onChange={(e) =>
                            setHelpersRate(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ot-rates" className="border-b-0">
                <AccordionTrigger className="py-3 font-heading text-xs font-bold tracking-wider text-muted-foreground uppercase hover:no-underline">
                  Overtime & Monthly Ceiling Configuration
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="flex flex-col gap-6">
                    {/* Gardeners */}
                    <div className="rounded-lg border border-border/40 p-4 bg-muted/20">
                      <h4 className="font-heading text-xs font-bold tracking-wider text-primary mb-3 uppercase">Gardeners</h4>
                      <FieldGroup>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel htmlFor="gardenersOtRate">Overtime Rate (₹ / Day)</FieldLabel>
                            <Input
                              id="gardenersOtRate"
                              type="number"
                              value={gardenersOtRate}
                              onChange={(e) => setGardenersOtRate(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="gardenersOtCeiling">Monthly Ceiling (₹)</FieldLabel>
                            <Input
                              id="gardenersOtCeiling"
                              type="number"
                              value={gardenersOtCeiling}
                              onChange={(e) => setGardenersOtCeiling(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </Field>
                        </div>
                      </FieldGroup>
                    </div>

                    {/* Drivers */}
                    <div className="rounded-lg border border-border/40 p-4 bg-muted/20">
                      <h4 className="font-heading text-xs font-bold tracking-wider text-primary mb-3 uppercase">Drivers</h4>
                      <FieldGroup>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel htmlFor="driversOtRate">Overtime Rate (₹ / Day)</FieldLabel>
                            <Input
                              id="driversOtRate"
                              type="number"
                              value={driversOtRate}
                              onChange={(e) => setDriversOtRate(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="driversOtCeiling">Monthly Ceiling (₹)</FieldLabel>
                            <Input
                              id="driversOtCeiling"
                              type="number"
                              value={driversOtCeiling}
                              onChange={(e) => setDriversOtCeiling(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </Field>
                        </div>
                      </FieldGroup>
                    </div>

                    {/* Cooks */}
                    <div className="rounded-lg border border-border/40 p-4 bg-muted/20">
                      <h4 className="font-heading text-xs font-bold tracking-wider text-primary mb-3 uppercase">Cooks</h4>
                      <FieldGroup>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel htmlFor="cooksOtRate">Overtime Rate (₹ / Day)</FieldLabel>
                            <Input
                              id="cooksOtRate"
                              type="number"
                              value={cooksOtRate}
                              onChange={(e) => setCooksOtRate(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="cooksOtCeiling">Monthly Ceiling (₹)</FieldLabel>
                            <Input
                              id="cooksOtCeiling"
                              type="number"
                              value={cooksOtCeiling}
                              onChange={(e) => setCooksOtCeiling(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </Field>
                        </div>
                      </FieldGroup>
                    </div>

                    {/* Helpers */}
                    <div className="rounded-lg border border-border/40 p-4 bg-muted/20">
                      <h4 className="font-heading text-xs font-bold tracking-wider text-primary mb-3 uppercase">Helpers</h4>
                      <FieldGroup>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel htmlFor="helpersOtRate">Overtime Rate (₹ / Day)</FieldLabel>
                            <Input
                              id="helpersOtRate"
                              type="number"
                              value={helpersOtRate}
                              onChange={(e) => setHelpersOtRate(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="helpersOtCeiling">Monthly Ceiling (₹)</FieldLabel>
                            <Input
                              id="helpersOtCeiling"
                              type="number"
                              value={helpersOtCeiling}
                              onChange={(e) => setHelpersOtCeiling(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </Field>
                        </div>
                      </FieldGroup>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t pt-4">
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
            Export all system data to a JSON backup file, or restore a previous backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-foreground">Export Database</h4>
              <p className="text-xs text-muted-foreground">
                Download a JSON file containing all employee profiles, contracts, attendance records, and system settings.
              </p>
              <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
                <RiDownload2Line className="size-4" data-icon="inline-start" />
                Export Data (JSON)
              </Button>
            </div>
            
            <div className="flex-1 space-y-2 border-t border-border/50 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <h4 className="text-sm font-bold text-foreground">Restore Database</h4>
              <p className="text-xs text-muted-foreground">
                Upload a previously exported JSON file to restore the entire portal data. This will overwrite the current database.
              </p>
              <div className="relative">
                <input
                  type="file"
                  id="import-file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                  onClick={(e) => {
                    // Reset input value on click so onChange triggers even if same file selected
                    ;(e.target as HTMLInputElement).value = ""
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("import-file")?.click()}
                  className="w-full sm:w-auto"
                >
                  <RiUpload2Line className="size-4" data-icon="inline-start" />
                  Import Data (JSON)
                </Button>
              </div>
            </div>
          </div>

          {/* Import Preview and confirmation */}
          {importPreview && (
            <div className="rounded-lg border border-border/80 bg-muted/40 p-4 animate-in fade-in-50 duration-200">
              <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-xs font-bold text-foreground">Backup File Preview</span>
                <span className="font-mono text-[10px] text-muted-foreground">{importFileName}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="rounded-md border border-border/50 bg-background/55 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Employees</div>
                  <div className="font-heading text-base font-bold text-foreground">{importPreview.employeeCount}</div>
                </div>
                <div className="rounded-md border border-border/50 bg-background/55 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Contracts</div>
                  <div className="font-heading text-base font-bold text-foreground">{importPreview.contractCount}</div>
                </div>
                <div className="rounded-md border border-border/50 bg-background/55 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Attendance Logs</div>
                  <div className="font-heading text-base font-bold text-foreground">{importPreview.attendanceCount}</div>
                </div>
                <div className="rounded-md border border-border/50 bg-background/55 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Wage Settings</div>
                  <div className="font-heading text-xs font-bold text-foreground mt-0.5">
                    {importPreview.hasSettings ? "✓ Included" : "✗ Not Found"}
                  </div>
                </div>
              </div>

              <Alert variant="destructive" className="mb-4">
                <RiAlertLine className="size-5" />
                <AlertTitle className="font-bold">Caution: Destructive Action</AlertTitle>
                <AlertDescription className="text-xs">
                  Confirming this restore will delete all current database entries and replace them with the data from the backup file. This cannot be undone.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelImport}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleConfirmImport}>
                  Confirm & Overwrite
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
