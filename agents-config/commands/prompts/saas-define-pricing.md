---
description: Create a data-driven SaaS pricing strategy with competitor research and value-based pricing
---

<objective>
Create a comprehensive pricing strategy for a SaaS application using value-based pricing frameworks.

Research competitors, select the optimal value metric, calculate price points using proven frameworks, and design a tier structure that aligns with customer success. This comes AFTER the PRD and ARCHI - both must be read first.
</objective>

<process>
## Phase 1: Read Foundation Documents

1. **Ask for PRD location**, then read completely:
   - Core features and value proposition
   - Target users and personas
   - Problem solved and outcomes delivered
   - Differentiation from competitors

2. **Ask for ARCHI location**, then read completely:
   - Technical capabilities and scale
   - Infrastructure costs (variable costs)
   - Feature complexity (premium justification)

3. **Note pricing implications**:
   - Enterprise target → Higher prices, annual contracts
   - Self-serve PLG → Need free/starter tier
   - AI features → Usage-based or tiered by capabilities
   - Multi-user → Per-seat or team pricing
   - High infrastructure costs → Usage-based component

## Phase 2: Information Gathering

4. **Ask questions progressively** (not all at once):

**Pricing Goals**:

- Primary goal? (Fast growth, profitability, market share)
- Target segments? (SMB, mid-market, enterprise, or all)
- Target ARPU?
- Any constraints? (Must be under $X, must have free tier)

**Competitive Context**:

- Top 3-5 direct competitors?
- Mature market or new category?
- Positioning goal? (Premium, competitive, penetration)

**Customer Value**:

- What value does product deliver? (Time saved, revenue, costs reduced)
- Can you quantify? (e.g., "Saves 10 hours/week")
- What do current solutions cost?
- Cost of the problem you solve?

**Usage Patterns**:

- How do users naturally scale? (More projects, users, data)
- Main resource constraint? (Storage, API calls, seats, features)
- Do different users get different value?

## Phase 3: Competitor Research

5. **Research 5-10 competitors** using web search:
   - Search: "[Competitor] pricing"
   - Document for each:
     - Pricing model (Freemium, tiered, usage-based)
     - Value metric (What they charge for)
     - Tier names and exact prices
     - Features per tier
     - Free tier limits

6. **Create comparison table**:

```
| Competitor | Model | Value Metric | Starter | Pro | Enterprise |
|------------|-------|--------------|---------|-----|------------|
```

## Phase 4: Value Metric Selection

7. **List potential metrics** for the product:
   - Per-seat/users
   - Usage-based (API calls, operations)
   - Storage/data (GB, records)
   - Projects/workspaces
   - Features/tiers
   - Outcomes (revenue %, savings)

8. **Score each metric** using Todd Gardner's 7 Criteria (1-10):
   1. Easy to Understand: Can explain in elevator ride?
   2. Fair Perception: Does customer feel it's equitable?
   3. Competitive Alignment: Familiar in category?
   4. Measurable: Can track automatically?
   5. Correlates with Value: Grows as customer succeeds?
   6. Scalable: No artificial ceilings?
   7. Predictable Revenue: Enables forecasting?

9. **Select metric** scoring 7+ on ALL criteria

## Phase 5: Price Calculation

10. **Apply Lincoln Murphy's 10x Rule**:
    - Price = 10-30% of value created

11. **Calculate for each persona**:
    - Quantify customer value (time saved, revenue, costs)
    - Calculate: Value × 10-20%

12. **Apply competitive context**:
    - Premium: 110-150% of market leader
    - Competitive: 90-110% of leader
    - Penetration: 60-90% of leader

13. **Apply psychological pricing**:
    - SMB/PLG: Charm pricing ($29, $99, $299)
    - Enterprise: Round numbers ($500, $1000)

## Phase 6: Tier Structure

14. **Design 3-4 tiers**:

**Free/Starter** ($0 or $19-49):

- Purpose: Lead generation, product validation
- Limits: Entry level (can demonstrate value)
- Features: Core only

**Professional** ($Y - TARGET 50-60% of customers):

- Purpose: Primary revenue driver
- Price: 2-3x Starter
- Limits: 2-5x Starter
- Features: Full core + key differentiators

