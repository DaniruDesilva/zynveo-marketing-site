"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Export any HTML/React DOM node (like our fixed unscaled A4 report preview components)
 * directly into a high-definition, multi-language A4 PDF with zero character/emoji corruption.
 */
export async function exportDOMToPDF(
  element: HTMLElement | null,
  fileName: string = "Zynveo_Report.pdf"
): Promise<boolean> {
  if (!element) {
    console.error("DOM element not found for PDF generation");
    return false;
  }

  try {
    // Render the exact DOM container to canvas at 2x scale for 300 DPI clarity
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add image to page
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Dynamically measure and attach clickable link to zynveo.com
    const linkEl = element.querySelector('[data-pdf-link="zynveo"]');
    if (linkEl) {
      const containerRect = element.getBoundingClientRect();
      const linkRect = linkEl.getBoundingClientRect();

      const relX = linkRect.left - containerRect.left;
      const relY = linkRect.top - containerRect.top;
      const scaleRatio = pdfWidth / 794;
      const padX = 6 * scaleRatio;
      const padY = 4 * scaleRatio;

      pdf.link(
        relX * scaleRatio - padX,
        relY * scaleRatio - padY,
        linkRect.width * scaleRatio + padX * 2,
        linkRect.height * scaleRatio + padY * 2,
        { url: "https://zynveo.com" } as any
      );
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error("Error generating high-definition PDF:", error);
    return false;
  }
}
