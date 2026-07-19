import { format } from "date-fns"
import { RiCalendarLine, RiAlertLine } from "@remixicon/react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  onSelect?: (date: DateRange | undefined, selectedDay: Date) => void
  disabled?: boolean
  id?: string
  isError?: boolean
  errorMessage?: string
  overlappingDays?: Date[]
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
  onSelect,
  disabled,
  id,
  isError,
  errorMessage,
  overlappingDays = [],
}: DatePickerWithRangeProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant={"outline"}
              disabled={disabled}
              className={cn(
                "h-9 w-full justify-start border-input px-3 text-left font-normal hover:bg-accent/50",
                !date && "text-muted-foreground",
                isError &&
                  "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/15 focus-visible:ring-destructive font-medium"
              )}
            />
          }
        >
          {isError ? (
            <RiAlertLine className="mr-2 size-4 shrink-0 text-destructive" />
          ) : (
            <RiCalendarLine className="mr-2 size-4 shrink-0 text-muted-foreground" />
          )}

          {date?.from ? (
            date.to ? (
              <span className="truncate">
                {format(date.from, "LLL dd, y")} -{" "}
                {format(date.to, "LLL dd, y")}
              </span>
            ) : (
              <span className="truncate">{format(date.from, "LLL dd, y")}</span>
            )
          ) : (
            <span>Select date range</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {isError && (
            <div className="flex items-start gap-2 border-b border-destructive/20 bg-destructive/10 p-3 text-destructive">
              <RiAlertLine className="mt-0.5 size-4 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Overlapping Date Selection Error</p>
                <p className="mt-0.5 text-[11px] leading-snug">
                  {errorMessage ||
                    "Selected dates overlap with an existing contract for this employee."}
                </p>
              </div>
            </div>
          )}
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            modifiers={{
              overlap: overlappingDays,
            }}
            onSelect={(range, selectedDay) => {
              if (onSelect) {
                onSelect(range, selectedDay)
              } else {
                setDate(range)
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