**Business** ($Z):

- Purpose: High-value customers
- Price: 2-3x Pro
- Limits: 5-10x Starter or unlimited
- Features: Everything + advanced

**Enterprise** (Custom):

- Purpose: Strategic accounts
- Features: SSO, dedicated support, custom SLAs

## Phase 7: Generate PRICING.md

15. **Create PRICING.md** in same directory as PRD:

```markdown
# SaaS Pricing Strategy: [Product Name]

## Executive Summary

[2-3 paragraphs: approach, value metric, positioning, expected outcomes]

## Value Metric

**Selected**: [Primary metric]
**Justification** (7 Criteria scores):

1. Easy to Understand: [Score]
2. Fair Perception: [Score]
3. Competitive Alignment: [Score]
4. Measurable: [Score]
5. Correlates with Value: [Score]
6. Scalable: [Score]
7. Predictable Revenue: [Score]

## Pricing Tiers

### Free/Starter - $X/month

**Target**: [Segment]
**Limits**: [Primary metric limit]
**Features**: [List]
**Best for**: [Use case]

### Professional - $Y/month ⭐ RECOMMENDED

**Target**: [Segment]
**Limits**: [Limits]
**Features**: [List]
**Upgrade trigger**: [What makes users outgrow Starter]

### Business - $Z/month

**Target**: [Segment]
**Limits**: [Limits]
**Features**: [List]

### Enterprise - Custom

**Target**: Large organizations
**Features**: SSO, dedicated support, custom SLAs

## Competitive Positioning

**Strategy**: [Premium/Competitive/Value]
**Rationale**: [Based on research and PRD]

| Competitor | Model      | Metric       | Starter | Pro    | Enterprise |
| ---------- | ---------- | ------------ | ------- | ------ | ---------- |
| [Name]     | [Type]     | [Metric]     | $X      | $Y     | $Z         |
| **Ours**   | **[Type]** | **[Metric]** | **$X**  | **$Y** | **$Z**     |

## Pricing Justification

### Value Calculation (10x Rule)

**[Persona 1]**:

- Value created: $[Amount]/month
- Our price: $[Amount] ([X]% of value)
- Customer ROI: [X]x

## Implementation Roadmap

### Phase 1: Launch (Month 1-3)

- Launch tiers: [Which]
- Free trial: [Duration]

### Phase 2: Validation (Month 4-6)

- A/B tests: [What]
- Metrics: Conversion, ARPU, churn by tier

### Phase 3: Optimization (Month 7-12)

- Price adjustments
- Feature migration

## Success Metrics

- Pricing page → trial: [X]%
- Trial → paid: [X]%
- ARPU: $[X]
- [50-60]% in Pro tier
- Monthly churn: <[X]%
```

</process>

<constraints>
**MANDATORY STEPS**:
- ALWAYS read PRD and ARCHI first
- ALWAYS research 5-10 competitors with actual prices
- ALWAYS use Todd Gardner's 7 Criteria for metric selection
- ALWAYS use Lincoln Murphy's 10x Rule for calculation
- ALWAYS design 3-4 tiers (not more)

**VALUE-BASED PRICING**:

- Price on customer value, NOT your costs
- 1% pricing improvement = 11% profit increase
- Value metric selection > price point

**DO NOT**:

- Recommend pricing without competitor research
- Skip value metric scoring
- Copy competitors without understanding why
- Create more than 4 tiers
- Generate PRICING.md with gaps in research
  </constraints>

<output>
**File created**: `PRICING.md` in same directory as PRD

**Contains**:

- Executive summary
- Value metric with 7-criteria scoring
- 3-4 tier structure with limits and features
- Competitor comparison table
- Pricing justification using 10x Rule
- Implementation roadmap
- Success metrics to track
  </output>

<success_criteria>

- PRD and ARCHI read and understood
- 5-10 competitors researched with actual prices
- Value metric scored on all 7 criteria (all 7+)
- Price calculated using 10x Rule
- 3-4 tiers designed with clear upgrade triggers
- Competitive positioning defined
- PRICING.md created with complete research
  </success_criteria>
