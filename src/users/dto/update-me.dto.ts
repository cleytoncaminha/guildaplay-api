import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsTimeZone,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UpdateMeDto {
  @ApiPropertyOptional({
    example: "Cleyton Caminha",
    minLength: 2,
    maxLength: 120,
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: "America/Argentina/Buenos_Aires" })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @IsTimeZone()
  timezone?: string;

  @ApiPropertyOptional({ example: "AR", minLength: 2, maxLength: 2 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  country?: string;
}
