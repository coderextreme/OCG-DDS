/**
 * International communication systems exposed by the interface.
 *
 * Important: Braille codes, sign languages, and deafblind communication
 * methods are different kinds of resources. A method is not represented as
 * a language and selecting it does not claim automatic translation.
 */
export type AccessibilityLanguageKind = 'braille' | 'deafblind';

export interface AccessibilityLanguageOption {
  id: string;
  kind: AccessibilityLanguageKind;
  code: string;
  name: string;
  nativeName: string;
  description: string;
  outputChannel: 'braille' | 'protactile';
  implementationStatus: 'display-profile' | 'input-output' | 'guidance';
}

export const BRAILLE_LANGUAGE_OPTIONS: AccessibilityLanguageOption[] = [
  { id: 'braille-ueb', kind: 'braille', code: 'UEB', name: 'Unified English Braille', nativeName: 'Unified English Braille', description: 'English-language braille code; grade and contraction rules must be selected separately.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-es', kind: 'braille', code: 'ES', name: 'Spanish Braille', nativeName: 'Braille español', description: 'Spanish braille code; country-specific conventions may differ.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-fr', kind: 'braille', code: 'FR', name: 'French Braille', nativeName: 'Braille français', description: 'French braille code.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-de', kind: 'braille', code: 'DE', name: 'German Braille', nativeName: 'Deutsche Brailleschrift', description: 'German braille code.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-pt', kind: 'braille', code: 'PT', name: 'Portuguese Braille', nativeName: 'Braille português', description: 'Portuguese braille code; national variants exist.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-it', kind: 'braille', code: 'IT', name: 'Italian Braille', nativeName: 'Braille italiano', description: 'Italian braille code.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-nl', kind: 'braille', code: 'NL', name: 'Dutch Braille', nativeName: 'Nederlands braille', description: 'Dutch braille code.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-pl', kind: 'braille', code: 'PL', name: 'Polish Braille', nativeName: 'Polski alfabet Braille’a', description: 'Polish braille code.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-ru', kind: 'braille', code: 'RU', name: 'Russian Braille', nativeName: 'Русский Брайль', description: 'Russian braille code.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-ar', kind: 'braille', code: 'AR', name: 'Arabic Braille', nativeName: 'برايل العربية', description: 'Arabic braille code; reading direction and cell conventions require validation.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-hi', kind: 'braille', code: 'BH', name: 'Bharati Braille', nativeName: 'भारती ब्रेल', description: 'Bharati braille family; language-specific mappings vary.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-bn', kind: 'braille', code: 'BN', name: 'Bangla Braille', nativeName: 'বাংলা ব্রেইল', description: 'Bangla braille code.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-zh', kind: 'braille', code: 'ZH', name: 'Chinese Braille', nativeName: '中国盲文 / 中國點字', description: 'Chinese braille systems are regional and may encode pronunciation.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-ja', kind: 'braille', code: 'JA', name: 'Japanese Braille', nativeName: '日本点字', description: 'Japanese six-dot braille, including kana conventions.', outputChannel: 'braille', implementationStatus: 'display-profile' },
  { id: 'braille-ko', kind: 'braille', code: 'KO', name: 'Korean Braille', nativeName: '한국 점자', description: 'Korean braille code.', outputChannel: 'braille', implementationStatus: 'display-profile' },
];

export const DEAFBLIND_COMMUNICATION_OPTIONS: AccessibilityLanguageOption[] = [
  { id: 'db-protactile', kind: 'deafblind', code: 'PT', name: 'Protactile communication', nativeName: 'Protactile', description: 'DeafBlind-led tactile communication practices; cues must be co-designed and consent-based.', outputChannel: 'protactile', implementationStatus: 'guidance' },
  { id: 'db-tactile-asl', kind: 'deafblind', code: 'TASL', name: 'Tactile American Sign Language', nativeName: 'Tactile ASL', description: 'Hands-on reception of ASL; depends on signer and receiver preferences.', outputChannel: 'protactile', implementationStatus: 'guidance' },
  { id: 'db-tactile-bsl', kind: 'deafblind', code: 'TBSL', name: 'Tactile British Sign Language', nativeName: 'Tactile BSL', description: 'Hands-on reception of BSL; not interchangeable with Tactile ASL.', outputChannel: 'protactile', implementationStatus: 'guidance' },
  { id: 'db-hands-on', kind: 'deafblind', code: 'HOS', name: 'Hands-on signing', nativeName: 'Hands-on signing', description: 'Receiver places hands over or under the signer’s hands by mutual agreement.', outputChannel: 'protactile', implementationStatus: 'guidance' },
  { id: 'db-close-vision', kind: 'deafblind', code: 'CVS', name: 'Close-vision signing', nativeName: 'Close-vision signing', description: 'Signing adapted for an individual’s usable visual field, distance, size and contrast.', outputChannel: 'protactile', implementationStatus: 'guidance' },
  { id: 'db-tracking', kind: 'deafblind', code: 'TRK', name: 'Tracking', nativeName: 'Tracking', description: 'Receiver lightly maintains contact with the signer’s wrist or forearm to follow signing.', outputChannel: 'protactile', implementationStatus: 'guidance' },
  { id: 'db-lorm', kind: 'deafblind', code: 'LORM', name: 'Lorm tactile alphabet', nativeName: 'Lorm', description: 'A tactile alphabet using agreed locations and strokes on the hand.', outputChannel: 'protactile', implementationStatus: 'guidance' },
  { id: 'db-manual-alphabet', kind: 'deafblind', code: 'DB-MANUAL', name: 'Deafblind manual alphabet', nativeName: 'Deafblind manual alphabet', description: 'Manual fingerspelling systems vary by country and community.', outputChannel: 'protactile', implementationStatus: 'guidance' },
  { id: 'db-tactile-fingerspelling', kind: 'deafblind', code: 'TFS', name: 'Tactile fingerspelling', nativeName: 'Tactile fingerspelling', description: 'Fingerspelling received tactually; alphabet and hand configuration are language-specific.', outputChannel: 'protactile', implementationStatus: 'guidance' },
];

