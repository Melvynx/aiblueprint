---
description: Create a lean Product Requirements Document through interactive discovery conversation
---

<objective>
Create a focused Product Requirements Document (PRD) for an MVP through iterative conversation.

Guide the user through defining product vision, user personas, core features, and success metrics. Keep the PRD minimal and focused on essential features that solve real problems. This is the FOUNDATION - the PRD comes FIRST, then ARCHI, then implementation.
</objective>

<process>
## Phase 1: Information Discovery

1. **Do NOT write anything until you have answers to ALL 5 areas below**

Ask questions progressively (2-3 at a time, not all at once) until you have complete clarity:

### Area 1: Problem & Vision
- What problem does this product solve?
- Who experiences this problem most acutely?
- What makes this solution unique or different?
- What does success look like?

### Area 2: Target Users
- Who are the primary users? (1-3 personas max)
- What are their key characteristics? (role, context, pain points)
- What motivates them to use this product?
- What would make them stop using it?

### Area 3: Core Features
- What is the ONE thing this product must do? (critical feature)
- What 2-3 features support that core capability?
- What features are nice-to-have but not critical for MVP?
- How will users accomplish their primary goal?

### Area 4: Success Metrics
- How will you measure if this product is working?
- What user behavior indicates success?
- What business metrics matter most?

### Area 5: Constraints & Scope
- What technical constraints exist?
- What timeline are you working with?
- What resources are available?
- What are you explicitly NOT building in v1?

## Phase 2: Verify Completeness

2. **Before generating PRD**, confirm you have:

- ✅ Core problem clearly defined with specific user experiencing it
- ✅ 1-3 specific personas with roles, pain points, motivations
- ✅ THE ONE critical feature + 2-4 supporting must-have features
- ✅ Specific, measurable metrics (not vague goals)
- ✅ Clear list of what is NOT being built in v1
- ✅ Timeline and constraints understood

**IF ANY MISSING**: Ask more questions first. Do NOT generate PRD with gaps.

## Phase 3: Generate PRD

3. **Create PRD.md** with this structure:

```markdown
# Product Requirements Document: [Product Name]

## Product Vision

**Problem Statement**
[2-3 sentences describing the core problem]

**Solution**
[2-3 sentences describing how this product solves it]

**Success Criteria**
- [Metric 1: quantitative measure]
- [Metric 2: user behavior indicator]
- [Metric 3: business outcome]

## Target Users

### Primary Persona: [Name]
- **Role**: [User role/context]
- **Pain Points**:
  - [Pain point 1]
  - [Pain point 2]
- **Motivations**: [What drives them]
- **Goals**: [What they want to accomplish]

### Secondary Persona: [Name] (if applicable)
- **Role**: [User role/context]
- **Pain Points**: [Key challenges]
- **Motivations**: [What drives adoption]

## Core Features (MVP)

### Must-Have Features

#### 1. [Feature Name]
**Description**: [What this feature does - 2-3 sentences]
**User Value**: [Why this matters to users]
**Success Metric**: [How to measure if working]

#### 2. [Feature Name]
**Description**: [Feature explanation]
**User Value**: [Benefit to users]
**Success Metric**: [Measurement criteria]

#### 3. [Feature Name]
**Description**: [Feature explanation]
**User Value**: [Benefit to users]
**Success Metric**: [Measurement criteria]

### Should-Have Features (Post-MVP)
- [Feature 1]: [Brief description]
- [Feature 2]: [Brief description]

## User Flows

### Primary User Journey
1. [Step 1: User action]
2. [Step 2: User action]
3. [Step 3: User action]
4. [Step 4: Outcome achieved]

## Out of Scope (v1)

Explicitly NOT building in MVP:
- [Feature/capability 1]
- [Feature/capability 2]
- [Feature/capability 3]

## Open Questions
- [Question 1 needing resolution]
- [Question 2 requiring validation]

## Success Metrics

**Primary Metrics**:
- [Metric 1]: [Target/goal]
- [Metric 2]: [Target/goal]

**Secondary Metrics**:
- [Metric 3]: [Target/goal]

## Timeline & Milestones
- **MVP Completion**: [Target timeframe]
- **First User Testing**: [Target]
- **Launch**: [Target]
```

## Phase 4: Save and Next Steps

4. **Save PRD.md** in project directory

5. **Suggest next steps**:
   > "PRD created! Next steps in order:
   > 1. `/prompts/saas-create-architecture` - Design technical architecture
   > 2. `/prompts/saas-define-pricing` - Define pricing strategy
   > 3. `/prompts/saas-create-landing-copy` - Create landing page copy"
</process>

<constraints>
**DISCOVERY RULES**:
- NEVER write PRD until ALL 5 information areas are covered
- Ask 2-3 questions at a time, not all at once
- Dig deeper based on responses - don't accept vague answers
- Push for specific metrics, not goals like "increase engagement"

**MVP FOCUS**:
- Maximum 3-5 must-have features
- If user lists 10 features, help them prioritize to 3-5
- "Out of Scope" section is critical - define boundaries clearly
- Post-MVP features go in "Should-Have" section

**OUTPUT RULES**:
- Target 2-3 pages max, not a 20-page spec
- Every feature needs Description, User Value, Success Metric
- Be specific and actionable, not vague

**CONVERSATION STYLE**:
- Keep it conversational, not interrogation
- Adapt questions based on their industry/context
- Help users think through trade-offs
</constraints>

<success_criteria>
- All 5 information areas have complete answers
- 1-3 specific personas defined with pain points
- 3-5 must-have features clearly described
- Each feature has measurable success metric
- Out of Scope section explicitly defines boundaries
- PRD saved as PRD.md in project directory
- Next steps provided for workflow continuation
</success_criteria>
