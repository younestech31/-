import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, Mail, ArrowRight, AlertTriangle } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { setSessionCookie } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { users, organizations } from '@/lib/db/schema';
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rate-limit';

async function handleLoginAction(formData: FormData) {
  'use server';

  const email = formData.get('email')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    redirect('/login?error=missing_fields');
  }

  // Rate limiting check to prevent credential stuffing
  const rateLimit = checkRateLimit(email);
  if (!rateLimit.success) {
    redirect('/login?error=rate_limited');
  }

  // Reject login when DATABASE_URL is unset instead of silently faking success
  if (!process.env.DATABASE_URL) {
    redirect('/login?error=db_unset');
  }

  const db = getDb();
  if (!db) {
    redirect('/login?error=db_unset');
  }

  // Real credential verification against users table
  const foundUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (foundUsers.length === 0) {
    redirect('/login?error=invalid_credentials');
  }

  const user = foundUsers[0];
  if (!user.passwordHash) {
    redirect('/login?error=invalid_credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    redirect('/login?error=invalid_credentials');
  }

  // Fetch organization plan if organization exists
  let plan: 'free' | 'paid' = 'free';
  let orgId = user.organizationId || 'org_default';

  if (user.organizationId) {
    const orgs = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
    if (orgs.length > 0) {
      plan = (orgs[0].plan === 'paid' ? 'paid' : 'free');
      orgId = orgs[0].id;
    }
  }

  // Reset rate limit counter on successful login
  resetRateLimit(email);

  // Set signed JWT session cookie
  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    organizationId: orgId,
    plan,
    role: (user.role as 'notary' | 'admin' | 'clerk') || 'notary',
  });

  redirect('/');
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-950 border border-emerald-500/30 rounded-xl text-emerald-400 mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">تسجيل الدخول للموثقين</h1>
          <p className="text-xs text-slate-400">الديوان العمومي للتوثيق — منصة تصفية التركات الرسمية</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              {error === 'db_unset' && (
                <span>خطأ في النظام: قاعدة البيانات غير متصلة (DATABASE_URL غير محدد). يتعذر تحقق الحسابات.</span>
              )}
              {error === 'rate_limited' && (
                <span>تنبيه أمني: تم تجاوز عدد محاولات الدخول المسموح بها. يرجى الانتظار قبل إعادة المحاولة.</span>
              )}
              {error === 'invalid_credentials' && (
                <span>البريد الإلكتروني المهني أو كلمة المرور غير صحيحة.</span>
              )}
              {error === 'missing_fields' && (
                <span>يرجى إدخال جميع الحقول المطلوبة.</span>
              )}
            </div>
          </div>
        )}

        <form action={handleLoginAction} className="space-y-4">
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
            <span>دخول الآمن لمكتب التوثيق</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-700/60 text-xs text-slate-400">
          ليس لديك حساب بعد؟{' '}
          <Link href="/register" className="text-emerald-400 font-bold hover:underline">
            إنشاء حساب ديوان توثيق جديد
          </Link>
        </div>

      </div>
    </div>
  );
}
