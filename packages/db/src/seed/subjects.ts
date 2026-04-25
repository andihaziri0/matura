import { prisma } from '../client.js';

interface SubjectSeed {
  slug: string;
  nameSq: string;
  order: number;
}

const SUBJECTS: SubjectSeed[] = [
  { slug: 'matematike', nameSq: 'Matematikë', order: 1 },
];

export async function seedSubjects(): Promise<void> {
  for (const s of SUBJECTS) {
    await prisma.subject.upsert({
      where: { slug: s.slug },
      create: s,
      update: { nameSq: s.nameSq, order: s.order },
    });
  }
}
