'use client';

import { useRef, useState } from 'react';
import { X, FolderOpen, Trash2, LockKeyhole, Upload, Download } from 'lucide-react';
import { SavedCase } from './InheritanceCalculator';
import ConfirmDeleteModal from './ConfirmDeleteModal';
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
  isPaid: boolean;
  exportEncryptedBackup: (passphrase: string) => Promise<boolean>;
  importEncryptedBackup: (file: File, passphrase: string) => Promise<boolean>;
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
  isPaid,
  exportEncryptedBackup,
  importEncryptedBackup,
}: SavedCasesModalProps) {
  const [deletingCase, setDeletingCase] = useState<{id: string, name: string} | null>(null);
  const [backupMode, setBackupMode] = useState<'export' | 'import' | null>(null);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [backupPassphraseConfirmation, setBackupPassphraseConfirmation] = useState('');
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupError, setBackupError] = useState('');
  const [isBackupBusy, setIsBackupBusy] = useState(false);
  const encryptedBackupInputRef = useRef<HTMLInputElement>(null);

  const closeBackupDialog = () => {
    if (isBackupBusy) return;
    setBackupMode(null);
    setBackupPassphrase('');
    setBackupPassphraseConfirmation('');
    setBackupFile(null);
    setBackupError('');
  };

  const handleBackupSubmit = async () => {
    if (!backupMode || isBackupBusy) return;
    setBackupError('');

    if (Array.from(backupPassphrase).length < 12) {
      setBackupError('أدخل عبارة مرور من 12 حرفاً على الأقل.');
      return;
    }
    if (backupMode === 'export' && backupPassphrase !== backupPassphraseConfirmation) {
      setBackupError('تأكيد كلمة المرور غير مطابق.');
      return;
    }
    if (backupMode === 'import' && !backupFile) {
      setBackupError('اختر ملف النسخة الاحتياطية أولاً.');
      return;
    }

    setIsBackupBusy(true);
    try {
      const completed = backupMode === 'export'
        ? await exportEncryptedBackup(backupPassphrase)
        : await importEncryptedBackup(backupFile as File, backupPassphrase);
      if (completed) {
        setBackupMode(null);
        setBackupPassphrase('');
        setBackupPassphraseConfirmation('');
        setBackupFile(null);
        setBackupError('');
      } else {
        setBackupError('لم تكتمل العملية. راجع رسالة التنبيه وتحقق من صلاحية ترخيص Pro.');
      }
    } catch {
      setBackupError('تعذر إتمام عملية النسخ الاحتياطي.');
    } finally {
      setIsBackupBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-[#f8fafc] shrink-0">
            <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
              <FolderOpen size={18} className="text-[#0a5d38]" />
              المسائل المحفوظة ({savedCases.length})
            </h3>
            <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] transition-colors" aria-label="إغلاق"><X size={20} /></button>
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
                      aria-label={`حذف ${c.name}`}
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
            {savedCases.length > 0 && (
              <p role="note" className="w-full text-right text-[11px] leading-relaxed text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                تنبيه: ملف JSON العادي غير مشفّر ويحتوي على أسماء القضايا والورثة والمبالغ والبيانات التفصيلية. احفظه في وسيط آمن ولا ترسله عبر قنوات غير موثوقة.
              </p>
            )}
            <div className="flex flex-wrap gap-2 justify-end w-full">
              <label
                className={`px-4 py-2 text-sm text-white rounded-md transition-colors cursor-pointer ${isImporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isImporting ? 'جاري الاستيراد...' : 'استيراد JSON'}
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={importData}
                  className="hidden"
                  disabled={isImporting}
                  aria-busy={isImporting}
                />
              </label>
              {savedCases.length > 0 && (
                <button
                  type="button"
                  onClick={exportData}
                  className="px-4 py-2 text-sm bg-[#0a5d38] text-white hover:bg-[#074a2c] rounded-md transition-colors"
                >
                  تصدير JSON
                </button>
              )}
              {isPaid && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setBackupMode('export');
                      setBackupFile(null);
                      setBackupPassphrase('');
                      setBackupPassphraseConfirmation('');
                      setBackupError('');
                    }}
                    disabled={isImporting || isBackupBusy}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-emerald-50 border border-emerald-700 text-emerald-900 hover:bg-emerald-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    <LockKeyhole size={15} />
                    نسخة مشفّرة Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => encryptedBackupInputRef.current?.click()}
                    disabled={isImporting || isBackupBusy}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm border border-emerald-700 text-emerald-900 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Upload size={15} />
                    استيراد مشفّر
                  </button>
                  <input
                    ref={encryptedBackupInputRef}
                    type="file"
                    accept=".mwbackup,application/json"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = '';
                      if (file) {
                        setBackupFile(file);
                        setBackupMode('import');
                        setBackupPassphrase('');
                        setBackupPassphraseConfirmation('');
                        setBackupError('');
                      }
                    }}
                    disabled={isImporting || isBackupBusy}
                  />
                </>
              )}
            </div>
            {isPaid && (
              <p className="w-full text-right text-[11px] leading-relaxed text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                النسخة المشفّرة تشمل المسائل المحفوظة وإعدادات المكتب. لا تُرسل البيانات إلى خادم، ولا تحتفظ مواريث بكلمة المرور.
              </p>
            )}
          </div>
        </div>
      </div>

      {backupMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={closeBackupDialog}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="encrypted-backup-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={event => event.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id="encrypted-backup-title" className="flex items-center gap-2 font-bold text-slate-900">
                <LockKeyhole size={19} className="text-emerald-800" />
                {backupMode === 'export' ? 'إنشاء نسخة احتياطية مشفّرة' : 'استيراد نسخة احتياطية مشفّرة'}
              </h3>
              <button
                type="button"
                onClick={closeBackupDialog}
                disabled={isBackupBusy}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="إغلاق"
              >
                <X size={19} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {backupMode === 'export'
                ? 'أنشئ عبارة مرور قوية واحتفظ بها بشكل مستقل. ستحتاج إليها لفتح النسخة على أي جهاز.'
                : `الملف المختار: ${backupFile?.name ?? 'غير محدد'}`}
            </p>

            <label className="mt-4 block text-sm font-semibold text-slate-800" htmlFor="backup-passphrase">
              كلمة مرور النسخة الاحتياطية
            </label>
            <input
              id="backup-passphrase"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
              value={backupPassphrase}
              onChange={event => setBackupPassphrase(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-left text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              dir="ltr"
              disabled={isBackupBusy}
            />

            {backupMode === 'export' && (
              <>
                <label className="mt-3 block text-sm font-semibold text-slate-800" htmlFor="backup-passphrase-confirm">
                  تأكيد كلمة المرور
                </label>
                <input
                  id="backup-passphrase-confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={256}
                  value={backupPassphraseConfirmation}
                  onChange={event => setBackupPassphraseConfirmation(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-left text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  dir="ltr"
                  disabled={isBackupBusy}
                />
              </>
            )}

            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-950">
              لا يمكن استعادة الملف عند فقدان كلمة المرور. لا تحفظها داخل ملف النسخة نفسه ولا ترسلها معه.
            </p>

            {backupError && (
              <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {backupError}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleBackupSubmit}
                disabled={isBackupBusy || isImporting || (backupMode === 'import' && !backupFile)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
              >
                {backupMode === 'export' ? <Download size={16} /> : <Upload size={16} />}
                {isBackupBusy ? 'جارٍ التنفيذ...' : backupMode === 'export' ? 'إنشاء وتنزيل' : 'فك التشفير والاستيراد'}
              </button>
              <button
                type="button"
                onClick={closeBackupDialog}
                disabled={isBackupBusy}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </section>
        </div>
      )}

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
