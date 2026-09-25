import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { DataSource, Repository } from "typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity";
import { AuthenticatedUser } from "../auth/auth.types";
import { UserRole } from "../users/entities/user-role.entity";
import { CatalogItemMediaKind } from "../catalog/enums/catalog.enums";
import { CatalogItemMediaEntity } from "../catalog/entities/catalog-item-media.entity";
import { CatalogItemEntity } from "../catalog/entities/catalog-item.entity";
import { GmProfileEntity } from "../gm-profiles/entities/gm-profile.entity";
import { StorageService } from "../storage/storage.service";
import {
  GameTableEntity,
  GameTableStatus,
} from "../tables/entities/game-table.entity";
import {
  MediaAssetEntity,
  MediaPurpose,
  MediaStatus,
} from "../uploads/entities/media-asset.entity";
import { UserEntity } from "../users/entities/user.entity";
import { UploadUrlDto } from "./dto/media.dto";

const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES: Record<MediaPurpose, number> = {
  [MediaPurpose.USER_AVATAR]: 5 * 1024 * 1024,
  [MediaPurpose.TABLE_COVER]: 10 * 1024 * 1024,
  [MediaPurpose.CATALOG_COVER]: 10 * 1024 * 1024,
  [MediaPurpose.CATALOG_IMAGE]: 10 * 1024 * 1024,
};

@Injectable()
export class MediaService {
  constructor(
    private db: DataSource,
    @InjectRepository(MediaAssetEntity)
    private assets: Repository<MediaAssetEntity>,
    private storage: StorageService,
  ) {}

