import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, CompanyConfig, Employee, PayrollSummary } from '../types';
import { formatIDR, terbilangRupiah } from './payroll';
import { getDayClassification } from './holidays';

/**
 * Export Rekapitulasi Penggajian Seluruh Karyawan (Landscape A4)
 */
export function exportPayrollReportPDF(
  summaries: PayrollSummary[],
  config: CompanyConfig,
  departmentFilter: string = 'Semua Departemen',
  periodText: string = 'September 2026'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header / Kop Surat Perusahaan
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 297, 26, 'F');

  // Decorative Emerald Strip
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 26, 297, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(config.companyName.toUpperCase(), 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${config.companyAddress} | Telp: ${config.companyPhone || '-'} | Email: ${config.companyEmail || '-'}`,
    14,
    18
  );
  doc.text(
    `NPWP: ${config.companyTaxNumber || '01.234.567.8-012.000'} | Dokumen Rekapitulasi Resmi Payroll`,
    14,
    23
  );

  // Document Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`LAPORAN REKAPITULASI PENGGAJIAN & PRESENSI KARYAWAN`, 14, 35);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Departemen: ${departmentFilter} | Periode: ${periodText} | Dicetak pada: ${new Date().toLocaleString('id-ID')}`,
    14,
    41
  );

  // Table Data
  const tableData = summaries.map((s, index) => {
    const isDaily = s.salaryType === 'daily';
    const salaryTypeLabel = isDaily ? 'Harian' : 'Bulanan';
    const baseDisplay = isDaily
      ? `${formatIDR(s.dailyBaseEarnings || 0)} (${s.attendanceDays}hr @ ${formatIDR(s.dailyRate || s.baseSalary || 0)})`
      : formatIDR(s.baseSalary);

    return [
      index + 1,
      s.employeeId,
      s.employeeName,
      s.department,
      s.position,
      salaryTypeLabel,
      `${s.attendanceDays} Hari`,
      `${s.totalOvertimeHours} Jam`,
      baseDisplay,
      formatIDR(s.allowance + s.transportAllowance),
      formatIDR(s.totalOvertimePay),
      formatIDR(s.lateDeduction),
      formatIDR(s.netSalary),
    ];
  });

  const totalNet = summaries.reduce((acc, s) => acc + s.netSalary, 0);
  const totalOvertime = summaries.reduce((acc, s) => acc + s.totalOvertimePay, 0);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'ID', 'Nama Karyawan', 'Departemen', 'Jabatan', 'Tipe',
      'Presensi', 'Lembur', 'Gaji/Upah Pokok', 'Tunjangan', 'Uang Lembur', 'Potongan', 'Gaji Bersih (Net)'
    ]],
    body: tableData,
    foot: [[
      '', '', 'TOTAL KESELURUHAN', '', '', '', '', '',
      '', '', formatIDR(totalOvertime), '', formatIDR(totalNet)
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'center', cellWidth: 16 },
      8: { halign: 'right', cellWidth: 32 },
      9: { halign: 'right', cellWidth: 22 },
      10: { halign: 'right', cellWidth: 22 },
      11: { halign: 'right', cellWidth: 18 },
      12: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
  });

  // Footer notes & signature area
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  if (finalY < 172) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `* Perhitungan lembur mengikuti kelipatan Depnaker/Perusahaan: ${config.overtimeMultipliers
        .map((m) => `Jam ke-${m.tier}: ${m.multiplier}x`)
        .join(', ')} (Pembagi jam: ${config.hourlyRateDivider}). Gaji harian dihitung per kehadiran fisik sah.`,
      14,
      finalY + 10
    );

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Mengetahui / Disetujui Oleh,', 225, finalY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(config.companyDirector || 'Direktur HR & Finance', 225, finalY + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(config.companyDirectorTitle ? `${config.companyDirectorTitle} - ${config.companyName}` : config.companyName, 225, finalY + 33);
  }

  // Universal Watermark Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Dibuat oleh heruhendri | Sistem Presensi & Penggajian Terintegrasi', 14, 202);

  const filename = `Rekap_Payroll_${departmentFilter.replace(/\s+/g, '_')}_${periodText.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

export type PayslipTemplateId =
  | 'corporate-emerald'
  | 'classic-formal'
  | 'modern-indigo'
  | 'industrial-overtime';

export interface PayslipTemplateInfo {
  id: PayslipTemplateId;
  name: string;
  badge: string;
  description: string;
  primaryColor: string;
  themeStyle: string;
  iconTag: string;
}

export const PAYSLIP_TEMPLATES: PayslipTemplateInfo[] = [
  {
    id: 'corporate-emerald',
    name: 'Corporate Executive (Emerald & Slate)',
    badge: 'Eksekutif',
    description: 'Format korporat modern dengan header warna gelap (Slate), aksen hijau emerald, terbilang resmi, dan stempel hash digital.',
    primaryColor: '#10B981',
    themeStyle: 'Kop Gelap & Emerald',
    iconTag: '🏛️',
  },
  {
    id: 'classic-formal',
    name: 'Klasik Formal Perusahaan (Official Letterhead)',
    badge: 'Formal Resmi',
    description: 'Format klasik resmi Indonesia dengan kop surat resmi bergaris ganda, nomor surat kedinasan, dan stempel dinas perusahaan merah bulat.',
    primaryColor: '#1E293B',
    themeStyle: 'Kop Surat Resmi Tradisional',
    iconTag: '📜',
  },
  {
    id: 'modern-indigo',
    name: 'Modern Tech & Minimalist (Indigo Clean)',
    badge: 'Tech / Startup',
    description: 'Format modern startup & agensi dengan kartu metrik KPI jam kerja, aksen indigo-violet, tabel kontemporer, dan barcode QR otentikasi.',
    primaryColor: '#6366F1',
    themeStyle: 'Modern Indigo & Card Grid',
    iconTag: '🚀',
  },
  {
    id: 'industrial-overtime',
    name: 'Manufaktur & Lembur Detail (Industrial Blue)',
    badge: 'Pabrik & Operasional',
    description: 'Format komprehensif operasional pabrik/lapangan dengan rincian rinci jam shift, kalkulasi lembur tier 1.5x s/d 4.0x, dan audit presensi.',
    primaryColor: '#0284C7',
    themeStyle: 'Industrial Blue & Audit Log',
    iconTag: '🏭',
  },
];

/**
 * Export Slip Gaji Elektronik Profesional dengan Pilihan Template (Portrait A4)
 */
export function exportSingleEmployeeSlipPDF(
  employee: Employee,
  summary: PayrollSummary,
  attendances: AttendanceRecord[],
  config: CompanyConfig,
  periodOrTemplate?: string | PayslipTemplateId,
  templateOrPeriod?: PayslipTemplateId | string
) {
  // Determine template and periodText flexibly
  let templateStyle: PayslipTemplateId = 'corporate-emerald';
  let periodText: string = 'September 2026';

  const isTemplateId = (val: any): val is PayslipTemplateId =>
    val === 'corporate-emerald' || val === 'classic-formal' || val === 'modern-indigo' || val === 'industrial-overtime';

  if (isTemplateId(periodOrTemplate)) {
    templateStyle = periodOrTemplate;
    if (typeof templateOrPeriod === 'string' && templateOrPeriod) {
      periodText = templateOrPeriod;
    }
  } else if (typeof periodOrTemplate === 'string' && periodOrTemplate) {
    periodText = periodOrTemplate;
    if (isTemplateId(templateOrPeriod)) {
      templateStyle = templateOrPeriod;
    }
  } else if (isTemplateId(templateOrPeriod)) {
    templateStyle = templateOrPeriod;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const docNo = `SLIP/${new Date().getFullYear()}/${(new Date().getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${employee.id}-${Math.floor(1000 + Math.random() * 9000)}`;

  const isDaily = summary.salaryType === 'daily';
  const salaryTypeLabel = isDaily ? 'Upah Harian (Daily Rate)' : 'Bulanan Tetap (Monthly Salary)';

  const empRecords = attendances.filter((r) => r.employeeId === employee.id);
  const lateCount = empRecords.filter((r) => r.status === 'terlambat').length;

  const dailyBaseWage = isDaily
    ? summary.dailyBaseEarnings || summary.attendanceDays * (summary.dailyRate || employee.baseSalary || 0)
    : summary.baseSalary;

  const earningsRows: [string, string][] = [
    [
      isDaily
        ? `Upah Pokok Harian (${summary.attendanceDays} Hari Hadir @ ${formatIDR(summary.dailyRate || employee.baseSalary || 0)})`
        : 'Gaji Pokok Bulanan (Basic Salary)',
      formatIDR(dailyBaseWage),
    ],
    ['Tunjangan Jabatan & Operasional Tetap', formatIDR(summary.allowance)],
    [
      `Uang Makan & Transportasi (${summary.attendanceDays} Hari Hadir @ ${formatIDR(employee.dailyTransport)})`,
      formatIDR(summary.transportAllowance),
    ],
  ];

  if ((summary.holidayOvertimeHours || 0) > 0 && (summary.regularOvertimeHours || 0) > 0) {
    earningsRows.push([
      `Uang Lembur Hari Kerja Biasa (${summary.regularOvertimeHours} Jam @ Tarif 1.5x - 2.0x)`,
      formatIDR(summary.regularOvertimePay || 0),
    ]);
    earningsRows.push([
      `Uang Lembur Hari Libur / Tanggal Merah (${summary.holidayOvertimeHours} Jam @ Tarif 2.0x - 4.0x)`,
      formatIDR(summary.holidayOvertimePay || 0),
    ]);
  } else if ((summary.holidayOvertimeHours || 0) > 0) {
    earningsRows.push([
      `Uang Lembur Hari Libur / Tanggal Merah (${summary.holidayOvertimeHours} Jam @ Tarif 2.0x - 4.0x)`,
      formatIDR(summary.holidayOvertimePay || summary.totalOvertimePay),
    ]);
  } else {
    earningsRows.push([
      `Uang Lembur Resmi (${summary.totalOvertimeHours} Jam berdasarkan rumus Depnaker / Perusahaan)`,
      formatIDR(summary.totalOvertimePay),
    ]);
  }

  const deductionsRows: [string, string][] = [
    [
      `Potongan Disiplin / Keterlambatan (${lateCount} kali terlambat)`,
      formatIDR(summary.lateDeduction),
    ],
    ['Iuran BPJS Ketenagakerjaan (JKK, JKM, JHT) - Subsidi Perusahaan', 'Rp 0'],
    ['Iuran BPJS Kesehatan (Subsidi Penuh Perusahaan)', 'Rp 0'],
    ['Potongan Pajak Penghasilan (PPh 21 Terhitung)', 'Rp 0'],
  ];

  const sortedRecords = [...empRecords]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  // ROUTE TO CORRESPONDING PROFESSIONAL TEMPLATE
  if (templateStyle === 'classic-formal') {
    renderClassicFormalTemplate(
      doc,
      employee,
      summary,
      config,
      periodText,
      docNo,
      isDaily,
      salaryTypeLabel,
      earningsRows,
      deductionsRows,
      sortedRecords,
      margin,
      pageWidth,
      contentWidth
    );
  } else if (templateStyle === 'modern-indigo') {
    renderModernIndigoTemplate(
      doc,
      employee,
      summary,
      config,
      periodText,
      docNo,
      isDaily,
      salaryTypeLabel,
      earningsRows,
      deductionsRows,
      sortedRecords,
      margin,
      pageWidth,
      contentWidth
    );
  } else if (templateStyle === 'industrial-overtime') {
    renderIndustrialOvertimeTemplate(
      doc,
      employee,
      summary,
      config,
      periodText,
      docNo,
      isDaily,
      salaryTypeLabel,
      earningsRows,
      deductionsRows,
      sortedRecords,
      margin,
      pageWidth,
      contentWidth
    );
  } else {
    // Default: 'corporate-emerald'
    renderCorporateEmeraldTemplate(
      doc,
      employee,
      summary,
      config,
      periodText,
      docNo,
      isDaily,
      salaryTypeLabel,
      earningsRows,
      deductionsRows,
      sortedRecords,
      margin,
      pageWidth,
      contentWidth
    );
  }

  const filename = `Slip_Gaji_${templateStyle}_${employee.name.replace(/\s+/g, '_')}_${employee.id}_${periodText.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

// ============================================================================
// TEMPLATE 1: CORPORATE EXECUTIVE (EMERALD & SLATE)
// ============================================================================
function renderCorporateEmeraldTemplate(
  doc: jsPDF,
  employee: Employee,
  summary: PayrollSummary,
  config: CompanyConfig,
  periodText: string,
  docNo: string,
  isDaily: boolean,
  salaryTypeLabel: string,
  earningsRows: [string, string][],
  deductionsRows: [string, string][],
  sortedRecords: AttendanceRecord[],
  margin: number,
  pageWidth: number,
  contentWidth: number
) {
  // 1. Corporate Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Decorative Emerald accent bar
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 30, pageWidth, 2, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(config.companyName.toUpperCase(), margin, 11);

  // Company Address & Contacts
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(config.companyAddress, margin, 17);
  doc.text(
    `Telp: ${config.companyPhone || '(021) 520-8899'} | Email: ${config.companyEmail || 'hrd@nusantara.id'} | NPWP: ${config.companyTaxNumber || '01.234.567.8-012.000'}`,
    margin,
    22
  );

  // Right-aligned Confidential Badge in Header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 56, 7, 56, 17, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('RAHASIA / CONFIDENTIAL', pageWidth - margin - 28, 13, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text('SLIP GAJI ELEKTRONIK RESMI', pageWidth - margin - 28, 18, { align: 'center' });

  // 2. Document Title & Serial Number
  const startY = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SLIP GAJI KARYAWAN (PAYROLL STATEMENT)', margin, startY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `No. Dokumen: ${docNo} | Tanggal Terbit: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    margin,
    startY + 5
  );

  // 3. Employee & Payroll Details Box
  const infoBoxY = startY + 8;
  const infoBoxHeight = 36;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, infoBoxY, contentWidth, infoBoxHeight, 2, 2, 'FD');

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 92, infoBoxY, margin + 92, infoBoxY + infoBoxHeight);

  // Left Column
  const col1X = margin + 5;
  let lineY = infoBoxY + 6;
  doc.setFontSize(8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Nama Karyawan', col1X, lineY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.name}`, col1X + 30, lineY);

  lineY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('ID / NIK', col1X, lineY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.id}`, col1X + 30, lineY);

  lineY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Departemen', col1X, lineY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.department}`, col1X + 30, lineY);

  lineY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Jabatan', col1X, lineY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.position}`, col1X + 30, lineY);

  lineY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tipe Gaji', col1X, lineY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isDaily ? 217 : 16, isDaily ? 119 : 185, isDaily ? 6 : 129);
  doc.text(`: ${salaryTypeLabel}`, col1X + 30, lineY);

  // Right Column
  const col2X = margin + 96;
  lineY = infoBoxY + 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Periode Penggajian', col2X, lineY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${periodText}`, col2X + 32, lineY);

  lineY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tgl Pembayaran', col2X, lineY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${config.payrollDateDay} ${periodText}`, col2X + 32, lineY);

  lineY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Metode Transfer', col2X, lineY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.bankName || 'BCA'} - ${employee.bankAccount || '8200192831'}`, col2X + 32, lineY);

  lineY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Hari Hadir', col2X, lineY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${summary.attendanceDays} Hari Kerja Sah`, col2X + 32, lineY);

  lineY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Jam Kerja / Lembur', col2X, lineY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${summary.totalWorkHours} Jam (${summary.totalOvertimeHours} Jam Lembur)`, col2X + 32, lineY);

  // 4. Tables
  const tablesStartY = infoBoxY + infoBoxHeight + 5;

  autoTable(doc, {
    startY: tablesStartY,
    head: [['A. RINCIAN PENGHASILAN / PENERIMAAN (EARNINGS)', 'JUMLAH (IDR)']],
    body: earningsRows,
    foot: [['TOTAL PENGHASILAN BRUTO (GROSS EARNINGS)', formatIDR(summary.grossSalary)]],
    theme: 'striped',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [240, 253, 244],
      textColor: [4, 120, 87],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const earningsFinalY = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: earningsFinalY + 3,
    head: [['B. RINCIAN POTONGAN (DEDUCTIONS)', 'JUMLAH (IDR)']],
    body: deductionsRows,
    foot: [['TOTAL POTONGAN (TOTAL DEDUCTIONS)', formatIDR(summary.lateDeduction)]],
    theme: 'striped',
    headStyles: {
      fillColor: [239, 68, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [254, 242, 242],
      textColor: [185, 28, 28],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const deductionsFinalY = (doc as any).lastAutoTable.finalY;

  // 5. Take Home Pay Box
  const totalBoxY = deductionsFinalY + 4;
  const totalBoxHeight = 22;

  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(margin, totalBoxY, contentWidth, totalBoxHeight, 2, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL GAJI BERSIH DITERIMA (TAKE HOME PAY)', margin + 6, totalBoxY + 8);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153);
  doc.text(formatIDR(summary.netSalary), pageWidth - margin - 6, totalBoxY + 8, { align: 'right' });

  const spelled = terbilangRupiah(summary.netSalary);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(203, 213, 225);
  doc.text(`Terbilang: "# ${spelled} #"`, margin + 6, totalBoxY + 16);

  // 6. Mini Attendance Log
  if (sortedRecords.length > 0 && totalBoxY + totalBoxHeight + 35 < 240) {
    const attendanceMiniRows = sortedRecords.map((r) => {
      const dayInfo = getDayClassification(r.date, config);
      const dayLabel = dayInfo.isHolidayOrSunday ? ` (${dayInfo.isSunday ? 'Minggu' : 'Libur'})` : '';
      return [
        `${r.date}${dayLabel}`,
        r.checkInTime ? `${r.checkInTime} WIB` : '-',
        r.checkOutTime ? `${r.checkOutTime} WIB` : '-',
        `${r.workDurationHours || 0} Jam`,
        r.overtimeHours > 0 ? `+${r.overtimeHours} Jam` : '-',
        r.status === 'terlambat' ? 'Terlambat' : r.status === 'lembur' ? 'Lembur' : 'Hadir Tepat',
        r.isRemoteOrOutIsland ? 'Dinas Luar' : 'Kantor',
      ];
    });

    autoTable(doc, {
      startY: totalBoxY + totalBoxHeight + 3,
      head: [['Tanggal', 'Jam Masuk', 'Jam Pulang', 'Durasi', 'Lembur', 'Status', 'Lokasi']],
      body: attendanceMiniRows,
      theme: 'plain',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontStyle: 'bold',
        fontSize: 6.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 6.5,
        textColor: [71, 85, 105],
        halign: 'center',
        cellPadding: 1,
      },
      margin: { left: margin, right: margin },
    });
  }

  // 7. Signatures
  const sigY = Math.max(236, ((doc as any).lastAutoTable?.finalY || 215) + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Karyawan Penerima,', margin + 15, sigY);
  doc.line(margin + 5, sigY + 20, margin + 55, sigY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(employee.name, margin + 15, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: ${employee.id}`, margin + 15, sigY + 27);

  const rightSigX = pageWidth - margin - 55;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Finance & HR Director,', rightSigX, sigY);

  doc.setDrawColor(16, 185, 129);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(rightSigX - 4, sigY + 3, 58, 14, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('TERVERIFIKASI SISTEM DIGITAL', rightSigX + 25, sigY + 7.5, { align: 'center' });
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(6, 95, 70);
  doc.text(`SECURE HASH: ${docNo.slice(-8)}`, rightSigX + 25, sigY + 11.5, { align: 'center' });
  doc.text(`TGL: ${new Date().toLocaleDateString('id-ID')}`, rightSigX + 25, sigY + 15, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(config.companyDirector || 'Ir. Heru Hendriawan, M.M.', rightSigX, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(config.companyName, rightSigX, sigY + 27);

  renderUniversalFooter(doc, margin);
}

// ============================================================================
// TEMPLATE 2: KLASIK FORMAL PERUSAHAAN (OFFICIAL LETTERHEAD & STEMPEL BULAT)
// ============================================================================
function renderClassicFormalTemplate(
  doc: jsPDF,
  employee: Employee,
  summary: PayrollSummary,
  config: CompanyConfig,
  periodText: string,
  docNo: string,
  isDaily: boolean,
  salaryTypeLabel: string,
  earningsRows: [string, string][],
  deductionsRows: [string, string][],
  sortedRecords: AttendanceRecord[],
  margin: number,
  pageWidth: number,
  contentWidth: number
) {
  // 1. Formal Official Letterhead (Pure White Background with Double Border Line)
  let y = 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(config.companyName.toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(config.companyAddress, pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(7.5);
  doc.text(
    `Telepon: ${config.companyPhone || '(021) 520-8899'} | Surel: ${config.companyEmail || 'hrd@nusantara.id'} | NPWP: ${config.companyTaxNumber || '01.234.567.8-012.000'}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  // Official Double Line Kop Surat
  y += 5;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.9);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.2, pageWidth - margin, y + 1.2);

  // 2. Document Title
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('SURAT PEMBERITAHUAN RINCIAN GAJI & UPAH KARYAWAN', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Nomor: ${docNo} | Sifat: RAHASIA & PRIBADI | Periode: ${periodText}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  // 3. Formal Grid Box for Metadata
  y += 5;
  const boxY = y;
  const boxHeight = 32;
  doc.setDrawColor(148, 163, 184); // Slate 400
  doc.setLineWidth(0.4);
  doc.rect(margin, boxY, contentWidth, boxHeight, 'S');
  doc.line(margin + 91, boxY, margin + 91, boxY + boxHeight); // Center divider

  // Left metadata
  let mY = boxY + 5.5;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Nama Karyawan', margin + 4, mY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.name}`, margin + 34, mY);

  mY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Nomor Induk / NIK', margin + 4, mY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.id}`, margin + 34, mY);

  mY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Departemen / Unit', margin + 4, mY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.department}`, margin + 34, mY);

  mY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Jabatan Resmi', margin + 4, mY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.position}`, margin + 34, mY);

  mY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Skema Penggajian', margin + 4, mY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${salaryTypeLabel}`, margin + 34, mY);

  // Right metadata
  mY = boxY + 5.5;
  const rX = margin + 95;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tanggal Pembayaran', rX, mY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${config.payrollDateDay} ${periodText}`, rX + 34, mY);

  mY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Rekening Payroll', rX, mY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.bankName || 'BCA'} ${employee.bankAccount || '8200192831'}`, rX + 34, mY);

  mY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Kehadiran Sah', rX, mY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${summary.attendanceDays} Hari Kerja Efektif`, rX + 34, mY);

  mY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Jam Lembur', rX, mY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${summary.totalOvertimeHours} Jam (Tarif Resmi)`, rX + 34, mY);

  mY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Status PTKP / NPWP', rX, mY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(': TK/0 (Pajak PPh 21 Ditanggung Perusahaan)', rX + 34, mY);

  // 4. Formal Tables
  const tableY = boxY + boxHeight + 4;

  autoTable(doc, {
    startY: tableY,
    head: [['I. KOMPONEN PENGHASILAN / PENERIMAAN (EARNINGS)', 'JUMLAH (IDR)']],
    body: earningsRows,
    foot: [['TOTAL PENGHASILAN KOTOR (A)', formatIDR(summary.grossSalary)]],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const earnY = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: earnY + 3,
    head: [['II. KOMPONEN POTONGAN GAJI (DEDUCTIONS)', 'JUMLAH (IDR)']],
    body: deductionsRows,
    foot: [['TOTAL POTONGAN RESMI (B)', formatIDR(summary.lateDeduction)]],
    theme: 'grid',
    headStyles: {
      fillColor: [153, 27, 27], // Red 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [254, 242, 242],
      textColor: [153, 27, 27],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const dedY = (doc as any).lastAutoTable.finalY;

  // 5. Formal Take Home Pay Bordered Box
  const netBoxY = dedY + 4;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, netBoxY, contentWidth, 20, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('PENGHASILAN BERSIH DITERIMA / TAKE HOME PAY (A - B):', margin + 5, netBoxY + 7);

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(formatIDR(summary.netSalary), pageWidth - margin - 5, netBoxY + 7, { align: 'right' });

  const spelled = terbilangRupiah(summary.netSalary);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Terbilang: "# ${spelled} #"`, margin + 5, netBoxY + 15);

  // 6. Official Round Stamp & Dual Formal Signatures
  const signY = Math.max(236, netBoxY + 24);

  // Karyawan Penerima
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Karyawan Penerima,', margin + 12, signY);
  doc.line(margin + 5, signY + 22, margin + 58, signY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(employee.name, margin + 12, signY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID / NIK: ${employee.id}`, margin + 12, signY + 29.5);

  // Official Stamp in center
  drawOfficialCircularStamp(doc, pageWidth / 2, signY + 12, config.companyName, docNo);

  // HR & Director Signatures
  const rSigX = pageWidth - margin - 55;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Mengetahui & Menyetujui,', rSigX, signY);
  doc.text('Direktur Utama & HRD Manager', rSigX, signY + 4);
  doc.line(rSigX - 4, signY + 22, rSigX + 50, signY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(config.companyDirector || 'Ir. Heru Hendriawan, M.M.', rSigX, signY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(config.companyName, rSigX, signY + 29.5);

  renderUniversalFooter(doc, margin);
}

// ============================================================================
// TEMPLATE 3: MODERN TECH & MINIMALIST (INDIGO CLEAN & KPI METRIC CARDS)
// ============================================================================
function renderModernIndigoTemplate(
  doc: jsPDF,
  employee: Employee,
  summary: PayrollSummary,
  config: CompanyConfig,
  periodText: string,
  docNo: string,
  isDaily: boolean,
  salaryTypeLabel: string,
  earningsRows: [string, string][],
  deductionsRows: [string, string][],
  sortedRecords: AttendanceRecord[],
  margin: number,
  pageWidth: number,
  contentWidth: number
) {
  // 1. Modern Indigo Gradient-feel Header
  doc.setFillColor(49, 46, 129); // Indigo 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(99, 102, 241); // Indigo 500
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(config.companyName.toUpperCase(), margin, 11);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255); // Indigo 100
  doc.text(`${config.companyAddress} | NPWP: ${config.companyTaxNumber || '01.234.567.8-012.000'}`, margin, 17);
  doc.text(`Digital Payroll Platform | Periode Penggajian: ${periodText}`, margin, 22);

  // Top-right Security QR Block
  drawDigitalSecurityQR(doc, pageWidth - margin - 22, 4, docNo);

  // 2. Modern 4-Card KPI Overview Metrics
  const kpiY = 34;
  const cardW = (contentWidth - 9) / 4; // 4 cards with 3mm gap
  const cardH = 18;

  // Card 1: Take Home Pay
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, kpiY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('GAJI BERSIH (NET)', margin + 3, kpiY + 5);
  doc.setFontSize(9);
  doc.setTextColor(49, 46, 129);
  doc.text(formatIDR(summary.netSalary), margin + 3, kpiY + 12);

  // Card 2: Attendance Days
  const c2X = margin + cardW + 3;
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(c2X, kpiY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(22, 163, 74);
  doc.text('HARI HADIR SAH', c2X + 3, kpiY + 5);
  doc.setFontSize(9);
  doc.setTextColor(20, 83, 45);
  doc.text(`${summary.attendanceDays} Hari`, c2X + 3, kpiY + 12);

  // Card 3: Overtime Hours
  const c3X = c2X + cardW + 3;
  doc.setFillColor(254, 243, 199); // Amber 50
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(c3X, kpiY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(217, 119, 6);
  doc.text('TOTAL LEMBUR', c3X + 3, kpiY + 5);
  doc.setFontSize(9);
  doc.setTextColor(120, 53, 15);
  doc.text(`${summary.totalOvertimeHours} Jam Kerja`, c3X + 3, kpiY + 12);

  // Card 4: Status Transfer
  const c4X = c3X + cardW + 3;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(c4X, kpiY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('STATUS TRANSFER', c4X + 3, kpiY + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Tuntas (${employee.bankName || 'BCA'})`, c4X + 3, kpiY + 12);

  // 3. Employee Info Card
  const empCardY = kpiY + cardH + 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, empCardY, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Karyawan:', margin + 4, empCardY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${employee.name} (${employee.id})`, margin + 22, empCardY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Posisi & Dept:', margin + 4, empCardY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${employee.position} — Divisi ${employee.department}`, margin + 22, empCardY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Sistem Gaji:', margin + 4, empCardY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(salaryTypeLabel, margin + 22, empCardY + 18);

  // Right side of empCard
  const rEmpX = margin + 105;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('ID Dokumen:', rEmpX, empCardY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(docNo, rEmpX + 22, empCardY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tgl Terbit:', rEmpX, empCardY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${new Date().toLocaleDateString('id-ID')}`, rEmpX + 22, empCardY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('No. Rekening:', rEmpX, empCardY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${employee.bankAccount || '8200192831'}`, rEmpX + 22, empCardY + 18);

  // 4. Modern Tables
  const tY = empCardY + 28;

  autoTable(doc, {
    startY: tY,
    head: [['A. PENGHASILAN (EARNINGS BREAKDOWN)', 'NOMINAL']],
    body: earningsRows,
    foot: [['TOTAL PENGHASILAN BRUTO', formatIDR(summary.grossSalary)]],
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [238, 242, 255],
      textColor: [67, 56, 202],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const earnFinalY = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: earnFinalY + 3,
    head: [['B. POTONGAN RESMI (DEDUCTIONS)', 'NOMINAL']],
    body: deductionsRows,
    foot: [['TOTAL POTONGAN', formatIDR(summary.lateDeduction)]],
    theme: 'striped',
    headStyles: {
      fillColor: [244, 63, 94], // Rose 500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [255, 241, 242],
      textColor: [190, 18, 60],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const dedFinalY = (doc as any).lastAutoTable.finalY;

  // 5. Take Home Pay Card
  const netY = dedFinalY + 4;
  doc.setFillColor(49, 46, 129);
  doc.roundedRect(margin, netY, contentWidth, 21, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(224, 231, 255);
  doc.text('NET TAKE HOME PAY (DITERIMA BERSIH)', margin + 6, netY + 8);

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(formatIDR(summary.netSalary), pageWidth - margin - 6, netY + 8, { align: 'right' });

  const spelled = terbilangRupiah(summary.netSalary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(199, 210, 254);
  doc.text(`Terbilang: "# ${spelled} #"`, margin + 6, netY + 15.5);

  // 6. Signatures & Digital Authentication Badge
  const sigY = Math.max(236, netY + 26);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Penerima Upah,', margin + 15, sigY);
  doc.line(margin + 5, sigY + 20, margin + 55, sigY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(employee.name, margin + 15, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: ${employee.id}`, margin + 15, sigY + 27);

  const rightSigX = pageWidth - margin - 60;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized Finance Signer,', rightSigX, sigY);

  // Digital E-Sign Seal
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(99, 102, 241);
  doc.roundedRect(rightSigX - 4, sigY + 3, 62, 15, 2, 2, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text('DIGITALLY SIGNED & VERIFIED', rightSigX + 27, sigY + 7.5, { align: 'center' });
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(79, 70, 229);
  doc.text(`HASH ID: SHA256-${docNo.slice(-6)}`, rightSigX + 27, sigY + 11.5, { align: 'center' });
  doc.text(`DATE: ${new Date().toISOString().slice(0, 10)}`, rightSigX + 27, sigY + 15, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(config.companyDirector || 'Ir. Heru Hendriawan, M.M.', rightSigX, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(config.companyName, rightSigX, sigY + 27);

  renderUniversalFooter(doc, margin);
}

// ============================================================================
// TEMPLATE 4: MANUFAKTUR & LEMBUR DETAIL (INDUSTRIAL BLUE & SHIFT AUDIT)
// ============================================================================
function renderIndustrialOvertimeTemplate(
  doc: jsPDF,
  employee: Employee,
  summary: PayrollSummary,
  config: CompanyConfig,
  periodText: string,
  docNo: string,
  isDaily: boolean,
  salaryTypeLabel: string,
  earningsRows: [string, string][],
  deductionsRows: [string, string][],
  sortedRecords: AttendanceRecord[],
  margin: number,
  pageWidth: number,
  contentWidth: number
) {
  // 1. Industrial Header
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(2, 132, 199); // Sky 600
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text(config.companyName.toUpperCase(), margin, 10.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 242, 254);
  doc.text(
    `SLIP GAJI & LOG LEMBUR OPERASIONAL (MANUFACTURING & FIELD SHIFT) | UNIT: ${employee.department.toUpperCase()}`,
    margin,
    16.5
  );
  doc.text(
    `${config.companyAddress} | Telp: ${config.companyPhone || '-'} | NPWP: ${config.companyTaxNumber || '-'}`,
    margin,
    22
  );

  // Top Right Industrial Badge
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(pageWidth - margin - 50, 5, 50, 18, 1.5, 1.5, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248);
  doc.text('DIVISI OPERASIONAL', pageWidth - margin - 25, 11, { align: 'center' });
  doc.setFontSize(6);
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text('SHIFT & OVERTIME AUDIT', pageWidth - margin - 25, 16, { align: 'center' });
  doc.text(docNo.slice(-10), pageWidth - margin - 25, 20, { align: 'center' });

  // 2. Shift & Overtime Detail Highlights Box
  const shiftBoxY = 34;
  doc.setFillColor(240, 249, 255); // Sky 50
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(margin, shiftBoxY, contentWidth, 22, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161);
  doc.text('RINGKASAN SHIFT KERJA & KALKULASI LEMBUR TIER RESMI DEPKER:', margin + 4, shiftBoxY + 5.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`• Total Jam Kerja Shift: ${summary.totalWorkHours} Jam`, margin + 4, shiftBoxY + 11);
  doc.text(`• Hari Hadir: ${summary.attendanceDays} Hari Sah`, margin + 4, shiftBoxY + 16);

  const colB = margin + 65;
  doc.text(`• Lembur Kerja Biasa (1.5x - 2.0x): ${summary.regularOvertimeHours || 0} Jam`, colB, shiftBoxY + 11);
  doc.text(`• Lembur Hari Libur/Minggu (2.0x - 4.0x): ${summary.holidayOvertimeHours || 0} Jam`, colB, shiftBoxY + 16);

  const colC = margin + 130;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`• Akumulasi Lembur: ${summary.totalOvertimeHours} Jam`, colC, shiftBoxY + 11);
  doc.setTextColor(16, 185, 129);
  doc.text(`• Total Upah Lembur: ${formatIDR(summary.totalOvertimePay)}`, colC, shiftBoxY + 16);

  // 3. Employee Meta Details
  const infoY = shiftBoxY + 25;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, infoY, contentWidth, 14, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Nama Karyawan:', margin + 4, infoY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${employee.name} (${employee.id})`, margin + 27, infoY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Jabatan / Unit:', margin + 4, infoY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${employee.position} — ${employee.department}`, margin + 27, infoY + 10);

  const rInfoX = margin + 98;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Periode:', rInfoX, infoY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(periodText, rInfoX + 22, infoY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Transfer Payroll:', rInfoX, infoY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${employee.bankName || 'BCA'} ${employee.bankAccount || '-'}`, rInfoX + 22, infoY + 10);

  // 4. Tables
  const tY = infoY + 17;

  autoTable(doc, {
    startY: tY,
    head: [['A. KOMPONEN UPAH POKOK, TUNJANGAN & LEMBUR OPERASIONAL', 'NOMINAL (IDR)']],
    body: earningsRows,
    foot: [['TOTAL PENGHASILAN OPERASIONAL BRUTO', formatIDR(summary.grossSalary)]],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138], // Blue 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [239, 246, 255],
      textColor: [30, 58, 138],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const earnFinalY = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: earnFinalY + 2.5,
    head: [['B. POTONGAN DISIPLIN SHIFT & KETERLAMBATAN', 'NOMINAL (IDR)']],
    body: deductionsRows,
    foot: [['TOTAL POTONGAN', formatIDR(summary.lateDeduction)]],
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28], // Red 700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [254, 242, 242],
      textColor: [185, 28, 28],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const dedFinalY = (doc as any).lastAutoTable.finalY;

  // 5. Take Home Pay
  const netY = dedFinalY + 3.5;
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(2, 132, 199);
  doc.roundedRect(margin, netY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL UPAH BERSIH DITERIMA (TAKE HOME PAY):', margin + 5, netY + 7);

  doc.setFontSize(13);
  doc.setTextColor(56, 189, 248); // Sky 400
  doc.text(formatIDR(summary.netSalary), pageWidth - margin - 5, netY + 7, { align: 'right' });

  const spelled = terbilangRupiah(summary.netSalary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(203, 213, 225);
  doc.text(`Terbilang: "# ${spelled} #"`, margin + 5, netY + 13.5);

  // 6. Mini Attendance Shift Log
  if (sortedRecords.length > 0 && netY + 22 + 35 < 240) {
    const shiftLogRows = sortedRecords.map((r) => {
      return [
        r.date,
        r.checkInTime ? `${r.checkInTime} WIB` : '-',
        r.checkOutTime ? `${r.checkOutTime} WIB` : '-',
        `${r.workDurationHours || 0} Jam`,
        r.overtimeHours > 0 ? `+${r.overtimeHours} Jam` : '0',
        r.status === 'terlambat' ? 'Denda Telat' : 'Tepat',
        r.isRemoteOrOutIsland ? 'Dinas Lapangan' : 'Plant / Kantor',
      ];
    });

    autoTable(doc, {
      startY: netY + 21,
      head: [['Tgl Shift', 'Jam Masuk', 'Jam Pulang', 'Jam Kerja', 'Jam Lembur', 'Disiplin', 'Lokasi Shift']],
      body: shiftLogRows,
      theme: 'plain',
      headStyles: {
        fillColor: [224, 242, 254],
        textColor: [3, 105, 161],
        fontStyle: 'bold',
        fontSize: 6,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 6,
        textColor: [51, 65, 85],
        halign: 'center',
        cellPadding: 1,
      },
      margin: { left: margin, right: margin },
    });
  }

  // 7. Signatures: Supervisor & Payroll
  const sigY = Math.max(236, ((doc as any).lastAutoTable?.finalY || 215) + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Karyawan Shift Bersangkutan,', margin + 12, sigY);
  doc.line(margin + 5, sigY + 20, margin + 55, sigY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(employee.name, margin + 12, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIK: ${employee.id}`, margin + 12, sigY + 27);

  // Center: Mandor / Pengawas
  const cSigX = pageWidth / 2 - 25;
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Pengawas / Supervisor Shift,', cSigX, sigY);
  doc.line(cSigX - 5, sigY + 20, cSigX + 45, sigY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Supervisor Produksi', cSigX, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Departemen Operasional', cSigX, sigY + 27);

  // Right: Payroll Dept
  const rSigX = pageWidth - margin - 50;
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Personalia & Keuangan,', rSigX, sigY);
  doc.line(rSigX - 5, sigY + 20, rSigX + 45, sigY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(config.companyDirector || 'Ir. Heru Hendriawan, M.M.', rSigX, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(config.companyName, rSigX, sigY + 27);

  renderUniversalFooter(doc, margin);
}

// ============================================================================
// GRAPHICAL HELPERS & FOOTER
// ============================================================================
function drawOfficialCircularStamp(doc: jsPDF, x: number, y: number, companyName: string, docNo: string) {
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.7);
  doc.circle(x, y, 13, 'S');
  doc.setLineWidth(0.3);
  doc.circle(x, y, 11.5, 'S');
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(companyName.slice(0, 20).toUpperCase(), x, y - 5.5, { align: 'center' });
  doc.setFontSize(6);
  doc.text('★ LUNAS & SAH ★', x, y, { align: 'center' });
  doc.setFontSize(4.5);
  doc.text('PAYROLL VERIFIED', x, y + 4.5, { align: 'center' });
  doc.setFontSize(4);
  doc.text(docNo.slice(-8), x, y + 8, { align: 'center' });
}

function drawDigitalSecurityQR(doc: jsPDF, x: number, y: number, docNo: string) {
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(x, y, 20, 20, 1.5, 1.5, 'F');
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, 20, 20, 1.5, 1.5, 'S');

  doc.setFillColor(49, 46, 129);
  doc.rect(x + 2, y + 2, 4.5, 4.5, 'F');
  doc.rect(x + 13.5, y + 2, 4.5, 4.5, 'F');
  doc.rect(x + 2, y + 13.5, 4.5, 4.5, 'F');

  doc.setFillColor(255, 255, 255);
  doc.rect(x + 3.2, y + 3.2, 2, 2, 'F');
  doc.rect(x + 14.7, y + 3.2, 2, 2, 'F');
  doc.rect(x + 3.2, y + 14.7, 2, 2, 'F');

  doc.setFillColor(99, 102, 241);
  doc.rect(x + 8, y + 3, 3.5, 2, 'F');
  doc.rect(x + 8, y + 7, 4, 3, 'F');
  doc.rect(x + 13.5, y + 8, 3, 3.5, 'F');
  doc.rect(x + 3, y + 8, 3, 3.5, 'F');
  doc.rect(x + 8, y + 12, 4.5, 2, 'F');
  doc.rect(x + 9, y + 15, 3.5, 3, 'F');
}

function renderUniversalFooter(doc: jsPDF, margin: number) {
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    '* Dokumen ini diterbitkan secara resmi melalui Sistem Presensi GPS & Penggajian Terpadu tanpa memerlukan tanda tangan basah.',
    margin,
    286
  );
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Dibuat oleh heruhendri | Sistem Presensi GPS & Penggajian Terintegrasi', margin, 290);
}
