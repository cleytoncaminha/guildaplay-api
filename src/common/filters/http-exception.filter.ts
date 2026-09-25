import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

import type { RequestWithId } from "../utils/request-id.js";

type ExceptionResponse = {
  code?: string;
  message?: string | string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const requestId = request.requestId;
    const { statusCode, code, message } = this.toPublicError(exception);

    if (exception instanceof Error) {
      this.logger.error(
        `Request failed with ${statusCode}${requestId ? ` (requestId: ${requestId})` : ""}`,
        exception.stack,
      );
    } else {
      this.logger.error(`Request failed with ${statusCode}`);
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      ...(requestId ? { requestId } : {}),
    });
  }

  private toPublicError(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
  } {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: "INTERNAL_ERROR",
        message: "Ocorreu um erro interno.",
      };
    }

    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const payload =
      typeof exceptionResponse === "string"
        ? { message: exceptionResponse }
        : (exceptionResponse as ExceptionResponse);
    const isValidationError = statusCode === Number(HttpStatus.BAD_REQUEST);
    const isRateLimited = statusCode === Number(HttpStatus.TOO_MANY_REQUESTS);

    return {
      statusCode,
      code: payload.code ?? this.codeForStatus(statusCode),
      message:
        isValidationError || Array.isArray(payload.message)
          ? "Dados inválidos."
          : isRateLimited
            ? "Muitas solicitações. Tente novamente mais tarde."
            : (payload.message ?? "Não foi possível concluir a solicitação."),
    };
  }

  private codeForStatus(statusCode: number): string {
    const codes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: "VALIDATION_ERROR",
      [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
      [HttpStatus.FORBIDDEN]: "FORBIDDEN",
      [HttpStatus.NOT_FOUND]: "NOT_FOUND",
      [HttpStatus.CONFLICT]: "CONFLICT",
      [HttpStatus.TOO_MANY_REQUESTS]: "RATE_LIMITED",
    };

    return codes[statusCode] ?? "INTERNAL_ERROR";
  }
}
