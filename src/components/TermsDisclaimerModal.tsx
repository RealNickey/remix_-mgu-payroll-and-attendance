import { useState, useEffect } from "react"
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
import {
  RiShieldCrossLine,
  RiAlertLine,
  RiCheckLine,
  RiInformationLine,
} from "@remixicon/react"

interface TermsDisclaimerModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const STORAGE_KEY = "mgu_tc_accepted"

export function TermsDisclaimerModal({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: TermsDisclaimerModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY)
    if (!accepted) {
      setIsFirstTimeUser(true)
      setInternalOpen(true)
    }
  }, [])

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    // If it's a first time user and they haven't accepted yet, block closing via overlay/esc
    if (isFirstTimeUser && !localStorage.getItem(STORAGE_KEY)) {
      return
    }
    if (externalOnOpenChange) {
      externalOnOpenChange(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setIsFirstTimeUser(false)
    if (externalOnOpenChange) {
      externalOnOpenChange(false)
    } else {
      setInternalOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg sm:max-w-xl"
        showCloseButton={!isFirstTimeUser}
      >
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
                Important notice regarding software non-affiliation and user calculation responsibility.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2 text-xs leading-relaxed text-muted-foreground">
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

          {/* Checkbox agreement */}
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Checkbox
              id="agree-terms"
              checked={isAgreed}
              onCheckedChange={(checked) => setIsAgreed(!!checked)}
              className="mt-0.5"
            />
            <Label
              htmlFor="agree-terms"
              className="cursor-pointer text-xs font-medium text-foreground leading-tight select-none"
            >
              I have read, understood, and accept that calculations and data entries are my responsibility, and agree that this software is not affiliated with MG University.
            </Label>
          </div>
        </div>

        <DialogFooter showCloseButton={false}>
          <Button
            onClick={handleAccept}
            disabled={!isAgreed}
            className="w-full sm:w-auto"
          >
            <RiCheckLine data-icon="inline-start" className="size-4" />
            Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
