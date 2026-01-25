---
name: step-01-analyze
description: Pure context gathering - explore codebase to understand WHAT EXISTS
next_step: steps/step-02-plan.md
---

# Step 1: Analyze (Context Gathering)

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER plan or design solutions - that's step 2
- 🛑 NEVER create todos or implementation tasks
- 🛑 NEVER decide HOW to implement anything
- ✅ ALWAYS focus on discovering WHAT EXISTS
- ✅ ALWAYS report findings with file paths and line numbers
- 📋 YOU ARE AN EXPLORER, not a planner
- 💬 FOCUS on "What is here?" NOT "What should we build?"
- 🚫 FORBIDDEN to suggest implementations or approaches

## 🧠 SMART AGENT STRATEGY

<critical>
**ADAPTIVE AGENT LAUNCHING** (unless economy_mode is true)

Before exploring, THINK about what information you need and launch the RIGHT agents - between 1 and 10 depending on task complexity.

**DO NOT blindly launch all agents. BE SMART.**
</critical>

## EXECUTION PROTOCOLS:

- 🎯 Launch parallel exploration agents (unless economy_mode)
- 💾 Append findings to output file (if save_mode)
- 📖 Document patterns with specific file:line references
- 🚫 FORBIDDEN to proceed until context is complete

## CONTEXT BOUNDARIES:

- Variables from step-00-init are available
- No implementation decisions have been made yet
- Codebase state is unknown - must be discovered
- Don't assume knowledge about the codebase

## YOUR TASK:

Gather ALL relevant context about WHAT CURRENTLY EXISTS in the codebase related to the task.

---

<available_state>
From step-00-init:

| Variable | Description |
|----------|-------------|
| `{task_description}` | What to implement |
| `{task_id}` | Kebab-case identifier |
| `{auto_mode}` | Skip confirmations |
| `{examine_mode}` | Auto-proceed to review |
| `{save_mode}` | Save outputs to files |
| `{test_mode}` | Include test steps |
| `{economy_mode}` | No subagents, direct tools |
| `{output_dir}` | Path to output (if save_mode) |
</available_state>

---

## EXECUTION SEQUENCE:

### 1. Initialize Save Output (if save_mode)

**If `{save_mode}` = true:**

```bash
bash {skill_dir}/scripts/update-progress.sh "{task_id}" "01" "analyze" "in_progress"
```

Append findings to `{output_dir}/01-analyze.md` as you work.

### 2. Extract Search Keywords

From the task description, identify:
- **Domain terms**: auth, user, payment, etc.
- **Technical terms**: API, route, component, etc.
- **Action hints**: create, update, fix, add, etc.

These keywords guide exploration - NOT planning.

### 3. Explore Codebase

**If `{economy_mode}` = true:**
→ Use direct tools (see step-00b-economy.md for rules)

```
1. Glob to find files: **/*{keyword}*
2. Grep to search content in likely locations
3. Read the most relevant 3-5 files
4. Skip web research unless stuck
```

**If `{economy_mode}` = false:**
→ Use SMART agent strategy below

---

### 🧠 STEP 3A: ANALYZE TASK COMPLEXITY

**Before launching agents, THINK:**

```
Task: {task_description}

1. SCOPE: How many areas of the codebase are affected?
   - Single file/function → Low
   - Multiple related files → Medium
   - Cross-cutting concerns → High

2. LIBRARIES: Which external libraries are involved?
   - None or well-known basics → Skip docs
   - Unfamiliar library or specific API needed → Need docs
   - Multiple libraries interacting → Need multiple doc agents

3. PATTERNS: Do I need to understand existing patterns?
   - Simple addition → Maybe skip codebase exploration
   - Must integrate with existing code → Need codebase exploration

4. UNCERTAINTY: What am I unsure about?
   - Clear requirements, known approach → Fewer agents
   - Unclear approach, unfamiliar territory → More agents
```

---

### 🎯 STEP 3B: CHOOSE YOUR AGENTS (1-10)

**Available Agent Types:**

| Agent | Use When |
|-------|----------|
| `explore-codebase` | Need to find existing patterns, related files, utilities |
| `explore-docs` | Unfamiliar library API, need current syntax, complex feature |
| `websearch` | Need common approaches, best practices, gotchas |

**Decision Matrix:**

| Task Type | Agents Needed | Example |
|-----------|---------------|---------|
| **Simple fix** | 1-2 | Bug fix in known file → 1x explore-codebase |
| **Add feature (familiar stack)** | 2-3 | Add button → 1x explore-codebase + 1x websearch |
| **Add feature (unfamiliar library)** | 3-5 | Add Stripe → 1x codebase + 1x explore-docs (Stripe) + 1x websearch |
| **Complex integration** | 5-8 | Auth + payments → 1x codebase + 2-3x explore-docs + 1-2x websearch |
| **Major feature (multiple systems)** | 6-10 | Full e-commerce → Multiple codebase areas + multiple docs + research |

---

### 🚀 STEP 3C: LAUNCH AGENTS IN PARALLEL

**Launch ALL chosen agents in ONE message.**

**Agent Prompts:**

**`explore-codebase`** - Use for finding existing code:
```
Find existing code related to: {specific_area}

Report:
1. Files with paths and line numbers
2. Patterns used for similar features
3. Relevant utilities
4. Test patterns

DO NOT suggest implementations.
```

