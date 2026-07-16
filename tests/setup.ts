import { mock } from 'bun:test';

// Set up mock arrays/spies so we can inspect them in our tests
export const mockTextCalls: any[] = [];
export const mockAutoTableCalls: any[] = [];
export const mockSaveCalls: any[] = [];

// Mock localStorage globally
const storeMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storeMap.get(key) || null,
  setItem: (key: string, value: string) => {
    storeMap.set(key, String(value));
  },
  removeItem: (key: string) => {
    storeMap.delete(key);
  },
  clear: () => {
    storeMap.clear();
  },
  key: (index: number) => Array.from(storeMap.keys())[index] || null,
  get length() {
    return storeMap.size;
  },
};

globalThis.localStorage = localStorageMock;
(globalThis as any).window = {
  localStorage: localStorageMock,
};

const { useStore } = require('../src/store');

// Mock jsPDF using Bun's native mock.module
mock.module('jspdf', () => {
  return {
    default: class MockjsPDF {
      internal = {
        pageSize: {
          width: 297,
          height: 210,
          getWidth: () => 297,
          getHeight: () => 210,
        },
      };
      lastAutoTable = { finalY: 120 };
      setFontSize() {
        return this;
      }
      text(text: string, x: number, y: number, options?: any) {
        mockTextCalls.push({ text, x, y, options });
        return this;
      }
      save(filename: string) {
        mockSaveCalls.push(filename);
        return this;
      }
    },
  };
});

// Mock jspdf-autotable
mock.module('jspdf-autotable', () => {
  return {
    default: (doc: any, options: any) => {
      mockAutoTableCalls.push(options);
    },
  };
});

// Reset function to clear store state and mocks between tests
export function resetTestEnvironment() {
  // Clear local storage map
  storeMap.clear();
  
  // Reset Zustand store data fields (leaving action functions intact)
  useStore.setState({
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
  }, false);

  // Clear PDF mock spy calls
  mockTextCalls.length = 0;
  mockAutoTableCalls.length = 0;
  mockSaveCalls.length = 0;
}
