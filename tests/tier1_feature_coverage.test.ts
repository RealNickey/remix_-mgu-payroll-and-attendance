import { describe, test, expect, beforeEach } from 'bun:test';
import { resetTestEnvironment, mockTextCalls, mockAutoTableCalls } from './setup';
import { useStore } from '../src/store';
import { calculatePayroll } from '../src/lib/payroll';
import { getBillingCycleDates } from '../src/lib/utils';
import { generateIndividualReceipt } from '../src/lib/pdf';

describe('Tier 1: Feature Coverage', () => {
  beforeEach(() => {
    resetTestEnvironment();
  });

  // --- Feature 1: Employee Profiles ---
  describe('Employee Profiles', () => {
    test('T1.1: Add employee profile successfully', () => {
      const { addEmployee } = useStore.getState();
      addEmployee({ name: 'Aswin Kumar', category: 'Drivers', bankAccount: '123456789' });

      const state = useStore.getState();
      expect(state.employees.length).toBe(1);
      expect(state.employees[0].name).toBe('Aswin Kumar');
      expect(state.employees[0].category).toBe('Drivers');
      expect(state.employees[0].bankAccount).toBe('123456789');
      expect(state.employees[0].id).toBeDefined();
      expect(typeof state.employees[0].id).toBe('string');
    });

    test('T1.2: Update employee name', () => {
      const { addEmployee, updateEmployee } = useStore.getState();
      addEmployee({ name: 'Aswin Kumar', category: 'Drivers', bankAccount: '123456789' });
      
      const empId = useStore.getState().employees[0].id;
      updateEmployee(empId, { name: 'Aswin K.' });

      const state = useStore.getState();
      expect(state.employees[0].name).toBe('Aswin K.');
      expect(state.employees[0].category).toBe('Drivers'); // unchanged
    });

    test('T1.3: Update employee category', () => {
      const { addEmployee, updateEmployee } = useStore.getState();
      addEmployee({ name: 'Aswin Kumar', category: 'Drivers', bankAccount: '123456789' });
      
      const empId = useStore.getState().employees[0].id;
      updateEmployee(empId, { category: 'Cooks' });

      const state = useStore.getState();
      expect(state.employees[0].category).toBe('Cooks');
    });

    test('T1.4: Update employee bank account', () => {
      const { addEmployee, updateEmployee } = useStore.getState();
      addEmployee({ name: 'Aswin Kumar', category: 'Drivers', bankAccount: '123456789' });
      
      const empId = useStore.getState().employees[0].id;
      updateEmployee(empId, { bankAccount: '987654321' });

      const state = useStore.getState();
      expect(state.employees[0].bankAccount).toBe('987654321');
    });

    test('T1.5: Delete employee profile', () => {
      const { addEmployee, deleteEmployee } = useStore.getState();
      addEmployee({ name: 'Aswin Kumar', category: 'Drivers', bankAccount: '123456789' });
      
      const empId = useStore.getState().employees[0].id;
      deleteEmployee(empId);

      const state = useStore.getState();
      expect(state.employees.length).toBe(0);
    });
  });

  // --- Feature 2: Contract Management ---
  describe('Contract Management', () => {
    test('T1.6: Add 90-day contract', () => {
      const { addContract } = useStore.getState();
      addContract({
        employeeId: 'emp-1',
        startDate: '2026-01-01',
        orderNo: 'ORD-1',
        orderDate: '2025-12-20'
      });

      const state = useStore.getState();
      expect(state.contracts.length).toBe(1);
      expect(state.contracts[0].employeeId).toBe('emp-1');
      expect(state.contracts[0].orderNo).toBe('ORD-1');
      expect(state.contracts[0].orderDate).toBe('2025-12-20');
      expect(state.contracts[0].id).toBeDefined();
    });

    test('T1.7: Auto 90-day end date calculation', () => {
      const { addContract } = useStore.getState();
      addContract({
        employeeId: 'emp-1',
        startDate: '2026-01-01',
        orderNo: 'ORD-1',
        orderDate: '2025-12-20'
      });

      const state = useStore.getState();
      // 2026-01-01 + 89 days = 2026-03-31 (exactly 90 days total inclusive)
      expect(state.contracts[0].endDate).toBe('2026-03-31');
    });

    test('T1.8: Update contract start date', () => {
      const { addContract, updateContract } = useStore.getState();
      addContract({
        employeeId: 'emp-1',
        startDate: '2026-01-01',
        orderNo: 'ORD-1',
        orderDate: '2025-12-20'
      });

      const contractId = useStore.getState().contracts[0].id;
      updateContract(contractId, { startDate: '2026-02-01' });

      const state = useStore.getState();
      expect(state.contracts[0].startDate).toBe('2026-02-01');
      // 2026-02-01 + 89 days = 2026-05-01 (May 1st handles Feb 28 days: 28 days of Feb + 31 of Mar + 30 of Apr + 1 of May = 90 days)
      expect(state.contracts[0].endDate).toBe('2026-05-01');
    });

    test('T1.9: Update contract government order details', () => {
      const { addContract, updateContract } = useStore.getState();
      addContract({
        employeeId: 'emp-1',
        startDate: '2026-01-01',
        orderNo: 'ORD-1',
        orderDate: '2025-12-20'
      });

      const contractId = useStore.getState().contracts[0].id;
      updateContract(contractId, { orderNo: 'ORD-1-REV' });

      const state = useStore.getState();
      expect(state.contracts[0].orderNo).toBe('ORD-1-REV');
      expect(state.contracts[0].startDate).toBe('2026-01-01'); // unchanged
    });

    test('T1.10: Void (delete) contract', () => {
      const { addContract, deleteContract } = useStore.getState();
      addContract({
        employeeId: 'emp-1',
        startDate: '2026-01-01',
        orderNo: 'ORD-1',
        orderDate: '2025-12-20'
      });

      const contractId = useStore.getState().contracts[0].id;
      deleteContract(contractId);

      const state = useStore.getState();
      expect(state.contracts.length).toBe(0);
    });
  });

  // --- Feature 3: Attendance Entry ---
  describe('Attendance Entry', () => {
    test('T1.11: Set attendance for a single day', () => {
      const { setAttendance } = useStore.getState();
      const attendanceData = { fn: true, an: false, ot: false, isHoliday: false };
      setAttendance('emp-1', '2026-01-01', attendanceData);

      const state = useStore.getState();
      expect(state.attendance['emp-1']['2026-01-01']).toEqual(attendanceData);
    });

    test('T1.12: Toggle attendance flag', () => {
      const { setAttendance } = useStore.getState();
      // Simulate UI toggle handler
      const toggleFn = (empId: string, date: string) => {
        const current = useStore.getState().attendance[empId]?.[date] || { fn: false, an: false, ot: false, isHoliday: false };
        setAttendance(empId, date, { ...current, fn: !current.fn });
      };

      toggleFn('emp-1', '2026-01-01');
      expect(useStore.getState().attendance['emp-1']['2026-01-01'].fn).toBe(true);

      toggleFn('emp-1', '2026-01-01');
      expect(useStore.getState().attendance['emp-1']['2026-01-01'].fn).toBe(false);
    });

    test('T1.13: Mark all forenoons as present', () => {
      const { setAttendance } = useStore.getState();
      const cycle = getBillingCycleDates(2026, 1);
      
      // Simulate markAll fn
      cycle.dates.forEach(date => {
        const current = useStore.getState().attendance['emp-1']?.[date] || { fn: false, an: false, ot: false, isHoliday: false };
        setAttendance('emp-1', date, { ...current, fn: true });
      });

      const state = useStore.getState();
      cycle.dates.forEach(date => {
        expect(state.attendance['emp-1'][date].fn).toBe(true);
      });
    });

    test('T1.14: Mark all afternoons as present', () => {
      const { setAttendance } = useStore.getState();
      const cycle = getBillingCycleDates(2026, 1);
      
      // Simulate markAll an
      cycle.dates.forEach(date => {
        const current = useStore.getState().attendance['emp-1']?.[date] || { fn: false, an: false, ot: false, isHoliday: false };
        setAttendance('emp-1', date, { ...current, an: true });
      });

      const state = useStore.getState();
      cycle.dates.forEach(date => {
        expect(state.attendance['emp-1'][date].an).toBe(true);
      });
    });

    test('T1.15: Clear all attendance for cycle', () => {
      const { setAttendance } = useStore.getState();
      const cycle = getBillingCycleDates(2026, 1);
      
      // Seed some attendance
      setAttendance('emp-1', '2026-01-01', { fn: true, an: true, ot: true, isHoliday: true });

      // Clear all
      cycle.dates.forEach(date => {
        setAttendance('emp-1', date, { fn: false, an: false, ot: false, isHoliday: false });
      });

      const state = useStore.getState();
      cycle.dates.forEach(date => {
        expect(state.attendance['emp-1'][date]).toEqual({ fn: false, an: false, ot: false, isHoliday: false });
      });
    });
  });

  // --- Feature 4: Payroll Calculations ---
  describe('Payroll Calculations', () => {
    test('T1.16: Base wage for 1 full worked day', () => {
      const employees = [{ id: 'emp-1', name: 'Aswin', category: 'Drivers' as const, bankAccount: '123' }];
      const contracts = [{ id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' }];
      const settings = { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRates: { Gardeners: 0, Drivers: 100, Cooks: 100, Helpers: 100 }, monthlyCeiling: { Gardeners: 15000, Drivers: 20000, Cooks: 18000, Helpers: 15000 } };
      
      // Attendance on 2026-01-01 (which is within cycle 2026-01: Dec 26 - Jan 25)
      const attendance = {
        'emp-1': {
          '2026-01-01': { fn: true, an: true, ot: false, isHoliday: false }
        }
      };

      const payrolls = calculatePayroll(2026, 1, employees, contracts, attendance, settings);
      expect(payrolls.length).toBe(1);
      expect(payrolls[0].totalDays).toBe(1.0);
      expect(payrolls[0].basePay).toBe(600);
      expect(payrolls[0].totalPay).toBe(600);
    });

    test('T1.17: Base wage for two half days', () => {
      const employees = [{ id: 'emp-1', name: 'Aswin', category: 'Helpers' as const, bankAccount: '123' }];
      const contracts = [{ id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' }];
      const settings = { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRates: { Gardeners: 0, Drivers: 100, Cooks: 100, Helpers: 100 }, monthlyCeiling: { Gardeners: 15000, Drivers: 20000, Cooks: 18000, Helpers: 15000 } };
      
      // Attendance: fn only on day 1, an only on day 2
      const attendance = {
        'emp-1': {
          '2026-01-01': { fn: true, an: false, ot: false, isHoliday: false },
          '2026-01-02': { fn: false, an: true, ot: false, isHoliday: false }
        }
      };

      const payrolls = calculatePayroll(2026, 1, employees, contracts, attendance, settings);
      expect(payrolls.length).toBe(1);
      expect(payrolls[0].totalDays).toBe(1.0); // 0.5 + 0.5
      expect(payrolls[0].basePay).toBe(450);
    });

    test('T1.18: Overtime pay calculation', () => {
      const employees = [{ id: 'emp-1', name: 'Aswin', category: 'Cooks' as const, bankAccount: '123' }];
      const contracts = [{ id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' }];
      const settings = { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRates: { Gardeners: 0, Drivers: 100, Cooks: 100, Helpers: 100 }, monthlyCeiling: { Gardeners: 15000, Drivers: 20000, Cooks: 18000, Helpers: 15000 } };
      
      const attendance = {
        'emp-1': {
          '2026-01-01': { fn: true, an: true, ot: true, isHoliday: false }
        }
      };

      const payrolls = calculatePayroll(2026, 1, employees, contracts, attendance, settings);
      expect(payrolls[0].otDays).toBe(1);
      expect(payrolls[0].otPay).toBe(100);
      expect(payrolls[0].totalPay).toBe(650); // 550 + 100
    });

    test('T1.19: Worked holiday details extraction', () => {
      const employees = [{ id: 'emp-1', name: 'Aswin', category: 'Helpers' as const, bankAccount: '123' }];
      const contracts = [{ id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' }];
      const settings = { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRates: { Gardeners: 0, Drivers: 100, Cooks: 100, Helpers: 100 }, monthlyCeiling: { Gardeners: 15000, Drivers: 20000, Cooks: 18000, Helpers: 15000 } };
      
      const attendance = {
        'emp-1': {
          '2026-01-01': { fn: true, an: false, ot: false, isHoliday: true }
        }
      };

      const payrolls = calculatePayroll(2026, 1, employees, contracts, attendance, settings);
      expect(payrolls[0].workedHolidays).toEqual(['2026-01-01']);
    });

    test('T1.20: Filter active contracts in cycle', () => {
      const employees = [{ id: 'emp-1', name: 'Aswin', category: 'Drivers' as const, bankAccount: '123' }];
      // Contract ended on 2025-12-20 (before cycle 2026-01 starts on 2025-12-26)
      const contracts = [{ id: 'c-1', employeeId: 'emp-1', startDate: '2025-09-22', endDate: '2025-12-20', orderNo: '1', orderDate: '2025-09-20' }];
      const settings = { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRates: { Gardeners: 0, Drivers: 100, Cooks: 100, Helpers: 100 }, monthlyCeiling: { Gardeners: 15000, Drivers: 20000, Cooks: 18000, Helpers: 15000 } };
      
      const attendance = {
        'emp-1': {
          '2026-01-01': { fn: true, an: true, ot: false, isHoliday: false }
        }
      };

      const payrolls = calculatePayroll(2026, 1, employees, contracts, attendance, settings);
      expect(payrolls.length).toBe(0); // Excluded due to no active contract
    });
  });

  // --- Feature 5: Settings Management ---
  describe('Settings Management', () => {
    test('T1.21: Retrieve default settings', () => {
      const { settings } = useStore.getState();
      expect(settings.baseWages.Gardeners).toBe(500);
      expect(settings.baseWages.Drivers).toBe(600);
      expect(settings.baseWages.Cooks).toBe(550);
      expect(settings.baseWages.Helpers).toBe(450);
      expect(settings.otRates.Drivers).toBe(100);
    });

    test('T1.22: Update all category base rates', () => {
      const { updateSettings } = useStore.getState();
      updateSettings({
        baseWages: {
          Gardeners: 600,
          Drivers: 700,
          Cooks: 650,
          Helpers: 550
        }
      });

      const { settings } = useStore.getState();
      expect(settings.baseWages.Gardeners).toBe(600);
      expect(settings.baseWages.Drivers).toBe(700);
      expect(settings.baseWages.Cooks).toBe(650);
      expect(settings.baseWages.Helpers).toBe(550);
    });

    test('T1.23: Update overtime rate', () => {
      const { updateSettings } = useStore.getState();
      updateSettings({ otRates: { Gardeners: 0, Drivers: 150, Cooks: 150, Helpers: 150 } });

      const { settings } = useStore.getState();
      expect(settings.otRates.Drivers).toBe(150);
      expect(settings.baseWages.Drivers).toBe(600); // untouched
    });

    test('T1.24: Apply updated wages in calculation', () => {
      const { updateSettings } = useStore.getState();
      updateSettings({
        baseWages: {
          Gardeners: 500,
          Drivers: 600,
          Cooks: 700, // changed from 550
          Helpers: 450
        }
      });

      const employees = [{ id: 'emp-1', name: 'Aswin', category: 'Cooks' as const, bankAccount: '123' }];
      const contracts = [{ id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' }];
      const attendance = {
        'emp-1': {
          '2026-01-01': { fn: true, an: true, ot: false, isHoliday: false }
        }
      };

      const state = useStore.getState();
      const payrolls = calculatePayroll(2026, 1, employees, contracts, attendance, state.settings);
      expect(payrolls[0].basePay).toBe(700); // uses updated rate
    });

    test('T1.25: Apply updated OT rate in calculation', () => {
      const { updateSettings } = useStore.getState();
      updateSettings({ otRates: { Gardeners: 0, Drivers: 125, Cooks: 125, Helpers: 125 } });

      const employees = [{ id: 'emp-1', name: 'Aswin', category: 'Drivers' as const, bankAccount: '123' }];
      const contracts = [{ id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' }];
      const attendance = {
        'emp-1': {
          '2026-01-01': { fn: true, an: true, ot: true, isHoliday: false }
        }
      };

      const state = useStore.getState();
      const payrolls = calculatePayroll(2026, 1, employees, contracts, attendance, state.settings);
      expect(payrolls[0].otPay).toBe(125); // uses updated OT rate
    });
  });

  // --- Feature 6: Reports & PDF Logic ---
  describe('Reports & PDF Logic', () => {
    test('T1.26: Generate billing cycle dates range', () => {
      const cycle = getBillingCycleDates(2026, 1);
      expect(cycle.startDateStr).toBe('2025-12-26');
      expect(cycle.endDateStr).toBe('2026-01-25');
      expect(cycle.dates.length).toBe(31);
      expect(cycle.dates[0]).toBe('2025-12-26');
      expect(cycle.dates[30]).toBe('2026-01-25');
    });

    test('T1.27: Chronological sorting in reports', () => {
      const employee = { id: 'emp-1', name: 'Aswin', category: 'Drivers' as const, bankAccount: '123' };
      const contract = { id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' };

      generateIndividualReceipt(employee, contract, 2026, 1, {}, { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRates: { Gardeners: 0, Drivers: 100, Cooks: 100, Helpers: 100 }, monthlyCeiling: { Gardeners: 15000, Drivers: 20000, Cooks: 18000, Helpers: 15000 } });
      // In generateIndividualReceipt, columns are created chronologically from the billing cycle dates.
      // Column index 1 corresponds to Dec 26 (first day of billing cycle), and 31 corresponds to Jan 25 (last day).
      // The autoTable head styles/mock call records column structure. Let's verify autoTable was called.
      expect(mockAutoTableCalls.length).toBeGreaterThan(0);
      const options = mockAutoTableCalls[0];
      expect(options.head[0][0]).toBe('Days');
      expect(options.head[0][1]).toBe('26');
      expect(options.head[0][31]).toBe('25');
    });

    test('T1.28: Number-to-words for integers', () => {
      const employee = { id: 'emp-1', name: 'Aswin', category: 'Drivers' as const, bankAccount: '123' };
      const contract = { id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' };

      // Pass an attendance record that yields 15 days of attendance:
      const attendanceRecord: Record<string, any> = {};
      for (let day = 1; day <= 15; day++) {
        const dateStr = `2026-01-${String(day).padStart(2, '0')}`;
        attendanceRecord[dateStr] = { fn: true, an: true, ot: false, isHoliday: false };
      }

      generateIndividualReceipt(employee, contract, 2026, 1, attendanceRecord, { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRates: { Gardeners: 0, Drivers: 100, Cooks: 100, Helpers: 100 }, monthlyCeiling: { Gardeners: 15000, Drivers: 20000, Cooks: 18000, Helpers: 15000 } });
      // We look for a call containing 'Fifteen'
      const certCall = mockTextCalls.find(c => c.text && c.text.includes('Fifteen'));
      expect(certCall).toBeDefined();
      expect(certCall.text).toContain('Fifteen');
    });

    test('T1.29: Number-to-words for decimals', () => {
      const employee = { id: 'emp-1', name: 'Aswin', category: 'Drivers' as const, bankAccount: '123' };
      const contract = { id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' };

      // Pass an attendance record that yields 15.5 days of attendance:
      const attendanceRecord: Record<string, any> = {};
      for (let day = 1; day <= 15; day++) {
        const dateStr = `2026-01-${String(day).padStart(2, '0')}`;
        attendanceRecord[dateStr] = { fn: true, an: true, ot: false, isHoliday: false };
      }
      attendanceRecord['2026-01-16'] = { fn: true, an: false, ot: false, isHoliday: false };

      generateIndividualReceipt(employee, contract, 2026, 1, attendanceRecord, { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRates: { Gardeners: 0, Drivers: 100, Cooks: 100, Helpers: 100 }, monthlyCeiling: { Gardeners: 15000, Drivers: 20000, Cooks: 18000, Helpers: 15000 } });
      const certCall = mockTextCalls.find(c => c.text && c.text.includes('Fifteen and a Half'));
      expect(certCall).toBeDefined();
      expect(certCall.text).toContain('Fifteen and a Half');
    });

    test('T1.30: 1-31 column mapping for billing cycle', () => {
      // In generateIndividualReceipt, verify column mapping outputs
      const employee = { id: 'emp-1', name: 'Aswin', category: 'Drivers' as const, bankAccount: '123' };
      const contract = { id: 'c-1', employeeId: 'emp-1', startDate: '2025-12-26', endDate: '2026-03-25', orderNo: '1', orderDate: '2025-12-25' };

      // Set attendance on Dec 26 (previous month day 26) and Jan 1 (current month day 1)
      const attendanceRecord = {
        '2025-12-26': { fn: true, an: false, ot: false, isHoliday: false },
        '2026-01-01': { fn: false, an: true, ot: false, isHoliday: false }
      };

      generateIndividualReceipt(employee, contract, 2026, 1, attendanceRecord, { baseWages: { Gardeners: 500, Drivers: 600, Cooks: 550, Helpers: 450 }, otRates: { Gardeners: 0, Drivers: 100, Cooks: 100, Helpers: 100 }, monthlyCeiling: { Gardeners: 15000, Drivers: 20000, Cooks: 18000, Helpers: 15000 } });
      
      const options = mockAutoTableCalls[mockAutoTableCalls.length - 1];
      const fnRow = options.body[0];
      const anRow = options.body[1];

      // Columns index mapping:
      // index 0: 'FN' or 'AN'
      // index 1: Dec 26 (first date chronologically). fn = true, an = false -> fnRow[1] = 'X', anRow[1] = ''
      // index 7: Jan 1 (7th date chronologically). fn = false, an = true -> fnRow[7] = '', anRow[7] = 'X'
      expect(fnRow[1]).toBe('X');
      expect(anRow[1]).toBe('');
      expect(fnRow[7]).toBe('');
      expect(anRow[7]).toBe('X');
    });
  });
});
