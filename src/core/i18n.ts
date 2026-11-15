import { buildAccessibleEventBundle } from './accessibilityOutput';
import {
  formatSignWritingOutput,
  SIGN_LANGUAGE_PRESETS,
} from './signWriting';
import type {
  SupportedUiLocale,
  UiLocaleSpec,
  UiMessageKey,
} from './locales/types';
import { EN_STRINGS } from './locales/en';
import { ES_STRINGS, FR_STRINGS, IT_STRINGS, PT_STRINGS } from './locales/romance';
import { DE_STRINGS, NL_STRINGS, SV_STRINGS } from './locales/germanic';
import { PL_STRINGS, RU_STRINGS, UK_STRINGS } from './locales/slavic';
import { AR_STRINGS, HE_STRINGS } from './locales/rtl';
import { BN_STRINGS, HI_STRINGS } from './locales/southAsia';
import { ZH_HANS_STRINGS, ZH_HANT_STRINGS } from './locales/eastAsiaZh';
import { JA_STRINGS, KO_STRINGS } from './locales/eastAsiaJaKo';
import { ID_STRINGS, TR_STRINGS, VI_STRINGS } from './locales/eurasia';
import { EO_STRINGS, SW_STRINGS } from './locales/globalAux';

export type {
  SupportedUiLocale,
  UiLocaleSpec,
  UiMessageKey,
} from './locales/types';

