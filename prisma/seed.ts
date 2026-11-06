// Prisma Seed Script — DPI CHREIN (Kaolack, Sénégal)
// Initialise les structures, services, utilisateurs médicaux et dossiers cliniques de test.

import { PrismaClient, Role, EntityStatus, ExplorationCategory, ExplorationPriority, ExplorationStatus, ResultStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Initialisation des données de démonstration DPI CHREIN ---');

  // 1. Structure Hospitalière
  const chrein = await prisma.structure.upsert({
    where: { code: 'CHREIN_KAOLACK' },
    update: {},
    create: {
      nom: 'Centre Hospitalier Régional El Hadji Ibrahima Niass',
      code: 'CHREIN_KAOLACK',
      adresse: 'Boulevard El Hadji Ibrahima Niass, BP 24, Kaolack, Sénégal',
      telephone: '+221 33 941 10 20',
      statut: EntityStatus.ACTIVE
    }
  });

  // 2. Services
  const pneumoService = await prisma.service.upsert({
    where: { structureId_code: { structureId: chrein.id, code: 'PNEUMO_INFECTIEUX' } },
    update: {},
    create: {
      structureId: chrein.id,
      nom: 'Service de Pneumologie & Maladies Infectieuses',
      code: 'PNEUMO_INFECTIEUX',
      statut: EntityStatus.ACTIVE
    }
  });

  // 3. Utilisateurs et Rôles
  // Mot de passe démonstration sécurisé haché (Argon2id équivalent)
  const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dHJ1c3RlZHNlZWRjaHJlaW4$uQjE70v8K7hFj6G5H3I7qXv9P1s8mZ4oQ9l6yN3tK0M';

  const doctorNdao = await prisma.user.upsert({
    where: { login: 'cndao' },
    update: {},
    create: {
      nom: 'Ndao',
      prenom: 'Cheikh',
      login: 'cndao',
      passwordHash: dummyHash,
      role: Role.CLINICIAN,
      structureId: chrein.id,
      serviceId: pneumoService.id,
      actif: true
    }
  });

  const nurseSarr = await prisma.user.upsert({
    where: { login: 'fbsarr' },
    update: {},
    create: {
      nom: 'Sarr',
      prenom: 'Fatou Binetou',
      login: 'fbsarr',
      passwordHash: dummyHash,
      role: Role.NURSE,
      structureId: chrein.id,
      serviceId: pneumoService.id,
      actif: true
    }
  });

  const secretaryDiallo = await prisma.user.upsert({
    where: { login: 'adiallo' },
    update: {},
    create: {
      nom: 'Diallo',
      prenom: 'Awa',
      login: 'adiallo',
      passwordHash: dummyHash,
      role: Role.SECRETARY,
      structureId: chrein.id,
      serviceId: pneumoService.id,
      actif: true
    }
  });

  // 4. Patients
  const patientDiop = await prisma.patient.upsert({
    where: { hospitalNumber: 'CHREIN-PNEUMO-2026-014' },
    update: {},
    create: {
      hospitalNumber: 'CHREIN-PNEUMO-2026-014',
      nom: 'Diop',
      prenom: 'Mamadou',
      dateNaissance: new Date('1980-05-12'),
      sexe: 'M',
      telephone: '+221 77 512 34 56',
      adresse: 'Quartier Médina Baye, Kaolack',
      profession: 'Commerçant',
      contactUrgenceNom: 'Awa Diop (Épouse)',
      contactUrgenceTel: '+221 77 622 11 00'
    }
  });

  // 5. Exploration Médicale Spécialisée : GeneXpert MTB/RIF Ultra
  const expGenexpert = await prisma.medicalExploration.upsert({
    where: { requestNumber: 'EXP-2026-0041' },
    update: {},
    create: {
      requestNumber: 'EXP-2026-0041',
      patientId: patientDiop.id,
      structureId: chrein.id,
      serviceId: pneumoService.id,
      requestedById: doctorNdao.id,
      category: ExplorationCategory.MICROBIOLOGIE,
      examType: 'GeneXpert MTB/RIF Ultra',
      clinicalIndication: 'Toux fébrile subaiguë > 3 semaines avec amaigrissement de 5 kg et sueurs nocturnes. Suspicion tuberculose pulmonaire.',
      priority: ExplorationPriority.URGENTE,
      status: ExplorationStatus.VALIDATED,
      specimenType: 'Crachats purulents matinaux x2',
      performingLaboratory: 'Unité PNT / Laboratoire de Bactériologie CHREIN',
      results: {
        create: {
          version: 1,
          structuredData: [
            { parameter: 'Mycobacterium tuberculosis complex (MTB)', value: 'DÉTECTÉ (High)', unit: '', referenceInterval: 'Non Détecté', flag: 'POSITIF' },
            { parameter: 'Résistance à la Rifampicine (RIF)', value: 'NON DÉTECTÉE (Sensible)', unit: '', referenceInterval: 'Non Détectée', flag: 'NORMAL' }
          ],
          narrativeResult: 'Test GeneXpert MTB/RIF Ultra réalisé sur expectoration prélevée à jeun. Présence abondante d\'ADN de M. tuberculosis sans mutation rpoB détectée.',
          conclusion: 'Tuberculose pulmonaire bactériologiquement confirmée (TPM+), souche sensible à la Rifampicine.',
          abnormalFlag: true,
          criticalFlag: false,
          enteredById: doctorNdao.id,
          validatedById: doctorNdao.id,
          validatedAt: new Date(),
          status: ResultStatus.VALIDATED
        }
      }
    }
  });

  // 6. Audit Trail Initial
  await prisma.auditLog.create({
    data: {
      userId: doctorNdao.id,
      structureId: chrein.id,
      action: 'EXPLORATION_VALIDATED',
      entityType: 'MedicalExploration',
      entityId: expGenexpert.id,
      metadata: {
        requestNumber: 'EXP-2026-0041',
        examType: 'GeneXpert MTB/RIF Ultra',
        protocol: 'PNT_SENEGAL_2026'
      }
    }
  });

  console.log('--- Initialisation terminée avec succès pour CHREIN Kaolack ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
