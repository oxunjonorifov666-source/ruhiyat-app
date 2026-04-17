import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * SMS (Eskiz.uz / Twilio) va SMTP orqali haqiqiy yetkazish.
 * Production: SMS uchun ESKIZ_* yoki TWILIO_*; email uchun SMTP_* (majburiy kanalga qarab).
 */
@Injectable()
export class DeliveryService implements OnModuleInit {
  private readonly logger = new Logger(DeliveryService.name);
  private eskizBearer: { token: string; exp: number } | null = null;
  private mailer: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  /** Ishga tushganda production muhitda yetkazib berish sozlamalarini tekshiradi (xatolikni oldindan loglaydi). */
  onModuleInit(): void {
    if (!this.isProd()) return;
    const sms = (this.config.get<string>('SMS_PROVIDER') || 'eskiz').toLowerCase();
    if (sms === 'eskiz') {
      const ok = !!(this.config.get<string>('ESKIZ_EMAIL') && this.config.get<string>('ESKIZ_PASSWORD'));
      if (!ok) {
        this.logger.error(
          'PRODUCTION: SMS_PROVIDER=eskiz lekin ESKIZ_EMAIL / ESKIZ_PASSWORD to‘ldirilmagan — SMS OTP ishlamaydi.',
        );
      }
    }
    if (sms === 'twilio') {
      const ok = !!(
        this.config.get<string>('TWILIO_ACCOUNT_SID') &&
        this.config.get<string>('TWILIO_AUTH_TOKEN') &&
        this.config.get<string>('TWILIO_FROM_NUMBER')
      );
      if (!ok) {
        this.logger.error('PRODUCTION: Twilio o‘zgaruvchilari to‘liq emas — SMS ishlamaydi.');
      }
    }
    const smtpOk = !!(
      this.config.get<string>('SMTP_HOST') &&
      this.config.get<string>('SMTP_USER') &&
      this.config.get<string>('SMTP_PASS')
    );
    if (!smtpOk) {
      this.logger.warn(
        'PRODUCTION: SMTP_HOST / SMTP_USER / SMTP_PASS to‘liq emas — email OTP va parol tiklash email ishlamaydi.',
      );
    }
  }