export const UI_LOCALES: UiLocaleSpec[] = [
  {
    code: 'en',
    intlLocale: 'en-US',
    englishName: 'English',
    nativeName: 'English',
    dir: 'ltr',
    recommendedSignLanguage: 'asl',
    brailleGuideNote: 'UEB Grade-1 Unicode Braille & 6-dot Perkins (F D S / J K L)',
    sampleEventSummary:
      'Created arc A6 (N1 -> N3) and converged distributed shards under Root Authority.',
    strings: EN_STRINGS,
  },
  {
    code: 'es',
    intlLocale: 'es-ES',
    englishName: 'Spanish',
    nativeName: 'Español',
    dir: 'ltr',
    recommendedSignLanguage: 'lse',
    brailleGuideNote: 'Sistema Braille Español · entrada Perkins de 6 puntos',
    sampleEventSummary:
      'Arco A6 creado (N1 -> N3) y fragmentos sincronizados bajo autoridad OCap.',
    strings: ES_STRINGS,
  },
  {
    code: 'fr',
    intlLocale: 'fr-FR',
    englishName: 'French',
    nativeName: 'Français',
    dir: 'ltr',
    recommendedSignLanguage: 'lsf',
    brailleGuideNote: 'Braille français · clavier Perkins 6 points',
    sampleEventSummary:
      'Arc A6 créé (N1 -> N3) et répliques synchronisées sous capacité OCap.',
    strings: FR_STRINGS,
  },
  {
    code: 'de',
    intlLocale: 'de-DE',
    englishName: 'German',
    nativeName: 'Deutsch',
    dir: 'ltr',
    recommendedSignLanguage: 'dgs',
    brailleGuideNote: 'Deutsche Brailleschrift · 6-Punkt-Perkins-Eingabe',
    sampleEventSummary:
      'Kante A6 erstellt (N1 -> N3) und Replikate unter OCap-Prüfung abgeglichen.',
    strings: DE_STRINGS,
  },
  {
    code: 'pt',
    intlLocale: 'pt-BR',
    englishName: 'Portuguese',
    nativeName: 'Português',
    dir: 'ltr',
    recommendedSignLanguage: 'libras',
    brailleGuideNote: 'Braille Português / LIBRAS · entrada Perkins 6 pontos',
    sampleEventSummary:
      'Arco A6 criado (N1 -> N3) e réplicas convergidas com segurança OCap.',
    strings: PT_STRINGS,
  },
  {
    code: 'it',
    intlLocale: 'it-IT',
    englishName: 'Italian',
    nativeName: 'Italiano',
    dir: 'ltr',
    recommendedSignLanguage: 'LIS',
    brailleGuideNote: 'Braille Italiano · input Perkins a 6 punti',
    sampleEventSummary:
      'Arco A6 creato (N1 -> N3) e repliche sincronizzate con controllo OCap.',
    strings: IT_STRINGS,
  },
  {
    code: 'nl',
    intlLocale: 'nl-NL',
    englishName: 'Dutch',
    nativeName: 'Nederlands',
    dir: 'ltr',
    recommendedSignLanguage: 'NGT',
    brailleGuideNote: 'Nederlands Braille · 6-punts Perkins-invoer',
    sampleEventSummary:
      'Boog A6 aangemaakt (N1 -> N3) en shards gesynchroniseerd onder OCap-beveiliging.',
    strings: NL_STRINGS,
  },
  {
    code: 'sv',
    intlLocale: 'sv-SE',
    englishName: 'Swedish',
    nativeName: 'Svenska',
    dir: 'ltr',
    recommendedSignLanguage: 'STS',
    brailleGuideNote: 'Svensk punktskrift · 6-punkts Perkins-inmatning',
    sampleEventSummary:
      'Båge A6 skapad (N1 -> N3) och repliker synkroniserade under OCap-kontroll.',
    strings: SV_STRINGS,
  },
  {
    code: 'pl',
    intlLocale: 'pl-PL',
    englishName: 'Polish',
    nativeName: 'Polski',
    dir: 'ltr',
    recommendedSignLanguage: 'PJM',
    brailleGuideNote: 'Polski alfabet Braille’a · wejście 6-punktowe Perkinsa',
    sampleEventSummary:
      'Utworzono krawędź A6 (N1 -> N3) i zsynchronizowano repliki pod kontrolą OCap.',
    strings: PL_STRINGS,
  },
  {
    code: 'ru',
    intlLocale: 'ru-RU',
    englishName: 'Russian',
    nativeName: 'Русский',
    dir: 'ltr',
    recommendedSignLanguage: 'RSL',
    brailleGuideNote: 'Шрифт Брайля · 6-точечный ввод Перкинса',
    sampleEventSummary:
      'Создана дуга A6 (N1 -> N3) и реплики синхронизированы с проверкой OCap.',
    strings: RU_STRINGS,
  },
  {
    code: 'uk',
    intlLocale: 'uk-UA',
    englishName: 'Ukrainian',
    nativeName: 'Українська',
    dir: 'ltr',
    recommendedSignLanguage: 'UKL',
    brailleGuideNote: 'Шрифт Брайля · 6-крапкове введення Перкінса',
    sampleEventSummary:
      'Створено дугу A6 (N1 -> N3) і синхронізовано шарди під захистом OCap.',
    strings: UK_STRINGS,
  },
  {
    code: 'ar',
    intlLocale: 'ar-EG',
    englishName: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    recommendedSignLanguage: 'ArSL',
    brailleGuideNote:
      'برايل العربية · إدخال بيركنز 6 نقاط · تخطيط من اليمين إلى اليسار',
    sampleEventSummary:
      'تم إنشاء القوس A6 (N1 -> N3) ومزامنة النسخ الموزعة بصلاحيات OCap.',
    strings: AR_STRINGS,
  },
  {
    code: 'he',
    intlLocale: 'he-IL',
    englishName: 'Hebrew',
    nativeName: 'עברית',
    dir: 'rtl',
    recommendedSignLanguage: 'ISL',
    brailleGuideNote: 'כתב ברייל עברי · הקלדת פרקינס 6 נקודות · כיוון RTL',
    sampleEventSummary:
      'קשת A6 נוצרה (N1 -> N3) והרפליקות סונכרנו תחת אכיפת OCap.',
    strings: HE_STRINGS,
  },
  {
    code: 'tr',
    intlLocale: 'tr-TR',
    englishName: 'Turkish',
    nativeName: 'Türkçe',
    dir: 'ltr',
    recommendedSignLanguage: 'TID',
    brailleGuideNote: 'Türkçe Braille · 6 noktalı Perkins girişi',
    sampleEventSummary:
      'A6 yayı oluşturuldu (N1 -> N3) ve kopyalar OCap korumasıyla eşitlendi.',
    strings: TR_STRINGS,
  },
  {
    code: 'hi',
    intlLocale: 'hi-IN',
    englishName: 'Hindi',
    nativeName: 'हिन्दी',
    dir: 'ltr',
    recommendedSignLanguage: 'ISL-IN',
    brailleGuideNote: 'भारती ब्रेल · 6-डॉट पर्किन्स इनपुट (F D S / J K L)',
    sampleEventSummary:
      'आर्क A6 बनाया गया (N1 -> N3) और OCap सुरक्षा के साथ प्रतिकृतियाँ सिंक हुईं।',
    strings: HI_STRINGS,
  },
  {
    code: 'bn',
    intlLocale: 'bn-BD',
    englishName: 'Bengali',
    nativeName: 'বাংলা',
    dir: 'ltr',
    recommendedSignLanguage: 'BdSL',
    brailleGuideNote: 'বাংলা ব্রেইল · ৬-ডট পার্কিনস ইনপুট',
    sampleEventSummary:
      'আর্ক A6 তৈরি হয়েছে (N1 -> N3) এবং OCap সুরক্ষার অধীনে রেপ্লিকা সিঙ্ক হয়েছে।',
    strings: BN_STRINGS,
  },
  {
    code: 'zh-Hans',
    intlLocale: 'zh-CN',
    englishName: 'Chinese (Simplified)',
    nativeName: '简体中文',
    dir: 'ltr',
    recommendedSignLanguage: 'CSL',
    brailleGuideNote: '盲文缓冲区与 6 点珀金斯键盘输入（F D S / J K L）',
    sampleEventSummary:
      '已创建有向边 A6 (N1 -> N3)，并在对象能力保护下完成分片同步。',
    strings: ZH_HANS_STRINGS,
  },
  {
    code: 'zh-Hant',
    intlLocale: 'zh-TW',
    englishName: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    dir: 'ltr',
    recommendedSignLanguage: 'TSL',
    brailleGuideNote: '點字緩衝區與 6 點柏金斯輸入（F D S / J K L）',
    sampleEventSummary:
      '已建立有向邊 A6 (N1 -> N3)，並在物件能力保護下完成分片同步。',
    strings: ZH_HANT_STRINGS,
  },
  {
    code: 'ja',
    intlLocale: 'ja-JP',
    englishName: 'Japanese',
    nativeName: '日本語',
    dir: 'ltr',
    recommendedSignLanguage: 'jsl',
    brailleGuideNote:
      '点字バッファ & 6点パーキンス入力 (F D S / J K L) · 日本手話 (JSL)',
    sampleEventSummary:
      'アーク A6 (N1 -> N3) を作成し、Object-Capability 制御下でシャード同期しました。',
    strings: JA_STRINGS,
  },
  {
    code: 'ko',
    intlLocale: 'ko-KR',
    englishName: 'Korean',
    nativeName: '한국어',
    dir: 'ltr',
    recommendedSignLanguage: 'KSL-KR',
    brailleGuideNote: '한글 점자 버퍼 및 6점 퍼킨스 입력 (F D S / J K L)',
    sampleEventSummary:
      '아크 A6(N1 -> N3)를 생성하고 OCap 권한 검증 하에 샤드를 동기화했습니다.',
    strings: KO_STRINGS,
  },
  {
    code: 'vi',
    intlLocale: 'vi-VN',
    englishName: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    dir: 'ltr',
    recommendedSignLanguage: 'VSL',
    brailleGuideNote: 'Chữ nổi Braille & bàn phím Perkins 6 điểm',
    sampleEventSummary:
      'Đã tạo cung A6 (N1 -> N3) và đồng bộ phân mảnh dưới bảo vệ OCap.',
    strings: VI_STRINGS,
  },
  {
    code: 'id',
    intlLocale: 'id-ID',
    englishName: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    dir: 'ltr',
    recommendedSignLanguage: 'BISINDO',
    brailleGuideNote: 'Braille & input Perkins 6-titik (F D S / J K L)',
    sampleEventSummary:
      'Busur A6 dibuat (N1 -> N3) dan shard disinkronkan di bawah kendali OCap.',
    strings: ID_STRINGS,
  },
  {
    code: 'sw',
    intlLocale: 'sw-KE',
    englishName: 'Swahili',
    nativeName: 'Kiswahili',
    dir: 'ltr',
    recommendedSignLanguage: 'KSL',
    brailleGuideNote: 'Breli & uingizaji wa Perkins nukta 6 (F D S / J K L)',
    sampleEventSummary:
      'Njia A6 imeundwa (N1 -> N3) na vipande vimesawazishwa chini ya ulinzi wa OCap.',
    strings: SW_STRINGS,
  },
  {
    code: 'eo',
    intlLocale: 'eo',
    englishName: 'Esperanto',
    nativeName: 'Esperanto',
    dir: 'ltr',
    recommendedSignLanguage: 'Signuno',
    brailleGuideNote: 'Esperanta Brajlo · 6-punkta Perkins-enigo',
    sampleEventSummary:
      'Arko A6 kreita (N1 -> N3) kaj blokoj sinkronigitaj sub OCap-kontrolo.',
    strings: EO_STRINGS,
  },
];