**`explore-docs`** - Use ONLY when you need specific library knowledge:
```
Research {library_name} documentation for: {specific_question}

Find:
1. Current API for {specific_feature}
2. Code examples
3. Configuration needed
```

**`websearch`** - Use for approaches and gotchas:
```
Search: {specific_question_or_approach}

Find common patterns and pitfalls.
```

---

### 📋 EXAMPLE AGENT LAUNCHES

**Simple task** (fix button styling) → 1 agent:
```
[Task: explore-codebase - find button components and styling patterns]
```

**Medium task** (add user profile page) → 3 agents:
```
[Task: explore-codebase - find user-related components and data fetching patterns]
[Task: explore-codebase - find page layout and routing patterns]
[Task: websearch - Next.js profile page best practices]
```

**Complex task** (add Stripe subscriptions) → 6 agents:
```
[Task: explore-codebase - find existing payment/billing code]
[Task: explore-codebase - find user account and settings patterns]
[Task: explore-docs - Stripe subscription API and webhooks]
[Task: explore-docs - Stripe Customer Portal integration]
[Task: websearch - Stripe subscriptions Next.js implementation]
[Task: websearch - Stripe webhook security best practices]
```

### 4. Synthesize Findings

Combine results into structured context:

```markdown
## Codebase Context

### Related Files Found
| File | Lines | Contains |
|------|-------|----------|
| `src/auth/login.ts` | 1-150 | Existing login implementation |
| `src/utils/validate.ts` | 20-45 | Email validation helper |

### Patterns Observed
- **Route pattern**: Uses Next.js App Router with `route.ts`
- **Validation**: Uses zod schemas in `schemas/` folder
- **Error handling**: Throws custom ApiError classes

### Utilities Available
- `src/lib/auth.ts` - JWT sign/verify functions
- `src/lib/db.ts` - Prisma client instance

### Similar Implementations
- `src/auth/login.ts:42` - Login flow (reference for patterns)

### Test Patterns
- Tests in `__tests__/` folders
- Uses vitest with testing-library

## Documentation Insights

### Libraries Used
- **jose**: JWT library - uses `SignJWT` class
- **prisma**: ORM - uses `prisma.user.create()` pattern

## Research Findings

### Common Approaches
- Registration: validate → hash → create → issue token
- Use httpOnly cookies for tokens
```

**If `{save_mode}` = true:** Append synthesis to 01-analyze.md

### 5. Infer Acceptance Criteria

Based on task and context, infer success criteria:

```markdown
## Inferred Acceptance Criteria

Based on "{task_description}" and existing patterns:

- [ ] AC1: [specific measurable outcome]
- [ ] AC2: [specific measurable outcome]
- [ ] AC3: [specific measurable outcome]

_These will be refined in the planning step._
```

**If `{save_mode}` = true:** Update 00-context.md with acceptance criteria

### 6. Present Context Summary

**Always (regardless of auto_mode):**

Present summary and proceed directly to planning:

```
**Context Gathering Complete**

**Files analyzed:** {count}
**Patterns identified:** {count}
**Utilities found:** {count}

**Key findings:**
- {summary of relevant files}
- {patterns that will guide implementation}

→ Proceeding to planning phase...
```

<critical>
Do NOT ask for user confirmation here - always proceed directly to step-02-plan.
</critical>

### 7. Complete Save Output (if save_mode)

**If `{save_mode}` = true:**

Append summary to `{output_dir}/01-analyze.md` then:

```bash
bash {skill_dir}/scripts/update-progress.sh "{task_id}" "01" "analyze" "complete"
bash {skill_dir}/scripts/update-progress.sh "{task_id}" "02" "plan" "in_progress"
```

---

## SUCCESS METRICS:

✅ Related files identified with paths and line numbers
✅ Existing patterns documented with specific examples
✅ Available utilities noted
✅ Dependencies listed
✅ Acceptance criteria inferred
✅ NO planning or implementation decisions made
✅ Output saved (if save_mode)
✅ Task complexity analyzed BEFORE launching agents
✅ Right NUMBER of agents launched (1-10 based on complexity)
✅ Right TYPE of agents chosen for the task
✅ All agents launched in PARALLEL (single message)

## FAILURE MODES:

❌ Starting to plan or design (that's step 2!)
❌ Suggesting implementations or approaches
❌ Missing obvious related files
❌ Not documenting patterns with file:line references
❌ Launching agents sequentially instead of parallel
❌ Using subagents when economy_mode is true
❌ **CRITICAL**: Blocking workflow with unnecessary confirmation prompts
❌ Launching too many agents for a simple task (wasteful)
❌ Launching too few agents for a complex task (insufficient context)
❌ Not analyzing task complexity before choosing agents
❌ Skipping `explore-docs` when genuinely unfamiliar with a library API

## ANALYZE PROTOCOLS:

- This step is ONLY about discovery
- Report what EXISTS, not what SHOULD BE
- Include file paths and line numbers for all findings
- Don't assume - verify by reading files
- In economy mode, use direct tools only

---

## NEXT STEP:

Always proceed directly to `./step-02-plan.md` after presenting context summary.

<critical>
Remember: Analysis is ONLY about "What exists?" - save all planning for step-02!
Do NOT ask for confirmation - proceed directly!
</critical>
