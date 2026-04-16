import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller()
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get('articles')
  findAllArticles(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('published') published?: string,
    @Query('category') category?: string,
  ) {
    return this.service.findAllArticles({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      publishedOnly: published === 'true',
      category,
    });
  }
  @Get('articles/:id')
  findArticle(@Param('id', ParseIntPipe) id: number) { return this.service.findArticle(id); }
  @Post('articles')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  createArticle(@Body() data: any) { return this.service.createArticle(data); }
  @Patch('articles/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  updateArticle(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateArticle(id, data); }
  @Delete('articles/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.delete')
  removeArticle(@Param('id', ParseIntPipe) id: number) { return this.service.removeArticle(id); }

  @Get('banners')
  findAllBanners(@Query('activeOnly') activeOnly?: string) {
    return this.service.findAllBanners({ activeOnly: activeOnly === 'true' });
  }
  @Post('banners')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  createBanner(@Body() data: any) { return this.service.createBanner(data); }
  @Patch('banners/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  updateBanner(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateBanner(id, data); }
  @Delete('banners/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.delete')
  removeBanner(@Param('id', ParseIntPipe) id: number) { return this.service.removeBanner(id); }

  @Get('audio')
  findAllAudio(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('published') published?: string,
  ) {
    return this.service.findAllAudio({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      publishedOnly: published === 'true',
    });
  }
  @Get('audio/:id')
  findAudio(@Param('id', ParseIntPipe) id: number) { return this.service.findAudio(id); }
  @Post('audio')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  createAudio(@Body() data: any) { return this.service.createAudio(data); }
  @Patch('audio/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  updateAudio(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateAudio(id, data); }
  @Delete('audio/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.delete')
  removeAudio(@Param('id', ParseIntPipe) id: number) { return this.service.removeAudio(id); }

  @Get('videos')
  findAllVideos(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('published') published?: string,
  ) {
    return this.service.findAllVideos({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      publishedOnly: published === 'true',
    });
  }
  @Get('videos/:id')
  findVideo(@Param('id', ParseIntPipe) id: number) { return this.service.findVideo(id); }
  @Post('videos')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  createVideo(@Body() data: any) { return this.service.createVideo(data); }
  @Patch('videos/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  updateVideo(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateVideo(id, data); }
  @Delete('videos/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.delete')
  removeVideo(@Param('id', ParseIntPipe) id: number) { return this.service.removeVideo(id); }

  @Get('affirmations')
  findAllAffirmations() { return this.service.findAllAffirmations(); }
  @Post('affirmations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  createAffirmation(@Body() data: any) { return this.service.createAffirmation(data); }
  @Patch('affirmations/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  updateAffirmation(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateAffirmation(id, data); }
  @Delete('affirmations/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.delete')
  removeAffirmation(@Param('id', ParseIntPipe) id: number) { return this.service.removeAffirmation(id); }

  @Get('projective-methods')
  findAllProjectiveMethods() { return this.service.findAllProjectiveMethods(); }
  @Get('projective-methods/:id')
  findProjectiveMethod(@Param('id', ParseIntPipe) id: number) { return this.service.findProjectiveMethod(id); }
  @Post('projective-methods')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  createProjectiveMethod(@Body() data: any) { return this.service.createProjectiveMethod(data); }
  @Patch('projective-methods/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  updateProjectiveMethod(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateProjectiveMethod(id, data); }
  @Delete('projective-methods/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.delete')
  removeProjectiveMethod(@Param('id', ParseIntPipe) id: number) { return this.service.removeProjectiveMethod(id); }

  @Get('trainings')
  findAllTrainings(@Query('published') published?: string) {
    return this.service.findAllTrainings({ publishedOnly: published === 'true' });
  }
  @Get('trainings/:id')
  findTraining(@Param('id', ParseIntPipe) id: number) { return this.service.findTraining(id); }
  @Post('trainings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  createTraining(@Body() data: any) { return this.service.createTraining(data); }
  @Patch('trainings/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.write')
  updateTraining(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateTraining(id, data); }
  @Delete('trainings/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.delete')
  removeTraining(@Param('id', ParseIntPipe) id: number) { return this.service.removeTraining(id); }
}
