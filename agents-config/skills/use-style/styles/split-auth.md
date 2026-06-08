# Split Auth Style

Two-column authentication style for sign-in, signup, OAuth, magic-code, password reset, and account recovery screens. It is not a marketing homepage. It is a focused auth surface with a strong brand panel and a clean form panel.

**Reference vibe:** premium SaaS auth page with a dark visual brand panel on the left and a quiet, high-clarity form on the right.

---

## Core vibe

- **Split auth layout.** Desktop is two panels: visual brand story on one side, form task on the other. Mobile hides the visual panel and keeps the form first.
- **One strong bitmap.** Use a real optimized image or generated bitmap as the visual panel background. Avoid SVG-only decoration.
- **Quiet form column.** The form panel is white or token-card colored, with no nested card shell unless the app design system requires it.
- **Brand line, not feature list.** The visual panel gets one concise positioning line and one support sentence.
- **Monochrome OAuth.** Social buttons are black with white text and white icons. Do not use colored Google marks here.
- **Compact verification.** OTP/code inputs are centered, stable size, and never stretch across the form width.

---

## Invocation aliases

Use this style when the user says:

- `/usestyle split-auth`
- `$use-style split-auth`
- `use split-auth`
- `/usestyle signin 2pages`
- `two-column auth`
- `auth split`
- `make the sign in page like the example`

Normalize those to `split-auth`.

---

## Layout

### Desktop shell

Use a full viewport grid. Left panel is visual, right panel is task.

```tsx
<main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
  <section className="relative hidden overflow-hidden bg-black lg:block">
    <div className="absolute inset-0 bg-cover bg-center" />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,0.18),rgba(7,9,15,0.78))]" />
    <div className="relative flex h-full min-h-screen flex-col justify-between p-12 text-white xl:p-16">
      {brand}
      {positioning}
      {footer}
    </div>
  </section>
  <section className="flex min-h-screen flex-col bg-card">
    <header className="flex items-center justify-between px-5 py-4 sm:px-8 lg:px-10 lg:py-8" />
    <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-4 sm:px-8 lg:px-10 lg:py-12">
      <div className="w-full max-w-[420px]">{form}</div>
    </div>
  </section>
</main>
```

### Mobile shell

- Hide the visual panel with `hidden lg:block`.
- Keep brand logo in the top form header.
- Use `px-5`, a max width of the full viewport, and enough top spacing to avoid feeling cramped.
- Do not show the bitmap as a mobile background unless it improves readability.

---

## Visual panel

### Background image

Use one optimized bitmap:

- Preferred formats: WebP or AVIF.
- Target size: 1200-2200px wide for desktop visual panels.
- Target weight: under 150 KB when possible.
- If source is HEIC, PNG, or large JPG, convert before serving.
- Use `background-size: cover` and `background-position: center`.

### Overlay

Add a dark overlay so white text stays readable:

```tsx
<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(7,9,15,0.18),rgba(7,9,15,0.78))]" />
```

### Brand lockup

Small brand mark at the top, not a giant logo.

```tsx
<a className="flex w-fit items-center gap-3">
  <span className="flex size-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-lg shadow-black/20 backdrop-blur-md">
    <Logo className="text-white" />
  </span>
  <span className="text-xl font-semibold">{Product}</span>
</a>
```

### Positioning copy

Use one direct brand line. Keep it literal and adapted to the product.

Pattern examples:

- `{Product} - the workspace your team finally enjoys.`
- `{Product} - the calmer way to manage your work.`
- `{Product} - everything important, without the noise.`

Support copy examples:

- `Access your workspace, pick up where you left off, and keep moving.`
- `Secure sign-in for teams that need speed without clutter.`
- `One account, one focused place for the work that matters.`

---

## Form panel

### Heading block

```tsx
<div className="space-y-3">
  <p className="text-sm font-medium text-primary">Welcome back</p>
  <div className="space-y-2">
    <h1 className="text-3xl font-semibold leading-tight text-foreground">
      Sign in to {Product}
    </h1>
    <p className="text-sm leading-6 text-muted-foreground">
      Use your email code or continue with a connected provider.
    </p>
  </div>
</div>
```

