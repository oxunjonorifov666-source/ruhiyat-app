import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get('articles')
  findAllArticles() { return this.service.findAllArticles(); }
  @Get('articles/:id')
  findArticle(@Param('id', ParseIntPipe) id: number) { return this.service.findArticle(id); }
  @Post('articles')
  @UseGuards(JwtAuthGuard)
  createArticle(@Body() data: any) { return this.service.createArticle(data); }
  @Patch('articles/:id')
  @UseGuards(JwtAuthGuard)
  updateArticle(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateArticle(id, data); }
  @Delete('articles/:id')
  @UseGuards(JwtAuthGuard)
  removeArticle(@Param('id', ParseIntPipe) id: number) { return this.service.removeArticle(id); }

  @Get('banners')
  findAllBanners() { return this.service.findAllBanners(); }
  @Post('banners')
  @UseGuards(JwtAuthGuard)
  createBanner(@Body() data: any) { return this.service.createBanner(data); }
  @Patch('banners/:id')
  @UseGuards(JwtAuthGuard)
  updateBanner(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateBanner(id, data); }
  @Delete('banners/:id')
  @UseGuards(JwtAuthGuard)
  removeBanner(@Param('id', ParseIntPipe) id: number) { return this.service.removeBanner(id); }

  @Get('audio')
  findAllAudio() { return this.service.findAllAudio(); }
  @Get('audio/:id')
  findAudio(@Param('id', ParseIntPipe) id: number) { return this.service.findAudio(id); }
  @Post('audio')
  @UseGuards(JwtAuthGuard)
  createAudio(@Body() data: any) { return this.service.createAudio(data); }
  @Patch('audio/:id')
  @UseGuards(JwtAuthGuard)
  updateAudio(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateAudio(id, data); }
  @Delete('audio/:id')
  @UseGuards(JwtAuthGuard)
  removeAudio(@Param('id', ParseIntPipe) id: number) { return this.service.removeAudio(id); }

  @Get('videos')
  findAllVideos() { return this.service.findAllVideos(); }
  @Get('videos/:id')
  findVideo(@Param('id', ParseIntPipe) id: number) { return this.service.findVideo(id); }
  @Post('videos')
  @UseGuards(JwtAuthGuard)
  createVideo(@Body() data: any) { return this.service.createVideo(data); }
  @Patch('videos/:id')
  @UseGuards(JwtAuthGuard)
  updateVideo(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateVideo(id, data); }
  @Delete('videos/:id')
  @UseGuards(JwtAuthGuard)
  removeVideo(@Param('id', ParseIntPipe) id: number) { return this.service.removeVideo(id); }

  @Get('affirmations')
  findAllAffirmations() { return this.service.findAllAffirmations(); }
  @Post('affirmations')
  @UseGuards(JwtAuthGuard)
  createAffirmation(@Body() data: any) { return this.service.createAffirmation(data); }
  @Patch('affirmations/:id')
  @UseGuards(JwtAuthGuard)
  updateAffirmation(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateAffirmation(id, data); }
  @Delete('affirmations/:id')
  @UseGuards(JwtAuthGuard)
  removeAffirmation(@Param('id', ParseIntPipe) id: number) { return this.service.removeAffirmation(id); }

  @Get('projective-methods')
  findAllProjectiveMethods() { return this.service.findAllProjectiveMethods(); }
  @Get('projective-methods/:id')
  findProjectiveMethod(@Param('id', ParseIntPipe) id: number) { return this.service.findProjectiveMethod(id); }
  @Post('projective-methods')
  @UseGuards(JwtAuthGuard)
  createProjectiveMethod(@Body() data: any) { return this.service.createProjectiveMethod(data); }
  @Patch('projective-methods/:id')
  @UseGuards(JwtAuthGuard)
  updateProjectiveMethod(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateProjectiveMethod(id, data); }
  @Delete('projective-methods/:id')
  @UseGuards(JwtAuthGuard)
  removeProjectiveMethod(@Param('id', ParseIntPipe) id: number) { return this.service.removeProjectiveMethod(id); }

  @Get('trainings')
  findAllTrainings() { return this.service.findAllTrainings(); }
  @Get('trainings/:id')
  findTraining(@Param('id', ParseIntPipe) id: number) { return this.service.findTraining(id); }
  @Post('trainings')
  @UseGuards(JwtAuthGuard)
  createTraining(@Body() data: any) { return this.service.createTraining(data); }
  @Patch('trainings/:id')
  @UseGuards(JwtAuthGuard)
  updateTraining(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateTraining(id, data); }
  @Delete('trainings/:id')
  @UseGuards(JwtAuthGuard)
  removeTraining(@Param('id', ParseIntPipe) id: number) { return this.service.removeTraining(id); }
}
