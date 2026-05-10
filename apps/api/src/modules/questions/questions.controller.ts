import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  CreateQuestionInputSchema,
  ListQuestionsQuerySchema,
  UpdateQuestionInputSchema,
  QuestionStatusSchema,
  type CreateQuestionInput,
  type ListQuestionsQuery,
  type UpdateQuestionInput,
} from '@matura/shared';
import { z } from 'zod';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Public } from '../../common/auth/public.decorator';
import { QuestionsService } from './questions.service';
import type { User } from '@matura/db';

const SetStatusBody = z.object({ status: QuestionStatusSchema });

@ApiTags('questions')
@ApiBearerAuth('firebase')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @Get()
  @Public()
  @ApiOkResponse({ description: 'List questions with filters and cursor pagination.' })
  @UsePipes(new ZodValidationPipe(ListQuestionsQuerySchema))
  list(@Query() query: ListQuestionsQuery) {
    return this.service.list(query);
  }

  @Get(':id')
  @Public()
  @ApiOkResponse({ description: 'Get a single question with options and images.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @Roles('OWNER')
  @UseGuards(RolesGuard)
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateQuestionInputSchema)) input: CreateQuestionInput,
  ) {
    return this.service.create(user.id, input);
  }

  @Patch(':id')
  @Roles('OWNER')
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateQuestionInputSchema)) input: UpdateQuestionInput) {
    return this.service.update(id, input);
  }

  @Post(':id/status')
  @Roles('OWNER')
  @UseGuards(RolesGuard)
  @HttpCode(200)
  setStatus(@Param('id') id: string, @Body(new ZodValidationPipe(SetStatusBody)) body: z.infer<typeof SetStatusBody>) {
    return this.service.setStatus(id, body.status);
  }

  @Delete(':id')
  @Roles('OWNER')
  @UseGuards(RolesGuard)
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(id);
  }
}
