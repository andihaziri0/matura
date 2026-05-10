// Ordered “kapituj” for Matematikë practice — same 20 buckets as the legacy
// HTML bank (`TOPIC_BY_CAT` in scripts/akademiaas-bank/build-seed.mjs).

export interface MatematikePracticeChapter {
  readonly id: string;
  readonly order: number;
  readonly topicPath: string;
  /** Albanian label shown in chapter pickers (matches legacy bank wording). */
  readonly nameSq: string;
}

/** Legacy select order: 1 … 20. */
export const MATEMATIKE_PRACTICE_CHAPTERS: readonly MatematikePracticeChapter[] = [
  {
    id: 'logjike',
    order: 1,
    topicPath: 'aritmetike.logjike',
    nameSq: '1. Logjikë matematike & Bashkësi',
  },
  {
    id: 'numra',
    order: 2,
    topicPath: 'aritmetike.numra-real',
    nameSq: '2. Bashkësitë numerike & Veprime',
  },
  {
    id: 'kombinatorike',
    order: 3,
    topicPath: 'kombinatorike.kombinime',
    nameSq: '3. Kombinatorikë',
  },
  {
    id: 'fuqi-rrenje',
    order: 4,
    topicPath: 'aritmetike.fuqi-rrenje',
    nameSq: '4. Fuqizimi & Rrënjët',
  },
  {
    id: 'ekuacione-lineare',
    order: 5,
    topicPath: 'algjeber.ekuacione.lineare',
    nameSq: '5. Ekuacione & Inekuacione lineare',
  },
  {
    id: 'komplekse',
    order: 6,
    topicPath: 'algjeber.numra-komplekse',
    nameSq: '6. Numra kompleksë',
  },
  {
    id: 'ekuacione-kuadratike',
    order: 7,
    topicPath: 'algjeber.ekuacione.kuadratike',
    nameSq: '7. Ekuacione kuadratike',
  },
  {
    id: 'funksione-kuadratike',
    order: 8,
    topicPath: 'algjeber.funksione.kuadratike',
    nameSq: '8. Funksione kuadratike',
  },
  {
    id: 'eksponenciale',
    order: 9,
    topicPath: 'algjeber.eksponenciale-logaritme',
    nameSq: '9. Funksione eksponenciale & logaritmike',
  },
  {
    id: 'trigonometri',
    order: 10,
    topicPath: 'trigonometri.identitete',
    nameSq: '10. Trigonometri',
  },
  {
    id: 'vargje',
    order: 11,
    topicPath: 'vargje.aritmetike-gjeometrike',
    nameSq: '11. Vargje',
  },
  {
    id: 'limite',
    order: 12,
    topicPath: 'analize.limite',
    nameSq: '12. Limite & Vazhdueshmëri',
  },
  {
    id: 'derivate',
    order: 13,
    topicPath: 'analize.derivate',
    nameSq: '13. Derivate',
  },
  {
    id: 'gjeometri',
    order: 14,
    topicPath: 'gjeometri.plane',
    nameSq: '14. Gjeometri & Matje',
  },
  {
    id: 'vektore',
    order: 15,
    topicPath: 'gjeometri.vektore',
    nameSq: '15. Vektorë',
  },
  {
    id: 'statistike',
    order: 16,
    topicPath: 'statistike.deskriptive',
    nameSq: '16. Statistikë',
  },
  {
    id: 'probabilitet',
    order: 17,
    topicPath: 'kombinatorike.probabilitet',
    nameSq: '17. Probabilitet',
  },
  {
    id: 'analitike',
    order: 18,
    topicPath: 'gjeometri.analitike',
    nameSq: '18. Gjeometri analitike',
  },
  {
    id: 'polinome',
    order: 19,
    topicPath: 'algjeber.polinome',
    nameSq: '19. Polinome & Shprehje algjebrike',
  },
  {
    id: 'matrica',
    order: 20,
    topicPath: 'algjeber.matrica',
    nameSq: '20. Matrica & Determinanta',
  },
] as const;

export type MatematikePracticeChapterId = (typeof MATEMATIKE_PRACTICE_CHAPTERS)[number]['id'];

export function practiceChapterByTopicPath(
  topicPath: string,
): MatematikePracticeChapter | undefined {
  return MATEMATIKE_PRACTICE_CHAPTERS.find((c) => c.topicPath === topicPath);
}
