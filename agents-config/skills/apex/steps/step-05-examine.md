---
name: step-05-examine
description: Adversarial code review - security, logic, and quality analysis
prev_step: steps/step-04-validate.md
next_step: steps/step-06-resolve.md
---

# Step 5: Examine (Adversarial Review)

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER skip security review
- 🛑 NEVER dismiss findings without justification
- 🛑 NEVER auto-approve without thorough review
- ✅ ALWAYS check OWASP top 10 vulnerabilities
- ✅ ALWAYS classify findings by severity and validity
- ✅ ALWAYS present findings table to user
- 📋 YOU ARE A SKEPTICAL REVIEWER, not a defender
- 💬 FOCUS on "What could go wrong?"
- 🚫 FORBIDDEN to approve without thorough analysis

## EXECUTION PROTOCOLS:

- 🎯 Launch 4+ parallel review sub-agents in ONE message (unless economy_mode)
- 🛑 NEVER launch only 1 review agent - you MUST launch Security + Logic + Clean Code + Thermo-Nuclear as separate agents
- 🛑 NEVER skip the Thermo-Nuclear quality audit - it is the final maintainability gate
- 💾 Document all findings with severity
- 📖 Create todos for each finding
- 🚫 FORBIDDEN to skip security analysis
- 🚫 FORBIDDEN to skip thermo-nuclear maintainability review
- 🚫 FORBIDDEN to combine review categories into a single agent

## CONTEXT BOUNDARIES:

- Implementation is complete and validated
- All tests pass
- Now looking for issues that tests miss
- Adversarial mindset - assume bugs exist
- **If `{teams_mode}` = true:** Agent team is still alive. Do NOT shutdown teammates - that happens in step-09-finish only.

## YOUR TASK:

Conduct an adversarial code review to identify security vulnerabilities, logic flaws, and quality issues.

---

<available_state>
From previous steps:

| Variable | Description |
|----------|-------------|
| `{task_description}` | What was implemented |
| `{task_id}` | Kebab-case identifier |
| `{auto_mode}` | Auto-fix Real findings |
| `{save_mode}` | Save outputs to files |
| `{economy_mode}` | No subagents, direct review |
| `{output_dir}` | Path to output (if save_mode) |
| Files modified | From step-03 |
</available_state>

---

## EXECUTION SEQUENCE:

### 1. Initialize Save Output (if save_mode)

**If `{save_mode}` = true:**

```bash
bash {skill_dir}/scripts/update-progress.sh "{task_id}" "05" "examine" "in_progress"
```

Append findings to `{output_dir}/05-examine.md` as you work.

### 2. Gather Changes

```bash
git diff --name-only HEAD~1
git status --porcelain
```

Group files: source, tests, config, other.

### 3. Conduct Review

**If `{economy_mode}` = true:**
→ Self-review with checklist:

```markdown
## Security Checklist
- [ ] No SQL injection (parameterized queries)
- [ ] No XSS (output encoding)
- [ ] No secrets in code
- [ ] Input validation present
- [ ] Auth checks on protected routes

## Logic Checklist
- [ ] Error handling for all failure modes
- [ ] Edge cases handled
- [ ] Null/undefined checks
- [ ] Race conditions considered

## Quality Checklist
- [ ] Follows existing patterns
- [ ] No code duplication
- [ ] Clear naming

## Thermo-Nuclear Maintainability Checklist
- [ ] No file pushed from under 1k lines to over 1k lines without strong justification
- [ ] No new ad-hoc conditionals / spaghetti branches in unrelated flows
- [ ] No thin abstractions, identity wrappers, or "magic" mechanisms added
- [ ] No unnecessary casts / `any` / `unknown` / optional params muddying contracts
- [ ] Feature logic stays in the canonical layer (no leaking into shared paths)
- [ ] Reuses existing canonical helpers instead of bespoke near-duplicates
- [ ] No "code judo" simplification was missed (could this be dramatically simpler?)
- [ ] Orchestration is parallel / atomic where the cleaner structure is obvious
```

**If `{economy_mode}` = false:**
→ Launch parallel review sub-agents.

**🛑 CRITICAL: You MUST launch ALL 4 agents (or 5 if Next.js) in a SINGLE message using MULTIPLE sub-agent launches. DO NOT launch them one at a time. DO NOT use only 1 agent. Each agent reviews a DIFFERENT aspect. The Thermo-Nuclear agent is MANDATORY and runs alongside the others.**

First, gather the list of modified files:
```bash
git diff --name-only HEAD~1
```

Then, in **ONE message with 4+ parallel sub-agent launches**, launch:

---

