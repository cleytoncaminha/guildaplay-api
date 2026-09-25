import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesGuard } from "../auth/roles.guard.js";
import { CatalogPublicController } from "./catalog-public.controller.js";
import { CatalogPublicService } from "./catalog-public.service.js";
import { CatalogCollectionsPublicController } from "./catalog-collections-public.controller.js";
import { CatalogPersonalController } from "./catalog-personal.controller.js";
import { CatalogPersonalService } from "./catalog-personal.service.js";
import { CatalogSubmissionsController } from "./catalog-submissions.controller.js";
import { CatalogSubmissionsService } from "./catalog-submissions.service.js";
import { CatalogModerationController } from "./catalog-moderation.controller.js";
import { CatalogModerationService } from "./catalog-moderation.service.js";
import { CatalogAdminReportsController } from "./catalog-admin-reports.controller.js";
import { CatalogReportsController } from "./catalog-reports.controller.js";
import { CatalogReportsService } from "./catalog-reports.service.js";
import { CatalogReviewsController } from "./catalog-reviews.controller.js";
import { CatalogReviewsService } from "./catalog-reviews.service.js";
import { CatalogAdminReviewsController } from "./catalog-admin-reviews.controller.js";
import { CatalogFeaturedListsController } from "./catalog-featured-lists.controller.js";
import { CatalogFeaturedListsPublicController } from "./catalog-featured-lists-public.controller.js";
import { CatalogFeaturedListsService } from "./catalog-featured-lists.service.js";
import { CatalogController } from "./catalog.controller.js";
import { CatalogService } from "./catalog.service.js";

import { CatalogEditionEntity } from "./entities/catalog-edition.entity.js";
import { CatalogCategoryEntity } from "./entities/catalog-category.entity.js";
import { CatalogItemAliasEntity } from "./entities/catalog-item-alias.entity.js";
import { CatalogItemCategoryEntity } from "./entities/catalog-item-category.entity.js";
import { CatalogItemCreatorEntity } from "./entities/catalog-item-creator.entity.js";
import { CatalogItemMediaEntity } from "./entities/catalog-item-media.entity.js";
import { CatalogItemRelationEntity } from "./entities/catalog-item-relation.entity.js";
import { CatalogItemSourceEntity } from "./entities/catalog-item-source.entity.js";
import { CatalogItemSystemEntity } from "./entities/catalog-item-system.entity.js";
import { CatalogSubmissionEntity } from "./entities/catalog-submission.entity.js";
import { CatalogReportEntity } from "./entities/catalog-report.entity.js";
import { CatalogCollectionEntity } from "./entities/catalog-collection.entity.js";
import { CatalogCollectionItemEntity } from "./entities/catalog-collection-item.entity.js";
import { CatalogUserItemEntity } from "./entities/catalog-user-item.entity.js";
import { CatalogItemReviewEntity } from "./entities/catalog-item-review.entity.js";
import { CatalogFeaturedListEntity } from "./entities/catalog-featured-list.entity.js";
import { CatalogFeaturedListItemEntity } from "./entities/catalog-featured-list-item.entity.js";
import { CatalogItemTagEntity } from "./entities/catalog-item-tag.entity.js";
import { CatalogItemEntity } from "./entities/catalog-item.entity.js";
import { CatalogTagEntity } from "./entities/catalog-tag.entity.js";
import { CreatorEntity } from "./entities/creator.entity.js";
import { PublisherEntity } from "./entities/publisher.entity.js";
import { RpgSystemEntity } from "./entities/rpg-system.entity.js";

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
