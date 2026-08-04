import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const resend = getResendClient();
  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Mawarith Notary Platform <no-reply@mawarith.dz>',
        to,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.error('Failed to send email via Resend:', err);
    }
  }

  // Fallback logging for environments where RESEND_API_KEY is not configured
  console.log(`[EMAIL DISPATCH SIMULATION] To: ${to} | Subject: ${subject}\nHTML: ${html}`);
  return true;
}

export async function sendAccountAlreadyExistsNotice(email: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const loginUrl = `${baseUrl}/login`;
  await sendEmail({
    to: email,
    subject: 'تنبيه أمني: محاولة تسجيل حساب موجود بالفعل - منصة مواريث',
    html: `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">
        <h2 style="color: #0a5d38;">تنبيه أمني من ديوان التوثيق الرقمي</h2>
        <p>تمت محاولة تسجيل حساب جديد باستخدام بريدكم الإلكتروني المهني (<strong>${email}</strong>) على منصة مواريث.</p>
        <p>إذا كنتم أنتم من قمتم بهذه المحاولة، فيمكنكم تسجيل الدخول مباشرة لحسابكم عبر الرابط التالي:</p>
        <p style="margin: 20px 0;">
          <a href="${loginUrl}" style="background-color: #0a5d38; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            تسجيل الدخول للحساب
          </a>
        </p>
        <p>إذا لم تكونوا من حاول التسجيل، يرجى تجاهل هذا البريد لحماية خصوصيتكم.</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: 'تأكيد البريد الإلكتروني - منصة مواريث الرقمية للتوثيق',
    html: `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">
        <h2 style="color: #0a5d38;">تأكيد حساب ديوان التوثيق</h2>
        <p>مرحباً بك في منصة مواريث الرقمية. يرجى الضغط على الرابط أدناه لتأكيد بريدك الإلكتروني المهني وتفعيل كامل خصائص الحساب:</p>
        <p style="margin: 20px 0;">
          <a href="${verifyUrl}" style="background-color: #0a5d38; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            تأكيد البريد الإلكتروني
          </a>
        </p>
        <p style="font-size: 12px; color: #64748b;">ينتهي هذا الرابط خلال 24 ساعة.</p>
      </div>
    `,
  });
}
