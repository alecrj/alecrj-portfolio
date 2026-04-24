# alecrj.com

Portfolio of Alec RJ — designer & builder.

Single-page scroll experience. Three files, no build step.

## Structure

| File | What |
| --- | --- |
| `index.html` | Markup + inline SVG filters |
| `styles.css` | Aesthetic system + all animations |
| `script.js` | Scroll-scrub, canvas particles, brush cursor, menu + drawer state |
| `assets/` | Mona Lisa source + project thumbnails |

## The journey

1. **Hero** — "I DESIGN THINGS THAT WORK." sprays onto a concrete wall
2. **8-bit manifesto** — three laws of the craft on a pixel-art wall
3. **Studio** — pick up → shake → press: a spray can scene scrubbed by scroll
4. **Orange dive** — editorial about
5. **Pixels → paintings** — Mona Lisa forms from 2,000 particles
6. **Exhibition** — horizontal-scroll gallery of real, live projects
7. **Contact** — graffiti splatter reveal

## Local dev

```bash
python3 -m http.server 8765
open http://localhost:8765
```

No build. No framework. Just HTML, CSS, JS.

## Keyboard

- `M` — toggle menu
- `Esc` — close menu
- `← →` — navigate exhibition rooms
- `↑↑↓↓←→←→BA` — you'll see
