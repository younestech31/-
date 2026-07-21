declare module 'arabic-persian-reshaper' {
  export class ArabicShaper {
    static convertArabic(text: string): string;
  }
  export class PersianShaper {
    static convertPersian(text: string): string;
  }
}
