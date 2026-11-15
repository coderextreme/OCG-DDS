export type SignWritingDirection = 'vertical' | 'horizontal';
export type SignAlphabetType = 'one-handed' | 'two-handed';
export type SignSyntaxOrder = 'topic-comment' | 'svo' | 'sov';

export type SignHandshapeKind =
  | 'index'
  | 'flat-b'
  | 'fist-a'
  | 'open-5'
  | 'c-hand'
  | 'f-link'
  | 'v-bent'
  | 'x-hook';

export type SignMovementKind =
  | 'arc-path'
  | 'forward'
  | 'apart'
  | 'together'
  | 'halt'
  | 'twist'
  | 'gather';

export type SignContactKind = 'touch' | 'grasp' | 'cross' | 'none';

export type SignNmmKind =
  | 'brows-up'
  | 'brows-furrowed'
  | 'headshake'
  | 'nod'
  | 'neutral';

export type SignSemanticKey =
  | 'authority'
  | 'forbidden'
  | 'stop'
  | 'group'
  | 'commit'
  | 'node-pair'
  | 'connect'
  | 'replica'
  | 'break'
  | 'all-shards'
  | 'merge'
  | 'topic'
  | 'done';

export interface SignLanguageSpec {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  writingDirection: SignWritingDirection;
  alphabetType: SignAlphabetType;
  syntaxOrder: SignSyntaxOrder;
  isCustom: boolean;
}

export interface SignWritingBox {
  id: string;
  semanticKey: SignSemanticKey;
  gloss: string;
  localizedGloss: string;
  handshape: SignHandshapeKind;
  hands: 1 | 2;
  movement: SignMovementKind;
  contact: SignContactKind;
  nmm: SignNmmKind;
  fswToken: string;
  swuChars: string;
  ariaDescription: string;
}

export interface SignWritingSequence {
  language: SignLanguageSpec;
  direction: SignWritingDirection;
  fsw: string;
  swu: string;
  localizedGlossLine: string;
  boxes: SignWritingBox[];
}

