# App Hockey Gars - Structure Production

Base propre Next.js pour la version réelle du portail hockey (participant, coach, administration), sans données test codées en dur.

Cette version inclut déjà:

- Persistance PostgreSQL via Prisma.
- Authentification par mot de passe hashé + cookie de session signé (JWT HTTP-only).
- Contrôle d'accès par rôle (participant, coach, admin) sur pages et APIs.

## Prérequis

- Node.js 20+
- npm 10+

## Installation

```bash
npm install
copy .env.example .env.local
```

Remplir ensuite les variables de `.env.local` avec les vraies valeurs d'infrastructure.

## Setup Neon (exact, simple)

1. Créer un projet sur Neon.
2. Ouvrir la section connection string et copier l'URL PostgreSQL Prisma.
3. Coller cette valeur dans `DATABASE_URL` de `.env.local`.
4. Vérifier que l'URL contient `sslmode=require`.
5. Générer un secret fort:

```bash
npm run auth:secret
```

6. Copier le secret affiché dans `AUTH_SECRET`.
7. Vérifier les variables:

```bash
npm run env:validate
```

8. Initialiser la base:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

9. Démarrer l'app:

```bash
npm run dev
```

Voir le résumé guidé à tout moment:

```bash
npm run setup:next-steps
```

## PostgreSQL local (option rapide)

```bash
docker compose up -d
```

Exemple de `DATABASE_URL` local:

```text
DATABASE_URL="postgresql://app_hockey_user:app_hockey_password@localhost:5432/app_hockey?schema=public"
```

## Initialiser la base

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

## Lancement

```bash
npm run dev
```

Application locale: `http://localhost:3000`

## Scripts

- `npm run dev` : serveur de développement
- `npm run build` : build production
- `npm run start` : exécuter le build
- `npm run lint` : contrôle qualité ESLint
- `npm run auth:secret` : générer un secret AUTH_SECRET
- `npm run env:validate` : vérifier les variables obligatoires
- `npm run setup:next-steps` : afficher la checklist Neon guidée
- `npm run db:generate` : génération client Prisma
- `npm run db:migrate` : migration locale PostgreSQL
- `npm run db:seed` : création des comptes/données initiales

## Architecture

- `src/app` : routes App Router
- `src/app/(dashboard)/participant` : placeholder dashboard participant
- `src/app/(dashboard)/coach` : sélection d'athlète + vue documents
- `src/app/(dashboard)/admin` : indicateurs consolidés
- `src/app/api` : endpoints auth, participants, documents
- `src/components` : UI, login, logout, vue documents
- `src/lib` : DB Prisma, auth serveur, session, sécurité mot de passe
- `src/server` : interfaces de repository métier
- `src/types` : types métier
- `prisma` : schéma PostgreSQL + seed

## Variables d'environnement

Voir `.env.example`.

- `DATABASE_URL`
- `AUTH_SECRET`
- `STORAGE_PROVIDER`
- `STORAGE_BUCKET`
- `SESSION_MAX_AGE_SECONDS`
- `R2_ACCOUNT_ID` (optionnel pour l'étape stockage PDF)
- `R2_ACCESS_KEY_ID` (optionnel)
- `R2_SECRET_ACCESS_KEY` (optionnel)
- `R2_ENDPOINT` (optionnel)

## Prochaines étapes (version réelle)

- Connecter un stockage PDF sécurisé (bucket privé, URLs signées).
- Ajouter journalisation des accès documents et actions admin.
- Mettre en place politique de conservation/suppression des données.
- Ajouter rotation planifiée des secrets et politique de renouvellement des mots de passe.

## Loi 25 (points de départ)

- Documenter les finalités de collecte et d'accès.
- Limiter les accès strictement au rôle et au groupe.
- Prévoir un registre d'incidents et un plan de réponse.
- Définir les durées de conservation et la procédure d'effacement.
