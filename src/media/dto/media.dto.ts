import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from "class-validator";
import { MediaPurpose } from "../../uploads/entities/media-asset.entity.js";

export class UploadUrlDto {
  @ApiProperty({ enum: MediaPurpose, example: MediaPurpose.TABLE_COVER })
  @IsEnum(MediaPurpose)
  purpose!: MediaPurpose;

  @ApiProperty({ example: "image/webp" })
  @IsString()
  mimeType!: string;

  @ApiProperty({ example: 500000, maximum: 10485760 })
  @IsInt()
  @Min(1)
  @Max(10485760)
  sizeBytes!: number;

  @ApiPropertyOptional({
    description: "Obrigatório somente quando purpose for TABLE_COVER.",
    format: "uuid",
  })
  @ValidateIf((dto: UploadUrlDto) => dto.purpose === MediaPurpose.TABLE_COVER)
  @IsUUID()
  tableId?: string;

  @ApiPropertyOptional({
    description: "Obrigatório para CATALOG_COVER e CATALOG_IMAGE.",
    format: "uuid",
  })
  @ValidateIf(
    (dto: UploadUrlDto) =>
      dto.purpose === MediaPurpose.CATALOG_COVER ||
      dto.purpose === MediaPurpose.CATALOG_IMAGE,
  )
  @IsUUID()
  catalogItemId?: string;
}
