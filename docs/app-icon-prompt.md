# AvoLens — App Icon Prompts (for Nano Banana / Gemini image)

The current logo (`public/images/avo-logo.png`) is a transparent, non-square avocado.
That works as an in-app logo but not as an **app icon**, which must be a **square,
full-bleed tile** with a background and even padding. These prompts turn the existing
avocado into a proper app icon that matches the AvoLens brand.

## Brand facts to keep the icon "on brand"

| Token            | Hex       | Use                                  |
| ---------------- | --------- | ------------------------------------ |
| Primary green    | `#6e9e3a` | Brand core                           |
| Gradient light   | `#a9c24a` | Top of green gradient                |
| Gradient dark    | `#5a8a2e` | Bottom of green gradient             |
| Ink (dark green) | `#26331a` | Deep shadows / dark background option |
| Off-white bg     | `#f5f7f3` | App background (light-tile option)   |

Style of the app: clean, soft, rounded, modern wellness/health look; friendly
hand-drawn avocado with a brown pit and light-green veined flesh.

---

## ★ All-black (monochrome) — the selected direction

Everything black — a black-on-black avocado defined only by subtle edge light.
Upload `public/images/avo-logo.png` to Nano Banana, then use:

> Turn this avocado illustration into a fully monochrome all-black app icon. Recolor the
> entire avocado to black — remove all green and brown. Make it a sleek black-on-black
> design: a matte black avocado half with a slightly glossy black pit, its shape and the
> pit readable only through subtle dark-gray edge highlights, a soft rim light along the
> top-left edge, and a faint inner shadow. Keep the leaf-vein pattern as a barely-visible
> darker texture on black. Background is pure black `#000000`, kept a hair darker than the
> avocado (avocado around `#0e0e0e`) so the silhouette separates from it. Center the
> avocado at about 70% fill with even padding. Perfectly square 1:1, full-bleed, no
> rounded corners, 1024×1024, crisp edges, no text, no wordmark, premium minimalist
> stealth look.

**Readability note:** true black-on-black is hard to see at 32px. If it disappears in the
browser tab, add: *"increase the rim light and edge contrast so the avocado is clearly
visible as a black silhouette against the background."* An all-black icon pairs naturally
with the app's dark theme (`--av-bg: #12160f`, `--av-nav-bg: #0c0f0a`).

---

## ✅ Prompt A — Alternative: reframe the EXISTING avocado (green on brand gradient)

Upload `public/images/avo-logo.png` to Nano Banana, then use:

> Turn this avocado illustration into a modern mobile app icon. Keep the exact same
> friendly hand-drawn avocado — the brown pit and the light-green flesh with the
> leaf-vein pattern. Center it and scale it to fill about 70% of the frame, leaving
> equal padding on all four sides (safe zone). Place it on a smooth top-to-bottom
> gradient background from soft lime green `#a9c24a` at the top to deep avocado green
> `#5a8a2e` at the bottom. Add a subtle soft drop shadow under the avocado so it lifts
> off the background. Perfectly square 1:1 composition, full-bleed (no rounded corners —
> the phone rounds them), 1024×1024, high detail, crisp edges, no text, no wordmark,
> flat modern app-icon look.

**Light-tile variant** (matches the app's off-white background) — swap the background line for:

> Place it on a solid soft off-white background `#f5f7f3` with a very subtle warm
> vignette, and give the avocado a soft green drop shadow.

---

## Prompt B — Generate from scratch (if you want a fresh, simpler avocado)

> A modern mobile app icon for a calorie-tracking app called AvoLens. A single friendly
> avocado half, cut face forward, showing a glossy brown pit and smooth light-green
> flesh with a subtle leaf-vein texture, dark-green skin rim. Centered, filling ~70% of
> the tile with even padding. Background is a smooth vertical gradient from lime green
> `#a9c24a` to deep avocado green `#5a8a2e`. Soft, rounded, flat-but-with-gentle-depth
> illustration style, subtle soft shadow. Perfectly square 1:1, 1024×1024, full-bleed,
> no text, no letters, clean and minimal, premium wellness-app aesthetic.

---

## Sizes to export after generating

Generate at **1024×1024**, then downscale for each target:

| File                                | Size(s)              | Purpose                    |
| ----------------------------------- | -------------------- | -------------------------- |
| `src/app/icon.png`                  | 512×512 (or 1024)    | Next.js auto favicon       |
| `src/app/apple-icon.png`            | 180×180              | iOS home-screen / Safari   |
| `public/icons/icon-192.png`         | 192×192              | PWA / Android              |
| `public/icons/icon-512.png`         | 512×512              | PWA / Android splash       |
| `src/app/favicon.ico`               | 16/32/48 multi-size  | Browser tab (optional)     |

Next.js App Router auto-detects `src/app/icon.png` and `src/app/apple-icon.png` — just
drop the files in, no code changes needed.

## Tips for a clean result
- Keep the avocado inside a **safe zone** (~10–12% margin) so nothing gets clipped when
  the OS rounds the corners.
- Deliver a **full-bleed square** — don't pre-round the corners; iOS/Android mask them.
- Avoid text in the icon; a wordmark disappears at 32px.
- If Nano Banana adds unwanted rounded corners or a border, add: *"full-bleed square,
  no rounded corners, no border, background extends to all edges."*
