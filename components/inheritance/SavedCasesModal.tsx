import { useState } from 'react';
import { X, FolderOpen, Trash2 } from 'lucide-react';
import { SavedCase } from './InheritanceCalculator';
import ConfirmDeleteModal from './ConfirmDeleteModal';

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
  isImporting
}: SavedCasesModalProps) {
  const [deletingCase, setDeletingCase] = useState<{id: string, name: string} | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-[#f8fafc] shrink-0">
            <h3 className="font-bold text-[#1e293b]">المسائل المحفوظة ({savedCases.length})</h3>
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
                        <span>التركة: {c.estate.toLocaleString('en-US')} دج</span>
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
