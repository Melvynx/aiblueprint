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

- 🎯 Launch parallel review agents (unless economy_mode)
- 💾 Document all findings with severity
- 📖 Create todos for each finding
- 🚫 FORBIDDEN to skip security analysis

## CONTEXT BOUNDARIES:

- Implementation is complete and validated
- All tests pass
- Now looking for issues that tests miss
- Adversarial mindset - assume bugs exist

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
→ Launch parallel review agents

**CRITICAL: Launch ALL in a SINGLE message:**

**Agent 1: Security** (`code-reviewer`)
```
Review for OWASP Top 10:
- Injection flaws
- Auth/authz issues
- Data exposure
- Security misconfiguration
```

**Agent 2: Logic** (`code-reviewer`)
```
Review for:
- Edge cases not handled
- Race conditions
- Null handling
- Incorrect logic
```

**Agent 3: Clean Code** (`code-reviewer`)
```
Review for:
- SOLID violations
- Code smells
- Complexity issues
- Duplication >20 lines
```

**Agent 4: Vercel/Next.js Best Practices** (CONDITIONAL)

→ **Detection:** Check if modified files match Next.js/Vercel patterns:
```
- *.tsx, *.jsx files in app/, pages/, components/
- next.config.* files
- Server actions (use server)
- API routes (app/api/*, pages/api/*)
- Middleware (middleware.ts)
- Server components, client components
```

→ **If Next.js/Vercel code detected:**

Launch additional agent using Skill tool:
```yaml
skill: "vercel-react-best-practices"
```

This agent reviews for:
- Async parallel patterns (Promise.all vs sequential awaits)
- Bundle optimization (barrel imports, dynamic imports)
- Server-side caching (React cache, unstable_cache)
- Re-render optimization (memo, useMemo, useCallback usage)
- Server vs Client component boundaries
- Data fetching patterns (preloading, parallel fetching)

→ **If NOT Next.js/Vercel code:** Skip this agent

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

❌ Skipping security review
❌ Not classifying by severity
❌ Auto-dismissing findings
❌ Launching agents sequentially
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
