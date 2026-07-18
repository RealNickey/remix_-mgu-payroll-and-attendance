import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { PayrollRow } from "./db"
import type { WageSettings, JobCategory } from "./types"
import { formatIndianRupees, daysToWords, formatDateKey } from "./payrollUtils"
import { NOTO_SANS_MALAYALAM_BASE64 } from "./malayalamFont"

export function generateSummaryReport(
  payroll: PayrollRow[],
  monthName: string,
  year: number,
  cycleStartStr: string,
  cycleEndStr: string,
  sectionName?: string,
  asPreview?: boolean
): { url: string; filename: string } | void {
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
  const displaySection = ((sectionName || "Ad.B5") + " SECTION").toUpperCase()
  doc.text(displaySection, pageWidth / 2, 26, { align: "center" })

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
  const filename = `Disbursement_Summary_${monthName}_${year}.pdf`
  if (asPreview) {
    return { url: URL.createObjectURL(doc.output("blob")), filename }
  }
  doc.save(filename)
}

export function generateAttendanceReport(
  payroll: PayrollRow[],
  monthName: string,
  year: number,
  sectionName?: string,
  asPreview?: boolean
): { url: string; filename: string } | void {
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
  const displaySection = ((sectionName || "Ad.B5") + " SECTION").toUpperCase()
  doc.text(displaySection, pageWidth / 2, 26, { align: "center" })

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

  const filename = `Attendance_Report_${monthName}_${year}.pdf`
  if (asPreview) {
    return { url: URL.createObjectURL(doc.output("blob")), filename }
  }
  doc.save(filename)
}

