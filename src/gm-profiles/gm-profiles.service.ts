import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, QueryFailedError, Repository } from "typeorm";

import { AuditLogEntity } from "../audit/audit-log.entity";
import { AuthenticatedUser } from "../auth/auth.types";
import { UserRole, UserRoleEntity } from "../users/entities/user-role.entity";
import { UserEntity, UserStatus } from "../users/entities/user.entity";
import { CreateGmProfileDto } from "./dto/create-gm-profile.dto";
import { UpdateGmProfileDto } from "./dto/update-gm-profile.dto";
import { GmProfileEntity, GmProfileStatus } from "./entities/gm-profile.entity";

@Injectable()
export class GmProfilesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(GmProfileEntity)
    private profiles: Repository<GmProfileEntity>,
  ) {}

  private view(profile: GmProfileEntity) {
    return {
      id: profile.id,
      displayName: profile.displayName,
      bio: profile.bio,
      status: profile.status,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateGmProfileDto) {
    try {
      const profile = await this.dataSource.transaction(async (manager) => {
        const user = await manager.findOne(UserEntity, {
          where: { id: currentUser.id },
        });

        if (!user || user.status !== UserStatus.ACTIVE) {
          throw new ForbiddenException({
            code: "FORBIDDEN",
            message: "Sem permissão.",
          });
        }
        if (!user.emailVerifiedAt) {
          throw new ForbiddenException({
            code: "EMAIL_NOT_VERIFIED",
            message: "E-mail não verificado.",
          });
        }
        if (
          await manager.exists(GmProfileEntity, { where: { userId: user.id } })
        ) {
          throw new ConflictException({
            code: "GM_PROFILE_ALREADY_EXISTS",
            message: "Perfil de mestre já existe.",
          });
        }

        const created = await manager.save(
          manager.create(GmProfileEntity, {
            userId: user.id,
            displayName: dto.displayName,
            bio: dto.bio ?? null,
            status: GmProfileStatus.PENDING,
          }),
        );

        const hasGmRole = await manager.exists(UserRoleEntity, {
          where: { userId: user.id, role: UserRole.GM },
        });
        if (!hasGmRole) {
          await manager.save(
            manager.create(UserRoleEntity, {
              userId: user.id,
              role: UserRole.GM,
            }),
          );
        }
        await manager.save(
          manager.create(AuditLogEntity, {
            actorUserId: user.id,
            eventType: "GM_PROFILE_CREATED",
            metadata: null,
          }),
        );

        return created;
      });

      return this.view(profile);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === "23505"
      ) {
        throw new ConflictException({
          code: "GM_PROFILE_ALREADY_EXISTS",
          message: "Perfil de mestre já existe.",
        });
      }
      throw error;
    }
  }

  async mine(currentUser: AuthenticatedUser) {
    const profile = await this.profiles.findOne({
      where: { userId: currentUser.id },
    });
    if (!profile) {
      throw new NotFoundException({
        code: "GM_PROFILE_NOT_FOUND",
        message: "Perfil de mestre não encontrado.",
      });
    }
    return this.view(profile);
  }

  async updateMine(currentUser: AuthenticatedUser, dto: UpdateGmProfileDto) {
    const profile = await this.profiles.findOne({
      where: { userId: currentUser.id },
    });
    if (!profile) {
      throw new NotFoundException({
        code: "GM_PROFILE_NOT_FOUND",
        message: "Perfil de mestre não encontrado.",
      });
    }

    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.bio !== undefined) profile.bio = dto.bio;

    const updated = await this.profiles.save(profile);
    await this.dataSource.getRepository(AuditLogEntity).save(
      this.dataSource.getRepository(AuditLogEntity).create({
        actorUserId: currentUser.id,
        eventType: "GM_PROFILE_UPDATED",
        metadata: null,
      }),
    );
    return this.view(updated);
  }
}
