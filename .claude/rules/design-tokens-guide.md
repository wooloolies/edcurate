---
trigger: model_decision
description: when working with design tokens, colors, theming, or CSS variables.
---

# Design Tokens Workflow

## Source of Truth
`packages/design-tokens/src/tokens.ts` — OKLCH color space.

- Do NOT edit `apps/web/src/app/[locale]/tokens.css` directly (auto-generated)
- Do NOT edit `apps/mobile/lib/core/theme/generated_theme.dart` directly (auto-generated)
- ALWAYS modify `packages/design-tokens/src/tokens.ts`

## Workflow

1. Edit tokens in `packages/design-tokens/src/tokens.ts`
2. Build: `mise //packages/design-tokens:build`
3. Outputs: Web CSS (OKLCH variables) + Flutter theme (P3 colors)

## Token Categories
- **Colors**: `tokens.color.light` / `tokens.color.dark` (OKLCH via `oklch(l, c, h, a?)`)
- **Radius**: `tokens.radius` (px)
- **Spacing**: `tokens.spacing` (px)
- **Typography**: `tokens.typography` (fontFamily, fontSize, fontWeight, lineHeight, letterSpacing)
- **Semantic**: `tokens.semantic` (info, success, warning)

## OKLCH Quick Reference
- L (Lightness): 0=black, 1=white
- C (Chroma): 0=gray, 0.4+=vivid
- H (Hue): 0=Red, 130=Lime Green (primary), 240=Blue, 360=Red
