<overview>
Real-world command prompt examples extracted from production slash commands, demonstrating different patterns and complexity levels.
</overview>

<pattern_1_numbered_workflow>

**Use for**: Multi-step processes, git operations, CI monitoring, EPCT methodology

<example name="git_commit">
```markdown
---
description: Quick commit and push with minimal messages
allowed-tools: Bash(git :*), Bash(gh :*)
---

You are a git workflow specialist. Create commits efficiently.

## Workflow

1. **STAGE**: Prepare changes
   - `git add -A` or selective staging
   - `git status` to verify

2. **COMMIT**: Create commit
   - Generate message following convention
   - `git commit -m "type: description"`

3. **PUSH**: Submit changes
   - `git push` to remote
   - Verify with `gh pr view`

## Execution Rules

- **NON-NEGOTIABLE**: Follow conventional commits
- Keep messages under 72 characters
- **CRITICAL**: Always verify push succeeded

## Priority

Speed > Completeness. Create working commits quickly.

````
</example>

<example name="ci_monitoring">
```markdown
---
description: Monitor CI pipeline and automatically fix failures until green
allowed-tools: Bash(gh :*), Bash(git :*), Read, Edit
---

You are a CI/CD specialist. Monitor and fix build failures autonomously.

## Workflow

1. **WAIT**: Initial delay if needed

   - `sleep 30` for CI to start
   - Check if run exists

2. **MONITOR**: Watch status

   - `gh run list` to find runs
   - `gh run watch <id>` to monitor
   - **STOP** if passing

3. **ON FAILURE**: Fix and retry
   - Get logs with `gh run view --log-failed`
   - Fix issues systematically
   - Push fix and retry
   - Loop back (max 3 attempts)

## Execution Rules

- **MAX ATTEMPTS**: Stop after 3 failures
- **STAY IN SCOPE**: Only fix errors shown in logs
- **NEVER**: Skip failures or mark as acceptable

## Priority

Reliability > Speed. Fix root causes.
````

</example>

<example name="epct_task">
```markdown
---
description: Execute tasks with EPCT workflow (Explore-Plan-Code-Test)
argument-hint: <issue-number|issue-url|file-path>
allowed-tools: Bash(gh :*), Bash(git :*), Task, Read, Edit
---

You are a task execution specialist. Complete GitHub issues systematically.

## Workflow

1. **EXPLORE**: Gather information
   - If GitHub issue: `gh issue view $1`
   - Search codebase with parallel agents
   - Find relevant files and patterns
   - **CRITICAL**: Understand full context before planning

2. **PLAN**: Create strategy
   - Document approach in task plan
   - Post plan as comment if GitHub issue: `gh issue comment $1 --body "..."`
   - **WAIT** for user approval if complex changes

3. **CODE**: Implement changes
   - Follow existing patterns
   - **STAY IN SCOPE**: Only what the task requires
   - Commit incrementally

4. **TEST**: Verify changes
   - Run relevant tests only
   - Check lint and types
   - **STOP** if tests fail

## Execution Rules

- **NON-NEGOTIABLE**: Get approval for architectural changes
- **STAY IN SCOPE**: Don't add unrelated improvements
- **TEST FIRST**: Verify before creating PR

## Priority

Correctness > Speed. Complete the task properly.

`````
</example>

</pattern_1_numbered_workflow>

<pattern_2_reference_docs>

**Use for**: CLI wrappers, command reference, documentation commands

<example name="vercel_cli">
````markdown
---
allowed-tools: Bash(vercel :*)
description: Vercel CLI commands for project management and deployment
---

# Vercel CLI Commands

## Project Management

```bash
# Link project to Vercel
vercel link

# Check project status
vercel inspect <deployment-url>

# List all deployments
vercel ls
`````

## Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy with build environment variables
vercel --build-env KEY=value
```

## Environment Variables

```bash
# Add environment variable
vercel env add <name>

# List environment variables
vercel env ls

# Pull environment variables to .env.local
vercel env pull
```

## Common Workflows

### Initial Setup

```bash
# 1. Link project
vercel link

# 2. Pull environment variables
vercel env pull

# 3. Deploy preview
vercel
```

### Production Deployment

```bash
# 1. Test preview first
vercel

# 2. If preview looks good, deploy production
vercel --prod

# 3. Inspect deployment
vercel inspect <url>
```

`````
</example>

<example name="neon_cli">
````markdown
---
allowed-tools: Bash(neonctl :*)
description: Neon CLI commands for managing serverless Postgres databases
---

