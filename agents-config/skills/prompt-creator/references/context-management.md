<overview>
Claude 4 context window management, long-horizon reasoning strategies, and state tracking best practices from Anthropic's official documentation.
</overview>

<context_windows>

<size_limits>
**Standard models:** 200,000 tokens
**Claude.ai Enterprise:** 500,000 tokens
**Claude Sonnet 4 and 4.5** (beta, tier 4+ orgs): 1,000,000 tokens

**Premium pricing:** Requests exceeding 200K tokens incur 2x input, 1.5x output pricing.
</size_limits>

<how_context_accumulates>
Each user message and assistant response accumulates within the context window. Previous exchanges remain intact, creating linear growth.

**Each turn consists of:**
- Input phase: prior history + current message
- Output phase: response that becomes future input

**Extended thinking integration:**
All tokens (including thinking blocks) count toward limits. However, thinking blocks are automatically stripped from subsequent turns, preserving token capacity.

Formula: `context_window = (input_tokens - previous_thinking_tokens) + current_turn_tokens`

During tool use with extended thinking, thinking blocks must accompany tool results to maintain reasoning continuity, then can be dropped afterward.
</how_context_accumulates>

<context_awareness>
**Claude Sonnet 4.5 and Haiku 4.5** include context awareness - tracking remaining tokens throughout conversations.

Models receive:
- Initial budget information
- Periodic updates on remaining capacity

This enables more effective task execution and resource management.

**Key instruction for systems with auto-compaction:**
```xml
<context>
Your context window will be automatically compacted as it approaches
its limit, allowing you to continue working indefinitely from where
you left off.
</context>
```

This prevents Claude from artificially stopping work early when using systems like Claude Code that handle context compaction.
</context_awareness>

<best_practices>
- Use token counting API to estimate usage before sending requests
- Plan carefully to avoid exceeding limits; newer models return validation errors rather than silently truncating
- For long-running agent sessions, leverage context awareness to manage token expenditure strategically
- Image tokens count toward context budgets
</best_practices>

</context_windows>

<long_horizon_reasoning>

<core_capabilities>
Claude 4.5 excels at extended reasoning tasks with strong state management. The model maintains orientation across extended sessions by focusing on incremental progress.

Can work across multiple context windows by:
- Saving state to filesystem
- Continuing with fresh contexts
- Discovering state through files (tests, progress, git logs)
</core_capabilities>

<multi_context_strategies>

<strategy name="differentiated_first_context">
Start with framework setup (tests, scripts), then use subsequent windows for iterative work on task lists.

First context: Infrastructure
Later contexts: Task execution
</strategy>

<strategy name="structured_test_tracking">
Create tests before starting and maintain them in organized formats like `tests.json`.

**Critical instruction:**
```xml
<requirements>
It is unacceptable to remove or edit tests because this could lead to
missing or buggy functionality. Tests are the source of truth.
</requirements>
```
</strategy>

<strategy name="quality_of_life_tools">
Encourage Claude to build setup scripts (`init.sh`) for graceful server startup, test execution, and linting.

Benefits:
- Prevents repeated work across context windows
- Standardizes development workflow
- Enables quick verification
</strategy>

<strategy name="fresh_start_advantages">
Rather than context compaction, begin fresh and have Claude discover state through the filesystem.

**Prescriptive instruction:**
```xml
<instructions>
1. Review progress.txt for completed work
2. Check tests.json for test status
3. Examine git logs for implementation history
4. Continue from last checkpoint
</instructions>
```
</strategy>

<strategy name="verification_mechanisms">
Provide tools like Playwright for UI testing so Claude can verify work without continuous human feedback.

Self-verification enables autonomous task completion.
</strategy>

<strategy name="complete_context_usage">
Prompt Claude to work systematically through tasks:

```xml
<objective>
Continue working systematically until you have completed this task.
Use your full context window efficiently.
</objective>
```
</strategy>

</multi_context_strategies>

<state_management>

<structured_formats>
Use JSON for test results and task status - enables schema clarity.

**Example:**
```json
{
  "tests": [
    {"id": 1, "name": "authentication_flow", "status": "passing"}
  ],
  "total": 200,
  "passing": 150
}
```

**Benefits:**
- Machine-parseable
- Clear schema
- Easy validation
- Enables programmatic checks
</structured_formats>

<unstructured_notes>
Freeform progress tracking works well for general advancement context.

**Example progress.txt:**
```
Session 1: Created JWT middleware and types
Session 2: Implemented token refresh logic
Session 3: Added rate limiting (TODO: add tests)
```

**Benefits:**
- Quick to write
- Human-readable
- Captures context and decisions
</unstructured_notes>

<git_integration>
Version control provides work logs and restoration checkpoints. Claude 4.5 performs exceptionally well leveraging git across sessions.

