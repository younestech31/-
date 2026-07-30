/**
 * French translations for Algerian Notarial Inheritance Exports
 * Maintains strict numeric and logic parity with Arabic CalculationResult[]
 */

export const EXPORT_TRANSLATIONS_FR = {
  // Office & Header
  officeTitle: 'Office Notarial Public',
  title: 'ACTE DE LIQUIDATION DE SUCCESSION (AL-FARITHA)',
  subTitle: 'Calculateur Notarial Agréé conforme au Code de la Famille Algérien',
  notaryLabel: 'Maître',
  officialDesignation: 'Office Notarial Public de Tlemcen / Oran',
  caseRef: 'Réf. Dossier:',
  dateLabel: 'Date d\'établissement:',
  estateAmount: 'Masse Successorale Brut:',
  netEstateAmount: 'Masse Successorale Nette:',
  debtsLabel: 'Dettes de la succession:',
  funeralLabel: 'Frais d\'obsèques:',
  bequestLabel: 'Légats et Testaments:',

  // Columns
  colHeir: 'Héritier',
  colQuality: 'Qualité et Cause de la Succession',
  colShare: 'Part Légale (Shari\'a)',
  colParts: 'Onzièmes / Onzième (Partie)',
  colPercentage: 'Pourcentage (%)',
  colAmount: 'Montant Dû (DZD)',
  colArticle: 'Base Légale (Code Famille)',

  // General Terms
  blocked: 'Exclu / Oublié (Mahjoub)',
  residuary: 'Par Agnation (\'Asaba)',
  fard: 'Par Quotité Fixe (Fard)',
  treasury: 'Trésor Public (Bait al-Mal)',
  voluntaryBequest: 'Legs Volontaire (Wasiyya Ikhtiyariyya)',
  mandatoryBequest: 'Legs Obligatoire (Wasiyya Wajibah)',

  // Heirs names map
  heirNames: {
    husband: 'Époux (Az-Zawj)',
    wife: 'Épouse / Épouses (Az-Zawja)',
    son: 'Fils (Al-Ibn)',
    daughter: 'Fille (Al-Bint)',
    son_son: 'Petits-fils par le fils (Ibn al-Ibn)',
    granddaughter: 'Petite-fille par le fils (Bint al-Ibn)',
    father: 'Père (Al-Ab)',
    mother: 'Mère (Al-Oumm)',
    grandfather: 'Grand-père paternel (Al-Jadd al-' + 'Sahi' + 'h)',
    paternal_grandmother: 'Grand-mère paternelle (Jaddah min jihat al-ab)',
    maternal_grandmother: 'Grand-mère maternelle (Jaddah min jihat al-oumm)',
    full_brother: 'Frère germain (Al-Akh ach-Chaqiq)',
    full_sister: 'Sœur germaine (Al-Ukht ash-Shaqiqa)',
    paternal_brother: 'Frère paternel (Al-Akh li-Ab)',
    paternal_sister: 'Sœur paternelle (Al-Ukht li-Ab)',
    maternal_siblings: 'Frères / Sœurs utérins (Al-Ikhwah li-Oumm)',
    full_nephew: 'Neveu germain (Ibn al-Akh ach-Chaqiq)',
    paternal_nephew: 'Neveu paternel (Ibn al-Akh li-Ab)',
    full_uncle: 'Oncle paternel germain (Al-Amm ach-Chaqiq)',
    paternal_uncle: 'Oncle paternel (Al-Amm li-Ab)',
    full_cousin: 'Cousin germain (Ibn al-Amm ach-Chaqiq)',
    paternal_cousin: 'Cousin paternel (Ibn al-Amm li-Ab)',
    treasury: 'Trésor Public (Bait al-Mal)',
    mandatory_bequest: 'Legs Obligatoire (Wasiyya Wajibah)',
    voluntary_bequest: 'Legs Volontaire (Wasiyya)',
  } as Record<string, string>,

  // Legal Articles Translation
  articles: {
    'المادة 144': 'Art. 144 Code de la Famille',
    'المادة 145': 'Art. 145 Code de la Famille',
    'المادة 146': 'Art. 146 Code de la Famille',
    'المادة 147': 'Art. 147 Code de la Famille',
    'المادة 148': 'Art. 148 Code de la Famille',
    'المادة 149': 'Art. 149 Code de la Famille',
    'المادة 150': 'Art. 150 Code de la Famille',
    'المادة 151': 'Art. 151 Code de la Famille',
    'المادة 152': 'Art. 152 Code de la Famille',
    'المادة 153': 'Art. 153 Code de la Famille',
    'المادة 154': 'Art. 154 Code de la Famille',
    'المادة 169': 'Art. 169 Code de la Famille',
    'المادة 180': 'Art. 180 Code de la Famille',
  } as Record<string, string>,

  // Attestation Block
  attestationTitle: 'ATTESTATION DE CONFORMITÉ NOTARIALE ET EMPREINTE NUMÉRIQUE',
  attestationText: 'Je soussigné, Notaire titulaire de l\'office public, certifie la conformité des calculs de dévolution successorale ci-dessus établis conformément aux dispositions des Articles 139 à 180 du Code de la Famille Algérien. Le présent document comporte une empreinte numérique SHA-256 infalsifiable vérifiable en scannant le code QR ci-dessous.',
  signaturePlaceholder: 'Cachet et Signature du Notaire',
  auditHashLabel: 'Empreinte Cryptographique (Hash SHA-256):',
  verifyNote: 'Vérification hors-ligne disponible sur la plateforme officielle /verify',

  // Appendix / Excluded Heirs
  appendixTitle: 'ANNEXE LÉGALE — EXCLUSIONS DANS LES SUCCESSIONS FRAGMENTÉES (MUNASAKHAT)',
  excludedHeir: 'Héritier Exclu:',
  exclusionReason: 'Motif d\'Exclusion:',
  legalSource: 'Source Juridique & Fiqh:',
};

export function translateHeirName(heirId: string, arabicFallback: string, lang: 'ar' | 'fr' = 'ar'): string {
  if (lang === 'fr' && EXPORT_TRANSLATIONS_FR.heirNames[heirId]) {
    return EXPORT_TRANSLATIONS_FR.heirNames[heirId];
  }
  return arabicFallback;
}

export function translateArticle(arabicArticle: string, lang: 'ar' | 'fr' = 'ar'): string {
  if (lang === 'fr' && EXPORT_TRANSLATIONS_FR.articles[arabicArticle]) {
    return EXPORT_TRANSLATIONS_FR.articles[arabicArticle];
  }
  return arabicArticle;
}