export const SIGN_LANGUAGE_PRESETS: SignLanguageSpec[] = [
  {
    id: 'asl',
    code: 'ASL',
    name: 'American Sign Language',
    nativeName: 'American Sign Language',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'topic-comment',
    isCustom: false,
  },
  {
    id: 'bsl',
    code: 'BSL',
    name: 'British Sign Language',
    nativeName: 'British Sign Language',
    writingDirection: 'vertical',
    alphabetType: 'two-handed',
    syntaxOrder: 'topic-comment',
    isCustom: false,
  },
  {
    id: 'lsf',
    code: 'LSF',
    name: 'French Sign Language',
    nativeName: 'Langue des Signes Française',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'topic-comment',
    isCustom: false,
  },
  {
    id: 'dgs',
    code: 'DGS',
    name: 'German Sign Language',
    nativeName: 'Deutsche Gebärdensprache',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'sov',
    isCustom: false,
  },
  {
    id: 'lse',
    code: 'LSE',
    name: 'Spanish Sign Language',
    nativeName: 'Lengua de Signos Española',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'svo',
    isCustom: false,
  },
  {
    id: 'libras',
    code: 'LIBRAS',
    name: 'Brazilian Sign Language',
    nativeName: 'Língua Brasileira de Sinais',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'svo',
    isCustom: false,
  },
  {
    id: 'jsl',
    code: 'JSL',
    name: 'Japanese Sign Language',
    nativeName: '日本手話 (Nihon Shuwa)',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'sov',
    isCustom: false,
  },
  {
    id: 'lsm',
    code: 'LSM',
    name: 'Mexican Sign Language',
    nativeName: 'Lengua de Señas Mexicana',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'topic-comment',
    isCustom: false,
  },
  {
    id: 'auslan',
    code: 'Auslan',
    name: 'Australian Sign Language',
    nativeName: 'Auslan',
    writingDirection: 'vertical',
    alphabetType: 'two-handed',
    syntaxOrder: 'topic-comment',
    isCustom: false,
  },
  {
    id: 'nzsl',
    code: 'NZSL',
    name: 'New Zealand Sign Language',
    nativeName: 'New Zealand Sign Language',
    writingDirection: 'vertical',
    alphabetType: 'two-handed',
    syntaxOrder: 'topic-comment',
    isCustom: false,
  },
  {
    id: 'csl',
    code: 'CSL',
    name: 'Chinese Sign Language',
    nativeName: '中国手语',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'svo',
    isCustom: false,
  },
  {
    id: 'tsl',
    code: 'TSL',
    name: 'Taiwan Sign Language',
    nativeName: '臺灣手語',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'svo',
    isCustom: false,
  },
  {
    id: 'ksl',
    code: 'KSL',
    name: 'Kenyan Sign Language',
    nativeName: 'Kenyan Sign Language',
    writingDirection: 'vertical',
    alphabetType: 'two-handed',
    syntaxOrder: 'topic-comment',
    isCustom: false,
  },
  {
    id: 'sasl',
    code: 'SASL',
    name: 'South African Sign Language',
    nativeName: 'South African Sign Language',
    writingDirection: 'vertical',
    alphabetType: 'two-handed',
    syntaxOrder: 'topic-comment',
    isCustom: false,
  },
  {
    id: 'isl-in',
    code: 'ISL-IN',
    name: 'Indo-Pakistani Sign Language',
    nativeName: 'Indo-Pakistani Sign Language',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'svo',
    isCustom: false,
  },
  {
    id: 'bds',
    code: 'BdSL',
    name: 'Bangladeshi Sign Language',
    nativeName: 'বাংলা ইশারা ভাষা',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'svo',
    isCustom: false,
  },
  {
    id: 'lis',
    code: 'LIS',
    name: 'Italian Sign Language',
    nativeName: 'Lingua dei Segni Italiana',
    writingDirection: 'vertical',
    alphabetType: 'two-handed',
    syntaxOrder: 'svo',
    isCustom: false,
  },
  {
    id: 'ngt',
    code: 'NGT',
    name: 'Sign Language of the Netherlands',
    nativeName: 'Nederlandse Gebarentaal',
    writingDirection: 'vertical',
    alphabetType: 'two-handed',
    syntaxOrder: 'sov',
    isCustom: false,
  },
  {
    id: 'sts',
    code: 'STS',
    name: 'Swedish Sign Language',
    nativeName: 'Svenskt teckenspråk',
    writingDirection: 'vertical',
    alphabetType: 'two-handed',
    syntaxOrder: 'svo',
    isCustom: false,
  },
  {
    id: 'pjm',
    code: 'PJM',
    name: 'Polish Sign Language',
    nativeName: 'Polski Język Migowy',
    writingDirection: 'vertical',
    alphabetType: 'two-handed',
    syntaxOrder: 'svo',
    isCustom: false,
  },
  {
    id: 'isl-ie',
    code: 'ISL-IE',
    name: 'Irish Sign Language',
    nativeName: 'Teanga Chomharthaíochta na hÉireann',
    writingDirection: 'vertical',
    alphabetType: 'two-handed',
    syntaxOrder: 'topic-comment',
    isCustom: false,
  },
  {
    id: 'is',
    code: 'IS',
    name: 'International Sign',
    nativeName: 'International Sign',
    writingDirection: 'vertical',
    alphabetType: 'one-handed',
    syntaxOrder: 'topic-comment',
    isCustom: false,
  },
];

