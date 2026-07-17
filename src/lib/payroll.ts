import { AttendanceRecord, Contract, Employee, Settings } from '../store';
import { getBillingCycleDates } from './utils';
import { isWithinInterval, parseISO } from 'date-fns';

export interface EmployeePayroll {
  employee: Employee;
  totalDays: number;
  otDays: number;
  basePay: number;
  otPay: number;
  totalPay: number;
  workedHolidays: string[];
  activeContracts: Contract[];
}

export function calculatePayroll(
  year: number, 
  month: number, 
  employees: Employee[], 
  contracts: Contract[], 
  attendance: AttendanceRecord,
  settings: Settings
): EmployeePayroll[] {
  const cycle = getBillingCycleDates(year, month);
  const payrolls: EmployeePayroll[] = [];

  for (const emp of employees) {
    // Find all contracts active during this billing cycle for this employee
    const empContracts = contracts.filter(c => c.employeeId === emp.id);
    const activeContracts = empContracts.filter(c => {
      const cStart = parseISO(c.startDate);
      const cEnd = parseISO(c.endDate);
      // Contract overlaps with cycle if it starts before cycle ends AND ends after cycle starts
      return cStart <= cycle.endDate && cEnd >= cycle.startDate;
    });

    if (activeContracts.length === 0) continue;

    const empAttendance = attendance[emp.id] || {};
    let totalDays = 0;
    let otDays = 0;
    const workedHolidays: string[] = [];

    for (const date of cycle.dates) {
      // Check if this date falls within ANY of the active contracts
      const parsedDate = parseISO(date);
      const isCovered = activeContracts.some(c => {
         const s = parseISO(c.startDate);
         const e = parseISO(c.endDate);
         return isWithinInterval(parsedDate, { start: s, end: e });
      });

      if (!isCovered) continue;

      const record = empAttendance[date];
      if (record) {
        let dayValue = 0;
        if (record.fn) dayValue += 0.5;
        if (record.an) dayValue += 0.5;
        
        totalDays += dayValue;

        if (record.ot && ['Cooks', 'Helpers', 'Drivers'].includes(emp.category)) {
          otDays += 1;
        }
        
        if (record.isHoliday && dayValue > 0) {
           workedHolidays.push(date);
        }
      }
    }

    if (totalDays > 0) {
      const basePay = totalDays * (settings.baseWages[emp.category] || 0);
      const otPay = otDays * (settings.otRates[emp.category] || 0);
      
      payrolls.push({
        employee: emp,
        totalDays,
        otDays,
        basePay,
        otPay,
        totalPay: Math.min(basePay + otPay, settings.monthlyCeiling?.[emp.category] ?? Infinity),
        workedHolidays,
        activeContracts,
      });
    }
  }

  return payrolls;
}
