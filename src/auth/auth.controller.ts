import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { CurrentUser, Public } from "./auth.decorators";
import { AuthService } from "./auth.service";
import { AuthenticatedUser } from "./auth.types";
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from "./dto/auth.dto";
@ApiTags("Auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private auth: AuthService) {}
  private cookie(r: Response, v: string) {
    r.cookie("refresh_token", v, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/auth",
    });
  }
  private raw(req: Request) {
    return req.cookies?.refresh_token;
  }
  @Post("register")
  @Header("Cache-Control", "no-store")
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body() d: RegisterDto,
    @Res({ passthrough: true }) r: Response,
  ) {
    const x = await this.auth.register(d);
    if (process.env.NODE_ENV !== "production")
      r.setHeader("X-Development-Verification-Token", x.raw);
    return { data: { user: x.user } };
  }
  @Post("login")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() d: LoginDto,
    @Req() q: Request,
    @Res({ passthrough: true }) r: Response,
  ) {
    const x = await this.auth.login(d, q.get("user-agent"), q.ip);
    this.cookie(r, x.refreshToken);
    return {
      data: {
        accessToken: x.accessToken,
        expiresIn: x.expiresIn,
        user: x.user,
      },
    };
  }
  @Post("refresh")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Req() q: Request, @Res({ passthrough: true }) r: Response) {
    const raw = this.raw(q);
    if (!raw)
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Refresh token ausente.",
      });
    const x = await this.auth.refresh(raw, q.get("user-agent"), q.ip);
    this.cookie(r, x.refreshToken);
    return { data: { accessToken: x.accessToken, expiresIn: x.expiresIn } };
  }
  @Get("me")
  @Header("Cache-Control", "no-store")
  @ApiBearerAuth()
  async me(@CurrentUser() u: AuthenticatedUser) {
    return { data: await this.auth.me(u) };
  }
  @Post("logout")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  @ApiBearerAuth()
  async logout(
    @CurrentUser() u: AuthenticatedUser,
    @Res({ passthrough: true }) r: Response,
  ) {
    await this.auth.logout(u);
    r.clearCookie("refresh_token", { path: "/api/v1/auth" });
    return { data: null };
  }
  @Post("logout-all")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  @ApiBearerAuth()
  async logoutAll(
    @CurrentUser() u: AuthenticatedUser,
    @Res({ passthrough: true }) r: Response,
  ) {
    await this.auth.logoutAll(u);
    r.clearCookie("refresh_token", { path: "/api/v1/auth" });
    return { data: null };
  }
  @Post("verify-email")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  @Public()
  async verify(@Body() d: TokenDto) {
    await this.auth.consumeVerification(d.token);
    return { data: { verified: true } };
  }
  @Post("resend-verification")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resend(
    @Body() d: ForgotPasswordDto,
    @Res({ passthrough: true }) r: Response,
  ) {
    const raw = await this.auth.resend(d.email);
    if (raw && process.env.NODE_ENV !== "production")
      r.setHeader("X-Development-Verification-Token", raw);
    return {
      data: { message: "Se existir uma conta, enviaremos uma verificação." },
    };
  }
  @Post("forgot-password")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgot(
    @Body() d: ForgotPasswordDto,
    @Res({ passthrough: true }) r: Response,
  ) {
    const raw = await this.auth.forgot(d.email);
    if (raw && process.env.NODE_ENV !== "production")
      r.setHeader("X-Development-Reset-Token", raw);
    return {
      data: {
        message:
          "Se existir uma conta para esse e-mail, enviaremos instruções.",
      },
    };
  }
  @Post("reset-password")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  @Public()
  async reset(@Body() d: ResetPasswordDto) {
    await this.auth.resetPassword(d.token, d.password);
    return { data: null };
  }
}
