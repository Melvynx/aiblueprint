---
description: Reference document listing all recommended tools and libraries for AIBlueprint development
---

# AIBlueprint Tools & Libraries Reference

This document lists all recommended tools and libraries for development with the AIBlueprint stack. Use this as a reference when making architecture decisions.

## Quick Reference Table

| Name | Description | Tags |
|------|-------------|------|
| [Next.js](https://nextjs.org/) | Main React framework with App Router | `framework`, `frontend`, `backend` |
| [TanStack Query](https://tanstack.com/query) | Data fetching & caching for API routes | `frontend`, `library` |
| [Zustand](https://zustand.docs.pmnd.rs/) | Client-side state management | `frontend`, `library` |
| [nuqs](https://nuqs.47ng.com/) | URL state management | `frontend`, `library` |
| [shadcn/ui](https://ui.shadcn.com/) | Customizable React components | `frontend`, `library` |
| [Convex](https://www.convex.dev/) | Realtime database & backend | `backend`, `database`, `realtime` |
| [Liveblocks](https://liveblocks.io/) | Multiplayer collaboration features | `frontend`, `backend`, `realtime` |
| [Neon](https://neon.tech/) | Serverless PostgreSQL | `backend`, `database`, `sql` |
| [Supabase](https://supabase.com/) | PostgreSQL + Backend as a Service | `backend`, `database`, `sql` |
| [Prisma](https://prisma.io/) | Type-safe ORM (recommended for teams) | `backend`, `database`, `orm` |
| [Drizzle ORM](https://orm.drizzle.team/) | Lightweight type-safe ORM | `backend`, `database`, `orm` |
| [Better Auth](https://www.better-auth.com/) | Complete authentication solution | `backend`, `library` |
| [Inngest](https://www.inngest.com/) | Background jobs & workflows | `backend`, `service` |
| [Next Safe Action](https://next-safe-action.dev/) | Secure Server Actions | `backend`, `library` |
| [next-zod-route](https://github.com/Melvynx/next-zod-route) | Secure API Routes | `backend`, `library` |
| [Zod](https://zod.dev/) | Runtime validation (v4) | `library`, `validation` |
| [AI SDK](https://ai-sdk.dev/) | LLM integration wrapper | `backend`, `frontend`, `library` |
| [up-fetch](https://github.com/L-Blondy/up-fetch) | Modern fetch wrapper | `backend`, `frontend`, `library` |
| [Vitest](https://vitest.dev/) | Fast unit testing | `testing`, `library` |
| [Playwright](https://playwright.dev/) | E2E testing | `testing`, `library` |
| [Sentry](https://sentry.io/) | Error tracking & monitoring | `monitoring`, `service` |
| [Resend](https://resend.com/) | Developer email service | `email`, `service` |
| [React Email](https://react.email/) | Email templates in React | `email`, `library` |
| [AWS SES](https://aws.amazon.com/ses/) | High-volume email | `email`, `service` |
| [Stripe](https://stripe.com/) | Complete payment solution | `payment`, `service` |
| [Lemon Squeezy](https://lemonsqueezy.com/) | Payments with tax handling | `payment`, `service` |
| [PostHog](https://posthog.com/) | Product analytics | `analytics`, `service` |
| [Plausible](https://plausible.io/) | Simple web analytics | `analytics`, `service` |
| [React Hook Form](https://react-hook-form.com/) | Form management (recommended) | `frontend`, `library`, `forms` |
| [TanStack Form](https://tanstack.com/form) | Headless form management | `frontend`, `library`, `forms` |
| [Uploadthing](https://uploadthing.com/) | Simple file uploads | `upload`, `images`, `service` |
| [Cloudflare R2](https://developers.cloudflare.com/r2/) | S3-compatible storage | `backend`, `images`, `storage` |
| [AWS S3](https://aws.amazon.com/s3/) | Object storage standard | `storage`, `images`, `infra` |

## Categories

### Framework & Frontend
- **Next.js** - Main framework
- **TanStack Query** - Data fetching & cache
- **Zustand** - Client state management
- **nuqs** - URL state
- **shadcn/ui** - UI components

### Backend & API
- **Next Safe Action** - Secure Server Actions
- **next-zod-route** - Secure API Routes
- **Better Auth** - Authentication
- **AI SDK** - LLM integration
- **up-fetch** - HTTP client

### Database & ORM
- **Neon** - Serverless PostgreSQL (recommended)
- **Supabase** - PostgreSQL + BaaS
- **Prisma** - Type-safe ORM (recommended for teams)
- **Drizzle ORM** - Lightweight ORM (recommended for performance)

### Realtime & Collaboration
- **Convex** - Realtime database + backend (recommended for realtime apps)
- **Liveblocks** - Multiplayer collaboration (cursors, presence, comments)

### Validation & Forms
- **Zod** - Data validation (v4)
- **React Hook Form** - Form management (recommended)
- **TanStack Form** - Modern alternative

### Testing
- **Vitest** - Unit tests
- **Playwright** - E2E tests

### Monitoring & Analytics
- **Sentry** - Error tracking & performance
- **PostHog** - Product analytics (recommended)
- **Plausible** - Simple web analytics

### Payments
- **Stripe** - Complete solution (recommended for flexibility)
- **Lemon Squeezy** - Simple + handles taxes (recommended for solopreneurs)

### Email
- **Resend** - Transactional emails (recommended)
- **React Email** - Email templates in React
- **AWS SES** - High volume

### Images & Upload
- **Uploadthing** - Simple Next.js uploads (recommended)
- **Cloudflare R2** - Cheap object storage
- **AWS S3** - Standard object storage

### Services & Infrastructure
- **Inngest** - Async jobs & workflows
- **Cloudflare Browser Rendering** - Serverless scraping

## Recommended Stack

### Frontend
- Next.js + TanStack Query + Zustand + shadcn/ui
- React Hook Form + Zod

### Backend
- Neon (DB) + Prisma or Drizzle (ORM)
- Next Safe Action + Better Auth
- Resend + React Email

### Services
- Stripe (payments)
- Uploadthing (upload)
- Cloudflare R2 (storage)
- PostHog (analytics)
- Sentry (monitoring)

### Testing
- Vitest + Playwright

## Decision Guide

| Decision | Recommendation |
|----------|----------------|
| Database | Neon + Prisma to start, Drizzle for performance |
| Realtime | Convex for full realtime, Liveblocks for collaboration only |
| Email | Resend to start, AWS SES for >100k/month |
| Payments | Stripe for flexibility, Lemon Squeezy for tax simplicity |
| Analytics | PostHog for product analytics, Plausible for simple web analytics |
| Forms | React Hook Form (standard), TanStack Form (more control) |
| ORM | Prisma (better DX), Drizzle (better perf, 2-3x faster) |
| Upload | Uploadthing (simple), R2/S3 (more control) |
| Testing | Vitest (unit), Playwright (E2E, more reliable than Cypress) |

## Important Notes

- **Zod**: Now v4, specify version to AI
- **Supabase Auth**: Prefer Better-Auth for flexibility
- **Convex vs Neon+Liveblocks**: Convex if entire app is realtime, Neon+Liveblocks if only some features need collaboration
- **AWS S3**: Watch egress costs, prefer R2 for serving assets
- **Stripe Tax**: Enable for automatic tax handling
- **Sentry**: Configure source maps for real stack traces
- **Prisma vs Drizzle**: Prisma = better DX, Drizzle = better perf
