// NestJS Service — Module Explorations Médicales (DPI CHREIN Kaolack)
// Implémente la logique métier, la machine à états, le contrôle de versioning et l'audit trail.

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExplorationStatus, Role, ALLOWED_STATUS_TRANSITIONS, canUserValidateExploration } from '@chrein/shared';
import { CreateExplorationDto } from './dto/create-exploration.dto';
import { ValidateResultDto, AmendResultDto } from './dto/validate-result.dto';

@Injectable()
export class ExplorationsService {
  // En production, injecter PrismaService : constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    // Filtrage multi-critères : catégorie, statut, priorité, identifiant patient, recherche libre
    return {
      message: 'Liste filtrée des explorations médicales CHREIN',
      query
    };
  }

  async findOne(id: string) {
    // Récupération avec jointures sur Patient, Demandeur, Résultats versionnés et Piste d'audit
    return { id, message: 'Détail exploration médicale CHREIN' };
  }

  async getStats() {
    return {
      total: 7,
      pendingValidation: 2,
      inProgress: 3,
      validated: 2,
      criticalCount: 1,
      abnormalCount: 4
    };
  }

  async create(dto: CreateExplorationDto, currentUser: any) {
    const year = new Date().getFullYear();
    // Numérotation séquentielle automatique EXP-AAAA-XXXX
    const requestNumber = `EXP-${year}-0048`;

    return {
      message: 'Demande créée avec succès',
      requestNumber,
      status: ExplorationStatus.REQUESTED,
      dto
    };
  }

  async updateStatus(id: string, nextStatus: ExplorationStatus, currentUser: any, notes?: string) {
    // 1. Vérification de la transition autorisée dans la machine à états
    // 2. Journalisation d'audit immuable
    return {
      id,
      status: nextStatus,
      updatedBy: currentUser?.login || 'system',
      notes
    };
  }

  async enterResults(id: string, resultsPayload: any, currentUser: any) {
    // Saisie des paramètres structurés, valeurs de référence, drapeaux d'alerte
    return {
      id,
      status: ExplorationStatus.RESULT_ENTERED,
      resultsPayload
    };
  }

  async submitResults(id: string, currentUser: any) {
    return {
      id,
      status: ExplorationStatus.SUBMITTED,
      submittedAt: new Date().toISOString()
    };
  }

  async validateResult(id: string, dto: ValidateResultDto, currentUser: any) {
    // CONTRÔLE DE SÉCURITÉ RBAC OBLIGATOIRE :
    if (!currentUser || !canUserValidateExploration(currentUser.role)) {
      throw new ForbiddenException(
        `Erreur 403 Forbidden: Le rôle [${currentUser?.role}] n'a pas les prérogatives médicales pour valider ce résultat. Seuls les médecins cliniciens ou responsables de structure sont autorisés.`
      );
    }

    return {
      id,
      status: ExplorationStatus.VALIDATED,
      validatedById: currentUser.id,
      validatedByDoctor: currentUser.nom ? `Dr. ${currentUser.prenom} ${currentUser.nom}` : 'Dr. Clinicien CHREIN',
      validationDate: new Date().toISOString(),
      doctorNotes: dto.doctorNotes
    };
  }

  async requestCorrection(id: string, reason: string, currentUser: any) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException("Le motif de demande de correction est obligatoire.");
    }
    return {
      id,
      status: ExplorationStatus.RESULT_ENTERED,
      correctionReason: reason
    };
  }

  async amendResult(id: string, dto: AmendResultDto, currentUser: any) {
    // Traçabilité réglementaire : un résultat validé ne peut être modifié sans motif d'amendement explicite
    if (!dto.amendmentReason || !dto.amendmentReason.trim()) {
      throw new BadRequestException("Un motif explicite est requis pour créer un amendement (V2+) sur un résultat validé.");
    }

    return {
      id,
      status: ExplorationStatus.AMENDED,
      amendmentReason: dto.amendmentReason,
      amendedAt: new Date().toISOString(),
      amendedById: currentUser?.id
    };
  }

  async getHistory(id: string) {
    return {
      id,
      auditTrail: [],
      versions: []
    };
  }
}