function rupeesToMalayalamWords(num: number): string {
  const value = Math.round(num) // Round to nearest integer
  if (value === 0) return "പൂജ്യം"

  const units = [
    "",
    "ഒന്ന്",
    "രണ്ട്",
    "മൂന്ന്",
    "നാല്",
    "അഞ്ച്",
    "ആറ്",
    "ഏഴ്",
    "എട്ട്",
    "ഒൻപത്",
  ]
  const teens = [
    "പത്ത്",
    "പതിനൊന്ന്",
    "പന്ത്രണ്ട്",
    "പതിമൂന്ന്",
    "പതിനാല്",
    "പതിനഞ്ച്",
    "പതിനാറ്",
    "പതിനേഴ്",
    "പതിനെട്ട്",
    "പത്തൊൻപത്",
  ]
  const tens = [
    "",
    "",
    "ഇരുപത്",
    "മുപ്പത്",
    "നാൽപത്",
    "അൻപത്",
    "അറുപത്",
    "എഴുപത്",
    "എൺപത്",
    "തൊണ്ണൂറ്",
  ]

  function formatBelow100(n: number): string {
    if (n < 10) return units[n]
    if (n < 20) return teens[n - 10]

    const tenPart = Math.floor(n / 10)
    const unitPart = n % 10

    if (unitPart === 0) return tens[tenPart]

    const compoundingPrefixes = [
      "",
      "",
      "ഇരുപത്തി",
      "മുപ്പത്തി",
      "നാൽപത്തി",
      "അൻപത്തി",
      "അറുപത്തി",
      "എഴുപത്തി",
      "എൺപത്തി",
      "തൊണ്ണൂറ്റി",
    ]
    return compoundingPrefixes[tenPart] + units[unitPart]
  }

  function formatBelow1000(n: number): string {
    if (n < 100) return formatBelow100(n)
    const hundredPart = Math.floor(n / 100)
    const remainder = n % 100

    let hundredWord = ""
    if (hundredPart === 1) hundredWord = "നൂറ്"
    else if (hundredPart === 2) hundredWord = "ഇരുന്നൂറ്"
    else if (hundredPart === 3) hundredWord = "മുന്നൂറ്"
    else if (hundredPart === 4) hundredWord = "നാനൂറ്"
    else if (hundredPart === 5) hundredWord = "അഞ്ഞൂറ്"
    else if (hundredPart === 6) hundredWord = "അറുനൂറ്"
    else if (hundredPart === 7) hundredWord = "എഴുനൂറ്"
    else if (hundredPart === 8) hundredWord = "എണ്ണൂറ്"
    else if (hundredPart === 9) hundredWord = "തൊള്ളായിരം"

    if (remainder === 0) return hundredWord

    let hundredPrefix = ""
    if (hundredPart === 1) hundredPrefix = "നൂറ്റി"
    else if (hundredPart === 2) hundredPrefix = "ഇരുന്നൂറ്റി"
    else if (hundredPart === 3) hundredPrefix = "മുന്നൂറ്റി"
    else if (hundredPart === 4) hundredPrefix = "നാനൂറ്റി"
    else if (hundredPart === 5) hundredPrefix = "അഞ്ഞൂറ്റി"
    else if (hundredPart === 6) hundredPrefix = "അറുനൂറ്റി"
    else if (hundredPart === 7) hundredPrefix = "എഴുനൂറ്റി"
    else if (hundredPart === 8) hundredPrefix = "എണ്ണൂറ്റി"
    else if (hundredPart === 9) hundredPrefix = "തൊള്ളായിരത്തി"

    return hundredPrefix + " " + formatBelow100(remainder)
  }

  function formatBelow100000(n: number): string {
    if (n < 1000) return formatBelow1000(n)
    const thousandPart = Math.floor(n / 1000)
    const remainder = n % 1000

    let thousandWord = ""
    if (thousandPart === 1) thousandWord = "ആയിരത്തി"
    else {
      if (thousandPart === 10) {
        thousandWord = "പതിനായിരത്തി"
      } else if (thousandPart === 20) {
        thousandWord = "ഇരുപതിനായിരത്തി"
      } else if (thousandPart === 30) {
        thousandWord = "മുപ്പതിനായിരത്തി"
      } else if (thousandPart === 40) {
        thousandWord = "നാൽപതിനായിരത്തി"
      } else if (thousandPart === 50) {
        thousandWord = "അൻപതിനായിരത്തി"
      } else if (thousandPart === 60) {
        thousandWord = "അറുപതിനായിരത്തി"
      } else if (thousandPart === 70) {
        thousandWord = "എഴുപതിനായിരത്തി"
      } else if (thousandPart === 80) {
        thousandWord = "എൺപതിനായിരത്തി"
      } else if (thousandPart === 90) {
        thousandWord = "തൊണ്ണൂറായിരത്തി"
      } else {
        const prefixes: Record<number, string> = {
          2: "രണ്ടായിരത്തി",
          3: "മൂന്നായിരത്തി",
          4: "നാലായിരത്തി",
          5: "അയ്യായിരത്തി",
          6: "ആറായിരത്തി",
          7: "ഏഴായിരത്തി",
          8: "എട്ടായിരത്തി",
          9: "ഒൻപതിനായിരത്തി",
        }
        if (prefixes[thousandPart]) {
          thousandWord = prefixes[thousandPart]
        } else {
          thousandWord = formatBelow100(thousandPart) + " ആയിരത്തി"
        }
      }
    }

    if (remainder === 0) {
      if (thousandPart === 1) return "ആയിരം"
      if (thousandPart === 10) return "പതിനായിരം"
      if (thousandPart === 20) return "ഇരുപതിനായിരം"
      if (thousandPart === 30) return "മുപ്പതിനായിരം"
      if (thousandPart === 40) return "നാൽപതിനായിരം"
      if (thousandPart === 50) return "അൻപതിനായിരം"
      if (thousandPart === 60) return "അറുപതിനായിരം"
      if (thousandPart === 70) return "എഴുപതിനായിരം"
      if (thousandPart === 80) return "എൺപതിനായിരം"
      if (thousandPart === 90) return "തൊണ്ണൂറായിരം"

      const suffixes: Record<number, string> = {
        2: "രണ്ടായിരം",
        3: "മൂന്നായിരം",
        4: "നാലായിരം",
        5: "അയ്യായിരം",
        6: "ആറായിരം",
        7: "ഏഴായിരം",
        8: "എട്ടായിരം",
        9: "ഒൻപതിനായിരം",
      }
      if (suffixes[thousandPart]) return suffixes[thousandPart]

      return formatBelow100(thousandPart) + " ആയിരം"
    }

    return thousandWord + " " + formatBelow1000(remainder)
  }

  return formatBelow100000(value)
}

