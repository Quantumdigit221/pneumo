// DTO NestJS — Validation Médicale et Amendement de Résultat (DPI CHREIN)
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateResultDto {
  @ApiPropertyOptional({ description: 'Commentaire ou consigne clinique du praticien validateur' })
  @IsString()
  @IsOptional()
  doctorNotes?: string;
}

export class AmendResultDto {
  @ApiProperty({ description: 'Motif clinique ou technique obligatoire justifiant la révision d’un résultat validé' })
  @IsString()
  @IsNotEmpty({ message: 'Le motif d’amendement est obligatoire pour assurer la traçabilité réglementaire.' })
  amendmentReason: string;

  @ApiPropertyOptional({ description: 'Conclusion révisée' })
  @IsString()
  @IsOptional()
  conclusion?: string;

  @ApiPropertyOptional({ description: 'Compte-rendu textuel révisé' })
  @IsString()
  @IsOptional()
  narrativeReport?: string;
}
