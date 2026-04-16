import { Module } from '@nestjs/common';
import { MonetizationController } from './monetization.controller';
import { MonetizationService } from './monetization.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MonetizationController],
  providers: [MonetizationService],
  exports: [MonetizationService],
})
export class MonetizationModule {}