export function generateEmployeeReceipt(
  row: PayrollRow,
  attendanceData: Record<string, any>,
  billingCycleDates: Date[],
  monthName: string,
  year: number,
  sectionName?: string,
  asPreview?: boolean
): { url: string; filename: string } | void {
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
  const displaySection = ((sectionName || "Ad.B5") + " SECTION").toUpperCase()
  doc.text(displaySection, pageWidth / 2, 20, { align: "center" })

  doc.setFont("Helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text(
    `Attendance sheet for the month of ${monthName} ${year}`,
    pageWidth / 2,
    26,
    { align: "center" }
  )

  // 2. Employee Info & Contract U.O. details
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)

  // Left Details
  doc.text(`Name of Employee: Sri/Smt. ${row.name}`, margin, 35)
  doc.text(`Designation: ${row.category}`, margin, 40)

  // Right Details (U.O. reference)
  const goNumber =
    row.relevantContract?.goNumber ||
    "......................................................."
  let goDateFormatted = "..................................."
  if (row.relevantContract?.goDate) {
    const dParts = row.relevantContract.goDate.split("-")
    goDateFormatted = `${dParts[2]}/${dParts[1]}/${dParts[0]}`
  }

  doc.text(`U.O. No: ${goNumber}`, pageWidth - margin - 120, 35)
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

  // === 7. Second Page (Malayalam Receipts) ===
  doc.addPage("a4", "portrait")

  // Register Malayalam Font
  doc.addFileToVFS("NotoSansMalayalam-Regular.ttf", NOTO_SANS_MALAYALAM_BASE64)
  doc.addFont("NotoSansMalayalam-Regular.ttf", "NotoSansMalayalam", "normal")

  const pWidth = doc.internal.pageSize.width // 210mm
  const pHeight = doc.internal.pageSize.height // 297mm
  const pMargin = 20
  const usableWidth = pWidth - pMargin * 2 // 170mm

  // Draw cut line / divider in the middle
  doc.setDrawColor(203, 213, 225) // Slate-300
  doc.setLineWidth(0.4)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(pMargin, pHeight / 2, pWidth - pMargin, pHeight / 2)
  doc.setLineDashPattern([], 0) // reset dash pattern

  // --- RECEIPT 1 (Top half) ---
  const r1Start = 20

  // Title: "രസീത്"
  doc.setFont("NotoSansMalayalam", "normal")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  const title1 = "രസീത്"
  doc.text(title1, pWidth / 2, r1Start + 10, { align: "center" })

  // Underline for title
  const title1Width = doc.getTextWidth(title1)
  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(0.4)
  doc.line(
    pWidth / 2 - title1Width / 2,
    r1Start + 12,
    pWidth / 2 + title1Width / 2,
    r1Start + 12
  )

  // Body text 1
  doc.setFontSize(11)
  const bodyText1 =
    "മഹാത്മാ ഗാന്ധി സർവകലാശാലയിൽ ദിവസ വേതന വ്യവസ്ഥയിൽ ജോലി ചെയ്യുന്ന എനിക്ക് പ്രതിഫല തുക മാസാവസാനം ഒരുമിച്ചു നൽകണമെന്ന് അപേക്ഷിക്കുന്നു."
  const splitText1 = doc.splitTextToSize(bodyText1, usableWidth)
  doc.text(splitText1, pMargin, r1Start + 24, { lineHeightFactor: 1.6 })

  // Footer elements
  const r1FooterY = r1Start + 56
  doc.setFontSize(10.5)
  // Left Column
  doc.text("പ്രിയദർശിനി ഹിൽസ്", pMargin, r1FooterY)
  doc.text("തീയതി :", pMargin, r1FooterY + 8)

  // Right Column
  const rightColX = pWidth - pMargin - 65
  doc.text("ഒപ്പ്", rightColX, r1FooterY)
  doc.text(`പേര് : ${row.name}`, rightColX, r1FooterY + 8)
  doc.text("വിലാസം :", rightColX, r1FooterY + 16)

  // --- RECEIPT 2 (Bottom half) ---
  const r2Start = pHeight / 2 + 15

  // Title: "രസീത്"
  doc.setFontSize(14)
  const title2 = "രസീത്"
  doc.text(title2, pWidth / 2, r2Start + 10, { align: "center" })

  // Underline
  const title2Width = doc.getTextWidth(title2)
  doc.line(
    pWidth / 2 - title2Width / 2,
    r2Start + 12,
    pWidth / 2 + title2Width / 2,
    r2Start + 12
  )

  // Body text 2 with dynamic values
  doc.setFontSize(11)
  const amountInWords = rupeesToMalayalamWords(row.totalPay)
  const formattedPay = row.totalPay.toLocaleString("en-IN")
  const bodyText2 = `മഹാത്മാ ഗാന്ധി സർവകലാശാലയിൽ ${monthName} ${year} ലെ ${row.regularDays.toFixed(1)} ദിവസത്തേക്കുള്ള കൂലിയായി Rs. ${formattedPay}/- (രൂപ ${amountInWords} മാത്രം) മഹാത്മാ ഗാന്ധി സർവകലാശാല ഫിനാൻസ് ഓഫിസർ പക്കൽനിന്നും കൈപ്പറ്റിയിരിക്കുന്നു.`
  const splitText2 = doc.splitTextToSize(bodyText2, usableWidth)
  doc.text(splitText2, pMargin, r2Start + 24, { lineHeightFactor: 1.6 })

  // Footer elements
  const r2FooterY = r2Start + 56
  doc.setFontSize(10.5)
  // Left Column
  doc.text("പ്രിയദർശിനി ഹിൽസ്", pMargin, r2FooterY)
  doc.text("തീയതി :", pMargin, r2FooterY + 8)

  // Right Column
  doc.text("ഒപ്പ്", rightColX, r2FooterY)
  doc.text(`പേര് : ${row.name}`, rightColX, r2FooterY + 8)
  doc.text("വിലാസം :", rightColX, r2FooterY + 16)

  // Save PDF
  const sanitizedEmployeeName = row.name.replace(/[^a-zA-Z0-9]/g, "_")
  const filename = `Receipt_${sanitizedEmployeeName}_${monthName}_${year}.pdf`
  if (asPreview) {
    return { url: URL.createObjectURL(doc.output("blob")), filename }
  }
  doc.save(filename)
}

