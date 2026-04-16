import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { ClickShopService } from './click-shop.service';

/**
 * CLICK Shop prepare (action=0) va complete (action=1).
 * Dashboardda URL: POST https://HOST/api/integrations/click/shop
 */
@Controller('integrations/click')
@SkipThrottle()
export class ClickShopController {
  constructor(private readonly clickShop: ClickShopService) {}

  @Post('shop')
  @HttpCode(HttpStatus.OK)
  async shop(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const flat = this.flattenBody(req, body);
    return this.clickShop.handleShopRequest(flat);
  }

  /** JSON yoki application/x-www-form-urlencoded */
  private flattenBody(req: Request, body: Record<string, unknown>): Record<string, string> {
    const src = body && typeof body === 'object' ? body : {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(src)) {
      if (v === undefined || v === null) continue;
      out[k] = typeof v === 'string' ? v : String(v);
    }
    if (Object.keys(out).length === 0 && req.body && typeof req.body === 'object') {
      for (const [k, v] of Object.entries(req.body as Record<string, unknown>)) {
        if (v === undefined || v === null) continue;
        out[k] = typeof v === 'string' ? v : String(v);
      }
    }
    return out;
  }
}
