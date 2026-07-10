"use client";

import jsPDF from "jspdf";

export interface ReportSummaryRow {
  label: string;
  value: string;
}

export interface ToolPDFOptions {
  toolName: string;
  title: string;
  summaryRows: ReportSummaryRow[];
  tableHeaders?: string[];
  tableRows?: string[][];
  fileName?: string;
}

export function generateAndDownloadToolPDF(options: ToolPDFOptions) {
  const {
    toolName,
    title,
    summaryRows,
    tableHeaders,
    tableRows,
    fileName = "Zynveo_Report.pdf",
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ── 1. Top Header Banner ──
  doc.setFillColor(109, 40, 217); // #6d28d9
  doc.rect(0, 0, pageWidth, 95, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ZYNVEO INTELLIGENCE REPORT", 40, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(title || toolName, 40, 68);

  doc.setFontSize(10);
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  doc.text(`Generated: ${dateStr}  |  zynveo.com`, pageWidth - 40, 68, { align: "right" });

  let currentY = 135;

  // ── 2. Calculation Summary Table ──
  doc.setTextColor(30, 41, 59); // #1e293b
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Calculation & Financial Summary", 40, currentY - 12);

  // Table Header
  doc.setFillColor(241, 245, 249); // #f1f5f9
  doc.rect(40, currentY, pageWidth - 80, 28, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(40, currentY, pageWidth - 80, 28, "S");

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text("METRIC DESCRIPTION", 52, currentY + 18);
  doc.text("VALUE / AMOUNT", pageWidth - 52, currentY + 18, { align: "right" });

  currentY += 28;

  summaryRows.forEach((row, i) => {
    if (currentY > pageHeight - 140) {
      doc.addPage();
      currentY = 50;
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(40, currentY, pageWidth - 80, 30, "F");
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(40, currentY + 30, pageWidth - 40, currentY + 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(row.label, 52, currentY + 19);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(row.value, pageWidth - 52, currentY + 19, { align: "right" });

    currentY += 30;
  });

  currentY += 25;

  // ── 3. Optional Detailed Item Table (e.g. Salon Menu Mix) ──
  if (tableHeaders && tableRows && tableRows.length > 0) {
    if (currentY > pageHeight - 180) {
      doc.addPage();
      currentY = 50;
    }

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Detailed Itemized Breakdown", 40, currentY - 12);

    doc.setFillColor(241, 245, 249);
    doc.rect(40, currentY, pageWidth - 80, 26, "F");
    doc.setDrawColor(203, 213, 225);
    doc.rect(40, currentY, pageWidth - 80, 26, "S");

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    const colWidths = (pageWidth - 80) / tableHeaders.length;
    tableHeaders.forEach((header, idx) => {
      doc.text(header, 48 + idx * colWidths, currentY + 17);
    });

    currentY += 26;

    tableRows.forEach((row, rIdx) => {
      if (currentY > pageHeight - 120) {
        doc.addPage();
        currentY = 50;
      }

      if (rIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(40, currentY, pageWidth - 80, 24, "F");
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(40, currentY + 24, pageWidth - 40, currentY + 24);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      row.forEach((cell, cIdx) => {
        doc.text(cell || "", 48 + cIdx * colWidths, currentY + 16);
      });

      currentY += 24;
    });

    currentY += 25;
  }

  // ── 4. Call-to-Action Box ──
  if (currentY > pageHeight - 110) {
    doc.addPage();
    currentY = 50;
  }

  doc.setFillColor(239, 246, 255); // #eff6ff
  doc.setDrawColor(59, 130, 246); // #3b82f6
  doc.rect(40, currentY, pageWidth - 80, 75, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138); // #1e3a8a
  doc.text("💡 Automate Your Profit & Inventory with Zynveo Cloud ERP", 55, currentY + 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175); // #1e40af
  const ctaLines = doc.splitTextToSize(
    "Connect directly to live inventory costs, supplier purchases, and multi-branch POS terminals. Calculate true item margins and cash register targets automatically without manual spreadsheets.",
    pageWidth - 110
  );
  doc.text(ctaLines, 55, currentY + 44);

  // ── 5. Footer on all pages ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(40, pageHeight - 45, pageWidth - 40, pageHeight - 45);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(109, 40, 217);
    doc.text("zynveo.com", 40, pageHeight - 25);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Zynveo Next-Gen Cloud OS  |  Page ${p} of ${totalPages}`,
      pageWidth - 40,
      pageHeight - 25,
      { align: "right" }
    );
  }

  // Trigger browser download
  doc.save(fileName);
}
