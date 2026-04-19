import { Controller, Get, Query } from '@nestjs/common';
import { LegalService } from './legal.service';

/**
 * Unauthenticated bundle for mobile splash / legal screens (rate-limit via global throttler).
 */
@Controller('public')
export class PublicLegalController {
  constructor(private readonly legal: LegalService) {}

  @Get('legal-bundle')
  legalBundle(@Query('region') region?: string) {
    return this.legal.getPublicLegalBundle(region);
  }
}
