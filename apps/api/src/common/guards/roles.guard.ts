// NestJS Guard — Contrôle d'Accès Basé sur les Rôles (RBAC Hospitalier DPI CHREIN)
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@chrein/shared';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Injecté par le JwtAuthGuard

    if (!user || !user.role) {
      throw new ForbiddenException("Accès refusé : Identité de l'utilisateur ou rôle non défini.");
    }

    const hasPermission = requiredRoles.includes(user.role);
    if (!hasPermission) {
      throw new ForbiddenException(
        `Erreur 403 Forbidden: Le rôle [${user.role}] n'a pas les prérogatives requises pour cette opération clinique.`
      );
    }

    return true;
  }
}
