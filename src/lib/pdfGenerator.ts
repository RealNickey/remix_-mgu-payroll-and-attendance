import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { PayrollRow } from "./db"
import { formatIndianRupees, daysToWords, formatDateKey } from "./payrollUtils"

export function generateSummaryReport(
  payroll: PayrollRow[],
  monthName: string,
  year: number,
  cycleStartStr: string,
  cycleEndStr: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Margins & Dimensions
  const pageWidth = doc.internal.pageSize.width
  const margin = 14

  // Header / Title Block
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(30, 41, 59) // Slate-800
  doc.text("MAHATMA GANDHI UNIVERSITY", pageWidth / 2, 20, { align: "center" })

  doc.setFont("Helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(71, 85, 105) // Slate-600
  doc.text("AD BIII SECTION", pageWidth / 2, 26, { align: "center" })

  doc.setFont("Helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42) // Slate-900
  doc.text(`Disbursement Summary — ${monthName} ${year}`, pageWidth / 2, 34, {
    align: "center",
  })

  // Sub-details
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Billing Cycle: ${cycleStartStr} to ${cycleEndStr}`, margin, 44)
  doc.text(
    `Report Date: ${new Date().toLocaleDateString("en-GB")}`,
    pageWidth - margin,
    44,
    { align: "right" }
  )

  // Divider line
  doc.setDrawColor(203, 213, 225) // Slate-300
  doc.setLineWidth(0.5)
  doc.line(margin, 46, pageWidth - margin, 46)

  // Table Setup
  const tableData = payroll.map((row, index) => [
    index + 1,
    row.name,
    row.category,
    row.bankAccount,
    formatIndianRupees(row.totalPay),
  ])

  const grandTotal = payroll.reduce((sum, row) => sum + row.totalPay, 0)

  tableData.push(["", "Grand Total", "", "", formatIndianRupees(grandTotal)])

  autoTable(doc, {
    startY: 50,
    head: [
      [
        "Sl. No.",
        "Employee Name",
        "Category",
        "Bank Account Number",
        "Total Payable",
      ],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42], // Dark Slate
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 30 },
      3: { cellWidth: 50 },
      4: { cellWidth: 35, halign: "right" },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      // Style grand total row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fillColor = [241, 245, 249] // Slate-100
        data.cell.styles.textColor = [15, 23, 42]
      }
    },
  })

  // Download trigger
  doc.save(`Disbursement_Summary_${monthName}_${year}.pdf`)
}

export function generateAttendanceReport(
  payroll: PayrollRow[],
  monthName: string,
  year: number
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.width
  const margin = 14

  // Header / Title Block
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(30, 41, 59)
  doc.text("MAHATMA GANDHI UNIVERSITY", pageWidth / 2, 20, { align: "center" })

  doc.setFont("Helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(71, 85, 105)
  doc.text("AD BIII SECTION", pageWidth / 2, 26, { align: "center" })

  doc.setFont("Helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(
    `General Attendance Report — ${monthName} ${year}`,
    pageWidth / 2,
    34,
    { align: "center" }
  )

  // Report Date
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    `Generated on: ${new Date().toLocaleDateString("en-GB")}`,
    margin,
    44
  )

  // Divider line
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.5)
  doc.line(margin, 46, pageWidth - margin, 46)

  const tableData = payroll.map((row, index) => [
    index + 1,
    row.name,
    row.category,
    row.regularDays.toFixed(1),
    row.otDays,
  ])

  autoTable(doc, {
    startY: 50,
    head: [
      [
        "Sl. No.",
        "Employee Name",
        "Category",
        "Total Days Attended",
        "OT Days",
      ],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30, halign: "center" },
      4: { cellWidth: 25, halign: "center" },
    },
    margin: { left: margin, right: margin },
  })

  doc.save(`Attendance_Report_${monthName}_${year}.pdf`)
}

export function generateEmployeeReceipt(
  row: PayrollRow,
  attendanceData: Record<string, any>,
  billingCycleDates: Date[],
  monthName: string,
  year: number
) {
  // Formal Landscape Certificate
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.width // 297mm
  const pageHeight = doc.internal.pageSize.height // 210mm
  const margin = 12

  // 1. Institution Headings
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(30, 41, 59)
  doc.text("MAHATMA GANDHI UNIVERSITY", pageWidth / 2, 14, { align: "center" })

  doc.setFont("Helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105)
  doc.text("AD BIII SECTION", pageWidth / 2, 20, { align: "center" })

  doc.setFont("Helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text(
    `Attendance sheet for the month of ${monthName} ${year}`,
    pageWidth / 2,
    26,
    { align: "center" }
  )

  // 2. Employee Info & Contract G.O. details
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)

  // Left Details
  doc.text(`Name of Employee: Sri/Smt. ${row.name}`, margin, 35)
  doc.text(`Designation: ${row.category}`, margin, 40)

  // Right Details (G.O. reference)
  const goNumber =
    row.relevantContract?.goNumber ||
    "......................................................."
  let goDateFormatted = "..................................."
  if (row.relevantContract?.goDate) {
    const dParts = row.relevantContract.goDate.split("-")
    goDateFormatted = `${dParts[2]}/${dParts[1]}/${dParts[0]}`
  }

  doc.text(`G.O. No: ${goNumber}`, pageWidth - margin - 120, 35)
  doc.text(`Order Issue Date: ${goDateFormatted}`, pageWidth - margin - 120, 40)

  // 3. Grid Table
  // Headers: "Session", "1", "2", ... "31"
  const colHeaders = ["Session"]
  for (let i = 1; i <= 31; i++) {
    colHeaders.push(String(i))
  }

  // Row Data for FN and AN
  const fnRow = ["FN"]
  const anRow = ["AN"]

  for (let i = 0; i < 31; i++) {
    if (i < billingCycleDates.length) {
      const dateStr = formatDateKey(billingCycleDates[i])
      const record = attendanceData[dateStr]
      fnRow.push(record?.fn ? "X" : "")
      anRow.push(record?.an ? "X" : "")
    } else {
      fnRow.push("")
      anRow.push("")
    }
  }

  autoTable(doc, {
    startY: 46,
    head: [colHeaders],
    body: [fnRow, anRow],
    theme: "grid",
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: "center",
      valign: "middle",
    },
    bodyStyles: {
      fontSize: 8,
      halign: "center",
      textColor: [15, 23, 42],
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [241, 245, 249], cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
  })

  const tableBottom = (doc as any).lastAutoTable.finalY || 65

  // 4. Certification Text
  const todayStr = new Date().toLocaleDateString("en-GB") // DD/MM/YYYY
  const daysString = `${row.regularDays.toFixed(1)} (figures) ${daysToWords(row.regularDays)} (words) (including holidays duty if any)`

  // Certification paragraph
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(30, 41, 59)

  const certText = `Certified that Sri/Smt ${row.name} Recruited through the Employment Exchange/Local notification has/have attended duty for ${row.regularDays.toFixed(1)} Days consecutively during the month of ${monthName} ${year} and have not completed 179 days on duty as on ${todayStr} today.`

  // Wrap text
  const splitCert = doc.splitTextToSize(certText, pageWidth - margin * 2)
  doc.text(splitCert, margin, tableBottom + 10)

  // Total Days Line
  doc.setFont("Helvetica", "bold")
  doc.text(`Total Days Attended: `, margin, tableBottom + 22)
  doc.setFont("Helvetica", "normal")
  doc.text(daysString, margin + 36, tableBottom + 22)

  // 5. Holiday dates worked
  // Find all holiday dates
  const holidayDatesWorked: string[] = []
  billingCycleDates.forEach((date) => {
    const dateStr = formatDateKey(date)
    const rec = attendanceData[dateStr]
    if (rec?.holiday && (rec?.fn || rec?.an)) {
      const dParts = dateStr.split("-")
      holidayDatesWorked.push(`${dParts[2]}/${dParts[1]}/${dParts[0]}`)
    }
  })

  const holidayStr =
    holidayDatesWorked.length > 0 ? holidayDatesWorked.join(", ") : "None"
  doc.setFont("Helvetica", "bold")
  doc.text(`Holiday Dates Worked: `, margin, tableBottom + 28)
  doc.setFont("Helvetica", "normal")
  doc.text(holidayStr, margin + 40, tableBottom + 28)

  // 6. Signatories Block (Assistant, SO, AR, DR)
  const sigY = pageHeight - 16
  const colWidth = (pageWidth - margin * 2) / 4

  doc.setFont("Helvetica", "normal")
  doc.setFontSize(9)

  // Drawing signature lines and text
  const signatories = [
    { title: "Assistant", x: margin + colWidth * 0.5 },
    { title: "SO (Section Officer)", x: margin + colWidth * 1.5 },
    { title: "AR (Assistant Registrar)", x: margin + colWidth * 2.5 },
    { title: "DR (Deputy Registrar)", x: margin + colWidth * 3.5 },
  ]

  signatories.forEach((sig) => {
    // Draw horizontal line above the text
    doc.setDrawColor(148, 163, 184) // Slate-400
    doc.line(sig.x - 22, sigY - 5, sig.x + 22, sigY - 5)
    // Draw text
    doc.text(sig.title, sig.x, sigY, { align: "center" })
  })

  // Save PDF
  const sanitizedEmployeeName = row.name.replace(/[^a-zA-Z0-9]/g, "_")
  doc.save(`Receipt_${sanitizedEmployeeName}_${monthName}_${year}.pdf`)
}
