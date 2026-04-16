import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentKind, PaymentMethod, PaymentStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MonetizationService } from '../../monetization/monetization.service';

/**
 * CLICK Shop API (prepare / complete) — https://docs.click.uz/en/click-api-request/
 * sign_string: md5(concat fields + SECRET_KEY)
 */
@Injectable()
export class ClickShopService {
  private readonly logger = new Logger(ClickShopService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly monetization: MonetizationService,
  ) {}

  private secret(): string {
    const s = this.config.get<string>('CLICK_SECRET_KEY') || this.config.get<string>('CLICK_MERCHANT_SECRET');
    if (!s) {
      throw new Error('CLICK_SECRET_KEY sozlanmagan');
    }
    return s;
  }

  private expectedServiceId(): string {
    const id = this.config.get<string>('CLICK_SERVICE_ID');
    if (!id) throw new Error('CLICK_SERVICE_ID sozlanmagan');
    return id;
  }

  /** CLICK amount ba'zan `50000` yoki `50000.0` — bazadagi butun UZS bilan solishtiramiz */
  private amountMatchesUzs(paymentAmount: number, incoming: string): boolean {
    const n = Number(String(incoming).trim().replace(',', '.'));
    if (!Number.isFinite(n)) return false;
    if (Math.round(n) === paymentAmount) return true;
    return Math.abs(n - paymentAmount) < 0.01;
  }

  parseMerchantTransId(raw: string): number | null {
    const s = String(raw || '').trim();
    if (!s) return null;
    if (s.startsWith('mp-')) {
      const n = parseInt(s.slice(3), 10);
      return Number.isFinite(n) ? n : null;
    }
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }

  private md5Prepare(body: Record<string, string>): string {
    const click_trans_id = String(body.click_trans_id ?? '');
    const service_id = String(body.service_id ?? '');
    const merchant_trans_id = String(body.merchant_trans_id ?? '');
    const amount = String(body.amount ?? '');
    const action = String(body.action ?? '');
    const sign_time = String(body.sign_time ?? '');
    const raw = `${click_trans_id}${service_id}${this.secret()}${merchant_trans_id}${amount}${action}${sign_time}`;
    return createHash('md5').update(raw, 'utf8').digest('hex');
  }

  private md5Complete(body: Record<string, string>): string {
    const click_trans_id = String(body.click_trans_id ?? '');
    const service_id = String(body.service_id ?? '');
    const merchant_trans_id = String(body.merchant_trans_id ?? '');
    const merchant_prepare_id = String(body.merchant_prepare_id ?? '');
    const amount = String(body.amount ?? '');
    const action = String(body.action ?? '');
    const sign_time = String(body.sign_time ?? '');
    const raw = `${click_trans_id}${service_id}${this.secret()}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`;
    return createHash('md5').update(raw, 'utf8').digest('hex');
  }

  async handleShopRequest(body: Record<string, string>) {
    let expectedService: string;
    try {
      expectedService = this.expectedServiceId();
    } catch {
      this.logger.error('CLICK_SERVICE_ID sozlanmagan');
      return { error: -8, error_note: 'Merchant not configured' };
    }

    const action = parseInt(String(body.action ?? ''), 10);
    const sign_in = String(body.sign_string ?? '').toLowerCase();

    if (String(body.service_id ?? '') !== expectedService) {
      return this.prepareError(body, -5, 'service_id mos emas');
    }

    if (action === 0) {
      try {
        this.secret();
      } catch {
        return this.prepareError(body, -8, 'SECRET not configured');
      }
      const expected = this.md5Prepare(body);
      if (expected !== sign_in) {
        this.logger.warn('CLICK prepare: sign noto‘g‘ri');
        return this.prepareError(body, -1, 'SIGN CHECK FAILED');
      }
      return this.prepare(body);
    }

    if (action === 1) {
      try {
        this.secret();
      } catch {
        return this.completeError(body, -8, 'SECRET not configured');
      }
      const expected = this.md5Complete(body);
      if (expected !== sign_in) {
        this.logger.warn('CLICK complete: sign noto‘g‘ri');
        return this.completeError(body, -1, 'SIGN CHECK FAILED');
      }
      return this.complete(body);
    }

    return { error: -3, error_note: 'Unknown action' };
  }

