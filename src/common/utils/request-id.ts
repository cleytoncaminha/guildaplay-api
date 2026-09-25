import { randomUUID } from "node:crypto";
import type { Request } from "express";

export type RequestWithId = Request & {
  requestId?: string;
};

export type RequestIdResponse = {
  setHeader(name: string, value: string): unknown;
};

export function ensureRequestId(
  request: RequestWithId,
  response: RequestIdResponse,
): string {
  const requestId = request.requestId ?? randomUUID();

  request.requestId = requestId;
  response.setHeader("X-Request-Id", requestId);

  return requestId;
}
