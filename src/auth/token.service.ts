import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import { EnvironmentVariables } from "../config/env.validation.js";
import { JwtPayload } from "./auth.types.js";
@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private cfg: ConfigService<EnvironmentVariables>,
  ) {}
  hash(v: string) {
    return createHash("sha256").update(v).digest("hex");
  }
  opaque() {
    return randomBytes(48).toString("base64url");
  }
  access(p: JwtPayload) {
    return this.jwt.signAsync(p, {
      expiresIn: this.cfg.getOrThrow<string>("ACCESS_TOKEN_TTL") as never,
      secret: this.cfg.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }
  accessTtl() {
    return this.ttl(this.cfg.getOrThrow<string>("ACCESS_TOKEN_TTL"));
  }
  refreshTtl() {
    return this.ttl(this.cfg.getOrThrow<string>("REFRESH_TOKEN_TTL"));
  }
  private ttl(v: string) {
    const m = /^(\d+)([smhd])$/.exec(v);
    const f: { [key: string]: number } = { s: 1, m: 60, h: 3600, d: 86400 };
    if (!m || !f[m[2]]) throw new Error("TTL inválido");
    return Number(m[1]) * f[m[2]];
  }
}
