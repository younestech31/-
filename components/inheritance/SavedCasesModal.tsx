'use client';

import { useState } from 'react';
import { X, FolderOpen, Trash2, Cloud } from 'lucide-react';
import { SavedCase } from './InheritanceCalculator';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { encryptData } from '@/lib/crypto';
import { formatDZDAmount } from '@/lib/inheritance/document-branding';

interface SavedCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCases: SavedCase[];
  loadCase: (c: SavedCase) => void;
  deleteCase: (id: string, e?: React.MouseEvent) => void;
  storageError: string | null;
  importData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportData: () => void;
  isImporting: boolean;
  isEntitlementsLoading?: boolean;
  isPaid?: boolean;
}

export default function SavedCasesModal({
  isOpen,
  onClose,
  savedCases,
  loadCase,
  deleteCase,
  storageError,
  importData,
  exportData,
  isImporting,
  isEntitlementsLoading = false,
  isPaid = false
}: SavedCasesModalProps) {
  const [deletingCase, setDeletingCase] = useState<{id: string, name: string} | null>(null);
  const [cloudSyncOptIn, setCloudSyncOptIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCloudSyncToggle = async (checked: boolean) => {
    setCloudSyncOptIn(checked);
    if (checked) {
      setIsSyncing(true);
      setSyncStatus('جاري مزامنة المسائل مشفرة سحابياً...');
      try {
        for (const c of savedCases) {
          const caseNameEncrypted = await encryptData(c.name);
          const caseDateEncrypted = await encryptData(c.date);
          const notaryIdEncrypted = await encryptData(c.id);
          const encryptedPayload = await encryptData(JSON.stringify(c));

          const res = await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: c.id,
              caseNameEncrypted,
              caseDateEncrypted,
              notaryIdEncrypted,
              isCloudSynced: true,
              encryptedPayload,
            }),
          });
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || 'Cloud sync failed');
          }
        }
        setSyncStatus('تمت المزامنة السحابية بنجاح (تشفير تام Zero-Knowledge)');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'فشل المزامنة';
        console.error('Cloud sync failed:', err);
        setSyncStatus(`تعذر المزامنة السحابية: ${msg}`);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setSyncStatus(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-[#f8fafc] shrink-0">
            <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
              <FolderOpen size={18} className="text-[#0a5d38]" />
              المسائل المحفوظة ({savedCases.length})
            </h3>
            <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] transition-colors"><X size={20} /></button>
          </div>
          
          <div className="p-4 overflow-y-auto flex-grow bg-[#f8f9fa]">
            {savedCases.length === 0 ? (
              <div className="text-center py-10 text-[#64748b]">
                <FolderOpen size={48} className="mx-auto mb-3 opacity-20" />
                <p>لا توجد مسائل محفوظة حالياً</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {savedCases.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => loadCase(c)}
                    className="bg-white border border-[#e2e8f0] rounded-lg p-3 hover:border-[#0a5d38] hover:shadow-md cursor-pointer transition-all group flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-[#0f172a] text-sm mb-1 group-hover:text-[#0a5d38] transition-colors">{c.name}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
                        <span>التاريخ: {new Date(c.date).toLocaleDateString('ar-DZ')}</span>
                        <span>التركة: {formatDZDAmount(c.estate, 'western', true)}</span>
                        <span>المراحل: {c.stages.length}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCase({id: c.id, name: c.name});
                      }}
                      className="text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#ef4444] p-2 rounded-md transition-colors"
                      title="حذف المسألة"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-amber-50/70 border-t border-amber-200 text-xs text-amber-900 flex flex-col gap-2 shrink-0" dir="rtl">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={cloudSyncOptIn} 
                onChange={(e) => handleCloudSyncToggle(e.target.checked)}
                disabled={isSyncing || isEntitlementsLoading}
                className="mt-0.5 rounded border-amber-400 text-[#0a5d38] focus:ring-[#0a5d38]"
              />
              <span className="leading-relaxed font-sans">
                <strong>موافقة صريحة على مزامنة المكتب السحابي (Cloud Sync):</strong> أوافق على مزامنة وتخزين بيانات مسائلي سحابياً على نحو مشفر تماماً من طرف إلى طرف (Zero-Knowledge) طبقاً لسياسة الخصوصية. لا ترى المنصة أية بيانات مكشوفة للورثة أو التركات.
              </span>
            </label>
            {syncStatus && <div className="text-[11px] font-semibold text-[#0a5d38] flex items-center gap-1.5"><Cloud size={14} />{syncStatus}</div>}
          </div>

          <div className="p-4 border-t border-[#e2e8f0] bg-[#fdfdfd] shrink-0 flex flex-col items-end gap-2">
            {storageError && <div className="text-red-500 text-xs text-left w-full">{storageError}</div>}
            <div className="flex gap-2">
              <label 
                className={`px-4 py-2 text-sm text-white rounded-md transition-colors cursor-pointer ${isImporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isImporting ? 'جاري الاستيراد...' : 'إستيراد JSON'}
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={importData} 
                  className="hidden" 
                  disabled={isImporting}
                  aria-busy={isImporting}
                />
              </label>
              {savedCases.length > 0 && (
                <button 
                  onClick={exportData}
                  className="px-4 py-2 text-sm bg-[#0a5d38] text-white hover:bg-[#074a2c] rounded-md transition-colors"
                >
                  تصدير JSON
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmDeleteModal
        isOpen={!!deletingCase}
        onClose={() => setDeletingCase(null)}
        onConfirm={() => {
            if (deletingCase) deleteCase(deletingCase.id);
        }}
        caseName={deletingCase?.name || ''}
      />
    </>
  );
}
