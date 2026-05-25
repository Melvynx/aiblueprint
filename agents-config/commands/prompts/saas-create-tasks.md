---
description: Generate implementation task files from PRD and Architecture documents
---

<objective>
Generate a structured set of implementation task files from existing PRD and Architecture documents.

Create well-scoped, coherent tasks that an AI agent can execute autonomously. Each task represents 1-3 hours of focused work with clear deliverables and success criteria. This comes AFTER PRD and ARCHI - both must exist first.
</objective>

<context>
Current project: !`ls -la`
Existing specs folder: !`ls specs/ 2>/dev/null || echo "No specs folder"`
Package.json: !`cat package.json 2>/dev/null | head -20 || echo "No package.json"`
</context>

<process>
## Phase 1: Understanding

1. **Ask for project location**:
   > "Where is your project located? Are you starting from scratch or using a boilerplate?"

2. **Explore existing codebase**:
   - Read `package.json` for dependencies
   - Check folder structure (`app/`, `src/`, `components/`)
   - Identify what's already implemented

3. **Document current state**:
   - ✅ Already implemented: [list]
   - 🚧 Partially implemented: [list]
   - ❌ Not yet built: [list]

4. **Ask for PRD location**, then read completely:
   - Extract all features
   - Note user flows
   - Identify MVP scope vs post-MVP

5. **Ask for ARCHI location**, then read completely:
   - Note all technology choices
   - Understand patterns to follow
   - Identify integration points

## Phase 2: Deep Analysis

6. **Map features to implementation**:
   - [Feature 1] → Database models, UI, API, validation needed
   - [Feature 2] → Real-time, file storage, background jobs needed
   - [Feature 3] → Auth, permissions, notifications needed

7. **Create dependency graph**:
```
Foundation Layer (Database, Auth, Base UI)
    ↓
Core Features Layer (Primary user functionality)
    ↓
Integration Layer (Third-party services)
    ↓
Polish Layer (Error handling, optimization)
```

8. **Identify what can be parallelized** vs what is sequential

## Phase 3: Verify Before Creating

9. **Confirm checklist complete**:
   - ✅ Codebase understood
   - ✅ All PRD features extracted
   - ✅ All ARCHI decisions understood
   - ✅ Dependencies mapped
   - ✅ Foundation identified
   - ✅ Integration points clear
   - ✅ Success criteria defined

**IF ANY MISSING**: Do more analysis first. Do NOT create tasks with gaps.

## Phase 4: Generate Task Files

10. **Create folder structure**:
    ```bash
    mkdir -p specs/01-mvp
    ```

11. **Create individual task files** in `specs/01-mvp/`:
    - Naming: `01-task-name.md`, `02-task-name.md`
    - Use 2-digit numbering with kebab-case names

12. **Task file structure**:

```markdown
# Task [Number]: [Action-Oriented Title]

## Context
[Connection to PRD feature and overall vision]

## Scope
[Specific deliverables for this task]

## Implementation Details

### Files to Create/Modify
- `path/to/file.ts` - [Purpose]

### Key Functionality
- [What the code should do]

### Technologies Used
- [From ARCHI with how it's used]

### Architectural Patterns
[Patterns from ARCHI to follow]

## Success Criteria
- [ ] [Testable outcome 1]
- [ ] [Testable outcome 2]
- [ ] [Testable outcome 3]

## Testing & Validation

### Manual Testing Steps
1. [Step]
2. [Step]

### Edge Cases
- [Edge case]

## Dependencies

**Must complete first**:
- Task [N]: [Name]

**Blocks**:
- Task [X]: [Name]

## Related Documentation
- **PRD**: [Reference]
- **ARCHI**: [Reference]

---
**Estimated Time**: [1-3 hours]
**Phase**: [Foundation / Core / Integration / Polish]
```

13. **Create README overview** at `specs/README.md`:

```markdown
# Implementation Tasks Overview

## Project Summary
**From PRD**: [Summary]
**Tech Stack**: [From ARCHI]
**Current State**: [What exists]

## Task Execution Guidelines
- Read complete task before starting
- Check dependencies are met
- Follow ARCHI patterns
- Validate against success criteria

## MVP Tasks (specs/01-mvp/)

### Phase 1: Foundation
- [ ] `01-name.md` - [Description]
- [ ] `02-name.md` - [Description]

### Phase 2: Core Features
- [ ] `03-name.md` - [Description]
- [ ] `04-name.md` - [Description]

### Phase 3: Integration
- [ ] `05-name.md` - [Description]

### Phase 4: Polish
- [ ] `06-name.md` - [Description]

## Dependency Map
[Visual dependency graph]

## PRD Coverage
- ✅ [Feature]: Task [N]
- ✅ [Feature]: Task [N]

## Total Estimated Time: [X-Y hours]
```
</process>

<constraints>
**TASK SIZING**:

❌ **Too Small**:
- "Add TypeScript type"
- "Create button component"
- "Add validation to field"

❌ **Too Large**:
- "Implement complete auth system"
- "Build entire dashboard"

✅ **Just Right** (1-3 hours):
- "Create user authentication flow with email/password and session management"
- "Build dashboard layout with navigation and responsive design"
- "Implement checkout with Stripe integration and webhooks"

**OUTPUT FORMAT**:
- NEVER create single document with all tasks
- ALWAYS create individual files in `specs/01-mvp/`
- ALWAYS create `specs/README.md` overview
- Use 2-digit numbering (01-, 02-, 03-)

**QUALITY**:
- Every task links to PRD feature
- Every task follows ARCHI patterns
- Every task has testable success criteria
- Every task has clear dependencies
</constraints>

<output>
**Created files**:
- `specs/README.md` - Overview with dependency map
- `specs/01-mvp/01-name.md` through `specs/01-mvp/[N]-name.md` - Individual task files

**Each task file contains**:
- Context connecting to PRD
- Specific scope and deliverables
- Files to create/modify
- Technologies from ARCHI
- Testable success criteria
- Dependencies (before and blocks)
- Time estimate
</output>

<success_criteria>
- All PRD features mapped to specific tasks
- All ARCHI decisions reflected in task patterns
- Tasks ordered correctly by dependencies
- Each task is 1-3 hours of work
- Each task has clear success criteria
- Individual files created in `specs/01-mvp/`
- README created with complete overview
- No orphan tasks (everything connected)
</success_criteria>
