# DPI CHREIN — Architecture Technique et Décisions de Conception

**Centre Hospitalier Régional El Hadji Ibrahima Niass • Kaolack, Sénégal**  
**Service de Pneumologie & Maladies Infectieuses**  
**Version : 1.0 (Production-Ready)**

---

## 1. Vue d'Ensemble du Monorepo

Le projet est conçu selon une architecture Monorepo d'entreprise répondant aux normes des Systèmes d'Information Hospitaliers (SIH) modernes :

```text
dpi-chrein/
├── apps/
│   ├── web/                    # Frontend Next.js (App Router, Tailwind CSS, TypeScript)
│   └── api/                    # Backend NestJS (API REST versionnée /api/v1, Swagger, JWT)
├── packages/
│   └── shared/                 # Types, énumérations, règles de transition et contrats partagés
├── prisma/
│   ├── schema.prisma           # Schéma relationnel PostgreSQL strict avec UUIDs et audit
│   └── seed.ts                 # Données de démonstration cliniques pour CHREIN Kaolack
├── docs/
│   ├── ARCHITECTURE.md         # Document présent
│   ├── API_SWAGGER.md          # Spécification OpenAPI / Swagger 3.0
│   ├── SECURITY.md             # Matrice RBAC, politiques de session, chiffrement
│   └── TESTS.md                # Stratégie de tests unitaires, intégration et RBAC
├── docker-compose.yml          # Déploiement local orchestré (PostgreSQL 16, pgAdmin, API, Web)
├── server.ts                   # Serveur Express full-stack embarqué pour exécution web instantanée
└── src/                        # Interface clinique interactive riche déployée sous Vite/React
```

### Limitation de l'environnement sandbox AI Studio et Solution
Dans l'environnement de build Google AI Studio, un conteneur unique Node.js écoute sur le port 3000 (`tsx server.ts`). Pour concilier cette contrainte d'exécution immédiate avec l'exigence d'une architecture monorepo stricte :
1. **Fichiers source réels du monorepo** (`prisma/`, `apps/api/`, `packages/shared/`, `docker-compose.yml`, `docs/`) sont générés de manière exhaustive et prête pour la production.
2. **Serveur full-stack actif (`server.ts`)** intègre les endpoints de l'API REST `/api/v1/explorations` avec validation des rôles (RBAC), machine à états, calcul des versions V2+ et journal d'audit immuable.

---

## 2. Principes Fondamentaux de la Donnée Médicale

### A. Non-écrasement des données validées (Immutabilité clinique)
Un résultat médical validé par un clinicien ne peut **jamais** être écrasé ou modifié silencieusement en base de données. Toute révision passe par la création d'une version V2, V3 avec :
- Un motif d'amendement explicite et obligatoire (`amendmentReason`).
- L'archivage immuable de la version précédente dans la table `exploration_results`.
- Une notification dans la piste d'audit.

### B. Machine à États Rigoureuse du Workflow d'Exploration
```text
[REQUESTED] ──> [ACCEPTED] ──> [SPECIMEN_COLLECTED] ──> [IN_PROGRESS] ──> [RESULT_ENTERED]
     │                                                                           │
     ├──> [CANCELLED]                                                            ▼
     └──> [REJECTED]                                                       [SUBMITTED]
                                                                                 │
                                              ┌──────────────────────────────────┴──┐
                                              ▼                                     ▼
                                      [RESULT_ENTERED]                         [VALIDATED]
                                  (Demande de correction)                           │
                                                                                    ▼
                                                                                [AMENDED] (V2+)
```

---

## 3. Paramètres Régionaux et Cliniques (Kaolack / Sénégal)
- **Fuseau horaire** : `Africa/Dakar` (UTC+0).
- **Format des dates** : `JJ/MM/AAAA` (norme francophone).
- **Devise administrative** : FCFA (Franc CFA).
- **Unités de mesure** : Conservation scrupuleuse des unités fournies par l'automate ou le laboratoire (e.g. `g/dL`, `copies/mL`, `mmHg`, `L`, `%`).
- **Protocoles spécifiques** :
  - Dépistage Tuberculose par GeneXpert MTB/RIF Ultra (Programme National de Lutte contre la Tuberculose - PNT Sénégal).
  - Classification GOLD 2026 pour la BPCO.
  - Critères GINA 2026 pour l'asthme et la réversibilité spirométrique.
