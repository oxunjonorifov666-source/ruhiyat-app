import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/** `OPENAI_API_KEY` yoki superadmin `mobile_app_settings.ai_dilosh_api_key` */
export async function resolveOpenAiApiKey(
  config: ConfigService,
  prisma: PrismaService,
): Promise<string | null> {
  const fromEnv = config.get<string>('OPENAI_API_KEY')?.trim();
  if (fromEnv) return fromEnv;
  const row = await prisma.mobileAppSetting.findUnique({ where: { key: 'ai_dilosh_api_key' } });
  return row?.value?.trim() || null;
}
