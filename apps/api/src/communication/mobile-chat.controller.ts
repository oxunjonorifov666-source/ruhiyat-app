import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CommunicationService } from './communication.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import type { Request } from 'express';

@Controller('mobile')
@UseGuards(JwtAuthGuard)
export class MobileChatController {
  constructor(private readonly service: CommunicationService) {}

  @Get('contacts/search')
  searchContacts(@CurrentUser() user: any, @Query('q') q?: string) {
    return this.service.searchChatContacts(user.id, q ?? '');
  }

  @Get('chats')
  findMyChats(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findMyChats(user.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Get('chats/:id/messages')
  getMyChatMessages(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMyChatMessages(user.id, id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('chats/:id/messages')
  sendMyMessage(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.service.sendMyMessage(user.id, id, data);
  }

  @Post('chats/:id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      storage: diskStorage({
        destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
          const dir = join(process.cwd(), 'uploads', 'chat');
          try {
            mkdirSync(dir, { recursive: true });
            cb(null, dir);
          } catch (e) {
            cb(e as any, dir);
          }
        },
        filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const safeExt = extname(file.originalname || '').slice(0, 10) || '';
          const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
          cb(null, name);
        },
      }),
      fileFilter: (req: Request, file: Express.Multer.File, cb: (error: any, acceptFile: boolean) => void) => {
        // Allow common safe types. Expand later if needed.
        const allowed = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'text/plain',
        ];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new ForbiddenException('Fayl turi ruxsat etilmagan') as any, false);
      },
    }),
  )
  async uploadAttachment(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new ForbiddenException('Fayl topilmadi');
    const url = await this.service.saveChatAttachment(user.id, id, file);
    return { url };
  }

  @Post('chats/direct')
  createDirectChat(@CurrentUser() user: any, @Body() data: { otherUserId: number }) {
    if (data?.otherUserId == null || Number.isNaN(Number(data.otherUserId))) {
      throw new BadRequestException('otherUserId kerak');
    }
    return this.service.createOrGetDirectChat(user.id, Number(data.otherUserId));
  }

  @Post('chats/direct-by-email')
  createDirectChatByEmail(@CurrentUser() user: any, @Body() body: { email?: string }) {
    return this.service.createDirectChatByEmail(user.id, body?.email ?? '');
  }

  @Post('chats/support')
  ensureSupportChat(@CurrentUser() user: any) {
    return this.service.ensureSupportChatForMobileUser(user.id);
  }

  @Post('chats/group')
  createGroupChat(
    @CurrentUser() user: any,
    @Body() data: { title: string; participantIds: number[] },
  ) {
    return this.service.createGroupChat(user.id, data);
  }
}

