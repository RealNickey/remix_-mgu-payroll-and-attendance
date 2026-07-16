import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { getBillingCycleDates } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';
import { 
  Search, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Check, 
  ChevronRight, 
  UserX,
  ArrowRight,
  Info
} from 'lucide-react';

export default function AttendanceTab() {
  const { employees, contracts, attendance, setAttendance, setActiveTab } = useStore();
  const [employeeId, setEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12

  const cycle = useMemo(() => getBillingCycleDates(year, month), [year, month]);
  
  const employee = employees.find(e => e.id === employeeId);
  const isOtEligible = employee && ['Cooks', 'Helpers', 'Drivers'].includes(employee.category);

  // Filtered employees list for sidebar search
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [employees, searchTerm]);

  // Set default employee if none selected and employees exist
  useMemo(() => {
    if (!employeeId && employees.length > 0) {
      setEmployeeId(employees[0].id);
    }
  }, [employees, employeeId]);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  const handleToggle = (date: string, field: 'fn' | 'an' | 'ot' | 'isHoliday') => {
    if (!employeeId) return;
    const current = attendance[employeeId]?.[date] || { fn: false, an: false, ot: false, isHoliday: false };
    setAttendance(employeeId, date, { ...current, [field]: !current[field] });
  };

  const markAll = (field: 'fn' | 'an', value: boolean) => {
    if (!employeeId) return;
    cycle.dates.forEach(date => {
      const current = attendance[employeeId]?.[date] || { fn: false, an: false, ot: false, isHoliday: false };
      setAttendance(employeeId, date, { ...current, [field]: value });
    });
  };

  const markWeekdays = () => {
    if (!employeeId) return;
    cycle.dates.forEach(dateStr => {
      const date = parseISO(dateStr);
      const day = date.getDay();
      const isWeekend = day === 0 || day === 6; // Sunday is 0, Saturday is 6
      if (!isWeekend) {
        const current = attendance[employeeId]?.[dateStr] || { fn: false, an: false, ot: false, isHoliday: false };
        setAttendance(employeeId, dateStr, { ...current, fn: true, an: true });
      }
    });
  };

  const clearAll = () => {
    if (!employeeId) return;
    cycle.dates.forEach(date => {
      setAttendance(employeeId, date, { fn: false, an: false, ot: false, isHoliday: false });
    });
  };

  // Compute stats for current employee in this cycle
  const currentEmployeeStats = useMemo(() => {
    if (!employeeId) return { totalDays: 0, otDays: 0, holidayDays: 0 };
    const empAttendance = attendance[employeeId] || {};
    let totalDays = 0;
    let otDays = 0;
    let holidayDays = 0;

    cycle.dates.forEach(date => {
      const record = empAttendance[date];
      if (record) {
        let val = 0;
        if (record.fn) val += 0.5;
        if (record.an) val += 0.5;
        totalDays += val;
        if (record.ot && isOtEligible) otDays += 1;
        if (record.isHoliday && val > 0) holidayDays += 1;
      }
    });

    return { totalDays, otDays, holidayDays };
  }, [employeeId, attendance, cycle, isOtEligible]);

  // Compute attendance stats for each employee in sidebar
  const getEmployeeProgress = (empId: string) => {
    const empAttendance = attendance[empId] || {};
    let totalDays = 0;
    cycle.dates.forEach(date => {
      const record = empAttendance[date];
      if (record) {
        if (record.fn) totalDays += 0.5;
        if (record.an) totalDays += 0.5;
      }
    });
    return totalDays;
  };

  // Check active contracts for selected employee during this cycle
  const hasActiveContract = useMemo(() => {
    if (!employeeId) return false;
    const empContracts = contracts.filter(c => c.employeeId === employeeId);
    const active = empContracts.filter(c => {
      const cStart = parseISO(c.startDate);
      const cEnd = parseISO(c.endDate);
      return cStart <= cycle.endDate && cEnd >= cycle.startDate;
    });
    return active.length > 0;
  }, [employeeId, contracts, cycle]);

  // Split cycle dates into two columns side-by-side to eliminate vertical scroll
  const [column1Dates, column2Dates] = useMemo(() => {
    const mid = Math.ceil(cycle.dates.length / 2);
    return [
      cycle.dates.slice(0, mid),
      cycle.dates.slice(mid)
    ];
  }, [cycle.dates]);

  // Get color for category tags
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Gardeners': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Drivers': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Cooks': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Helpers': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getAvatarBg = (category: string) => {
    switch (category) {
      case 'Gardeners': return 'bg-teal-600';
      case 'Drivers': return 'bg-purple-600';
      case 'Cooks': return 'bg-amber-600';
      case 'Helpers': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">Attendance Workspace</h2>
            <p className="text-[11px] font-medium text-slate-500">Billing Cycle: 26th (Prev) to 25th (Current)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Month</span>
            <Select value={month.toString()} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="w-36 h-9 rounded-xl border-slate-200 font-medium text-xs shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value.toString()} className="text-xs rounded-lg">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Year</span>
            <Select value={year.toString()} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-24 h-9 rounded-xl border-slate-200 font-medium text-xs shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {[year - 1, year, year + 1].map(y => (
                  <SelectItem key={y} value={y.toString()} className="text-xs rounded-lg">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
            <UserX className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Employees Configured</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">You must first set up employee profiles in the system before you can mark their attendance.</p>
          <Button onClick={() => setActiveTab('employees')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2 h-10 font-semibold text-xs shadow-sm shadow-emerald-600/10 gap-2">
            Create Employee Profiles <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-0">
          {/* Left Column: Interactive Employee Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-full">
            <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50 shrink-0">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Employee List</div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-10" />
                <Input
                  type="text"
                  placeholder="Search name or category…"
                  className="pl-9 rounded-xl text-xs border-slate-200 h-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">No results found</div>
                ) : (
                  filteredEmployees.map(emp => {
                    const isSelected = emp.id === employeeId;
                    const progress = getEmployeeProgress(emp.id);
                    const progressPercent = Math.min(100, (progress / cycle.dates.length) * 100);
                    const initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const empContracts = contracts.filter(c => c.employeeId === emp.id);
                    const hasContractForCycle = empContracts.some(c => {
                      const s = parseISO(c.startDate);
                      const e = parseISO(c.endDate);
                      return s <= cycle.endDate && e >= cycle.startDate;
                    });

                    return (
                      <button
                        key={emp.id}
                        onClick={() => setEmployeeId(emp.id)}
                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer border ${
                          isSelected 
                            ? 'bg-slate-900 text-white border-slate-950 shadow-sm' 
                            : 'bg-white text-slate-700 border-transparent hover:bg-slate-50 hover:border-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                          isSelected ? 'bg-emerald-600' : getAvatarBg(emp.category)
                        }`}>
                          {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{emp.name}</span>
                            {!hasContractForCycle && (
                              <span className="shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="No active contract for this cycle!" />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] mt-0.5">
                            <span className={`${isSelected ? 'text-slate-300' : 'text-slate-500'} font-medium`}>{emp.category}</span>
                            <span className={`font-mono font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`}>{progress} / {cycle.dates.length} d</span>
                          </div>

                          {/* Progress Bar */}
                          <Progress value={progressPercent} className="w-full mt-2" />
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-300'}`} />
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Column: Attendance Grid (Scroll-Free Dual-Column Layout) */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-full">
            {employee ? (
              <div className="flex flex-col h-full min-h-0">
                {/* Employee Profile Header & Batch Actions */}
                <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200/50">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{employee.name}</h3>
                        <Badge variant="outline" className={`text-[10px] font-bold ${getCategoryColor(employee.category)}`}>
                          {employee.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Bank: <span className="text-slate-700 font-semibold">{employee.bankAccount}</span> 
                        <span className="mx-2 text-slate-300">|</span> 
                        Cycle: <span className="text-slate-700 font-semibold">{format(cycle.startDate, 'MMM dd')} — {format(cycle.endDate, 'MMM dd, yyyy')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={markWeekdays}
                      className="text-slate-700 border-slate-200 rounded-xl text-[11px] font-bold hover:bg-slate-100/80 hover:text-slate-900 shadow-none cursor-pointer"
                    >
                      Mark Weekdays
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { markAll('fn', true); markAll('an', true); }}
                      className="text-slate-700 border-slate-200 rounded-xl text-[11px] font-bold hover:bg-slate-100/80 hover:text-slate-900 shadow-none cursor-pointer"
                    >
                      Mark All Present
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAll}
                      className="text-rose-600 border-rose-100 rounded-xl text-[11px] font-bold hover:bg-rose-50 hover:text-rose-700 shadow-none cursor-pointer"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* Main Interactive Grid */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-slate-50/20">
                  {!hasActiveContract ? (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                      <AlertTitle className="text-xs font-bold uppercase tracking-wide">Missing Active Contract</AlertTitle>
                      <AlertDescription className="text-xs leading-relaxed mt-1">
                        Sri/Smt {employee.name} has no active contract for the selected billing cycle ({format(cycle.startDate, 'dd MMM yyyy')} to {format(cycle.endDate, 'dd MMM yyyy')}). 
                        Attendance records are locked and will not compute in payroll records until a contract is registered.
                        <div className="mt-3">
                          <Button 
                            onClick={() => setActiveTab('contracts')}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold px-3 py-1.5 h-8 gap-1 shadow-sm shadow-rose-600/10 cursor-pointer border-none"
                          >
                            Register Contract <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full items-start">
                      {/* Column 1: First half of billing cycle */}
                      <div className="space-y-2.5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white px-3 py-1.5 rounded-xl border border-slate-200/40 shadow-xs inline-block">
                          First Half ({column1Dates.length} Days)
                        </div>
                        <div className="space-y-1.5">
                          {column1Dates.map(dateStr => (
                            <DateRow 
                              key={dateStr}
                              dateStr={dateStr}
                              employeeId={employee.id}
                              isOtEligible={!!isOtEligible}
                              attendance={attendance}
                              handleToggle={handleToggle}
                              contracts={contracts}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Column 2: Second half of billing cycle */}
                      <div className="space-y-2.5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white px-3 py-1.5 rounded-xl border border-slate-200/40 shadow-xs inline-block">
                          Second Half ({column2Dates.length} Days)
                        </div>
                        <div className="space-y-1.5">
                          {column2Dates.map(dateStr => (
                            <DateRow 
                              key={dateStr}
                              dateStr={dateStr}
                              employeeId={employee.id}
                              isOtEligible={!!isOtEligible}
                              attendance={attendance}
                              handleToggle={handleToggle}
                              contracts={contracts}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mini Stat Summary Footer */}
                {hasActiveContract && (
                  <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Month Summary:</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Days Marked</span>
                        <span className="text-sm font-mono font-bold text-emerald-700">{currentEmployeeStats.totalDays}</span>
                      </div>
                      {isOtEligible && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">OT Days</span>
                          <span className="text-sm font-mono font-bold text-amber-700">{currentEmployeeStats.otDays}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
                        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Holiday Days</span>
                        <span className="text-sm font-mono font-bold text-blue-700">{currentEmployeeStats.holidayDays}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 border border-slate-100">
                  <User className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No Selected Employee</h3>
                <p className="text-sm text-slate-500 max-w-sm">Select an employee from the left panel to begin managing their daily attendance records.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Single Compact Date Attendance Row Component
interface DateRowProps {
  key?: string;
  dateStr: string;
  employeeId: string;
  isOtEligible: boolean;
  attendance: any;
  handleToggle: (date: string, field: 'fn' | 'an' | 'ot' | 'isHoliday') => void;
  contracts: any[];
}

function DateRow({ dateStr, employeeId, isOtEligible, attendance, handleToggle, contracts }: DateRowProps) {
  const date = parseISO(dateStr);
  const record = attendance[employeeId]?.[dateStr] || { fn: false, an: false, ot: false, isHoliday: false };
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday/Saturday
  
  // Calculate if date falls within active contracts
  const isCoveredByContract = useMemo(() => {
    const empContracts = contracts.filter(c => c.employeeId === employeeId);
    return empContracts.some(c => {
      const s = parseISO(c.startDate);
      const e = parseISO(c.endDate);
      return date >= s && date <= e;
    });
  }, [contracts, employeeId, date]);

  if (!isCoveredByContract) {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/50 border border-dashed border-slate-200 select-none opacity-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-400">{format(date, 'dd MMM')}</span>
          <span className="text-[10px] bg-slate-100 text-slate-400 font-bold px-1.5 py-0.5 rounded uppercase">{format(date, 'EEE')}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
          <Info className="w-3 h-3" /> Outside Contract Period
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
      isWeekend 
        ? 'bg-amber-50/20 hover:bg-amber-50/40 border-amber-100/50' 
        : 'bg-white hover:bg-slate-50 border-slate-200/50'
    }`}>
      {/* Date info */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-mono font-bold ${isWeekend ? 'text-amber-800' : 'text-slate-800'}`}>
          {format(date, 'dd MMM')}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
          isWeekend ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
        }`}>
          {format(date, 'EEE')}
        </span>
      </div>

      {/* Toggle Badges */}
      <div className="flex items-center gap-1">
        {/* Forenoon (FN) Toggle */}
        <button
          onClick={() => handleToggle(dateStr, 'fn')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border transition-all duration-150 active:scale-95 ${
            record.fn 
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
              : 'bg-slate-50 text-slate-400 border-slate-200/70 hover:bg-slate-100'
          }`}
          title="Forenoon Attendance"
        >
          FN
        </button>

        {/* Afternoon (AN) Toggle */}
        <button
          onClick={() => handleToggle(dateStr, 'an')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border transition-all duration-150 active:scale-95 ${
            record.an 
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
              : 'bg-slate-50 text-slate-400 border-slate-200/70 hover:bg-slate-100'
          }`}
          title="Afternoon Attendance"
        >
          AN
        </button>

        {/* Overtime (OT) Toggle */}
        {isOtEligible && (
          <button
            onClick={() => handleToggle(dateStr, 'ot')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border transition-all duration-150 active:scale-95 ${
              record.ot 
                ? 'bg-amber-500 border-amber-500 text-white shadow-xs' 
                : 'bg-slate-50 text-slate-400 border-slate-200/70 hover:bg-slate-100'
            }`}
            title="Overtime"
          >
            OT
          </button>
        )}

        {/* Worked Holiday Toggle */}
        <button
          onClick={() => handleToggle(dateStr, 'isHoliday')}
          className={`px-1.5 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border transition-all duration-150 active:scale-95 ${
            record.isHoliday 
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
              : 'bg-slate-50 text-slate-400 border-slate-200/70 hover:bg-slate-100'
          }`}
          title="Worked Holiday"
        >
          Hol
        </button>
      </div>
    </div>
  );
}
