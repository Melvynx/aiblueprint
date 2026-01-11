# Statusline Architecture - Session & Period Tracking

## Concepts Fondamentaux

### Session Claude Code

Une **session** est créée chaque fois qu'on ouvre un chat avec Claude Code.

Caractéristiques:
- **ID unique**: `session_id` (UUID)
- **Coût cumulatif**: Le coût total de la session qui AUGMENTE au fil du temps
- **Persistance**: Une session peut durer des heures/jours
- **Commande /clear**: Efface la conversation mais GARDE la même session
- **Le coût ne reset jamais**: Si une session a coûté $10, puis on fait /clear, le coût reste $10 et continue d'augmenter

```
Session "abc-123"
├── Début: $0
├── Après 1h: $5
├── /clear (conversation effacée)
├── Après 2h: $12 (coût continue d'augmenter)
├── Fermeture terminal
├── Réouverture (même session)
└── Après 3h: $18 (toujours cumulatif)
```

### Période (5 heures)

Une **période** est une fenêtre de 5 heures pour le rate limiting d'Anthropic.

Caractéristiques:
- **resets_at**: Timestamp de fin de période (ex: "2025-12-09T10:00:00.000Z")
- **Durée fixe**: 5 heures
- **Indépendant des sessions**: Les sessions peuvent traverser plusieurs périodes

```
Période A (05:00-10:00)     Période B (10:00-15:00)
├────────────────────┤     ├────────────────────┤
   Session 1: +$5              Session 1: +$3 (continue)
   Session 2: +$8              Session 3: +$10 (nouvelle)
   ─────────────               ─────────────
   Total: $13                  Total: $13
```

## Le Problème Actuel

### Bug: Double Comptage

Quand on calcule le coût d'une période en sommant les coûts totaux des sessions:

```
Session X: coût total = $24
Session X: last_resets_at = période actuelle

getCurrentPeriodCost() retourne $24 ❌ FAUX!
```

Mais si la session X avait déjà $10 AVANT cette période:
- Coût réel de cette période = $24 - $10 = $14
- On affiche $24 au lieu de $14 = **double comptage**

### Scénario Réel

```
1. Période A: Session X coûte $10, on compte $10 ✓
2. Période B commence
3. Session X continue, coût monte à $24
4. On calcule période B: on voit session X = $24
5. On affiche $24 pour période B ❌
6. Mais on avait déjà compté $10 en période A!
7. Total affiché: $10 + $24 = $34
8. Total réel: $24
```

## Solution: Tracking des Deltas par Session

### Nouvelle Structure de Données

On doit tracker pour chaque session:
- Combien on a DÉJÀ compté
- Dans quelle période on l'a compté

```sql
-- Table: sessions
session_id    TEXT PRIMARY KEY
total_cost    REAL        -- Coût total actuel de la session
cwd           TEXT
date          TEXT
duration_ms   INTEGER
lines_added   INTEGER
lines_removed INTEGER

-- Table: session_period_tracking
session_id    TEXT
period_id     TEXT        -- resets_at normalisé
counted_cost  REAL        -- Combien on a compté pour cette période
last_update   INTEGER     -- Timestamp
PRIMARY KEY (session_id, period_id)

-- Table: periods
period_id     TEXT PRIMARY KEY  -- resets_at normalisé
total_cost    REAL              -- Somme des deltas de toutes les sessions
utilization   INTEGER
date          TEXT
```

### Algorithme Correct

```
Quand saveSession(session_id, new_cost, current_period):
  1. Chercher session dans DB
  2. Si existe:
       old_cost = session.total_cost
       delta = new_cost - old_cost
     Sinon:
       delta = new_cost

  3. Chercher tracking pour (session_id, current_period)
  4. Si existe:
       // Déjà compté dans cette période, calculer le vrai delta
       already_counted = tracking.counted_cost
       period_delta = delta  // Le delta depuis la dernière update
     Sinon:
       // Nouvelle session dans cette période
       period_delta = delta

  5. Mettre à jour:
     - session.total_cost = new_cost
     - tracking.counted_cost += period_delta
     - period.total_cost += period_delta
```

### Exemple Concret

```
Session X traverse 2 périodes:

Période A:
  - Session X: $0 → $10
  - tracking(X, A).counted_cost = $10
  - period(A).total_cost = $10

Période B:
  - Session X: $10 → $24
  - delta = $24 - $10 = $14
  - tracking(X, B).counted_cost = $14
  - period(B).total_cost = $14

Calcul période B:
  - On lit period(B).total_cost = $14 ✓ CORRECT!
```

## Avantages SQLite

1. **Transactions ACID**: Pas de corruption de données
2. **Requêtes complexes**: Agrégations, joins faciles
3. **Index**: Performance pour les lookups par session_id
4. **Single file**: Toujours portable
5. **Intégrité référentielle**: FK entre tables

## Migration

1. Créer nouveau fichier `statusline.db`
2. Migrer données existantes de spend.json et daily-usage.json
3. Recalculer les period_costs correctement
4. Supprimer les anciens fichiers JSON
