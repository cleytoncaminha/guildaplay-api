import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateGmProfileDto {
  @ApiProperty({ example: "Mestre Cleyton", minLength: 2, maxLength: 120 })
  @Transform(trimmed)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional({
    example: "Mestro campanhas narrativas e de investigação.",
    maxLength: 5000,
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(5000)
  bio?: string;
}
