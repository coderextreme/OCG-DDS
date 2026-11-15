import { hashString32 } from './hashRing';
import {
  type CapabilityRight,
  type CapabilityToken,
  type GraphArc,
  type GraphNode,
  isCapabilityActive,
} from './ocapGraph';

import {
  BRAILLE_LANGUAGE_OPTIONS,
  DEAFBLIND_COMMUNICATION_OPTIONS,
  type AccessibilityLanguageOption,
} from './accessibilityLanguages';
import {
  formatSignWritingOutput,
  resolveSignLanguage,
  type SignLanguageSpec,
  type SignWritingDirection,
  type SignWritingSequence,
} from './signWriting';
import type { SupportedUiLocale } from './locales/types';

export type AccessibleOutputChannel =
  | 'standard'
  | 'braille'
  | 'protactile'
  | 'asl'
  | 'signwriting';

export interface AslSignStep {
  gloss: string;
  handshape: string;
  location: string;
  movement: string;
  nonManualMarker: string;
}

export interface ProtactileCue {
  profileId: string;
  profileCode: string;
  profileName: string;
  profileDescription: string;
  contactSetup: string;
  spatialZone: string;
  topographicTrace: string;
  backchannel: string;
  hapticPatternMs: number[];
}

export interface AccessibleEventBundle {
  standard: string;
  brailleProfile: AccessibilityLanguageOption;
  brailleLines: string[];
  brailleDots: string[];
  protactile: ProtactileCue;
  signLanguageSpec: SignLanguageSpec;
  aslGloss: string;
  aslSteps: AslSignStep[];
  signWriting: SignWritingSequence;
}

// Grade-1 North American / Unified English Braille ASCII-to-Unicode mapping
const BRAILLE_MAP: Record<string, string> = {
  ' ': '⠀',
  a: '⠁',
  b: '⠃',
  c: '⠉',
  d: '⠙',
  e: '⠑',
  f: '⠋',
  g: '⠛',
  h: '⠓',
  i: '⠊',
  j: '⠚',
  k: '⠅',
  l: '⠇',
  m: '⠍',
  n: '⠝',
  o: '⠕',
  p: '⠏',
  q: '⠟',
  r: '⠗',
  s: '⠎',
  t: '⠞',
  u: '⠥',
  v: '⠧',
  w: '⠺',
  x: '⠭',
  y: '⠽',
  z: '⠵',
  '1': '⠼⠁',
  '2': '⠼⠃',
  '3': '⠼⠉',
  '4': '⠼⠙',
  '5': '⠼⠑',
  '6': '⠼⠋',
  '7': '⠼⠛',
  '8': '⠼⠓',
  '9': '⠼⠊',
  '0': '⠼⠚',
  '.': '⠲',
  ',': '⠂',
  ':': '⠒',
  ';': '⠆',
  '-': '⠤',
  '/': '⠌',
  '|': '⠳',
  '>': '⠜',
  '<': '⠣',
  '=': '⠶',
  '(': '⠐⠣',
  ')': '⠐⠜',
  '[': '⠨⠣',
  ']': '⠨⠜',
};

function normalizeForBraille(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ø/g, 'o')
    .replace(/ł/g, 'l')
    .replace(/đ/g, 'd')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/ı/g, 'i')
    .replace(/[·•]/g, '.')
    .replace(/[—–]/g, '-')
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[。．]/g, '.')
    .replace(/[，、]/g, ',')
    .replace(/：/g, ':')
    .replace(/；/g, ';')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function toUnicodeBraille(text: string): string {
  const lower = normalizeForBraille(text);
  let out = '';
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    out += BRAILLE_MAP[ch] ?? '⠐';
  }
  return out;
}