**Agent 1: Security Review** - sub-agent profile/type: `code-reviewer`
```
prompt: |
  You are a SECURITY reviewer. Review ONLY the following files for security vulnerabilities:
  {list of modified files}

  Focus exclusively on:
  - OWASP Top 10: injection flaws (SQL, command, XSS)
  - Authentication and authorization issues
  - Sensitive data exposure (secrets, tokens, PII in logs)
  - Security misconfiguration
  - Insecure deserialization
  - Missing input validation at system boundaries

  For each finding, provide: file:line, severity (CRITICAL/HIGH/MEDIUM/LOW), description, and suggested fix.
  If no security issues found, explicitly state "No security issues found."
```

---

**Agent 2: Logic & Edge Cases Review** - sub-agent profile/type: `code-reviewer`
```
prompt: |
  You are a LOGIC reviewer. Review ONLY the following files for logic correctness:
  {list of modified files}

  Focus exclusively on:
  - Edge cases not handled (empty arrays, null/undefined, boundary values)
  - Race conditions and concurrency issues
  - Incorrect conditional logic or off-by-one errors
  - Missing error handling for failure modes
  - State management bugs
  - Incorrect assumptions about data shape or types

  For each finding, provide: file:line, severity (CRITICAL/HIGH/MEDIUM/LOW), description, and suggested fix.
  If no logic issues found, explicitly state "No logic issues found."
```

---

**Agent 3: Clean Code & Quality Review** - sub-agent profile/type: `code-reviewer`
```
prompt: |
  You are a CLEAN CODE reviewer. Review ONLY the following files for code quality:
  {list of modified files}

  Focus exclusively on:
  - SOLID principle violations
  - Code smells (long methods, god objects, feature envy)
  - Cyclomatic complexity > 10
  - Code duplication > 20 lines
  - Naming that doesn't communicate intent
  - Functions doing too many things

  For each finding, provide: file:line, severity (CRITICAL/HIGH/MEDIUM/LOW), description, and suggested fix.
  If no quality issues found, explicitly state "No quality issues found."
```

---

**Agent 4: Thermo-Nuclear Code Quality Review** (MANDATORY - launch alongside Agents 1-3)

This is the **final verification gate**. After the other reviewers find issues, this agent performs an extremely strict maintainability audit using the `thermo-nuclear-code-quality-review` skill. It is **not optional** and must run on every examine pass.

Sub-agent profile/type: `thermo-nuclear-code-quality-review`
```
prompt: |
  Perform a Thermo-Nuclear Code Quality Review on the current branch's changes.

  Modified files to audit:
  {list of modified files}

  Load and strictly apply the rubric from the `thermo-nuclear-code-quality-review` skill.

  Verify and challenge:
  - Structural code-quality regressions and missed "code judo" opportunities
  - Any file pushed from under 1k lines to over 1k lines (presumptive blocker)
  - New ad-hoc conditionals or spaghetti branching bolted onto unrelated flows
  - Thin abstractions, identity wrappers, pass-through helpers, "magic" mechanisms
  - Unnecessary casts, `any`, `unknown`, optional params obscuring real contracts
  - Feature logic leaking into shared/canonical paths
  - Bespoke helpers duplicating existing canonical utilities
  - Unnecessary sequential orchestration or non-atomic update flows
  - Whether the implementation could be dramatically simpler / smaller / more direct

  For each finding, provide: file:line, severity (CRITICAL/HIGH/MEDIUM/LOW), description, and a concrete restructuring suggestion (prefer DELETING complexity over rearranging it).

  Be ambitious, direct, and demanding. Do not soften major maintainability issues.
  Apply the skill's Approval Bar strictly - flag presumptive blockers explicitly.

  If no significant maintainability issues found, explicitly state "No thermo-nuclear findings."
```

---

**Agent 5: Vercel/Next.js Best Practices** (CONDITIONAL - launch alongside Agents 1-4)

→ **Detection:** Check if modified files match Next.js/Vercel patterns:
```
- *.tsx, *.jsx files in app/, pages/, components/
- next.config.* files
- Server actions (use server)
- API routes (app/api/*, pages/api/*)
- Middleware (middleware.ts)
- Server components, client components
```

→ **If Next.js/Vercel code detected:** Add a 5th parallel review sub-agent:

Sub-agent profile/type: `code-reviewer`
```
prompt: |
  You are a NEXT.JS / REACT PERFORMANCE reviewer. Review ONLY the following files:
  {list of modified files}

  Focus exclusively on:
  - Sequential awaits that should use Promise.all for parallel fetching
  - Barrel imports causing bundle bloat (import from index files)
  - Missing dynamic imports for heavy client components
  - Server-side caching opportunities (React cache, unstable_cache)
  - Unnecessary re-renders (missing memo, useMemo, useCallback)
  - Wrong Server vs Client component boundaries
  - Data fetching patterns (preloading, parallel fetching, waterfall detection)

  For each finding, provide: file:line, severity (CRITICAL/HIGH/MEDIUM/LOW), description, and suggested fix.
  If no performance issues found, explicitly state "No performance issues found."
```

