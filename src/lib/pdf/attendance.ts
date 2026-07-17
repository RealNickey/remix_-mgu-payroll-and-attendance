import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { calculatePayroll } from '../payroll';
import { Employee, Contract, AttendanceRecord, Settings } from './types';

export function generateAttendanceReport(
  year: number,
  month: number,
  employees: Employee[],
  contracts: Contract[],
  attendance: AttendanceRecord,
  settings: Settings, asPreview = false): { url: string; filename: string } | void {
  const doc = new jsPDF();
  const monthName = format(new Date(year, month - 1), 'MMMM yyyy');
  
  doc.setFontSize(14);
  doc.text(`General Attendance Report - ${monthName}`, 14, 15);

  const payrolls = calculatePayroll(year, month, employees, contracts, attendance, settings);

  const tableData = payrolls.map((p, index) => [
    index + 1,
    p.employee.name,
    p.employee.category,
    p.totalDays.toString(),
    p.otDays.toString()
  ]);

  autoTable(doc, {
    startY: 25,
    head: [['#', 'Name', 'Category', 'Total Days Attended', 'OT Days']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  const filename = `Attendance_Report_${monthName}.pdf`;
  if (asPreview) {
    return { url: URL.createObjectURL(doc.output('blob')), filename };
  }
  doc.save(filename);
}
