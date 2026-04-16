import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library';
import { ApiResponse } from '@ruhiyat/types';

const isProd = () => process.env.NODE_ENV === 'production';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let userMessage = "So‘rov bajarilmadi. Keyinroq qayta urinib ko‘ring.";
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        userMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        const msg = resp.message;
        if (typeof msg === 'string') userMessage = msg;
        else if (Array.isArray(msg) && msg.length) userMessage = String(msg[0]);
        const ec = resp.error;
        if (typeof ec === 'string' && ec.length < 80) errorCode = ec;
        const c = resp.code;
        if (typeof c === 'string' && c.length) errorCode = c;
      }
    } else if (exception instanceof PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      errorCode = 'DATABASE_UNAVAILABLE';
      userMessage = isProd()
        ? 'Xizmat vaqtincha mavjud emas. Keyinroq urinib ko‘ring.'
        : "PostgreSQL ishlamayapti yoki DATABASE_URL noto‘g‘ri.";
      this.logger.error(`Prisma init: ${exception.message}`);
    } else if (exception instanceof PrismaClientKnownRequestError) {
      this.logger.error(
        `Prisma ${exception.code} on ${request.method} ${request.url}: ${exception.message}`,
      );
      status = HttpStatus.BAD_REQUEST;
      errorCode = `PRISMA_${exception.code}`;
      userMessage = isProd()
        ? "Ma'lumotlarni saqlab bo'lmadi. Kiritilgan ma'lumotlarni tekshiring."
        : `Ma'lumotlar bazasi xatosi (${exception.code})`;
    } else {
      this.logger.error(
        `Critical: ${request.method} ${request.url} — ${exception instanceof Error ? exception.stack : exception}`,
      );
      userMessage = isProd()
        ? "Ichki server xatosi. Texnik xizmat xabardor qilindi."
        : (exception instanceof Error ? exception.message : 'Ichki server xatosi');
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      message: userMessage,
      error: userMessage,
      code: errorCode,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (!isProd() && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
