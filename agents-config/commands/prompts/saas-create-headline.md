---
description: Generate clickbait headlines that sound too good to be true for your landing page
arguments:
  - name: product-description
    description: Brief description of your product and what it does
    required: true
---

<objective>
Generate 10+ headline options for a landing page that make visitors say "Wait… what?"

Headlines should sound slightly clickbait - bold enough to spark curiosity and open a loop in the reader's brain.
</objective>

<process>
## Phase 1: Understand the Product

**Product**: #$ARGUMENTS.product-description

1. **If project exists**, find and read:
   - `**/PRD.md` or `**/*prd*.md`
   - `**/*marketing*/**/*.md`
   - Existing landing page files

2. **Extract**:
   - Core transformation (before → after)
   - Main pain point
   - Target audience
   - Key differentiator

## Phase 2: Generate Headlines

4. **Apply the TechCrunch test**: If TechCrunch wrote an article about this product, what would the headline be?

5. **Generate 10+ headlines** using these patterns:

**Result + Timeline**:

- "Launch your SaaS in days, not months"
- "Learn to code in weeks, not years"

**Transformation Promise**:

- "From zero to shipped in one weekend"
- "Turn your idea into a live product tonight"

**Pain Elimination**:

- "Never write boilerplate code again"
- "Stop wasting months building the same features"

**Social Proof + Promise**:

- "Join 7,000+ developers who ship faster"
- "The secret 10,000 entrepreneurs use to launch"

**Specific Number**:

- "Get 10x more done with half the work"
- "Build a $10K/month SaaS in 30 days"

**Question Format**:

- "What if you could launch this weekend?"
- "Ready to ship your startup in 48 hours?"

**Too-Good-To-Be-True**:

- "All the code you need. None of the headaches."
- "Build like a senior dev on day one."

## Phase 3: Output

6. **Create HEADLINE.md** with this exact format:

```markdown
# Headline Options for [Product Name]

## Recommended

**[Best headline]**
_Why: [One sentence explaining why this works]_

## All Options

1. [Headline]
2. [Headline]
3. [Headline]
4. [Headline]
5. [Headline]
6. [Headline]
7. [Headline]
8. [Headline]
9. [Headline]
10. [Headline]

## Testing Advice

Send to 5 friends. After 24h, ask which they remember. Pick that one.
```

</process>

<constraints>
**GOOD HEADLINES**:
- Sound too good to be true
- Open a curiosity loop
- Focus on results, not features
- Are specific (numbers, timeframes)
- Make people scroll to learn more

**BAD HEADLINES**:

- Generic: "The best solution for X"
- Feature-focused: "We have AI-powered..."
- Boring: "Welcome to our product"
- Safe: "A tool for developers"
- Vague: "Build better software"

**NEVER**:

- Write "clean" or "safe" copy that nobody remembers
- Use corporate jargon
- Lead with features
- Be forgettable
  </constraints>

<output>
**File**: HEADLINE.md in same directory as PRD (or current directory)
**Content**: 10+ headline options with clear recommendation
**Format**: Simple list, no fluff
</output>