**Recommended instructions:**
```xml
<context>
Use git to track your work:
- Commit after each logical unit
- Write descriptive commit messages
- Use git log to understand previous sessions
- Check git diff before starting to see current state
</context>
```
</git_integration>

<incremental_tracking>
Explicitly request progress documentation and incremental advancement focus.

**Pattern:**
```xml
<requirements>
After completing each task:
1. Update progress.json with status
2. Update progress.txt with summary
3. Commit changes with descriptive message
4. Continue to next task
</requirements>
```
</incremental_tracking>

</state_management>

<key_principles>
Frame instructions to emphasize persistent, autonomous task completion despite context limitations, making clear that infrastructure handles windowing automatically.

**Effective framing:**
```xml
<objective>
Complete the entire feature implementation. Your context window
will be automatically managed, so focus on systematic progress
through all requirements.
</objective>

<requirements>
Work autonomously through the task list. Document progress in
progress.json and tests.json so you can resume seamlessly if needed.
</requirements>
```
</key_principles>

</long_horizon_reasoning>

<prompt_patterns>

<pattern name="context_aware_system_prompt">
For assistants that may work across multiple sessions:

```xml
<context>
You are working in Claude Code, which automatically manages your
context window. You can work indefinitely on complex tasks without
worrying about token limits.

Track your progress in:
- progress.json - structured task status
- progress.txt - session notes
- git commits - implementation history
</context>

<objective>
Complete the full task systematically. Use your context awareness
to manage token usage efficiently.
</objective>
```
</pattern>

<pattern name="state_recovery_prompt">
For resuming work after context refresh:

```xml
<instructions>
Before starting:
1. Read progress.json to understand completed tasks
2. Read progress.txt for context and decisions
3. Check git log --oneline -10 for recent work
4. Review tests.json for test status
5. Continue from the next incomplete task
</instructions>

<requirements>
Never redo completed work. Always verify current state before
proceeding.
</requirements>
```
</pattern>

<pattern name="test_first_long_horizon">
For complex implementations across multiple context windows:

```xml
<objective>
Implement {feature} with complete test coverage. Tests are the
source of truth and must never be removed or edited to pass.
</objective>

<phase_1_setup>
1. Create tests.json with all required tests (status: "pending")
2. Create init.sh for dev environment setup
3. Commit infrastructure before starting implementation
</phase_1_setup>

<phase_2_implementation>
For each test in tests.json:
1. Implement the feature code
2. Run the test
3. If passing: Update tests.json status to "passing"
4. If failing: Fix code (never edit test)
5. Commit when passing
6. Continue to next test
</phase_2_implementation>

<verification>
All tests.json entries must show "passing" before task is complete.
</verification>
```
</pattern>

<pattern name="parallel_research_long_horizon">
For research tasks that may span multiple contexts:

```xml
<objective>
Research {topic} comprehensively. Save findings incrementally to
enable resumption if context refreshes.
</objective>

<instructions>
1. Create research-outline.md with all areas to investigate
2. For each area:
   a. Research thoroughly
   b. Append findings to findings.md
   c. Update research-outline.md to mark completed
   d. Commit progress
3. When all areas complete, synthesize into final-research.md
</instructions>

<output_format>
findings.md should be append-only with clear section markers:
```
## Area 1: Authentication Methods [COMPLETE]
...

## Area 2: Session Management [COMPLETE]
...

## Area 3: Rate Limiting [IN PROGRESS]
...
```
</output_format>
```
</pattern>

</prompt_patterns>

<when_to_use>

<context_awareness_instructions>
Use when:
- Building agents that may work across multiple sessions
- Tasks likely to use >50% of context window
- Long-running implementations with multiple phases
- Research that may need to be paused and resumed

Don't use when:
- Simple, single-shot tasks
- Tasks with clear completion in <10K tokens
- One-off code generation
</context_awareness_instructions>

<state_tracking_patterns>
Use when:
- Task has >5 distinct subtasks
- Implementation may span hours or days
- Multiple people may need to understand progress
- Resumability is important

Don't use when:
- Quick fixes or patches
- Single-file modifications
- Tasks with no meaningful checkpoints
</state_tracking_patterns>

</when_to_use>

<anti_patterns>

<pitfall name="over_documenting_simple_tasks">
❌ Adding progress.json for a 3-line bug fix
✅ Simple tasks don't need state tracking overhead
</pitfall>

<pitfall name="vague_progress_updates">
❌ "Made progress on auth" in progress.txt
✅ "Implemented JWT signing with jose library, created middleware.ts, next: refresh token rotation"
</pitfall>

<pitfall name="ignoring_context_limits">
❌ "Complete this entire 50-file refactor in one response"
✅ "Refactor files systematically, tracking progress in refactor-status.json"
</pitfall>

<pitfall name="forgetting_to_inform_about_compaction">
❌ Not telling Claude about automatic context management
✅ "Your context will be automatically compacted, continue working indefinitely"
</pitfall>

</anti_patterns>
