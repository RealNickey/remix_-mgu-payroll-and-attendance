import { useStore } from './store';
import { Calendar, Users, FileText, FileSpreadsheet, Settings, ShieldCheck } from 'lucide-react';
import EmployeesTab from './components/EmployeesTab';
import ContractsTab from './components/ContractsTab';
import AttendanceTab from './components/AttendanceTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export default function App() {
  const activeTab = useStore(state => state.activeTab);
  const setActiveTab = useStore(state => state.setActiveTab);

  const menuItems = [
    { value: 'attendance', label: 'Attendance Entry', icon: Calendar, id: 'sidebar-tab-attendance' },
    { value: 'employees', label: 'Employee Profiles', icon: Users, id: 'sidebar-tab-employees' },
    { value: 'contracts', label: 'Contract Management', icon: FileText, id: 'sidebar-tab-contracts' },
    { value: 'reports', label: 'Disbursement Records', icon: FileSpreadsheet, id: 'sidebar-tab-reports' },
    { value: 'settings', label: 'Settings', icon: Settings, id: 'sidebar-tab-settings' },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
        {/* Sidebar */}
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="p-6 border-b border-slate-100 flex flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/10">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Admin Portal</h1>
              <p className="text-sm font-semibold text-slate-900 tracking-tight leading-tight">M.G. University</p>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4 space-y-1">
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => setActiveTab(item.value)}
                      className={`w-full justify-start gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer active:scale-98 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10 hover:bg-emerald-600 hover:text-white'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      id={item.id}
                      isActive={isActive}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? '' : 'text-slate-400 group-hover:scale-110'}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium bg-slate-50/50">
            <span translate="no" className="uppercase tracking-wider">AD BIII SECTION</span>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors" />
              <Separator orientation="vertical" className="h-4 bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 select-none">AD</div>
                <div className="text-sm">
                  <span className="text-slate-400">Section /</span> <span className="font-semibold text-slate-900 uppercase tracking-wide text-xs" translate="no">AD BIII SECTION</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">MGU System Online</span>
            </div>
          </header>

          <div className="p-8 flex-1 overflow-auto animate-fade-in">
            {activeTab === 'attendance' && <AttendanceTab />}
            {activeTab === 'employees' && <EmployeesTab />}
            {activeTab === 'contracts' && <ContractsTab />}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

