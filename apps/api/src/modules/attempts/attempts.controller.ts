import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { RecordAttemptInputSchema, type RecordAttemptInput } from '@matura/shared';
import type { User } from '@matura/db';
import { AttemptsService } from './attempts.service';

@ApiTags('attempts')
@ApiBearerAuth('firebase')
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly service: AttemptsService) {}

  @Post()
  @ApiOkResponse({ description: 'Record an attempt and return the evaluation + explanation.' })
  @UsePipes(new ZodValidationPipe(RecordAttemptInputSchema))
  record(@CurrentUser() user: User, @Body() input: RecordAttemptInput) {
    return this.service.record(user.id, input);
  }
}
