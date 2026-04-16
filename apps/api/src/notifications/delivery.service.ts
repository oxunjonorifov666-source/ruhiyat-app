import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * SMS (Eskiz.uz / Twilio) va SMTP orqali haqiqiy yetkazish.
 * Production: ESKIZ_* yoki SMTP_* majburiy (SMS yoki email yo‘li).
 */
@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
  private eskizBearer: { token: string; exp: number } | null = null;
  private mailer: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

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
    const transporter = this.getMailer();
    await transporter.sendMail({ from, to, subject, html });
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
    const j = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      this.logger.error(`Eskiz SMS xato: ${JSON.stringify(j)}`);
      throw new ServiceUnavailableException('SMS yuborib bo‘lmadi');
    }
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
