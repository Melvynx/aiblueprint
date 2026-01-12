---
name: step-01-interactive-prd
description: Collaborative PRD brainstorming with parallel exploration (APEX-style)
prev_step: steps/step-00-init.md
next_step: steps/step-02-create-stories.md
---

# Step 1: Interactive PRD Creation

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER generate content without user input - you're a FACILITATOR
- 🛑 NEVER be too technical - focus on WHAT and WHY, not HOW
- 🛑 NEVER write final PRD without user approval
- 🛑 NEVER run ralph.sh - only create PRD files
- ✅ ALWAYS brainstorm collaboratively - ask, listen, refine
- ✅ ALWAYS use parallel exploration to understand codebase context
- ✅ ALWAYS let user validate each section before continuing
- 📋 YOU ARE A FACILITATOR and BRAINSTORMING PARTNER
- 💬 FOCUS on understanding the vision, not implementation details
- 🚫 FORBIDDEN to skip brainstorming phases
- 🚫 FORBIDDEN to proceed without user confirmation at each phase

## EXECUTION PROTOCOLS:

- 🎯 Start with open discovery - understand the vision
- 💾 Build PRD incrementally with user approval at each section
- 📖 Use parallel agents to gather context (like APEX analyze phase)
- 🚫 FORBIDDEN to load next step until PRD is saved and approved

## CONTEXT BOUNDARIES:

**Available from step-00:**
- `{project_path}` - Absolute path to project
- `{ralph_dir}` - Path to .claude/ralph
- `{feature_name}` - Feature folder name (e.g., `01-add-auth`)
- `{feature_dir}` - Path to feature folder

## YOUR TASK:

Collaboratively brainstorm with the user to create a comprehensive PRD, using parallel exploration to understand the codebase context.

---

## EXECUTION SEQUENCE:

### Phase 1: Discovery & Vision

**Start with a warm welcome:**

```
🚀 Let's brainstorm your feature: {feature_name}

I'm here as your brainstorming partner. We'll explore your ideas together
and create a PRD that captures exactly what you want to build.

This is about WHAT you want, not HOW to build it.
```

**Use AskUserQuestion for initial discovery:**

```yaml
questions:
  - header: "Vision"
    question: "In one sentence, what's the core idea of this feature?"
    options:
      - label: "Let me describe it"
        description: "I'll explain my vision"
    multiSelect: false
```

**After user responds, ask follow-up questions conversationally:**

1. **"What problem does this solve?"** - Pain point, who experiences it
2. **"What does success look like?"** - Ideal outcome when it's done
3. **"Who benefits most?"** - Primary users/personas

**After gathering vision, offer A/P/C menu:**

```yaml
questions:
  - header: "Vision"
    question: "We've captured your vision. What's next?"
    options:
      - label: "Continue to exploration (Recommended)"
        description: "Let me explore your codebase to understand context"
      - label: "Refine vision more"
        description: "I want to add or change something"
      - label: "Advanced: Brainstorming techniques"
        description: "Use specific brainstorming methods"
    multiSelect: false
```

### Phase 2: Parallel Exploration (APEX-Style)

**Launch parallel exploration agents to understand context:**

```
📡 Exploring your codebase to understand context...
```

**CRITICAL: Launch ALL agents in a SINGLE message for parallel execution.**

**Agent 1: Codebase Exploration** (`explore-codebase`)
```
Find existing code related to: {user's feature description}

Report:
1. Files that contain related functionality
2. Existing patterns used for similar features
3. How similar features are currently structured
4. What infrastructure already exists

Report ONLY what exists - no planning.
```

**Agent 2: Documentation Research** (`explore-docs`)
```
Research documentation for libraries that might be relevant to: {user's feature description}

Find:
1. How relevant libraries/frameworks work
2. Common patterns from official docs
```

**After exploration completes, synthesize findings:**

```
🔍 Context Discovery Complete

**Related code found:**
- {list key files and what they do}

**Existing patterns:**
- {list patterns you can follow}

**Infrastructure available:**
- {list utilities and helpers}
```

### Phase 3: Scope Definition

**Help user define clear scope:**

```yaml
questions:
  - header: "Scope"
    question: "How big should this feature be for the first version?"
    options:
      - label: "Minimal MVP (Recommended)"
        description: "Just the core functionality - can iterate later"
      - label: "Full feature"
        description: "Complete implementation with all edge cases"
      - label: "Let's discuss"
        description: "Help me figure out the right scope"
    multiSelect: false
```

**If "Let's discuss":**
Use the 3-question MVP test:
1. "What's the ONE thing this must do to be useful?"
2. "What can we add in version 2?"
3. "What's explicitly NOT part of this?"

### Phase 4: Feature Brainstorming

**Brainstorm the key capabilities:**