  private isProd() {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  private devLogOtp(channel: string, to: string, body: string) {
    if (this.isProd()) return;
    if (this.config.get<string>('AUTH_DEV_LOG_OTP') === 'true') {
      this.logger.warn(`[DEV OTP ${channel}] ${to} → ${body}`);
    }
  }

  private getMailer(): nodemailer.Transporter {
    if (this.mailer) return this.mailer;
    const host = this.config.get<string>('SMTP_HOST');
    const port = parseInt(this.config.get<string>('SMTP_PORT') || '587', 10);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (!host || !user || !pass) {
      throw new ServiceUnavailableException('SMTP sozlanmagan (SMTP_HOST, SMTP_USER, SMTP_PASS)');
    }
    this.mailer = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return this.mailer;
  }

  async sendPasswordResetSms(phone: string, code: string): Promise<void> {
    const msg = `Ruhiyat: parolni tiklash kodi ${code}. Kod 15 daqiqa amal qiladi. Hech kimga bermang.`;
    const provider = (this.config.get<string>('SMS_PROVIDER') || 'eskiz').toLowerCase();

    if (provider === 'none') {
      this.devLogOtp('SMS', phone, msg);
      if (this.isProd()) {
        throw new ServiceUnavailableException('SMS_PROVIDER=none productionda ruxsat etilmaydi');
      }
      return;
    }

    if (provider === 'eskiz') {
      await this.sendEskizSms(phone, msg);
      return;
    }

    if (provider === 'twilio') {
      await this.sendTwilioSms(phone, msg);
      return;
    }

    throw new ServiceUnavailableException(`Noma’lum SMS_PROVIDER: ${provider}`);
  }

  async sendOtpEmail(to: string, code: string, purpose: string): Promise<void> {
    const subject = `Ruhiyat — tasdiqlash kodi (${purpose})`;
    const html = `<p>Kodingiz: <b>${code}</b></p><p>5 daqiqa amal qiladi.</p>`;
    const from = this.config.get<string>('SMTP_FROM') || this.config.get<string>('SMTP_USER');
    if (!from) throw new ServiceUnavailableException('SMTP sozlanmagan');
    try {
      const transporter = this.getMailer();
      await transporter.sendMail({ from, to, subject, html });
    } catch (e: unknown) {
      this.logger.error(`SMTP (OTP email) xato: ${e instanceof Error ? e.message : e}`);
      throw new ServiceUnavailableException('Email yuborib bo‘lmadi');
    }
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    const subject = 'Ruhiyat — parolni tiklash';
    const html = `<p>Sizning tasdiqlash kodingiz: <b>${code}</b></p><p>Kod 15 daqiqa amal qiladi.</p>`;
    const from = this.config.get<string>('SMTP_FROM') || this.config.get<string>('SMTP_USER');
    if (!from) {
      throw new ServiceUnavailableException('SMTP_FROM yoki SMTP_USER kerak');
    }
    try {
      const transporter = this.getMailer();
      await transporter.sendMail({ from, to, subject, html });
    } catch (e: unknown) {
      this.logger.error(`SMTP xato: ${e instanceof Error ? e.message : e}`);
      throw new ServiceUnavailableException('Email yuborib bo‘lmadi');
    }
  }

  /** Umumiy OTP (login va boshqalar) */
  async sendOtpSms(phone: string, code: string, purpose: string): Promise<void> {
    const msg = `Ruhiyat (${purpose}): kod ${code}. 5 daqiqa amal qiladi.`;
    const provider = (this.config.get<string>('SMS_PROVIDER') || 'eskiz').toLowerCase();
    if (provider === 'none') {
      this.devLogOtp('SMS', phone, msg);
      if (this.isProd()) throw new ServiceUnavailableException('SMS sozlanmagan');
      return;
    }
    if (provider === 'eskiz') await this.sendEskizSms(phone, msg);
    else if (provider === 'twilio') await this.sendTwilioSms(phone, msg);
    else throw new ServiceUnavailableException(`Noma’lum SMS_PROVIDER: ${provider}`);
  }

  private normalizeUzPhone(phone: string): string {
    const p = phone.replace(/\s/g, '');
    if (p.startsWith('+')) return p.replace('+', '');
    return p;
  }

  /** Logda to‘liq raqam chiqarmaslik */
  private redactPhoneForLog(phone: string): string {
    const d = phone.replace(/\D/g, '');
    if (d.length < 6) return '***';
    return `${d.slice(0, 5)}***${d.slice(-2)}`;
  }

  /**
   * Eskiz JSON javobi provayder versiyasiga qarab farq qiladi.
   * HTTP 200 bo‘lsa ham mantiqiy xato bo‘lishi mumkin — buni server xato deb qabul qilamiz.
   */
  private isEskizSmsAccepted(j: Record<string, unknown>): boolean {
    if (j.error != null && j.error !== false && String(j.error).length > 0) return false;
    if (j.success === false) return false;
    const st = j.status;
    if (typeof st === 'string' && ['error', 'failed', 'fail'].includes(st.toLowerCase())) return false;
    if (typeof j.id === 'string' && j.id.length > 4) return true;
    if (st === 'success' || st === 'waiting') return true;
    if (typeof j.message === 'string') {
      const m = j.message.toLowerCase();
      if (m.includes('error') || m.includes('invalid') || m.includes('not enough') || m.includes('balance')) return false;
      if (m.includes('waiting') || m.includes('success') || m.includes('queued')) return true;
    }
    return false;
  }

  private async getEskizBearerToken(): Promise<string> {
    if (this.eskizBearer && Date.now() < this.eskizBearer.exp - 30_000) {
      return this.eskizBearer.token;
    }
    const email = this.config.get<string>('ESKIZ_EMAIL');
    const password = this.config.get<string>('ESKIZ_PASSWORD');
    if (!email || !password) {
      throw new ServiceUnavailableException('Eskiz: ESKIZ_EMAIL va ESKIZ_PASSWORD kerak');
    }
    const res = await fetch('https://notify.eskiz.uz/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const j = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      this.logger.error(`Eskiz auth HTTP ${res.status}: ${JSON.stringify(j)}`);
      throw new ServiceUnavailableException('Eskiz autentifikatsiyasi muvaffaqiyatsiz');
    }
    const data = j?.data as Record<string, unknown> | undefined;
    const token =
      (typeof data?.token === 'string' && data.token) ||
      (typeof j?.token === 'string' && j.token) ||
      (typeof j?.message === 'string' && j.message?.length > 20 ? j.message : null);
    if (!token || typeof token !== 'string') {
      this.logger.error(`Eskiz auth javob: ${JSON.stringify(j)}`);
      throw new ServiceUnavailableException('Eskiz autentifikatsiyasi muvaffaqiyatsiz');
    }
    this.eskizBearer = { token, exp: Date.now() + 24 * 60 * 60 * 1000 };
    return token;
  }

  private async sendEskizSms(phone: string, message: string): Promise<void> {
    const token = await this.getEskizBearerToken();
    const mobile = this.normalizeUzPhone(phone);
    const from = this.config.get<string>('ESKIZ_SMS_FROM') || '4546';
    this.logger.log(
      `Eskiz SMS yuborilmoqda: to=${this.redactPhoneForLog(mobile)} from=${from} len=${message.length}`,
    );
    const res = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mobile_phone: mobile,
        message,
        from,
      }),
    });
    const rawText = await res.text();
    let j: Record<string, unknown>;
    try {
      j = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      this.logger.error(
        `Eskiz SMS JSON emas: HTTP ${res.status} to=${this.redactPhoneForLog(mobile)} body=${rawText.slice(0, 500)}`,
      );
      throw new ServiceUnavailableException('SMS yuborib bo‘lmadi');
    }
    if (!res.ok) {
      this.logger.error(
        `Eskiz SMS HTTP ${res.status} to=${this.redactPhoneForLog(mobile)}: ${JSON.stringify(j)}`,
      );
      throw new ServiceUnavailableException('SMS yuborib bo‘lmadi');
    }
    if (!this.isEskizSmsAccepted(j)) {
      this.logger.error(
        `Eskiz SMS provayder rad etdi yoki javob noaniq: to=${this.redactPhoneForLog(mobile)} body=${JSON.stringify(j)}`,
      );
      throw new ServiceUnavailableException('SMS yuborib bo‘lmadi');
    }
    this.logger.log(
      `Eskiz SMS qabul qilindi: to=${this.redactPhoneForLog(mobile)} id=${typeof j.id === 'string' ? j.id : String(j.status ?? '')}`,
    );
  }

  private async sendTwilioSms(phone: string, message: string): Promise<void> {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const auth = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_FROM_NUMBER');
    if (!sid || !auth || !from) {
      throw new ServiceUnavailableException('Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER');
    }
    const authHeader = Buffer.from(`${sid}:${auth}`).toString('base64');
    const body = new URLSearchParams({ To: phone, From: from, Body: message });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      const t = await res.text();
      this.logger.error(`Twilio xato: ${t}`);
      throw new ServiceUnavailableException('SMS yuborib bo‘lmadi');
    }
  }
}
