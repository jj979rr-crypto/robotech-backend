import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

const bannedWords: string[] = [
  // 1. Insultos generales y soeces
  'mierda',
  'puto',
  'puta',
  'perra',
  'cabrón',
  'cabron',
  'pendejo',
  'gilipollas',
  'estúpido',
  'estupido',
  'idiota',
  'imbecil',
  'imbécil',
  'coño',
  'carajo',
  'joder',
  'pinche',
  'verga',
  'pija',
  'chucha',
  'conchetumadre',
  'gonorrea',
  'malparido',
  'mamaguevo',
  'mamagüevo',
  'mamahuevo',
  'culero',
  'culera',
  'zorra',
  'bobo',
  'boba',
  'tonto',
  'tonta',
  'tarado',
  'tarada',
  'negro',
  'negra',


  // Sexual
  'sexo',
  'pene',
  'vagina',
  'polla',
  'rabo',
  'bicho',
  'chocho',
  'panocha',
  'culo',
  'tetas',
  'mamada',
  'paja',
  'pajero',
  'coger',
  'follar',
  'singar',
  'capullo',
  'violador',

  'retrasado',
  'mongolo',
  'mongólico',
  'mongolico',
  'autista',
  'down',

  // 2. Racismo, xenofobia
  'negro de mierda',
  'negrata',
  'simio',
  'mono',
  'esclavo',
  'color llanta',
  'color cartón',
  'color carton',

  'sudaca',
  'panchito',
  'moro',
  'veneco',
  'serrano',
  'cholo de mierda',
  'indio',
  'tiraflechas',
  'saltamuros',
  'frijolero',
  'gachupín',
  'gachupin',

  'judio',
  'judío',
  'nazi',
  'hitler',
  'jabón',
  'jabon',
  'horno',

  // 3. Homofobia
  'maricon',
  'maricón',
  'marica',
  'trolo',
  'tragasables',
  'soplapollas',
  'tortillera',
  'camionera',
  'trannie',
  'travelo',
  'shemale',
  'desviado',

  // 4. Insultos en inglés
  'fuck',
  'shit',
  'bitch',
  'ass',
  'asshole',
  'bastard',
  'dick',
  'cock',
  'pussy',
  'cunt',
  'whore',
  'slut',
  'wanker',
  'motherfucker',
  'cocksucker',

  //extremo en inglés
  'nigger',
  'nigga',
  'faggot',
  'fag',
  'retard',
  'autist',
  'kys',     
  'tranny',
  'spic',
  'beaner',
  'wetback',
  'kike',
  'chink',
  'gook',

  //
  'm1erda',
  'm!erda',
  'fck',
  'fvck',
  'sh1t',
  'b1tch',
  'n1gga',
];

function normalizeKeepLetters(text: string): string {
  const leetMap: Record<string, string> = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '8': 'b',
    '@': 'a',
    '$': 's',
    '!': 'i',
  };

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[0134578@$!]/g, (c) => leetMap[c] ?? '')
    .replace(/[^a-z]/g, '');
}

function tokenizeNickname(nickname: string): string[] {
  // nickname en front permite A-Za-z0-9_-; usamos _ y - como separadores “de palabra”
  return nickname
    .split(/[_-]+/g)
    .map(normalizeKeepLetters)
    .filter(Boolean);
}

function tokenizeBannedEntry(entry: string): string[] {
  // frases con espacios => tokens; si el usuario usa "_" para “espacios” también cae por subsecuencia
  return entry
    .split(/\s+/g)
    .map(normalizeKeepLetters)
    .filter(Boolean);
}

function containsSubsequence(hay: string[], needle: string[]): boolean {
  if (needle.length === 0) return false;
  for (let i = 0; i <= hay.length - needle.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// Preprocesa una vez (más rápido y consistente)
const bannedPatterns = bannedWords
  .map((raw) => {
    const tokens = tokenizeBannedEntry(raw);
    return {
      raw,
      tokens,
      joined: tokens.join(''),
      single: tokens.length === 1,
      one: tokens[0] ?? '',
    };
  })
  .filter((p) => p.tokens.length > 0);

export function IsSafeNickname(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsSafeNickname',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const nickTokens = tokenizeNickname(value);
          const nickJoined = nickTokens.join('');

          for (const b of bannedPatterns) {
            if (b.single) {
              const w = b.one;
              if (!w) continue;

              // Regla anti-falsos-positivos para palabras cortas (bot/ass/down...)
              if (w.length <= 3) {
                if (nickTokens.includes(w)) return false;
              } else {
                // Para palabras más largas sí puedes ser más estricto dentro del token
                if (nickTokens.some((t) => t === w || t.includes(w))) return false;
              }
            } else {
              // Frases: match por subsecuencia de tokens (ej: negro_de_mierda)
              if (containsSubsequence(nickTokens, b.tokens)) return false;

              // También cubre cuando lo pegan todo junto (ej: negrodemierda)
              if (b.joined.length >= 4 && nickJoined.includes(b.joined)) return false;
            }
          }

          return true;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'El nickname contiene términos ofensivos o inapropiados. Elige otro.';
        },
      },
    });
  };
}