→ **If NOT Next.js/Vercel code:** Skip this agent (launch only Agents 1-4)

---

**🛑 REMINDER: You MUST have 4+ sub-agent launches in a SINGLE response (Security + Logic + Clean Code + Thermo-Nuclear, plus Next.js if applicable). If you only launched 1-3 agents, you are doing it WRONG. Go back and launch all agents. The Thermo-Nuclear agent is MANDATORY - never skip it.**

### 4. Classify Findings

For each finding:

**Severity:**
- CRITICAL: Security vulnerability, data loss risk
- HIGH: Significant bug, will cause issues
- MEDIUM: Should fix, not urgent
- LOW: Minor improvement

**Validity:**
- Real: Definitely needs fixing
- Noise: Not actually a problem
- Uncertain: Needs discussion

### 5. Present Findings Table

```markdown
## Findings

| ID | Severity | Category | Location | Issue | Validity |
|----|----------|----------|----------|-------|----------|
| F1 | CRITICAL | Security | auth.ts:42 | SQL injection | Real |
| F2 | HIGH | Logic | handler.ts:78 | Missing null check | Real |
| F3 | MEDIUM | Quality | utils.ts:15 | Complex function | Uncertain |

**Summary:** {count} findings ({blocking} blocking)
```

### 6. Create Finding Todos

```
- [ ] F1 [CRITICAL] Fix SQL injection in auth.ts:42
- [ ] F2 [HIGH] Add null check in handler.ts:78
```

### 7. Get User Approval (review → resolve/test)

**If `{auto_mode}` = true:**
→ Proceed automatically based on findings

**If `{auto_mode}` = false:**

```yaml
questions:
  - header: "Review"
    question: "Review complete. How would you like to proceed?"
    options:
      - label: "Resolve findings (Recommended)"
        description: "Address the identified issues"
      - label: "Skip to tests"
        description: "Skip resolution, proceed to test creation"
      - label: "Skip resolution"
        description: "Accept findings, don't make changes"
      - label: "Discuss findings"
        description: "I want to discuss specific findings"
    multiSelect: false
```

<critical>
This is one of the THREE transition points that requires user confirmation:
1. plan → execute
2. validate → review
3. review → resolve/test (THIS ONE)
</critical>

### 8. Complete Save Output (if save_mode)

**If `{save_mode}` = true:**

Append to `{output_dir}/05-examine.md`:
```markdown
---
## Step Complete
**Status:** ✓ Complete
**Findings:** {count}
**Critical:** {count}
**Next:** step-06-resolve.md
**Timestamp:** {ISO timestamp}
```

---

## SUCCESS METRICS:

✅ All modified files reviewed
✅ Security checklist completed
✅ Findings classified by severity
✅ Validity assessed for each finding
✅ Findings table presented
✅ Todos created for tracking
✅ Thermo-Nuclear maintainability audit completed (mandatory final gate)
✅ Next.js/Vercel best practices checked (if applicable)

## FAILURE MODES:

❌ **CRITICAL**: Launching only 1 review agent instead of 4+ - each category (Security, Logic, Clean Code, Thermo-Nuclear) MUST be a separate agent
❌ **CRITICAL**: Skipping the Thermo-Nuclear maintainability review - it is the mandatory final verification gate
❌ Combining multiple review categories into a single agent prompt
❌ Skipping security review
❌ Not classifying by severity
❌ Auto-dismissing findings
❌ Launching agents sequentially instead of in parallel
❌ Using subagents when economy_mode
❌ Skipping Vercel/Next.js review when React/Next.js files are modified
❌ **CRITICAL**: Not using AskUserQuestion for review → resolve/test transition

## REVIEW PROTOCOLS:

- Adversarial mindset - assume bugs exist
- Check security FIRST
- Every finding gets severity and validity
- Don't dismiss without justification
- Present clear summary

---

## NEXT STEP:

After user confirms via AskUserQuestion (or auto-proceed):

**If user chooses "Resolve findings":** → Load `./step-06-resolve.md`

**If user chooses "Skip to tests" (and test_mode):** → Load `./step-07-tests.md`

**If user chooses "Skip resolution":**
- **If test_mode:** → Load `./step-07-tests.md`
- **If pr_mode:** → Load `./step-09-finish.md` to create pull request
- **Otherwise:** → Workflow complete - show summary

<critical>
Remember: Be SKEPTICAL - your job is to find problems, not approve code!
This step MUST ask before proceeding (unless auto_mode).
</critical>
