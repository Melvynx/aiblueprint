---
description: Generate and validate domain name options with availability checking for brand and utility domains
---

<objective>
Find the perfect domain name for a SaaS application through strategic generation and availability validation.

Generate 15-25 domain options mixing brand names (memorable, unique) and utility names (descriptive, SEO-friendly), check availability via WHOIS, and provide top recommendations. This comes AFTER PRD and ARCHI.
</objective>

<process>
## Phase 1: Read Foundation Documents

1. **Ask for PRD and ARCHI file paths**, then read completely

2. **Extract from PRD**:
   - Core problem (informs utility names)
   - Target users (informs tone)
   - Unique value (informs brand positioning)
   - Product category (informs naming conventions)

3. **Extract from ARCHI**:
   - Tech positioning (affects TLD choice)
   - Developer focus (makes .dev, .io acceptable)
   - Target market B2C/B2B/B2D (affects TLD priority)

4. **Note naming implications**:
   - B2C → Prefer .com
   - Developer tool → .dev, .io acceptable
   - Speed focus → Include Fast, Quick, Instant
   - Monitoring → Include Watch, Monitor, Track
   - AI-powered → Modern, tech-forward naming

## Phase 2: Strategy Discussion

5. **Ask user preferences**:

**Brand vs Utility**:
- Memorable brand or clear utility?
- Serious company or fun tool tone?
- Long-term brand or specific tool?

**Domain Preferences**:
- TLD priority: .com, .io, .dev, .app?
- Budget: Standard ($10-50) or premium ($500+)?
- Words to avoid or must include?

**Tone**:
- Professional (Stripe, Linear)?
- Fun (Notion, Slack)?
- Technical (Vercel, Supabase)?
- Abstract (Aura, Flux)?

## Phase 3: Generate Domain Options

6. **Generate 15-25 domains** (40% brand, 60% utility):

**Brand Domain Techniques**:
- Invented words: Syllable combinations (Figma, Vercel)
- Modified real words: Twisted existing words (Slack, Stripe)
- Abstract concepts: Evocative words (Notion, Linear)
- Short real words: Simple, memorable (Bolt, Frame)

**Utility Domain Patterns**:
- [Action][Noun]: MonitorFast, CheckPage
- [Adjective][Noun]: FastMonitor, QuickCheck
- [Noun][Action]: PageMonitor, SiteChecker
- [Noun][Noun]: PageWatch, WebPulse

**Word Banks by Category**:
- Monitoring: Sentinel, Beacon, Pulse, Radar, Watch
- Speed: Rapid, Swift, Bolt, Flash, Instant
- Simplicity: Plain, Clear, Simple, Stark
- AI/Intelligence: Sage, Cortex, Neural, Prism
- Building: Forge, Craft, Build, Studio, Lab

## Phase 4: Check Availability

7. **Use WHOIS for each domain**:
```bash
whois example.com | grep -E "No match|NOT FOUND|Status: free"
```

8. **Check TLDs in priority order**:
   - B2C SaaS: .com > .io > .app
   - Developer Tools: .dev > .io > .com
   - Modern Web Apps: .app > .io > .com

9. **Document availability**:
   - ✅ Available: Can register immediately
   - ❌ Taken: Already registered
   - ⚠️ Premium: Available at premium price

## Phase 5: Generate Names.md

10. **Create Names.md** in project directory:

```markdown
# Domain Names for [Project Name]

## Brand Domains

### Available

**DomainName.com** - Available
Short description of brand feeling.

**DomainName.dev** - Available
Short description of brand feeling.

### Unavailable (Reference)

**DomainName.io** - Taken
Description for context.

## Utility Domains

### Available

**DomainName.app** - Available
Short description of what it communicates.

### Unavailable (Reference)

**DomainName.com** - Taken
Description for reference.

## Top Recommendations

1. **[Domain.tld]** - [One sentence why best choice]
2. **[Domain.tld]** - [One sentence why second]
3. **[Domain.tld]** - [One sentence why third]
```
</process>

<constraints>
**DOMAIN QUALITY CRITERIA**:

Brand Domains:
- ✅ Easy to pronounce (phone test)
- ✅ Easy to spell (no weird spellings)
- ✅ Memorable and distinctive
- ✅ No negative connotations
- ✅ 2-3 syllables (5-10 chars)

Utility Domains:
- ✅ Immediately clear what it does
- ✅ Contains relevant keywords
- ✅ Professional and trustworthy
- ✅ Length: 12-18 chars max

**MANDATORY**:
- ALWAYS read PRD and ARCHI first
- ALWAYS check availability via WHOIS (don't guess)
- ALWAYS generate 15-25 options
- ALWAYS provide top 3 recommendations

**DO NOT**:
- Suggest domains without checking availability
- Skip the strategy discussion
- Generate only brand OR only utility (mix both)
- Create overly long output file
</constraints>

<output>
**File created**: `Names.md` in project directory

**Contains**:
- Brand domains (available + unavailable for reference)
- Utility domains (available + unavailable for reference)
- Top 3 recommendations with rationale
- Clean, scannable format

**Formatting**:
- Domain names in bold
- TLD included in name
- Availability status on same line
- One short sentence description (max 15 words)
- Grouped by type and availability
</output>

<success_criteria>
- PRD and ARCHI read and naming implications extracted
- Strategy discussion completed (tone, TLD, budget)
- 15-25 domain options generated (40% brand, 60% utility)
- All domains checked via WHOIS
- Names.md created with clean format
- Top 3 recommendations with clear rationale
- Available domains clearly separated from taken
</success_criteria>
