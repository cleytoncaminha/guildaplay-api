import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";

import { AuditLogEntity } from "../audit/audit-log.entity";
import { AuthenticatedUser } from "../auth/auth.types";
import { MediaAssetEntity } from "../uploads/entities/media-asset.entity";
import {
  CreateCatalogReportDto,
  ResolveCatalogReportDto,
} from "./dto/catalog-report.dto";
import { CatalogItemEntity } from "./entities/catalog-item.entity";
import {
  CatalogReportEntity,
  CatalogReportReason,
  CatalogReportStatus,
  CatalogReportTargetType,
} from "./entities/catalog-report.entity";

@Injectable()
export class CatalogReportsService {
  constructor(private db: DataSource) {}

  async create(user: AuthenticatedUser, dto: CreateCatalogReportDto) {
    return this.db.transaction(async (manager) => {
      if (!dto.description.trim()) {
        throw new BadRequestException({
          code: "CATALOG_REPORT_DESCRIPTION_REQUIRED",
          message: "Descreva o problema encontrado.",
        });
      }
      await this.validateTarget(manager, dto);
      const report = await manager.save(
        manager.create(CatalogReportEntity, {
          reportedByUserId: user.id,
          targetType: dto.targetType,
          catalogItemId:
            dto.targetType === CatalogReportTargetType.ITEM
              ? dto.catalogItemId!
              : null,
          mediaAssetId:
            dto.targetType === CatalogReportTargetType.MEDIA
              ? dto.mediaAssetId!
              : null,
          reason: dto.reason,
          duplicateOfCatalogItemId: dto.duplicateOfCatalogItemId ?? null,
          description: dto.description.trim(),
          status: CatalogReportStatus.PENDING,
        }),
      );
      await manager.save(
        manager.create(AuditLogEntity, {
          actorUserId: user.id,
          eventType: "CATALOG_REPORT_CREATED",
          metadata: {
            reportId: report.id,
            targetType: report.targetType,
            reason: report.reason,
          },
        }),
      );
      return report;
    });
  }

  async pending() {
    return {
      data: await this.db.getRepository(CatalogReportEntity).find({
        where: { status: CatalogReportStatus.PENDING },
        order: { createdAt: "ASC" },
      }),
    };
  }

  async resolve(
    user: AuthenticatedUser,
    id: string,
    dto: ResolveCatalogReportDto,
  ) {
    return this.db.transaction(async (manager) => {
      const report = await manager.findOneBy(CatalogReportEntity, { id });
      if (!report) {
        throw new NotFoundException({
          code: "CATALOG_REPORT_NOT_FOUND",
          message: "Denúncia não encontrada.",
        });
      }
      if (report.status !== CatalogReportStatus.PENDING) {
        throw new ConflictException({
          code: "CATALOG_REPORT_ALREADY_REVIEWED",
          message: "Denúncia já foi revisada.",
        });
      }

      report.status = dto.status;
      report.resolvedByUserId = user.id;
      report.resolutionNote = dto.note ?? null;
      report.resolvedAt = new Date();
      const saved = await manager.save(report);
      await manager.save(
        manager.create(AuditLogEntity, {
          actorUserId: user.id,
          eventType: `CATALOG_REPORT_${dto.status}`,
          metadata: { reportId: id },
        }),
      );
      return saved;
    });
  }

  private async validateTarget(
    manager: EntityManager,
    dto: CreateCatalogReportDto,
  ) {
    if (dto.targetType === CatalogReportTargetType.ITEM) {
      if (
        !(await manager.findOneBy(CatalogItemEntity, {
          id: dto.catalogItemId!,
        }))
      ) {
        throw new NotFoundException({
          code: "CATALOG_ITEM_NOT_FOUND",
          message: "Item de catálogo não encontrado.",
        });
      }
    } else if (
      !(await manager.findOneBy(MediaAssetEntity, { id: dto.mediaAssetId! }))
    ) {
      throw new NotFoundException({
        code: "MEDIA_ASSET_NOT_FOUND",
        message: "Mídia não encontrada.",
      });
    }

    if (
      dto.reason !== CatalogReportReason.DUPLICATE &&
      dto.duplicateOfCatalogItemId
    ) {
      throw new BadRequestException({
        code: "CATALOG_REPORT_DUPLICATE_TARGET_NOT_ALLOWED",
        message:
          "duplicateOfCatalogItemId só pode ser informado em denúncias de duplicidade.",
      });
    }
    if (dto.reason === CatalogReportReason.DUPLICATE) {
      if (
        dto.targetType !== CatalogReportTargetType.ITEM ||
        !dto.duplicateOfCatalogItemId
      ) {
        throw new BadRequestException({
          code: "CATALOG_REPORT_DUPLICATE_TARGET_REQUIRED",
          message:
            "Uma denúncia de duplicidade precisa indicar os dois itens do catálogo.",
        });
      }
      if (dto.duplicateOfCatalogItemId === dto.catalogItemId) {
        throw new BadRequestException({
          code: "CATALOG_REPORT_DUPLICATE_TARGET_INVALID",
          message:
            "Um item não pode ser denunciado como duplicado de si mesmo.",
        });
      }
      if (
        !(await manager.findOneBy(CatalogItemEntity, {
          id: dto.duplicateOfCatalogItemId,
        }))
      ) {
        throw new NotFoundException({
          code: "CATALOG_ITEM_NOT_FOUND",
          message: "Item de catálogo duplicado não encontrado.",
        });
      }
    }
  }
}