export function chunkForBrailleCells(text: string, cellWidth: 40 | 80 = 40): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [''];

  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      if (word.length <= cellWidth) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += cellWidth) {
          lines.push(word.slice(i, i + cellWidth));
        }
      }
    } else if (current.length + 1 + word.length <= cellWidth) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      if (word.length <= cellWidth) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += cellWidth) {
          const slice = word.slice(i, i + cellWidth);
          if (i + cellWidth < word.length) {
            lines.push(slice);
          } else {
            current = slice;
          }
        }
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function resolveBrailleProfile(
  profileId?: string
): AccessibilityLanguageOption {
  const cleaned = (profileId ?? 'braille-ueb').trim().toLowerCase();
  return (
    BRAILLE_LANGUAGE_OPTIONS.find(
      (opt) => opt.id.toLowerCase() === cleaned || opt.code.toLowerCase() === cleaned
    ) ?? BRAILLE_LANGUAGE_OPTIONS[0]
  );
}

export function resolveDeafblindProfile(
  profileId?: string
): AccessibilityLanguageOption {
  const cleaned = (profileId ?? 'db-protactile').trim().toLowerCase();
  return (
    DEAFBLIND_COMMUNICATION_OPTIONS.find(
      (opt) => opt.id.toLowerCase() === cleaned || opt.code.toLowerCase() === cleaned
    ) ?? DEAFBLIND_COMMUNICATION_OPTIONS[0]
  );
}

export function formatBrailleAnnouncement(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string,
  brailleProfileId?: string
): string {
  const prefix =
    severity === 'warning' ? 'ALERT' : severity === 'success' ? 'OK' : 'INFO';
  if (!brailleProfileId) {
    return `[${prefix} ${moduleTag.toUpperCase()}] ${summary}`;
  }
  const profile = resolveBrailleProfile(brailleProfileId);
  return `[${profile.code} ${prefix} ${moduleTag.toUpperCase()}] ${summary}`;
}

const PT_CONTACT_SPACE: Partial<Record<SupportedUiLocale, string>> = {
  es: 'ESPACIO-CONTACTO: Marco táctil bimanual activo',
  fr: 'ESPACE-CONTACT : Cadre tactile à deux mains actif',
  de: 'KONTAKTRAUM: Zweihändiger Tastrahmen aktiv',
  pt: 'ESPAÇO-CONTATO: Quadro tátil bimanual ativo',
  it: 'SPAZIO-CONTATTO: Schema tattile a due mani attivo',
  nl: 'CONTACTRUIMTE: Tweehandig tastraster actief',
  sv: 'KONTAKTYTA: Tvåhänt taktil ram aktiv',
  pl: 'PRZESTRZEŃ KONTAKTU: Aktywna rama oburęczna',
  ru: 'ПРОСТРАНСТВО КОНТАКТА: Активна двуручная тактильная опора',
  uk: 'ПРОСТІР КОНТАКТУ: Активна дворучна тактильна опора',
  ar: 'مساحة التلامس: إطار اللمس ثنائي اليدين نشط',
  he: 'מרחב מגע: מסגרת מגע דו-ידנית פעילה',
  tr: 'TEMAS ALANI: Çift el dokunsal çerçeve etkin',
  hi: 'संपर्क क्षेत्र: द्वि-हस्त स्पर्श फ्रेम सक्रिय',
  bn: 'স্পর্শ ক্ষেত্র: দুই হাতের স্পর্শ কাঠামো সক্রিয়',
  'zh-Hans': '接触空间：双手触觉基准框架已激活',
  'zh-Hant': '接觸空間：雙手觸覺基準框架已啟用',
  ja: '接触空間: 両手触覚フレーム有効',
  ko: '접촉 공간: 양손 촉각 프레임 활성화됨',
  vi: 'KHÔNG GIAN TIẾP XÚC: Khung xúc giác hai tay đang bật',
  id: 'RUANG KONTAK: Bingkai taktil dua tangan aktif',
  sw: 'NAFASI YA MGUSO: Fremu ya mikono miwili iko tayari',
  eo: 'KONTAKTA SPACO: Duman-palpa kadro aktiva',
};

const GUARD_LABELS: Partial<
  Record<
    SupportedUiLocale,
    { revoked: string; lockedPrefix: string; rwd: string; rw: string; ro: string }
  >
