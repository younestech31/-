'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { 
  Lock, 
  Scale, 
  FileText, 
  Save, 
  X, 
  AlertTriangle, 
  Lightbulb
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface OnboardingGuideProps {
  onOpenStateChange?: (isOpen: boolean) => void;
}

const steps = [
  {
    title: "مرحباً بك في حاسبة الميراث الرقمية المحترفة",
    spotlight: null,
    body: `هذه الحاسبة المتطورة مُصممة خصيصاً لمكاتب التوثيق والقضاء في الجزائر لتصفية التركات وقسمة الفرائض والمواريث.
    
    تُطبّق المنظومة بدقة بالغة أحكام قانون الأسرة الجزائري (المواد 126 إلى 183 من الأمر رقم 84-11 المعدل والمتمم) وقواعد الفقه المالكي المعمول بها في المحاكم الجزائرية.
    
    🔒 أمان وخصوصية مطلقة: تتم جميع العمليات الحسابية والمعالجة داخل متصفحك بالكامل (Client-side)، مما يضمن عدم خروج أي أسماء أو تركات مالية حساسة خارج حاسوب المكتب.`,
    showBadges: true,
  },
  {
    title: "1️⃣ تصفية التركة والخصوم (المادة 180)",
    spotlight: '[data-panel="estate"]',
    body: `تتميز الحاسبة بالتصفية التلقائية والشرعية للحقوق المتعلقة بالتركة قبل البدء في توزيع المواريث، وذلك وفقاً للترتيب القانوني الإلزامي المحدد في المادة 180 من قانون الأسرة:
    
    ① مصاريف الجنازة وتجهيز الميت بالقدر المعروف شرعاً وقانوناً.
    ② الديون العينية (كالرهون والديون المرتبطة بأعيان التركة) والديون المرسلة الثابتة في ذمة المتوفى.
    ③ الوصية الاختيارية الصحيحة الصادرة لغير وارث، وتُنفذ تلقائياً في حدود ثلث (1/3) ما تبقى من التركة بعد أداء مصاريف التجهيز والديون (المادة 185)، وما تجاوز الثلث يتوقف على إجازة الورثة الحاضرين الراشدين وموافقتهم.
    
    📊 أدخل قيمة التركة بالدينار الجزائري (دج) واطرح الخصوم السابقة ليقوم النظام باحتساب "صافي التركة القابلة للقسمة" بدقة متناهية.`,
  },
  {
    title: "التنزيل أو الوصية الواجبة (المواد 169–172)",
    spotlight: '[data-panel="estate"]',
    body: `ينظم قانون الأسرة الجزائري "الوصية الواجبة" في المواد من 169 إلى 172 حمايةً للأحفاد الذين توفي والدهم أو والدتهم قبل الجد (أو الجدة) أو تزامناً مع وفاته:
    
    ✓ الفئات المستفيدة: أولاد الابن وأولاد البنت (ذكوراً وإناثاً) مهما نزلوا، المشمولين بنظام التنزيل القانوني.
    ✓ حد التنزيل الأقصى: الثلث الشرعي (1/3) من صافي التركة الإجمالية.
    ✓ شروط التطبيق التلقائي:
    أ) أن يكون فرع المورث قد توفي قبله أو معه.
    ب) ألا يكون الأحفاد قد ورثوا من الجد بطريق آخر (كالميراث العادي).
    ج) ألا يكون الجد قد منحهم هبة أو وصية اختيارية تعادل نصيبهم المفترض.
    
    ⚙️ عند تفعيل خيار التنزيل، حدد عدد الأبناء والبنات المتوفين قبل المورث ليتولى النظام احتساب وتنزيل نصيبهم الشرعي تلقائياً ونقله لأبنائهم بالتساوي للذكر مثل حظ الأنثيين.`,
    warning: "تحذير قانوني: لا تفعّل هذا الخيار إلا إذا ثبت موت وارث مباشر في حياة مؤصله وله فروع أحياء تجوز في حقهم الوصية القانونية.",
  },
  {
    title: "2️⃣ تحديد الورثة وشجرة العائلة التفاعلية",
    spotlight: '[data-panel="heirs"]',
    body: `تتيح اللوحة التفاعلية لشجرة العائلة اختيار الورثة الموجودين عند الوفاة بمرونة متناهية، بالتصنيف المعياري المعتمد فقهياً وقانونياً:
    
    🟢 أصحاب الفروض (المواد 144–148): وهم الورثة الذين حدد لهم القانون أنصبة مقدرة وثابتة (كالزوج، الزوجة، البنت، الأب، الأم، الأخت الشقيقة، الجدة، وغيرهم).
    🔵 العصبة بأنفسهم وبغيرهم ومع غيرهم (المواد 150–155): وهم الذين يرثون باقي التركة بعد تلبية أنصبة أصحاب الفروض، أو يرثون الكل عند انفرادهم (كالابن، الأب، الأخ الشقيق، العم...).
    🟡 ذوو الأرحام (المواد 156–158): وهم أقارب الميت الذين لا يرثون بفرض ولا تعصيب (كالخال والخالة والعم لأم)، وينزلون منزلة أصحابها عند انعدام الورثة الشرعيين الآخرين.
    
    💡 الحظر والحجب الديناميكي: يقوم النظام تلقائياً بتعطيل وحظر الاختيارات المتناقضة في الشجرة (مثل اختيار زوجة وزوج معاً لمتوفى واحد) لتجنب الإدخال الخاطئ.`,
    tip: "لإدخال ورثة متعددين كالزوجات أو الإخوة والأبناء، انقر على العنصر في الشجرة وأدخل العدد والأسماء الفردية لتضمينها في ملفات التصدير.",
  },
  {
    title: "3️⃣ قواعد الحجب التلقائي وفك التعارض",
    spotlight: null,
    body: `يطبق المحرك الحسابي قواعد الحجب الشرعية فوراً بمجرد اختيار الورثة لمنع التداخلات والادعاءات الباطلة:
    
    🚫 حجب الحرمان (الإسقاط الكلي):
    • الابن المباشر يحجب ابن الابن، ويحجب الإخوة الأشقاء والأبناء للأخ والأعمام بالكامل.
    • الأب يحجب الجد الصحيح ويحجب الإخوة والأخوات والعمومة حجب حرمان كلي (المادة 162).
    • الإخوة الأشقاء يحجبون الإخوة لأب.
    
    📉 حجب النقصان (تخفيض الحصص):
    • ينتقل الزوج من النصف (1/2) إلى الربع (1/4) بوجود فرع وارث (المادة 144).
    • تنقص حصة الأم من الثلث (1/3) إلى السدس (1/6) بوجود فرع وارث أو عدد من الإخوة (المادة 146).
    
    🔍 تفاصيل الحجب الفردية: بمجرد حساب المسألة، انقر فوق أي وارث معطل أو محجوب في الجدول لعرض المادة القانونية والسبب الشرعي لحجبه وتوضيحه للزبائن.`,
  },
  {
    title: "4️⃣ معالجة العول والرد وتصحيح المسائل",
    spotlight: '[data-panel="results"]',
    body: `تنتهي المسألة الحسابية بالتصحيح التلقائي للأصل والسهام بما يتوافق مع القواعد الجبرية الموحدة للفقه والقانون الجزائري:
    
    ⚖️ معالجة العول (المادة 166):
    إذا زادت مجموع فروض الورثة المقدرة على أصل المسألة (مثل مسألة المنبرية فروعها تزيد على 24 وتؤول بالمنبرية إلى 27)، يقوم المحرك بتقليص أنصبة أصحاب الفروض تلقائياً بشكل نسبي دون حرمان أحد وتعديل الأصل الجديد للمسألة.
    
    🔄 معالجة الرد (المادة 167):
    عند بقاء فائض مالي بعد تلبية أنصبة الفروض وغياب العصبة لتلقي الباقي، يُرد المتبقي على أصحاب الفروض بنسبة أنصبتهم استثناءً من الزوجين (الزوج والزوجة لا يرد عليهما في القانون الجزائري ومذهب مالك حفاظاً على حقوق ذوي القرابة النسبية).
    
    🔢 تصحيح الانكسار: تُحسب مخارج السهام لتبسيط التوزيع دون كسور صعبة لضمان دقة التقارير.`,
  },
  {
    title: "5️⃣ هندسة المناسخات (الوفيات المتعددة والمتشعبة)",
    spotlight: null,
    body: `المناسخات هي أكثر المسائل التوثيقية تعقيداً عند موت أحد الورثة قبل قسمة التركة الأولى وتحديد نصيب كل فئة. الحاسبة تجعلها شديدة السهولة:
    
    ➕ إنشاء مرحلة مناسخة: انقر على الرمز (＋) الأخضر بجانب اسم أي وارث حي في لوحة النتائج لإنشاء مرحلة وفاة جديدة له.
    🪙 انتقال الحصص والتركة التلقائي:
    • القيمة المالية والسهام الشرعية التي استحقها في المرحلة السابقة تنتقل تلقائياً كـ 'تركة جديدة' للمرحلة الحالية لتتوزع بحرية على ورثته الجدد.
    • تُمكّن المنظومة من إنشاء مراحل متسلسلة بلا حدود لحل أصعب الفرائض المناسخاتية المفتوحة لعقود.
    • استخدام الأزرار العلوية الملونة للتنقل الآني برأس التصفح بين مراحل الوفيات ورؤية تدرج التركة.`,
    warning: "ملاحظة هامة: تأكد من مراجعة وتحديد جنس المتوفى واسمه بدقة في كل مرحلة مناسخة لأن ذلك يغير تماماً خريطة شجرة ورثته وأنصبتهم.",
  },
  {
    title: "6️⃣ الأمثلة القانونية والفقهية التاريخية",
    spotlight: null,
    body: `زُوّد التطبيق بدليل مرجعي تفاعلي للأمثلة التاريخية الكلاسيكية المجمع عليها لدى الموثقين والقضاة، انقر على زر 'أمثلة جاهزة' بالمنيو لتحميلها فوراً ومحاكاتها:
    
    📌 المنبرية: (بنتان، زوجة، أم، وأب) — عول من 24 إلى 27 وسُميت بالمنبرية لإفتاء الإمام علي كرم الله وجهه بها وهو على منبر الكوفة.
    📌 الغراوان (أو العمريتان - المادة 177): (زوج، أم، أب) أو (زوجة، أم، أب) — تأخذ الأم ثلث الباقي وليس ثلث كامل التركة بمقتضى قضاء عمر رضي الله عنه.
    📌 المشتركة أو الحمارية (المادة 176): (زوج، أم، إخوة لأم، إخوة أشقاء) — يشرك الإخوة الأشقاء مع الإخوة لأم في الثلث بالتساوي للذكر والأنثى على حد سواء.
    📌 الأكدرية: (زوج، أم، جد، وأخت شقيقة) — مسألة مشهورة خالفت القياس وتصح وتفرع من 27 سهماً لتعديل نصيب الجد مع الأخت.`,
  },
  {
    title: "7️⃣ ملفات التصدير والحفظ والتقارير الرسمية",
    spotlight: null,
    body: `بمجرد الانتهاء من احتساب الفريضة، تمنحك الحاسبة أدوات تصدير قوية مطابقة للمقاييس المعتمدة في مكاتب التوثيق بالقضاء والبلدية:
    
    💾 الحفظ السحابي والمحلي: احفظ ملف القضية في المتصفح للرجوع وتعديل الحصص والمناسخات لاحقاً في أي يوم بنقرة واحدة.
    
    📕 التصدير بصيغة PDF الحديثة: استخراج وثيقة رسمية جاهزة للطباعة والختم تحتوي على شجرة العائلة الرائعة وجدول تفصيلي لتوزيع الأنصبة والسهام ومبررات الحجب الشرعية.
    
    📄 ملخص نصي فوري (.txt): صياغة مستند نصي رسمي يعود للقانون والآيات الكريمة والأدلة لإملاء وتضمين نصوص الفريضة في محضر التوثيق مباشرة.
    
    📊 التصدير لبرنامج Excel (.xlsx): يستخرج جدولاً مالياً دقيقاً وشاملاً لجميع مستحقات الورثة والكسور العشرية لتسهيل العمليات الحسابية والبنكية.
    
    📝 التصدير لبرنامج Word (.docx): صياغة تقرير فريضة رسمي منسق بعناية تامة لتقديمه مباشرة للجهات القضائية ومصالح التسجيل والضرائب.`,
  },
  {
    title: "🚀 نصائح الاستخدام الاحترافي",
    spotlight: null,
    body: `للبقاء في مأمن من الأخطاء التصفوية، اتبع دائماً هذا المسار المعتمد:
    
    1. أدخل الاسم الكامل للمتوفى ليتم طباعته على رأس مستندات التسجيل.
    2. صَفّ الديون والجنازة لضمان عدم تعرض فروع المورث لأي ظلم تصفوي.
    3. راجع بدقة الورثة المحجوبين والتفسير المرفق مع كل وارث لتقديم استشارات قانونية موثوقة للورثة.
    4. تتبع تفاصيل "الوصية الواجبة" للتأكد من الموت المسبق للأبناء أو البنات والمطابقة مع المادة 169.
    
    الدليل متوفر دائماً بنقرة على زر ( ؟ ) في الزاوية السفلى. تمنياتنا لكم بعمل توثيقي ميسر وناجح!`,
  }
];

