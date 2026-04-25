// Canonical taxonomy for Matematikë (Kosovo Matura).
//
// `topicPath` is a dotted string. UI builds the tree from this list.
// Adding a topic: append to TOPICS, add a label, run `pnpm typecheck`.

export interface MathTopic {
  path: string;
  nameSq: string;
  /** which drejtimi typically encounter this — informational, not enforced */
  tracks: ReadonlyArray<'pergjithshem' | 'natyror' | 'shoqeror' | 'gjuhesor'>;
}

export const TOPICS: readonly MathTopic[] = [
  // Aritmetikë & numra realë
  { path: 'aritmetike.numra-real', nameSq: 'Numrat realë', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'aritmetike.fuqi-rrenje', nameSq: 'Fuqitë dhe rrënjët', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'aritmetike.perqindje', nameSq: 'Përqindja', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },

  // Algjeber
  { path: 'algjeber.shprehje', nameSq: 'Shprehje algjebrike', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'algjeber.identitete', nameSq: 'Identitete dhe faktorizim', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'algjeber.ekuacione.lineare', nameSq: 'Ekuacione lineare', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'algjeber.ekuacione.kuadratike', nameSq: 'Ekuacione kuadratike', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'algjeber.inekuacione', nameSq: 'Inekuacione', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'algjeber.sisteme', nameSq: 'Sisteme ekuacionesh', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'algjeber.eksponenciale', nameSq: 'Ekuacione eksponenciale', tracks: ['pergjithshem', 'natyror'] },
  { path: 'algjeber.logaritme', nameSq: 'Logaritme', tracks: ['pergjithshem', 'natyror'] },

  // Funksione
  { path: 'algjeber.funksione.vlerat', nameSq: 'Vlerat e funksionit', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'algjeber.funksione.lineare', nameSq: 'Funksioni linear', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'algjeber.funksione.kuadratike', nameSq: 'Funksioni kuadratik', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'algjeber.funksione.eksponenciale', nameSq: 'Funksioni eksponencial', tracks: ['pergjithshem', 'natyror'] },
  { path: 'algjeber.funksione.logaritmike', nameSq: 'Funksioni logaritmik', tracks: ['pergjithshem', 'natyror'] },

  // Trigonometri
  { path: 'trigonometri.vlerat-themelore', nameSq: 'Vlerat themelore', tracks: ['pergjithshem', 'natyror'] },
  { path: 'trigonometri.identitete', nameSq: 'Identitete trigonometrike', tracks: ['pergjithshem', 'natyror'] },
  { path: 'trigonometri.ekuacione', nameSq: 'Ekuacione trigonometrike', tracks: ['natyror'] },
  { path: 'trigonometri.trekendesha', nameSq: 'Zgjidhja e trekëndëshave', tracks: ['pergjithshem', 'natyror'] },

  // Gjeometri
  { path: 'gjeometri.plane.trekendesha', nameSq: 'Trekëndëshat', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'gjeometri.plane.katerkendesha', nameSq: 'Katërkëndëshat', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'gjeometri.plane.rrethi', nameSq: 'Rrethi', tracks: ['pergjithshem', 'natyror', 'shoqeror', 'gjuhesor'] },
  { path: 'gjeometri.hapesinore.vellime', nameSq: 'Vëllimet e trupave', tracks: ['pergjithshem', 'natyror'] },
  { path: 'gjeometri.hapesinore.siperfaqe', nameSq: 'Sipërfaqet e trupave', tracks: ['pergjithshem', 'natyror'] },
  { path: 'gjeometri.koordinate', nameSq: 'Gjeometria koordinative', tracks: ['pergjithshem', 'natyror'] },

  // Vargje & progresione
  { path: 'vargje.aritmetike', nameSq: 'Progresione aritmetike', tracks: ['pergjithshem', 'natyror', 'shoqeror'] },
  { path: 'vargje.gjeometrike', nameSq: 'Progresione gjeometrike', tracks: ['pergjithshem', 'natyror', 'shoqeror'] },

  // Kombinatorikë & probabilitet
  { path: 'kombinatorike.permutacione', nameSq: 'Permutacione, kombinime', tracks: ['pergjithshem', 'natyror', 'shoqeror'] },
  { path: 'kombinatorike.probabilitet', nameSq: 'Probabilitet', tracks: ['pergjithshem', 'natyror', 'shoqeror'] },

  // Analizë (vetëm natyror)
  { path: 'analize.derivate', nameSq: 'Derivatet', tracks: ['natyror'] },
  { path: 'analize.integrale', nameSq: 'Integralet', tracks: ['natyror'] },
  { path: 'analize.limite', nameSq: 'Limite', tracks: ['natyror'] },
] as const;

export const TOPIC_PATHS = TOPICS.map((t) => t.path);

export type MathTopicPath = (typeof TOPIC_PATHS)[number];

export function isMathTopicPath(value: unknown): value is MathTopicPath {
  return typeof value === 'string' && (TOPIC_PATHS as readonly string[]).includes(value);
}

export function topicLabel(path: string): string | undefined {
  return TOPICS.find((t) => t.path === path)?.nameSq;
}

export function topicsForTrack(track: 'pergjithshem' | 'natyror' | 'shoqeror' | 'gjuhesor'): MathTopic[] {
  return TOPICS.filter((t) => t.tracks.includes(track));
}
