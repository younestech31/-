// lib/inheritance/exportTreeToPDF.ts

import { type Node as RFNode, getNodesBounds } from "@xyflow/react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

export interface ExportProgress {
  status: "idle" | "calculating" | "rendering" | "saving" | "success" | "error";
  message: string;
  currentPage?: number;
  totalPages?: number;
}

export async function exportTreeToPDF(
  nodes: RFNode[],
  onProgress?: (progress: ExportProgress) => void
) {
  try {
    if (!nodes || nodes.length === 0) {
      throw new Error("لا توجد عناصر لعرضها في الشجرة للتصدير");
    }

    onProgress?.({
      status: "calculating",
      message: "جاري حساب أبعاد الشجرة لضمان أقصى دقة للطباعة..."
    });

    // 1. Get the bounding box of all nodes
    const bounds = getNodesBounds(nodes);
    
    // Generous padding around the tree bounds to avoid cutting node shadows/borders
    const padding = 80;
    const treeW = Math.max(300, Math.ceil(bounds.width + padding * 2));
    const treeH = Math.max(300, Math.ceil(bounds.height + padding * 2));

    // 2. Determine optimal paper format (A3 Landscape for wide trees, A4 Landscape otherwise)
    const isUltraWide = treeW > 2000 || (treeW / treeH) > 2.0;
    const pageFormat = isUltraWide ? "a3" : "a4";
    const pageW_mm = isUltraWide ? 420 : 297;
    const pageH_mm = isUltraWide ? 297 : 210;
    const margin_mm = 10;

    const contentW_mm = pageW_mm - margin_mm * 2;
    const contentH_mm = pageH_mm - margin_mm * 2;

    onProgress?.({
      status: "rendering",
      message: "جاري التقاط شجرة العائلة بدقة فائقة ووضوح تام (300 DPI)...",
      currentPage: 1,
      totalPages: 1
    });

    const flowEl = document.querySelector("#results-family-tree .react-flow__viewport") as HTMLElement;
    if (!flowEl) {
      throw new Error("لم يتم العثور على مخطط شجرة العائلة. يرجى التأكد من فتح علامة التبويب الخاصة بالشجرة أولاً.");
    }

    // Dynamic pixel ratio to achieve ultra-sharp typography without exceeding browser canvas limits
    const maxDim = Math.max(treeW, treeH);
    const targetPixelRatio = Math.min(3, Math.max(1.8, 8000 / maxDim));

    // 3. Capture image at 1:1 scale with high pixel ratio
    const imgDataUrl = await htmlToImage.toPng(flowEl, {
      filter: (domNode: HTMLElement) => {
        if (!domNode || !domNode.classList) return true;
        return !domNode.classList.contains("react-flow__minimap") &&
               !domNode.classList.contains("react-flow__controls") &&
               !domNode.classList.contains("react-flow__panel");
      },
      width: treeW,
      height: treeH,
      pixelRatio: targetPixelRatio,
      style: {
        width: `${treeW}px`,
        height: `${treeH}px`,
        transform: `translate(${padding - bounds.x}px, ${padding - bounds.y}px) scale(1)`,
        transformOrigin: "top left",
      },
      backgroundColor: "#ffffff", // Pure crisp white background for high-contrast printing
    });

    onProgress?.({
      status: "saving",
      message: "جاري إنشاء وثيقة الـ PDF للطباعة العالية الجودة..."
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: pageFormat,
      compress: true
    });

    // 4. Fit cleanly into PDF printable margins
    const imgAspectRatio = treeW / treeH;
    let renderW_mm = contentW_mm;
    let renderH_mm = contentW_mm / imgAspectRatio;

    if (renderH_mm > contentH_mm) {
      renderH_mm = contentH_mm;
      renderW_mm = contentH_mm * imgAspectRatio;
    }

    // Center image on the page
    const xPos = margin_mm + (contentW_mm - renderW_mm) / 2;
    const yPos = margin_mm + (contentH_mm - renderH_mm) / 2;

    // Add image to PDF
    pdf.addImage(
      imgDataUrl,
      "PNG",
      xPos,
      yPos,
      renderW_mm,
      renderH_mm,
      undefined,
      "FAST"
    );

    // Subtle border frame
    pdf.setDrawColor(203, 213, 225); // slate-300
    pdf.setLineWidth(0.4);
    pdf.rect(margin_mm - 1, margin_mm - 1, contentW_mm + 2, contentH_mm + 2, "S");

    // Footer page label
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text("1 / 1", pageW_mm / 2, pageH_mm - 4, { align: "center" });

    onProgress?.({
      status: "success",
      message: `تم تصدير مخطط شجرة الميراث بدقة عالية للطباعة (${isUltraWide ? "A3" : "A4"}) بنجاح!`
    });

    pdf.save("شجرة-توزيع-الميراث-عالية-الوضوح.pdf");

  } catch (error) {
    const err = error as Error;
    console.error("Failed to export PDF tree:", err);
    onProgress?.({
      status: "error",
      message: err?.message || "حدث خطأ أثناء تصدير المستند."
    });
    throw error;
  }
}