export function resolveUiLocale(code?: string): UiLocaleSpec {
  const normalized = (code ?? 'en').trim().toLowerCase();
  return (
    UI_LOCALES.find((l) => l.code.toLowerCase() === normalized) ?? UI_LOCALES[0]
  );
}

export function translateUi(
  localeCode: SupportedUiLocale | string,
  key: UiMessageKey
): string {
  const spec = resolveUiLocale(localeCode);
  return spec.strings[key] ?? EN_STRINGS[key];
}

export function formatLocalizedNumber(
  localeCode: SupportedUiLocale | string,
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  const spec = resolveUiLocale(localeCode);
  try {
    return new Intl.NumberFormat(spec.intlLocale, options).format(value);
  } catch {
    return new Intl.NumberFormat('en-US', options).format(value);
  }
}

export function formatLocalizedTime(
  localeCode: SupportedUiLocale | string,
  timestampMs: number
): string {
  const spec = resolveUiLocale(localeCode);
  try {
    return new Intl.DateTimeFormat(spec.intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(timestampMs));
  } catch {
    return new Date(timestampMs).toTimeString().slice(0, 8);
  }
}

export function formatUi(
  localeCode: SupportedUiLocale | string,
  key: UiMessageKey,
  params?: Record<string, string | number>
): string {
  let template = translateUi(localeCode, key);
  if (!params) return template;
  for (const [paramKey, paramValue] of Object.entries(params)) {
    const formatted =
      typeof paramValue === 'number'
        ? formatLocalizedNumber(localeCode, paramValue)
        : String(paramValue);
    template = template.replaceAll(`{${paramKey}}`, formatted);
  }
  return template;
}