const TOTAL_STEPS = steps.length;

export default function OnboardingGuide({ onOpenStateChange }: OnboardingGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});

  const isMobile = useIsMobile();
  const prevSpotlightRef = useRef<Element | null>(null);
  const desktopCardRef = useRef<HTMLDivElement>(null);

  const closeGuide = useCallback(() => {
    localStorage.setItem('mirath_guide_seen', 'true');
    setIsOpen(false);
  }, []);

  const handleSkip = useCallback(() => {
    closeGuide();
  }, [closeGuide]);

  // Sync open state with parent if needed
  useEffect(() => {
    if (onOpenStateChange) {
      onOpenStateChange(isOpen);
    }
  }, [isOpen, onOpenStateChange]);

  // Check if first visit
  useEffect(() => {
    const seen = localStorage.getItem('mirath_guide_seen');
    if (!seen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setCurrentStep(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // ESC key + back-button guard
  useEffect(() => {
    if (!isOpen) return;
    const handlePop = (e: PopStateEvent) => {
      e.preventDefault();
      closeGuide();
    };
    // Push a dummy state so the back button has somewhere to pop to
    window.history.pushState({ guide: true }, '');
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
    };
  }, [isOpen, closeGuide]);

  // Scroll panel into view before spotlight (mobile only)
  const scrollPanelIntoView = useCallback((panelName: string) => {
    if (!isMobile) return;
    const el = document.querySelector(`[data-panel="${panelName}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isMobile]);

  useEffect(() => {
    const panelMap: Record<number, string> = {
      1: 'estate',   // step index 1 → EstatePanel
      2: 'estate',   // step index 2 → mandatory bequest (same panel)
      3: 'heirs',    // step index 3 → HeirsPanel
      5: 'results',  // step index 5 → ResultsTable
    };
    const target = panelMap[currentStep];
    if (target) {
      scrollPanelIntoView(target);
    }
  }, [currentStep, scrollPanelIntoView]);

  // Spotlight border-t-4 highlighter on mobile
  useEffect(() => {
    // Remove from previous
    prevSpotlightRef.current?.classList.remove('border-t-4', 'border-[#c5a059]');
    
    // Add to current
    const panelMap: Record<number, string> = {
      1: 'estate',
      2: 'estate',
      3: 'heirs',
      5: 'results',
    };
    const target = panelMap[currentStep];
    if (target && isMobile && isOpen) {
      const el = document.querySelector(`[data-panel="${target}"]`);
      if (el) {
        el.classList.add('border-t-4', 'border-[#c5a059]');
        prevSpotlightRef.current = el;
      }
    } else {
      prevSpotlightRef.current = null;
    }
    
    // Cleanup on unmount or when step/mode/isOpen state changes
    return () => {
      prevSpotlightRef.current?.classList.remove('border-t-4', 'border-[#c5a059]');
    };
  }, [currentStep, isMobile, isOpen]);

  // Layout and spotlight tracking (Desktop only)
  useEffect(() => {
    if (!isOpen) {
      if (rect !== null) {
        const timer = setTimeout(() => {
          setRect(null);
        }, 0);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (isMobile) {
      if (rect !== null || Object.keys(cardStyle).length > 0) {
        const timer = setTimeout(() => {
          setRect(null);
          setCardStyle({});
        }, 0);
        return () => clearTimeout(timer);
      }
      return;
    }

    const updateLayout = () => {
      const step = steps[currentStep];
      if (!step || !step.spotlight) {
        setRect(null);
        setCardStyle({});
        return;
      }

      const el = document.querySelector(step.spotlight);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect(r);

        // On desktop, place it dynamically with a safe margin
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const cardWidth = 448; // max-w-md
        
        // Measure real card height dynamically
        const cardElement = desktopCardRef.current;
        const actualCardHeight = cardElement ? cardElement.offsetHeight : 480;
        
        let left = 0;

        // If highlighted panel is in the right half of the screen
        if (r.left + r.width / 2 > screenWidth / 2) {
          left = r.left - cardWidth - 24;
        } else {
          left = r.left + r.width + 24;
        }

        // Clamp left to make sure it's always fully visible within the viewport
        left = Math.max(16, Math.min(screenWidth - cardWidth - 16, left));

        // Clamp top to keep inside vertical viewport bounds safely (min 80px, max viewport minus actual card height)
        let top = r.top + 20;
        top = Math.max(80, Math.min(screenHeight - actualCardHeight - 20, top));

        setCardStyle({
          position: 'fixed',
          left: `${left}px`,
          top: `${top}px`,
          width: `${cardWidth}px`,
        });
      } else {
        // Fallback
        setRect(null);
        setCardStyle({});
      }
    };

    const initTimer = setTimeout(updateLayout, 0);
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout);

    // Poll frequently (every 150ms) to sync positions instantly on window animation or layout shifts
    const interval = setInterval(updateLayout, 150);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isOpen, isMobile]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      closeGuide();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleTrigger = () => {
    setIsOpen(true);
    setCurrentStep(0);
  };

  // Custom body renderer for pretty bullet points and text blocks
  const renderBodyText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      // Match bullets and badges
      const char = trimmed.charAt(0);
      const isBullet = char === '•' || char === '✓' || char === '①' || char === '②' || char === '③' || char === '🟢' || char === '🔵' || char === '🟡' || char === '📌' || char === '💾' || char === '📂' || char === '📄' || char === '📊' || char === '📝' || char === '🖨️';

      if (isBullet) {
        const textContent = char === '•' ? trimmed.substring(1).trim() : trimmed;
        return (
          <div key={idx} className="flex gap-2 text-sm text-[#475569] leading-relaxed mb-1.5 align-top">
            <span className="shrink-0 select-none text-[#c5a059] font-bold">{char === '•' ? '•' : ''}</span>
            <span className="flex-1 text-[#334155]">{textContent}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-sm text-[#334155] leading-relaxed mb-2">
          {trimmed}
        </p>
      );
    });
  };

  const step1Badges = [
    { icon: <Lock size={14} className="text-[#0a5d38]" />, label: "خصوصية تامة" },
    { icon: <Scale size={14} className="text-[#c5a059]" />, label: "وفق القانون" },
    { icon: <FileText size={14} className="text-[#0a5d38]" />, label: "تصدير رسمي" },
    { icon: <Save size={14} className="text-[#c5a059]" />, label: "حفظ المسائل" },
  ];

  return (
    <>
      {/* 1. "?" Always Available Floating Trigger Button */}
      <button
        id="onboarding-guide-trigger"
        onClick={handleTrigger}
        className={`fixed z-40 bg-[#0a5d38] hover:bg-[#07472a] text-white rounded-full
                    shadow-lg flex flex-col items-center justify-center
                    transition-all active:scale-95 border-2 border-[#c5a059] cursor-pointer no-print group
                    ${isMobile
                      ? 'bottom-[72px] left-4 w-11 h-11 text-xs'
                      : 'bottom-6 left-6 w-12 h-12 text-sm'
                    }`}
        title="دليل الاستخدام"
      >
        <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-extrabold leading-none group-hover:rotate-12 transition-transform`}>؟</span>
        <span className={`${isMobile ? 'text-[8px]' : 'text-[9px]'} font-bold mt-0.5 leading-none`}>دليل</span>
      </button>

      {/* Custom keyframes styling injected globally inside the browser wrapper */}
      <style jsx global>{`
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
          animation: fadeInRight 0.30s ease-out forwards;
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-none" dir="rtl">
            
            {/* 2. Spotlight Visual Backdrop */}
            {rect ? (
              <div 
                className="fixed pointer-events-none transition-all duration-300 z-40 rounded-lg border border-[#c5a059]/20"
                style={{
                  top: rect.top - 6,
                  left: rect.left - 6,
                  width: rect.width + 12,
                  height: rect.height + 12,
                  boxShadow: `0 0 0 4px #c5a059, 0 0 0 9999px ${isMobile ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)'}`,
                }}
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 pointer-events-auto bg-black/45"
                onClick={handleSkip}
              />
            )}

            {/* 3. Floating Interaction Card */}
            {isMobile ? (
              /* MOBILE CARD LAYOUT (Bottom Sheet) */
              <div
                className="fixed z-[60] bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.18)] p-5 pb-[env(safe-area-inset-bottom,16px)] max-h-[75dvh] overflow-y-auto pointer-events-auto flex flex-col animate-in slide-in-from-bottom-4 duration-300"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <span className="text-[11px] text-[#94a3b8] font-mono">
                    {currentStep + 1} / {TOTAL_STEPS}
                  </span>
                  <button
                    onClick={closeGuide}
                    aria-label="تخطي الدليل"
                    className="text-[11px] text-[#94a3b8] hover:text-[#475569] underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    تخطّي
                  </button>
                </div>

                {/* Gold progress bar */}
                <div className="w-full h-1 bg-[#e2e8f0] rounded-full mb-4 overflow-hidden shrink-0">
                  <div
                    className="h-full bg-[#c5a059] rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
                  />
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto select-text">
                  {currentStep === 0 && (
                    <div className="flex justify-center mb-5 mt-1">
                      <Image
                        src="/logo/logo-stacked-color.svg"
                        alt="مواريث"
                        width={130}
                        height={130}
                        className="h-24 w-auto object-contain select-none pointer-events-none"
                        style={{ width: 'auto', height: 'auto' }}
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-[#0a5d38] mb-3 leading-snug">
                    {steps[currentStep].title}
                  </h3>

                  {/* Body wrap with max-height guard */}
                  <div className="overflow-y-auto max-h-[40dvh] sm:max-h-none text-sm text-[#334155] leading-relaxed space-y-2">
                    {renderBodyText(steps[currentStep].body)}
                  </div>

                  {/* Badge Area for Step 1 */}
                  {steps[currentStep].showBadges && (
                    <div className="flex flex-wrap justify-center gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {step1Badges.map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200/60 shadow-xs shrink-0">
                          {badge.icon}
                          <span className="text-xs font-semibold text-slate-700">{badge.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warning Box */}
                  {steps[currentStep].warning && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-3 rounded-xl mt-3">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                        {steps[currentStep].warning}
                      </p>
                    </div>
                  )}

                  {/* Tip Box */}
                  {steps[currentStep].tip && (
                    <div className="flex items-start gap-2 bg-[#f1fcf7] border border-[#d1f5e5] p-3 rounded-xl mt-3">
                      <Lightbulb size={16} className="text-[#0a5d38] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#0a5d38] leading-relaxed font-medium">
                        {steps[currentStep].tip}
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Controls Footer */}
                <div className="flex gap-3 mt-4 flex-row-reverse [&>button]:min-h-[44px] [&>button]:flex-1 sm:[&>button]:flex-none sm:[&>button]:px-5 border-t border-slate-100 pt-4 shrink-0">
                  <button
                    onClick={handleNext}
                    className="bg-[#0a5d38] text-white rounded-xl text-sm font-bold px-4 py-2.5 min-h-[44px] flex-1 hover:bg-[#0a5d38]/90 active:scale-95 transition-all select-none cursor-pointer"
                  >
                    {currentStep === TOTAL_STEPS - 1 ? "ابدأ الآن ←" : "التالي ←"}
                  </button>
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="border border-[#e2e8f0] text-[#475569] rounded-xl text-sm px-4 py-2.5 min-h-[44px] flex-1 hover:bg-slate-50 active:scale-95 transition-all select-none cursor-pointer"
                    >
                      السابق →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* DESKTOP CARD LAYOUT (Floating Modal) */
              <motion.div
                ref={desktopCardRef}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                style={cardStyle}
                className={`fixed z-[60] bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto flex flex-col max-h-[85vh] ${
                  rect 
                    ? 'w-[448px]' 
                    : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg'
                }`}
              >
                {/* Gold Progress Bar */}
                <div className="w-full bg-gray-100 h-1 shrink-0 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#c5a059] h-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
                  />
                </div>

                {/* Header Row */}
                <div className="flex items-center justify-between mt-4 mb-3 shrink-0" dir="rtl">
                  <span className="text-[11px] font-bold text-[#c5a059] uppercase tracking-wide bg-[#c5a059]/10 px-2.5 py-1 rounded-md">
                    الخطوة {currentStep + 1} من {TOTAL_STEPS}
                  </span>
                  
                  <button 
                    onClick={handleSkip}
                    className="text-[#64748b] hover:text-[#ef4444] transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                    title="تخطي الدليل"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-grow overflow-y-auto pr-1 select-text space-y-4 min-h-0" dir="rtl">
                  {currentStep === 0 && (
                    <div className="flex justify-center mb-4 mt-1">
                      <Image
                        src="/logo/logo-stacked-color.svg"
                        alt="مواريث"
                        width={140}
                        height={140}
                        className="h-28 w-auto object-contain select-none pointer-events-none"
                        style={{ width: 'auto', height: 'auto' }}
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-[#0a5d38] mb-2 leading-snug">
                    {steps[currentStep].title}
                  </h3>

                  <div className="space-y-1 text-[#334155]">
                    {renderBodyText(steps[currentStep].body)}
                  </div>

                  {/* Badge Area for Step 1 */}
                  {steps[currentStep].showBadges && (
                    <div className="flex flex-wrap justify-center gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {step1Badges.map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200/60 shadow-xs shrink-0">
                          {badge.icon}
                          <span className="text-xs font-semibold text-slate-700">{badge.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warning Box */}
                  {steps[currentStep].warning && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-3 rounded-xl mt-3">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                        {steps[currentStep].warning}
                      </p>
                    </div>
                  )}

                  {/* Tip Box */}
                  {steps[currentStep].tip && (
                    <div className="flex items-start gap-2 bg-[#f1fcf7] border border-[#d1f5e5] p-3 rounded-xl mt-3">
                      <Lightbulb size={16} className="text-[#0a5d38] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#0a5d38] leading-relaxed font-medium">
                        {steps[currentStep].tip}
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Controls Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 shrink-0" dir="rtl">
                  {/* Skip Link Left Side */}
                  <button 
                    onClick={handleSkip}
                    className="text-xs text-[#64748b] hover:text-[#0b0f19] font-bold p-1 cursor-pointer hover:underline"
                  >
                    تخطّي الدليل
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    {currentStep > 0 && (
                      <button
                        onClick={handlePrev}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-[#e2e8f0] rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer select-none"
                      >
                        السابق →
                      </button>
                    )}

                    {/* Next Button */}
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0a5d38] rounded-xl hover:bg-[#07472a] shadow-md shadow-emerald-900/10 transition-all cursor-pointer select-none active:scale-95"
                    >
                      {currentStep === TOTAL_STEPS - 1 ? (
                        <span>ابدأ الآن ←</span>
                      ) : (
                        <span>التالي ←</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