  private invalidMedia(): never {
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "Mídia inválida.",
    });
  }

  private async ownedTable(userId: string, tableId: string) {
    const gm = await this.db
      .getRepository(GmProfileEntity)
      .findOneBy({ userId });
    if (!gm)
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Sem permissão.",
      });
    const table = await this.db
      .getRepository(GameTableEntity)
      .findOneBy({ id: tableId, gmProfileId: gm.id });
    if (!table)
      throw new NotFoundException({
        code: "TABLE_NOT_FOUND",
        message: "Mesa não encontrada.",
      });
    if (table.status === GameTableStatus.ARCHIVED)
      throw new ConflictException({
        code: "INVALID_TABLE_STATUS",
        message: "Mesa arquivada.",
      });
    return table;
  }

  private tableIdFromAsset(asset: MediaAssetEntity): string {
    const match =
      /^tables\/([0-9a-f-]{36})\/covers\/[0-9a-f-]{36}\.[a-z]+$/i.exec(
        asset.objectKey,
      );
    if (!match)
      throw new NotFoundException({
        code: "TABLE_NOT_FOUND",
        message: "Mesa não encontrada.",
      });
    return match[1];
  }

  private catalogItemIdFromAsset(asset: MediaAssetEntity): string {
    const match =
      /^catalog\/items\/([0-9a-f-]{36})\/(?:covers|images)\/[0-9a-f-]{36}\.[a-z]+$/i.exec(
        asset.objectKey,
      );
    if (!match)
      throw new NotFoundException({
        code: "CATALOG_ITEM_NOT_FOUND",
        message: "Item de catálogo não encontrado.",
      });
    return match[1];
  }

  private async catalogItem(user: AuthenticatedUser, itemId: string) {
    if (!user.roles.includes(UserRole.ADMIN))
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Sem permissão.",
      });
    const item = await this.db.getRepository(CatalogItemEntity).findOneBy({
      id: itemId,
    });
    if (!item)
      throw new NotFoundException({
        code: "CATALOG_ITEM_NOT_FOUND",
        message: "Item de catálogo não encontrado.",
      });
    return item;
  }

  async request(user: AuthenticatedUser, dto: UploadUrlDto) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(dto.mimeType)) this.invalidMedia();
    if (dto.sizeBytes > MAX_UPLOAD_BYTES[dto.purpose]) this.invalidMedia();
    if (
      dto.purpose === MediaPurpose.USER_AVATAR &&
      (dto.tableId !== undefined || dto.catalogItemId !== undefined)
    )
      this.invalidMedia();
    if (
      dto.purpose === MediaPurpose.TABLE_COVER &&
      dto.catalogItemId !== undefined
    )
      this.invalidMedia();
    if (
      (dto.purpose === MediaPurpose.CATALOG_COVER ||
        dto.purpose === MediaPurpose.CATALOG_IMAGE) &&
      dto.tableId !== undefined
    )
      this.invalidMedia();
    const table =
      dto.purpose === MediaPurpose.TABLE_COVER
        ? await this.ownedTable(user.id, dto.tableId!)
        : null;
    const catalogItem =
      dto.purpose === MediaPurpose.CATALOG_COVER ||
      dto.purpose === MediaPurpose.CATALOG_IMAGE
        ? await this.catalogItem(user, dto.catalogItemId!)
        : null;
    const ext = dto.mimeType.split("/")[1];
    const asset = await this.assets.save(
      this.assets.create({
        ownerUserId: user.id,
        purpose: dto.purpose,
        objectKey: table
          ? `tables/${table.id}/covers/${randomUUID()}.${ext}`
          : catalogItem
            ? `catalog/items/${catalogItem.id}/${
                dto.purpose === MediaPurpose.CATALOG_COVER ? "covers" : "images"
              }/${randomUUID()}.${ext}`
            : `users/${user.id}/avatars/${randomUUID()}.${ext}`,
        mimeType: dto.mimeType,
        sizeBytes: String(dto.sizeBytes),
        status: MediaStatus.PENDING_UPLOAD,
        deletedAt: null,
      }),
    );
    await this.db.getRepository(AuditLogEntity).save({
      actorUserId: user.id,
      eventType: "MEDIA_UPLOAD_REQUESTED",
      metadata: {
        assetId: asset.id,
        purpose: asset.purpose,
        ...(table ? { tableId: table.id } : {}),
        ...(catalogItem ? { catalogItemId: catalogItem.id } : {}),
        actorUserId: user.id,
      },
    });
    return {
      assetId: asset.id,
      uploadUrl: await this.storage.presign(asset.objectKey, asset.mimeType),
      expiresAt: new Date(Date.now() + 900000),
    };
  }

  async complete(user: AuthenticatedUser, id: string) {
    const asset = await this.assets.findOneBy({ id, ownerUserId: user.id });
    if (!asset || asset.status !== MediaStatus.PENDING_UPLOAD)
      throw new NotFoundException({
        code: "MEDIA_ASSET_NOT_FOUND",
        message: "Asset não encontrado.",
      });
    const table =
      asset.purpose === MediaPurpose.TABLE_COVER
        ? await this.ownedTable(user.id, this.tableIdFromAsset(asset))
        : null;
    const catalogItem =
      asset.purpose === MediaPurpose.CATALOG_COVER ||
      asset.purpose === MediaPurpose.CATALOG_IMAGE
        ? await this.catalogItem(user, this.catalogItemIdFromAsset(asset))
        : null;
    let head;
    try {
      head = await this.storage.head(asset.objectKey);
    } catch {
      throw new BadRequestException({
        code: "MEDIA_UPLOAD_NOT_FOUND",
        message: "Upload não encontrado.",
      });
    }
    if (
      head.ContentType !== asset.mimeType ||
      Number(head.ContentLength) !== Number(asset.sizeBytes) ||
      !ALLOWED_IMAGE_MIME_TYPES.includes(head.ContentType || "") ||
      Number(head.ContentLength) > MAX_UPLOAD_BYTES[asset.purpose]
    )
      throw new BadRequestException({
        code: "MEDIA_INVALID",
        message: "Mídia inválida.",
      });
    await this.db.transaction(async (manager) => {
      asset.status = MediaStatus.ACTIVE;
      await manager.save(asset);
      if (asset.purpose === MediaPurpose.USER_AVATAR)
        await manager.update(UserEntity, user.id, { avatarAssetId: asset.id });
      else if (asset.purpose === MediaPurpose.TABLE_COVER)
        await manager.update(GameTableEntity, table!.id, {
          coverAssetId: asset.id,
        });
      else {
        const kind =
          asset.purpose === MediaPurpose.CATALOG_COVER
            ? CatalogItemMediaKind.COVER
            : CatalogItemMediaKind.IMAGE;
        if (kind === CatalogItemMediaKind.COVER) {
          const existing = await manager.findOneBy(CatalogItemMediaEntity, {
            catalogItemId: catalogItem!.id,
            kind,
          });
          if (existing) {
            await manager.delete(CatalogItemMediaEntity, { id: existing.id });
            await manager.update(MediaAssetEntity, existing.mediaAssetId, {
              status: MediaStatus.DELETED,
              deletedAt: new Date(),
            });
          }
        }
        const count = await manager.count(CatalogItemMediaEntity, {
          where: { catalogItemId: catalogItem!.id, kind },
        });
        await manager.save(
          manager.create(CatalogItemMediaEntity, {
            catalogItemId: catalogItem!.id,
            mediaAssetId: asset.id,
            kind,
            position: kind === CatalogItemMediaKind.COVER ? 0 : count,
          }),
        );
      }
      await manager.save(
        manager.create(AuditLogEntity, {
          actorUserId: user.id,
          eventType: "MEDIA_UPLOAD_COMPLETED",
          metadata: {
            assetId: asset.id,
            purpose: asset.purpose,
            ...(table ? { tableId: table.id } : {}),
            ...(catalogItem ? { catalogItemId: catalogItem.id } : {}),
            actorUserId: user.id,
          },
        }),
      );
      await manager.save(
        manager.create(AuditLogEntity, {
          actorUserId: user.id,
          eventType:
            asset.purpose === MediaPurpose.USER_AVATAR
              ? "USER_AVATAR_UPDATED"
              : asset.purpose === MediaPurpose.TABLE_COVER
                ? "TABLE_COVER_UPDATED"
                : "CATALOG_ITEM_MEDIA_COMPLETED",
          metadata: {
            assetId: asset.id,
            purpose: asset.purpose,
            ...(table ? { tableId: table.id } : {}),
            ...(catalogItem ? { catalogItemId: catalogItem.id } : {}),
            actorUserId: user.id,
          },
        }),
      );
    });
    const media = {
      id: asset.id,
      url: await this.storage.signedGet(asset.objectKey),
    };
    if (
      asset.purpose === MediaPurpose.CATALOG_COVER ||
      asset.purpose === MediaPurpose.CATALOG_IMAGE
    )
      return {
        media: {
          id: asset.id,
          kind:
            asset.purpose === MediaPurpose.CATALOG_COVER
              ? CatalogItemMediaKind.COVER
              : CatalogItemMediaKind.IMAGE,
          url: media.url,
        },
      };
    return asset.purpose === MediaPurpose.USER_AVATAR
      ? { avatar: media }
      : { cover: media };
  }
}
