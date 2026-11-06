// NestJS Controller — Module Explorations Médicales (DPI CHREIN Kaolack)
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@chrein/shared';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateExplorationDto } from './dto/create-exploration.dto';
import { ValidateResultDto, AmendResultDto } from './dto/validate-result.dto';
import { ExplorationsService } from './explorations.service';

@ApiTags('Explorations Médicales')
@ApiBearerAuth()
@Controller('api/v1/explorations')
export class ExplorationsController {
  constructor(private readonly explorationsService: ExplorationsService) {}

  @Get()
  @ApiOperation({ summary: 'Recherche et filtrage multi-critères des explorations médicales' })
  @ApiResponse({ status: 200, description: 'Liste des explorations retournée avec succès.' })
  findAll(@Query() query: any) {
    return this.explorationsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques agrégées du module explorations' })
  getStats() {
    return this.explorationsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultation détaillée d’une exploration avec son dossier complet' })
  @ApiResponse({ status: 200, description: 'Exploration trouvée.' })
  @ApiResponse({ status: 404, description: 'Exploration non trouvée.' })
  findOne(@Param('id') id: string) {
    return this.explorationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Prescription d’une nouvelle exploration médicale' })
  @ApiResponse({ status: 201, description: 'Prescription enregistrée avec numéro unique EXP-AAAA-XXXX.' })
  create(@Body() dto: CreateExplorationDto, @Req() req: any) {
    return this.explorationsService.create(dto, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mise à jour du statut dans le workflow d’acheminement et prélèvement' })
  updateStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.explorationsService.updateStatus(id, body.status, req.user, body.notes);
  }

  @Post(':id/results')
  @ApiOperation({ summary: 'Saisie des résultats d’examen (paramètres structurés et rapport)' })
  enterResults(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.explorationsService.enterResults(id, body, req.user);
  }

  @Post(':id/results/submit')
  @ApiOperation({ summary: 'Soumission des résultats pour validation par un médecin clinicien' })
  submitResults(@Param('id') id: string, @Req() req: any) {
    return this.explorationsService.submitResults(id, req.user);
  }

  @Post(':id/results/validate')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Validation médicale finale — Réservé exclusivement aux cliniciens et admins (403 pour SECRÉTAIRE)' })
  @ApiResponse({ status: 200, description: 'Résultat validé avec succès.' })
  @ApiResponse({ status: 403, description: 'Refus d’accès si le rôle est SECRETARY, NURSE ou non habilité.' })
  validateResult(@Param('id') id: string, @Body() dto: ValidateResultDto, @Req() req: any) {
    return this.explorationsService.validateResult(id, dto, req.user);
  }

  @Post(':id/results/request-correction')
  @ApiOperation({ summary: 'Demande de correction du résultat renvoyé au laboratoire' })
  requestCorrection(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    return this.explorationsService.requestCorrection(id, reason, req.user);
  }

  @Post(':id/results/amendments')
  @ApiOperation({ summary: 'Création d’un amendement (V2+) sur un résultat déjà validé avec motif obligatoire' })
  amendResult(@Param('id') id: string, @Body() dto: AmendResultDto, @Req() req: any) {
    return this.explorationsService.amendResult(id, dto, req.user);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Piste d’audit immuable et historique des versions successives' })
  getHistory(@Param('id') id: string) {
    return this.explorationsService.getHistory(id);
  }
}
