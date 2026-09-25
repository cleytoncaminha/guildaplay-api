import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";

import {
  ensureRequestId,
  type RequestIdResponse,
  type RequestWithId,
} from "../utils/request-id.js";

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<RequestIdResponse>();

    ensureRequestId(request, response);

    return next.handle();
  }
}
