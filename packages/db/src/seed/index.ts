import { prisma } from '../client.js';
import { seedSubjects } from './subjects.js';
import { seedQuestions } from './questions.js';

async function main(): Promise<void> {
  console.log('[seed] subjects');
  await seedSubjects();
  console.log('[seed] questions (matematike)');
  await seedQuestions();
  console.log('[seed] done');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
