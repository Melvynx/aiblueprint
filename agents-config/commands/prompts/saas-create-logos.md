---
description: Generate 20 abstract SVG logo variations with brainstorming and HTML showcase
arguments:
  - name: app-name
    description: Name of your app/product
    required: true
  - name: app-description
    description: What does your app do? Who is it for?
    required: true
---

<objective>
Generate 20 unique, minimalist SVG logo variations inspired by iconic logos (Stripe, Google, Claude, ChatGPT, Dub, Excalidraw).

Output:

1. `specs/logos/brainstorm.md` - Logo concepts and rationale
2. `specs/logos/showcase-v1.html` - First batch of 20 logos (increment version for iterations)
   </objective>

<context>
**App Name**: #$ARGUMENTS.app-name
**Description**: #$ARGUMENTS.app-description
</context>

<process>
## Phase 0: Ask Clarifying Questions

**BEFORE doing anything**, ask the user these questions using AskUserQuestion:

1. **Logo Style**:
   - Lettermark (stylized letter like Stripe's "S")
   - Abstract symbol (like Claude's icon)
   - Geometric shape (like Airbnb)
   - Wordmark (full name stylized)

2. **Brand Personality**:
   - Modern & Techy
   - Playful & Friendly
   - Professional & Corporate
   - Bold & Edgy
   - Minimal & Clean

3. **Visual Inspiration** (can select multiple):
   - Stripe (depth, gradients)
   - Google (simple geometry)
   - Linear (sharp, modern)
   - Notion (clean, minimal)
   - Discord (friendly, rounded)

Wait for user answers before proceeding.

## Phase 1: Analyze & Brainstorm

1. **Study the app name** with user preferences in mind:
   - Break down letters, sounds, meaning
   - Find visual metaphors (e.g., "Mail" → envelope, arrow, @ symbol)
   - Match to selected brand personality

2. **Apply user's style choices**:
   - Use selected logo style as primary direction
   - Incorporate visual inspiration references
   - Align with brand personality

3. **Create brainstorm.md**:

```markdown
# Logo Brainstorm: [App Name]

## Brand Analysis

- **Name meaning**: [What does the name evoke?]
- **Core function**: [What does the app do?]
- **Target vibe**: [Modern/Playful/Professional/Bold/Minimal]

## Visual Concepts

### Lettermark Ideas

1. [First letter stylized - describe approach]
2. [Initials combined - describe approach]
3. [Full name simplified - describe approach]

### Symbol Ideas

1. [Abstract shape representing core function]
2. [Geometric interpretation of name]
3. [Metaphor visualization]

### Style Direction

- **Colors**: Black/white primary (can add accent later)
- **Style**: Geometric, clean, SVG-optimized
- **Inspiration**: [Which logos to draw from]

## 20 Variations Plan

1-5: Lettermark variations
6-10: Abstract symbols
11-15: Geometric shapes
16-20: Experimental/unique
```

## Phase 2: Generate HTML Showcase

4. **Check for existing versions**:
   - Look for `specs/logos/showcase-v*.html`
   - Increment version number (v1, v2, v3...)
   - If v1 exists, create v2, etc.

5. **Create showcase-vX.html** with this structure:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>[App Name] - Logos</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        background: #fff;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
      }
      .cell {
        aspect-ratio: 1;
        border: 1px solid #e5e5e5;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .cell svg {
        width: 100%;
        height: 100%;
        max-width: 80px;
        max-height: 80px;
      }
    </style>
  </head>
  <body>
    <div class="grid">
      <div class="cell">
        <svg
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- SVG content here - use #000 for fills -->
        </svg>
      </div>
      <!-- ... 19 more cells -->
    </div>
  </body>
</html>
```

## Phase 3: Design 20 Logos

6. **Generate each SVG** following these rules:
   - ViewBox: `0 0 500 500`
   - Colors: Black (`#000`) on white background
   - No gradients in base version
   - Clean paths, minimal complexity
   - Must work at 16px and 512px

7. **Logo categories** (adapt based on user's style choice):
   - **1-5**: Primary style (user's selected logo style)
   - **6-10**: Secondary variations
   - **11-15**: Alternative interpretations
   - **16-20**: Experimental (unique, creative approaches)

8. **Document in brainstorm.md** (not in HTML):
   - Each logo's concept and rationale
   - Why it fits the brand

## Phase 4: Iteration Support

9. **After generating**, ask user:

   > "Which logos do you like? I can create v2 with variations of your favorites."

10. **For next iteration**: - Note favorites from previous version - Create `showcase-v2.html` with 20 new variations inspired by favorites - Each version builds on user feedback
    </process>

<constraints>
**SVG RULES**:
- Pure SVG, no raster images
- Black (`#000`) fills only
- Simple paths, no complex effects
- Must scale from favicon to billboard

**DESIGN RULES**:

- Inspired by: Stripe, Google, Claude, ChatGPT, Dub
- Minimalist, geometric, modern
- Recognizable at small sizes
- No text (unless lettermark)

**HTML RULES**:

- Light mode only (white background)
- 5x4 grid of logos
- NO titles, NO descriptions, NO text
- Just logos in cells separated by borders
- Clean, minimal presentation

**OUTPUT RULES**:

- Create `specs/logos/` directory first
- Save `brainstorm.md` with concepts and rationale
- Save `showcase-vX.html` with just the logo grid
- ONE HTML file per version
  </constraints>

<output>
**Files created**:
1. `specs/logos/brainstorm.md` - Logo concepts and rationale (all text here)
2. `specs/logos/showcase-v1.html` - Clean 5x4 grid of logos (no text)

**HTML structure**:

- 5x4 grid (20 logos)
- Each cell: just the SVG, no text
- Light gray borders between cells
- White background

**Iteration flow**:

- v1: Initial 20 based on user preferences
- v2+: Refinements based on user favorites
  </output>
