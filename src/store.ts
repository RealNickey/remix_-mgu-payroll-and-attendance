import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

export type EmployeeCategory = 'Gardeners' | 'Drivers' | 'Cooks' | 'Helpers';

export interface Employee {
  id: string;
  name: string;
  category: EmployeeCategory;
  bankAccount: string;
}

export interface Contract {
  id: string;
  employeeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  orderNo: string;
  orderDate: string; // YYYY-MM-DD
}

// Key is YYYY-MM-DD
export interface DailyAttendance {
  fn: boolean;
  an: boolean;
  ot: boolean;
  isHoliday: boolean; // Did they work on a holiday
}

// employeeId -> YYYY-MM-DD -> DailyAttendance
export type AttendanceRecord = Record<string, Record<string, DailyAttendance>>;

export interface Settings {
  baseWages: Record<EmployeeCategory, number>;
  otRate: number;
}

interface AppState {
  employees: Employee[];
  contracts: Contract[];
  attendance: AttendanceRecord;
  settings: Settings;
  activeTab: string;
  
  setActiveTab: (tab: string) => void;
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, emp: Partial<Omit<Employee, 'id'>>) => void;
  deleteEmployee: (id: string) => void;

  addContract: (contract: Omit<Contract, 'id' | 'endDate'>) => void;
  updateContract: (id: string, contract: Partial<Omit<Contract, 'id'>>) => void;
  deleteContract: (id: string) => void;

  setAttendance: (employeeId: string, date: string, data: DailyAttendance) => void;
  
  updateSettings: (settings: Partial<Settings>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      employees: [],
      contracts: [],
      attendance: {},
      settings: {
        baseWages: {
          Gardeners: 500,
          Drivers: 600,
          Cooks: 550,
          Helpers: 450,
        },
        otRate: 100,
      },
      activeTab: 'attendance',
      setActiveTab: (tab) => set({ activeTab: tab }),

      addEmployee: (emp) => set((state) => ({
        employees: [...state.employees, { ...emp, id: crypto.randomUUID() }]
      })),
      
      updateEmployee: (id, emp) => set((state) => ({
        employees: state.employees.map(e => e.id === id ? { ...e, ...emp } : e)
      })),

      deleteEmployee: (id) => set((state) => ({
        employees: state.employees.filter(e => e.id !== id)
      })),

      addContract: (contract) => set((state) => {
        // Contract is 90 days. Start date + 89 days.
        const start = parseISO(contract.startDate);
        const endDate = addDays(start, 89).toISOString().split('T')[0];
        
        return {
          contracts: [...state.contracts, { ...contract, id: crypto.randomUUID(), endDate }]
        };
      }),

      updateContract: (id, contract) => set((state) => {
        return {
          contracts: state.contracts.map(c => {
            if (c.id === id) {
              const updated = { ...c, ...contract };
              if (contract.startDate) {
                updated.endDate = addDays(parseISO(updated.startDate), 89).toISOString().split('T')[0];
              }
              return updated;
            }
            return c;
          })
        };
      }),

      deleteContract: (id) => set((state) => ({
        contracts: state.contracts.filter(c => c.id !== id)
      })),

      setAttendance: (employeeId, date, data) => set((state) => {
        const empAttendance = state.attendance[employeeId] || {};
        return {
          attendance: {
            ...state.attendance,
            [employeeId]: {
              ...empAttendance,
              [date]: data
            }
          }
        };
      }),

      updateSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings }
      })),
    }),
    {
      name: 'payroll-storage',
    }
  )
);