export const ACCESSIBILITY_LANGUAGE_OPTIONS = [
  ...BRAILLE_LANGUAGE_OPTIONS,
  ...DEAFBLIND_COMMUNICATION_OPTIONS,
];

export function findAccessibilityLanguageOption(id: string) {
  return ACCESSIBILITY_LANGUAGE_OPTIONS.find((option) => option.id === id);
}

/** Localized labels for the selector; language names themselves stay native. */
export const ACCESSIBILITY_PROFILE_LABELS: Record<string, {
  label: string;
  brailleGroup: string;
  deafblindGroup: string;
}> = {
  en: { label: 'Blind, Deaf & Deafblind', brailleGroup: 'Braille codes', deafblindGroup: 'Deafblind communication' },
  es: { label: 'Personas ciegas, sordas y sordociegas', brailleGroup: 'Códigos braille', deafblindGroup: 'Comunicación sordociega' },
  fr: { label: 'Personnes aveugles, sourdes et sourdaveugles', brailleGroup: 'Codes braille', deafblindGroup: 'Communication sourdaveugle' },
  de: { label: 'Blinde, gehörlose und taubblinde Menschen', brailleGroup: 'Brailleschriften', deafblindGroup: 'Taubblindenkommunikation' },
  pt: { label: 'Pessoas cegas, surdas e surdocegas', brailleGroup: 'Códigos Braille', deafblindGroup: 'Comunicação surdocega' },
  it: { label: 'Persone cieche, sorde e sordocieche', brailleGroup: 'Codici Braille', deafblindGroup: 'Comunicazione sordocieca' },
  nl: { label: 'Blinde, dove en doofblinde mensen', brailleGroup: 'Braillecodes', deafblindGroup: 'Doofblinde communicatie' },
  sv: { label: 'Blinda, döva och dövblinda', brailleGroup: 'Punktskriftskoder', deafblindGroup: 'Dövblindkommunikation' },
  pl: { label: 'Osoby niewidome, głuche i głuchoniewidome', brailleGroup: 'Kody brajlowskie', deafblindGroup: 'Komunikacja głuchoniewidomych' },
  ru: { label: 'Для слепых, глухих и слепоглухих', brailleGroup: 'Коды Брайля', deafblindGroup: 'Общение слепоглухих' },
  uk: { label: 'Для незрячих, глухих і сліпоглухих', brailleGroup: 'Коди Брайля', deafblindGroup: 'Спілкування сліпоглухих' },
  ar: { label: 'للمكفوفين والصم والصم المكفوفين', brailleGroup: 'أنظمة برايل', deafblindGroup: 'تواصل الصم المكفوفين' },
  he: { label: 'לעיוורים, לחירשים ולחירשים-עיוורים', brailleGroup: 'קודי ברייל', deafblindGroup: 'תקשורת חירשים-עיוורים' },
  tr: { label: 'Kör, sağır ve sağır-kör kişiler', brailleGroup: 'Braille kodları', deafblindGroup: 'Sağır-kör iletişimi' },
  hi: { label: 'दृष्टिबाधित, बधिर और बधिर-दृष्टिबाधित', brailleGroup: 'ब्रेल कोड', deafblindGroup: 'बधिर-दृष्टिबाधित संचार' },
  bn: { label: 'দৃষ্টিহীন, বধির ও বধির-দৃষ্টিহীন', brailleGroup: 'ব্রেইল কোড', deafblindGroup: 'বধির-দৃষ্টিহীন যোগাযোগ' },
  'zh-Hans': { label: '盲人、聋人和聋盲人士', brailleGroup: '盲文编码', deafblindGroup: '聋盲沟通方式' },
  'zh-Hant': { label: '盲人、聾人及聾盲人士', brailleGroup: '點字編碼', deafblindGroup: '聾盲溝通方式' },
  ja: { label: '視覚障害者・ろう者・盲ろう者', brailleGroup: '点字コード', deafblindGroup: '盲ろう者のコミュニケーション' },
  ko: { label: '시각장애인·농인·농맹인', brailleGroup: '점자 코드', deafblindGroup: '농맹인 의사소통' },
  vi: { label: 'Người mù, người Điếc và người Điếc-Mù', brailleGroup: 'Mã chữ nổi Braille', deafblindGroup: 'Giao tiếp Điếc-Mù' },
  id: { label: 'Penyandang tunanetra, Tuli, dan Tuli-buta', brailleGroup: 'Kode Braille', deafblindGroup: 'Komunikasi Tuli-buta' },
  sw: { label: 'Wasioona, Viziwi na Viziwi-vipofu', brailleGroup: 'Misimbo ya Breli', deafblindGroup: 'Mawasiliano ya Viziwi-vipofu' },
  eo: { label: 'Blinduloj, surduloj kaj surdblinduloj', brailleGroup: 'Brajlaj kodoj', deafblindGroup: 'Surdblinda komunikado' },
};

export function accessibilityProfileLabels(locale: string) {
  return ACCESSIBILITY_PROFILE_LABELS[locale] ?? ACCESSIBILITY_PROFILE_LABELS.en;
}
