import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, Mail, User, Building, ArrowRight, AlertTriangle } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { setSessionCookie } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { users, organizations } from '@/lib/db/schema';

async function handleRegisterAction(formData: FormData) {
  'use server';

  const name = formData.get('name')?.toString().trim();
  const firmName = formData.get('firmName')?.toString().trim();
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();

  if (!name || !firmName || !email || !password) {
    redirect('/register?error=missing_fields');
  }

  // Reject registration when DATABASE_URL is unset instead of silently faking success
  if (!process.env.DATABASE_URL) {
    redirect('/register?error=db_unset');
  }

  const db = getDb();
  if (!db) {
    redirect('/register?error=db_unset');
  }

  // Check if email already registered
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    redirect('/register?error=email_exists');
  }

  // Hash password using bcrypt
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate unique IDs
  const orgId = 'org_' + crypto.randomUUID().substring(0, 8);
  const userId = 'usr_' + crypto.randomUUID().substring(0, 8);

  // Create Organization first
  await db.insert(organizations).values({
    id: orgId,
    name: firmName,
    plan: 'free',
  });

  // Create User
  await db.insert(users).values({
    id: userId,
    email,
    passwordHash,
    name,
    role: 'notary',
    organizationId: orgId,
  });

  // Set signed JWT session cookie
  await setSessionCookie({
    userId,
    email,
    name,
    organizationId: orgId,
    plan: 'free',
    role: 'notary',
  });

  redirect('/');
}

interface RegisterPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function RegisterPage(props: RegisterPageProps) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error;

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

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              {error === 'db_unset' && (
                <span>خطأ في النظام: قاعدة البيانات غير متصلة (DATABASE_URL غير محدد). يتعذر إنشاء الحسابات.</span>
              )}
              {error === 'email_exists' && (
                <span>البريد الإلكتروني المدخل مسجل بالفعل لمكتب توثيق آخر.</span>
              )}
              {error === 'missing_fields' && (
                <span>جميع الحقول مطلوبة لتسجيل ديوان توثيق جديد.</span>
              )}
            </div>
          </div>
        )}

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
