import { Body, Controller, Param, Post, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  StartPracticeSessionInputSchema,
  type StartPracticeSessionInput,
} from '@matura/shared';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { User } from '@matura/db';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@ApiBearerAuth('firebase')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Post('practice')
  @ApiOkResponse({
    description: 'Start a practice session and receive a randomised set of published questions.',
  })
  @UsePipes(new ZodValidationPipe(StartPracticeSessionInputSchema))
  startPractice(@CurrentUser() user: User, @Body() input: StartPracticeSessionInput) {
    return this.service.startPractice(user.id, input);
  }

  @Post(':id/end')
  @ApiOkResponse({ description: 'End a session and compute its summary.' })
  end(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.end(user.id, id);
  }
}