const LOCALIZED_GLOSSES: Record<string, Record<SignSemanticKey, string>> = {
  asl: {
    authority: 'AUTHORITY-KEY',
    forbidden: 'FORBIDDEN',
    stop: 'STOP',
    group: 'GROUP-SET',
    commit: 'COMMIT-LOCK',
    'node-pair': 'NODE-TO-NODE',
    connect: 'ARC-CONNECT',
    replica: 'REPLICA-NODE',
    break: 'BREAK-ISOLATED',
    'all-shards': 'ALL-SHARDS',
    merge: 'MERGE-EQUAL',
    topic: 'GRAPH-TOPIC',
    done: 'FINISH-OK',
  },
  bsl: {
    authority: 'KEY-AUTHORITY',
    forbidden: 'BLOCKED',
    stop: 'HALT',
    group: 'COLLECT-GROUP',
    commit: 'LOCK-APPLY',
    'node-pair': 'POINT-TO-POINT',
    connect: 'JOIN-LINK',
    replica: 'REPLICA-LOCUS',
    break: 'SPLIT-APART',
    'all-shards': 'EVERY-SHARD',
    merge: 'MATCH-SAME',
    topic: 'SUBJECT-TOPIC',
    done: 'FINISHED',
  },
  lsf: {
    authority: 'CLÉ-AUTORITÉ',
    forbidden: 'INTERDIT',
    stop: 'ARRÊT',
    group: 'GROUPE',
    commit: 'VALIDER',
    'node-pair': 'NŒUD-À-NŒUD',
    connect: 'RELIER',
    replica: 'RÉPLIQUE',
    break: 'COUPER',
    'all-shards': 'TOUS-SHARDS',
    merge: 'FUSIONNER',
    topic: 'SUJET-GRAPHE',
    done: 'FINI-OK',
  },
  dgs: {
    authority: 'SCHLÜSSEL',
    forbidden: 'VERBOTEN',
    stop: 'STOPP',
    group: 'GRUPPE',
    commit: 'BESTÄTIGEN',
    'node-pair': 'KNOTEN-PFAD',
    connect: 'VERBINDEN',
    replica: 'REPLIKA',
    break: 'TRENNEN',
    'all-shards': 'ALLE-SHARDS',
    merge: 'ANGLEICHEN',
    topic: 'THEMA',
    done: 'FERTIG',
  },
  lse: {
    authority: 'AUTORIDAD',
    forbidden: 'PROHIBIDO',
    stop: 'ALTO',
    group: 'GRUPO',
    commit: 'APLICAR',
    'node-pair': 'NODO-A-NODO',
    connect: 'CONECTAR',
    replica: 'RÉPLICA',
    break: 'SEPARAR',
    'all-shards': 'TODOS-NODOS',
    merge: 'UNIFICAR',
    topic: 'TEMA',
    done: 'LISTO',
  },
  libras: {
    authority: 'CHAVE-PODER',
    forbidden: 'PROIBIDO',
    stop: 'PARAR',
    group: 'GRUPO',
    commit: 'CONFIRMAR',
    'node-pair': 'NÓ-A-NÓ',
    connect: 'LIGAR-ARCO',
    replica: 'RÉPLICA',
    break: 'QUEBRAR',
    'all-shards': 'TODOS',
    merge: 'UNIR-IGUAL',
    topic: 'TÓPICO',
    done: 'PRONTO',
  },
  jsl: {
    authority: '権限-KEY',
    forbidden: '禁止',
    stop: '停止',
    group: '集合',
    commit: '確定',
    'node-pair': 'ノード間',
    connect: '接続',
    replica: '複製',
    break: '切断',
    'all-shards': '全シャード',
    merge: '統合',
    topic: '主題',
    done: '完了',
  },
  lsm: {
    authority: 'AUTORIDAD',
    forbidden: 'PROHIBIDO',
    stop: 'ALTO',
    group: 'GRUPO',
    commit: 'GUARDAR',
    'node-pair': 'NODO-RUTA',
    connect: 'CONECTAR',
    replica: 'RÉPLICA',
    break: 'ROMPER',
    'all-shards': 'TODOS',
    merge: 'UNIR',
    topic: 'TEMA',
    done: 'LISTO',
  },
  auslan: {
    authority: 'KEY-AUTHORITY',
    forbidden: 'FORBIDDEN',
    stop: 'STOP',
    group: 'CLUSTER-SET',
    commit: 'COMMIT',
    'node-pair': 'NODE-LINK-PATH',
    connect: 'JOIN-ARC',
    replica: 'REPLICA',
    break: 'SPLIT-OFF',
    'all-shards': 'ALL-SHARDS',
    merge: 'MERGE-SAME',
    topic: 'TOPIC',
    done: 'DONE',
  },
  nzsl: {
    authority: 'KEY-AUTHORITY',
    forbidden: 'FORBIDDEN',
    stop: 'STOP',
    group: 'GROUP-SET',
    commit: 'LOCK-OK',
    'node-pair': 'POINT-TO-POINT',
    connect: 'LINK-JOIN',
    replica: 'REPLICA',
    break: 'BREAK-APART',
    'all-shards': 'ALL-SHARDS',
    merge: 'JOIN-SAME',
    topic: 'TOPIC',
    done: 'FINISH',
  },
  csl: {
    authority: '权限-钥匙',
    forbidden: '禁止',
    stop: '停止',
    group: '集合',
    commit: '确认锁定',
    'node-pair': '节点-路径',
    connect: '连接',
    replica: '副本',
    break: '断开',
    'all-shards': '全部分片',
    merge: '合并一致',
    topic: '主题',
    done: '完成',
  },
  tsl: {
    authority: '權限-鑰匙',
    forbidden: '禁止',
    stop: '停止',
    group: '群組',
    commit: '確認鎖定',
    'node-pair': '節點-路徑',
    connect: '連結',
    replica: '複本',
    break: '斷開',
    'all-shards': '全部分片',
    merge: '合併一致',
    topic: '主題',
    done: '完成',
  },
  ksl: {
    authority: 'UFUNGUO-MAMLAKA',
    forbidden: 'MARUFUKU',
    stop: 'SIMAMA',
    group: 'KUNDI',
    commit: 'THIBITISHA',
    'node-pair': 'NUKTA-NJIA',
    connect: 'UNGANISHA',
    replica: 'NAKALA',
    break: 'KATIKA',
    'all-shards': 'VIPANDE-VYOTE',
    merge: 'SAWAZISHA',
    topic: 'MADA',
    done: 'TAYARI',
  },
  sasl: {
    authority: 'KEY-AUTHORITY',
    forbidden: 'FORBID-STOP',
    stop: 'HALT',
    group: 'GROUP-CLUSTER',
    commit: 'LOCK-APPLY',
    'node-pair': 'POINT-PATH',
    connect: 'JOIN-LINK',
    replica: 'COPY-NODE',
    break: 'SPLIT-APART',
    'all-shards': 'ALL-SHARDS',
    merge: 'MERGE-EQUAL',
    topic: 'TOPIC',
    done: 'FINISH-DONE',
  },
  'isl-in': {
    authority: 'अधिकार-कुंजी',
    forbidden: 'निषिद्ध',
    stop: 'रोकें',
    group: 'समूह',
    commit: 'पुष्टि-लॉक',
    'node-pair': 'नोड-पथ',
    connect: 'जोड़ें',
    replica: 'प्रतिकृति',
    break: 'अलग-करें',
    'all-shards': 'सभी-शार्ड',
    merge: 'समान-मिलाएँ',
    topic: 'विषय',
    done: 'पूर्ण',
  },
  bds: {
    authority: 'কর্তৃত্ব-চাবি',
    forbidden: 'নিষিদ্ধ',
    stop: 'থামুন',
    group: 'দল',
    commit: 'নিশ্চিত-লক',
    'node-pair': 'নোড-পথ',
    connect: 'যুক্ত',
    replica: 'প্রতিলিপি',
    break: 'বিচ্ছিন্ন',
    'all-shards': 'সব-শার্ড',
    merge: 'একত্র-সমান',
    topic: 'বিষয়',
    done: 'সম্পন্ন',
  },
  lis: {
    authority: 'CHIAVE-AUTORITÀ',
    forbidden: 'VIETATO',
    stop: 'STOP',
    group: 'GRUPPO',
    commit: 'CONFERMA',
    'node-pair': 'NODO-A-NODO',
    connect: 'COLLEGA',
    replica: 'REPLICA',
    break: 'SEPARA',
    'all-shards': 'TUTTI-SHARD',
    merge: 'UNISCI-UGUALE',
    topic: 'TEMA',
    done: 'FATTO',
  },
  ngt: {
    authority: 'SLEUTEL-GEZAG',
    forbidden: 'VERBODEN',
    stop: 'STOP',
    group: 'GROEP',
    commit: 'VASTLEGGEN',
    'node-pair': 'KNOOP-PAD',
    connect: 'VERBINDEN',
    replica: 'REPLICA',
    break: 'BREKEN',
    'all-shards': 'ALLE-SHARDS',
    merge: 'SAMENVOEGEN',
    topic: 'ONDERWERP',
    done: 'KLAAR',
  },
  sts: {
    authority: 'NYCKEL-BEHÖRIGHET',
    forbidden: 'FÖRBJUDEN',
    stop: 'STOPP',
    group: 'GRUPP',
    commit: 'BEKRÄFTA',
    'node-pair': 'NOD-TILL-NOD',
    connect: 'KOPPLA',
    replica: 'REPLIKA',
    break: 'BRYTA',
    'all-shards': 'ALLA-SHARDS',
    merge: 'SLÅ-IHOP',
    topic: 'ÄMNE',
    done: 'KLAR',
  },
  pjm: {
    authority: 'KLUCZ-UPRAWNIENIA',
    forbidden: 'ZABRONIONE',
    stop: 'STOP',
    group: 'GRUPA',
    commit: 'ZATWIERDŹ',
    'node-pair': 'WĘZEŁ-ŚCIEŻKA',
    connect: 'POŁĄCZ',
    replica: 'REPLIKA',
    break: 'ROZDZIEL',
    'all-shards': 'WSZYSTKIE-SHARDY',
    merge: 'SCAL-ZGODNIE',
    topic: 'TEMAT',
    done: 'GOTOWE',
  },
  'isl-ie': {
    authority: 'EOCHAIR-ÚDARÁS',
    forbidden: 'TOIRMISCTHE',
    stop: 'STAD',
    group: 'GRÚPA',
    commit: 'DAINGNIGH',
    'node-pair': 'NÓD-COSÁN',
    connect: 'CEANGAIL',
    replica: 'MACSAMHAIL',
    break: 'BRIS-SCAR',
    'all-shards': 'GACH-ROINN',
    merge: 'COMHCHEANGAIL',
    topic: 'ÁBHAR',
    done: 'CRÍOCHNAITHE',
  },
  is: {
    authority: 'KEY-POWER',
    forbidden: 'FORBID',
    stop: 'STOP',
    group: 'GROUP-ALL',
    commit: 'LOCK-OK',
    'node-pair': 'POINT-PATH',
    connect: 'CONNECT',
    replica: 'COPY-NODE',
    break: 'BREAK-APART',
    'all-shards': 'ALL-SPACE',
    merge: 'JOIN-SAME',
    topic: 'TOPIC',
    done: 'DONE',
  },
};