> = {
  es: { revoked: 'Revocado', lockedPrefix: 'Bloqueado', rwd: 'Leer/Escribir/Borrar', rw: 'Leer/Escribir', ro: 'Solo lectura' },
  fr: { revoked: 'Révoqué', lockedPrefix: 'Verrouillé', rwd: 'Lire/Écrire/Suppr.', rw: 'Lire/Écrire', ro: 'Lecture seule' },
  de: { revoked: 'Widerrufen', lockedPrefix: 'Gesperrt', rwd: 'Lesen/Schr./Löschen', rw: 'Lesen/Schreiben', ro: 'Nur Lesen' },
  pt: { revoked: 'Revogado', lockedPrefix: 'Bloqueado', rwd: 'Ler/Gravar/Excluir', rw: 'Ler/Gravar', ro: 'Somente leitura' },
  it: { revoked: 'Revocato', lockedPrefix: 'Bloccato', rwd: 'Leggi/Scrivi/Elim.', rw: 'Leggi/Scrivi', ro: 'Solo lettura' },
  nl: { revoked: 'Ingetrokken', lockedPrefix: 'Vergrendeld', rwd: 'Lezen/Schr./Verw.', rw: 'Lezen/Schrijven', ro: 'Alleen lezen' },
  sv: { revoked: 'Återkallad', lockedPrefix: 'Låst', rwd: 'Läs/Skriv/Ta bort', rw: 'Läs/Skriv', ro: 'Endast läsning' },
  pl: { revoked: 'Odwołany', lockedPrefix: 'Zablokowany', rwd: 'Odczyt/Zapis/Usuń', rw: 'Odczyt/Zapis', ro: 'Tylko odczyt' },
  ru: { revoked: 'Отозван', lockedPrefix: 'Ограничен', rwd: 'Чтение/Запись/Удал.', rw: 'Чтение/Запись', ro: 'Только чтение' },
  uk: { revoked: 'Відкликано', lockedPrefix: 'Обмежено', rwd: 'Читання/Запис/Вид.', rw: 'Читання/Запис', ro: 'Лише читання' },
  ar: { revoked: 'مبطل', lockedPrefix: 'مقيد', rwd: 'قراءة/كتابة/حذف', rw: 'قراءة/كتابة', ro: 'قراءة فقط' },
  he: { revoked: 'מבוטל', lockedPrefix: 'מוגבל', rwd: 'קריאה/כתיבה/מחיקה', rw: 'קריאה/כתיבה', ro: 'קריאה בלבד' },
  tr: { revoked: 'İptal Edildi', lockedPrefix: 'Kilitli', rwd: 'Oku/Yaz/Sil', rw: 'Oku/Yaz', ro: 'Salt Okunur' },
  hi: { revoked: 'रद्द', lockedPrefix: 'लॉक', rwd: 'पढ़ें/लिखें/हटाएँ', rw: 'पढ़ें/लिखें', ro: 'केवल पढ़ने योग्य' },
  bn: { revoked: 'বাতিল', lockedPrefix: 'সীমাবদ্ধ', rwd: 'পড়া/লেখা/মোছা', rw: 'পড়া/লেখা', ro: 'শুধু পড়া' },
  'zh-Hans': { revoked: '已吊销', lockedPrefix: '已锁定', rwd: '读/写/删', rw: '读/写', ro: '只读' },
  'zh-Hant': { revoked: '已撤銷', lockedPrefix: '已鎖定', rwd: '讀/寫/刪', rw: '讀/寫', ro: '唯讀' },
  ja: { revoked: '失効', lockedPrefix: '制限中', rwd: '読取/書込/削除', rw: '読取/書込', ro: '読取専用' },
  ko: { revoked: '철회됨', lockedPrefix: '잠김', rwd: '읽기/쓰기/삭제', rw: '읽기/쓰기', ro: '읽기 전용' },
  vi: { revoked: 'Đã thu hồi', lockedPrefix: 'Bị khóa', rwd: 'Đọc/Ghi/Xóa', rw: 'Đọc/Ghi', ro: 'Chỉ đọc' },
  id: { revoked: 'Dicabut', lockedPrefix: 'Terkunci', rwd: 'Baca/Tulis/Hapus', rw: 'Baca/Tulis', ro: 'Hanya Baca' },
  sw: { revoked: 'Imebatilishwa', lockedPrefix: 'Imefungwa', rwd: 'Soma/Andika/Futa', rw: 'Soma/Andika', ro: 'Kusoma tu' },
  eo: { revoked: 'Revokita', lockedPrefix: 'Ŝlosita', rwd: 'Legi/Skribi/Forigi', rw: 'Legi/Skribi', ro: 'Nurlega' },
};

