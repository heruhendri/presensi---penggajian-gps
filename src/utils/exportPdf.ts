import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, CompanyConfig, Employee, PayrollSummary } from '../types';
import { formatIDR } from './payroll';

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
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(config.companyName.toUpperCase(), 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.companyAddress} | Sistem Presensi & Penggajian Terintegrasi`, 14, 18);

  // Document Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`LAPORAN REKAPITULASI PENGGAJIAN & LEMBUR KARYAWAN`, 14, 34);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Departemen: ${departmentFilter} | Periode: ${periodText} | Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 40);

  // Table Data
  const tableData = summaries.map((s, index) => [
    index + 1,
    s.employeeId,
    s.employeeName,
    s.department,
    s.position,
    `${s.attendanceDays} Hari`,
    `${s.totalOvertimeHours} Jam`,
    formatIDR(s.baseSalary),
    formatIDR(s.allowance + s.transportAllowance),
    formatIDR(s.totalOvertimePay),
    formatIDR(s.lateDeduction),
    formatIDR(s.netSalary),
  ]);

  const totalNet = summaries.reduce((acc, s) => acc + s.netSalary, 0);
  const totalOvertime = summaries.reduce((acc, s) => acc + s.totalOvertimePay, 0);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'ID', 'Nama Karyawan', 'Departemen', 'Jabatan',
      'Presensi', 'Lembur', 'Gaji Pokok', 'Tunjangan', 'Uang Lembur', 'Potongan', 'Gaji Bersih (Net)'
    ]],
    body: tableData,
    foot: [[
      '', '', 'TOTAL KESELURUHAN', '', '', '', '',
      '', '', formatIDR(totalOvertime), '', formatIDR(totalNet)
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 18 },
      7: { halign: 'right', cellWidth: 24 },
      8: { halign: 'right', cellWidth: 24 },
      9: { halign: 'right', cellWidth: 24 },
      10: { halign: 'right', cellWidth: 22 },
      11: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
  });

  // Footer notes & signature area
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  if (finalY < 175) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`* Perhitungan lembur mengikuti aturan kelipatan: ${config.overtimeMultipliers.map(m => `Jam ke-${m.tier}: ${m.multiplier}x`).join(', ')} (Pembagi standar: ${config.hourlyRateDivider})`, 14, finalY + 12);

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Disetujui Oleh,', 230, finalY + 10);
    doc.text('Finance & HR Director', 230, finalY + 30);
  }

  // Watermark Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Dibuat oleh heruhendri | Sistem Presensi & Penggajian GPS Real-Time', 14, 202);

  const filename = `Rekap_Gaji_${departmentFilter.replace(/\s+/g, '_')}_${periodText.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

export function exportSingleEmployeeSlipPDF(
  employee: Employee,
  summary: PayrollSummary,
  attendances: AttendanceRecord[],
  config: CompanyConfig,
  periodText: string = 'September 2026'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(config.companyName.toUpperCase(), 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(config.companyAddress, 14, 18);
  doc.text('SLIP GAJI ELEKTRONIK RESMI (CONFIDENTIAL)', 14, 24);

  // Employee Profile Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 34, 182, 30, 3, 3, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nama: ${employee.name}`, 20, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID Karyawan: ${employee.id}`, 20, 48);
  doc.text(`Departemen: ${employee.department}`, 20, 54);
  doc.text(`Jabatan: ${employee.position}`, 20, 60);

  doc.text(`Periode: ${periodText}`, 115, 42);
  doc.text(`Tgl Pembayaran: ${config.payrollDateDay} ${periodText}`, 115, 48);
  doc.text(`Bank / Rekening: ${employee.bankName || 'BCA'} - ${employee.bankAccount || '-'}`, 115, 54);
  doc.text(`Hari Presensi: ${summary.attendanceDays} Hari (${summary.totalWorkHours} Jam Kerja)`, 115, 60);

  // Earnings Table
  const earningsData = [
    ['Gaji Pokok (Basic Salary)', formatIDR(summary.baseSalary)],
    ['Tunjangan Tetap', formatIDR(summary.allowance)],
    [`Uang Makan & Transportasi (${summary.attendanceDays} Hari @ ${formatIDR(employee.dailyTransport)})`, formatIDR(summary.transportAllowance)],
    [`Uang Lembur (${summary.totalOvertimeHours} Jam berdasarkan jam kerja & approval)`, formatIDR(summary.totalOvertimePay)],
  ];

  autoTable(doc, {
    startY: 70,
    head: [['KOMPONEN PENGHASILAN (EARNINGS)', 'JUMLAH (IDR)']],
    body: earningsData,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
  });

  const deductionsData = [
    ['Potongan Keterlambatan / Sanksi', formatIDR(summary.lateDeduction)],
    ['Potongan PPh 21 / BPJS (Subsidi Perusahaan)', 'Rp 0'],
  ];

  const currentY = (doc as any).lastAutoTable.finalY + 5;
  autoTable(doc, {
    startY: currentY,
    head: [['KOMPONEN POTONGAN (DEDUCTIONS)', 'JUMLAH (IDR)']],
    body: deductionsData,
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Net Take Home Pay Total Box
  const totalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, totalY, 182, 22, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('TOTAL GAJI BERSIH DITERIMA (TAKE HOME PAY)', 20, totalY + 14);

  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text(formatIDR(summary.netSalary), 140, totalY + 14);

  // Footer Note & Watermark
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('* Dokumen ini dicetak otomatis oleh sistem presensi & payroll dan sah tanpa tanda tangan basah.', 14, totalY + 30);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Dibuat oleh heruhendri | Sistem Presensi & Penggajian GPS Real-Time', 14, totalY + 35);

  doc.save(`Slip_Gaji_${employee.name.replace(/\s+/g, '_')}_${periodText.replace(/\s+/g, '_')}.pdf`);
}
