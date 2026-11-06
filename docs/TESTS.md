# DPI CHREIN — Stratégie de Tests & Cahier de Recette

**Service de Pneumologie & Maladies Infectieuses — CHREIN Kaolack**

---

## 1. Tests Unitaires & d'Intégration du Module Explorations

### Test Suite 1 : Contrôle d'Accès RBAC (Refus 403 pour Rôles Non Autorisés)
```typescript
describe('ExplorationsController - RBAC Validation Guard', () => {
  it('doit refuser la validation médicale avec un code HTTP 403 si le rôle est SECRETARY', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/explorations/exp-3/results/validate')
      .set('X-User-Role', 'SECRETARY')
      .send({ doctorNotes: 'Tentative illicite de validation par secrétaire' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Erreur 403 Forbidden');
  });

  it('doit autoriser la validation médicale avec un code HTTP 200 si le rôle est CLINICIAN', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/explorations/exp-3/results/validate')
      .set('X-User-Role', 'CLINICIAN')
      .send({ doctorNotes: 'Validation clinique conforme par Dr. Touré' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('VALIDATED');
  });
});
```

---

### Test Suite 2 : Machine à États du Workflow
```typescript
describe('ExplorationsService - State Machine Transitions', () => {
  it('doit interdire la modification directe sans amendement d’un résultat VALIDATED', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/explorations/exp-1/results')
      .send({ parameters: [{ parameter: 'Test', value: '123' }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('déjà été validé médicalement');
  });

  it('doit exiger un motif explicite d’amendement pour créer une version V2+', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/explorations/exp-1/results/amendments')
      .set('X-User-Role', 'CLINICIAN')
      .send({ amendmentReason: '' }); // Motif vide

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('motif');
  });
});
```

---

### Test Suite 3 : Numérotation Unique Hospitalière
```typescript
describe('ExplorationsService - Unique Request Numbering', () => {
  it('doit générer un identifiant séquentiel conforme EXP-AAAA-XXXX', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/explorations')
      .send({
        patientId: 'p1',
        category: 'IMAGERIE',
        title: 'Scanner Thoracique Haute Résolution',
        clinicalIndication: 'Suspicion PID'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.requestNumber).toMatch(/^EXP-2026-\d{4}$/);
  });
});
```
