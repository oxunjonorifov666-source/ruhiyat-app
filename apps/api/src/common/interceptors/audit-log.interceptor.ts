import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

const WRITE_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!WRITE_METHODS.includes(method)) {
      return next.handle();
    }

    const userId = request.user?.userId || null;
    const action = this.getAction(method);
    const resource = this.getResource(request.url);
    const resourceId = this.extractResourceId(request.params);
    const ipAddress = request.ip || request.connection?.remoteAddress || null;
    const userAgent = request.headers?.['user-agent'] || null;

    return next.handle().pipe(
      tap({
        next: () => {
          this.prisma.auditLog.create({
            data: {
              userId,
              action,
              resource,
              resourceId,
              details: {
                method,
                path: request.url,
                body: this.sanitizeBody(request.body),
              },
              ipAddress,
              userAgent,
            },
          }).catch(() => {});
        },
        error: () => {},
      }),
    );
  }

  private getAction(method: string): string {
    switch (method) {
      case 'POST': return 'CREATE';
      case 'PATCH':
      case 'PUT': return 'UPDATE';
      case 'DELETE': return 'DELETE';
      default: return method;
    }
  }

  private getResource(url: string): string {
    const path = url.replace(/^\/api\//, '').split('?')[0];
    const parts = path.split('/');
    return parts.filter(p => !/^\d+$/.test(p)).join('/');
  }

  private extractResourceId(params: Record<string, any>): number | null {
    if (params?.id && !isNaN(Number(params.id))) {
      return Number(params.id);
    }
    return null;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'passwordHash', 'refreshToken', 'token', 'code', 'otp', 'secret'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
