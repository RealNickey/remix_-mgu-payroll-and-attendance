# Project: MGU Payroll & Attendance shadcn/ui Porting

## Architecture
- React SPA built with Vite and Tailwind CSS.
- Component library: shadcn/ui (base-nova style, light mode only).
- State management: Zustand (persisted state).
- PDF Generation: jsPDF & jsPDF-AutoTable.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Initial Exploration | Analyze codebase, check shadcn components, verify build | None | DONE |
| M2 | E2E Testing Track | Design and implement complete 4-tier E2E/Integration test suite, publish TEST_READY.md | M1 | PLANNED |
| M3 | PDF Generator Refactor | Refactor `src/lib/pdf.ts` structure and fix calendar ordering, currency formatting | M1 | PLANNED |
| M4 | UI Component Porting | Replace raw HTML inputs/buttons/badges with shadcn/ui components | M2 | PLANNED |
| M5 | Sidebar & Sonner Integration | Replace vertical Tabs layout with shadcn Sidebar, integrate Sonner toast notifications | M4 | PLANNED |
| M6 | E2E Validation & Hardening | Pass 100% E2E tests, generate adversarial tests (Tier 5) | M2, M3, M4, M5 | PLANNED |

## Interface Contracts
### PDF Generation Interface (`src/lib/pdf/index.ts`)
- `generateDisbursementReport(year: number, month: number, employees: Employee[], contracts: Contract[], attendance: Record<string, AttendanceRecord>, settings: Settings): void`
- `generateAttendanceReport(year: number, month: number, employees: Employee[], contracts: Contract[], attendance: Record<string, AttendanceRecord>, settings: Settings): void`
- `generateIndividualReceipt(employee: Employee, contract: Contract, year: number, month: number, attendanceRecord: Record<string, DailyAttendance>, settings: Settings): void`

### Zustand State Store Interface (`src/store.ts`)
- `employees`: Array of `Employee`
- `contracts`: Array of `Contract`
- `attendance`: Daily attendance mapping
- `settings`: Category base wages and OT rates
- `activeTab`: Sidebar selection
- Actions: `addEmployee`, `deleteEmployee`, `addContract`, `deleteContract`, `setAttendance`, `updateSettings`, `setActiveTab`

## Code Layout
- Components: `src/components/` (AttendanceTab, ContractsTab, EmployeesTab, ReportsTab, SettingsTab)
- UI Primitives: `components/ui/` (button, calendar, card, dialog, input, label, popover, select, table, tabs, badge, progress, toggle, sidebar, sonner)
- Library: `src/lib/` (payroll.ts, utils.ts, pdf/)
- State Store: `src/store.ts`
