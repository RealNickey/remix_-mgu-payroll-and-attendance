import { format } from "date-fns"
import { RiCalendarLine } from "@remixicon/react"
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
  disabled?: boolean
  id?: string
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
  disabled,
  id,
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
                !date && "text-muted-foreground"
              )}
            />
          }
        >
          <RiCalendarLine className="mr-2 size-4 shrink-0 text-muted-foreground" />
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
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
