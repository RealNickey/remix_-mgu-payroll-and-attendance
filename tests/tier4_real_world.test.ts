import { describe, test, expect, beforeEach } from 'bun:test';
import { resetTestEnvironment, mockTextCalls, mockAutoTableCalls } from './setup';
import { useStore } from '../src/store';
import { calculatePayroll } from '../src/lib/payroll';
import { getBillingCycleDates } from '../src/lib/utils';
import { generateIndividualReceipt, generateDisbursementReport } from '../src/lib/pdf';
import { parseISO } from 'date-fns';

describe('Tier 4: Real-World Scenarios', () => {
  beforeEach(() => {
    resetTestEnvironment();
  });

  test('Scenario 4.1: Monthly Cycle Onboarding & Payroll Run', () => {
    const { addEmployee, addContract, setAttendance, updateSettings } = useStore.getState();

    // 1. Onboard 4 employees
    addEmployee({ name: 'Alice Gardener', category: 'Gardeners', bankAccount: 'BANK-A' });
    addEmployee({ name: 'Bob Driver', category: 'Drivers', bankAccount: 'BANK-B' });
    addEmployee({ name: 'Charlie Cook', category: 'Cooks', bankAccount: 'BANK-C' });
    addEmployee({ name: 'Dave Helper', category: 'Helpers', bankAccount: 'BANK-D' });

    const state = useStore.getState();
    const alice = state.employees.find(e => e.name.includes('Alice'))!;
    const bob = state.employees.find(e => e.name.includes('Bob'))!;
    const charlie = state.employees.find(e => e.name.includes('Charlie'))!;
    const dave = state.employees.find(e => e.name.includes('Dave'))!;

    // 2. Add contracts starting 2026-01-01
    addContract({ employeeId: alice.id, startDate: '2026-01-01', orderNo: 'ORD-A', orderDate: '2025-12-20' });
    addContract({ employeeId: bob.id, startDate: '2026-01-01', orderNo: 'ORD-B', orderDate: '2025-12-20' });
    addContract({ employeeId: charlie.id, startDate: '2026-01-01', orderNo: 'ORD-C', orderDate: '2025-12-20' });
    addContract({ employeeId: dave.id, startDate: '2026-01-01', orderNo: 'ORD-D', orderDate: '2025-12-20' });

    // 3. Mark all weekdays as present for January 2026 cycle (Dec 26, 2025 to Jan 25, 2026)
    // Also designate Jan 1 (holiday) as present.
    // Cycle starts Dec 26.
    const cycle = getBillingCycleDates(2026, 1);
    
    // Set weekday attendance
    const markWeekdaysForEmp = (empId: string) => {
      cycle.dates.forEach(dateStr => {
        const date = parseISO(dateStr);
        const day = date.getDay();
        const isWeekend = day === 0 || day === 6;
        if (!isWeekend) {
          setAttendance(empId, dateStr, { fn: true, an: true, ot: false, isHoliday: false });
        }
      });
    };

    [alice.id, bob.id, charlie.id, dave.id].forEach(id => markWeekdaysForEmp(id));

    // 4. Designate Jan 1 as holiday, and mark all employees present
    const holidayDate = '2026-01-01';
    [alice.id, bob.id, charlie.id, dave.id].forEach(id => {
      // Jan 1 is Thursday, so it was already marked as present weekday, let's set isHoliday = true
      setAttendance(id, holidayDate, { fn: true, an: true, ot: false, isHoliday: true });
    });

    // 5. Add 5 days of OT for Alice, Bob, and Charlie (e.g. first 5 dates in Jan that are weekdays)
    const otDates = ['2026-01-02', '2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08'];
    otDates.forEach(date => {
      // Alice (Gardener)
      const aCurr = useStore.getState().attendance[alice.id]?.[date] || { fn: false, an: false, ot: false, isHoliday: false };
      setAttendance(alice.id, date, { ...aCurr, ot: true });
      // Bob (Driver)
      const bCurr = useStore.getState().attendance[bob.id]?.[date] || { fn: false, an: false, ot: false, isHoliday: false };
      setAttendance(bob.id, date, { ...bCurr, ot: true });
      // Charlie (Cook)
      const cCurr = useStore.getState().attendance[charlie.id]?.[date] || { fn: false, an: false, ot: false, isHoliday: false };
      setAttendance(charlie.id, date, { ...cCurr, ot: true });
    });

    // 6. Run payroll calculation for Jan 2026
    const updatedState = useStore.getState();
    const payrolls = calculatePayroll(
      2026, 
      1, 
      updatedState.employees, 
      updatedState.contracts, 
      updatedState.attendance, 
      updatedState.settings
    );

    expect(payrolls.length).toBe(4);

    const alicePay = payrolls.find(p => p.employee.id === alice.id)!;
    const bobPay = payrolls.find(p => p.employee.id === bob.id)!;
    const charliePay = payrolls.find(p => p.employee.id === charlie.id)!;
    const davePay = payrolls.find(p => p.employee.id === dave.id)!;

    // Alice (Gardener) works weekdays starting Jan 1.
    // Weekdays in Jan 2026 cycle starting Jan 1:
    // Jan 1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23 = 17 days
    // Plus Dec 26, 29, 30, 31 (before contract start date Jan 1) - wait!
    // Dec 26, 29, 30, 31 are NOT within contract because contract starts Jan 1.
    // So only 17 days should be paid for all employees.
    expect(alicePay.totalDays).toBe(17.0);
    expect(bobPay.totalDays).toBe(17.0);
    expect(charliePay.totalDays).toBe(17.0);
    expect(davePay.totalDays).toBe(17.0);

    // Assert OT Pay
    // Alice (Gardener): otPay = 0
    expect(alicePay.otDays).toBe(0);
    expect(alicePay.otPay).toBe(0);
    expect(alicePay.totalPay).toBe(17 * 500); // 8500

    // Bob (Driver): otPay = 5 days * 100 = 500
    expect(bobPay.otDays).toBe(5);
    expect(bobPay.otPay).toBe(500);
    expect(bobPay.totalPay).toBe(17 * 600 + 500); // 10700

    // Charlie (Cook): otPay = 5 * 100 = 500
    expect(charliePay.otDays).toBe(5);
    expect(charliePay.otPay).toBe(500);
    expect(charliePay.totalPay).toBe(17 * 550 + 500); // 9850

    // Dave (Helper): no OT
    expect(davePay.otDays).toBe(0);
    expect(davePay.otPay).toBe(0);
    expect(davePay.totalPay).toBe(17 * 450); // 7650

    // Verify worked holidays
    expect(alicePay.workedHolidays).toEqual(['2026-01-01']);
    expect(bobPay.workedHolidays).toEqual(['2026-01-01']);
    expect(charliePay.workedHolidays).toEqual(['2026-01-01']);
    expect(davePay.workedHolidays).toEqual(['2026-01-01']);
  });

  test('Scenario 4.2: Mid-Cycle Contract Renewal and Overlap', () => {
    const { addEmployee, addContract, setAttendance } = useStore.getState();

    addEmployee({ name: 'Grace Driver', category: 'Drivers', bankAccount: 'BANK-G' });
    const grace = useStore.getState().employees[0];

    // Contract 1: 2025-10-15 to 2026-01-12 (90 days)
    addContract({ employeeId: grace.id, startDate: '2025-10-15', orderNo: 'ORD-1', orderDate: '2025-10-10' });
    // Contract 2: 2026-01-10 to 2026-04-09 (overlapping Jan 10, 11, 12)
    addContract({ employeeId: grace.id, startDate: '2026-01-10', orderNo: 'ORD-2-RENEWAL', orderDate: '2026-01-08' });

    // Mark attendance for all days in Jan 2026 cycle (Dec 26 to Jan 25) - 31 days
    const cycle = getBillingCycleDates(2026, 1);
    cycle.dates.forEach(date => {
      setAttendance(grace.id, date, { fn: true, an: true, ot: false, isHoliday: false });
    });

    const state = useStore.getState();
    const payrolls = calculatePayroll(
      2026,
      1,
      state.employees,
      state.contracts,
      state.attendance,
      state.settings
    );

    expect(payrolls[0].activeContracts.length).toBe(2);
    // Overlapping dates (Jan 10, 11, 12) must not be double counted.
    // Total days in billing cycle is 31, all are covered.
    expect(payrolls[0].totalDays).toBe(31.0);
    expect(payrolls[0].basePay).toBe(31 * 600); // 18600

    // Generate Individual Receipt
    generateIndividualReceipt(payrolls[0].employee, payrolls[0].activeContracts[payrolls[0].activeContracts.length - 1], 2026, 1, state.attendance[grace.id], state.settings);
    
    // Receipt should display the Government Order Number of the latest contract (c-2)
    const renewalCall = mockTextCalls.find(c => c.text && c.text.includes('ORD-2-RENEWAL'));
    expect(renewalCall).toBeDefined();
  });

  test('Scenario 4.3: Term Expiry with Voluntary Exit', () => {
    const { addEmployee, addContract, setAttendance } = useStore.getState();

    addEmployee({ name: 'Dave Helper', category: 'Helpers', bankAccount: 'BANK-D' });
    const dave = useStore.getState().employees[0];

    // Contract: Starts 2025-10-01, ends 2025-12-29 (90 days)
    addContract({ employeeId: dave.id, startDate: '2025-10-01', orderNo: 'ORD-D', orderDate: '2025-09-25' });

    // Mark attendance for all days in January 2026 cycle (Dec 26 to Jan 25)
    const cycle = getBillingCycleDates(2026, 1);
    cycle.dates.forEach(date => {
      setAttendance(dave.id, date, { fn: true, an: true, ot: false, isHoliday: false });
    });

    const state = useStore.getState();
    const payrolls = calculatePayroll(
      2026,
      1,
      state.employees,
      state.contracts,
      state.attendance,
      state.settings
    );

    // Helper is included, but only paid for days within contract (Dec 26, 27, 28, 29) -> 4 days.
    // Subsequent days after Dec 29 are excluded.
    expect(payrolls[0].totalDays).toBe(4.0);
    expect(payrolls[0].basePay).toBe(4 * 450); // 1800
  });

  test('Scenario 4.4: Settings Rate Negotiation and Retroactive Adjustments', () => {
    const { addEmployee, addContract, setAttendance, updateSettings } = useStore.getState();

    addEmployee({ name: 'Dave Helper', category: 'Helpers', bankAccount: 'BANK-D' });
    const dave = useStore.getState().employees[0];

    addContract({ employeeId: dave.id, startDate: '2025-12-26', orderNo: 'ORD-D', orderDate: '2025-12-25' });

    // 20 days worked in January cycle
    const cycle = getBillingCycleDates(2026, 1);
    for (let i = 0; i < 20; i++) {
      setAttendance(dave.id, cycle.dates[i], { fn: true, an: true, ot: false, isHoliday: false });
    }

    const payrollsPre = calculatePayroll(
      2026,
      1,
      useStore.getState().employees,
      useStore.getState().contracts,
      useStore.getState().attendance,
      useStore.getState().settings
    );
    expect(payrollsPre[0].basePay).toBe(9000); // 20 * 450

    // Update settings: Helpers to 500, OT to 120
    updateSettings({
      baseWages: {
        Gardeners: 500,
        Drivers: 600,
        Cooks: 550,
        Helpers: 500
      },
      otRates: { Gardeners: 0, Drivers: 100, Cooks: 100, Helpers: 100 }, monthlyCeiling: { Gardeners: 15000, Drivers: 20000, Cooks: 18000, Helpers: 15000 }
    });

    const payrollsPost = calculatePayroll(
      2026,
      1,
      useStore.getState().employees,
      useStore.getState().contracts,
      useStore.getState().attendance,
      useStore.getState().settings
    );
    expect(payrollsPost[0].basePay).toBe(10000); // 20 * 500

    // Generate Disbursement Summary PDF
    generateDisbursementReport(2026, 1, useStore.getState().employees, useStore.getState().contracts, useStore.getState().attendance, useStore.getState().settings);
    
    // Verify that the Disbursement PDF contains the updated value Rs. 10000.00
    // Check autoTableCalls body records
    const tableOptions = mockAutoTableCalls[mockAutoTableCalls.length - 1];
    const daveRow = tableOptions.body.find((r: any) => r[1] === 'Dave Helper')!;
    expect(daveRow[4]).toBe('Rs. 10,000.00');

    const totalRow = tableOptions.body.find((r: any) => r[3] === 'Grand Total:')!;
    expect(totalRow[4]).toBe('Rs. 10,000.00');
  });

  test('Scenario 4.5: Complex Calendar Boundary with Leap Year & Weekend Adjustments', () => {
    const { addEmployee, addContract, setAttendance } = useStore.getState();

    // Onboard Cook in Feb 2028 (leap year)
    addEmployee({ name: 'Charlie Cook', category: 'Cooks', bankAccount: 'BANK-C' });
    const cook = useStore.getState().employees[0];

    // Contract starts Feb 25, 2028
    addContract({ employeeId: cook.id, startDate: '2028-02-25', orderNo: 'ORD-C', orderDate: '2028-02-20' });

    // February 2028 cycle: Feb 26, 2028 to March 25, 2028.
    // 2028 is a leap year, so Feb 29 exists.
    // Billing cycle dates length:
    // Feb 26, 27, 28, 29 (4 days in Feb) + 25 days in March = 29 days total.
    const cycle = getBillingCycleDates(2028, 3);
    expect(cycle.dates.length).toBe(29);

    // Mark weekdays
    cycle.dates.forEach(dateStr => {
      const date = parseISO(dateStr);
      const day = date.getDay();
      const isWeekend = day === 0 || day === 6;
      if (!isWeekend) {
        setAttendance(cook.id, dateStr, { fn: true, an: true, ot: false, isHoliday: false });
      }
    });

    // Mark Feb 29 (leap day) as present. Feb 29, 2028 is Tuesday (weekday), so it is already marked present.
    // Set March 8 (weekday - Wednesday) as holiday, mark Cook present.
    const holidayDate = '2028-03-08';
    setAttendance(cook.id, holidayDate, { fn: true, an: true, ot: false, isHoliday: true });

    const state = useStore.getState();
    const payrolls = calculatePayroll(
      2028,
      3,
      state.employees,
      state.contracts,
      state.attendance,
      state.settings
    );

    // Weekdays in Feb 26 - Mar 25 2028:
    // Feb: 28 (Mon), 29 (Tue) -> 2 days (Feb 26, 27 is Sat, Sun)
    // Mar: 1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24 -> 18 days (Mar 25 is Sat)
    // Total weekdays = 20 days.
    // All are within contract (starts Feb 25).
    expect(payrolls[0].totalDays).toBe(20.0);
    expect(payrolls[0].workedHolidays).toEqual(['2028-03-08']);

    // Generate PDF receipt
    generateIndividualReceipt(payrolls[0].employee, payrolls[0].activeContracts[payrolls[0].activeContracts.length - 1], 2028, 3, state.attendance[cook.id], state.settings);

    // Verify spelling/text
    const certCall = mockTextCalls.find(c => c.text && c.text.includes('Twenty'));
    expect(certCall).toBeDefined();
    expect(certCall.text).toContain('Twenty');
  });
});
