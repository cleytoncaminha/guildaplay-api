import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsUUID } from "class-validator";

import { CatalogItemRelationType } from "../enums/catalog.enums.js";

export class CreateCatalogItemRelationDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  targetItemId!: string;

  @ApiProperty({ enum: CatalogItemRelationType })
  @IsEnum(CatalogItemRelationType)
  type!: CatalogItemRelationType;
}
