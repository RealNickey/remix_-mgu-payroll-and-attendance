import { useState, useMemo, useEffect } from 'react';
import { useMguDb } from '@/lib/db';
import { getBillingCycleDates, formatDateKey, isDateCoveredByContract, doIntervalsOverlap } from '@/lib/payrollUtils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/components/ui/empty';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  RiCalendarEventLine,
  RiAlertLine,
  RiSearchLine,
  RiListCheck
} from '@remixicon/react';
import { toast } from 'sonner';

interface AttendanceEntryProps {
  onNavigateToEmployees: () => void;
  onNavigateToContracts: () => void;
}

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

  // Selected billing cycle states
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(2026); // Default to current system year
  const [selectedMonth, setSelectedMonth] = useState(7); // Default to July (current local month is July)

  // Employee Selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // Months listing
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Year options: current +/- 1
  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Get all dates in this billing cycle
  const billingCycleDates = useMemo(() => {
    return getBillingCycleDates(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const cycleStartDateStr = useMemo(() => {
    return billingCycleDates.length > 0 ? formatDateKey(billingCycleDates[0]) : '';
  }, [billingCycleDates]);

  const cycleEndDateStr = useMemo(() => {
    return billingCycleDates.length > 0 ? formatDateKey(billingCycleDates[billingCycleDates.length - 1]) : '';
  }, [billingCycleDates]);

  // Check if an employee has any contract overlapping the selected cycle
  const hasOverlappingContract = (empId: string) => {
    const empContracts = contracts.filter(c => c.employeeId === empId);
    return empContracts.some(c => 
      doIntervalsOverlap(c.startDate, c.endDate, cycleStartDateStr, cycleEndDateStr)
    );
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(q) ||
      emp.category.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  // Pre-select first employee automatically when the list or selections change
  useEffect(() => {
    if (filteredEmployees.length > 0) {
      // Keep selected employee if still in filtered list, else select first
      const exists = filteredEmployees.some(e => e.id === selectedEmployeeId);
      if (!exists) {
        setSelectedEmployeeId(filteredEmployees[0].id);
      }
    } else {
      setSelectedEmployeeId('');
    }
  }, [filteredEmployees, selectedEmployeeId]);

  // Currently selected employee details
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  // Check if selected employee is covered by any contract for the cycle
  const isSelectedEmpCoveredForCycle = useMemo(() => {
    if (!selectedEmployeeId) return false;
    return hasOverlappingContract(selectedEmployeeId);
  }, [selectedEmployeeId, contracts, cycleStartDateStr, cycleEndDateStr]);

  // Calculate marked count for an employee in this cycle
  const getDaysMarkedInCycle = (empId: string) => {
    const empAttendance = attendance[empId] || {};
    const empContracts = contracts.filter(c => c.employeeId === empId);
    let total = 0;

    billingCycleDates.forEach(date => {
      const dateStr = formatDateKey(date);
      // Only count if covered by contract
      const isCovered = empContracts.some(c => c.startDate <= dateStr && dateStr <= c.endDate);
      if (!isCovered) return;

      const record = empAttendance[dateStr];
      if (record) {
        if (record.fn) total += 0.5;
        if (record.an) total += 0.5;
      }
    });

    return total;
  };

  // Live footer summary metrics for selected employee
  const liveSummary = useMemo(() => {
    if (!selectedEmployeeId) return { regularDays: 0, otDays: 0, holidayDays: 0 };
    const empAttendance = attendance[selectedEmployeeId] || {};
    const empContracts = contracts.filter(c => c.employeeId === selectedEmployeeId);
    
    let regularDays = 0;
    let otDays = 0;
    let holidayDays = 0;

    billingCycleDates.forEach(date => {
      const dateStr = formatDateKey(date);
      const isCovered = empContracts.some(c => c.startDate <= dateStr && dateStr <= c.endDate);
      if (!isCovered) return;

      const record = empAttendance[dateStr];
      if (record) {
        if (record.fn) regularDays += 0.5;
        if (record.an) regularDays += 0.5;
        // Overtime (only for Cooks, Helpers, Drivers)
        if (record.ot && selectedEmployee?.category !== 'Gardeners') {
          otDays += 1;
        }
        // Holidays worked: both holiday flag and at least one of FN/AN marked
        if (record.holiday && (record.fn || record.an)) {
          holidayDays += 1;
        }
      }
    });

    return { regularDays, otDays, holidayDays };
  }, [selectedEmployeeId, attendance, billingCycleDates, contracts, selectedEmployee]);

  // Split dates into two columns for side-by-side display
  const splitDates = useMemo(() => {
    const half = Math.ceil(billingCycleDates.length / 2);
    return {
      firstHalf: billingCycleDates.slice(0, half),
      secondHalf: billingCycleDates.slice(half)
    };
  }, [billingCycleDates]);

  // Helpers for date rows
  const getAttendanceRecord = (dateStr: string) => {
    if (!selectedEmployeeId) return { fn: false, an: false, ot: false, holiday: false };
    return (
      attendance[selectedEmployeeId]?.[dateStr] || {
        fn: false,
        an: false,
        ot: false,
        holiday: false
      }
    );
  };

  // Date styling & abbreviation
  const formatDateLabel = (date: Date) => {
    // e.g. "26 Jun (Fri)"
    const day = date.getDate();
    const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
    const weekdayShort = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${day} ${monthShort} (${weekdayShort})`;
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  // Toggles attendance value
  const handleToggle = (dateStr: string, flag: 'fn' | 'an' | 'ot' | 'holiday') => {
    if (!selectedEmployeeId) return;
    const current = getAttendanceRecord(dateStr);
    updateAttendance(selectedEmployeeId, dateStr, {
      [flag]: !current[flag]
    });
  };

  // Batch actions wrapper
  const handleBatchMarkWeekdays = () => {
    if (!selectedEmployeeId) return;
    const previousAttendance = JSON.parse(JSON.stringify(attendance));
    batchMarkWeekdays(selectedEmployeeId, billingCycleDates);
    toast.success("Marked all weekdays as present.", {
      action: {
        label: "Undo",
        onClick: () => saveAttendance(previousAttendance)
      }
    });
  };

  const handleBatchMarkAllPresent = () => {
    if (!selectedEmployeeId) return;
    const previousAttendance = JSON.parse(JSON.stringify(attendance));
    batchMarkAllPresent(selectedEmployeeId, billingCycleDates);
    toast.success("Marked all dates in cycle as present.", {
      action: {
        label: "Undo",
        onClick: () => saveAttendance(previousAttendance)
      }
    });
  };

  const handleBatchClearAll = () => {
    if (!selectedEmployeeId) return;
    const previousAttendance = JSON.parse(JSON.stringify(attendance));
    batchClearAll(selectedEmployeeId, billingCycleDates);
    toast.success("Cleared attendance flags for this cycle.", {
      action: {
        label: "Undo",
        onClick: () => saveAttendance(previousAttendance)
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top billing cycle bar */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <RiCalendarEventLine className="text-primary size-5" />
            <div>
              <h3 className="font-heading font-bold text-sm leading-tight">Billing Cycle</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {billingCycleDates.length > 0
                  ? `${new Date(cycleStartDateStr).toLocaleDateString('en-GB')} to ${new Date(cycleEndDateStr).toLocaleDateString('en-GB')}`
                  : 'Select period'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={String(selectedMonth)}
              onValueChange={(val) => setSelectedMonth(Number(val))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {months.map(m => (
                    <SelectItem key={m.value} value={String(m.value)}>
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
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid area */}
      {employees.length === 0 ? (
        <Card className="py-12 border-dashed border-border/80 bg-card/30 flex flex-col items-center justify-center">
          <Empty>
            <div className="text-center max-w-md px-6">
              <h3 className="font-heading font-bold text-base mb-1">No Employees Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You must add employees to the portal database before marking attendance.
              </p>
              <Button onClick={onNavigateToEmployees} className="w-full">
                Go to Employee Profiles
              </Button>
            </div>
          </Empty>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left panel: Employee selection list */}
          <div className="w-full lg:w-80 shrink-0">
            <Card className="border-border/60 bg-card/50 backdrop-blur-md h-[calc(100vh-280px)] min-h-[450px] flex flex-col">
              <CardHeader className="py-4">
                <CardTitle className="font-heading text-base font-bold flex items-center gap-2">
                  <RiListCheck className="text-primary size-5" />
                  Staff List
                </CardTitle>
                <div className="relative w-full mt-2">
                  <RiSearchLine className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff..."
                    className="pl-8 h-8 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                {filteredEmployees.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No results found.</p>
                ) : (
                  filteredEmployees.map(emp => {
                    const daysMarked = getDaysMarkedInCycle(emp.id);
                    const totalDays = billingCycleDates.length;
                    const hasContract = hasOverlappingContract(emp.id);

                    return (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className={`w-full text-left p-2.5 rounded-md transition-all flex items-center justify-between border ${
                          selectedEmployeeId === emp.id
                            ? 'bg-primary/10 border-primary/30 text-primary dark:bg-primary/20 dark:border-primary/40'
                            : 'bg-transparent border-transparent hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-medium text-xs leading-none truncate">{emp.name}</p>
                          <span className="text-[10px] text-muted-foreground leading-none mt-1 inline-block">
                            {emp.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Progress indicator */}
                          {hasContract && (
                            <span className="font-mono text-[10px] font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {daysMarked}/{totalDays}d
                            </span>
                          )}

                          {/* Missing contract red indicator dot */}
                          {!hasContract && (
                            <span className="relative flex size-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full size-2 bg-rose-500"></span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Attendance grid */}
          <div className="flex-1 min-w-0">
            {selectedEmployee ? (
              <Card className="border-border/60 bg-card/50 backdrop-blur-md h-[calc(100vh-280px)] min-h-[450px] flex flex-col">
                <CardHeader className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="font-heading text-base font-bold">
                        {selectedEmployee.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {selectedEmployee.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Mark forenoon (FN), afternoon (AN), overtime (OT), and holiday duty flags.
                    </CardDescription>
                  </div>

                  {/* Batch actions (Only show if contract covers cycle) */}
                  {isSelectedEmpCoveredForCycle && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button size="xs" variant="outline" onClick={handleBatchMarkWeekdays}>
                        Mark Weekdays
                      </Button>
                      <Button size="xs" variant="outline" onClick={handleBatchMarkAllPresent}>
                        Mark All Present
                      </Button>
                      <Button size="xs" variant="destructive" onClick={handleBatchClearAll}>
                        Clear All
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <Separator />
                
                {/* Warning message if no contracts cover this cycle */}
                {!isSelectedEmpCoveredForCycle && (
                  <div className="p-4 shrink-0">
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive dark:bg-destructive/20 dark:border-destructive/30 py-3">
                      <RiAlertLine className="size-4" />
                      <AlertTitle className="font-heading font-bold text-xs">No Active Contract Found</AlertTitle>
                      <AlertDescription className="text-[11px] mt-1">
                        This employee has no contract registered that covers any part of this billing cycle.
                        Attendance outside a contract's validity period does not count in payroll and cannot be marked.
                        <Button
                          variant="link"
                          onClick={onNavigateToContracts}
                          className="text-destructive underline p-0 ml-1 h-auto font-medium align-baseline text-[11px]"
                        >
                          Register a contract.
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <CardContent className="flex-1 overflow-y-auto p-4 min-h-0">
                  {/* Two column grid layout */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-2">
                    {/* Render helper columns */}
                    {[splitDates.firstHalf, splitDates.secondHalf].map((dateCol, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-2">
                        {dateCol.map((date) => {
                          const dateStr = formatDateKey(date);
                          const isCovered = isDateCoveredByContract(contracts, selectedEmployeeId, dateStr);
                          const record = getAttendanceRecord(dateStr);
                          const weekend = isWeekend(date);

                          return (
                            <div
                              key={dateStr}
                              className={`flex items-center justify-between p-2 rounded-md border text-xs leading-none transition-all ${
                                !isCovered
                                  ? 'bg-muted/20 border-border/40 text-muted-foreground/60'
                                  : weekend
                                  ? 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10'
                                  : 'bg-card border-border/80 hover:bg-muted/20'
                              }`}
                            >
                              {/* Date labels */}
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-medium ${weekend && isCovered ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                  {formatDateLabel(date)}
                                </span>
                                {!isCovered && (
                                  <span className="text-[10px] bg-muted px-1 py-0.5 rounded font-medium text-muted-foreground/80 scale-90 origin-left">
                                    Outside Contract
                                  </span>
                                )}
                              </div>

                              {/* Toggle Buttons (hidden if outside contract) */}
                              {isCovered ? (
                                <div className="flex items-center gap-1">
                                  {/* FN Toggle */}
                                  <Button
                                    size="icon-xs"
                                    variant={record.fn ? "default" : "outline"}
                                    onClick={() => handleToggle(dateStr, 'fn')}
                                    className="size-7 font-bold text-[10px]"
                                  >
                                    FN
                                  </Button>

                                  {/* AN Toggle */}
                                  <Button
                                    size="icon-xs"
                                    variant={record.an ? "default" : "outline"}
                                    onClick={() => handleToggle(dateStr, 'an')}
                                    className="size-7 font-bold text-[10px]"
                                  >
                                    AN
                                  </Button>

                                  {/* OT Toggle (Hidden for Gardeners) */}
                                  {selectedEmployee.category !== 'Gardeners' && (
                                    <Button
                                      size="icon-xs"
                                      variant={record.ot ? "secondary" : "outline"}
                                      onClick={() => handleToggle(dateStr, 'ot')}
                                      className={`size-7 font-bold text-[10px] ${
                                        record.ot ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''
                                      }`}
                                    >
                                      OT
                                    </Button>
                                  )}

                                  {/* Holiday Duty Toggle */}
                                  <Button
                                    size="icon-xs"
                                    variant={record.holiday ? "secondary" : "outline"}
                                    onClick={() => handleToggle(dateStr, 'holiday')}
                                    className={`size-7 font-bold text-[9px] ${
                                      record.holiday ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''
                                    }`}
                                  >
                                    Hol
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/40 italic font-mono pr-2">Locked</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
                
                {/* Live Summary Footer */}
                {isSelectedEmpCoveredForCycle && (
                  <div className="p-3 bg-muted/30 border-t shrink-0 flex items-center justify-around flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground font-medium">Days Attended:</span>
                      <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {liveSummary.regularDays.toFixed(1)} days
                      </span>
                    </div>

                    {selectedEmployee.category !== 'Gardeners' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground font-medium">OT Logged:</span>
                        <span className="font-mono font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded dark:text-amber-400">
                          {liveSummary.otDays} days
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground font-medium">Holiday Duty:</span>
                      <span className="font-mono font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded dark:text-purple-400">
                        {liveSummary.holidayDays} days
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="h-full flex flex-col items-center justify-center p-8 bg-card/30 border-dashed">
                <Empty>
                  <p className="text-muted-foreground text-sm">Select an employee from the staff panel to view and mark attendance.</p>
                </Empty>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
