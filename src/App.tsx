import { useState } from 'react';
import { MguDbProvider } from '@/lib/db';
import { useTheme } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { EmployeeProfiles } from '@/components/EmployeeProfiles';
import { ContractManagement } from '@/components/ContractManagement';
import { AttendanceEntry } from '@/components/AttendanceEntry';
import { DisbursementRecords } from '@/components/DisbursementRecords';
import { SettingsWorkspace } from '@/components/SettingsWorkspace';
import {
  RiCalendarCheckLine,
  RiUserLine,
  RiFileTextLine,
  RiHandCoinLine,
  RiSettings4Line,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiSunLine,
  RiMoonLine,
  RiShieldCheckLine,
  RiTerminalBoxLine
} from '@remixicon/react';

type WorkspaceType = 'attendance' | 'employees' | 'contracts' | 'disbursement' | 'settings';

export function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>('attendance');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

  // Workspace labels and icons
  const workspaces = [
    { id: 'attendance', label: 'Attendance Entry', icon: RiCalendarCheckLine },
    { id: 'employees', label: 'Employee Profiles', icon: RiUserLine },
    { id: 'contracts', label: 'Contract Management', icon: RiFileTextLine },
    { id: 'disbursement', label: 'Disbursement Records', icon: RiHandCoinLine },
    { id: 'settings', label: 'Settings', icon: RiSettings4Line }
  ] as const;

  const renderActiveWorkspace = () => {
    switch (activeWorkspace) {
      case 'attendance':
        return (
          <AttendanceEntry
            onNavigateToEmployees={() => setActiveWorkspace('employees')}
            onNavigateToContracts={() => setActiveWorkspace('contracts')}
          />
        );
      case 'employees':
        return <EmployeeProfiles />;
      case 'contracts':
        return (
          <ContractManagement
            onNavigateToEmployees={() => setActiveWorkspace('employees')}
          />
        );
      case 'disbursement':
        return <DisbursementRecords />;
      case 'settings':
        return <SettingsWorkspace />;
      default:
        return <AttendanceEntry onNavigateToEmployees={() => {}} onNavigateToContracts={() => {}} />;
    }
  };

  const getWorkspaceTitle = () => {
    return workspaces.find(w => w.id === activeWorkspace)?.label || '';
  };

  return (
    <MguDbProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground font-mono transition-colors duration-300">
        
        {/* SIDE BAR NAVIGATION */}
        <aside
          className={`flex flex-col bg-card border-r border-border/80 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } shrink-0`}
        >
          {/* Logo / Header */}
          <div className="h-16 flex items-center px-4 border-b border-border/80 gap-3 overflow-hidden select-none">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
              <RiShieldCheckLine className="size-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-foreground">
                  Admin Portal
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase">
                  M.G. University
                </span>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-4 px-2 flex flex-col gap-1.5 overflow-y-auto">
            {workspaces.map((ws) => {
              const Icon = ws.icon;
              const isActive = activeWorkspace === ws.id;

              return (
                <button
                  key={ws.id}
                  onClick={() => setActiveWorkspace(ws.id)}
                  title={sidebarCollapsed ? ws.label : undefined}
                  className={`w-full flex items-center rounded-md p-2 text-sm transition-all relative group ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                      : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`size-5 shrink-0 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!sidebarCollapsed && <span className="truncate">{ws.label}</span>}
                  
                  {/* Tooltip on collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border border-border/80 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                      {ws.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Area */}
          <div className="p-4 border-t border-border/80 flex items-center justify-center select-none overflow-hidden h-14 shrink-0">
            {!sidebarCollapsed ? (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                AD BIII SECTION
              </span>
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                AD
              </span>
            )}
          </div>
        </aside>

        {/* MAIN BODY */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* HEADER BAR */}
          <header className="h-16 border-b border-border/85 bg-card/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none z-10">
            <div className="flex items-center gap-4">
              {/* Collapse Sidebar Button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {sidebarCollapsed ? (
                  <RiMenuUnfoldLine className="size-5" />
                ) : (
                  <RiMenuFoldLine className="size-5" />
                )}
              </button>
              <h2 className="font-heading font-bold text-base md:text-lg text-foreground tracking-tight">
                {getWorkspaceTitle()}
              </h2>
            </div>

            {/* Right details */}
            <div className="flex items-center gap-4">
              {/* System Online Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/10 dark:bg-emerald-500/20 dark:text-emerald-400">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase font-mono">
                  MGU System Online
                </span>
              </div>

              {/* Section Tag */}
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground border-r pr-4 border-border/60">
                <RiTerminalBoxLine className="size-4" />
                <span>AD BIII SECTION</span>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
                title="Toggle Theme (or Press 'd')"
              >
                {theme === 'dark' ? (
                  <RiSunLine className="size-4 text-amber-400 animate-pulse" />
                ) : (
                  <RiMoonLine className="size-4" />
                )}
              </button>
            </div>
          </header>

          {/* WORKSPACE VIEW PORT */}
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {renderActiveWorkspace()}
          </main>
        </div>

      </div>
      
      {/* Toast Notification Container */}
      <Toaster position="bottom-right" richColors />
    </MguDbProvider>
  );
}

export default App;
