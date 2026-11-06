# DPI CHREIN — Sécurité, Contrôle d'Accès et Protection des Données de Santé

**Établissement** : Centre Hospitalier Régional El Hadji Ibrahima Niass (CHREIN Kaolack)  
**Normes de Référence** : Sécurité des SI Hospitaliers, Règlementation relative aux Données de Santé Personnelles (CDP Sénégal), Confidentialité Médicale.

---

## 1. Matrice des Droits et Rôles (RBAC Hospitalier)

| Rôle | Consultation Patients | Prescription Explorations | Saisie Constantes / Soins | Saisie Résultats Labo | Validation Médicale Résultats | Administration Structure |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **SUPER_ADMIN** | Consultation globale | Non | Non | Non | Audit technique | Oui (Toutes) |
| **STRUCTURE_ADMIN** | Périmètre CHREIN | Non | Non | Non | Oui (Supervision) | Oui (CHREIN) |
| **CLINICIAN** (Médecin) | Dossiers suivis | **OUI** | OUI | OUI | **OUI (Obligatoire)** | Non |
| **NURSE** (Infirmier) | Dossiers hospitalisés | Non | **OUI** | Non | **NON (403)** | Non |
| **SECRETARY** (Secrétaire) | Identité & RDV | Non | Non | Non | **NON (403 Stricte)**| Non |
| **LABORATORY** (Biologiste) | Dossiers avec demande | Non | Non | **OUI** | Soumission uniquement | Non |
| **VIEWER** | Lecture autorisée | Non | Non | Non | **NON (403)** | Non |

### Règle d'or de la Validation Médicale
> **Tout appel de validation de résultat (`POST /api/v1/explorations/:id/results/validate`) par un utilisateur ayant le rôle `SECRETARY`, `NURSE` ou `VIEWER` est bloqué côté serveur et retourne immédiatement un code HTTP 403 Forbidden.**

---

## 2. Hachage des Mots de Passe & Authentification
- **Algorithme de hachage** : Argon2id (`v=19`, `m=65536`, `t=3`, `p=4`).
- **Access Token JWT** : Durée de vie courte (15 minutes). Transmis via l'en-tête `Authorization: Bearer <token>`.
- **Refresh Token** : Durée de vie 7 jours, stocké dans un cookie `HttpOnly`, `SameSite=Strict` et révocable en base de données.
- **Politique de verrouillage** : 5 tentatives infructueuses consécutives entraînent un blocage temporaire de 15 minutes.

---

## 3. Stockage Sécurisé des Documents Médicaux
- Les documents médicaux (clichés radiologiques DICOM/JPEG, rapports PDF, tracés EFR) ne sont **jamais** placés dans un répertoire public (`/public`).
- Ils sont chiffrés au repos et identifiés par une clé opaque `storageKey`.
- L'accès s'effectue via des URLs signées à usage unique valables 60 secondes.
- Intégrité vérifiée à chaque accès par hachage cryptographique **SHA-256**.

---

## 4. Piste d'Audit Immuable (Journalisation Réglementaire)
La table `audit_logs` enregistre de façon infalsifiable :
- L'identifiant de l'utilisateur (`userId`) et son rôle.
- L'action effectuée (`CREATION`, `PRELEVEMENT`, `SAISIE_RESULTAT`, `SOUMISSION`, `VALIDATION`, `AMENDEMENT`).
- L'entité ciblée et son identifiant unique.
- L'horodatage précis au milliseconde UTC (affiché en heure de Dakar).
- Les métadonnées non sensibles.
- Les journaux d'audit ne comportent aucune commande de suppression (`DELETE`) dans les API.