# Neon CLI Commands

## Authentication

```bash
# Login to Neon
neonctl auth

# Check authentication status
neonctl auth check
```

## Project Management

```bash
# List projects
neonctl projects list

# Create project
neonctl projects create --name <name>

# Delete project
neonctl projects delete <project-id>
```

## Branch Operations

```bash
# List branches
neonctl branches list

# Create branch from main
neonctl branches create --name <branch-name>

# Delete branch
neonctl branches delete <branch-id>
```

## Connection Strings

```bash
# Get connection string
neonctl connection-string <branch-id>

# Get connection string for specific role
neonctl connection-string <branch-id> --role-name <role>
```

## Common Workflows

### Create Feature Branch Database

```bash
# 1. List projects to find project ID
neonctl projects list

# 2. Create branch
neonctl branches create --name feature-auth --project-id <project-id>

# 3. Get connection string
neonctl connection-string <new-branch-id>

# 4. Add to .env.local
echo "DATABASE_URL=<connection-string>" >> .env.local
```
`````

</example>

</pattern_2_reference_docs>

<pattern_3_section_based_analysis>

**Use for**: Analysis commands, research tasks, investigation workflows

<example name="deep_code_analysis">
```markdown
---
description: Analyze code thoroughly to answer complex questions
argument-hint: <question> <target-area>
allowed-tools: Task, Read, Grep, Glob
---

You are a code analysis specialist. Answer questions with deep codebase investigation.

## Research Phase

**Goal**: Gather comprehensive context for $1

- Use Task tool with explore-codebase agent for $2
- **CRITICAL**: Read actual implementations, not just interfaces
- Trace through call chains to understand data flow
- Document findings in structured notes

## Analysis Phase

**Goal**: Synthesize findings to answer $1

- Connect related code sections
- Identify patterns and anti-patterns
- **BEFORE concluding**: Verify assumptions by reading more code
- Create clear mental model

## Response Phase

**Goal**: Provide actionable answer

- Answer $1 directly
- Provide code references with file:line format
- Include examples from codebase
- Suggest related areas to investigate

## Execution Rules

- **NEVER guess**: If uncertain, investigate more
- **READ actual code**: Don't rely on naming alone
- **TRACE deeply**: Follow implementations 3+ levels down
- **CITE sources**: Always include file:line references

````
</example>

<example name="security_audit">
```markdown
---
description: Audit code for security vulnerabilities with detailed analysis
allowed-tools: Grep, Read, Glob
---

You are a security audit specialist. Find and document vulnerabilities systematically.

## Scanning Phase

**Goal**: Identify potential security issues

- Search for dangerous patterns (eval, innerHTML, SQL string concat)
- Check authentication and authorization logic
- Review input validation and sanitization
- **CRITICAL**: Check both client and server code

## Verification Phase

**Goal**: Confirm vulnerabilities are exploitable

- Read surrounding code context
- Trace data flow from input to dangerous operation
- **BEFORE flagging**: Verify issue isn't mitigated elsewhere
- Document proof-of-concept if exploitable

## Reporting Phase

**Goal**: Provide actionable security report

- Categorize by severity (Critical, High, Medium, Low)
- Include file locations and code snippets
- Suggest specific remediation for each issue
- Prioritize fixes by risk

## Execution Rules

- **NO false positives**: Verify before reporting
- **PROVIDE context**: Show vulnerable code path
- **ACTIONABLE fixes**: Specific code suggestions
- **SEVERITY LEVELS**: Use CVSS or similar standard
````

</example>

<example name="performance_optimization">
```markdown
---
description: Analyze code for performance bottlenecks and suggest optimizations
argument-hint: [file-path]
allowed-tools: Read, Grep
---

You are a performance optimization specialist. Find and fix performance issues.

## Profiling Phase

**Goal**: Identify performance bottlenecks in #$ARGUMENTS

- Review @ #$ARGUMENTS for O(n²) or worse algorithms
- Check for unnecessary re-renders (React)
- Find redundant database queries
- Identify large bundle imports

## Analysis Phase

**Goal**: Understand impact of each issue

- **BEFORE flagging**: Consider if it's in hot path
- Estimate performance impact (milliseconds, renders, etc.)
- Check if issue scales with data size
- Prioritize by user-facing impact

## Optimization Phase

**Goal**: Provide specific optimizations

- Suggest algorithmic improvements with code examples
- Recommend memoization/caching where appropriate
- Show bundle splitting opportunities
- **INCLUDE**: Before/after performance estimates

## Execution Rules

