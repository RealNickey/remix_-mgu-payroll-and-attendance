import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { calculatePayroll } from '../lib/payroll';
import { generateAttendanceReport, generateDisbursementReport, generateIndividualReceipt } from '@/src/lib/pdf';
import { Button } from '@/components/ui/button';
import { PdfViewer } from '@/components/elements/pdf-viewer';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  FileSpreadsheet, 
  Calendar, 
  Users, 
  Clock, 
  IndianRupee, 
  Download, 
  FileDown,
  Sparkles,
  Info,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function ReportsTab() {
  const { employees, contracts, attendance, settings } = useStore();
  
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [previewPdf, setPreviewPdf] = useState<{ url: string, filename: string, title: string } | null>(null);

  const payrolls = useMemo(() => {
    return calculatePayroll(year, month, employees, contracts, attendance, settings);
  }, [year, month, employees, contracts, attendance, settings]);

  // Aggregate stats for KPI cards
  const stats = useMemo(() => {
    const activeStaff = payrolls.length;
    const totalDays = payrolls.reduce((sum, p) => sum + p.totalDays, 0);
    const otDays = payrolls.reduce((sum, p) => sum + p.otDays, 0);
    const grandTotal = payrolls.reduce((sum, p) => sum + p.totalPay, 0);
    return { activeStaff, totalDays, otDays, grandTotal };
  }, [payrolls]);

  const handleGenerateDisbursement = () => {
    const { url, filename } = generateDisbursementReport(year, month, employees, contracts, attendance, settings, true);
    setPreviewPdf({ url, filename, title: 'Disbursement Summary' });
  };

  const handleGenerateAttendance = () => {
    const { url, filename } = generateAttendanceReport(year, month, employees, contracts, attendance, settings, true);
    setPreviewPdf({ url, filename, title: 'Attendance Report' });
  };

  const handleGenerateReceipt = (p: any) => {
    const { url, filename } = generateIndividualReceipt(p.employee, p.activeContracts[p.activeContracts.length - 1], year, month, attendance[p.employee.id] || {}, settings, true);
    setPreviewPdf({ url, filename, title: `Receipt - ${p.employee.name}` });
  };

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

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

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">Disbursement Records</h2>
            <p className="text-[11px] font-medium text-slate-500">Preview billing cycles and generate official MGU financial sheets</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Billing Month</span>
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

          {payrolls.length > 0 && (
            <div className="flex gap-2 ml-2">
              <Button 
                onClick={handleGenerateDisbursement} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-xs font-bold shadow-xs cursor-pointer gap-1.5 px-4"
              >
                <FileDown className="w-3.5 h-3.5" /> Summary Report
              </Button>
              <Button 
                onClick={handleGenerateAttendance} 
                variant="outline" 
                className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl h-9 text-xs font-bold shadow-none cursor-pointer gap-1.5 px-4"
              >
                <Download className="w-3.5 h-3.5" /> Attendance Report
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0">
        {/* Card 1: Active Staff */}
        <Card className="flex items-center justify-between p-4 shadow-sm border border-slate-200/80 rounded-2xl bg-white">
          <div className="space-y-1.5">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Staff</CardTitle>
            <div className="text-2xl font-bold font-mono text-slate-800 leading-none">{stats.activeStaff}</div>
            <CardDescription className="text-[10px] text-slate-500 font-medium block">with active contracts</CardDescription>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        {/* Card 2: Total Regular Days */}
        <Card className="flex items-center justify-between p-4 shadow-sm border border-slate-200/80 rounded-2xl bg-white">
          <div className="space-y-1.5">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Regular Days Logged</CardTitle>
            <div className="text-2xl font-bold font-mono text-slate-800 leading-none">{stats.totalDays}</div>
            <CardDescription className="text-[10px] text-slate-500 font-medium block">attended duty total</CardDescription>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
            <Calendar className="w-5 h-5" />
          </div>
        </Card>

        {/* Card 3: Overtime Days */}
        <Card className="flex items-center justify-between p-4 shadow-sm border border-slate-200/80 rounded-2xl bg-white">
          <div className="space-y-1.5">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overtime Days</CardTitle>
            <div className="text-2xl font-bold font-mono text-slate-800 leading-none">{stats.otDays}</div>
            <CardDescription className="text-[10px] text-slate-500 font-medium block">at overtime rates</CardDescription>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/50">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        {/* Card 4: Grand Total Disbursement */}
        <Card className="flex items-center justify-between p-4 shadow-md border border-slate-950 rounded-2xl bg-slate-900 text-white">
          <div className="space-y-1">
            <CardTitle className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Grand Total Payroll</CardTitle>
            <div className="flex items-baseline text-white">
              <span className="text-lg font-bold mr-0.5">₹</span>
              <span className="text-2xl font-bold font-mono tracking-tight leading-none">{stats.grandTotal.toLocaleString('en-IN')}</span>
            </div>
            <CardDescription className="text-[10px] text-slate-400 font-medium block">estimated disbursement</CardDescription>
          </div>
          <div className="p-3 bg-slate-800 text-emerald-400 rounded-xl border border-slate-700/50">
            <IndianRupee className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Main Report Table Panel */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Payroll Calculation Sheet</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Pre-computed using active contracts and wages
          </span>
        </div>

        {/* Table list */}
        <ScrollArea className="flex-1 min-h-0">
          <Table className="w-full border-collapse">
            <TableHeader className="sticky top-0 bg-white shadow-xs z-10">
              <TableRow className="bg-white border-b border-slate-200/60">
                <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-left w-[180px]">Employee</TableHead>
                <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-left w-[120px]">Designation</TableHead>
                <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-right w-[100px]">Regular Days</TableHead>
                <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-right w-[100px]">OT Days</TableHead>
                <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-right">Regular Wage</TableHead>
                <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-right">OT Pay</TableHead>
                <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-right">Total Payable</TableHead>
                <TableHead className="p-3 text-[10px] font-bold text-slate-400 uppercase text-center w-[120px]">Receipt Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500 py-16">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                      <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">No Payroll Preview Available</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Ensure employees have valid 90-day contracts active for this period ({format(new Date(year, month - 1), 'MMMM yyyy')}) and their attendance has been entered in the workspace.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payrolls.map(p => (
                  <TableRow key={p.employee.id} className="border-t border-slate-100 bg-white hover:bg-slate-50/50">
                    <TableCell className="p-3 font-semibold text-slate-900 text-xs border-r border-slate-100">
                      {p.employee.name}
                    </TableCell>
                    <TableCell className="p-3 border-r border-slate-100">
                      <Badge variant="outline" className={`text-[10px] font-bold ${getCategoryColor(p.employee.category)}`}>
                        {p.employee.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 text-right font-mono text-slate-700 font-medium text-xs border-r border-slate-100">
                      {p.totalDays}
                    </TableCell>
                    <TableCell className="p-3 text-right font-mono text-slate-700 font-medium text-xs border-r border-slate-100">
                      {p.otDays}
                    </TableCell>
                    <TableCell className="p-3 text-right font-mono text-slate-700 font-semibold text-xs border-r border-slate-100">
                      ₹{p.basePay.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="p-3 text-right font-mono text-slate-700 font-semibold text-xs border-r border-slate-100">
                      ₹{p.otPay.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="p-3 text-right font-mono font-bold text-slate-900 text-xs border-r border-slate-100 bg-slate-50/20">
                      ₹{p.totalPay.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg text-[11px] font-bold cursor-pointer transition-all h-8 gap-1"
                        onClick={() => handleGenerateReceipt(p)}
                      >
                        <Download className="w-3 h-3" /> PDF Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Footer info box */}
        {payrolls.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between px-6 shrink-0">
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              All calculation indices match AD BIII Section administrative procedures.
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2">Disbursement Estimate</span>
              <span className="text-lg font-mono font-bold text-slate-900">₹{stats.grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* PDF Preview Dialog */}
      <Dialog
        open={!!previewPdf}
        onOpenChange={(open) => {
          if (!open) {
            if (previewPdf) URL.revokeObjectURL(previewPdf.url);
            setPreviewPdf(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
            <DialogTitle className="text-lg font-bold text-slate-800">{previewPdf?.title}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Preview before downloading</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-100/50 relative">
            {previewPdf && (
              <PdfViewer
                file={previewPdf.url}
                mode="scroll"
                className="w-full h-full"
              />
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
            <Button
              variant="outline"
              onClick={() => {
                if (previewPdf) URL.revokeObjectURL(previewPdf.url);
                setPreviewPdf(null);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
              onClick={() => {
                if (previewPdf) {
                  const a = document.createElement('a');
                  a.href = previewPdf.url;
                  a.download = previewPdf.filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  toast.success('Downloaded', { description: `${previewPdf.title} has been downloaded.` });
                }
              }}
            >
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
