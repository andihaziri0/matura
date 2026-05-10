import type { Prisma } from '@matura/db';
import { practiceChapterTopicPrefixes } from '@matura/shared';

/**
 * Builds a `where` fragment for practice chapter pickers: one or more
 * `topicPath startsWith` branches (OR), matching seeded taxonomy paths.
 */
export function practiceChapterTopicWhere(topicPath: string): Prisma.QuestionWhereInput {
  const prefixes = practiceChapterTopicPrefixes(topicPath);
  if (prefixes.length === 1) {
    return { topicPath: { startsWith: prefixes[0] } };
  }
  return { OR: prefixes.map((p) => ({ topicPath: { startsWith: p } })) };
}
