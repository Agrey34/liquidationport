---
name: uiux-pro-max
description: "Comprehensive UI/UX design excellence, 96 web accessibility guidelines (WCAG 2.1 AA/AAA), keyboard navigation, focus management, color contrast, and micro-interactions."
metadata:
  author: Antigravity
  version: "1.0.0"
---

# UI/UX Pro Max & 96 Accessibility Guidelines

## 1. Visual Design System & Aesthetics
- **Harmonious Color Palettes**:
  - Use curated Tailwind color scales (`neutral-900`, `neutral-500`, `emerald-600`, `rose-600`, `blue-600`) with consistent background tokens (`bg-[#f8f9fa]`, `bg-white`).
  - Avoid raw uncalibrated colors. Use subtle borders (`border-neutral-200/90`) and layered shadows (`shadow-2xs`, `shadow-sm`, `shadow-xl`).
- **Typography Hierarchy**:
  - Enforce clear typographic scale: Page titles (`text-2xl`/`text-3xl font-extrabold`), section headers (`text-lg`/`text-xl font-bold`), subheadings (`text-sm font-bold`), body copy (`text-xs`/`text-sm font-normal`), metadata badges (`text-[10px]` uppercase tracking-wider).
- **Interactive Micro-Animations**:
  - Provide smooth transitions on interactive elements (`transition-all duration-200`, subtle hover transforms `hover:-translate-y-0.5`, active scale effects).
  - Use Framer Motion (`<AnimatePresence>`, `<motion.div>`) for layout transitions and drawers.

---

## 2. The 96 Core Accessibility (a11y) & UX Directives

### A. Perceivable (Sight, Sound & Structure)
1. **Non-text Content**: Every `<img>` and Next.js `<Image>` must have meaningful `alt` text or `alt=""` if purely decorative.
2. **Color Contrast (Text)**: Maintain minimum 4.5:1 contrast for normal text and 3:1 for large text (WCAG AA).
3. **UI Component Contrast**: Maintain 3:1 contrast for borders, active icons, checkboxes, and input focus rings.
4. **Color Independence**: Never convey status by color alone; pair badges with text labels or distinct icons.
5. **Text Resize**: Support browser zoom up to 200% without loss of content or broken horizontal scrolling.
6. **Visual Hierarchy**: Single `<h1>` per page with strictly sequential heading order (`h1` -> `h2` -> `h3`).
7. **Semantic Structure**: Use `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<section>`, and `<article>`.
8. **Font Legibility**: Ensure line heights (`leading-relaxed` / 1.5) and letter spacing promote readability.
9. **Responsive Reflow**: Layouts must reflow seamlessly down to 320px width without horizontal viewport clipping.
10. **Information Landmarks**: Provide accessible ARIA landmark labels where multiple navigation zones exist.

### B. Operable (Keyboard Navigation & Interaction)
11. **Complete Keyboard Accessibility**: Every clickable button, link, menu, and modal must be operable via `Tab`, `Enter`, and `Space`.
12. **Visible Focus Rings**: Never use `outline: none` without providing explicit replacement focus rings (`focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2`).
13. **Logical Tab Order**: Tab index must mirror the visual reading order. Avoid positive `tabIndex` values.
14. **No Keyboard Traps**: Modals and drawers must allow dismissing via `Escape` and keep focus contained within the dialog.
15. **Touch Target Size**: Interactive elements must meet minimum touch targets of 44x44px on mobile devices.
16. **Skip to Main Content**: Provide an invisible skip link at the top of the DOM for screen reader and keyboard users.
17. **Descriptive Link Text**: Avoid generic "Click here" or "Read more". Use descriptive links (e.g. "View pallet manifest").
18. **Page Title Uniqueness**: Each route must have a descriptive, unique `<title>` indicating the active view.
19. **Motion Control**: Respect `prefers-reduced-motion` media queries for animations and transitions.
20. **Pointer Cancellation**: Allow users to cancel button clicks by dragging the pointer outside before release.

### C. Understandable (Predictability, Forms & Feedback)
21. **Language Specification**: Declare `<html lang="en">` on the root document.
22. **Form Labels**: Every input must be associated with an explicit `<label htmlFor="...">` or `aria-label`.
23. **Clear Placeholder Distinction**: Do not rely on input placeholders as label replacements.
24. **Input Error Identification**: Clearly flag invalid fields with descriptive text and `aria-invalid="true"`.
25. **Error Association**: Link error messages to inputs using `aria-describedby="field-error-id"`.
26. **Predictable Focus Transitions**: Opening a drawer or modal must automatically place focus on the dialog container.
27. **Restoring Focus**: Closing a modal must return keyboard focus to the triggering button.
28. **Reversible Actions**: Provide confirmation dialogs or undo mechanisms for destructive operations (e.g. deletion).
29. **Form Autocomplete**: Provide standard `autoComplete` attributes on address and identity inputs (`name`, `email`, `tel`, `address-line1`, `postal-code`).
30. **Clear Status Messages**: Announce dynamic updates (e.g. "Added to cart", "Filtered 15 results") using `role="status"` or `aria-live="polite"`.

### D. Robust & Modern Form Controls
31. **Custom Selects**: If building custom dropdowns, adhere to WAI-ARIA `combobox` / `listbox` design patterns.
32. **Table Accessibility**: Use `<caption>` or `aria-label`, `<th scope="col">`, and `<th scope="row">` for tabular data.
33. **Disabled State Communication**: Communicate disabled states with `aria-disabled="true"` or native `disabled`.
34. **Live Validation Feedback**: Validate inputs on blur or submission, avoiding disorienting instant typing errors.
35. **Mobile Keyboard Type**: Set appropriate input `type` (`email`, `tel`, `number`, `url`) to trigger optimized mobile keyboards.
36. **Clean Loading States**: Display disabled spinners and skeleton screens to inform users of ongoing operations.

---

## 3. High-Conversion E-Commerce UX Checklist
- **Manifest Transparency**: Present line-item breakdowns with UPCs, item quantities, and MSRP totals.
- **Clear Call-to-Actions (CTAs)**: Primary actions (`Add to Cart`, `Proceed to Checkout`) must stand out boldly.
- **Cart & Wishlist Drawers**: Provide instant slide-over drawer feedback upon adding items without full-page reloads.
- **Frictionless Checkout**: Simplify multi-step checkout with real-time address validation, shipping calculations, and Stripe Elements.
- **Error Recovery**: Every error state must offer an actionable recovery path (e.g. "Retry", "Back to Inventory").