  private prepareError(body: Record<string, string>, code: number, note: string) {
    return {
      click_trans_id: Number(body.click_trans_id) || 0,
      merchant_trans_id: String(body.merchant_trans_id ?? ''),
      error: code,
      error_note: note,
    };
  }

  private completeError(body: Record<string, string>, code: number, note: string) {
    return {
      click_trans_id: Number(body.click_trans_id) || 0,
      merchant_trans_id: String(body.merchant_trans_id ?? ''),
      merchant_confirm_id: 0,
      error: code,
      error_note: note,
    };
  }

  private async prepare(body: Record<string, string>) {
    const merchant_trans_id = String(body.merchant_trans_id ?? '');
    const paymentId = this.parseMerchantTransId(merchant_trans_id);

    if (paymentId == null) {
      return this.prepareError(body, -5, 'transaction_param noto‘g‘ri');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.kind !== PaymentKind.MOBILE_PREMIUM) {
      return this.prepareError(body, -5, 'Buyurtma topilmadi');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return this.prepareError(body, -4, 'Allaqachon to‘langan');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return this.prepareError(body, -5, 'Buyurtma holati yaroqsiz');
    }

    if (!this.amountMatchesUzs(payment.amount, String(body.amount ?? ''))) {
      return this.prepareError(body, -2, 'Summa mos emas');
    }

    return {
      click_trans_id: Number(body.click_trans_id) || 0,
      merchant_trans_id,
      merchant_prepare_id: payment.id,
      error: 0,
      error_note: 'OK',
    };
  }

  private async complete(body: Record<string, string>) {
    const merchant_trans_id = String(body.merchant_trans_id ?? '');
    const merchant_prepare_id = parseInt(String(body.merchant_prepare_id ?? ''), 10);
    const clickError = parseInt(String(body.error ?? '0'), 10);

    const paymentId = this.parseMerchantTransId(merchant_trans_id);
    if (paymentId == null || merchant_prepare_id !== paymentId) {
      return this.completeError(body, -5, 'prepare_id mos emas');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.kind !== PaymentKind.MOBILE_PREMIUM) {
      return this.completeError(body, -5, 'Buyurtma topilmadi');
    }

    if (!this.amountMatchesUzs(payment.amount, String(body.amount ?? ''))) {
      return this.completeError(body, -2, 'Summa mos emas');
    }

    if (clickError === 0) {
      try {
        const result = await this.monetization.applySuccessfulMobilePremiumPayment(payment.id, {
          provider: 'CLICK',
          providerPaymentId: String(body.click_paydoc_id ?? body.click_trans_id ?? ''),
          method: PaymentMethod.CLICK,
        });
        if (result && 'alreadyCompleted' in result && result.alreadyCompleted) {
          this.logger.log(`CLICK complete idempotent payment_id=${payment.id}`);
        } else {
          this.logger.log(`CLICK complete success payment_id=${payment.id}`);
        }
      } catch (e) {
        this.logger.error(`CLICK complete apply xato payment ${payment.id}`, e);
        return this.completeError(body, -9, 'Billing xato');
      }
      return {
        click_trans_id: Number(body.click_trans_id) || 0,
        merchant_trans_id,
        merchant_confirm_id: payment.id,
        error: 0,
        error_note: 'OK',
      };
    }

    await this.monetization.failMobilePremiumPayment(
      payment.id,
      `click_error_${clickError}`,
    );

    return {
      click_trans_id: Number(body.click_trans_id) || 0,
      merchant_trans_id,
      merchant_confirm_id: payment.id,
      error: 0,
      error_note: 'OK',
    };
  }
}
