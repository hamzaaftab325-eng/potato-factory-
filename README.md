# CRISP — Crafted for the crunch.

An original potato-chip brand world by **Hamza Aftab**, built with **React 19, Tailwind CSS 4, Three.js and Vite**. Machines, food, packaging, textures, animation, delivery truck and stereo audio are created in code.

## The experience

- A complete miniature process: washing and peeling, enclosed precision cutting, continuous frying, three flavour drums, weighing, film forming, sealing, inspection and carton packing.
- Sculpted printed-film bags with separate front and back artwork, pillowy volume, crimped heat seals, small folds and a rear fin seam. Four individual bags enter each labelled carton before its flaps fold and its top seam is taped.
- A final delivery chapter: a detailed CRISP box truck with cab glazing, mirrors, headlights, three axles, wheels, hinged cargo doors and a loading dock. A transfer pallet enters the truck before the doors close and the truck departs. The route graphic illustrates Karachi, Quetta, Lahore, Islamabad and Peshawar.
- One stable factory canvas. Process buttons choose a focused camera view; packaging switches into its own product studio, and delivery switches to the loading dock. The page never moves the renderer between scrolling containers.
- Three selectable concept flavours: Golden Sea Salt, Smoky Paprika and Garden Herbs.
- Seven original stereo procedural sound layers: water, cutting, frying, tumbling, packing, optional music and delivery. Machinery and audio share the same clock; the product studio silences machine foley. Sound requires an explicit visitor action.
- Readable process descriptions outside the canvas, responsive Tailwind layouts, a native mobile navigation dialog, keyboard controls, reduced-motion support and illustrated fallbacks when WebGL is unavailable.
- Complete HTML generated during the production build, followed by React hydration. Local fonts and packaging assets avoid external asset dependencies. Rendering and audio stop when the experience is offscreen or the browser tab is hidden.

This is a portfolio concept with fictional products and an illustrative delivery network. It does not process orders. The creator link opens Hamza's GitHub profile.

## Vercel

The existing project is configured for the `main` branch of `hamzaaftab325-eng/potato-factory-`.

| Setting               | Value           |
| --------------------- | --------------- |
| Framework             | Vite            |
| Root directory        | Repository root |
| Node.js               | 24.x            |
| Install command       | `npm ci`        |
| Build command         | `npm run build` |
| Output directory      | `dist`          |
| Environment variables | None required   |

`vercel.json` configures immutable asset caching and response headers. The page uses anchor navigation and requires no SPA routing rewrite. The canonical URL and social image are configured for `https://potato-factory.vercel.app/`.

## Local development

```sh
npm ci
npm run dev
```

Open `http://localhost:4173` through a web server. ES modules do not work by opening `index.html` directly.

```sh
npm run build    # Vite assets and prerendered page in dist/
npm run preview  # Serve production output locally
npm test         # Repository interaction, geometry, camera and audio suites
```

## Source guide

| File                                | Purpose                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `src/App.jsx`                       | React page, factory controls, collection and delivery story        |
| `src/hooks/useFactory.js`           | Scene lifecycle, motion preferences, visibility and audio actions  |
| `src/components/FactoryDiagram.jsx` | Code-built process and delivery illustrations for loading/fallback |
| `src/components/DeliveryMap.jsx`    | Illustrative Pakistan delivery network                             |
| `src/styles.css`                    | Tailwind theme, typography, responsive materials and motion        |
| `src/factory/scene.js`              | Three.js scene, cameras, lighting, animation and product studio    |
| `src/factory/machines.js`           | Wash, peel, cutter, fryer and connected food transfers             |
| `src/factory/details.js`            | Weighers, elevators, bagger hardware and secondary movement        |
| `src/factory/packaging.js`          | Front/back printed-film material artwork                           |
| `src/factory/shipping.js`           | Bag pickup, cartons, folding, taping and pallets                   |
| `src/factory/delivery.js`           | Truck, loading dock, cargo doors, road and destination signage     |
| `src/factory/timing.js`             | Shared loop, sealing, carton and truck choreography                |
| `src/factory/geometry.js`           | Organic potatoes, gently curved chips and inflated packaging       |
| `src/factory/surfaces.js`           | Brushed metal, food, belt, paper, wood and perforation textures    |
| `src/factory/audio.js`              | Seven procedural stereo sound layers                               |
| `src/lib/journey.js`                | Camera presets and flavour metadata                                |
| `scripts/prerender.mjs`             | Static React content for production hydration and SEO              |

Copy lives in `src/App.jsx`. Keep flavour metadata, procedural printed artwork and `public/packs/` vector artwork aligned when changing the collection.

## Revision notes

This revision completes the React/Tailwind page and integrates the truck into the live scene API. It refines chip proportions, guarded transfers, fryer visibility, brushed steel, bag surfaces, carton loading and readable captions.

**At the owner's request, no QA, local production build, browser preview, screenshots or audio review were performed for this final revision.** The existing GitHub workflow remains available and runs its standard checks on pushes. Its React suite has been migrated away from the retired imperative controller. Source implementation is not a claim of visual perfection or verified runtime behaviour.

The factory is an original portfolio interpretation, not a manufacturing simulation. All motion repeats on a 16-second clock. Bag cycles last two seconds and carton cycles eight seconds; the three lanes are phase-offset. The truck loads, closes, departs and returns on the same periodic clock.

Three.js, React, Vite and Tailwind CSS are MIT licensed. Instrument Serif and DM Sans use the SIL Open Font License; font license files are in `docs/licenses/`. No stock audio, remote models or paid assets are required.
