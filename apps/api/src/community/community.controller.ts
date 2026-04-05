import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller()
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get('community/posts')
  findAllPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAllPosts({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Post('community/posts')
  @UseGuards(JwtAuthGuard)
  createPost(@Body() data: any) { return this.service.createPost(data); }

  @Get('community/posts/:id')
  findPost(@Param('id', ParseIntPipe) id: number) { return this.service.findPost(id); }

  @Patch('community/posts/:id')
  @UseGuards(JwtAuthGuard)
  updatePost(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updatePost(id, data); }

  @Delete('community/posts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('community.moderate')
  removePost(@Param('id', ParseIntPipe) id: number) { return this.service.removePost(id); }

  @Get('community/posts/:id/comments')
  getComments(@Param('id', ParseIntPipe) id: number) { return this.service.getComments(id); }

  @Post('community/posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.addComment(id, data); }

}
