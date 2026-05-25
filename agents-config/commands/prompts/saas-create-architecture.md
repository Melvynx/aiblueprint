---
description: Design technical architecture for a Next.js SaaS application based on PRD requirements
---

<objective>
Design the complete technical architecture for a Next.js application based on the Product Requirements Document.

Define tool selection, technology stack decisions, infrastructure choices, and architecture patterns. Challenge every decision to ensure the best fit for specific needs. This comes AFTER the PRD - the PRD defines WHAT to build, this defines HOW to build it.
</objective>

<context>
Tools reference: @https://github.com/Melvynx/aiblueprint/blob/main/ai-coding/tools.md
</context>

<process>
## Phase 1: Read PRD

1. **Ask for PRD location**:
   > "Where is your PRD? Please provide the file path or paste the content."

2. **Extract from PRD**:
   - **Core Features**: What features drive architecture decisions
   - **User Personas**: Who uses this (impacts willingness to pay for tools)
   - **Success Metrics**: Performance/scale targets
   - **Timeline**: MVP timeline (impacts complexity decisions)
   - **Out of Scope**: What WON'T be built in v1

3. **Map technical implications**:
   - Real-time features → Need WebSocket/real-time database
   - File uploads → Need storage solution
   - AI features → Need LLM integration
   - Multi-user/teams → Need robust auth and permissions
   - High traffic → Need caching and performance optimization

## Phase 2: Read Tools Reference

4. **Fetch tools.md** - Read the complete tool reference at:
   https://github.com/Melvynx/aiblueprint/blob/main/ai-coding/tools.md

5. **Use as primary source** for tool recommendations

## Phase 3: Information Gathering

6. **Ask questions progressively** (don't ask all at once):

**Frontend Requirements**:
- UI component strategy? (shadcn/ui, custom, other)
- Client-side state management beyond React?
- URL state requirements? (filters, search, pagination)
- Data fetching pattern? (Server Components, TanStack Query, mix)

**Backend & API**:
- API pattern preference? (Server Actions, API Routes, both)
- External API access needed?
- Validation/security layer? (Zod, rate limiting)
- Third-party API integrations?

**Authentication & Authorization**:
- Authentication method? (email/password, OAuth, magic link, OTP)
- Organizations/team features?
- Permission model? (simple roles, complex RBAC, none)

**Database & Data**:
- Data type? (relational, document, real-time, files)
- SQL vs NoSQL preference?
- Real-time features? (live updates, collaborative editing)
- Expected data volume and query patterns?
- ORM preference? (Prisma, Drizzle)

**AI & LLM** (if applicable):
- AI features needed? (chat, completion, embeddings, vision)
- LLM providers? (OpenAI, Anthropic, multiple)
- Streaming responses needed?

**Infrastructure**:
- Deployment platform? (default: Vercel)
- Expected traffic/scale?
- Background jobs or cron tasks?
- Budget constraints?

**Additional**:
- Email sending? (transactional, marketing)
- File uploads/storage?
- Payment processing?
- Analytics/monitoring?

## Phase 4: Challenge Every Decision

7. **For EVERY tool choice**, challenge with:

**"Why This?" Challenge**:
- Why this tool specifically?
- What are the alternatives?
- What's the trade-off?

**"Do You Really Need It?" Challenge**:
- Can you ship without this?
- Is this solving a real problem or hypothetical future problem?
- What's the simplest solution that could work?

**"What's The Cost?" Challenge**:
- Learning curve for the team?
- Monetary cost at scale?
- Maintenance burden?

## Phase 5: Generate Architecture Document

8. **Only after gathering ALL information**, create ARCHI.md:

```markdown
# Technical Architecture: [Project Name]

## Architecture Overview

**Philosophy**: [2-3 sentences on approach and principles]

**Tech Stack Summary**:
- Framework: [e.g., Next.js 15 with App Router]
- Deployment: [e.g., Vercel serverless]
- Database: [e.g., Neon PostgreSQL with Prisma]
- Authentication: [e.g., Better Auth with email/password]

## Frontend Architecture

### Core Stack
- **Framework**: [Tool + version]
  - **Why**: [Specific reason]
  - **Trade-off**: [What you gain vs sacrifice]

- **UI Components**: [Tool]
  - **Why**: [Reason]
  - **Trade-off**: [Analysis]

### State Management
- **Global State**: [Tool or "React hooks only"]
- **Server State**: [Tool + pattern]
- **URL State**: [Tool or "Not needed"]

### Data Fetching Strategy
[Describe pattern - Server Components first, Client when needed, etc.]

## Backend Architecture

### API Layer
- **Pattern**: [Server Actions / API Routes / Both]
- **Validation**: [Tool]
- **Security**: [Rate limiting, CORS config]

### Authentication & Authorization
- **Provider**: [Tool] - **Why**: [Reason]
- **Method**: [Email/password, OAuth, etc.]
- **Authorization**: [Permission model description]

### Database & Data Layer
- **Database**: [Tool + type] - **Why**: [Reason]
- **ORM**: [Tool] - **Why**: [Justification]
- **Real-time**: [Tool/approach if needed]

### AI Integration (if applicable)
- **SDK**: [Tool]
- **Providers**: [Primary + fallback]
- **Use Cases**: [Feature → model mapping]

## Infrastructure & Deployment

- **Platform**: [Platform] - **Why**: [Reason]
- **Region Strategy**: [Single/multi/edge]
- **Background Jobs**: [Tool or "Not needed"]
- **Monitoring**: [Tools for app monitoring, errors, analytics]

## Additional Services

- **Email**: [Provider or "Not needed"]
- **Storage**: [Provider or "Not needed"]
- **Payments**: [Provider or "Not needed"]

## Architecture Decision Records

### ADR-001: [Key Decision Title]
- **Context**: [Why decision was needed]
- **Decision**: [What was decided]
- **Alternatives**: [What else was evaluated]
- **Rationale**: [Why this choice]
- **Consequences**: [Trade-offs]

## Folder Structure
[Project structure diagram]

## Cost Estimation

### Monthly at Scale
- Database: $[amount]
- Hosting: $[amount]
- [Other services]
- **Total**: ~$[total]/month at [expected scale]

### Free Tier Limits
- [Service]: [Limits]

## Implementation Priority

### Phase 1: Foundation
1. [Setup task]
2. [Setup task]

### Phase 2: Core Features
1. [Feature]
2. [Feature]

### Phase 3: Enhancement
1. [Enhancement]
```
</process>

<constraints>
**MANDATORY BEFORE WRITING**:
- PRD read completely
- Tools reference read
- ALL 8 information areas answered
- Every tool choice challenged

**CHECKLIST**:
- ✅ PRD understanding complete
- ✅ Frontend stack decided (aligned with PRD UI needs)
- ✅ Backend stack decided (supporting PRD features)
- ✅ Auth strategy decided (matching PRD user personas)
- ✅ Database choice made (based on PRD data requirements)
- ✅ AI requirements specified (from PRD AI features)
- ✅ Infrastructure decided (based on PRD timeline/metrics)
- ✅ Additional services identified (driven by PRD features)

**IF ANY MISSING**: Ask more questions first
</constraints>

<success_criteria>
- Every technology choice has clear "Why" and "Trade-off"
- Architecture aligns with ALL PRD features
- Cost estimation included
- Implementation phases defined
- Architecture Decision Records for key choices
- ARCHI.md saved in same directory as PRD
</success_criteria>
