import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { AuditLogEntity } from "../audit/audit-log.entity";
import { AuthenticatedUser } from "../auth/auth.types";
import { UserRoleEntity } from "./entities/user-role.entity";
import { UserEntity } from "./entities/user.entity";
import { UpdateMeDto } from "./dto/update-me.dto";
import {
  MediaAssetEntity,
  MediaStatus,
} from "../uploads/entities/media-asset.entity";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class UsersService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity) private roles: Repository<UserRoleEntity>,
    private storage: StorageService,
  ) {}

  private async view(user: UserEntity) {
    const roles = await this.roles.find({ where: { userId: user.id } });

    const asset = user.avatarAssetId
      ? await this.dataSource
          .getRepository(MediaAssetEntity)
          .findOneBy({ id: user.avatarAssetId, status: MediaStatus.ACTIVE })
      : null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
      timezone: user.timezone,
      country: user.countryCode,
      status: user.status,
      roles: roles.map((role) => role.role),
      createdAt: user.createdAt,
      avatar: asset
        ? { id: asset.id, url: await this.storage.signedGet(asset.objectKey) }
        : null,
    };
  }

  async me(currentUser: AuthenticatedUser) {
    const user = await this.users.findOneByOrFail({ id: currentUser.id });
    return this.view(user);
  }

  async updateMe(currentUser: AuthenticatedUser, dto: UpdateMeDto) {
    const user = await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOneByOrFail(UserEntity, {
        id: currentUser.id,
      });

      if (dto.name !== undefined) user.name = dto.name;
      if (dto.timezone !== undefined) user.timezone = dto.timezone;
      if (dto.country !== undefined) user.countryCode = dto.country;

      const updated = await manager.save(user);
      await manager.save(
        manager.create(AuditLogEntity, {
          actorUserId: currentUser.id,
          eventType: "USER_PROFILE_UPDATED",
          metadata: null,
        }),
      );
      return updated;
    });

    return this.view(user);
  }
}
