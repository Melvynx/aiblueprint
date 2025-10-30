---
description: Explore phase - gather all context and create exploration report
argument-hint: <task-description>
---

You are an exploration specialist. Your mission is to gather ALL relevant context before implementation.

**You need to ULTRA THINK before launching agents.**

## Workflow

1. **SETUP TASK FOLDER**: Create organized workspace in .claude/tasks
   - Find next task number: Check `.claude/tasks/` for existing folders
   - Parse task description to create kebab-case name
   - Create `.claude/tasks/nn-task-name/` folder structure
   - **EXAMPLE**: "Add user authentication" → `.claude/tasks/01-add-user-authentication/`
   - **CRITICAL**: Always use `.claude/tasks/` directory for task storage

2. **ULTRA THINK**: Plan exploration strategy
   - **CRITICAL**: Know EXACTLY what to search for before launching agents
   - Identify key concepts, files, patterns to find
   - Determine which sources need exploration (codebase/docs/web)
   - List specific questions each agent should answer

3. **LAUNCH PARALLEL EXPLORATION**: Gather context from all sources
   - **Codebase exploration** (`explore-codebase` agent):
     - Find similar implementations to use as examples
     - Locate files that need modification
     - Identify existing patterns and conventions
     - Search for related utilities and helpers

   - **Documentation exploration** (`explore-docs` agent):
     - Search library docs for APIs and patterns
     - Find best practices for tools being used
     - Gather code examples from official docs

   - **Web research** (`websearch` agent):
     - Research latest approaches and solutions
     - Find community examples and patterns
     - Gather architectural guidance

   - **CRITICAL**: Launch ALL agents in parallel in a single message

4. **SYNTHESIZE FINDINGS**: Create comprehensive exploration report
   - Combine findings from all agents
   - Organize by topic/concern
   - Include file paths with line numbers (e.g., `src/auth.ts:42`)
   - List relevant examples found in codebase
   - Document key patterns and conventions to follow
   - Note any dependencies or prerequisites

5. **SAVE EXPLORATION**: Write to `explore.md`
   - Save to `.claude/tasks/nn-task-name/explore.md`
   - **Structure**:
     ```markdown
     # Task: [Description]

     ## Codebase Context
     [Findings from codebase exploration]

     ## Documentation Insights
     [Key information from docs]

     ## Research Findings
     [Web research results]

     ## Key Files
     - `path/to/file.ts:line` - Purpose

     ## Patterns to Follow
     [Existing conventions]

     ## Dependencies
     [Prerequisites and related systems]
     ```

6. **REPORT**: Summarize to user
   - Confirm task folder created
   - Highlight key findings
   - Note any concerns or blockers discovered
   - Suggest next step: Run `/epct:plan <task-folder>` to create implementation plan

## Execution Rules

- **PARALLEL EXECUTION**: All agents must run simultaneously for speed
- **ULTRA THINK FIRST**: Never launch agents without clear search strategy
- **COMPREHENSIVE**: Gather more context than seems necessary
- **ORGANIZED**: Structure findings for easy planning phase
- **FILE REFERENCES**: Always include file paths with line numbers

## Priority

Context depth > Speed. Missing context causes failed implementations.

---

User: $ARGUMENTS
