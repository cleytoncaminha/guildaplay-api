import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

import { CatalogSubmissionType } from "../entities/catalog-submission.entity.js";

export class CreateCatalogSubmissionDto {
  @ApiProperty({ enum: CatalogSubmissionType })
  @IsEnum(CatalogSubmissionType)
  type!: CatalogSubmissionType;

  @ApiPropertyOptional({ format: "uuid" })
  @ValidateIf(
    (dto: CreateCatalogSubmissionDto) =>
      dto.type === CatalogSubmissionType.UPDATE_ITEM,
  )
  @IsUUID()
  catalogItemId?: string;

  @ApiProperty({
    description: "Dados propostos; a validação editorial ocorre na moderação.",
  })
  @IsObject()
  payload!: Record<string, unknown>;
}

export class ListMyCatalogSubmissionsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
