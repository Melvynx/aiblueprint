# Outils et Librairies AIBlueprint

Ce document répertorie tous les outils et librairies recommandés pour le développement avec AIBlueprint.

## Tableau des outils disponibles

| Nom                                                                                  | Description                                                                                                                                                                                                                                                                                                                                               | Tags                                                                    | Tutoriel                                                                                                              |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [Next.js](https://nextjs.org/)                                                       | Le framework principal qui fait tourner l'application                                                                                                                                                                                                                                                                                                     | `NOW.TS`, `backend`, `framework`, `frontend`                            | [▶️ Voir le tuto](https://www.youtube.com/watch?v=bVlvMPaXEs4&t=2546s&pp=ygUObWVsdnlueCBuZXh0anM%3D)                  |
| [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)    | Librairie qui permet de fetch des données d'API Route et de venir les garder dans un "cache". Très utile pour la modification et la récupération de données.                                                                                                                                                                                              | `NOW.TS`, `frontend`, `library`                                         | [▶️ Voir le tuto](https://www.youtube.com/watch?v=LiEHntSffPk&pp=ygUTbWVsdnlueCByZWFjdCBxdWVyeQ%3D%3D)                |
| [Zustand](https://zustand.docs.pmnd.rs/)                                             | Librairie front-end qui permet de gérer un état compliqué côté client. Parfait si tu crées un éditeur complexe, et que tu as beaucoup de données qui vivent côté client.                                                                                                                                                                                  | `NOW.TS`, `frontend`, `library`                                         | [▶️ Voir le tuto](https://www.youtube.com/watch?v=JRGMte2Zq0k&t=431s&pp=ygUPbWVsdnlueCB6dXN0YW5k)                     |
| [nuqs](https://nuqs.47ng.com/)                                                       | Librairie pour afficher un state dans l'URL. Très pratique pour facilement partager des liens qui rendent la même chose. Évite de devoir remettre des filtres par exemple                                                                                                                                                                                 | `NOW.TS`, `frontend`, `library`                                         | [▶️ Voir le tuto](https://www.youtube.com/watch?v=zt18IWj9nF0&t=3s&pp=ygUWbWVsdnlueCBudXFzIHVybCBzdGF0ZQ%3D%3D)       |
| [shadcn/ui](https://ui.shadcn.com/)                                                  | Librairie de composant React facilement custom.                                                                                                                                                                                                                                                                                                           | `NOW.TS`, `frontend`, `library`                                         | [▶️ Voir le tuto](https://www.youtube.com/watch?v=sIKGWcLB2nY&t=1s&pp=ygURbWVsdnlueCBzaGFkY24gdWnSBwkJ_AkBhyohjO8%3D) |
| [Convex](https://www.convex.dev/)                                                    | Ce service permet de créer une database "realtime" très facilement. C'est à dire que quand les données changent dans ta database = elle change aussi côté frontend (chez le client). **LE MEILLEUR CHOIX pour les applications realtime** : chat, notifications live, dashboards temps réel, etc. Backend-as-a-Service avec TypeScript end-to-end.        | `NOW.TS`, `backend`, `database`, `service`, `realtime`                  | [▶️ Voir le tuto](https://www.youtube.com/watch?v=B2TU5p0pW8Q&pp=ygUObWVsdnlueCBjb252ZXg%3D)                          |
| [Liveblocks](https://liveblocks.io/)                                                 | LA solution pour ajouter de la collaboration temps réel dans ton app : cursors multiplayer, présence utilisateurs, comments, notifications. Parfait pour des éditeurs collaboratifs (comme Figma/Notion). S'intègre avec React, Next.js. Gère la synchronisation, les conflits, et la persistence automatiquement.                                        | `NOW.TS`, `frontend`, `backend`, `service`, `realtime`, `collaboration` | -                                                                                                                     |
| [Neon](https://neon.tech/)                                                           | Service qui permet de créer une database (PostgresQL). Pas chère et optimisée pour les développeurs. Tu peux commencer gratuitement et payer que quand tu as des utilisateurs.                                                                                                                                                                            | `NOW.TS`, `backend`, `database`, `service`, `sql`                       | [▶️ Voir le tuto](https://www.youtube.com/watch?v=OSkJIyRMqM0&pp=ygURbWVsdnlueCBuZW9uIHRlY2g%3D)                      |
| [Supabase](https://supabase.com/)                                                    | Service qui permet aussi d'avoir une database PostgresQL pour 20$ / mois ou gratuitement. Parfais pour commencer, très actif dans la communauté. Je conseil d'utiliser le service avec Prisma et de ne pas utiliser leur authentification, préférer Better-Auth.                                                                                          | `backend`, `database`, `service`, `sql`                                 | -                                                                                                                     |
| [Prisma](https://prisma.io/)                                                         | ORM moderne et type-safe pour TypeScript. Génère automatiquement les types depuis ton schéma. Migrations faciles, excellent DX, Prisma Studio pour visualiser ta DB. Plus "abstraction" que Drizzle, parfait pour les équipes.                                                                                                                            | `NOW.TS`, `backend`, `database`, `orm`, `library`                       | -                                                                                                                     |
| [Drizzle ORM](https://orm.drizzle.team/)                                             | ORM ultra-léger (~7kb) et type-safe. Plus proche du SQL brut que Prisma. Meilleure performance, requêtes plus prévisibles. Parfait si tu connais SQL et veux garder le contrôle. Inclut Drizzle Studio pour visualiser ta DB.                                                                                                                             | `NOW.TS`, `backend`, `database`, `orm`, `library`                       | -                                                                                                                     |
| [Better Auth](https://www.better-auth.com/)                                          | Cette librairie permet de gérer l'authentification de ton application. Elle contient aussi des plugins pour gérer les organisations, les permissions, l'OTP email, l'OTP par téléphone, les sessions, le password management, les rate limits, les API keys et j'en passe.                                                                                | `NOW.TS`, `backend`, `library`                                          | [▶️ Voir le tuto](https://www.youtube.com/watch?v=Z_B97Ra_A8I&pp=ygUTbWVsdnlueCBiZXR0ZXItYXV0aA%3D%3D)                |
| [Inngest](https://www.inngest.com/)                                                  | Service qui permet de gérer des "jobs" asynchrones. Typiquement, si tu veux faire un workflow IA complexe, un workflow e-mail qui a des conditions et j'en passe, c'est parfait pour ton cas. J'utilise Inngest, par exemple, quand tu t'inscris à mes e-mails, toutes les automatisations e-mails automatiquement que tu reçois sont gérées par Inngest. | `backend`, `service`                                                    | [▶️ Voir le tuto](https://www.youtube.com/watch?v=mcfUbKjqads&t=945s&pp=ygUPbWVsdnlueCBpbm5nZXN0)                     |
| [Next Safe Action](https://next-safe-action.dev/)                                    | Cette library permet d'utiliser les Server Functions de React, des functions qu'on peut appeler côté client et qui permettent d'intéragir avec notre backend. Par défaut, elle manque cruellement de sécurité et cette librairy s'assure que tu sécurises correctement ton application.                                                                   | `NOW.TS`, `backend`, `library`                                          | [▶️ Voir le tuto](https://www.youtube.com/watch?v=MwRtDekHELs&t=423s&pp=ygUWbWVsdnlueCBuZXh0c2FmZWFjdGlvbg%3D%3D)     |
| [next-zod-route](https://github.com/Melvynx/next-zod-route)                          | Cette library est similaire à NextSafeAction, à la différence qu'elle est faite pour les API Routes. Elle permet de valider les données et aussi de venir ajouter des middlewares pour sécuriser les méthodes.                                                                                                                                            | `NOW.TS`, `backend`, `library`                                          | [▶️ Voir le tuto](https://www.youtube.com/watch?v=MwRtDekHELs&t=423s&pp=ygUWbWVsdnlueCBuZXh0c2FmZWFjdGlvbg%3D%3D)     |
| [Zod](https://zod.dev/)                                                              | Cette library permet de facilement valider des données. Attention elle est récemment passé en version 4 et il faut le préciser à l'IA quand tu l'utilises.                                                                                                                                                                                                | `NOW.TS`, `library`, `validation`                                       | [▶️ Voir le tuto](https://www.youtube.com/watch?v=haJq2YXLgmk&t=325s&pp=ygUMbWVsdnlueCB6b2Qg)                         |
| [AI SDK](https://ai-sdk.dev/)                                                        | Outil qui permet de facilement utiliser des LLMs via un "wrapper" qui unifie les API et les manières de faire. Parfait pour intégrer OpenAI, Anthropic, Google, etc. dans ton app.                                                                                                                                                                        | `NOW.TS`, `backend`, `frontend`, `library`                              | -                                                                                                                     |
| [Axios](https://axios-http.com/)                                                     | Client HTTP simple et populaire pour faire des requêtes API. Plus de features que fetch natif (interceptors, timeouts, automatic transforms). Se marie bien avec TanStack Query.                                                                                                                                                                          | `frontend`, `backend`, `library`                                        | -                                                                                                                     |
| [up-fetch](https://github.com/L-Blondy/up-fetch)                                     | Librairie avancée qui permet de gérer le fetch des données dans notre application. Se marie à la perfection avec Tanstack/Query ! Alternative moderne à Axios avec une API plus simple.                                                                                                                                                                   | `NOW.TS`, `backend`, `frontend`, `library`                              | -                                                                                                                     |
| [Vitest](https://vitest.dev/)                                                        | Framework de test unitaire ultra-rapide, compatible avec Vite. Alternative moderne à Jest, avec une API similaire mais beaucoup plus performant. Compatible avec Next.js et React. Essentiel pour tester tes fonctions et composants.                                                                                                                     | `NOW.TS`, `testing`, `library`                                          | -                                                                                                                     |
| [Playwright](https://playwright.dev/)                                                | Framework de test End-to-End (E2E) qui permet de tester ton application comme un vrai utilisateur. Supporte Chrome, Firefox, Safari. Idéal pour tester des flows complets (signup, checkout, etc.). Plus moderne et fiable que Cypress.                                                                                                                   | `NOW.TS`, `testing`, `library`                                          | -                                                                                                                     |
| [Sentry](https://sentry.io/)                                                         | LA solution de monitoring d'erreurs et de performance. Capture automatiquement les bugs, les stack traces, et inclut Session Replay pour voir ce que l'utilisateur a fait avant l'erreur. Essentiel pour la production. Intégration Next.js excellente.                                                                                                   | `NOW.TS`, `monitoring`, `service`                                       | -                                                                                                                     |
| [Resend](https://resend.com/)                                                        | LE service d'email pour développeurs. API simple, excellente deliverabilité, fabriqué par l'équipe derrière Vercel. Parfait pour les emails transactionnels (confirmations, notifications, reset password). Tier gratuit très généreux.                                                                                                                   | `NOW.TS`, `email`, `service`                                            | -                                                                                                                     |
| [React Email](https://react.email/)                                                  | Permet de créer des templates email en React/TypeScript au lieu de HTML old-school. Se marie parfaitement avec Resend. Tu codes tes emails comme des composants React ! Inclut un preview server pour tester.                                                                                                                                             | `NOW.TS`, `email`, `library`                                            | -                                                                                                                     |
| [AWS SES](https://aws.amazon.com/ses/)                                               | Amazon Simple Email Service - Service d'envoi d'emails transactionnels et marketing. Moins cher que Resend mais plus complexe à configurer. Bon pour de gros volumes (millions d'emails). Attention à bien configurer SPF/DKIM pour la réputation de ton domaine.                                                                                         | `email`, `service`, `aws`                                               | -                                                                                                                     |
| [Stripe](https://stripe.com/)                                                        | LE leader des paiements en ligne. Maximum de contrôle et de flexibilité. Supporte 135+ devises, cartes, wallets (Apple Pay, Google Pay), SEPA, et bien plus. API excellente, documentation top. Gère les abonnements, invoices, taxes (Stripe Tax). Webhooks fiables.                                                                                     | `NOW.TS`, `payment`, `service`                                          | -                                                                                                                     |
| [Lemon Squeezy](https://lemonsqueezy.com/)                                           | Alternative à Stripe qui agit comme "Merchant of Record" : ils gèrent automatiquement la TVA/taxes dans tous les pays. Parfait pour solopreneurs et petites équipes qui ne veulent pas gérer la compliance fiscale internationale. Plus simple mais moins flexible que Stripe.                                                                            | `payment`, `service`                                                    | -                                                                                                                     |
| [PostHog](https://posthog.com/)                                                      | Plateforme d'analytics produit open-source. Inclut product analytics, session replay, feature flags, A/B testing, et surveys. Alternative privacy-first à Google Analytics + Mixpanel. Peut être self-hosted. Free tier généreux. Intégration Next.js native.                                                                                             | `NOW.TS`, `analytics`, `service`                                        | -                                                                                                                     |
| [Plausible](https://plausible.io/)                                                   | Analytics web ultra-simple et privacy-first. GDPR compliant by design, pas de cookies, script ultra-léger (<1kb). Parfait si tu veux juste savoir combien de visiteurs tu as sans la complexité de Google Analytics. Open-source, peut être self-hosted.                                                                                                  | `analytics`, `service`                                                  | -                                                                                                                     |
| [React Hook Form](https://react-hook-form.com/)                                      | LA librairie standard pour gérer les formulaires en React. Ultra-performante (uncontrolled components), très peu de re-renders. S'intègre parfaitement avec Zod pour la validation. Moins de boilerplate que Formik. API simple et intuitive.                                                                                                             | `NOW.TS`, `frontend`, `library`, `forms`                                | -                                                                                                                     |
| [TanStack Form](https://tanstack.com/form/latest)                                    | Librairie de gestion de formulaires headless par l'équipe TanStack. Très flexible, type-safe, framework-agnostic. Bonne pour des formulaires complexes avec validation custom. Alternative plus récente à React Hook Form avec plus de contrôle.                                                                                                          | `NOW.TS`, `frontend`, `library`, `forms`                                | -                                                                                                                     |
| [Uploadthing](https://uploadthing.com/)                                              | Service d'upload de fichiers ultra-simple pour Next.js. Drop-in component, gère automatiquement le resize/optimization d'images, supporte tous types de fichiers. Alternative moderne à Cloudinary pour l'upload. Free tier généreux, pricing simple.                                                                                                     | `NOW.TS`, `upload`, `images`, `service`                                 | -                                                                                                                     |
| [AWS S3](https://aws.amazon.com/s3/)                                                 | Amazon Simple Storage Service - LE standard de l'industrie pour le stockage d'objets. Très fiable (99.999999999% durability), scalable à l'infini, mais plus complexe à configurer que R2 ou Uploadthing. Prix compétitifs à gros volume. Nécessite bien gérer les permissions IAM.                                                                       | `storage`, `images`, `infra`, `aws`                                     | -                                                                                                                     |
| [Cloudflare R2](https://developers.cloudflare.com/r2/)                               | Service de stockage d'objets S3-compatible. Le moins cher du marché pour stocker des fichiers (images, videos, documents) : pas de frais d'egress (sortie de données) ! Alternative à AWS S3. API compatible S3. Parfait pour servir des assets statiques.                                                                                                | `NOW.TS`, `backend`, `images`, `infra`, `storage`                       | -                                                                                                                     |
| [Cloudflare Browser Rendering](https://developers.cloudflare.com/browser-rendering/) | Outil de Cloudflare qui permet de faire du scraping sur des sites web, comme des screenshot ou autre. Très pratique pour du ServerLess avec Vercel pour être capable de faire du scraping facilement sans gérer des instances Puppeteer.                                                                                                                  | `backend`, `infra`                                                      | -                                                                                                                     |

## Catégories

### 🎨 Framework & Frontend

- **Next.js** - Framework principal
- **TanStack Query** - Data fetching & cache
- **Zustand** - State management
- **nuqs** - URL state
- **shadcn/ui** - Composants UI

### 🔐 Backend & API

- **Next Safe Action** - Server Actions sécurisées
- **next-zod-route** - API Routes sécurisées
- **Better Auth** - Authentification complète
- **AI SDK** - Intégration LLMs
- **Axios** - Client HTTP
- **up-fetch** - Client HTTP moderne

### 🗄️ Database & ORM

- **Neon** - PostgreSQL serverless
- **Supabase** - PostgreSQL + Backend as a Service
- **Prisma** - ORM type-safe (recommandé pour équipes)
- **Drizzle ORM** - ORM léger proche SQL (recommandé pour perf)

### ⚡ Realtime & Collaboration

- **Convex** - Database realtime + Backend (recommandé pour apps realtime)
- **Liveblocks** - Collaboration multiplayer (cursors, presence, comments)

### ✅ Validation & Formulaires

- **Zod** - Validation de données (v4)
- **React Hook Form** - Gestion de formulaires (recommandé)
- **TanStack Form** - Alternative moderne

### 🧪 Testing

- **Vitest** - Tests unitaires
- **Playwright** - Tests E2E

### 📊 Monitoring & Analytics

- **Sentry** - Error tracking & performance
- **PostHog** - Product analytics (recommandé)
- **Plausible** - Web analytics simple

### 💳 Paiements

- **Stripe** - Solution complète (recommandé pour flexibilité)
- **Lemon Squeezy** - Simple + gère les taxes (recommandé pour solopreneurs)

### 📧 Email

- **Resend** - Emails transactionnels (recommandé)
- **React Email** - Templates email en React
- **AWS SES** - Gros volumes

### 🖼️ Images & Upload

- **Uploadthing** - Upload simple Next.js (recommandé)
- **Cloudflare R2** - Stockage objets pas cher
- **AWS S3** - Stockage objets standard

### ⚙️ Services & Infrastructure

- **Inngest** - Jobs asynchrones & workflows
- **Cloudflare Browser Rendering** - Scraping serverless

## Notes importantes

### 🎯 Stack recommandée NOW.TS

Pour un projet NOW.TS typique, voici la stack recommandée :

**Frontend**

- Next.js + TanStack Query + Zustand + shadcn/ui
- React Hook Form + Zod

**Backend**

- Neon (DB) + Prisma ou Drizzle (ORM)
- Next Safe Action + Better Auth
- Resend + React Email

**Services**

- Stripe (paiements)
- Uploadthing (upload)
- Cloudflare R2 (storage)
- PostHog (analytics)
- Sentry (monitoring)

**Testing**

- Vitest + Playwright

### 💡 Conseils

- **Database** : Utilise Neon + Prisma pour commencer, passe à Drizzle si tu as besoin de performance
- **Realtime** : Convex pour app complète realtime (chat, dashboard live), Liveblocks pour collaboration multiplayer (éditeurs)
- **Emails** : Resend est parfait pour commencer, AWS SES pour gros volumes (>100k/mois)
- **Paiements** : Stripe si tu as besoin de flexibilité, Lemon Squeezy si tu veux éviter la complexité fiscale
- **Analytics** : PostHog pour product analytics, Plausible pour web analytics simple
- **Forms** : React Hook Form est le standard, TanStack Form si tu veux plus de contrôle
- **ORM** : Prisma = plus simple, Drizzle = plus performant et proche SQL
- **Upload** : Uploadthing pour la simplicité, R2/S3 pour plus de contrôle
- **Testing** : Vitest pour unit tests, Playwright pour E2E (plus fiable que Cypress)

### ⚠️ Points d'attention

- **Zod** : Passe en v4, précise la version à l'IA
- **Supabase Auth** : Préfère Better-Auth pour plus de flexibilité
- **Convex vs Neon+Liveblocks** : Convex si toute ton app est realtime, Neon+Liveblocks si seulement certaines features ont besoin de collaboration
- **AWS S3** : Attention aux coûts d'egress, préfère R2 pour servir des assets
- **Stripe Tax** : Active Stripe Tax pour gérer automatiquement les taxes
- **Sentry** : Configure les source maps pour avoir les vraies stack traces
- **Prisma vs Drizzle** : Prisma = meilleur DX, Drizzle = meilleure perf (2-3x plus rapide)
