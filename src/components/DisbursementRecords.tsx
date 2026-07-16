import React, { useState, useMemo } from 'react';
import { useMguDb } from '@/lib/db';
import { getBillingCycleDates, formatDateKey, formatIndianRupees } from '@/lib/payrollUtils';
import { generateSummaryReport, generateAttendanceReport, generateEmployeeReceipt } from '@/lib/pdfGenerator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Empty } from '@/components/ui/empty';
import {
  RiCoinsLine,
  RiGroupLine,
  RiTimeLine,
  RiMoneyRupeeCircleLine,
  RiCalendarEventLine,
  RiFileDownloadLine,
  RiFilePaper2Line
} from '@remixicon/react';
import { toast } from 'sonner';

export const DisbursementRecords: React.FC = () => {
  const { employees, contracts, attendance, settings, calculatePayroll } = useMguDb();

  // Date Selection (matches Attendance workspace)
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(7);

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

  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Calculate current billing cycle dates
  const billingCycleDates = useMemo(() => {
    return getBillingCycleDates(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const cycleStartStr = useMemo(() => {
    if (billingCycleDates.length === 0) return '';
    return new Date(formatDateKey(billingCycleDates[0])).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long'
    });
  }, [billingCycleDates]);

  const cycleEndStr = useMemo(() => {
    if (billingCycleDates.length === 0) return '';
    return new Date(formatDateKey(billingCycleDates[billingCycleDates.length - 1])).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [billingCycleDates]);

  // Compute calculations instantly
  const payrollData = useMemo(() => {
    return calculatePayroll(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, employees, contracts, attendance, settings]);

  // KPI aggregates
  const activeStaff = payrollData.length;
  
  const regularDaysLogged = useMemo(() => {
    return payrollData.reduce((sum, r) => sum + r.regularDays, 0);
  }, [payrollData]);

  const overtimeDaysLogged = useMemo(() => {
    return payrollData.reduce((sum, r) => sum + r.otDays, 0);
  }, [payrollData]);

  const grandTotalPayroll = useMemo(() => {
    return payrollData.reduce((sum, r) => sum + r.totalPay, 0);
  }, [payrollData]);

  const monthLabel = useMemo(() => {
    return months.find(m => m.value === selectedMonth)?.label || 'Month';
  }, [selectedMonth]);

  // Trigger global downloads
  const handleDownloadSummary = () => {
    if (payrollData.length === 0) return;
    try {
      const cycleStartStrFormatted = new Date(formatDateKey(billingCycleDates[0])).toLocaleDateString('en-GB');
      const cycleEndStrFormatted = new Date(formatDateKey(billingCycleDates[billingCycleDates.length - 1])).toLocaleDateString('en-GB');
      generateSummaryReport(payrollData, monthLabel, selectedYear, cycleStartStrFormatted, cycleEndStrFormatted);
      toast.success("Summary disbursement report downloaded.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF summary report.");
    }
  };

  const handleDownloadAttendanceReport = () => {
    if (payrollData.length === 0) return;
    try {
      generateAttendanceReport(payrollData, monthLabel, selectedYear);
      toast.success("General attendance report downloaded.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF attendance report.");
    }
  };

  const handleDownloadEmployeeReceipt = (row: any) => {
    try {
      const empAttendance = attendance[row.employeeId] || {};
      generateEmployeeReceipt(row, empAttendance, billingCycleDates, monthLabel, selectedYear);
      toast.success(`Attendance receipt generated for ${row.name}.`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate employee receipt PDF.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top billing cycle bar */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <RiCalendarEventLine className="text-primary size-5" />
            <div>
              <h3 className="font-heading font-bold text-sm leading-tight">Payroll Cycle Selection</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Billing Cycle: {cycleStartStr} to {cycleEndStr}
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Staff */}
        <Card className="border-border/60 bg-card/40">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Staff</p>
              <h3 className="text-2xl font-bold font-heading mt-1 font-mono">{activeStaff}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <RiGroupLine className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Regular Days Logged */}
        <Card className="border-border/60 bg-card/40">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Regular Days</p>
              <h3 className="text-2xl font-bold font-heading mt-1 font-mono">{regularDaysLogged.toFixed(1)}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
              <RiCalendarEventLine className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Overtime Days Logged */}
        <Card className="border-border/60 bg-card/40">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Overtime Days</p>
              <h3 className="text-2xl font-bold font-heading mt-1 font-mono">{overtimeDaysLogged}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
              <RiTimeLine className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Grand Total Payroll */}
        <Card className="border-border/60 bg-card/40">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Grand Total</p>
              <h3 className="text-2xl font-bold font-heading mt-1 font-mono text-primary truncate max-w-[170px]">
                {formatIndianRupees(grandTotalPayroll)}
              </h3>
            </div>
            <div className="p-3 bg-primary/15 rounded-lg text-primary">
              <RiCoinsLine className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Sheet table */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <RiMoneyRupeeCircleLine className="text-primary size-5" />
              Payroll Preview Sheet
            </CardTitle>
            <CardDescription>
              Calculation previews for {monthLabel} {selectedYear} billing cycle.
            </CardDescription>
          </div>

          {payrollData.length > 0 && (
            <div className="flex items-center gap-2">
              <Button onClick={handleDownloadSummary} size="sm">
                <RiFileDownloadLine data-icon="inline-start" />
                Summary Report
              </Button>
              <Button onClick={handleDownloadAttendanceReport} size="sm" variant="outline">
                <RiFilePaper2Line data-icon="inline-start" />
                Attendance Report
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {payrollData.length === 0 ? (
            <div className="py-12 border border-dashed rounded-lg flex flex-col items-center justify-center">
              <Empty>
                <div className="text-center max-w-sm">
                  <p className="text-sm text-muted-foreground mb-1 font-semibold">No Payroll Data Available</p>
                  <p className="text-xs text-muted-foreground/80">
                    No employees have overlapping active contracts and attendance marked for this billing cycle.
                  </p>
                </div>
              </Empty>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Job Category</TableHead>
                    <TableHead className="text-center font-mono">Regular Days</TableHead>
                    <TableHead className="text-center font-mono">OT Days</TableHead>
                    <TableHead className="text-right">Regular Pay</TableHead>
                    <TableHead className="text-right">OT Pay</TableHead>
                    <TableHead className="text-right">Total Pay</TableHead>
                    <TableHead className="text-right">Receipts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.map((row) => (
                    <TableRow key={row.employeeId}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell className="text-center font-mono">{row.regularDays.toFixed(1)}</TableCell>
                      <TableCell className="text-center font-mono">{row.otDays}</TableCell>
                      <TableCell className="text-right font-mono">{formatIndianRupees(row.regularPay)}</TableCell>
                      <TableCell className="text-right font-mono">{formatIndianRupees(row.otPay)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {formatIndianRupees(row.totalPay)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleDownloadEmployeeReceipt(row)}
                        >
                          <RiFileDownloadLine data-icon="inline-start" />
                          Receipt PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
