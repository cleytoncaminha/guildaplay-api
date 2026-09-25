import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DataSourceOptions } from "typeorm";

import { AuthCredentialEntity } from "../auth/entities/auth-credential.entity.js";
import { AuthSessionEntity } from "../auth/entities/auth-session.entity.js";
import { EmailVerificationTokenEntity } from "../auth/entities/email-verification-token.entity.js";
import { PasswordResetTokenEntity } from "../auth/entities/password-reset-token.entity.js";
import { UserEntity } from "../users/entities/user.entity.js";
import { UserRoleEntity } from "../users/entities/user-role.entity.js";
import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { GmProfileEntity } from "../gm-profiles/entities/gm-profile.entity.js";
import { BillingPlanEntity } from "../tables/entities/billing-plan.entity.js";
import { GameTableEntity } from "../tables/entities/game-table.entity.js";
import { InvitationEntity } from "../invitations/entities/invitation.entity.js";
import { TableMemberEntity } from "../memberships/entities/table-member.entity.js";
import { MediaAssetEntity } from "../uploads/entities/media-asset.entity.js";
import { CatalogEditionEntity } from "../catalog/entities/catalog-edition.entity.js";
import { CatalogCategoryEntity } from "../catalog/entities/catalog-category.entity.js";
import { CatalogItemAliasEntity } from "../catalog/entities/catalog-item-alias.entity.js";
import { CatalogItemCategoryEntity } from "../catalog/entities/catalog-item-category.entity.js";
import { CatalogItemCreatorEntity } from "../catalog/entities/catalog-item-creator.entity.js";
import { CatalogItemMediaEntity } from "../catalog/entities/catalog-item-media.entity.js";
import { CatalogItemRelationEntity } from "../catalog/entities/catalog-item-relation.entity.js";
import { CatalogItemSourceEntity } from "../catalog/entities/catalog-item-source.entity.js";
import { CatalogItemSystemEntity } from "../catalog/entities/catalog-item-system.entity.js";
import { CatalogSubmissionEntity } from "../catalog/entities/catalog-submission.entity.js";
import { CatalogReportEntity } from "../catalog/entities/catalog-report.entity.js";
import { CatalogCollectionEntity } from "../catalog/entities/catalog-collection.entity.js";
import { CatalogCollectionItemEntity } from "../catalog/entities/catalog-collection-item.entity.js";
import { CatalogUserItemEntity } from "../catalog/entities/catalog-user-item.entity.js";
import { CatalogItemReviewEntity } from "../catalog/entities/catalog-item-review.entity.js";
import { CatalogFeaturedListEntity } from "../catalog/entities/catalog-featured-list.entity.js";
import { CatalogFeaturedListItemEntity } from "../catalog/entities/catalog-featured-list-item.entity.js";
import { CatalogItemTagEntity } from "../catalog/entities/catalog-item-tag.entity.js";
import { CatalogItemEntity } from "../catalog/entities/catalog-item.entity.js";
import { CatalogTagEntity } from "../catalog/entities/catalog-tag.entity.js";
import { CreatorEntity } from "../catalog/entities/creator.entity.js";
import { PublisherEntity } from "../catalog/entities/publisher.entity.js";
import { RpgSystemEntity } from "../catalog/entities/rpg-system.entity.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

export function createTypeOrmOptions(databaseUrl: string): DataSourceOptions {
  return {
    type: "postgres",
    url: databaseUrl,
    synchronize: false,
    migrationsRun: false,
    entities: [
      UserEntity,
      UserRoleEntity,
      AuthCredentialEntity,
      AuthSessionEntity,
      EmailVerificationTokenEntity,
      PasswordResetTokenEntity,
      AuditLogEntity,
      GmProfileEntity,
      GameTableEntity,
      BillingPlanEntity,
      InvitationEntity,
      TableMemberEntity,
      MediaAssetEntity,
      CatalogCategoryEntity,
      CatalogTagEntity,
      PublisherEntity,
      CreatorEntity,
      RpgSystemEntity,
      CatalogItemEntity,
      CatalogEditionEntity,
      CatalogItemSystemEntity,
      CatalogItemCreatorEntity,
      CatalogItemCategoryEntity,
      CatalogItemTagEntity,
      CatalogItemAliasEntity,
      CatalogItemSourceEntity,
      CatalogItemMediaEntity,
      CatalogItemRelationEntity,
      CatalogSubmissionEntity,
      CatalogReportEntity,
      CatalogUserItemEntity,
      CatalogCollectionEntity,
      CatalogCollectionItemEntity,
      CatalogItemReviewEntity,
      CatalogFeaturedListEntity,
      CatalogFeaturedListItemEntity,
    ],
    migrations: [join(currentDirectory, "migrations/*{.ts,.js}")],
  };
}