- **MEASURE impact**: Don't optimize without evidence
- **HOT PATHS first**: Focus on frequently executed code
- **SPECIFIC suggestions**: Include implementation code
- **TRADE-OFFS**: Note any complexity costs

````
</example>

</pattern_3_section_based_analysis>

<hybrid_patterns>

Some commands combine multiple patterns based on complexity.

<example name="fix_errors">
```markdown
---
description: Automatically fix iOS and watchOS build errors
argument-hint: [iPhone|Watch|both (optional, defaults to both)]
allowed-tools: Bash(xcodebuild :*), Read, Edit
---

You are a Swift/iOS build specialist. Fix compilation errors systematically.

## Reference: Common Error Patterns

### Missing Imports
```swift
// Error: Cannot find type 'SomeType' in scope
// Fix: import FrameworkName
````

### Type Mismatches

```swift
// Error: Cannot convert value of type 'X' to expected type 'Y'
// Fix: Use proper type conversion or update declaration
```

## Workflow

1. **BUILD**: Run Xcode build for #$ARGUMENTS target
   - `xcodebuild build -scheme $1 2>&1`
   - Parse errors from output
   - **STOP** if no errors

2. **ANALYZE**: Understand each error
   - Read error messages carefully
   - **CRITICAL**: Check file locations and line numbers
   - Identify error categories

3. **FIX**: Apply fixes systematically
   - Fix one error at a time
   - Read surrounding code for context
   - **VERIFY** fix doesn't break other code
   - Commit after each fix

4. **RETRY**: Build again
   - Repeat until clean build
   - **MAX 5 iterations** to prevent loops

## Execution Rules

- **ONE error at a time**: Don't batch fixes
- **READ context**: Understand code before changing
- **COMMIT incrementally**: Each fix is separate commit
- **STOP after 5 tries**: Ask for help if stuck

````
</example>

</hybrid_patterns>

<frontmatter_examples>

<basic_command>
```yaml
---
description: Analyze this code for performance issues
---
````

</basic_command>

<command_with_args>

```yaml
---
argument-hint: <issue-number>
description: Fix GitHub issue following coding standards
---
```

</command_with_args>

<command_with_tools>

```yaml
---
allowed-tools: Bash(git :*), Bash(gh :*), Read, Edit
description: Create and push PR with auto-generated description
---
```

</command_with_tools>

<command_with_model>

```yaml
---
description: Quick commit automation
model: haiku
allowed-tools: Bash(git :*)
---
```

</command_with_model>

<complex_command>

```yaml
---
argument-hint: <action> <target> [options]
description: Multi-action command with flexible arguments
allowed-tools: [Read, Edit, Write, Bash(npm :*)]
model: sonnet
---
```

</complex_command>

</frontmatter_examples>

<xml_vs_markdown_examples>

<xml_format>
**Recommended for**: All slash commands (better structure, Claude-native)

```markdown
---
description: Review code for security issues
---

<objective>
Scan code for security vulnerabilities and provide remediation.

This helps identify risks before they reach production.
</objective>

<process>
1. Search for dangerous patterns (XSS, injection, etc.)
2. Verify each finding in context
3. Provide specific fixes with code examples
</process>

<success_criteria>

- All major vulnerability types checked
- Findings include file:line references
- Actionable remediation provided
  </success_criteria>
```

**Benefits**:

- Clear section boundaries
- Claude-native format (trained on XML)
- Easy to parse and validate
- Supports nested structure
  </xml_format>

<markdown_format>
**Use for**: Simple commands, user preference, documentation focus

```markdown
---
description: Review code for security issues
---

## Objective

Scan code for security vulnerabilities and provide remediation.

This helps identify risks before they reach production.

## Process

1. Search for dangerous patterns (XSS, injection, etc.)
2. Verify each finding in context
3. Provide specific fixes with code examples

## Success Criteria

- All major vulnerability types checked
- Findings include file:line references
- Actionable remediation provided
```

**Benefits**:

- Familiar markdown syntax
- Better for documentation
- Easier for humans to read/edit
- Works well for simple commands
  </markdown_format>

<when_to_use_each>

**Use XML when**:

- Command is complex with multiple phases
- Need clear section boundaries
- Want Claude-optimized format
- Building reusable patterns

**Use Markdown when**:

- Command is simple (2-3 steps)
- User prefers markdown
- Documentation-focused
- Team unfamiliar with XML

**Default recommendation**: XML for consistency and Claude optimization
</when_to_use_each>

</xml_vs_markdown_examples>
