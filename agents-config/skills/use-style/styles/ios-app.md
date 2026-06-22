# iOS App Style

NowStack Mobile "Ink & Spark" style for iOS/Expo app screens, React Native + NativeWind UI, phone-frame mockups, and companion app shells. The product should feel like a senior engineer's shipped mobile boilerplate: exact, calm, monochrome, and quietly expensive.

**Reference vibe:** NowStack Mobile. White paper, near-black ink, one yellow spark, native iOS chrome, flat hairline cards, generous touch targets, and a single product language across mobile, landing, `/app`, and `/admin`.

---

## Core Vibe

- **Ink and paper first.** Most of the interface is `#0A0A0A`, `#FFFFFF`, neutral grays, and hairlines.
- **One yellow spark.** `#FFE040` is reserved for the highest-intent action or a rare brand moment. Two yellow elements on one screen is usually wrong.
- **Native app, not mobile web.** Build iOS screens with status bar, safe areas, stack headers, sheets, keyboard behavior, and OS-native tab bars.
- **Flat by default.** Resting surfaces use 1px borders or rings. Shadows are only for lifted, interactive, or modal surfaces.
- **Premium restraint.** No decorative filler, no template feature grids, no AI-SaaS purple/blue gradients.
- **Light and dark parity.** The same tokens invert cleanly. The yellow spark stays fixed in both modes.

---

## Invocation Aliases

Normalize these to `ios-app`:

- `$use-style ios-app`
- `/useskill ios-app`
- `use the ios app style`
- `nowstack-mobile`
- `nowstack mobile`
- `Ink & Spark`
- `iPhone app style`
- `Expo app style`
- `React Native NativeWind app style`

---

## Color

Use semantic tokens whenever the project has them. In NowStack Mobile, `mobile-app/lib/theme.ts` is the source of truth. Do not inline hex values in app screens unless the color is fixed-contrast by design.

### Light Theme

| Role | Hex | Token | Usage |
|------|-----|-------|-------|
| Background | `#FFFFFF` | `background` | Screen background |
| Foreground | `#0A0A0A` | `foreground` | Primary text, icons |
| Card | `#FFFFFF` | `card` | Card surfaces |
| Muted surface | `#F5F5F5` | `muted`, `secondary`, `accent` | Secondary buttons, filled fields, toolbars |
| Border | `#E5E5E5` | `border`, `input` | Hairlines, inputs, dividers |
| Muted ink | `#737373` | `muted-foreground` | Captions, helper copy, inactive nav |
| Primary | `#0A0A0A` | `primary` | Main pill button |
| Primary foreground | `#FAFAFA` | `primary-foreground` | Text on ink |
| Brand spark | `#FFE040` | `brand` | Highest-intent CTA only |
| Spark ink | `#1A1A1A` | `brand-foreground` | Text on yellow |
| Success | `#10B981` | `success` | Positive state only |
| Warning | `#F59E0B` | `warning` | Warning state only |
| Destructive | `#EF4444` | `destructive` | Error/destructive state only |

### Dark Theme

| Role | Hex | Token | Usage |
|------|-----|-------|-------|
| Background | `#0A0A0A` | `background` | Screen background |
| Foreground | `#FAFAFA` | `foreground` | Primary text, icons |
| Card | `#171717` | `card` | Card surfaces |
| Muted surface | `#262626` | `muted`, `secondary`, `accent` | Secondary surfaces |
| Border | `#262626` | `border`, `input` | Hairlines, inputs, dividers |
| Muted ink | `#A3A3A3` | `muted-foreground` | Captions, helper copy |
| Primary | `#FAFAFA` | `primary` | Main pill button in dark mode |
| Primary foreground | `#0A0A0A` | `primary-foreground` | Text on light primary |
| Brand spark | `#FFE040` | `brand` | Highest-intent CTA only |
| Spark ink | `#1A1A1A` | `brand-foreground` | Text on yellow |

### Named Color Rules

- **Single Spark Rule:** yellow appears on <=10% of the screen and ideally only one element.
- **No Indigo Rule:** do not use blue, sky, indigo, or violet as an accent. Re-point generic shadcn primary tokens to ink.
- **Spark Contrast Rule:** text on yellow is `#1A1A1A`, never white.
- **Semantic Color Rule:** success, warning, and destructive colors are for actual state, not decoration.

---

## Typography

