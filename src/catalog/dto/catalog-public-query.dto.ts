import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import {
  CatalogExperienceLevel,
  CatalogItemType,
} from "../enums/catalog.enums";

export enum CatalogSort {
  TITLE = "TITLE",
  RELEASE_YEAR = "RELEASE_YEAR",
  NEWEST = "NEWEST",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CatalogPublicQueryDto {
  @ApiPropertyOptional({ example: "tormenta" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  systemId?: string;

  @ApiPropertyOptional({ enum: CatalogItemType })
  @IsOptional()
  @IsEnum(CatalogItemType)
  type?: CatalogItemType;

  @ApiPropertyOptional({ description: "Slug da categoria de gênero." })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(140)
  genre?: string;

  @ApiPropertyOptional({ example: "pt-BR" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(10)
  languageCode?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  publisherId?: string;

  @ApiPropertyOptional({ example: 2020, minimum: 1900, maximum: 2200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2200)
  year?: number;

  @ApiPropertyOptional({ enum: CatalogExperienceLevel })
  @IsOptional()
  @IsEnum(CatalogExperienceLevel)
  experienceLevel?: CatalogExperienceLevel;

  @ApiPropertyOptional({ enum: CatalogSort, default: CatalogSort.TITLE })
  @IsOptional()
  @IsEnum(CatalogSort)
  sort: CatalogSort = CatalogSort.TITLE;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.ASC;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