// ISWA 2010 base codes used in Formal SignWriting (FSW)
const FSW_HANDSHAPE_CODE: Record<SignHandshapeKind, string> = {
  index: 'S10000',
  'v-bent': 'S11900',
  'open-5': 'S14000',
  'flat-b': 'S14700',
  'c-hand': 'S16d00',
  'f-link': 'S1f000',
  'x-hook': 'S10a00',
  'fist-a': 'S1f700',
};

const FSW_MOVEMENT_CODE: Record<SignMovementKind, string> = {
  forward: 'S26500',
  'arc-path': 'S27100',
  together: 'S28800',
  apart: 'S28900',
  twist: 'S2a200',
  gather: 'S28600',
  halt: 'S22a00',
};

const FSW_CONTACT_CODE: Record<SignContactKind, string> = {
  touch: 'S20500',
  grasp: 'S20b00',
  cross: 'S20900',
  none: '',
};

const FSW_NMM_CODE: Record<SignNmmKind, string> = {
  neutral: 'S30000',
  'brows-up': 'S31400',
  'brows-furrowed': 'S31800',
  headshake: 'S30300',
  nod: 'S30400',
};

// Unicode 8.0 Sutton SignWriting block (U+1D800 - U+1DAAF)
const SWU_HANDSHAPE_CP: Record<SignHandshapeKind, number> = {
  index: 0x1d800,
  'v-bent': 0x1d81c,
  'open-5': 0x1d84c,
  'flat-b': 0x1d850,
  'c-hand': 0x1d86c,
  'f-link': 0x1d8bb,
  'x-hook': 0x1d810,
  'fist-a': 0x1d8c8,
};

