---
description: Generate conversion-focused landing page copywriting based on PRD and marketing context
---

<objective>
Generate a complete, ready-to-use landing page copywriting document that converts visitors into customers.

Focus on benefits over features, emotional resonance, and proven conversion frameworks. This comes AFTER the PRD and ARCHI - the PRD defines WHAT to build, ARCHI defines HOW, this creates the COPY that sells.
</objective>

<process>
## Phase 1: Locate Project Files

1. **Ask for project location**:
   > "Where is your project located?"

2. **Find and read all files** (use Glob):
   - `**/PRD.md` or `**/*prd*.md`
   - `**/ARCHI.md` or `**/*archi*.md`
   - `**/*marketing*/**/*.md`
   - `**/*objection*.md`
   - `**/*competitive*.md`

3. **Save PRD directory path** - Create LANDING_PAGE.md in SAME directory as PRD

## Phase 2: Extract Context

4. **From PRD extract**:
   - Target users and personas
   - Pain points and problems
   - Features and solutions
   - Success metrics

5. **From ARCHI extract**:
   - Technical advantages to translate into benefits
   - Unique capabilities

6. **From marketing files extract**:
   - Existing headlines and value props
   - Objections that need handling
   - Competitive positioning angles

## Phase 3: Research Best Practices

7. **Web search for**:
   - "SaaS landing page copywriting 2025 best practices"
   - "conversion copywriting frameworks AIDA PAS PRESTO"
   - "high converting landing page examples [industry]"

8. **Analyze 3-5 top landing pages** in same category using WebFetch

## Phase 4: Choose Framework

9. **Select copywriting framework**:

**AIDA** (Attention, Interest, Desire, Action):
- Use for: Broad audiences, new categories, educational sells
- Best when: Need to build interest gradually

**PAS** (Problem, Agitate, Solution):
- Use for: Strong pain points, clear problems, urgent needs
- Best when: Users actively seeking solutions

**PRESTO** (Promise, Repeat, Evidence, Stakes, Transition, Offer):
- Use for: Complex products, B2B, service-heavy SaaS
- Best when: Longer sales cycles, need credibility building

**Hybrid**: Combine frameworks for different sections

## Phase 5: Generate Copy

10. **Create LANDING_PAGE.md** with ALL sections:

```markdown
# Landing Page Copywriting: [Product Name]

## Target Audience Summary
[From PRD - who, pain points, goals]

## Copywriting Framework
**Primary**: [AIDA/PAS/PRESTO/Hybrid]
**Strategy**: [Brief explanation]

---

## HERO SECTION

### Headline (H1)
**Option 1**: [Benefit-focused]
**Option 2**: [Timeline/result-focused]
**Option 3**: [Transformation-focused]
**Recommended**: [Which and why]

### Subheadline (H2)
[Supporting detail that clarifies the promise]

### Primary CTA
**Button**: [Action-oriented text]
**Micro-copy**: [Trust-building text under button]

### Social Proof Snippet
[Quick credibility: "Join 10,000+ creators"]

---

## PROBLEM SECTION

### Section Headline
[Empathetic headline calling out the pain]

### Pain Points
- **[Pain 1]**: [Emotional description]
- **[Pain 2]**: [Emotional description]
- **[Pain 3]**: [Emotional description]

### Agitation Paragraph
[2-3 sentences deepening the pain]

---

## SOLUTION SECTION

### Headline
[How your product solves the problem]

### Value Proposition
[2-3 sentences on unique approach]

### Benefits (3-4 cards)
**Benefit 1**: [Headline]
- Copy: [2-3 sentences]
- Icon: [Suggestion]

[Repeat for each benefit]

---

## FEATURES SECTION

### Section Headline
[Features presented as benefits]

### Feature 1: [Name]
**Headline**: [Benefit-focused]
**Description**: [2-3 sentences - benefit + how it works]

[Repeat for each feature]

---

## SOCIAL PROOF

### Section Headline
[Trust-building headline]

### Testimonials
**Quote 1**: "[Specific result achieved]"
- Author: [Name, Role, Company]
- Result: [Specific metric]

[Repeat 2-3 more]

### Trust Indicators
- [Number of users]
- [Notable clients]
- [Recognition/awards]

---

## OBJECTION HANDLING

### Objection 1: [Common concern]
**Response**: [How you address it]

[Repeat for each objection]

---

## FAQ

### Q: [Most common question]
**A**: [Clear answer]

[5-8 FAQs covering blockers]

---

## PRICING (if applicable)

### Section Headline
[Value-focused]

### Tier 1: [Name] - $X/mo
**For**: [Who]
**Features**: [List]
**CTA**: [Button text]

[Repeat for each tier]

### Guarantee
[Money-back guarantee text]

---

## FINAL CTA

### Headline
[Compelling call to action]

### Supporting Copy
[2-3 sentences creating urgency]

### CTA
**Button**: [Strong action verb]
**Trust**: [Final reassurance]

---

## TONE & VOICE

**Overall**: [Professional/Casual/Technical]
**Words to use**: [Power words]
**Words to avoid**: [Jargon to skip]
```
</process>

<constraints>
**BENEFIT TRANSLATION FORMULA**:
- Feature: "We have X"
- Function: "X does Y"
- Benefit: "So you can Z" ← ALWAYS get here

**HEADLINE PATTERNS**:
- [Benefit] in [Timeframe]: "Create your SaaS in 30 days"
- [Transformation] for [Audience]: "From Zero to Developer for Entrepreneurs"
- [Promise] without [Pain]: "Build apps without coding headaches"

**CTA RULES**:
- Use action verbs: Start, Create, Build, Launch, Join, Get
- Add value context: "Start Building Free" vs "Sign Up"
- Create urgency: "Join 500 Early Users"

**NEVER**:
- Write generic copy that fits any product
- Lead with features instead of benefits
- Skip the research phase
- Use placeholder text instead of real copy
- Save file in wrong location
</constraints>

<output>
**File**: LANDING_PAGE.md in same directory as PRD
**Content**: Complete copy for all sections (not placeholders)
**Headlines**: 3 options for hero with recommendation
**Benefits**: All features translated using benefit formula
**Objections**: All objections from files addressed
</output>

<success_criteria>
- Hero section has 3 headline options with clear recommendation
- ALL sections have benefit-focused copy (not feature-focused)
- CTAs are action-oriented and specific
- All objections from files are addressed
- Copy aligns with PRD target users and pain points
- Technical advantages from ARCHI translated to benefits
- File saved in same directory as PRD
</success_criteria>
