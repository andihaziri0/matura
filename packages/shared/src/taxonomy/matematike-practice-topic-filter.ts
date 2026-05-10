/**
 * Maps Matematikë practice chapter picker paths to one or more `topicPath`
 * prefixes for DB `startsWith` filters.
 *
 * Seeded questions use fine-grained taxonomy paths; chapter rows in the picker
 * are legacy “buckets” that often span several siblings. A single `startsWith`
 * on the chapter's own path misses many valid rows (e.g. `vargje.aritmetike`
 * vs `vargje.aritmetike-gjeometrike`).
 */
const CHAPTER_TO_TOPIC_PREFIXES: Readonly<Record<string, readonly string[]>> = {
  'aritmetike.numra-real': ['aritmetike.numra-real', 'aritmetike.perqindje'],
  'kombinatorike.kombinime': ['kombinatorike.kombinime', 'kombinatorike.permutacione'],
  'vargje.aritmetike-gjeometrike': [
    'vargje.aritmetike',
    'vargje.gjeometrike',
    'vargje.aritmetike-gjeometrike',
  ],
  'algjeber.ekuacione.lineare': ['algjeber.ekuacione.lineare', 'algjeber.inekuacione'],
  'algjeber.eksponenciale-logaritme': [
    'algjeber.eksponenciale-logaritme',
    'algjeber.eksponenciale',
    'algjeber.logaritme',
    'algjeber.funksione.eksponenciale',
    'algjeber.funksione.logaritmike',
  ],
  'trigonometri.identitete': [
    'trigonometri.identitete',
    'trigonometri.vlerat-themelore',
    'trigonometri.ekuacione',
    'trigonometri.trekendesha',
  ],
  'gjeometri.plane': [
    'gjeometri.plane',
    'gjeometri.plane.trekendesha',
    'gjeometri.plane.katerkendesha',
    'gjeometri.plane.rrethi',
    'gjeometri.hapesinore',
    'gjeometri.koordinate',
  ],
  'algjeber.polinome': ['algjeber.polinome', 'algjeber.shprehje', 'algjeber.identitete'],
};

/**
 * Prefixes to pass to `topicPath.startsWith` in the DB (one clause per prefix,
 * combined with OR).
 */
export function practiceChapterTopicPrefixes(chapterPickerPath: string): readonly string[] {
  return CHAPTER_TO_TOPIC_PREFIXES[chapterPickerPath] ?? [chapterPickerPath];
}
