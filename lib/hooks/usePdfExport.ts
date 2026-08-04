import { useState, useCallback } from 'react';
import { StageResult } from '@/components/inheritance/ResultsTable';
import { OfficeSettings } from '@/lib/inheritance/document-branding';
import { exportToPDF } from '@/lib/inheritance/pdf-export';

interface PDFExportParams {
  estate: number;
  debts: number;
  funeralCosts: number;
  bequest: number;
  deceasedGender: 'male' | 'female' | null;
}

/**
 * Custom React hook to orchestrate client-side legal PDF generation and downloads using jsPDF
 */
export function usePdfExport() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportToPDFClient = useCallback(async (
    allStagesResults: StageResult[],
    params: PDFExportParams,
    officeSettings?: OfficeSettings,
    isPaid?: boolean
  ): Promise<boolean> => {
    setIsExportingPDF(true);
    setExportError(null);

    try {
      // Highly reliable, instant, offline-capable client-side canvas-to-PDF engine
      // to avoid serverless timeouts, Chromium launch issues, and proxy errors on Cloud Run.
      await exportToPDF(allStagesResults, params, officeSettings, isPaid);
      return true;
    } catch (err) {
      console.error('PDF Generation Error:', err);
      const localizedMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء توليد مستند الـ PDF.';
      setExportError(localizedMsg);
      throw new Error(localizedMsg);
    } finally {
      setIsExportingPDF(false);
    }
  }, []);

  return {
    isExportingPDF,
    exportError,
    exportToPDFClient,
  };
}
