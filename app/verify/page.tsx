'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, CheckCircle2, XCircle, Search, RefreshCw, FileText, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { getAuditRecordFromIndexedDB, getAllAuditRecordsFromIndexedDB, CalculationAuditRecord } from '@/lib/inheritance/calculation-audit';
import { LEGAL_INTERPRETATIONS_REGISTRY } from '@/lib/inheritance/legal-interpretations-registry';

function VerifyContent() {
  const searchParams = useSearchParams();
  const hashParam = searchParams.get('hash') || '';
  const _refParam = searchParams.get('ref') || '';
  const _idParam = searchParams.get('id') || '';

  const [inputHash, setInputHash] = useState(hashParam);
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<CalculationAuditRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [allRecords, setAllRecords] = useState<CalculationAuditRecord[]>([]);

  useEffect(() => {
    getAllAuditRecordsFromIndexedDB().then(records => {
      setAllRecords(records);
    });

    if (hashParam) {
      handleVerifyHash(hashParam);
    }
  }, [hashParam]);

  const handleVerifyHash = async (hashToVerify: string) => {
    const cleanHash = hashToVerify.trim();
    if (!cleanHash) return;
    setSearched(true);
    setRecord(null);
    if (!/^[a-f0-9]{64}$/i.test(cleanHash)) return;
    setLoading(true);

    try {
      // Audit records are device-local. No server lookup or remote record storage is used.
      const foundLocal = await getAuditRecordFromIndexedDB(cleanHash);
      if (foundLocal) {
        setRecord(foundLocal);
      } else {
        setRecord(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-3 bg-emerald-950 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">التحقق من سجل البصمة الرقمية</h1>
              <p className="text-sm text-slate-400">فحص البصمات المحفوظة على هذا الجهاز فقط</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>العودة للحاسبة</span>
            <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
          </Link>
        </div>

        {/* Informational Banner */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex items-start space-x-4 space-x-reverse">
          <Lock className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-white block mb-1">ما الذي يثبته هذا السجل؟</strong>
            تُحفظ سجلات التدقيق محلياً في قاعدة بيانات المتصفح (IndexedDB) ولا تُرسل إلى خادم. العثور على السجل يتيح إعادة فحص البصمة محلياً، لكنه لا يثبت بذاته صحة القسمة أو هوية من أنشأ السجل.
          </div>
        </div>

        {/* Verification Query Input */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <label className="block text-sm font-semibold text-slate-200">
            أدخل البصمة الرقمية المركبة SHA-256 (64 خانة سداسية عشرية):
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                placeholder="مثال: 8f9b2c1a4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
              />
              <Search className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
            </div>
            <button
              onClick={() => handleVerifyHash(inputHash)}
              disabled={loading || !inputHash.trim()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2 space-x-reverse"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              <span>فحص ومطابقة البصمة</span>
            </button>
          </div>
        </div>

        {/* Verification Result Section */}
        {searched && (
          <div className="space-y-6">
            {record ? (
              <div className="bg-slate-800/90 border border-emerald-500/50 rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    <div>
                      <h2 className="text-xl font-bold text-emerald-400">تم العثور على سجل بهذه البصمة</h2>
                      <p className="text-xs text-slate-400">السجل موجود في ذاكرة هذا المتصفح</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-full">
                    RECORD FOUND
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 space-y-2">
                    <span className="text-slate-400 text-xs block">معرف سجل التدقيق التشفيري (Audit ID):</span>
                    <span className="font-mono text-emerald-300 font-bold block">{record.auditId}</span>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 space-y-2">
                    <span className="text-slate-400 text-xs block">رقم مرجع الفريضة (Case Ref):</span>
                    <span className="font-mono text-white font-bold block">{record.caseRef || 'غير متاح في هذا السجل'}</span>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 space-y-2">
                    <span className="text-slate-400 text-xs block">تاريخ الإصدار والتسجيل:</span>
                    <span className="text-slate-200 font-medium block">
                      {new Date(record.timestamp).toLocaleString('ar-DZ')}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 space-y-2">
                    <span className="text-slate-400 text-xs block">إصدار المحرك التوثيقي (Legal Core):</span>
                    <span className="text-slate-200 font-medium block">{record.registryVersion}</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700 font-mono text-xs space-y-2">
                  <div className="text-slate-400">البصمة الكاملة للمستند (Combined SHA-256):</div>
                  <div className="text-emerald-400 break-all bg-slate-950 p-2.5 rounded border border-slate-800">
                    {record.combinedHash}
                  </div>
                </div>

                <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-4 text-xs text-amber-200 leading-relaxed">
                  <strong>حدود التحقق:</strong> وجود هذا السجل لا يثبت وحده أن محتوى وثيقة معينة يطابق الحساب الأصلي، ولا يثبت عدم تغيير الأنصبة أو هوية المصدر. للتحقق من سلامة المحتوى يلزم توفر المدخلات والنتائج الأصلية وإعادة حساب البصمة، أما السجل الحالي فلا يحتفظ بهذه البيانات.
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/90 border border-rose-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <XCircle className="w-8 h-8 text-rose-400" />
                  <div>
                    <h2 className="text-xl font-bold text-rose-400">لم يتم العثور على البصمة أو لا توجد سجلاّت متطابقة</h2>
                    <p className="text-xs text-slate-400">تنبيه: تحقّق من صحة الكود المنسوخ أو أنك تستخدم المتصفح الذي صَدَرت منه الفريضة</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  تُحفظ هذه السجلات في المتصفح الذي أنشأها فقط. عند فتح رمز QR على جهاز آخر، لن يظهر السجل إلا بعد استيراد البيانات أو استخدام المتصفح الأصلي.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Local Audit History List */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>السجلات التوثيقية المحفوظة محلياً ({allRecords.length})</span>
            </h3>
            <span className="text-xs text-slate-400">مخزنة في IndexedDB الخاص بمتصفحكم</span>
          </div>

          {allRecords.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              لا توجد فرائض محفوظة محلياً بعد. يتم تسجيل البصمات تلقائياً عند إجراء أي عملية حسابية.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/60 max-h-80 overflow-y-auto">
              {allRecords.map((rec) => (
                <div
                  key={rec.combinedHash}
                  onClick={() => {
                    setInputHash(rec.combinedHash);
                    handleVerifyHash(rec.combinedHash);
                  }}
                  className="py-3 px-2 hover:bg-slate-700/40 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-emerald-300 font-mono">{rec.caseRef}</div>
                    <div className="text-xs text-slate-400">
                      تاريخ: {new Date(rec.timestamp).toLocaleDateString('ar-DZ')} — {rec.summary.heirCount} ورثة
                    </div>
                  </div>
                  <div className="text-left font-mono text-xs text-slate-500 truncate max-w-[180px]">
                    {rec.combinedHash.slice(0, 16)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legal Registry Regulations Version Footnote */}
        <div className="text-center text-xs text-slate-500 py-4">
          المرجع القانوني المعتمد: المواد 139-180 قانون الأسرة الجزائري — سجل التفسيرات القضائية ({Object.keys(LEGAL_INTERPRETATIONS_REGISTRY).length} قاعدة)
        </div>

      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-slate-100 p-8">جاري التحميل...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
