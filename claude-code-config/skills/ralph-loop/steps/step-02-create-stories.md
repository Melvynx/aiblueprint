---
name: step-02-create-stories
description: Transform PRD into user stories (prd.json)
prev_step: steps/step-01-interactive-prd.md
next_step: steps/step-03-finish.md
---

# Step 2: Create User Stories

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER create stories without reading PRD.md first
- 🛑 NEVER make stories too large - each must fit in ONE iteration
- 🛑 NEVER run ralph.sh - only create prd.json, user runs commands
- ✅ ALWAYS include acceptance criteria for each story
- ✅ ALWAYS set correct priority order (1 = first to implement)
- 📋 YOU ARE a story writer, not an implementer
- 💬 FOCUS on breaking down PRD into atomic stories
- 🚫 FORBIDDEN to proceed without user confirmation

## EXECUTION PROTOCOLS:

- 🎯 Read PRD.md completely before writing stories
- 💾 Save prd.json after user approval
- 📖 Each story must have clear acceptance criteria
- 🚫 FORBIDDEN to load next step until prd.json is saved

## CONTEXT BOUNDARIES:

**Available from previous steps:**
- `{project_path}` - Absolute path to project
- `{ralph_dir}` - Path to .claude/ralph
- `{feature_name}` - Feature folder name
- `{feature_dir}` - Path to feature folder
- PRD.md exists in `{feature_dir}`

## YOUR TASK:

Transform the PRD into a prd.json file with properly structured user stories that Ralph can execute.

---

## EXECUTION SEQUENCE:

### 1. Read PRD.md

```bash
Read: {feature_dir}/PRD.md
```

Extract:
- Feature name and description
- All user stories/tasks
- Acceptance criteria
- Technical notes

### 2. Generate Branch Name

Create a branch name from the feature:
- Format: `feat/{feature-name}`
- Example: `feat/01-add-auth` or `feat/user-dashboard`

### 3. Transform Stories to JSON

**For each story in the PRD, create a JSON object:**

```json
{
  "id": "US-001",
  "title": "Short descriptive title",
  "acceptanceCriteria": [
    "Specific criterion 1",
    "Specific criterion 2",
    "TypeScript compiles",
    "Tests pass"
  ],
  "priority": 1,
  "passes": false,
  "notes": "Any context Claude needs"
}
```

**Story Sizing Rules:**

✅ **Good Story Size:**
- Can be implemented in 5-30 minutes
- Changes 1-5 files
- Has clear start and end
- Independent (can be committed alone)

❌ **Story Too Large - Split It:**
- "Build entire auth system" → Split into 10+ stories
- "Add user dashboard" → Split into individual widgets
- "Refactor module" → Split by function/component

❌ **Story Too Small - Combine:**
- "Add import statement" → Combine with the story that uses it
- "Fix typo" → Combine with related story

### 4. Structure prd.json

```json
{
  "branchName": "feat/{feature-name}",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add FeatureType enum value",
      "acceptanceCriteria": [
        "FEATURE_TYPE added to enum in schema",
        "TypeScript compiles without errors"
      ],
      "priority": 1,
      "passes": false,
      "notes": "First step - add the type before using it"
    },
    {
      "id": "US-002",
      "title": "Create feature handler skeleton",
      "acceptanceCriteria": [
        "New handler file created following existing patterns",
        "Basic structure in place",
        "TypeScript compiles"
      ],
      "priority": 2,
      "passes": false,
      "notes": "Follow pattern from existing handlers"
    }
    // ... more stories
  ]
}
```

### 5. Priority Guidelines

**Priority determines execution order (1 = first):**

1. **Foundation** (Priority 1-5)
   - Schema changes
   - Type definitions
   - Base interfaces

2. **Core Logic** (Priority 6-15)
   - Business logic
   - Main functionality
   - API endpoints

3. **UI Components** (Priority 16-25)
   - Display components
   - Forms
   - Interactions

4. **Integration** (Priority 26-35)
   - Connect pieces
   - Error handling
   - Edge cases

5. **Polish** (Priority 36+)
   - Tests
   - Documentation
   - Cleanup

### 6. Present Stories for Review

Show all stories to user:

```
📋 User Stories for {feature_name}

Branch: {branchName}
Total stories: {count}

| ID | Priority | Title |
|----|----------|-------|
| US-001 | 1 | Add FeatureType enum value |
| US-002 | 2 | Create feature handler skeleton |
| ... | ... | ... |

[Show full JSON for review]
```

**Use AskUserQuestion:**
```yaml
questions:
  - header: "Stories"
    question: "Do these user stories look correct? Any changes needed?"
    options:
      - label: "Looks good, save them (Recommended)"
        description: "Save prd.json and get run instructions"
      - label: "Adjust stories"
        description: "I want to add, remove, or modify some stories"
      - label: "Re-read PRD"
        description: "Let me update PRD.md first, then try again"
    multiSelect: false
```

### 7. Iterate if Needed

If user wants changes:
- Ask what to change
- Add/remove/modify stories
- Adjust priorities
- Present again

### 8. Save prd.json

Once approved, save to `{feature_dir}/prd.json`:

```bash
# Use Write tool
Write to: {feature_dir}/prd.json
Content: [JSON with proper formatting]
```

**Also update progress.txt with key files:**

```bash
# Append to progress.txt
Edit: {feature_dir}/progress.txt

Append:
## Key Files
- {list of files that will be modified}
- {based on PRD technical design}
```

---

## STORY QUALITY CHECKLIST:

Before saving, verify each story:

✅ **Atomic** - One clear thing to implement
✅ **Independent** - Can be committed alone
✅ **Testable** - Clear acceptance criteria
✅ **Prioritized** - Dependencies come first
✅ **Sized Right** - 5-30 minutes of work
✅ **Has Context** - Notes explain what Claude needs to know

## SUCCESS METRICS:

✅ PRD.md read completely
✅ All stories extracted and structured
✅ Priorities set correctly (dependencies first)
✅ Each story has acceptance criteria
✅ User approved the stories
✅ prd.json saved correctly
✅ progress.txt updated with key files

## FAILURE MODES:

❌ Stories too large (will fail to complete in one iteration)
❌ Missing acceptance criteria
❌ Wrong priority order (dependency after dependent)
❌ No TypeScript/test criteria in stories
❌ Skipped user approval

## STORY CREATION PROTOCOLS:

- Always include "TypeScript compiles" in acceptance criteria
- Always include "Tests pass" if project has tests
- Use consistent ID format: US-001, US-002, etc.
- Notes should explain patterns to follow
- Group related stories with consecutive priorities

## NEXT STEP:

After prd.json is saved, load `./step-03-finish.md` to show run instructions.

<critical>
Remember: Story size is CRITICAL. Each story must be completable in one Ralph iteration.
If in doubt, split into smaller stories. More small stories > fewer large stories.
</critical>
