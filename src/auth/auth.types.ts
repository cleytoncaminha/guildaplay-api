import { UserRole } from "../users/entities/user-role.entity.js";
export type AuthenticatedUser = {
  id: string;
  sessionId: string;
  roles: UserRole[];
  emailVerified: boolean;
};
export type JwtPayload = { sub: string; sid: string; roles: UserRole[] };
