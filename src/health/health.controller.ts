import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/auth.decorators";

@ApiTags("Health")
@Controller({ path: "health", version: "1" })
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: "Verifica se a API está disponível." })
  @ApiOkResponse({
    description: "API disponível.",
    schema: {
      example: {
        data: {
          status: "ok",
        },
      },
    },
  })
  getHealth() {
    return {
      data: {
        status: "ok",
      },
    };
  }
}
