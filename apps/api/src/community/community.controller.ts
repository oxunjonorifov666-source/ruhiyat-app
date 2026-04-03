import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'ADMINISTRATOR')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'ADMINISTRATOR')
  findAllComplaints(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAllComplaints({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
    });
  }

  @Patch('complaints/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'ADMINISTRATOR')
  updateComplaint(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateComplaint(id, data); }

  @Get('moderation/actions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'ADMINISTRATOR')
  findAllModerationActions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAllModerationActions({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('moderation/actions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'ADMINISTRATOR')
  createModerationAction(@Body() data: any) { return this.service.createModerationAction(data); }
}