/**
 * Formats a distributed graph/system event for DeafBlind communication approaches:
 * Protactile, Tactile ASL, Tactile BSL, Hands-on signing, Close-vision signing,
 * Tracking, Lorm tactile alphabet, Deafblind manual alphabet, or Tactile fingerspelling.
 */
export function formatProtactileCue(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string,
  uiLocale: SupportedUiLocale = 'en',
  deafblindProfileId: string = 'db-protactile'
): ProtactileCue {
  const dbProfile = resolveDeafblindProfile(deafblindProfileId);
  const lower = summary.toLowerCase();
  const shardMatch = summary.match(/Shard-[ABC]/i)?.[0]?.toUpperCase();
  const spatialZone =
    shardMatch === 'SHARD-A'
      ? 'Left Forearm Anchor (Zone A)'
      : shardMatch === 'SHARD-B'
        ? 'Center Palm / Wrist Anchor (Zone B)'
        : shardMatch === 'SHARD-C'
          ? 'Right Forearm Anchor (Zone C)'
          : `${uiLocale === 'en' ? 'Contact Canvas' : 'Tactile'} (${moduleTag.toUpperCase()})`;

  let contactSetup =
    PT_CONTACT_SPACE[uiLocale] ?? 'CONTACT-SPACE: Grounded two-hand frame active';
  let topographicTrace = `TRACE: Steady point press for "${summary}"`;
  if (lower.includes('arc') || summary.includes('->')) {
    topographicTrace =
      'TRACE: Press source anchor, slide 1-finger linear arc to target anchor';
  } else if (lower.includes('batch') || lower.includes('group')) {
    topographicTrace =
      'TRACE: Two-hand sweep enclosing selected group boundary, then firm tap-commit';
  } else if (lower.includes('denied') || lower.includes('revoked')) {
    topographicTrace =
      'TRACE: Crossed-bar press on active capability wrist anchor (blocked boundary)';
  } else if (lower.includes('partition') || lower.includes('offline')) {
    topographicTrace =
      'TRACE: Lift-off break along replica link line (connection severed)';
  } else if (lower.includes('converg') || lower.includes('sync') || lower.includes('repair')) {
    topographicTrace =
      'TRACE: Bilateral inward palm sweep bringing replica anchors together';
  }

  let backchannel =
    severity === 'warning'
      ? 'DOUBLE-TAP-HOLD (Alert / Boundary Stop)'
      : severity === 'success'
        ? 'FIRM-SINGLE-TAP (Confirmed / Committed)'
        : 'LIGHT-TAP (Status Update)';

  let hapticPatternMs =
    severity === 'warning'
      ? [180, 80, 180, 80, 300]
      : severity === 'success'
        ? [120, 60, 180]
        : [90];

  switch (dbProfile.id) {
    case 'db-tactile-asl': {
      contactSetup = 'TACTILE ASL: Hands-on reception in signer-receiver ASL space (1H manual)';
      topographicTrace = `TACTILE ASL FRAME: ${topographicTrace.replace(/^TRACE:\s*/, '')}`;
      backchannel =
        severity === 'warning'
          ? 'DOUBLE-TAP ON BACK OF HAND (Pause / Authority Check)'
          : 'GENTLE SQUEEZE / SINGLE TAP (ASL Affirmation)';
      break;
    }
    case 'db-tactile-bsl': {
      contactSetup = 'TACTILE BSL: Hands-on BSL reception (2H manual system, distinct from ASL)';
      topographicTrace = `TACTILE BSL TWO-HAND FRAME: ${topographicTrace.replace(/^TRACE:\s*/, '')}`;
      backchannel =
        severity === 'warning'
          ? 'BILATERAL HOLD-PRESS (BSL Boundary Alert)'
          : 'TWO-HAND STEADY TOUCH (BSL Confirmed)';
      hapticPatternMs =
        severity === 'warning' ? [200, 70, 200, 70, 260] : [110, 50, 110];
      break;
    }
    case 'db-hands-on': {
      contactSetup = 'HANDS-ON SIGNING: Mutually agreed over/under hand placement active';
      topographicTrace = `HAND-OVER-HAND: ${topographicTrace.replace(/^TRACE:\s*/, '')}`;
      break;
    }
    case 'db-close-vision': {
      contactSetup = 'CLOSE-VISION SIGNING: Compact visual frame tuned for usable field, distance & contrast';
      topographicTrace = `CLOSE-VISION FOCUS: Keep movement inside central chest-to-shoulder high-contrast box for "${moduleTag.toUpperCase()}"`;
      backchannel =
        severity === 'warning'
          ? 'HOLD SIGN IN FOCAL BOX + HEADSHAKE'
          : 'NOD INSIDE CLOSE-VISION FRAME';
      hapticPatternMs = severity === 'warning' ? [140, 100, 140] : [70];
      break;
    }
    case 'db-tracking': {
      contactSetup = 'TRACKING: Light contact at signer wrist/forearm to follow spatial trajectory';
      topographicTrace = `FOREARM TRACKING: Follow wrist vector across ${spatialZone} (${moduleTag.toUpperCase()})`;
      break;
    }
    case 'db-lorm': {
      const compactWord = summary.replace(/[^a-zA-Z0-9\s-]/g, '').trim().slice(0, 36);
      contactSetup = 'LORM TACTILE ALPHABET: Agreed finger-point taps & palm strokes on receiver hand';
      topographicTrace = `LORM STROKE SEQUENCE: Tap fingertip vowels / sweep palm consonants -> "${compactWord}"`;
      backchannel =
        severity === 'warning'
          ? 'CLOSED-PALM HOLD (Lorm Alert / Repeat)'
          : 'THUMB-BASE TAP (Lorm Segment Received)';
      hapticPatternMs =
        severity === 'warning' ? [90, 50, 90, 50, 240] : [60, 40, 60, 40, 140];
      break;
    }
    case 'db-manual-alphabet': {
      const compactWord = summary.replace(/[^a-zA-Z0-9\s-]/g, '').trim().slice(0, 36);
      contactSetup = 'DEAFBLIND MANUAL ALPHABET: Community tactile spelling on palm & phalanges';
      topographicTrace = `MANUAL SPELL GUIDE: Tactile index-point spelling along palm -> "${compactWord}"`;
      backchannel = 'PALM-PRESS (Word Boundary / Confirmed)';
      hapticPatternMs = [75, 45, 75, 45, 130];
      break;
    }
    case 'db-tactile-fingerspelling': {
      const compactWord = summary.replace(/[^a-zA-Z0-9\s-]/g, '').trim().slice(0, 36);
      contactSetup = 'TACTILE FINGERSPELLING: Tactile handshape reception into receiver cupped palm';
      topographicTrace = `FINGERSPELL SEQUENCE: Articulate distinct handshapes in palm -> "${compactWord}"`;
      backchannel = 'LIGHT FINGER-SQUEEZE (Letter Cadence OK)';
      hapticPatternMs = [65, 45, 65, 90];
      break;
    }
    default:
      break;
  }

  return {
    profileId: dbProfile.id,
    profileCode: dbProfile.code,
    profileName: dbProfile.nativeName,
    profileDescription: dbProfile.description,
    contactSetup,
    spatialZone,
    topographicTrace,
    backchannel,
    hapticPatternMs,
  };
}

