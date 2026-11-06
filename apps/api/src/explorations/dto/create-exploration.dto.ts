// DTO NestJS — Création d'une demande d'exploration médicale (DPI CHREIN)
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExplorationCategory, ExplorationPriority } from '@chrein/shared';

export class CreateExplorationDto {
  @ApiProperty({ description: 'Identifiant UUID du patient', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ description: 'Identifiant de l’épisode de soins (hospitalisation ou consultation)' })
  @IsUUID()
  @IsOptional()
  episodeId?: string;

  @ApiProperty({ description: 'Catégorie médicale', enum: ExplorationCategory, example: ExplorationCategory.MICROBIOLOGIE })
  @IsEnum(ExplorationCategory)
  category: ExplorationCategory;

  @ApiProperty({ description: 'Libellé de l’examen', example: 'GeneXpert MTB/RIF Ultra' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Type technique de l’examen', example: 'PCR en temps réel sur expectoration' })
  @IsString()
  @IsNotEmpty()
  examType: string;

  @ApiProperty({ description: 'Indication clinique détaillée justifiant la prescription' })
  @IsString()
  @IsNotEmpty()
  clinicalIndication: string;

  @ApiProperty({ description: 'Degré d’urgence', enum: ExplorationPriority, default: ExplorationPriority.NORMALE })
  @IsEnum(ExplorationPriority)
  priority: ExplorationPriority;

  @ApiPropertyOptional({ description: 'Type d’échantillon biologique attendu' })
  @IsString()
  @IsOptional()
  specimenType?: string;

  @ApiPropertyOptional({ description: 'Laboratoire ou service d’imagerie destinataire' })
  @IsString()
  @IsOptional()
  laboratoryDestination?: string;
}
