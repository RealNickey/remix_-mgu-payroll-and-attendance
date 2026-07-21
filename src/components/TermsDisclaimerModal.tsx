import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTheme } from "@/components/theme-provider"
import {
  RiShieldCrossLine,
  RiAlertLine,
  RiCheckLine,
  RiInformationLine,
  RiShieldCheckLine,
  RiSunLine,
  RiMoonLine,
  RiLock2Line,
} from "@remixicon/react"

export const STORAGE_KEY = "mgu_tc_accepted"

interface TermsGateScreenProps {
  onAccept: () => void
}

/**
 * TermsGateScreen is rendered full-screen when the user has not yet accepted
 * the Terms of Use and Legal Disclaimer. Application usage is strictly blocked
 * until acceptance.
 */
export function TermsGateScreen({ onAccept }: TermsGateScreenProps) {
  const [isAgreed, setIsAgreed] = useState(false)
  const { theme, setTheme } = useTheme()

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    onAccept()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-4 sm:p-6 overflow-y-auto font-mono">
      {/* Background decor accents */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden opacity-30 dark:opacity-20">
        <div className="h-[500px] w-[500px] rounded-full bg-amber-500/20 blur-3xl" />
        <div className="h-[400px] w-[400px] rounded-full bg-primary/20 blur-3xl" />
      </div>

      {/* Header Bar */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RiShieldCheckLine className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground uppercase">
              MGU Estate Payroll
            </h1>
            <p className="text-xs text-muted-foreground">
              Terms & Legal Disclaimer Acceptance Required
            </p>
          </div>
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <RiSunLine className="size-5 text-amber-400" />
          ) : (
            <RiMoonLine className="size-5" />
          )}
        </button>
      </div>

      {/* Main Terms Gate Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start gap-4 border-b border-border/60 pb-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <RiLock2Line className="size-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Usage Access Restricted
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              You must review and accept the Terms of Use and Disclaimer below before using this software.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-xs leading-relaxed text-muted-foreground">
          {/* Non-affiliation warning */}
          <Alert
            variant="destructive"
            className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 p-4"
          >
            <RiShieldCrossLine className="size-5 text-rose-600 dark:text-rose-400" />
            <AlertTitle className="font-bold text-sm">
              Not Affiliated with MG University
            </AlertTitle>
            <AlertDescription className="mt-1 text-xs leading-relaxed">
              This application is an independent utility tool. It is <strong>NOT affiliated with, endorsed by, sponsored by, or officially associated with Mahatma Gandhi University (MG University / MGU)</strong> or any of its administrative sections.
            </AlertDescription>
          </Alert>

          {/* User Responsibility & Calculation Disclaimer */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider">
              <RiInformationLine className="size-4 text-primary" />
              <span>User Responsibility & Calculation Disclaimer</span>
            </div>
            <p className="text-xs leading-normal">
              1. <strong>Calculations & Entries:</strong> All data entries, attendance records, wage calculation parameters, OT multipliers, and generated disbursement sheets are the <strong>sole responsibility of the user</strong>.
            </p>
            <p className="text-xs leading-normal">
              2. <strong>No Liability:</strong> The developers and distributors of this software assume <strong>no liability or responsibility</strong> for any calculation errors, administrative discrepancies, financial miscalculations, or any damages arising directly or indirectly from the use of this tool.
            </p>
          </div>

          {/* Mandatory Checkbox */}
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary/50">
            <Checkbox
              id="agree-terms-gate"
              checked={isAgreed}
              onCheckedChange={(checked) => setIsAgreed(!!checked)}
              className="mt-0.5"
            />
            <Label
              htmlFor="agree-terms-gate"
              className="cursor-pointer text-xs font-semibold text-foreground leading-relaxed select-none"
            >
              I have read, understood, and accept that all calculations and data entries are my sole responsibility, and agree that this software is not affiliated with MG University.
            </Label>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={handleAccept}
            disabled={!isAgreed}
            size="lg"
            className="w-full font-bold shadow-md text-sm"
          >
            <RiCheckLine data-icon="inline-start" className="size-5" />
            Accept Terms & Access System
          </Button>
        </div>
      </div>

      <div className="relative z-10 mt-6 text-center text-[11px] text-muted-foreground">
        Mahatma Gandhi University (MGU) Estate Staff Payroll Utility Portal
      </div>
    </div>
  )
}

interface TermsDisclaimerModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onRevoke?: () => void
}

/**
 * TermsDisclaimerModal allows users to view the terms again within the application,
 * or optionally revoke acceptance to re-lock the system.
 */
export function TermsDisclaimerModal({
  open = false,
  onOpenChange,
  onRevoke,
}: TermsDisclaimerModalProps) {
  const handleRevoke = () => {
    localStorage.removeItem(STORAGE_KEY)
    if (onOpenChange) onOpenChange(false)
    if (onRevoke) onRevoke()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl font-mono">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <RiAlertLine className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-heading text-lg font-bold">
                Terms of Use & Legal Disclaimer
              </DialogTitle>
              <DialogDescription className="text-xs">
                Software non-affiliation notice and user responsibility agreement.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2 text-xs leading-relaxed text-muted-foreground">
          {/* Status Badge */}
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-bold text-xs">
              <RiShieldCheckLine className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Terms Currently Accepted</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
              Active
            </span>
          </div>

          {/* Non affiliation warning */}
          <Alert variant="destructive" className="border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300">
            <RiShieldCrossLine className="size-4 text-rose-600 dark:text-rose-400" />
            <AlertTitle className="font-semibold text-xs">
              Not Affiliated to MG University
            </AlertTitle>
            <AlertDescription className="mt-1 text-[11px] leading-normal">
              This application is an independent utility tool. It is <strong>NOT affiliated with, endorsed by, sponsored by, or officially associated with Mahatma Gandhi University (MG University / MGU)</strong> or any of its administrative sections.
            </AlertDescription>
          </Alert>

          {/* User Responsibility */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
              <RiInformationLine className="size-4 text-primary" />
              <span>User Responsibility & Calculation Disclaimer</span>
            </div>
            <p>
              1. <strong>Calculations & Entries:</strong> All data entries, attendance records, wage calculation parameters, OT multipliers, and generated disbursement sheets are the <strong>sole responsibility of the user</strong>.
            </p>
            <p>
              2. <strong>No Liability:</strong> The developers and distributors of this software assume <strong>no liability or responsibility</strong> for any calculation errors, administrative discrepancies, financial miscalculations, or any damages arising directly or indirectly from the use of this tool.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {onRevoke && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevoke}
              className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
            >
              Revoke Acceptance & Lock App
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onOpenChange && onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