const HANDSHAPE_READABLE: Record<string, string> = {
  index: '1-index point',
  'v-bent': 'V-bent classifier',
  'open-5': '5-open sweep',
  'flat-b': 'Flat-B palm / blade',
  'c-hand': 'C-cup classifier',
  'f-link': 'F-ring interlock',
  'x-hook': 'X-hook key shape',
  'fist-a': 'A/S-fist grip',
};

const MOVEMENT_READABLE: Record<string, string> = {
  'arc-path': 'Trace directional arc path between loci',
  forward: 'Project forward toward target locus',
  apart: 'Pull hands sharply apart (sever link)',
  together: 'Bring hands together firmly at center',
  halt: 'Crisp downward stop / hold',
  twist: 'Controlled wrist twist & settle',
  gather: 'Gather set inward to focal center',
};

/**
 * Formats a distributed graph/system event into any selected natural Sign Language's
 * structured gloss, syntax order (Topic-Comment, SVO, or SOV), Non-Manual Markers (NMMs),
 * and sign step articulatory parameters.
 */
export function formatSignLanguageOutput(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string,
  signLanguage: string = 'asl'
): { language: SignLanguageSpec; gloss: string; steps: AslSignStep[] } {
  const language = resolveSignLanguage(signLanguage);
  const lower = summary.toLowerCase();

  if (language.id === 'asl') {
    const steps: AslSignStep[] = [];

    if (lower.includes('denied') || lower.includes('revoked')) {
      steps.push(
        {
          gloss: 'KEY / AUTHORITY',
          handshape: 'X-hook + flat-B palm',
          location: 'Dominant palm center',
          movement: 'Twist key hand once, then freeze',
          nonManualMarker: 'brows-furrowed',
        },
        {
          gloss: 'ACCESS FORBIDDEN',
          handshape: 'Flat-B blade',
          location: 'Chest / neutral space',
          movement: 'Crossed block outward',
          nonManualMarker: 'headshake',
        },
        {
          gloss: 'IX-LOC ACTION STOP',
          handshape: '1-index + flat-5',
          location: 'Target shard locus',
          movement: 'Firm downward halt',
          nonManualMarker: 'lips-pressed',
        }
      );
      return {
        language,
        gloss: `[brows-furrowed] AUTHORITY KEY ++ ACTION FORBIDDEN IX-locus STOP [headshake]`,
        steps,
      };
    }

    if (lower.includes('batch') || lower.includes('group')) {
      steps.push(
        {
          gloss: 'GROUP CLUSTER',
          handshape: 'C-hands (both)',
          location: 'Neutral signing space',
          movement: 'Cup outward gathering nodes into one set',
          nonManualMarker: 'raised-brows (topic)',
        },
        {
          gloss: 'TOGETHER APPLY / COMMIT',
          handshape: 'A-fists -> S-grip',
          location: 'Center space',
          movement: 'Single unified downward lock',
          nonManualMarker: 'nod',
        }
      );
      return {
        language,
        gloss: `[raised-brows] GROUP NODES+ARCS CL:C-gather ++ TOGETHER COMMIT [nod]`,
        steps,
      };
    }

    if (lower.includes('arc') || summary.includes('->')) {
      steps.push(
        {
          gloss: 'NODE IX-left TO IX-right',
          handshape: '1-index + 1-index',
          location: 'Left-to-right spatial plane',
          movement: 'Trace directional path from source to target',
          nonManualMarker: 'eyes-track-path',
        },
        {
          gloss: 'LINK CONNECT FINISH',
          handshape: 'F-ok link',
          location: 'Center plane',
          movement: 'Interlock rings + quick wrist flip',
          nonManualMarker: 'nod',
        }
      );
      return {
        language,
        gloss: `[topic] NODE IX-source ARC-CONNECT-IX-target CL:1-path FINISH [nod]`,
        steps,
      };
    }

    if (lower.includes('partition') || lower.includes('offline') || lower.includes('fail')) {
      steps.push(
        {
          gloss: 'NODE / REPLICA',
          handshape: 'V-bent / 4-hand',
          location: 'Right spatial locus',
          movement: 'Drop hand down / separate',
          nonManualMarker: 'brows-furrowed',
        },
        {
          gloss: 'BREAK-APART ISOLATED',
          handshape: 'S-fists -> open-5',
          location: 'Neutral space',
          movement: 'Pull hands apart sharply',
          nonManualMarker: 'headshake-slight',
        }
      );
      return {
        language,
        gloss: `[brows-furrowed] IX-replica LINK BREAK-APART ISOLATED [alert]`,
        steps,
      };
    }

    if (lower.includes('converg') || lower.includes('sync') || lower.includes('repair')) {
      steps.push(
        {
          gloss: 'ALL REPLICA',
          handshape: '5-hand sweep',
          location: 'Horizontal arc',
          movement: 'Sweep across left-center-right loci',
          nonManualMarker: 'raised-brows',
        },
        {
          gloss: 'MERGE SAME-EQUAL',
          handshape: '5-hands -> 1-index pair',
          location: 'Center space',
          movement: 'Bring both hands together evenly',
          nonManualMarker: 'nod',
        }
      );
      return {
        language,
        gloss: `[topic] ALL REPLICA IX-all MERGE MATCH SAME FINISH [nod]`,
        steps,
      };
    }

    const nmm = severity === 'warning' ? 'brows-furrowed' : 'nod';
    steps.push(
      {
        gloss: `${moduleTag.toUpperCase()} TOPIC`,
        handshape: 'Flat-B / 1-index',
        location: 'Center signing space',
        movement: 'Point to spatial topic anchor',
        nonManualMarker: 'raised-brows (topic)',
      },
      {
        gloss: severity === 'success' ? 'DONE / CONFIRMED' : 'UPDATE STATE',
        handshape: '5-hands (finish) / F-hand',
        location: 'Neutral space',
        movement: severity === 'success' ? 'Two-hand crisp outward turn' : 'Steady forward placement',
        nonManualMarker: nmm,
      }
    );

    return {
      language,
      gloss: `[raised-brows] ${moduleTag.toUpperCase()} IX-locus :: ${summary.toUpperCase()} [${nmm}]`,
      steps,
    };
  }

  // Localized international sign language gloss + syntax-ordered sign steps
  const sw = formatSignWritingOutput(moduleTag, severity, summary, signLanguage);
  const manualTag = language.alphabetType === 'two-handed' ? '2H manual' : '1H manual';
  const steps: AslSignStep[] = sw.boxes.map((box) => ({
    gloss: box.localizedGloss,
    handshape: `${box.hands}H ${HANDSHAPE_READABLE[box.handshape] ?? box.handshape} (${manualTag})`,
    location:
      box.contact !== 'none'
        ? `Neutral signing plane · ${box.contact} contact`
        : `${moduleTag.toUpperCase()} spatial locus`,
    movement: MOVEMENT_READABLE[box.movement] ?? box.movement,
    nonManualMarker: box.nmm,
  }));

  const leadNmm = steps[0]?.nonManualMarker ?? 'neutral';
  const tailNmm = steps[steps.length - 1]?.nonManualMarker ?? 'nod';
  const gloss = `[${language.code} · ${language.syntaxOrder.toUpperCase()}] [${leadNmm}] ${sw.localizedGlossLine} [${tailNmm}]`;

  return {
    language,
    gloss,
    steps,
  };
}

