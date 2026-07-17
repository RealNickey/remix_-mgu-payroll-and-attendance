import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { calculatePayroll } from '../payroll';
import { Employee, Contract, AttendanceRecord, Settings } from './types';
import { formatCurrency } from './utils';

export function generateDisbursementReport(
  year: number,
  month: number,
  employees: Employee[],
  contracts: Contract[],
  attendance: AttendanceRecord,
  settings: Settings, asPreview = false): { url: string; filename: string } | void {
  const doc = new jsPDF();
  const monthName = format(new Date(year, month - 1), 'MMMM yyyy');
  
  doc.setFontSize(14);
  doc.text(`Disbursement Summary - ${monthName}`, 14, 15);
  doc.setFontSize(10);
  
  const prevMonthDate = new Date(year, month - 2);
  const currentMonthDate = new Date(year, month - 1);
  doc.text(`Billing Cycle: 26th ${format(prevMonthDate, 'MMMM')} to 25th ${format(currentMonthDate, 'MMMM')} ${year}`, 14, 22);

  const payrolls = calculatePayroll(year, month, employees, contracts, attendance, settings);

  const tableData = payrolls.map((p, index) => [
    index + 1,
    p.employee.name,
    p.employee.category,
    p.employee.bankAccount,
    formatCurrency(p.totalPay)
  ]);
  
  const grandTotal = payrolls.reduce((sum, p) => sum + p.totalPay, 0);
  
  tableData.push(['', '', '', 'Grand Total:', formatCurrency(grandTotal)]);

  autoTable(doc, {
    startY: 30,
    head: [['#', 'Name', 'Category', 'Bank Account', 'Total Amount Payable']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  const filename = `Disbursement_Summary_${monthName}.pdf`;
  if (asPreview) {
    return { url: URL.createObjectURL(doc.output('blob')), filename };
  }
  doc.save(filename);
}
