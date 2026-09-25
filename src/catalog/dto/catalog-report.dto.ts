import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from "class-validator";

import {
  CatalogReportReason,
  CatalogReportStatus,
  CatalogReportTargetType,
} from "../entities/catalog-report.entity";

export class CreateCatalogReportDto {
  @ApiProperty({ enum: CatalogReportTargetType })
  @IsEnum(CatalogReportTargetType)
  targetType!: CatalogReportTargetType;

  @ApiPropertyOptional({ format: "uuid" })
  @ValidateIf(
    (dto: CreateCatalogReportDto) =>
      dto.targetType === CatalogReportTargetType.ITEM,
  )
  @IsUUID()
  catalogItemId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @ValidateIf(
    (dto: CreateCatalogReportDto) =>
      dto.targetType === CatalogReportTargetType.MEDIA,
  )
  @IsUUID()
  mediaAssetId?: string;

  @ApiProperty({ enum: CatalogReportReason })
  @IsEnum(CatalogReportReason)
  reason!: CatalogReportReason;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  duplicateOfCatalogItemId?: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  description!: string;
}

export class ResolveCatalogReportDto {
  @ApiProperty({
    enum: CatalogReportStatus,
    enumName: "CatalogReportResolutionStatus",
  })
  @IsEnum(CatalogReportStatus)
  status!: CatalogReportStatus.RESOLVED | CatalogReportStatus.DISMISSED;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
