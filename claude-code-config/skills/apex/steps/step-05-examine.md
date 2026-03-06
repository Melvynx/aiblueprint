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

- 🎯 Launch 3+ parallel review agents via Task tool in ONE message (unless economy_mode)
- 🛑 NEVER launch only 1 review agent — you MUST launch Security + Logic + Clean Code as separate agents
- 💾 Document all findings with severity
- 📖 Create todos for each finding
- 🚫 FORBIDDEN to skip security analysis
- 🚫 FORBIDDEN to combine review categories into a single agent

## CONTEXT BOUNDARIES:

- Implementation is complete and validated
- All tests pass
- Now looking for issues that tests miss
- Adversarial mindset - assume bugs exist
- **If `{teams_mode}` = true:** Agent team is still alive. Do NOT shutdown teammates — that happens in step-09-finish only.

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
```

**If `{economy_mode}` = false:**
→ Launch parallel review agents using the **Task tool**

**🛑 CRITICAL: You MUST launch ALL 3 agents (or 4 if Next.js) in a SINGLE message using MULTIPLE Task tool calls. DO NOT launch them one at a time. DO NOT use only 1 agent. Each agent reviews a DIFFERENT aspect.**

First, gather the list of modified files:
```bash
git diff --name-only HEAD~1
```

Then, in **ONE message with 3+ parallel Task tool calls**, launch:

---

**Agent 1: Security Review** — `subagent_type: "code-reviewer"`
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

**Agent 2: Logic & Edge Cases Review** — `subagent_type: "code-reviewer"`
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

**Agent 3: Clean Code & Quality Review** — `subagent_type: "code-reviewer"`
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

**Agent 4: Vercel/Next.js Best Practices** (CONDITIONAL — launch alongside Agents 1-3)

→ **Detection:** Check if modified files match Next.js/Vercel patterns:
```
- *.tsx, *.jsx files in app/, pages/, components/
- next.config.* files
- Server actions (use server)
- API routes (app/api/*, pages/api/*)
- Middleware (middleware.ts)
- Server components, client components
```

→ **If Next.js/Vercel code detected:** Add a 4th parallel Task tool call:

`subagent_type: "code-reviewer"`
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

→ **If NOT Next.js/Vercel code:** Skip this agent (launch only Agents 1-3)

---

**🛑 REMINDER: You MUST have 3+ Task tool calls in a SINGLE response. If you only launched 1 agent, you are doing it WRONG. Go back and launch all agents.**

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
✅ Next.js/Vercel best practices checked (if applicable)

## FAILURE MODES:

❌ **CRITICAL**: Launching only 1 review agent instead of 3+ — each category (Security, Logic, Clean Code) MUST be a separate agent
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
