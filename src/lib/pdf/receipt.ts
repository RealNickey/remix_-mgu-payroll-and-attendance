import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { getBillingCycleDates } from '../utils';
import { calculatePayroll } from '../payroll';
import { Employee, Contract, DailyAttendance, Settings } from './types';
import { numberToWords } from './utils';

export function generateIndividualReceipt(
  employee: Employee,
  contract: Contract,
  year: number,
  month: number,
  attendanceRecord: Record<string, DailyAttendance>,
  settings: Settings
): void {
  const doc = new jsPDF('landscape'); // Landscape to fit 31 columns
  const monthName = format(new Date(year, month - 1), 'MMMM yyyy');
  
  // Header Section
  doc.setFontSize(16);
  doc.text('MAHATMA GANDHI UNIVERSITY', doc.internal.pageSize.width / 2, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text('AD BIII SECTION', doc.internal.pageSize.width / 2, 28, { align: 'center' });
  
  // Basic Information
  doc.setFontSize(12);
  doc.text(`Attendance sheet for the month of ${monthName}`, 20, 45);
  doc.text(`Name & Designation: ${employee.name} (${employee.category})`, 20, 55);
  
  const orderInfo = contract 
    ? `Order as per No: ${contract.orderNo} Dtd: ${contract.orderDate}` 
    : 'Order as per No: ..................................... Dtd: ...........................';
  doc.text(orderInfo, 20, 65);
  
  // Attendance Grid (Chronological billing cycle dates + padding to 31 columns)
  const cycle = getBillingCycleDates(year, month);
  const daysHeader: string[] = ['Days'];
  const fnRow: string[] = ['FN'];
  const anRow: string[] = ['AN'];
  
  for (const dateStr of cycle.dates) {
    const dayNum = dateStr.split('-')[2];
    daysHeader.push(parseInt(dayNum, 10).toString());
    
    let fnStr = '';
    let anStr = '';
    
    if (attendanceRecord[dateStr]) {
       fnStr = attendanceRecord[dateStr].fn ? 'X' : '';
       anStr = attendanceRecord[dateStr].an ? 'X' : '';
    }
    
    fnRow.push(fnStr);
    anRow.push(anStr);
  }
  
  // Pad to 31 columns if necessary (up to index 31, which is 32 columns including 'Days')
  while (daysHeader.length < 32) {
    daysHeader.push('');
    fnRow.push('');
    anRow.push('');
  }
  
  autoTable(doc, {
    startY: 75,
    head: [daysHeader],
    body: [fnRow, anRow],
    theme: 'grid',
    styles: { halign: 'center', cellPadding: 2, fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', halign: 'left', cellWidth: 15 } }
  });
  
  // @ts-ignore
  const finalY = doc.lastAutoTable?.finalY || 100;
  
  // Recalculate payroll details for this employee to get workedHolidays and totalDays
  const payrolls = calculatePayroll(year, month, [employee], [contract], { [employee.id]: attendanceRecord }, settings);
  const payroll = payrolls[0] || {
    employee,
    totalDays: 0,
    otDays: 0,
    basePay: 0,
    otPay: 0,
    totalPay: 0,
    workedHolidays: [],
    activeContracts: [contract]
  };

  // Certification & Summary Statements
  doc.setFontSize(11);
  const textY1 = finalY + 10;
  const lineSpacing = 6;
  const today = format(new Date(), 'dd-MM-yyyy');
  doc.text(`Certified that Sri/Smt ${employee.name} Recruited through the Employment Exchange/ Local`, 20, textY1);
  doc.text(`notification has/ have attended duty for ${payroll.totalDays} Days consecutively during the month of ${monthName}`, 20, textY1 + lineSpacing);
  doc.text(`and have not completed 179 days on duty as on ${today} today.`, 20, textY1 + lineSpacing * 2);
  
  doc.text(`Total days present: ${payroll.totalDays} (figures) ${numberToWords(payroll.totalDays)} (words) (including holidays duty if any)`, 20, textY1 + lineSpacing * 3.5);
  
  // Sort the worked holidays chronologically
  const sortedHolidays = [...payroll.workedHolidays].sort();
  const holidaysStr = sortedHolidays.length > 0 ? sortedHolidays.join(', ') : 'None';
  doc.text(`Also certified that he/ she attended the duty on the following holidays: ${holidaysStr}`, 20, textY1 + lineSpacing * 5);
  
  // Signatory Section - coordinate safe spacing preventing overflow
  const sigY = textY1 + lineSpacing * 8.5;
  doc.text('Assistant', 20, sigY);
  doc.text('Name & Signature of SO', 80, sigY);
  doc.text('Name & Signature of AR', 160, sigY);
  doc.text('Name & Signature of DR', 230, sigY);
  
  doc.save(`Receipt_${employee.name.replace(/\s+/g, '_')}_${monthName}.pdf`);
}