const SWU_MOVEMENT_CP: Record<SignMovementKind, number> = {
  forward: 0x1d92f,
  'arc-path': 0x1d93f,
  together: 0x1d958,
  apart: 0x1d959,
  twist: 0x1d98c,
  gather: 0x1d956,
  halt: 0x1d91a,
};

const SWU_CONTACT_CP: Record<SignContactKind, number | null> = {
  touch: 0x1d905,
  grasp: 0x1d90b,
  cross: 0x1d909,
  none: null,
};

const SWU_NMM_CP: Record<SignNmmKind, number> = {
  neutral: 0x1d9f0,
  'brows-up': 0x1da04,
  'brows-furrowed': 0x1da08,
  headshake: 0x1d9f3,
  nod: 0x1d9f4,
};

export function resolveSignLanguage(
  languageInput?: string,
  directionOverride?: SignWritingDirection
): SignLanguageSpec {
  const cleaned = (languageInput ?? 'asl').trim();
  const lower = cleaned.toLowerCase();

  const preset = SIGN_LANGUAGE_PRESETS.find(
    (p) =>
      p.id.toLowerCase() === lower ||
      p.code.toLowerCase() === lower ||
      p.name.toLowerCase() === lower
  );

  if (preset) {
    return directionOverride
      ? { ...preset, writingDirection: directionOverride }
      : preset;
  }

  const normalizedLabel = cleaned || 'International Sign';
  const alphaOnly = normalizedLabel.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const derivedCode =
    alphaOnly.length >= 2 && alphaOnly.length <= 6
      ? alphaOnly
      : alphaOnly.slice(0, 4) || 'SIGN';

  return {
    id: `custom:${lower || 'sign'}`,
    code: derivedCode,
    name: normalizedLabel,
    nativeName: normalizedLabel,
    writingDirection: directionOverride ?? 'vertical',
    alphabetType: lower.includes('bsl') || lower.includes('nzsl') ? 'two-handed' : 'one-handed',
    syntaxOrder: 'topic-comment',
    isCustom: true,
  };
}

