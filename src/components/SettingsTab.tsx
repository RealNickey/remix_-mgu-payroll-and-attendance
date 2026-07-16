import { useState } from 'react';
import { useStore, EmployeeCategory } from '../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Settings, 
  Coins, 
  Save, 
  Clock, 
  Info,
  Sparkles
} from 'lucide-react';

export default function SettingsTab() {
  const { settings, updateSettings } = useStore();
  const [wages, setWages] = useState(settings.baseWages);
  const [otRate, setOtRate] = useState(settings.otRate);
  
  const categories: EmployeeCategory[] = ['Gardeners', 'Drivers', 'Cooks', 'Helpers'];

  const handleSave = () => {
    updateSettings({ baseWages: wages, otRate });
    toast.success('Settings saved!', { description: 'Disbursement indices updated successfully.' });
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">System Settings</h2>
            <p className="text-[11px] font-medium text-slate-500">Configure institutional wage rates and overtime payroll rules</p>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-9.5 text-xs font-bold shadow-xs cursor-pointer active:scale-98 transition-all gap-1.5 px-5"
        >
          <Save className="w-3.5 h-3.5" /> Save Changes
        </Button>
      </div>



      {/* Grid Bento Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Panel 1: Daily Wage Rates */}
        <Card className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2.5 pb-3 border-b border-slate-100 p-6">
            <Coins className="w-4.5 h-4.5 text-emerald-600" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">Daily Wage Rates (₹)</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            {categories.map(cat => (
              <div key={cat} className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={`wage-${cat}`} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                  {cat}
                </Label>
                <div className="col-span-2 relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <Input 
                    id={`wage-${cat}`}
                    type="number" 
                    className="pl-7 rounded-xl h-9.5 shadow-none border-slate-200 font-mono text-xs font-semibold text-slate-800 focus:ring-emerald-500/10 focus:border-emerald-500"
                    value={wages[cat]} 
                    onChange={e => setWages({ ...wages, [cat]: Number(e.target.value) })}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Panel 2: Overtime Rules */}
        <div className="space-y-6">
          <Card className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-2.5 pb-3 border-b border-slate-100 p-6">
              <Clock className="w-4.5 h-4.5 text-emerald-600" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">Overtime Parameters (₹)</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="otRate" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                  Flat OT Rate
                </Label>
                <div className="col-span-2 relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <Input 
                    id="otRate"
                    type="number" 
                    className="pl-7 rounded-xl h-9.5 shadow-none border-slate-200 font-mono text-xs font-semibold text-slate-800 focus:ring-emerald-500/10 focus:border-emerald-500"
                    value={otRate} 
                    onChange={e => setOtRate(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/40 rounded-xl flex items-start gap-2.5 text-slate-500">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-normal font-medium">
                  Note: In compliance with university guidelines, Overtime calculations are only applicable for Sri/Smt categorized as <strong className="text-slate-700 font-bold">Cooks</strong>, <strong className="text-slate-700 font-bold">Helpers</strong>, or <strong className="text-slate-700 font-bold">Drivers</strong>. Gardeners are excluded from overtime schedules.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info Board */}
          <div className="bg-emerald-950/5 border border-emerald-950/10 p-5 rounded-2xl flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Payroll Regulation Compliance</h4>
              <p className="text-xs text-emerald-800/80 leading-relaxed">
                Wages and overtime formulas are computed instantly during disbursement report creation. Verify contract parameters inside the Contract Management workspace before committing financial sheets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
