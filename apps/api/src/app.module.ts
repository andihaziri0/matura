import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './common/auth/auth.module';
import { FirebaseAuthGuard } from './common/auth/firebase-auth.guard';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { AttemptsModule } from './modules/attempts/attempts.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { MediaModule } from './modules/media/media.module';
import { ContentModule } from './modules/content/content.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppConfigModule,
    PrismaModule,
    AuthModule,
    HealthModule,
    UsersModule,
    SubjectsModule,
    QuestionsModule,
    AttemptsModule,
    SessionsModule,
    MediaModule,
    ContentModule,
    AiModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
})
export class AppModule {}