export interface LanguageSelfTestResult {
  uiLocalesTested: number;
  uiLocalesPassed: number;
  signLanguagesTested: number;
  signLanguagesPassed: number;
  rtlLocalesVerified: string[];
  details: Array<{
    id: string;
    label: string;
    category: 'ui-locale' | 'sign-language';
    ok: boolean;
    sampleOutput: string;
  }>;
}

export function runLanguageSelfTestSuite(
  customSignLanguages: string[] = ['KSL', 'CSL', 'BISINDO', 'ArSL', 'Signuno']
): LanguageSelfTestResult {
  const details: LanguageSelfTestResult['details'] = [];
  const rtlLocalesVerified: string[] = [];

  for (const loc of UI_LOCALES) {
    const bundle = buildAccessibleEventBundle(
      'graph',
      'success',
      loc.sampleEventSummary,
      loc.recommendedSignLanguage,
      undefined,
      loc.code
    );
    const hasNav = Boolean(loc.strings.navGraph && loc.strings.outputChannel);
    const hasBraille =
      bundle.brailleDots.length > 0 && bundle.brailleLines.every((l) => l.length <= 40);
    const hasPt = Boolean(bundle.protactile.topographicTrace);
    const hasSw = bundle.signWriting.boxes.length > 0 && /^M\d+x\d+/.test(bundle.signWriting.fsw);
    const ok = hasNav && hasBraille && hasPt && hasSw;

    if (loc.dir === 'rtl') rtlLocalesVerified.push(loc.code);

    details.push({
      id: loc.code,
      label: `${loc.nativeName} (${loc.englishName})`,
      category: 'ui-locale',
      ok,
      sampleOutput: `[${loc.dir.toUpperCase()}] ${loc.strings.navGraph} · Braille:${bundle.brailleDots[0]?.slice(0, 12) ?? ''} · SW(${bundle.signWriting.language.code})`,
    });
  }

  const signTargets = [
    ...SIGN_LANGUAGE_PRESETS.map((p) => ({ id: p.id, label: `${p.code} · ${p.nativeName}` })),
    ...customSignLanguages.map((c) => ({ id: c, label: `Custom (${c})` })),
  ];

  for (const sl of signTargets) {
    const seq = formatSignWritingOutput(
      'graph',
      'warning',
      'Capability Denied: Shard-B Operator lacks delete authority.',
      sl.id
    );
    const validFsw = seq.boxes.every((b) => /^M\d+x\d+(S[0-9a-f]{5}\d+x\d+)+$/i.test(b.fswToken));
    const validSwu = seq.boxes.every((b) =>
      Array.from(b.swuChars).every((ch) => {
        const cp = ch.codePointAt(0) ?? 0;
        return cp >= 0x1d800 && cp <= 0x1daaf;
      })
    );
    const ok = seq.boxes.length >= 2 && validFsw && validSwu;

    details.push({
      id: sl.id,
      label: sl.label,
      category: 'sign-language',
      ok,
      sampleOutput: `${seq.localizedGlossLine} · SWU: ${seq.swu}`,
    });
  }

  const uiItems = details.filter((d) => d.category === 'ui-locale');
  const slItems = details.filter((d) => d.category === 'sign-language');

  return {
    uiLocalesTested: uiItems.length,
    uiLocalesPassed: uiItems.filter((d) => d.ok).length,
    signLanguagesTested: slItems.length,
    signLanguagesPassed: slItems.filter((d) => d.ok).length,
    rtlLocalesVerified,
    details,
  };
}
