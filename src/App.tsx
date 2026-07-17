import { useState } from "react"
import { MguDbProvider } from "@/lib/db"
import { useTheme } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { EmployeeProfiles } from "@/components/EmployeeProfiles"
import { ContractManagement } from "@/components/ContractManagement"
import { AttendanceEntry } from "@/components/AttendanceEntry"
import { DisbursementRecords } from "@/components/DisbursementRecords"
import { SettingsWorkspace } from "@/components/SettingsWorkspace"
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard"
import { Badge } from "@/components/ui/badge"
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
  RiTerminalBoxLine,
  RiBarChartLine,
} from "@remixicon/react"

type WorkspaceType =
  | "analytics"
  | "attendance"
  | "employees"
  | "contracts"
  | "disbursement"
  | "settings"

export function App() {
  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceType>("attendance")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { theme, setTheme } = useTheme()

  // Workspace labels and icons
  const workspaces = [
    { id: "analytics", label: "Analytics & Insights", icon: RiBarChartLine },
    { id: "attendance", label: "Attendance Entry", icon: RiCalendarCheckLine },
    { id: "employees", label: "Employee Profiles", icon: RiUserLine },
    { id: "contracts", label: "Contract Management", icon: RiFileTextLine },
    { id: "disbursement", label: "Disbursement Records", icon: RiHandCoinLine },
    { id: "settings", label: "Settings", icon: RiSettings4Line },
  ] as const

  const renderActiveWorkspace = () => {
    switch (activeWorkspace) {
      case "analytics":
        return <AnalyticsDashboard />
      case "attendance":
        return (
          <AttendanceEntry
            onNavigateToEmployees={() => setActiveWorkspace("employees")}
            onNavigateToContracts={() => setActiveWorkspace("contracts")}
          />
        )
      case "employees":
        return <EmployeeProfiles />
      case "contracts":
        return (
          <ContractManagement
            onNavigateToEmployees={() => setActiveWorkspace("employees")}
          />
        )
      case "disbursement":
        return <DisbursementRecords />
      case "settings":
        return <SettingsWorkspace />
      default:
        return (
          <AttendanceEntry
            onNavigateToEmployees={() => {}}
            onNavigateToContracts={() => {}}
          />
        )
    }
  }

  const getWorkspaceTitle = () => {
    return workspaces.find((w) => w.id === activeWorkspace)?.label || ""
  }

  return (
    <MguDbProvider>
      <div className="flex h-screen overflow-hidden bg-background font-mono text-foreground transition-colors duration-300">
        {/* SIDE BAR NAVIGATION */}
        <aside
          className={`flex flex-col border-r border-border/80 bg-card transition-all duration-300 ${
            sidebarCollapsed ? "w-16" : "w-64"
          } shrink-0`}
        >
          {/* Logo / Header */}
          <div className="flex h-16 items-center gap-3 overflow-hidden border-b border-border/80 px-4 select-none">
            <div className="shrink-0 rounded-lg bg-primary/10 p-1.5 text-primary">
              <RiShieldCheckLine className="size-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-heading text-sm font-bold tracking-wider text-foreground uppercase">
                  Estate Payroll
                </span>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 py-4">
            {workspaces.map((ws) => {
              const Icon = ws.icon
              const isActive = activeWorkspace === ws.id

              return (
                <button
                  key={ws.id}
                  onClick={() => setActiveWorkspace(ws.id)}
                  title={sidebarCollapsed ? ws.label : undefined}
                  className={`group relative flex w-full items-center rounded-md p-2 text-sm transition-all ${
                    isActive
                      ? "bg-primary font-bold text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`size-5 shrink-0 ${sidebarCollapsed ? "mx-auto" : "mr-3"}`}
                  />
                  {!sidebarCollapsed && (
                    <span className="truncate">{ws.label}</span>
                  )}

                  {/* Tooltip on collapsed state */}
                  {sidebarCollapsed && (
                    <div className="pointer-events-none absolute left-full z-50 ml-3 rounded border border-border/80 bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {ws.label}
                    </div>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Footer Area */}
          <div className="flex h-18 shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden border-t border-border/80 p-3 text-center">
            {!sidebarCollapsed ? (
              <>
                <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  AD BIII SECTION
                </span>
                <a
                  href="https://www.aswinjim.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105 active:scale-95"
                >
                  <Badge
                    variant="outline"
                    className="border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10"
                  >
                    Made by Aswin
                  </Badge>
                </a>
              </>
            ) : (
              <a
                href="https://www.aswinjim.me/"
                target="_blank"
                rel="noopener noreferrer"
                title="Made by Aswin"
                className="transition-transform hover:scale-105 active:scale-95"
              >
                <Badge
                  variant="outline"
                  className="flex size-6 items-center justify-center rounded-full border-primary/20 bg-primary/5 p-0 text-[10px] text-primary hover:bg-primary/10"
                >
                  AJ
                </Badge>
              </a>
            )}
          </div>
        </aside>

        {/* MAIN BODY */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* HEADER BAR */}
          <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-border/85 bg-card/60 px-6 backdrop-blur-md select-none">
            <div className="flex items-center gap-4">
              {/* Collapse Sidebar Button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                aria-label={
                  sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
                }
              >
                {sidebarCollapsed ? (
                  <RiMenuUnfoldLine className="size-5" aria-hidden="true" />
                ) : (
                  <RiMenuFoldLine className="size-5" aria-hidden="true" />
                )}
              </button>
              <h2 className="font-heading text-base font-bold tracking-tight text-foreground md:text-lg">
                {getWorkspaceTitle()}
              </h2>
            </div>

            {/* Right details */}
            <div className="flex items-center gap-4">
              {/* System Online Badge */}
              <div className="hidden items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/10 px-3 py-1 text-emerald-600 sm:flex dark:bg-emerald-500/20 dark:text-emerald-400">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[10px] font-bold tracking-wider uppercase">
                  MGU System Online
                </span>
              </div>

              {/* Section Tag */}
              <div className="flex items-center gap-1.5 border-r border-border/60 pr-4 text-[11px] font-semibold text-muted-foreground">
                <RiTerminalBoxLine className="size-4" aria-hidden="true" />
                <span>AD BIII SECTION</span>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                title="Toggle Theme (or Press 'd')"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? (
                  <RiSunLine
                    className="size-4 animate-pulse text-amber-400"
                    aria-hidden="true"
                  />
                ) : (
                  <RiMoonLine className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </header>

          {/* WORKSPACE VIEW PORT */}
          <main className="flex-1 overflow-y-auto bg-background p-6">
            {renderActiveWorkspace()}
          </main>
        </div>
      </div>

      {/* Toast Notification Container */}
      <Toaster position="bottom-right" richColors />
    </MguDbProvider>
  )
}

export default App
