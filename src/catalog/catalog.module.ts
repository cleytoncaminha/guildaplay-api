import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesGuard } from "../auth/roles.guard";
import { CatalogPublicController } from "./catalog-public.controller";
import { CatalogPublicService } from "./catalog-public.service";
import { CatalogCollectionsPublicController } from "./catalog-collections-public.controller";
import { CatalogPersonalController } from "./catalog-personal.controller";
import { CatalogPersonalService } from "./catalog-personal.service";
import { CatalogSubmissionsController } from "./catalog-submissions.controller";
import { CatalogSubmissionsService } from "./catalog-submissions.service";
import { CatalogModerationController } from "./catalog-moderation.controller";
import { CatalogModerationService } from "./catalog-moderation.service";
import { CatalogAdminReportsController } from "./catalog-admin-reports.controller";
import { CatalogReportsController } from "./catalog-reports.controller";
import { CatalogReportsService } from "./catalog-reports.service";
import { CatalogReviewsController } from "./catalog-reviews.controller";
import { CatalogReviewsService } from "./catalog-reviews.service";
import { CatalogAdminReviewsController } from "./catalog-admin-reviews.controller";
import { CatalogFeaturedListsController } from "./catalog-featured-lists.controller";
import { CatalogFeaturedListsPublicController } from "./catalog-featured-lists-public.controller";
import { CatalogFeaturedListsService } from "./catalog-featured-lists.service";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";

import { CatalogEditionEntity } from "./entities/catalog-edition.entity";
import { CatalogCategoryEntity } from "./entities/catalog-category.entity";
import { CatalogItemAliasEntity } from "./entities/catalog-item-alias.entity";
import { CatalogItemCategoryEntity } from "./entities/catalog-item-category.entity";
import { CatalogItemCreatorEntity } from "./entities/catalog-item-creator.entity";
import { CatalogItemMediaEntity } from "./entities/catalog-item-media.entity";
import { CatalogItemRelationEntity } from "./entities/catalog-item-relation.entity";
import { CatalogItemSourceEntity } from "./entities/catalog-item-source.entity";
import { CatalogItemSystemEntity } from "./entities/catalog-item-system.entity";
import { CatalogSubmissionEntity } from "./entities/catalog-submission.entity";
import { CatalogReportEntity } from "./entities/catalog-report.entity";
import { CatalogCollectionEntity } from "./entities/catalog-collection.entity";
import { CatalogCollectionItemEntity } from "./entities/catalog-collection-item.entity";
import { CatalogUserItemEntity } from "./entities/catalog-user-item.entity";
import { CatalogItemReviewEntity } from "./entities/catalog-item-review.entity";
import { CatalogFeaturedListEntity } from "./entities/catalog-featured-list.entity";
import { CatalogFeaturedListItemEntity } from "./entities/catalog-featured-list-item.entity";
import { CatalogItemTagEntity } from "./entities/catalog-item-tag.entity";
import { CatalogItemEntity } from "./entities/catalog-item.entity";
import { CatalogTagEntity } from "./entities/catalog-tag.entity";
import { CreatorEntity } from "./entities/creator.entity";
import { PublisherEntity } from "./entities/publisher.entity";
import { RpgSystemEntity } from "./entities/rpg-system.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PublisherEntity,
      CreatorEntity,
      CatalogCategoryEntity,
      CatalogTagEntity,
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
    ]),
  ],
  controllers: [
    CatalogController,
    CatalogPublicController,
    CatalogCollectionsPublicController,
    CatalogPersonalController,
    CatalogSubmissionsController,
    CatalogModerationController,
    CatalogAdminReportsController,
    CatalogReportsController,
    CatalogReviewsController,
    CatalogAdminReviewsController,
    CatalogFeaturedListsController,
    CatalogFeaturedListsPublicController,
  ],
  providers: [
    CatalogService,
    CatalogPublicService,
    CatalogPersonalService,
    CatalogSubmissionsService,
    CatalogModerationService,
    CatalogReportsService,
    CatalogReviewsService,
    CatalogFeaturedListsService,
    RolesGuard,
  ],
})
export class CatalogModule {}
