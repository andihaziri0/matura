import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { randomUUID } from 'node:crypto';
import {
  PresignImageUploadInputSchema,
  type PresignImageUploadInput,
  type PresignImageUploadResponse,
} from '@matura/shared';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { S3Service } from './s3.service';

@ApiTags('media')
@ApiBearerAuth('firebase')
@Controller('media')
export class MediaController {
  constructor(private readonly s3: S3Service) {}

  @Post('presign-image')
  @Roles('OWNER')
  @UseGuards(RolesGuard)
  @ApiOkResponse({ description: 'Issue a presigned PUT URL for a question image.' })
  @UsePipes(new ZodValidationPipe(PresignImageUploadInputSchema))
  async presignImage(@Body() input: PresignImageUploadInput): Promise<PresignImageUploadResponse> {
    const ext = guessExtension(input.contentType, input.filename);
    const key = `questions/${randomUUID()}${ext}`;
    const presigned = await this.s3.presignPut({
      key,
      contentType: input.contentType,
    });
    return {
      uploadUrl: presigned.uploadUrl,
      r2Key: key,
      publicUrl: presigned.publicUrl,
      expiresInSeconds: presigned.expiresInSeconds,
    };
  }
}

function guessExtension(contentType: string, filename: string): string {
  const m = filename.match(/(\.[a-zA-Z0-9]+)$/);
  if (m) return m[1].toLowerCase();
  if (contentType === 'image/png') return '.png';
  if (contentType === 'image/jpeg' || contentType === 'image/jpg') return '.jpg';
  if (contentType === 'image/webp') return '.webp';
  if (contentType === 'image/gif') return '.gif';
  return '.bin';
}