| Surface | Font |
|---------|------|
| iOS / React Native | `DM Sans`, then system sans |
| Web companion | `Geist Variable`, then system sans |
| Code / IDs / technical values | `Geist Mono`, `ui-monospace` |
| Rare landing display | `Instrument Serif`, `Georgia`, serif |

### Scale

| Level | Pattern |
|-------|---------|
| Screen title | 28px, 700 on mobile; tight but readable line height |
| Section heading | 20-24px, 600 or 500 |
| Card title | 16px, 500-600 |
| Body | 15-16px, 400, line height 1.45-1.55 |
| Label | 13px, 600; uppercase tracked labels only when needed |
| Meta / captions | 12-13px, muted ink |

Rules:

- Use weight and spacing before adding color.
- Headings should feel medium-weight and precise, not loud.
- Do not stack tiny uppercase eyebrows above every section.
- Keep body text high contrast. `#737373` is secondary text, not primary copy.

---

## Layout

### Device Shell

For phone mockups or mobile app screens, build the native shell first:

- Status bar area.
- Safe-area aware root view.
- Stack header or centered nav title.
- Scroll region with stable bottom padding.
- Native bottom tab bar when the app has tabs.
- Home indicator clearance.

Use a 390px wide mental model for iPhone layouts. Typical screen padding is 16-20px. Primary actions should sit in the thumb zone and never under the tab bar or home indicator.

### Screen Rhythm

| Element | Pattern |
|---------|---------|
| Root | `bg-background text-foreground` |
| Content padding | 16-20px mobile, 24-32px tablet |
| Section gap | 24-32px |
| Card gap | 12-16px |
| Card padding | 16-20px |
| Touch target | >=44pt, primary actions 52pt |
| Card radius | 16px mobile, 14px web, cap at 18px |
| Button radius | Full pill for primary/brand, 10px for non-pill buttons |

### Keyboard Screens

Any screen with text inputs must keep the input and submit button visible above the keyboard:

- Put `KeyboardAvoidingView` on the outer screen or bottom-panel container.
- Use `behavior={Platform.OS === "ios" ? "padding" : "height"}`.
- For long forms, use `ScrollView keyboardShouldPersistTaps="handled"`.
- Do not bury keyboard avoidance inside a nested form component.

---

## Components

### Buttons

Primary actions are generous full pills.

| Variant | Treatment |
|---------|-----------|
| Primary | Ink fill, inverse text, full pill, 52pt high on mobile |
| Brand | Yellow spark fill, spark-ink text, full pill, one per screen maximum |
| Secondary | Muted surface fill, ink text, modest 10px radius |
| Outline | Paper/card fill, 1px border, ink text |
| Ghost | Transparent, ink text, surface wash on press/hover |
| Destructive | Faint destructive wash with destructive text, not solid red |

React Native / NativeWind example:

```tsx
<Pressable className="h-[52px] items-center justify-center rounded-full bg-primary px-6 active:opacity-80">
  <Text className="text-[17px] font-semibold text-primary-foreground">Continue</Text>
</Pressable>
```

Brand action:

```tsx
<Pressable className="h-[52px] items-center justify-center rounded-full bg-brand px-6 active:opacity-80">
  <Text className="text-[17px] font-semibold text-brand-foreground">Start building</Text>
</Pressable>
```

### Cards

- Background: `card`.
- Border: 1px `border`.
- Radius: 16px on mobile.
- Padding: 16-20px.
- Shadow: none by default.
- Elevated card: `shadow-sm` only, with no wide blur.
- Do not put cards inside cards.

```tsx
<View className="rounded-2xl border border-border bg-card px-5 py-4">
  <Text className="text-base font-semibold text-card-foreground">Project ready</Text>
  <Text className="mt-1 text-sm leading-5 text-muted-foreground">
    Your first build can be submitted from this app shell.
  </Text>
</View>
```

### Inputs

- Height: 44pt minimum, 52pt for prominent auth/onboarding fields.
- Radius: 12-14px.
- Border: 1px `input` or `border`.
- Background: `card` or `muted`.
- Placeholder: muted ink.
- Focus: border/ring shifts to ink. No glow.

```tsx
<TextInput
  className="h-12 rounded-xl border border-input bg-card px-4 text-[16px] text-foreground"
  placeholderTextColor={colors["muted-foreground"]}
/>
```

### Badges And Chips

Use muted surface fill, ink text, full pill radius, and small padding. Semantic chips can use faint state washes.

```tsx
<View className="rounded-full bg-muted px-2.5 py-1">
  <Text className="text-xs font-semibold text-foreground">Beta ready</Text>
</View>
```

