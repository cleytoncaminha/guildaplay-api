import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

import {
  CatalogExperienceLevel,
  CatalogItemType,
  CreatorRole,
} from "../enums/catalog.enums";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;
const upperTrim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;

export class PaginationQueryDto {
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

export class CreatePublisherDto {
  @ApiProperty({ example: "Jambô Editora" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "jambo-editora" })
  @Transform(trim)
  @IsString()
  @MaxLength(180)
  @Matches(SLUG_PATTERN)
  slug!: string;

  @ApiPropertyOptional({ example: "https://jamboeditora.com.br" })
  @IsOptional()
  @Transform(trim)
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  websiteUrl?: string | null;

  @ApiPropertyOptional({ example: "BR" })
  @IsOptional()
  @Transform(upperTrim)
  @Matches(/^[A-Z]{2}$/)
  countryCode?: string | null;
}

export class UpdatePublisherDto extends PartialType(CreatePublisherDto) {}

export class CreateCreatorDto {
  @ApiProperty({ example: "Marcelo Cassaro" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "marcelo-cassaro" })
  @Transform(trim)
  @IsString()
  @MaxLength(180)
  @Matches(SLUG_PATTERN)
  slug!: string;

  @ApiPropertyOptional({ example: "https://example.com" })
  @IsOptional()
  @Transform(trim)
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  websiteUrl?: string | null;
}

export class UpdateCreatorDto extends PartialType(CreateCreatorDto) {}

export class CreateRpgSystemDto {
  @ApiProperty({ example: "Tormenta20" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "tormenta20" })
  @Transform(trim)
  @IsString()
  @MaxLength(180)
  @Matches(SLUG_PATTERN)
  slug!: string;

  @ApiPropertyOptional({ example: "Sistema brasileiro de fantasia." })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  publisherId?: string | null;

  @ApiPropertyOptional({ example: 2020, minimum: 1900, maximum: 2200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2200)
  releaseYear?: number | null;
}

export class UpdateRpgSystemDto extends PartialType(CreateRpgSystemDto) {}

export class CreateCatalogCategoryDto {
  @ApiProperty({ example: "Terror" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "terror" })
  @Transform(trim)
  @IsString()
  @MaxLength(140)
  @Matches(SLUG_PATTERN)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  description?: string | null;
}

export class UpdateCatalogCategoryDto extends PartialType(
  CreateCatalogCategoryDto,
) {}

export class CreateCatalogTagDto {
  @ApiProperty({ example: "investigação" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: "investigacao" })
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  @Matches(SLUG_PATTERN)
  slug!: string;
}

export class UpdateCatalogTagDto extends PartialType(CreateCatalogTagDto) {}

export class CatalogItemCreatorDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  creatorId!: string;

  @ApiProperty({ enum: CreatorRole })
  @IsEnum(CreatorRole)
  role!: CreatorRole;
}

export class CreateCatalogItemDto {
  @ApiProperty({ enum: CatalogItemType })
  @IsEnum(CatalogItemType)
  type!: CatalogItemType;

  @ApiProperty({ example: "Tormenta20 Livro Básico" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: "tormenta20-livro-basico" })
  @Transform(trim)
  @IsString()
  @MaxLength(280)
  @Matches(SLUG_PATTERN)
  slug!: string;

  @ApiPropertyOptional({ example: "Livro básico do sistema." })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  summary?: string | null;

  @ApiPropertyOptional({ example: "Descrição editorial completa." })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ example: 2020, minimum: 1900, maximum: 2200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2200)
  originalReleaseYear?: number | null;

  @ApiPropertyOptional({ enum: CatalogExperienceLevel })
  @IsOptional()
  @IsEnum(CatalogExperienceLevel)
  experienceLevel?: CatalogExperienceLevel | null;

  @ApiPropertyOptional({ type: [String], format: "uuid" })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  systemIds?: string[];

  @ApiPropertyOptional({ type: [String], format: "uuid" })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String], format: "uuid" })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ type: [CatalogItemCreatorDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogItemCreatorDto)
  creators?: CatalogItemCreatorDto[];
}

export class UpdateCatalogItemDto extends PartialType(CreateCatalogItemDto) {}

export class CreateCatalogItemAliasDto {
  @ApiProperty({ example: "T20" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  alias!: string;
}

export class UpdateCatalogItemAliasDto extends PartialType(
  CreateCatalogItemAliasDto,
) {}

export class CreateCatalogItemSourceDto {
  @ApiProperty({ example: "Página oficial" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label!: string;

  @ApiProperty({ example: "https://editora.exemplo.com/livro" })
  @Transform(trim)
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  url!: string;
}

export class UpdateCatalogItemSourceDto extends PartialType(
  CreateCatalogItemSourceDto,
) {}

export class CreateCatalogEditionDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  catalogItemId!: string;

  @ApiProperty({ example: "Edição brasileira" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: "tormenta20-livro-basico-edicao-brasileira" })
  @Transform(trim)
  @IsString()
  @MaxLength(280)
  @Matches(SLUG_PATTERN)
  slug!: string;

  @ApiProperty({ example: "pt-BR" })
  @Transform(trim)
  @Matches(LANGUAGE_CODE_PATTERN)
  @MaxLength(10)
  languageCode!: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  publisherId?: string | null;

  @ApiPropertyOptional({ example: 2020, minimum: 1900, maximum: 2200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2200)
  releaseYear?: number | null;

  @ApiPropertyOptional({ example: "978-85-8059-999-9" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  isbn10?: string | null;

  @ApiPropertyOptional({ example: "978-85-8059-999-9" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  isbn13?: string | null;
}

export class UpdateCatalogEditionDto extends PartialType(
  CreateCatalogEditionDto,
) {}
