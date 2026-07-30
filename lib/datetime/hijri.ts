/**
 * Offline Tabular Hijri Date Converter (Umm al-Qura approximation)
 * Computes Hijri year, month, and day without any external network call.
 */

const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

const HIJRI_MONTHS_FR = [
  'Mouharram', 'Safar', 'Rabi al-Awwal', 'Rabi ath-Thani',
  'Joumada al-Oula', 'Joumada ath-Thania', 'Rajab', 'Chaabane',
  'Ramadan', 'Chawwal', 'Dhou al-Qi\'da', 'Dhou al-Hijja'
];

export interface HijriDate {
  day: number;
  month: number;
  monthNameAr: string;
  monthNameFr: string;
  year: number;
}

export function getHijriDate(dateIn: Date = new Date()): HijriDate {
  const gYear = dateIn.getFullYear();
  const gMonth = dateIn.getMonth() + 1;
  const gDay = dateIn.getDate();

  // Julian Day Calculation
  const a = Math.floor((14 - gMonth) / 12);
  const y = gYear + 4800 - a;
  const m = gMonth + 12 * a - 3;
  const jd = gDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // Hijri calculation based on Kuwaiti Algorithm / Tabular Hijri
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  
  let hMonth = Math.floor((24 * l) / 709);
  const hDay = l - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;

  if (hMonth < 1) {
    hMonth = 1;
  } else if (hMonth > 12) {
    hMonth = 12;
  }

  return {
    day: hDay,
    month: hMonth,
    monthNameAr: HIJRI_MONTHS_AR[hMonth - 1] || 'محرم',
    monthNameFr: HIJRI_MONTHS_FR[hMonth - 1] || 'Mouharram',
    year: hYear,
  };
}

export function formatHijriDateString(dateIn: Date = new Date(), lang: 'ar' | 'fr' = 'ar'): string {
  const h = getHijriDate(dateIn);
  if (lang === 'fr') {
    return `${h.day} ${h.monthNameFr} ${h.year} H`;
  }
  return `${h.day} ${h.monthNameAr} ${h.year} هـ`;
}

export function formatBilingualDate(dateIn: Date = new Date(), lang: 'ar' | 'fr' = 'ar'): string {
  const hijriStr = formatHijriDateString(dateIn, lang);
  const gDay = dateIn.getDate();
  const gYear = dateIn.getFullYear();
  
  if (lang === 'fr') {
    const frMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const gregStr = `${gDay} ${frMonths[dateIn.getMonth()]} ${gYear}`;
    return `${hijriStr} / ${gregStr}`;
  } else {
    const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'جولية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const gregStr = `${gDay} ${arMonths[dateIn.getMonth()]} ${gYear} م`;
    return `${hijriStr} / ${gregStr}`;
  }
}
