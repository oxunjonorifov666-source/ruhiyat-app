import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get('community/posts')
  @UseGuards(JwtAuthGuard)
  findAllPosts(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isPublished') isPublished?: string,
    @Query('isFlagged') isFlagged?: string,
    @Query('authorId') authorId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.findAllPosts({
      requesterId: user.id,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      isPublished: isPublished === undefined ? undefined : isPublished === 'true',
      isFlagged: isFlagged === undefined ? undefined : isFlagged === 'true',
      authorId: authorId ? parseInt(authorId) : undefined,
      dateFrom,
      dateTo,
    });
  }

  @Post('community/posts')
  @UseGuards(JwtAuthGuard)
  createPost(@Body() data: any, @CurrentUser() user: any) { return this.service.createPost(user.id, data); }

  @Get('community/posts/:id')
  @UseGuards(JwtAuthGuard)
  findPost(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) { return this.service.findPost(user.id, id); }

  @Patch('community/posts/:id')
  @UseGuards(JwtAuthGuard)
  updatePost(@Param('id', ParseIntPipe) id: number, @Body() data: any, @CurrentUser() user: any) {
    return this.service.updatePost(user.id, user.role, id, data);
  }

  @Delete('community/posts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('community.moderate')
  removePost(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) { return this.service.removePost(user.userId, id); }

  @Get('community/posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  getComments(@Param('id', ParseIntPipe) id: number) { return this.service.getComments(id); }

  @Post('community/posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(@Param('id', ParseIntPipe) id: number, @Body() data: any, @CurrentUser() user: any) {
    return this.service.addComment(user.id, id, data);
  }

  @Post('community/posts/:id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.toggleLike(user.id, id);
  }

  @Post('community/posts/:id/report')
  @UseGuards(JwtAuthGuard)
  reportPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { reason: string; details?: string },
    @CurrentUser() user: any,
  ) {
    return this.service.reportPost(user.id, id, data);
  }

  @Get('community/posts/:id/reports')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('community.moderate')
  getPostReports(@Param('id', ParseIntPipe) id: number) {
    return this.service.getPostReports(id);
  }

}
