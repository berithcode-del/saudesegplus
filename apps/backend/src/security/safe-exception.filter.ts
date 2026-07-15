import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SafeExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isHttpException = exception && typeof (exception as any).getStatus === 'function';
    const status = isHttpException
      ? (exception as any).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      const error = exception instanceof Error ? exception : undefined;
      this.logger.error(
        `${request.method} ${request.path} failed: ${error?.message ?? String(exception)}`,
        error?.stack,
      );
    }

    const publicResponse = isHttpException
      ? (exception as any).getResponse()
      : { message: 'Erro interno. Tente novamente mais tarde.' };

    response.status(status).json({
      statusCode: status,
      ...(typeof publicResponse === 'string'
        ? { message: publicResponse }
        : publicResponse as Record<string, unknown>),
      timestamp: new Date().toISOString(),
      path: request.path,
    });
  }
}
