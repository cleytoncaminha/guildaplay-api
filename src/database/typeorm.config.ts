import { join } from "node:path";
import type { DataSourceOptions } from "typeorm";

import { AuthCredentialEntity } from "../auth/entities/auth-credential.entity";
import { AuthSessionEntity } from "../auth/entities/auth-session.entity";
import { EmailVerificationTokenEntity } from "../auth/entities/email-verification-token.entity";
import { PasswordResetTokenEntity } from "../auth/entities/password-reset-token.entity";
import { UserEntity } from "../users/entities/user.entity";
import { UserRoleEntity } from "../users/entities/user-role.entity";
import { AuditLogEntity } from "../audit/audit-log.entity";
import { GmProfileEntity } from "../gm-profiles/entities/gm-profile.entity";
import { BillingPlanEntity } from "../tables/entities/billing-plan.entity";
import { GameTableEntity } from "../tables/entities/game-table.entity";
import { InvitationEntity } from "../invitations/entities/invitation.entity";
import { TableMemberEntity } from "../memberships/entities/table-member.entity";
import { MediaAssetEntity } from "../uploads/entities/media-asset.entity";
import { CatalogEditionEntity } from "../catalog/entities/catalog-edition.entity";
import { CatalogCategoryEntity } from "../catalog/entities/catalog-category.entity";
import { CatalogItemAliasEntity } from "../catalog/entities/catalog-item-alias.entity";
import { CatalogItemCategoryEntity } from "../catalog/entities/catalog-item-category.entity";
import { CatalogItemCreatorEntity } from "../catalog/entities/catalog-item-creator.entity";
import { CatalogItemMediaEntity } from "../catalog/entities/catalog-item-media.entity";
import { CatalogItemRelationEntity } from "../catalog/entities/catalog-item-relation.entity";
import { CatalogItemSourceEntity } from "../catalog/entities/catalog-item-source.entity";
import { CatalogItemSystemEntity } from "../catalog/entities/catalog-item-system.entity";
import { CatalogSubmissionEntity } from "../catalog/entities/catalog-submission.entity";
import { CatalogReportEntity } from "../catalog/entities/catalog-report.entity";
import { CatalogCollectionEntity } from "../catalog/entities/catalog-collection.entity";
import { CatalogCollectionItemEntity } from "../catalog/entities/catalog-collection-item.entity";
import { CatalogUserItemEntity } from "../catalog/entities/catalog-user-item.entity";
import { CatalogItemReviewEntity } from "../catalog/entities/catalog-item-review.entity";
import { CatalogFeaturedListEntity } from "../catalog/entities/catalog-featured-list.entity";
import { CatalogFeaturedListItemEntity } from "../catalog/entities/catalog-featured-list-item.entity";
import { CatalogItemTagEntity } from "../catalog/entities/catalog-item-tag.entity";
import { CatalogItemEntity } from "../catalog/entities/catalog-item.entity";
import { CatalogTagEntity } from "../catalog/entities/catalog-tag.entity";
import { CreatorEntity } from "../catalog/entities/creator.entity";
import { PublisherEntity } from "../catalog/entities/publisher.entity";
import { RpgSystemEntity } from "../catalog/entities/rpg-system.entity";

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
    migrations: [join(__dirname, "migrations/*{.ts,.js}")],
  };
}
