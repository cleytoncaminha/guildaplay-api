import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsTimeZone,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ScheduleFrequency } from "../entities/game-table.entity.js";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UpdateTableDto {
  @ApiPropertyOptional({ example: "Curse of Strahd — Temporada 2" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name?: string;
  @ApiPropertyOptional({ example: "Nova descrição." })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  description?: string;
  @ApiPropertyOptional({ example: "D&D 5e" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  system?: string;
  @ApiPropertyOptional({ example: 16000, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  monthlyPriceCents?: number;
  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxPlayers?: number;
  @ApiPropertyOptional({ enum: ScheduleFrequency })
  @IsOptional()
  @IsEnum(ScheduleFrequency)
  scheduleFrequency?: ScheduleFrequency;
  @ApiPropertyOptional({ example: 5, minimum: 0, maximum: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekday?: number;
  @ApiPropertyOptional({ example: "21:00" })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string;
  @ApiPropertyOptional({ example: "America/Sao_Paulo" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsTimeZone()
  timezone?: string;
}
