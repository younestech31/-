import { useState, useCallback } from 'react';
import { StageResult } from '@/components/inheritance/ResultsTable';
import { OfficeSettings } from '@/lib/inheritance/document-branding';

interface PDFExportParams {
  estate: number;
  debts: number;
  funeralCosts: number;
  bequest: number;
  deceasedGender: 'male' | 'female' | null;
}

/**
 * Custom React hook to orchestrate server-side legal PDF generation and downloads
 */
export function usePdfExport() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportToPDFServer = useCallback(async (
    allStagesResults: StageResult[],
    params: PDFExportParams,
    officeSettings?: OfficeSettings
  ): Promise<boolean> => {
    setIsExportingPDF(true);
    setExportError(null);

    try {
      // Highly reliable, instant, offline-capable client-side canvas-to-PDF engine
      // to avoid serverless timeouts, Chromium launch issues, and proxy errors on Cloud Run.
      const { exportToPDF } = await import('@/lib/inheritance/pdf-export');
      await exportToPDF(allStagesResults, params, officeSettings);
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
    exportToPDFServer,
  };
}
