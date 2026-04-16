import { Module } from '@nestjs/common';
import { ClickShopController } from './click-shop.controller';
import { ClickShopService } from './click-shop.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MonetizationModule } from '../../monetization/monetization.module';

@Module({
  imports: [PrismaModule, MonetizationModule],
  controllers: [ClickShopController],
  providers: [ClickShopService],
})
export class ClickModule {}