/**
 * Backward-compatible alias for American Sign Language (ASL) or any target Sign Language
 * Gloss, Non-Manual Markers (NMMs), and structured sign steps.
 */
export function formatAslOutput(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string,
  signLanguage: string = 'asl'
): { gloss: string; steps: AslSignStep[]; language: SignLanguageSpec } {
  return formatSignLanguageOutput(moduleTag, severity, summary, signLanguage);
}

export function buildAccessibleEventBundle(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string,
  signLanguage: string = 'asl',
  signWritingDirection?: SignWritingDirection,
  uiLocale: SupportedUiLocale = 'en',
  brailleProfileId: string = 'braille-ueb',
  deafblindProfileId: string = 'db-protactile'
): AccessibleEventBundle {
  const brailleProfile = resolveBrailleProfile(brailleProfileId);
  const brailleCompact = formatBrailleAnnouncement(
    moduleTag,
    severity,
    summary,
    brailleProfile.id
  );
  const brailleLines = chunkForBrailleCells(brailleCompact, 40);
  const brailleDots = brailleLines.map((line) => toUnicodeBraille(line));
  const protactile = formatProtactileCue(
    moduleTag,
    severity,
    summary,
    uiLocale,
    deafblindProfileId
  );
  const signOut = formatSignLanguageOutput(moduleTag, severity, summary, signLanguage);
  const signWriting = formatSignWritingOutput(
    moduleTag,
    severity,
    summary,
    signLanguage,
    signWritingDirection
  );

  return {
    standard: summary,
    brailleProfile,
    brailleLines,
    brailleDots,
    protactile,
    signLanguageSpec: signOut.language,
    aslGloss: signOut.gloss,
    aslSteps: signOut.steps,
    signWriting,
  };
}

