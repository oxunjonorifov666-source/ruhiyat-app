import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get('community/posts')
  findAllPosts() { return this.service.findAllPosts(); }

  @Post('community/posts')
  @UseGuards(JwtAuthGuard)
  createPost(@Body() data: any) { return this.service.createPost(data); }

  @Get('community/posts/:id')
  findPost(@Param('id', ParseIntPipe) id: number) { return this.service.findPost(id); }

  @Patch('community/posts/:id')
  @UseGuards(JwtAuthGuard)
  updatePost(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updatePost(id, data); }

  @Delete('community/posts/:id')
  @UseGuards(JwtAuthGuard)
  removePost(@Param('id', ParseIntPipe) id: number) { return this.service.removePost(id); }

  @Get('community/posts/:id/comments')
  getComments(@Param('id', ParseIntPipe) id: number) { return this.service.getComments(id); }

  @Post('community/posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.addComment(id, data); }

  @Post('complaints')
  @UseGuards(JwtAuthGuard)
  createComplaint(@Body() data: any) { return this.service.createComplaint(data); }

  @Get('complaints')
  @UseGuards(JwtAuthGuard)
  findAllComplaints() { return this.service.findAllComplaints(); }

  @Patch('complaints/:id')
  @UseGuards(JwtAuthGuard)
  updateComplaint(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateComplaint(id, data); }

  @Get('moderation/actions')
  @UseGuards(JwtAuthGuard)
  findAllModerationActions() { return this.service.findAllModerationActions(); }

  @Post('moderation/actions')
  @UseGuards(JwtAuthGuard)
  createModerationAction(@Body() data: any) { return this.service.createModerationAction(data); }
}