### Inputs

- Height: 44px.
- Radius: 8px or existing design-system `rounded-lg`.
- Background: panel background or app token `bg-background`.
- Label: small, medium, high contrast.
- Placeholder: practical, not playful.

```tsx
<Input
  placeholder="you@example.com"
  autoComplete="email"
  size="lg"
  className="h-11 rounded-lg bg-background"
/>
```

### Primary action

Use the app primary color. Keep it full width and stable height.

```tsx
<LoadingButton className="h-11 w-full rounded-lg">Send code</LoadingButton>
```

### Social buttons

All OAuth buttons use the same monochrome treatment:

```tsx
<button className="h-11 w-full rounded-lg border-black bg-black text-white hover:bg-black/90 hover:text-white">
  <GithubIcon className="text-white" />
  <span className="text-white">Sign in with GitHub</span>
</button>
```

Rules:

- Icon must be white.
- Text must be white.
- Do not use colored Google icon segments.
- Button fill stays black in light mode and dark mode.
- Use `currentColor` SVGs when possible.

### Divider

Use thin lines and a centered lowercase `or`.

```tsx
<div className="flex items-center gap-6 text-sm">
  <div className="h-px flex-1 bg-border" />
  <span>or</span>
  <div className="h-px flex-1 bg-border" />
</div>
```

### OTP/code state

Persist code-entry state in the URL when the user can leave and return from an email app.

```tsx
await navigate({
  to: '/auth/signin',
  search: { email, step: 'otp' },
  replace: true,
});
```

Compact code inputs:

```tsx
<InputOTP maxLength={6} containerClassName="justify-center">
  <InputOTPGroup>
    <InputOTPSlot index={0} className="size-10 bg-background" />
    <InputOTPSlot index={1} className="size-10 bg-background" />
    <InputOTPSlot index={2} className="size-10 bg-background" />
    <InputOTPSlot index={3} className="size-10 bg-background" />
    <InputOTPSlot index={4} className="size-10 bg-background" />
    <InputOTPSlot index={5} className="size-10 bg-background" />
  </InputOTPGroup>
</InputOTP>
```

Do not stretch OTP slots with `w-full justify-between`; that causes clipping on mobile.

---

## Auth page variants

### Sign in

- Eyebrow: `Welcome back`
- Title: `Sign in to {Product}`
- Description: `Use your email code or continue with a connected provider.`
- Primary action: `Send code`
- Secondary: OAuth buttons
- Footer link: `No account yet? Create one`

### Signup

- Eyebrow: `Create your account`
- Title: `Sign up to {Product}`
- Description: `We just need a few details to get you started.`
- Footer link: `You already have an account? Sign in`

### Password reset

- Icon in small muted square.
- Title: `Reset your password`
- Description: `Enter your email and we will send you a reset link.`
- Primary action: `Send reset link`

### Verify email

- Centered icon, title, and one sentence.
- No card wrapper.
- Keep it inside the shared form panel.

---

## Anti-patterns

- Do not add cards inside cards.
- Do not use a marketing navbar on auth pages.
- Do not use colored social icons in monochrome OAuth buttons.
- Do not use stock-photo people unless the product specifically needs human trust imagery.
- Do not put instructional text explaining how the UI works.
- Do not use visible keyboard shortcut copy on auth pages.
- Do not let OTP slots resize or shift on input.
- Do not make the form column wider than 460px.

---

## Review checklist

- The layout has two panels on desktop and one clean form panel on mobile.
- The image is optimized and loads from a browser-friendly format.
- Social buttons have white icons and white text.
- Form controls have stable heights and no layout shift.
- OTP state survives reload, tab switching, and return from email app when relevant.
- Text does not overlap the visual background or preceding content.
- Mobile screenshot has no clipped inputs, buttons, or OTP slots.