export function describeGraphNodeAccessibility(
  node: GraphNode,
  arcs: GraphArc[],
  activeCap: CapabilityToken | undefined,
  allCaps: CapabilityToken[],
  uiLocale: SupportedUiLocale = 'en'
): {
  canUpdate: boolean;
  canDelete: boolean;
  outgoingCount: number;
  incomingCount: number;
  guardLabel: string;
} {
  const active = activeCap ? isCapabilityActive(activeCap.id, allCaps) : false;
  const inScope =
    active &&
    (activeCap?.scope === 'all' || activeCap?.scope === node.shard);
  const canUpdate = Boolean(inScope && activeCap?.rights.includes('update'));
  const canDelete = Boolean(inScope && activeCap?.rights.includes('delete'));
  const outgoingCount = arcs.filter((a) => a.source === node.id).length;
  const incomingCount = arcs.filter((a) => a.target === node.id).length;

  const localized = GUARD_LABELS[uiLocale];
  let guardLabel = localized?.revoked ?? 'Revoked';
  if (active) {
    if (!inScope) {
      guardLabel = `${localized?.lockedPrefix ?? 'Locked'} (${activeCap?.scope})`;
    } else if (canUpdate && canDelete) {
      guardLabel = localized?.rwd ?? 'Read/Write/Delete';
    } else if (canUpdate) {
      guardLabel = localized?.rw ?? 'Read/Write';
    } else {
      guardLabel = localized?.ro ?? 'Read-Only';
    }
  }

  return {
    canUpdate,
    canDelete,
    outgoingCount,
    incomingCount,
    guardLabel,
  };
}

export function assignShardByConsistentHash(
  nodeId: string,
  healthyShards: Array<'Shard-A' | 'Shard-B' | 'Shard-C'>
): 'Shard-A' | 'Shard-B' | 'Shard-C' {
  const pool: Array<'Shard-A' | 'Shard-B' | 'Shard-C'> =
    healthyShards.length > 0 ? healthyShards : ['Shard-A'];
  const hash = hashString32(nodeId);
  return pool[hash % pool.length];
}

export function graphToMerkleRecords(
  nodes: GraphNode[],
  arcs: GraphArc[]
): Record<string, string> {
  const records: Record<string, string> = {};
  for (const n of nodes) {
    records[`node:${n.id}`] = `${n.label}|${n.shard}|${n.status}|${n.groupTag}`;
  }
  for (const a of arcs) {
    records[`arc:${a.id}`] = `${a.source}->${a.target}|${a.label}|w=${a.weight}|${a.status}`;
  }
  return records;
}

export function checkRightForToken(
  cap: CapabilityToken | undefined,
  allCaps: CapabilityToken[],
  right: CapabilityRight
): boolean {
  if (!cap) return false;
  return isCapabilityActive(cap.id, allCaps) && cap.rights.includes(right);
}
