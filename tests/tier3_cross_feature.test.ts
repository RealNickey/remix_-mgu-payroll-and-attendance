import { describe, test, expect, beforeEach } from 'bun:test';
import { resetTestEnvironment, mockTextCalls } from './setup';
import { useStore } from '../src/store';
import { calculatePayroll } from '../src/lib/payroll';
import { generateIndividualReceipt } from '../src/lib/pdf';

describe('Tier 3: Cross-Feature Combinations', () => {
  beforeEach(() => {
    resetTestEnvironment();
  });

  test('T3.1: Profile Deletion & Contract Cascade (Orphaned contracts ignored)', () => {
    const { addEmployee, addContract, deleteEmployee } = useStore.getState();
    addEmployee({ name: 'Aswin', category: 'Drivers', bankAccount: '123' });
    const empId = useStore.getState().employees[0].id;

    addContract({
      employeeId: empId,
      startDate: '2025-12-26',
      orderNo: 'ORD-1',
      orderDate: '2025-12-25'
    });

    const stateBefore = useStore.getState();
    expect(stateBefore.employees.length).toBe(1);
    expect(stateBefore.contracts.length).toBe(1);

    // Delete employee
    deleteEmployee(empId);

    const stateAfter = useStore.getState();
    expect(stateAfter.employees.length).toBe(0);
    // Contract is orphaned (not cascade deleted, showing store design gap)
    expect(stateAfter.contracts.length).toBe(1);

    // Run payroll calculation
    const attendance = {
      [empId]: {
        '2026-01-01': { fn: true, an: true, ot: false, isHoliday: false }
      }
    };
    const payrolls = calculatePayroll(
      2026, 
      1, 
      stateAfter.employees, 
      stateAfter.contracts, 
      attendance, 
      stateAfter.settings
    );
    // Payroll engine excludes this employee since they are no longer in the employees list
    expect(payrolls.length).toBe(0);
  });

  test('T3.2: Settings Adjustments & Payroll Runs (Recalculates pay immediately)', () => {
    const employees = [{ id: 'emp-1', name: 'Aswin', category: 'Cooks' as const, bankAccount: '123' }];
    const contracts = [{ id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' }];
    const attendance = {
      'emp-1': {
        '2026-01-01': { fn: true, an: true, ot: false, isHoliday: false },
        '2026-01-02': { fn: true, an: true, ot: false, isHoliday: false }
      }
    };

    const initialSettings = {
      baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 },
      otRate: 100
    };

    const payrolls1 = calculatePayroll(2026, 1, employees, contracts, attendance, initialSettings);
    expect(payrolls1[0].basePay).toBe(1100); // 2 days * 550

    // Adjust settings
    const updatedSettings = {
      baseWages: { Gardeners: 500, Drivers: 600, Cooks: 700, Helpers: 450 },
      otRate: 100
    };

    const payrolls2 = calculatePayroll(2026, 1, employees, contracts, attendance, updatedSettings);
    expect(payrolls2[0].basePay).toBe(1400); // 2 days * 700
  });

  test('T3.3: Contract Period Shift & Attendance (Trims payable attendance)', () => {
    const { addEmployee, addContract, setAttendance, updateContract } = useStore.getState();
    addEmployee({ name: 'Aswin', category: 'Drivers', bankAccount: '123' });
    const empId = useStore.getState().employees[0].id;

    addContract({
      employeeId: empId,
      startDate: '2026-01-01',
      orderNo: 'ORD-1',
      orderDate: '2025-12-20'
    });
    const contractId = useStore.getState().contracts[0].id;

    // Set attendance on Jan 5 (covered by contract 2026-01-01 to 2026-03-31)
    setAttendance(empId, '2026-01-05', { fn: true, an: true, ot: false, isHoliday: false });
    // Set attendance on Jan 12 (covered by contract)
    setAttendance(empId, '2026-01-12', { fn: true, an: true, ot: false, isHoliday: false });

    const stateBefore = useStore.getState();
    const payrollsBefore = calculatePayroll(
      2026,
      1,
      stateBefore.employees,
      stateBefore.contracts,
      stateBefore.attendance,
      stateBefore.settings
    );
    expect(payrollsBefore[0].totalDays).toBe(2.0);

    // Shift contract startDate to Jan 10 (auto-recalculates endDate to Apr 9)
    updateContract(contractId, { startDate: '2026-01-10' });

    const stateAfter = useStore.getState();
    const payrollsAfter = calculatePayroll(
      2026,
      1,
      stateAfter.employees,
      stateAfter.contracts,
      stateAfter.attendance,
      stateAfter.settings
    );
    // Attendance on Jan 5 falls out of the new contract window (Jan 10 to Apr 9) and is trimmed
    expect(payrollsAfter[0].totalDays).toBe(1.0); // Only Jan 12 is counted
  });

  test('T3.4: Category Transition & OT Eligibility (Updates OT eligibility retrospectively)', () => {
    const { addEmployee, addContract, setAttendance, updateEmployee } = useStore.getState();
    addEmployee({ name: 'Aswin', category: 'Gardeners', bankAccount: '123' });
    const empId = useStore.getState().employees[0].id;

    addContract({
      employeeId: empId,
      startDate: '2025-12-26',
      orderNo: 'ORD-1',
      orderDate: '2025-12-25'
    });

    // Mark attendance with OT = true
    setAttendance(empId, '2026-01-01', { fn: true, an: true, ot: true, isHoliday: false });

    const state1 = useStore.getState();
    const payrolls1 = calculatePayroll(2026, 1, state1.employees, state1.contracts, state1.attendance, state1.settings);
    // Gardener category: OT pay is 0
    expect(payrolls1[0].otDays).toBe(0);
    expect(payrolls1[0].otPay).toBe(0);

    // Change category to Driver (who is OT eligible)
    updateEmployee(empId, { category: 'Drivers' });

    const state2 = useStore.getState();
    const payrolls2 = calculatePayroll(2026, 1, state2.employees, state2.contracts, state2.attendance, state2.settings);
    // Now eligible, retrospectively gets OT pay (asserting category drift vulnerability)
    expect(payrolls2[0].otDays).toBe(1);
    expect(payrolls2[0].otPay).toBe(100);
  });

  test('T3.5: Overlapping Contracts & PDF Receipt (Displays latest contract details)', () => {
    const employee = { id: 'emp-1', name: 'Aswin', category: 'Drivers' as const, bankAccount: '123' };
    const contracts = [
      { id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-01-10', orderNo: 'ORD-1', orderDate: '2025-12-25' },
      { id: 'c-2', employeeId: 'emp-1', startDate: '2026-01-06', endDate: '2026-04-05', orderNo: 'ORD-2-LATEST', orderDate: '2026-01-05' }
    ];

    generateIndividualReceipt(employee, contracts[1], 2026, 1, {}, { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRate: 100 });

    // Verify PDF displays orderNo of latest contract (c-2)
    const orderCall = mockTextCalls.find(c => c.text && c.text.includes('ORD-2-LATEST'));
    expect(orderCall).toBeDefined();
  });

  test('T3.6: Contract Gap & Holiday Attendance (Holidays during gaps not paid)', () => {
    const employees = [{ id: 'emp-1', name: 'Aswin', category: 'Drivers' as const, bankAccount: '123' }];
    const contracts = [
      { id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-01', endDate: '2026-01-05', orderNo: '1', orderDate: '2025-11-30' },
      { id: 'c-2', employeeId: 'emp-1', startDate: '2026-01-15', endDate: '2026-04-14', orderNo: '2', orderDate: '2026-01-14' }
    ];
    const settings = { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRate: 100 };
    
    // Holiday worked on Jan 10 (falls in gap Jan 6 to Jan 14)
    const attendance = {
      'emp-1': {
        '2026-01-10': { fn: true, an: true, ot: false, isHoliday: true }
      }
    };

    const payrolls = calculatePayroll(2026, 1, employees, contracts, attendance, settings);
    // Excluded because no days are worked within active contract intervals
    expect(payrolls.length).toBe(0);
  });
});
