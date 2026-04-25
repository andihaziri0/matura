import { Module } from '@nestjs/common';

/**
 * Holds bulk content ingestion logic. The HTTP-facing surface is intentionally minimal:
 * import jobs run from the CLI (see `importers/cli.ts`) and as background BullMQ jobs.
 */
@Module({})
export class ContentModule {}
