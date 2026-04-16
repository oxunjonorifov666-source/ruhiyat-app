import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export interface SuperadminOverviewExportRow {
  label: string;
  newUsers: number;
  sessions: number;
  revenue: number;
}

export function exportSuperadminOverviewExcel(
  kpis: Record<string, string | number>,
  series: SuperadminOverviewExportRow[],
  fileName: string,
) {
  const wb = XLSX.utils.book_new();
  const kpiRows = Object.entries(kpis).map(([k, v]) => ({
    Ko_rsatkich: k,
    Qiymat: v,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiRows), 'KPI');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      series.map((r) => ({
        Davr: r.label,
        Yangi_royxat: r.newUsers,
        Seanslar: r.sessions,
        Daromad_UZS: r.revenue,
      })),
    ),
    'Vaqt_qatori',
  );
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportSuperadminOverviewPdf(
  title: string,
  kpis: [string, string][],
  series: SuperadminOverviewExportRow[],
  fileName: string,
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Yaratildi: ${new Date().toLocaleString('uz-UZ')}`, 14, 26);
  (doc as any).autoTable({
    head: [["Ko'rsatkich", 'Qiymat']],
    body: kpis,
    startY: 32,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  const y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text("Vaqt bo'yicha qatorlar", 14, y);
  (doc as any).autoTable({
    head: [['Davr', 'Yangi', 'Seanslar', 'Daromad (UZS)']],
    body: series.map((r) => [
      r.label,
      String(r.newUsers),
      String(r.sessions),
      String(r.revenue),
    ]),
    startY: y + 4,
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [51, 65, 85] },
  });
  doc.save(`${fileName}.pdf`);
}

export const exportToPDF = (headers: string[], data: any[][], fileName: string, title: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  
  // Add timestamp
  const date = new Date().toLocaleString('uz-UZ');
  doc.text(`Yaratildi: ${date}`, 14, 30);
  
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 8, font: 'helvetica' },
    headStyles: { fillColor: [79, 70, 229] }
  });
  
  doc.save(`${fileName}.pdf`);
};

export function exportFinanceStatisticsPdf(
  kpis: [string, string][],
  monthlyRows: { month: string; revenue: number; payments: number; refunds: number }[],
  fileName: string,
  title = 'Moliya statistikasi',
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Yaratildi: ${new Date().toLocaleString('uz-UZ')}`, 14, 26);
  (doc as any).autoTable({
    head: [["Ko'rsatkich", 'Qiymat']],
    body: kpis,
    startY: 32,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
  });
  const y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text("Oy bo'yicha", 14, y);
  (doc as any).autoTable({
    head: [['Oy', 'Daromad', "To'lovlar", 'Qaytarishlar']],
    body: monthlyRows.map((m) => [
      m.month,
      String(m.revenue),
      String(m.payments),
      String(m.refunds ?? 0),
    ]),
    startY: y + 4,
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [51, 65, 85] },
  });
  doc.save(`${fileName}.pdf`);
}
