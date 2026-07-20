// lib/inheritance/exportTreeToPDF.ts

import { type Node as RFNode, getNodesBounds } from "@xyflow/react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

const A4_LANDSCAPE = { w: 297, h: 210 }; // mm
const MARGIN_MM = 10;

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
      message: "جاري تحديد أبعاد الشجرة لتحقيق الملاءمة الكاملة والدقة المتناهية..."
    });

    // 1. Get the bounding box of all nodes
    const bounds = getNodesBounds(nodes);
    
    // Add extra padding around the tree to ensure no border cuts
    const boundsPadding = 45;
    const treeX = bounds.x - boundsPadding;
    const treeY = bounds.y - boundsPadding;
    const treeW = bounds.width + boundsPadding * 2;
    const treeH = bounds.height + boundsPadding * 2;

    // 2. Define the exact dimensions for single-page landscape A4 content
    const PX_PER_MM = 5.5; // Pristine detail matching high-end printing density
    const contentW_mm = A4_LANDSCAPE.w - MARGIN_MM * 2; // 277 mm
    const contentH_mm = A4_LANDSCAPE.h - MARGIN_MM * 2; // 190 mm
    const contentW_px = Math.round(contentW_mm * PX_PER_MM);
    const contentH_px = Math.round(contentH_mm * PX_PER_MM);

    // 3. Calculate scaling factor to fit the whole tree into a single page
    const scaleX = contentW_px / treeW;
    const scaleY = contentH_px / treeH;
    const scale = Math.min(scaleX, scaleY);

    // 4. Center coordinates in the output viewport
    const offsetX = (contentW_px - treeW * scale) / 2;
    const offsetY = (contentH_px - treeH * scale) / 2;

    onProgress?.({
      status: "rendering",
      message: "جاري التقاط الشجرة بصيغة رسومية متجهة فائقة الوضوح (SVG)...",
      currentPage: 1,
      totalPages: 1
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const flowEl = document.querySelector("#results-family-tree .react-flow__viewport") as HTMLElement;
    if (!flowEl) {
      throw new Error("لم يتم العثور على مخطط شجرة العائلة. يرجى التأكد من فتح علامة التبويب الخاصة بالشجرة أولاً.");
    }

    // 5. Try exporting as SVG first (highly sharp web vector graphics + transparent background)
    const svgDataUrl = await htmlToImage.toSvg(flowEl, {
      filter: (domNode: HTMLElement) => {
        // Exclude controls, minimap, panels etc.
        if (!domNode || !domNode.classList) return true;
        return !domNode.classList.contains("react-flow__minimap") &&
               !domNode.classList.contains("react-flow__controls") &&
               !domNode.classList.contains("react-flow__panel");
      },
      width: contentW_px,
      height: contentH_px,
      style: {
        width: `${contentW_px}px`,
        height: `${contentH_px}px`,
        transform: `translate(${-treeX * scale + offsetX}px, ${-treeY * scale + offsetY}px) scale(${scale})`,
        transformOrigin: "top left",
      },
      backgroundColor: "transparent", // Keep transparent background inside PDF/SVG export
    });

    onProgress?.({
      status: "saving",
      message: "جاري دمج الرسوم المتجهة في وثيقة الـ PDF..."
    });

    // 6. Attempt rendering SVG vector into PDF page, fallback to pristine transparent PNG if browser context throws
    try {
      pdf.addImage(
        svgDataUrl,
        "SVG",
        MARGIN_MM,
        MARGIN_MM,
        contentW_mm,
        contentH_mm,
        undefined,
        "FAST"
      );
    } catch (svgError) {
      console.warn("SVG embedding encountered a PDF limitations error, falling back to ultra-sharp transparent PNG...", svgError);
      
      onProgress?.({
        status: "rendering",
        message: "تحديث الأسلوب: جاري التقاط شجرة عائلة شفافة بدقة فائقة (PNG)...",
        currentPage: 1,
        totalPages: 1
      });

      const pngDataUrl = await htmlToImage.toPng(flowEl, {
        filter: (domNode: HTMLElement) => {
          if (!domNode || !domNode.classList) return true;
          return !domNode.classList.contains("react-flow__minimap") &&
                 !domNode.classList.contains("react-flow__controls") &&
                 !domNode.classList.contains("react-flow__panel");
        },
        width: contentW_px,
        height: contentH_px,
        style: {
          width: `${contentW_px}px`,
          height: `${contentH_px}px`,
          transform: `translate(${-treeX * scale + offsetX}px, ${-treeY * scale + offsetY}px) scale(${scale})`,
          transformOrigin: "top left",
        },
        backgroundColor: "transparent", // Maintain absolute background transparency
        pixelRatio: 2.2, // Boost pixel density multiplier for retina sharpness
      });

      pdf.addImage(
        pngDataUrl,
        "PNG",
        MARGIN_MM,
        MARGIN_MM,
        contentW_mm,
        contentH_mm,
        undefined,
        "FAST"
      );
    }

    // 7. Add simple clean border around the page print bounds (transparent inside)
    pdf.setDrawColor(226, 232, 240); // slate-200 border
    pdf.setLineWidth(0.5);
    pdf.rect(MARGIN_MM - 1, MARGIN_MM - 1, contentW_mm + 2, contentH_mm + 2, "S");

    // Page marker indicating Single-page Vector Flow
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text("1 / 1", A4_LANDSCAPE.w / 2, A4_LANDSCAPE.h - 6, { align: "center" });

    onProgress?.({
      status: "success",
      message: "تم تصدير مخطط شجرة الميراث الشفاف كاملًا في صفحة واحدة بنجاح!"
    });

    pdf.save("شجرة-توزيع-الميراث-بصورة-متجهة.pdf");

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
