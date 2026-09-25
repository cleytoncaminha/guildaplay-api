import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UpdateGmProfileDto {
  @ApiPropertyOptional({
    example: "Mestre Cleyton",
    minLength: 2,
    maxLength: 120,
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({ example: "Nova bio.", maxLength: 5000 })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(5000)
  bio?: string;
}
