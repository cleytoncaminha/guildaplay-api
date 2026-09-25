import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/auth.decorators";
import { AuthenticatedUser } from "../auth/auth.types";
import { UploadUrlDto } from "./dto/media.dto";
import { MediaService } from "./media.service";
@ApiTags("Media")
@ApiBearerAuth()
@Controller({ path: "media", version: "1" })
export class MediaController {
  constructor(private service: MediaService) {}
  @Post("upload-url")
  @ApiOperation({
    summary: "Solicita upload de avatar, capa de mesa ou mídia de catálogo",
  })
  async request(@CurrentUser() u: AuthenticatedUser, @Body() d: UploadUrlDto) {
    return { data: await this.service.request(u, d) };
  }
  @Post(":assetId/complete")
  @HttpCode(200)
  @ApiOperation({
    summary: "Finaliza upload de avatar, capa de mesa ou mídia de catálogo",
  })
  async complete(
    @CurrentUser() u: AuthenticatedUser,
    @Param("assetId", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.service.complete(u, id) };
  }
}