export function generateSettingsPreview(settings: WageSettings) {
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
  doc.setTextColor(30, 41, 59) // Slate-800
  doc.text("MAHATMA GANDHI UNIVERSITY", pageWidth / 2, 20, { align: "center" })

  doc.setFont("Helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(71, 85, 105) // Slate-600
  const displaySection = ((settings.section || "Ad.B5") + " SECTION").toUpperCase()
  doc.text(displaySection, pageWidth / 2, 26, { align: "center" })

  doc.setFont("Helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42) // Slate-900
  doc.text("Wage & Overtime Policy Configuration", pageWidth / 2, 34, {
    align: "center",
  })

  // Date details
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Policy Status: Proposed / Active`, margin, 44)
  doc.text(
    `Export Date: ${new Date().toLocaleDateString("en-GB")}`,
    pageWidth - margin,
    44,
    { align: "right" }
  )

  // Divider line
  doc.setDrawColor(203, 213, 225) // Slate-300
  doc.setLineWidth(0.5)
  doc.line(margin, 46, pageWidth - margin, 46)

  // Table Data setup
  const categories: JobCategory[] = ["Gardeners", "Drivers", "Cooks", "Helpers"]
  const tableData = categories.map((cat, index) => {
    const dailyWage = settings.wageRates[cat] || 0
    const otRate = settings.otRates?.[cat] ?? settings.otRate ?? 0
    const otCeiling = settings.otCeilings?.[cat] ?? 0
    return [
      index + 1,
      cat,
      formatIndianRupees(dailyWage),
      formatIndianRupees(otRate),
      formatIndianRupees(otCeiling),
    ]
  })

  autoTable(doc, {
    startY: 50,
    head: [
      [
        "Sl. No.",
        "Employee Category",
        "Daily Base Wage Rate (₹)",
        "Overtime Rate (₹ / Day)",
        "Overtime Monthly Ceiling (₹)",
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
      1: { cellWidth: 45 },
      2: { cellWidth: 40, halign: "right" },
      3: { cellWidth: 40, halign: "right" },
      4: { cellWidth: 40, halign: "right" },
    },
    margin: { left: margin, right: margin },
  })

  const tableBottom = (doc as any).lastAutoTable.finalY || 80

  // Summary and Rules
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(10.5)
  doc.setTextColor(30, 41, 59)
  doc.text("Policy Guidelines & Calculations:", margin, tableBottom + 12)

  doc.setFont("Helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(71, 85, 105)

  const guidelines = [
    "1. Daily Base Wages are computed for both Forenoon (FN) and Afternoon (AN) sessions.",
    "2. Overtime is logged in days and calculated using the category-specific Overtime Rate.",
    "3. Overtime pay for any individual employee is strictly capped at the designated Monthly Ceiling.",
    "4. If a category's Overtime Rate is set to 0, overtime pay calculations are disabled for that category.",
  ]

  guidelines.forEach((g, idx) => {
    doc.text(g, margin + 2, tableBottom + 18 + idx * 6)
  })

  // Signatories block
  const sigY = doc.internal.pageSize.height - 25
  const colWidth = (pageWidth - margin * 2) / 3

  doc.setFont("Helvetica", "normal")
  doc.setFontSize(9)

  const signatories = [
    { title: "Prepared By (Section Assistant)", x: margin + colWidth * 0.5 },
    { title: "Verified By (Section Officer)", x: margin + colWidth * 1.5 },
    { title: "Approved By (Registrar)", x: margin + colWidth * 2.5 },
  ]

  signatories.forEach((sig) => {
    doc.setDrawColor(148, 163, 184)
    doc.line(sig.x - 25, sigY - 5, sig.x + 25, sigY - 5)
    doc.text(sig.title, sig.x, sigY, { align: "center" })
  })

  doc.save("Wage_and_Overtime_Rates_Policy.pdf")
}
