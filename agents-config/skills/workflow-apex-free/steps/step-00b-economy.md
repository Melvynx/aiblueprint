---
name: step-00b-economy
description: Economy mode overrides - no subagents, direct tool usage to save tokens
load_condition: economy_mode = true
---

# Economy Mode Overrides

**This file is ONLY loaded when `-e` or `--economy` flag is active.**

These instructions OVERRIDE the default behavior in all steps to save tokens by avoiding subagent launches.

---

<why_economy_mode>
**Purpose:** Reduce token usage for users with limited Claude Code plans.

**Trade-offs:**
- ✅ Uses ~70% fewer tokens
- ✅ Faster execution (no agent overhead)
- ⚠️ Less thorough exploration
- ⚠️ No parallel research
- ⚠️ May miss some context

**When to use:**
- Limited monthly token budget
- Simple, well-defined tasks
- Familiar codebase
- Quick fixes or small features
</why_economy_mode>

---

<override_rules>

## CRITICAL: Apply These Overrides to ALL Steps

**When `{economy_mode}` = true, these rules OVERRIDE the default instructions:**

---

### Override 1: No Subagent Launches

**DEFAULT behavior (when economy_mode = false):**
```
Launch parallel agents:
- Agent 1: explore-codebase
- Agent 2: explore-docs
- Agent 3: websearch
```

**ECONOMY behavior (when economy_mode = true):**
```
Use direct tools instead:
- Glob to find files
- Grep to search content
- Read to examine files
- WebSearch only if absolutely necessary
```

**NEVER use Task tool with subagent_type in economy mode.**

---

### Override 2: Direct Tool Usage Pattern

Instead of launching exploration agents, use this pattern:

```
1. Glob to find relevant files:
   - Glob: "**/*auth*" or "**/*{keyword}*"
   - Glob: "src/**/*.ts" for specific areas

2. Grep to find specific code:
   - Grep: "function login" or "class Auth"
   - Grep: pattern in specific directory

3. Read to examine found files:
   - Read the most relevant 3-5 files
   - Focus on files matching the task

4. WebSearch ONLY if:
   - Library documentation needed
   - Unknown API or pattern
   - Limit to 1-2 searches max
```

---

### Override 3: Reduced Exploration Scope

**DEFAULT:** Explore comprehensively, find all related code
**ECONOMY:** Focus on most likely locations only

```
Economy exploration strategy:
1. Start with obvious paths (src/auth/, src/api/, etc.)
2. Search for exact keywords from task
3. Read only files directly related to task
4. Skip "nice to have" context
5. Stop exploring when you have enough to proceed
```

---

### Override 4: Skip Optional Steps

**In economy mode, skip or minimize:**
- Extensive documentation research (use existing knowledge)
- Web searches for common patterns (use best practices you know)
- Multiple rounds of exploration (one round is enough)
- Deep pattern analysis (quick scan is sufficient)

**Always do:**
- Find the files to modify
- Understand existing patterns (quick read)
- Identify dependencies
- Create the plan

---

### Override 5: Leaner Validation

**DEFAULT:** Launch code-reviewer agent for adversarial review
**ECONOMY:** Self-review without subagent

```
Economy validation:
1. Run typecheck and lint (required)
2. Run affected tests (required)
3. Quick self-review checklist:
   - [ ] No obvious bugs
   - [ ] Follows existing patterns
   - [ ] Error handling present
   - [ ] No security issues
4. Skip adversarial review agent
```

---

### Override 6: Test Mode Adjustments

**If both `{economy_mode}` and `{test_mode}` are true:**

```
Economy test strategy:
1. Analyze tests with Glob + Grep (not explore-codebase agent)
2. Read 1-2 similar test files for patterns
3. Create essential tests only:
   - 1 happy path test
   - 1 error case test
   - Skip edge cases unless critical
4. Run tests directly (no agent)
```

</override_rules>

---

<step_specific_overrides>

## Step-by-Step Economy Overrides

### Step 01: Analyze (Economy)
```
INSTEAD OF: 3 parallel exploration agents
DO:
1. Glob "**/*{keyword}*" for task-related files
2. Grep for specific patterns in src/
3. Read top 3-5 most relevant files
4. Skip web research unless stuck
```

### Step 02: Plan (Economy)
```
Same as default - planning doesn't use agents
```

### Step 03: Execute (Economy)
```
Same as default - execution doesn't use agents
```

### Step 04: Validate (Economy)
```
INSTEAD OF: Comprehensive validation
DO:
1. Run typecheck + lint
2. Run only affected tests
3. Quick manual review
4. Skip coverage analysis
```

### Step 05: Examine (Economy)
```
INSTEAD OF: code-reviewer agent
DO:
1. Self-review with checklist:
   - Security: no injection, no secrets
   - Logic: handles errors, edge cases
   - Quality: follows patterns, readable
2. Note any concerns
3. Move to resolve if issues found
```

### Step 07: Tests (Economy)
```
INSTEAD OF: Deep test analysis with agents
DO:
1. Glob for existing test files
2. Read 1 similar test file
3. Create minimal test coverage
4. Focus on critical paths only
```

### Step 08: Run Tests (Economy)
```
Same as default - test running doesn't use agents
```

</step_specific_overrides>

---

<economy_indicator>
**When economy mode is active, start each step with:**

```
⚡ ECONOMY MODE - Using direct tools, no subagents
```

This reminds both Claude and the user that economy mode is active.
</economy_indicator>

---

<success_metrics>
Economy mode is successful when:
- No Task tool calls with subagent_type
- Direct Glob/Grep/Read usage instead
- Fewer than 3 WebSearch calls total
- Implementation still correct and working
- Tests pass (if test_mode enabled)
</success_metrics>