### Navigation

- Use `NativeTabs` from `expo-router/unstable-native-tabs` for tabbed mobile apps.
- Let the OS own the tab bar surface. Do not set a custom tab background.
- Tint only the active item with the theme color.
- Use SF Symbols on iOS where available.
- Stack headers should be quiet: centered title, back affordance, optional right action.

### Sheets And Modals

- Use card or muted surfaces.
- Radius: 18px maximum.
- Add a top drag handle only when the sheet is gesture-dismissable.
- Use `shadow-sm` or native modal elevation, not large web shadows.
- Keep the primary action pinned above the safe area when the sheet is action-heavy.

### Paywalls And Onboarding

- The yellow brand button belongs here when it is the single highest-intent action.
- Benefits should be scannable rows, not a repeated icon-card grid.
- Keep the product value direct and concrete.
- Avoid fake metrics, giant stat heroes, or generic AI feature claims.

---

## Web Companion Surfaces

When applying `ios-app` to web landing, `/app`, or `/admin` surfaces, keep the same language:

- Same ink primary button.
- Same yellow spark CTA, still one per viewport.
- Same hairline cards.
- Same modest radii.
- Same mono treatment for code and technical values.
- Web primary cards use `ring-1 ring-foreground/10` more often than heavy borders.
- Landing pages may use the "hero orbit": slow, gray, concentric rings behind a phone mockup. No colored gradient orbs.

---

## Implementation Rules

### In NowStack Mobile Repos

- Use existing `components/ui/` primitives before adding screen-local styling.
- Use NativeWind classes and semantic tokens (`bg-background`, `text-foreground`, `bg-brand`, `border-border`).
- Read native-only colors from `const { colors } = useTheme()` in `lib/theme-store.tsx`.
- Keep `mobile-app/lib/theme.ts` as the single source of truth for themed colors.
- Do not hardcode themed hex values in screens or shared components.
- Keep `ThemeProvider` inside `SafeAreaProvider` and wrapping the router.

### Portable Projects

If the project lacks these tokens, create the equivalent theme names first:

```css
:root {
  --background:#FFFFFF;
  --foreground:#0A0A0A;
  --card:#FFFFFF;
  --muted:#F5F5F5;
  --muted-foreground:#737373;
  --border:#E5E5E5;
  --primary:#0A0A0A;
  --primary-foreground:#FAFAFA;
  --brand:#FFE040;
  --brand-foreground:#1A1A1A;
}
```

Dark mode:

```css
.dark {
  --background:#0A0A0A;
  --foreground:#FAFAFA;
  --card:#171717;
  --muted:#262626;
  --muted-foreground:#A3A3A3;
  --border:#262626;
  --primary:#FAFAFA;
  --primary-foreground:#0A0A0A;
  --brand:#FFE040;
  --brand-foreground:#1A1A1A;
}
```

---

## Motion

- Use 150-200ms ease-out for press, hover, and small reveals.
- Pressed buttons can dim to 80% opacity or nudge down by 1px.
- Respect reduced motion.
- Ambient motion is rare. The only sanctioned landing decoration is slow monochrome orbit rings around a phone mockup.

---

## Anti-Patterns

| Avoid | Why |
|-------|-----|
| Blue, indigo, violet, or sky accent colors | Breaks the monochrome + spark identity |
| More than one yellow CTA per screen | Weakens the single highest-intent signal |
| White text on yellow | Fails contrast |
| Gradient orbs, blurred blobs, decorative glows | Generic AI-SaaS look |
| Glassmorphism as default panels | Too decorative and template-like |
| Static cards with big soft shadows | Violates the hairline-first system |
| Nested cards | Creates noisy, confused hierarchy |
| 24px+ card radii | Over-rounded and off-brand |
| Tiny uppercase eyebrow on every section | Looks like a generated SaaS scaffold |
| Ionicons replacing SF Symbols in native tabs | Breaks platform feel |
| Content under tab bar, keyboard, or home indicator | Breaks mobile ergonomics |

---

## Completion Checklist

- The screen reads monochrome first, yellow second.
- There is no generic purple/blue SaaS accent.
- Primary CTA is an ink pill unless the screen deserves the one yellow spark.
- Touch targets are >=44pt and main actions are about 52pt.
- Cards are separated by hairlines, not broad shadows.
- Safe areas, tab bars, and keyboard behavior are handled.
- Tokens come from the project theme, not scattered hex literals.
- Dark mode keeps the same hierarchy and the same yellow spark.
