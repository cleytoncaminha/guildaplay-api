import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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

export class CreateTableDto {
  @ApiProperty({ example: "Curse of Strahd" })
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name!: string;
  @ApiPropertyOptional({ example: "Campanha semanal de terror gótico." })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  description?: string;
  @ApiProperty({ example: "D&D 5e" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  system!: string;
  @ApiProperty({ example: 15000, minimum: 1 })
  @IsInt()
  @Min(1)
  monthlyPriceCents!: number;
  @ApiProperty({ example: 4, minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  maxPlayers!: number;
  @ApiPropertyOptional({
    enum: ScheduleFrequency,
    example: ScheduleFrequency.WEEKLY,
  })
  @IsOptional()
  @IsEnum(ScheduleFrequency)
  scheduleFrequency?: ScheduleFrequency;
  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekday?: number;
  @ApiPropertyOptional({ example: "20:00" })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string;
  @ApiProperty({ example: "America/Sao_Paulo" })
  @Transform(trim)
  @IsString()
  @IsTimeZone()
  timezone!: string;
}
