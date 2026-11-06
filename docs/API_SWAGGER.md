# DPI CHREIN — Documentation API OpenAPI / Swagger (v1)

**Base URL** : `http://localhost:3000/api/v1` (ou `http://localhost:4000/api/v1` sous Docker NestJS)

---

## 1. Endpoints du Module Explorations Médicales

### `GET /api/v1/explorations`
Retourne la liste filtrée des demandes d'explorations médicales.
- **Paramètres de requête (Query params)** :
  - `category` (enum: `MICROBIOLOGIE`, `IMAGERIE`, `GAZOMETRIE`, `EFR_FONCTIONNEL`, etc.)
  - `status` (enum: `REQUESTED`, `IN_PROGRESS`, `SUBMITTED`, `VALIDATED`, etc.)
  - `priority` (enum: `NORMALE`, `URGENTE`, `CRITIQUE`)
  - `patientId` (UUID)
  - `search` (chaîne de recherche : numéro `EXP-2026-XXXX`, nom patient, examen)
- **Réponse 200** :
  ```json
  {
    "success": true,
    "count": 7,
    "data": [
      {
        "id": "exp-1",
        "requestNumber": "EXP-2026-0041",
        "patientName": "Mamadou Diop",
        "category": "MICROBIOLOGIE",
        "title": "GeneXpert MTB/RIF — Crachats du matin",
        "status": "VALIDATED",
        "priority": "URGENTE"
      }
    ]
  }
  ```

---

### `POST /api/v1/explorations`
Crée une nouvelle prescription d'exploration médicale.
- **Corps de la requête (Body)** :
  ```json
  {
    "patientId": "p1",
    "patientName": "Mamadou Diop",
    "category": "MICROBIOLOGIE",
    "title": "GeneXpert MTB/RIF Ultra",
    "clinicalIndication": "Suspicion tuberculose pulmonaire",
    "priority": "URGENTE",
    "prescribedById": "u1",
    "prescribedByName": "Dr. Cheikh Ndao"
  }
  ```
- **Réponse 201 Created** :
  ```json
  {
    "success": true,
    "data": {
      "id": "exp-1729860000",
      "requestNumber": "EXP-2026-0048",
      "status": "REQUESTED"
    }
  }
  ```

---

### `PATCH /api/v1/explorations/:id/status`
Fait avancer l'exploration dans le workflow (ex. enregistrement du prélèvement, réception au laboratoire).
- **Corps de la requête (Body)** :
  ```json
  {
    "status": "SPECIMEN_COLLECTED",
    "userId": "u3",
    "userName": "Mme Fatou Binetou Sarr",
    "userRole": "NURSE",
    "specimenDetails": {
      "specimenType": "Crachats purulents matinaux x2",
      "collectedAt": "2026-10-25T08:00:00Z",
      "collectedBy": "Mme Fatou Binetou Sarr"
    }
  }
  ```

---

### `POST /api/v1/explorations/:id/results`
Enregistre les valeurs structurées mesurées et le compte-rendu textuel.
- **Corps de la requête (Body)** :
  ```json
  {
    "parameters": [
      { "parameter": "Mycobacterium tuberculosis", "value": "DÉTECTÉ", "flag": "POSITIF" },
      { "parameter": "Résistance Rifampicine", "value": "NON DÉTECTÉE", "flag": "NORMAL" }
    ],
    "narrativeReport": "Présence abondante d'ADN de M. tuberculosis.",
    "conclusion": "Tuberculose confirmée TPM+",
    "hasAbnormalFlag": true,
    "hasCriticalFlag": false,
    "userId": "u-lab",
    "userName": "Technicien Labo PNT",
    "userRole": "LABORATORY"
  }
  ```

---

### `POST /api/v1/explorations/:id/results/validate` (Contrôle RBAC strict)
Valide médicalement le résultat.
- **Entêtes requis** : `Authorization: Bearer <JWT>` ou `X-User-Role: CLINICIAN`
- **Contrôle d'accès** :
  - Si le rôle est `SECRETARY` ou `VIEWER` : **HTTP 403 Forbidden** :
    ```json
    {
      "success": false,
      "error": "Erreur 403 Forbidden: Le rôle [SECRETARY] n'a pas les prérogatives médicales pour valider ce résultat."
    }
    ```
  - Si le rôle est `CLINICIAN` ou `STRUCTURE_ADMIN` : **HTTP 200 OK** :
    ```json
    {
      "success": true,
      "data": {
        "status": "VALIDATED",
        "validated": true,
        "validatedByDoctor": "Dr. Cheikh Ndao",
        "validationDate": "2026-10-25T10:00:00Z"
      }
    }
    ```

---

### `POST /api/v1/explorations/:id/results/amendments`
Crée un amendement version V2+ avec motif obligatoire.
- **Corps de la requête (Body)** :
  ```json
  {
    "amendmentReason": "Contrôle qualité interne : réévaluation du seuil de détection par le biologiste.",
    "parameters": [...],
    "conclusion": "Conclusion amendée...",
    "userId": "u1",
    "userName": "Dr. Cheikh Ndao",
    "userRole": "CLINICIAN"
  }
  ```
- **Réponse 200 OK** :
  ```json
  {
    "success": true,
    "version": 2,
    "data": {
      "status": "AMENDED",
      "currentVersion": 2
    }
  }
  ```

---

### `GET /api/v1/explorations/:id/history`
Retourne l'historique complet des versions et la piste d'audit immuable.
