# CRISP — Crafted for the crunch.

An original potato-chip brand concept and interactive factory experience by **Hamza Aftab**. Built with vanilla JavaScript, Three.js and Vite. All machinery, food geometry, textures, choreography and audio are created in code.

![CRISP factory and brand direction](public/social-preview.png)

## The experience

- A stainless-steel miniature factory with connected conveyors, wash jets, a rotating peeler, guarded slicing, rippling oil, steam, seasoning drums, weighing hoppers and synchronised packaging lines.
- A scroll-directed camera journey through five processes. Process buttons also jump to any step.
- Three selectable flavours: Golden Sea Salt, Smoky Paprika and Garden Herbs. The same renderer switches from the factory to sculpted product packaging.
- Procedural water, cutting, frying, tumbling and packing sounds. Optional original music. Audio starts only after a visitor enables it and stays on the animation's clock.
- Desktop and mobile layouts, an accessible mobile menu, keyboard camera inspection, reduced-motion support and still-image fallbacks.
- Local fonts and assets. Rendering and machine audio stop while the experience is offscreen or the tab is hidden.

This is a portfolio concept. The collection presents fictional packaging and flavours; the site does not process orders. The creator button opens Hamza's GitHub profile.

## Deploy to Vercel

1. Open [Vercel's new project page](https://vercel.com/new) and import **hamzaaftab325-eng/potato-factory-**.
2. Use the repository root and the `main` branch.
3. Confirm these settings, then deploy:

| Setting               | Value           |
| --------------------- | --------------- |
| Framework preset      | Vite            |
| Root directory        | Repository root |
| Node.js               | 24.x            |
| Install command       | `npm ci`        |
| Build command         | `npm run build` |
| Output directory      | `dist`          |
| Environment variables | None required   |

`vercel.json` already sets the framework, build command, output directory, immutable caching for generated assets, and response headers. The page uses anchor navigation, so no SPA rewrite is necessary. Vercel's Git integration can build future commits automatically.

After your domain is assigned, set `og:image` in `index.html` to the absolute public URL of `/social-preview.png` and add a canonical link for that domain. The relative preview image is included now, without inventing a domain.

Official references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Run locally

Install Node.js 24, then:

```sh
npm ci
npm run dev
```

Open `http://localhost:4173`. A web server is required for ES modules; opening `index.html` as a local file will not load the application.

```sh
npm test          # Functional, geometry, camera-path and audio checks
npm run build    # Production assets in dist/
npm run preview  # Serve the production build locally
```

## Source guide

| File                      | Purpose                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `index.html`              | Page content, SEO metadata and semantic controls                  |
| `src/styles.css`          | Typography, layout, materials palette and responsive design       |
| `src/lib/page.js`         | Navigation, sound controls, flavour selection and scene placement |
| `src/lib/journey.js`      | Scroll progression, camera presets and flavour metadata           |
| `src/factory/scene.js`    | Lighting, machinery, animation, postprocessing and product view   |
| `src/factory/details.js`  | Mechanical detailing and secondary movement                       |
| `src/factory/geometry.js` | Curved chips and inflated, crimped film geometry                  |
| `src/factory/audio.js`    | The six procedural sound layers                                   |
| `public/`                 | Factory still, vector packaging, social image and favicon         |
| `tests/`                  | Automated checks                                                  |
| `archive/`                | The previous repository prototype, preserved for reference        |

Change the brand copy and profile links in `index.html`. Flavour names/colours and camera framing are in `src/lib/journey.js`; procedural label artwork is in `bagMaterial()` in `src/factory/scene.js`. Update the HTML flavour descriptions and fallback SVG packs alongside any flavour changes.

The still factory poster is a crop of the existing code-rendered scene. It provides immediate content and a fallback; the interactive experience renders real geometry, with no video backdrop or remote model downloads.

## Verification

Automated checks cover menu/focus behaviour, selection, controls, reduced-motion state, renderer placement, offscreen handling, missing-3D fallback, internal links/assets, camera continuity, finite geometry and 16-second audio timing. The production build is checked separately.

These checks do not replace browser/GPU visual review. Browser preview infrastructure was unavailable during this build. After deploying, check desktop and phone framing, scroll transitions, sound playback and the reduced-motion setting on actual browsers before using this as a public portfolio launch.

## Dependency credits

Three.js is MIT licensed. Instrument Serif and DM Sans are distributed under the SIL Open Font License. Their license texts are included in `docs/licenses/`. No stock audio, external HDR maps, paid models or external image services are required.
