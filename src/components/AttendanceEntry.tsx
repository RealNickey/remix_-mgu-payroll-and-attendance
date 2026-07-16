import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMguDb } from '@/lib/db';
import {
  getBillingCycleDates,
  formatDateKey,
  isDateCoveredByContract,
  doIntervalsOverlap
} from '@/lib/payrollUtils';

// UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/components/ui/empty';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Toggle } from '@/components/ui/toggle';

// Icons
import {
  RiCalendarEventLine,
  RiAlertLine,
  RiSearchLine,
  RiListCheck,
  RiUserLine,
  RiCheckDoubleLine,
  RiDeleteBinLine,
  RiCalendarLine,
  RiTimeLine,
  RiSunLine,
  RiArrowRightLine,
  RiInformationLine,
  RiMoonLine,
  RiContractLine
} from '@remixicon/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AttendanceEntryProps {
  onNavigateToEmployees: () => void;
  onNavigateToContracts: () => void;
}

const MONTHS = [
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' }
];

const CATEGORY_COLORS: Record<string, string> = {
  Cooks: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20',
  Helpers: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20',
  Drivers: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
  Gardeners: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
};

export const AttendanceEntry: React.FC<AttendanceEntryProps> = ({
  onNavigateToEmployees,
  onNavigateToContracts
}) => {
  const {
    employees,
    contracts,
    attendance,
    updateAttendance,
    batchMarkWeekdays,
    batchMarkAllPresent,
    batchClearAll,
    saveAttendance
  } = useMguDb();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Billing cycle dates
  const billingCycleDates = useMemo(
    () => getBillingCycleDates(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const cycleStartDateStr = useMemo(
    () => (billingCycleDates.length > 0 ? formatDateKey(billingCycleDates[0]) : ''),
    [billingCycleDates]
  );
  const cycleEndDateStr = useMemo(
    () =>
      billingCycleDates.length > 0
        ? formatDateKey(billingCycleDates[billingCycleDates.length - 1])
        : '',
    [billingCycleDates]
  );

  // Helpers
  const hasOverlappingContract = useCallback(
    (empId: string) => {
      const empContracts = contracts.filter((c) => c.employeeId === empId);
      return empContracts.some((c) =>
        doIntervalsOverlap(c.startDate, c.endDate, cycleStartDateStr, cycleEndDateStr)
      );
    },
    [contracts, cycleStartDateStr, cycleEndDateStr]
  );

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) || emp.category.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  // Auto-select first employee
  useEffect(() => {
    if (filteredEmployees.length > 0) {
      const exists = filteredEmployees.some((e) => e.id === selectedEmployeeId);
      if (!exists) setSelectedEmployeeId(filteredEmployees[0].id);
    } else {
      setSelectedEmployeeId('');
    }
  }, [filteredEmployees, selectedEmployeeId]);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  );

  const isSelectedEmpCoveredForCycle = useMemo(() => {
    if (!selectedEmployeeId) return false;
    return hasOverlappingContract(selectedEmployeeId);
  }, [selectedEmployeeId, hasOverlappingContract]);

  // Days marked for an employee (for sidebar list)
  const getDaysMarkedInCycle = useCallback(
    (empId: string) => {
      const empAttendance = attendance[empId] || {};
      const empContracts = contracts.filter((c) => c.employeeId === empId);
      let total = 0;
      let coveredDays = 0;
      billingCycleDates.forEach((date) => {
        const dateStr = formatDateKey(date);
        const isCovered = empContracts.some(
          (c) => c.startDate <= dateStr && dateStr <= c.endDate
        );
        if (!isCovered) return;
        coveredDays++;
        const record = empAttendance[dateStr];
        if (record) {
          if (record.fn) total += 0.5;
          if (record.an) total += 0.5;
        }
      });
      return { total, coveredDays };
    },
    [attendance, billingCycleDates, contracts]
  );

  // Live summary metrics
  const liveSummary = useMemo(() => {
    if (!selectedEmployeeId) return { regularDays: 0, otDays: 0, holidayDays: 0, coveredDays: 0 };
    const empAttendance = attendance[selectedEmployeeId] || {};
    const empContracts = contracts.filter((c) => c.employeeId === selectedEmployeeId);
    let regularDays = 0;
    let otDays = 0;
    let holidayDays = 0;
    let coveredDays = 0;

    billingCycleDates.forEach((date) => {
      const dateStr = formatDateKey(date);
      const isCovered = empContracts.some(
        (c) => c.startDate <= dateStr && dateStr <= c.endDate
      );
      if (!isCovered) return;
      coveredDays++;
      const record = empAttendance[dateStr];
      if (record) {
        if (record.fn) regularDays += 0.5;
        if (record.an) regularDays += 0.5;
        if (record.ot && selectedEmployee?.category !== 'Gardeners') otDays += 1;
        if (record.holiday && (record.fn || record.an)) holidayDays += 1;
      }
    });
    return { regularDays, otDays, holidayDays, coveredDays };
  }, [selectedEmployeeId, attendance, billingCycleDates, contracts, selectedEmployee]);

  const attendancePct = liveSummary.coveredDays
    ? Math.round((liveSummary.regularDays / liveSummary.coveredDays) * 100)
    : 0;

  // Attendance record helper
  const getAttendanceRecord = useCallback(
    (dateStr: string) => {
      if (!selectedEmployeeId) return { fn: false, an: false, ot: false, holiday: false };
      return (
        attendance[selectedEmployeeId]?.[dateStr] || {
          fn: false,
          an: false,
          ot: false,
          holiday: false
        }
      );
    },
    [selectedEmployeeId, attendance]
  );

  const handleToggle = useCallback(
    (dateStr: string, flag: 'fn' | 'an' | 'ot' | 'holiday') => {
      if (!selectedEmployeeId) return;
      const current = getAttendanceRecord(dateStr);
      updateAttendance(selectedEmployeeId, dateStr, { [flag]: !current[flag] });
    },
    [selectedEmployeeId, getAttendanceRecord, updateAttendance]
  );

  // Batch actions
  const handleBatchMarkWeekdays = () => {
    if (!selectedEmployeeId) return;
    const prev = JSON.parse(JSON.stringify(attendance));
    batchMarkWeekdays(selectedEmployeeId, billingCycleDates);
    toast.success('Marked all weekdays as present.', {
      action: { label: 'Undo', onClick: () => saveAttendance(prev) }
    });
  };

  const handleBatchMarkAllPresent = () => {
    if (!selectedEmployeeId) return;
    const prev = JSON.parse(JSON.stringify(attendance));
    batchMarkAllPresent(selectedEmployeeId, billingCycleDates);
    toast.success('Marked all dates as present.', {
      action: { label: 'Undo', onClick: () => saveAttendance(prev) }
    });
  };

  const handleBatchClearAll = () => {
    if (!selectedEmployeeId) return;
    const prev = JSON.parse(JSON.stringify(attendance));
    batchClearAll(selectedEmployeeId, billingCycleDates);
    toast.success('Cleared all attendance for this cycle.', {
      action: { label: 'Undo', onClick: () => saveAttendance(prev) }
    });
  };

  const isWeekend = (date: Date) => {
    const d = date.getDay();
    return d === 0 || d === 6;
  };

  const isSunday = (date: Date) => date.getDay() === 0;

  const formatDateLabel = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    return { day, weekday };
  };

  const selectedMonthLabel =
    MONTHS.find((m) => m.value === selectedMonth)?.label ?? '';
  const categoryColor =
    selectedEmployee ? (CATEGORY_COLORS[selectedEmployee.category] ?? 'bg-muted text-muted-foreground') : '';

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0 h-full">
      {/* ── Sticky top toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-0">
        {/* Cycle selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <RiCalendarEventLine className="size-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Billing Cycle
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <Select
            value={String(selectedMonth)}
            onValueChange={(val) => setSelectedMonth(Number(val))}
          >
            <SelectTrigger className="h-8 w-36 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)} className="text-xs">
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
            <SelectTrigger className="h-8 w-24 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Cycle date range info */}
        {billingCycleDates.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono bg-muted/60 px-3 py-1.5 rounded-full border border-border/50">
            <RiCalendarLine className="size-3.5 shrink-0" />
            <span>
              {new Date(cycleStartDateStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short'
              })}
              &nbsp;→&nbsp;
              {new Date(cycleEndDateStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            <Separator orientation="vertical" className="h-3 mx-0.5" />
            <span className="font-semibold">{billingCycleDates.length}d</span>
          </div>
        )}
      </div>

      {/* ── Empty state: no employees ──────────────────────────────────────────── */}
      {employees.length === 0 ? (
        <Card className="flex-1 border-dashed border-border/80 bg-card/30 flex flex-col items-center justify-center py-20">
          <Empty>
            <div className="text-center max-w-sm px-6 flex flex-col items-center gap-4">
              <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <RiUserLine className="size-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base mb-1">No Employees Found</h3>
                <p className="text-sm text-muted-foreground">
                  Add employees to the portal before marking attendance.
                </p>
              </div>
              <Button onClick={onNavigateToEmployees} className="w-full">
                <RiArrowRightLine data-icon="inline-end" />
                Go to Employee Profiles
              </Button>
            </div>
          </Empty>
        </Card>
      ) : (
        /* ── Two-panel layout ─────────────────────────────────────────────────── */
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 210px)' }}>

          {/* ── LEFT: Staff panel ─────────────────────────────────────────────── */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3 min-h-0">
            <Card className="flex flex-col min-h-0 flex-1 border-border/60 bg-card/60">
              <CardHeader className="pb-2 pt-4 px-4 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-sm font-bold flex items-center gap-1.5">
                    <RiListCheck className="text-primary size-4" />
                    Staff
                  </CardTitle>
                  <Badge variant="secondary" className="font-mono text-[10px] h-5">
                    {filteredEmployees.length}
                  </Badge>
                </div>
                {/* Search */}
                <div className="relative mt-2">
                  <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search staff..."
                    className="pl-8 h-8 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <Separator />

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-2 flex flex-col gap-1">
                  {filteredEmployees.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No results found.
                    </p>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const { total, coveredDays } = getDaysMarkedInCycle(emp.id);
                      const hasContract = hasOverlappingContract(emp.id);
                      const isActive = selectedEmployeeId === emp.id;
                      const pct = coveredDays > 0 ? Math.round((total / coveredDays) * 100) : 0;
                      const catColor =
                        CATEGORY_COLORS[emp.category] ?? 'bg-muted text-muted-foreground';

                      return (
                        <Tooltip key={emp.id}>
                          <TooltipTrigger
                            render={
                              <button
                                onClick={() => setSelectedEmployeeId(emp.id)}
                                className={cn(
                                  'w-full text-left p-2.5 rounded-lg transition-all border',
                                  isActive
                                    ? 'bg-primary/10 border-primary/30 shadow-sm'
                                    : 'bg-transparent border-transparent hover:bg-muted/60 hover:border-border/40'
                                )}
                              />
                            }
                          >
                            <div className="flex items-start gap-2">
                              {/* Avatar circle */}
                              <div
                                className={cn(
                                  'size-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5',
                                  isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                {emp.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <p
                                    className={cn(
                                      'font-semibold text-xs leading-none truncate',
                                      isActive ? 'text-primary' : 'text-foreground'
                                    )}
                                  >
                                    {emp.name}
                                  </p>
                                  {/* Contract warning dot / days count */}
                                  {!hasContract ? (
                                    <span className="relative flex size-2 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                      <span className="relative inline-flex rounded-full size-2 bg-rose-500" />
                                    </span>
                                  ) : (
                                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                      {total.toFixed(1)}d
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    'inline-flex items-center text-[9px] font-semibold px-1.5 py-px rounded-full border mt-1',
                                    catColor
                                  )}
                                >
                                  {emp.category}
                                </span>
                                {/* Progress bar */}
                                {hasContract && (
                                  <div className="mt-1.5 h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full transition-all',
                                        pct >= 90
                                          ? 'bg-emerald-500'
                                          : pct >= 60
                                          ? 'bg-primary'
                                          : pct > 0
                                          ? 'bg-amber-500'
                                          : 'bg-muted-foreground/30'
                                      )}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {hasContract
                              ? `${total} / ${coveredDays} days marked (${pct}%)`
                              : 'No contract for this cycle — attendance locked'}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* ── RIGHT: Attendance grid ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col">
            {!selectedEmployee ? (
              <Card className="flex-1 flex flex-col items-center justify-center p-8 bg-card/30 border-dashed">
                <Empty>
                  <p className="text-muted-foreground text-sm text-center">
                    Select an employee from the staff panel to view and mark attendance.
                  </p>
                </Empty>
              </Card>
            ) : (
              <Card className="flex-1 min-h-0 flex flex-col border-border/60 bg-card/60">

                {/* ── Card header ─────────────────────────────────────────────── */}
                <CardHeader className="py-3 px-4 shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Employee identity */}
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'size-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
                          categoryColor
                        )}
                      >
                        {selectedEmployee.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="font-heading text-sm font-bold leading-none">
                            {selectedEmployee.name}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={cn('text-[9px] font-bold px-1.5 py-0', categoryColor)}
                          >
                            {selectedEmployee.category}
                          </Badge>
                        </div>
                        <CardDescription className="text-[10px] mt-0.5">
                          {selectedMonthLabel} {selectedYear} · FN = Forenoon · AN = Afternoon
                          {selectedEmployee.category !== 'Gardeners' && ' · OT = Overtime'}
                          {' · HOL = Holiday duty'}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Batch actions toolbar */}
                    {isSelectedEmpCoveredForCycle && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={handleBatchMarkWeekdays}
                              />
                            }
                          >
                            <RiCalendarLine data-icon="inline-start" />
                            Weekdays
                          </TooltipTrigger>
                          <TooltipContent>Mark all Mon–Fri as full-day present</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={handleBatchMarkAllPresent}
                              />
                            }
                          >
                            <RiCheckDoubleLine data-icon="inline-start" />
                            All Present
                          </TooltipTrigger>
                          <TooltipContent>Mark every day in cycle as present (FN + AN)</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                size="xs"
                                variant="destructive"
                                onClick={handleBatchClearAll}
                              />
                            }
                          >
                            <RiDeleteBinLine data-icon="inline-start" />
                            Clear
                          </TooltipTrigger>
                          <TooltipContent>Clear all attendance flags for this cycle</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <Separator />

                {/* ── No contract warning ──────────────────────────────────────── */}
                {!isSelectedEmpCoveredForCycle && (
                  <div className="px-4 pt-3 shrink-0">
                    <Alert
                      variant="destructive"
                      className="bg-destructive/8 border-destructive/20 py-3"
                    >
                      <RiAlertLine className="size-4" />
                      <AlertTitle className="font-heading font-bold text-xs">
                        No Active Contract for This Cycle
                      </AlertTitle>
                      <AlertDescription className="text-[11px] mt-0.5">
                        Attendance can only be marked within a valid contract period.{' '}
                        <Button
                          variant="link"
                          onClick={onNavigateToContracts}
                          className="text-destructive underline p-0 h-auto font-semibold align-baseline text-[11px]"
                        >
                          Register a contract
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* ── Column headers ───────────────────────────────────────────── */}
                {isSelectedEmpCoveredForCycle && (
                  <div className="px-4 pt-3 pb-1 shrink-0">
                    <div className="grid grid-cols-[auto_1fr_repeat(4,auto)] gap-x-2 items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground pr-2">
                      <span className="w-[80px]">Date</span>
                      <span />
                      <span className="w-9 text-center text-sky-600 dark:text-sky-400">FN</span>
                      <span className="w-9 text-center text-violet-600 dark:text-violet-400">AN</span>
                      {selectedEmployee.category !== 'Gardeners' && (
                        <span className="w-9 text-center text-amber-600 dark:text-amber-400">OT</span>
                      )}
                      <span className="w-9 text-center text-purple-600 dark:text-purple-400">HOL</span>
                    </div>
                    <Separator className="mt-1" />
                  </div>
                )}

                {/* ── Scrollable date grid ─────────────────────────────────────── */}
                <ScrollArea className="flex-1 min-h-0">
                  <div className="px-4 pb-3 pt-1 flex flex-col gap-0.5">
                    {billingCycleDates.map((date) => {
                      const dateStr = formatDateKey(date);
                      const isCovered = isDateCoveredByContract(
                        contracts,
                        selectedEmployeeId,
                        dateStr
                      );
                      const record = getAttendanceRecord(dateStr);
                      const weekend = isWeekend(date);
                      const sunday = isSunday(date);
                      const { day, weekday } = formatDateLabel(date);
                      const isFullDay = record.fn && record.an;
                      const isHalfDay = (record.fn || record.an) && !isFullDay;

                      return (
                        <div
                          key={dateStr}
                          className={cn(
                            'grid grid-cols-[auto_1fr_repeat(4,auto)] gap-x-2 items-center rounded-md px-2 py-1 transition-colors',
                            !isCovered
                              ? 'opacity-40'
                              : weekend
                              ? 'bg-amber-500/5 hover:bg-amber-500/8'
                              : 'hover:bg-muted/40',
                            sunday && isCovered && 'bg-rose-500/5 hover:bg-rose-500/8'
                          )}
                        >
                          {/* Date label */}
                          <div className="w-[80px] flex items-center gap-1.5 shrink-0">
                            <span
                              className={cn(
                                'font-mono text-xs font-bold tabular-nums',
                                !isCovered
                                  ? 'text-muted-foreground/50'
                                  : sunday
                                  ? 'text-rose-500 dark:text-rose-400'
                                  : weekend
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-foreground'
                              )}
                            >
                              {day}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-semibold uppercase tracking-wide',
                                !isCovered
                                  ? 'text-muted-foreground/40'
                                  : sunday
                                  ? 'text-rose-400 dark:text-rose-500'
                                  : weekend
                                  ? 'text-amber-500 dark:text-amber-600'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {weekday}
                            </span>
                          </div>

                          {/* Attendance fill indicator */}
                          <div className="flex items-center">
                            {isCovered && (
                              <div className="flex gap-px h-2.5 w-full max-w-[60px]">
                                <div
                                  className={cn(
                                    'flex-1 rounded-l-full transition-colors',
                                    record.fn
                                      ? 'bg-sky-500'
                                      : 'bg-muted/60'
                                  )}
                                />
                                <div
                                  className={cn(
                                    'flex-1 rounded-r-full transition-colors',
                                    record.an
                                      ? 'bg-violet-500'
                                      : 'bg-muted/60'
                                  )}
                                />
                              </div>
                            )}
                            {!isCovered && (
                              <span className="text-[9px] font-medium text-muted-foreground/50 italic tracking-wide">
                                outside contract
                              </span>
                            )}
                          </div>

                          {/* FN toggle */}
                          <Toggle
                            size="sm"
                            variant="outline"
                            pressed={record.fn}
                            onPressedChange={() => isCovered && handleToggle(dateStr, 'fn')}
                            disabled={!isCovered}
                            className={cn(
                              'size-9 font-bold text-[10px] transition-all',
                              record.fn
                                ? 'bg-sky-500 text-white border-sky-500 hover:bg-sky-600 hover:text-white aria-pressed:bg-sky-500 aria-pressed:text-white'
                                : 'text-muted-foreground'
                            )}
                          >
                            FN
                          </Toggle>

                          {/* AN toggle */}
                          <Toggle
                            size="sm"
                            variant="outline"
                            pressed={record.an}
                            onPressedChange={() => isCovered && handleToggle(dateStr, 'an')}
                            disabled={!isCovered}
                            className={cn(
                              'size-9 font-bold text-[10px] transition-all',
                              record.an
                                ? 'bg-violet-500 text-white border-violet-500 hover:bg-violet-600 hover:text-white aria-pressed:bg-violet-500 aria-pressed:text-white'
                                : 'text-muted-foreground'
                            )}
                          >
                            AN
                          </Toggle>

                          {/* OT toggle (hidden for Gardeners) */}
                          {selectedEmployee.category !== 'Gardeners' ? (
                            <Toggle
                              size="sm"
                              variant="outline"
                              pressed={record.ot}
                              onPressedChange={() => isCovered && handleToggle(dateStr, 'ot')}
                              disabled={!isCovered}
                              className={cn(
                                'size-9 font-bold text-[10px] transition-all',
                                record.ot
                                  ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:text-white aria-pressed:bg-amber-500 aria-pressed:text-white'
                                  : 'text-muted-foreground'
                              )}
                            >
                              OT
                            </Toggle>
                          ) : (
                            <div className="size-9" />
                          )}

                          {/* HOL toggle */}
                          <Toggle
                            size="sm"
                            variant="outline"
                            pressed={record.holiday}
                            onPressedChange={() => isCovered && handleToggle(dateStr, 'holiday')}
                            disabled={!isCovered}
                            className={cn(
                              'size-9 font-bold text-[9px] transition-all',
                              record.holiday
                                ? 'bg-purple-500 text-white border-purple-500 hover:bg-purple-600 hover:text-white aria-pressed:bg-purple-500 aria-pressed:text-white'
                                : 'text-muted-foreground'
                            )}
                          >
                            HOL
                          </Toggle>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* ── Live summary footer ──────────────────────────────────────── */}
                {isSelectedEmpCoveredForCycle && (
                  <>
                    <Separator />
                    <div className="px-4 py-3 shrink-0 flex flex-wrap gap-4 bg-muted/20">
                      {/* Attendance progress */}
                      <Progress
                        value={attendancePct}
                        className="flex-1 min-w-[140px]"
                      >
                        <ProgressLabel className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                          <RiCalendarLine className="size-3" />
                          Attendance
                        </ProgressLabel>
                        <ProgressValue className="text-[10px] font-mono font-bold text-primary">
                          {liveSummary.regularDays.toFixed(1)} / {liveSummary.coveredDays}d
                        </ProgressValue>
                      </Progress>

                      {/* OT counter */}
                      {selectedEmployee.category !== 'Gardeners' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <RiTimeLine className="size-3.5 text-amber-500 shrink-0" />
                          <span className="text-[10px] text-muted-foreground font-medium">OT</span>
                          <span className="font-mono font-bold text-[12px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            {liveSummary.otDays}d
                          </span>
                        </div>
                      )}

                      {/* Holiday duty */}
                      <div className="flex items-center gap-2 shrink-0">
                        <RiSunLine className="size-3.5 text-purple-500 shrink-0" />
                        <span className="text-[10px] text-muted-foreground font-medium">Holiday</span>
                        <span className="font-mono font-bold text-[12px] text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          {liveSummary.holidayDays}d
                        </span>
                      </div>

                      {/* Completion pct badge */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <div className="flex items-center gap-1 cursor-default" />
                            }
                          >
                            <RiInformationLine className="size-3.5 text-muted-foreground/60" />
                            <Badge
                              variant="secondary"
                              className={cn(
                                'font-mono text-[11px] font-bold px-2 h-6',
                                attendancePct >= 90
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : attendancePct >= 60
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              )}
                            >
                              {attendancePct}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {attendancePct}% attendance rate for this billing cycle
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