interface SemanticBlueprint {
  semanticKey: SignSemanticKey;
  baseGloss: string;
  handshape: SignHandshapeKind;
  hands: 1 | 2;
  movement: SignMovementKind;
  contact: SignContactKind;
  nmm: SignNmmKind;
}

function buildBlueprintBox(
  index: number,
  bp: SemanticBlueprint,
  language: SignLanguageSpec
): SignWritingBox {
  const dict = LOCALIZED_GLOSSES[language.id] ?? LOCALIZED_GLOSSES.is;
  const localizedGloss = language.isCustom
    ? `${dict[bp.semanticKey]} [${language.code}]`
    : dict[bp.semanticKey];

  // Two-handed national sign languages (BSL / Auslan) emphasize two-hand articulation on authority/done signs
  const effectiveHands: 1 | 2 =
    language.alphabetType === 'two-handed' &&
    (bp.semanticKey === 'authority' || bp.semanticKey === 'done')
      ? 2
      : bp.hands;

  const hsCode = FSW_HANDSHAPE_CODE[bp.handshape];
  const mvCode = FSW_MOVEMENT_CODE[bp.movement];
  const ctCode = FSW_CONTACT_CODE[bp.contact];
  const nmmCode = FSW_NMM_CODE[bp.nmm];

  const secondHandFsw = effectiveHands === 2 ? `${hsCode.slice(0, 4)}10465x500` : '';
  const fswToken = `M535x540${nmmCode}482x445${hsCode}505x495${secondHandFsw}${
    ctCode ? `${ctCode}492x488` : ''
  }${mvCode}512x478`;

  const swuParts = [
    String.fromCodePoint(SWU_NMM_CP[bp.nmm]),
    String.fromCodePoint(SWU_HANDSHAPE_CP[bp.handshape]),
  ];
  if (effectiveHands === 2) {
    swuParts.push(String.fromCodePoint(SWU_HANDSHAPE_CP[bp.handshape]));
  }
  const ctCp = SWU_CONTACT_CP[bp.contact];
  if (ctCp !== null) {
    swuParts.push(String.fromCodePoint(ctCp));
  }
  swuParts.push(String.fromCodePoint(SWU_MOVEMENT_CP[bp.movement]));

  const swuChars = swuParts.join('');
  const ariaDescription = `${localizedGloss}: ${effectiveHands}-hand ${bp.handshape} handshape, ${bp.movement} movement${
    bp.contact !== 'none' ? ` with ${bp.contact} contact` : ''
  }, facial marker ${bp.nmm}, SignWriting FSW ${fswToken}.`;

  return {
    id: `sw-box-${index}-${bp.semanticKey}`,
    semanticKey: bp.semanticKey,
    gloss: bp.baseGloss,
    localizedGloss,
    handshape: bp.handshape,
    hands: effectiveHands,
    movement: bp.movement,
    contact: bp.contact,
    nmm: bp.nmm,
    fswToken,
    swuChars,
    ariaDescription,
  };
}

