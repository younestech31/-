import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, Mail, User, Building, ArrowRight } from 'lucide-react';
import { setSessionCookie } from '@/lib/auth/session';

async function handleRegisterAction(formData: FormData) {
  'use server';

  const name = formData.get('name')?.toString().trim();
  const firmName = formData.get('firmName')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!name || !firmName || !email || !password) {
    throw new Error('جميع الحقول مطلوبة لتسجيل مكتب توثيق جديد');
  }

  // Create organization and set session cookie
  await setSessionCookie({
    userId: 'usr_' + Math.random().toString(36).substring(2, 9),
    email,
    name,
    organizationId: 'org_' + Math.random().toString(36).substring(2, 9),
    plan: 'free',
    role: 'notary',
  });

  redirect('/');
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-950 border border-emerald-500/30 rounded-xl text-emerald-400 mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">تسجيل ديوان توثيق جديد</h1>
          <p className="text-xs text-slate-400">انضم لمنصة التوثيق الرقمي المعالجة محلياً 100%</p>
        </div>

        <form action={handleRegisterAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم واللقب (الأستاذ الموثق)</label>
            <div className="relative">
              <input
                type="text"
                name="name"
                required
                placeholder="الأستاذ لعطب محمد"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 pr-10"
              />
              <User className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم مكتب / ديوان التوثيق</label>
            <div className="relative">
              <input
                type="text"
                name="firmName"
                required
                placeholder="الديوان العمومي للتوثيق بوهران"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 pr-10"
              />
              <Building className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني المهني</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                placeholder="notaire@lattab.dz"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 pr-10"
                dir="ltr"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور المشفرة</label>
            <div className="relative">
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 pr-10"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2 space-x-reverse"
          >
            <span>إنشاء الحساب والتفعيل المباشر</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-700/60 text-xs text-slate-400">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-emerald-400 font-bold hover:underline">
            تسجيل الدخول
          </Link>
        </div>

      </div>
    </div>
  );
}