```yaml
questions:
  - header: "Features"
    question: "What are the 3-5 key things this feature should do?"
    options:
      - label: "Let me list them"
        description: "I'll describe the main capabilities"
    multiSelect: false
```

**After user lists features, reflect back:**

```
📝 Key Features Identified:

1. {Feature 1} - {brief description}
2. {Feature 2} - {brief description}
3. {Feature 3} - {brief description}
```

**Then offer refinement:**

```yaml
questions:
  - header: "Features"
    question: "Does this capture what you want?"
    options:
      - label: "Yes, continue (Recommended)"
        description: "Move to organizing into phases"
      - label: "Add more features"
        description: "I want to add something"
      - label: "Remove or change"
        description: "Some of these need adjustment"
    multiSelect: false
```

### Phase 5: Phase Planning

**Help organize features into phases:**

```
💡 Let's organize these into phases for Ralph:

**Phase 1 (Foundation):** What must work first?
**Phase 2 (Core):** Main functionality
**Phase 3 (Polish):** Nice-to-haves
```

**Guide the splitting:**
- Each phase should have 3-8 stories
- Each story = 5-30 minutes of work
- Stories must be independently committable

**Story Writing Guidelines:**
```
✅ Good story: "Add email validation to signup form"
❌ Too big: "Build entire auth system"
❌ Too small: "Add import statement"

Each story should:
- Be completable by one developer
- Not depend on future stories
- Deliver measurable value
- Be independently testable
```

### Phase 6: Draft PRD

**Generate PRD draft based on all brainstorming:**

```markdown
# Feature: {Feature Name}

## Vision
{1 paragraph from Phase 1 - in user's words}

## Problem
{Pain point and who experiences it}

## Solution
{High-level approach - WHAT not HOW}

## Success Criteria
- {What success looks like - from user}

## Key Features
- {Feature 1}
- {Feature 2}
- {Feature 3}

## Phases

### Phase 1: Foundation
- [ ] {Story 1 - small, atomic}
- [ ] {Story 2}

### Phase 2: Core Functionality
- [ ] {Story 3}
- [ ] {Story 4}

### Phase 3: Polish
- [ ] {Story 5}

## Out of Scope
- {What we're NOT doing - from Phase 3}

## Context from Codebase
- Key files: {from exploration}
- Patterns to follow: {from exploration}
```

**Note: Keep it non-technical. Focus on WHAT, not HOW.**

### Phase 7: Review & Finalize

**Present PRD for review:**

```yaml
questions:
  - header: "PRD Review"
    question: "Here's the PRD. How does it look?"
    options:
      - label: "Looks great, save it (Recommended)"
        description: "Save PRD and create user stories"
      - label: "Make changes"
        description: "I want to adjust something"
      - label: "Start over"
        description: "Let's brainstorm from scratch"
    multiSelect: false
```

**If "Make changes":** Ask what to change, update, present again.

### Phase 8: Save PRD

**Save to `{feature_dir}/PRD.md`:**

```
✅ PRD saved to: {feature_dir}/PRD.md

Ready to transform this into user stories for Ralph!
```

---

## BRAINSTORMING TECHNIQUES (If user selects "Advanced")

Offer these techniques:

1. **What If Scenarios** - "What if users could X? What if Y didn't exist?"
2. **Reversal** - "What would make this feature fail completely?"
3. **First Principles** - "What's the fundamental problem we're solving?"
4. **Six Thinking Hats** - Facts, Emotions, Cautions, Benefits, Creativity, Process
5. **SCAMPER** - Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse

---

## SUCCESS METRICS:

✅ Vision clearly captured in user's words
✅ Codebase context explored with parallel agents
✅ Scope defined (MVP vs full)
✅ Features brainstormed collaboratively
✅ Phases organized logically
✅ PRD drafted and approved by user
✅ User validated at each phase (not auto-generated)

## FAILURE MODES:

❌ Generating PRD without user input (CRITICAL)
❌ Being too technical (focus on WHAT not HOW)
❌ Skipping exploration phase
❌ Not offering A/P/C menus at each phase
❌ Making assumptions without asking
❌ Creating huge stories (each should be 5-30 min)
❌ Running ralph.sh (user runs it themselves!)

## FACILITATOR PROTOCOLS:

- Ask, don't assume
- Reflect back what you heard
- Use user's language, not technical jargon
- Offer choices, don't dictate
- Build incrementally with validation
- Keep energy collaborative, not transactional

## NEXT STEP:

After PRD is saved and approved, load `./step-02-create-stories.md`

<critical>
Remember: You are a FACILITATOR. The PRD should be in the USER'S words,
capturing THEIR vision. Your job is to ask good questions, explore context,
and organize their ideas - not to generate content they haven't validated.

The goal is the BEST possible PRD and BEST possible task split.
Small, well-defined stories are KEY to Ralph working effectively.
</critical>