function selectBlueprintsForEvent(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string
): SemanticBlueprint[] {
  const lower = summary.toLowerCase();

  if (lower.includes('denied') || lower.includes('revoked')) {
    return [
      {
        semanticKey: 'authority',
        baseGloss: 'KEY / AUTHORITY',
        handshape: 'x-hook',
        hands: 2,
        movement: 'twist',
        contact: 'touch',
        nmm: 'brows-furrowed',
      },
      {
        semanticKey: 'forbidden',
        baseGloss: 'FORBIDDEN',
        handshape: 'flat-b',
        hands: 2,
        movement: 'halt',
        contact: 'cross',
        nmm: 'headshake',
      },
      {
        semanticKey: 'stop',
        baseGloss: 'STOP',
        handshape: 'flat-b',
        hands: 1,
        movement: 'halt',
        contact: 'none',
        nmm: 'brows-furrowed',
      },
    ];
  }

  if (lower.includes('batch') || lower.includes('group')) {
    return [
      {
        semanticKey: 'group',
        baseGloss: 'GROUP CLUSTER',
        handshape: 'c-hand',
        hands: 2,
        movement: 'gather',
        contact: 'none',
        nmm: 'brows-up',
      },
      {
        semanticKey: 'commit',
        baseGloss: 'COMMIT',
        handshape: 'fist-a',
        hands: 2,
        movement: 'together',
        contact: 'grasp',
        nmm: 'nod',
      },
    ];
  }

  if (lower.includes('arc') || summary.includes('->')) {
    return [
      {
        semanticKey: 'node-pair',
        baseGloss: 'NODE TO NODE',
        handshape: 'index',
        hands: 2,
        movement: 'arc-path',
        contact: 'none',
        nmm: 'brows-up',
      },
      {
        semanticKey: 'connect',
        baseGloss: 'CONNECT',
        handshape: 'f-link',
        hands: 2,
        movement: 'together',
        contact: 'grasp',
        nmm: 'nod',
      },
      {
        semanticKey: 'done',
        baseGloss: 'FINISH',
        handshape: 'open-5',
        hands: 2,
        movement: 'twist',
        contact: 'none',
        nmm: 'nod',
      },
    ];
  }

  if (lower.includes('partition') || lower.includes('offline') || lower.includes('fail')) {
    return [
      {
        semanticKey: 'replica',
        baseGloss: 'REPLICA',
        handshape: 'v-bent',
        hands: 1,
        movement: 'forward',
        contact: 'none',
        nmm: 'brows-furrowed',
      },
      {
        semanticKey: 'break',
        baseGloss: 'BREAK-APART',
        handshape: 'fist-a',
        hands: 2,
        movement: 'apart',
        contact: 'cross',
        nmm: 'headshake',
      },
    ];
  }

  if (lower.includes('converg') || lower.includes('sync') || lower.includes('repair')) {
    return [
      {
        semanticKey: 'all-shards',
        baseGloss: 'ALL REPLICAS',
        handshape: 'open-5',
        hands: 2,
        movement: 'arc-path',
        contact: 'none',
        nmm: 'brows-up',
      },
      {
        semanticKey: 'merge',
        baseGloss: 'MERGE EQUAL',
        handshape: 'flat-b',
        hands: 2,
        movement: 'together',
        contact: 'touch',
        nmm: 'nod',
      },
    ];
  }

  return [
    {
      semanticKey: 'topic',
      baseGloss: `${moduleTag.toUpperCase()} TOPIC`,
      handshape: 'index',
      hands: 1,
      movement: 'forward',
      contact: 'none',
      nmm: 'brows-up',
    },
    {
      semanticKey: severity === 'warning' ? 'stop' : 'done',
      baseGloss: severity === 'warning' ? 'ALERT' : 'DONE / UPDATED',
      handshape: severity === 'warning' ? 'flat-b' : 'open-5',
      hands: 2,
      movement: severity === 'warning' ? 'halt' : 'twist',
      contact: 'none',
      nmm: severity === 'warning' ? 'brows-furrowed' : 'nod',
    },
  ];
}

function orderBlueprintsBySyntax(
  blueprints: SemanticBlueprint[],
  syntaxOrder: SignSyntaxOrder
): SemanticBlueprint[] {
  if (blueprints.length <= 2) return blueprints;
  if (syntaxOrder === 'sov') {
    // Move verb/action sign to final position (Topic + Target + Action)
    return [blueprints[0], blueprints[2], blueprints[1]];
  }
  if (syntaxOrder === 'svo') {
    // Subject + Action + Result
    return blueprints;
  }
  return blueprints;
}

export function formatSignWritingOutput(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string,
  languageInput: string = 'asl',
  directionOverride?: SignWritingDirection
): SignWritingSequence {
  const language = resolveSignLanguage(languageInput, directionOverride);
  const rawBlueprints = selectBlueprintsForEvent(moduleTag, severity, summary);
  const ordered = orderBlueprintsBySyntax(rawBlueprints, language.syntaxOrder);
  const boxes = ordered.map((bp, idx) => buildBlueprintBox(idx, bp, language));

  return {
    language,
    direction: language.writingDirection,
    fsw: boxes.map((b) => b.fswToken).join(' '),
    swu: boxes.map((b) => b.swuChars).join(' '),
    localizedGlossLine: boxes.map((b) => b.localizedGloss).join(' · '),
    boxes,
  };
}
