# CRISP — Crafted for the crunch.

An original potato-chip brand and factory experience by Hamza Aftab. Built with JavaScript, Three.js and Vite. Architecture, machines, food, packaging, vehicles, textures, animation and sound are created in code.

## The factory

The original landing-page structure is preserved: a factory overview, six scroll-led chapters beside a sticky 3D view, the single-pack flavour collection, and the craft and creator sections.

The scene now includes a fenced factory campus, receiving yard, security cabin and gate, production building with an architectural roof cutaway, washable partitions, structural columns, utilities, marked aisles, drains, warehouse racks, raised dispatch dock, truck apron and connecting road. Static geometry is combined by material; vehicle assemblies retain only the joints that need independent movement.

The process moves through metered receiving, filtered washing, eight abrasive peeling rollers, an enclosed centrifugal slicer, slice rinsing, continuous frying, draining and cooling, three flavour drums, elevated weighing, film forming, sealing, inspection and carton packing. Blue, teal and graphite frames contrast with stainless food-contact surfaces and three flavour colours. Procedural aggregate, paint, brushed metal, food skin, kraft paper and wood give the surfaces different responses to light.

The collection uses 180 g concept family bags. Printed front and back film, sealed edges, folds and rounded volume share the same artwork across the production line and product view. Eight bags fill each carton over a sixteen-second case cycle. Flaps close, tape advances and a second vacuum carriage transfers finished cartons to staging pallets.

Dispatch includes a cab-over rigid box truck with a sculpted cab, open window apertures, wheel-arch cutouts, steering pivots, treaded tyres, rear dual wheels, wipers, mirrors, glazing, lights, chassis rails, hinged rear doors and pallet loads. The receiving tipper carries a textured mound of potatoes with varied shapes and skin colours, a top-hinged tailgate and moving hydraulic rams. Potatoes fall onto the powered receiving elevator while its bed tips. The outbound truck arrives, manoeuvres, reverses, secures at the dock, opens its doors, connects the bridge, receives two forklift-carried pallets, closes up and departs. The arrival and exit use opposite road lanes and arc-length path sampling. Wheel rotation follows signed travel distance. The receiving vehicle turns, reverses into position, unloads and leaves without changing heading abruptly. The checkpost stands across the road, away from the truck apron. Both trucks reset outside the factory perimeter.

Chip slices have broad, thin oval faces, irregular edges, saddle curl, small blisters and toasted rims. Conveyor rotations keep their broad faces visible. The fryer is an open insulated tank: amber rippling oil is exposed above its submerged mesh, with small bubbles and a visible oil-level sight glass. Liquid surfaces retain local coordinates during geometry batching so their shader ripples move vertically.

## Animation and sound

Machine animation repeats every sixteen seconds. Logistics and the overview drone tour repeat every sixty-four seconds. Scroll position chooses the process camera, while the delivery chapter follows the truck as it moves. Reduced-motion preferences, pause controls, camera inspection and offscreen suspension remain available.

Original procedural stereo sound includes water, slicing, frying, tumbling, packing, optional music and a separate sixty-four-second truck/dock/forklift stem. Audio uses the same elapsed-time clock as the scene. Each stem starts at its corresponding loop offset; source events align with sealing, loading, dock and door actions. Audio generation yields between stems so preparation does not happen in one uninterrupted block. Sound starts only after a visitor enables it.

The first-paint and WebGL fallback image is a code-built SVG campus illustration. The interactive view uses real 3D geometry. No remote models, video backgrounds, stock recordings or paid assets are required.

## Development and Vercel

```sh
npm ci
npm run dev
```

Node.js 24 is required. Open the local Vite URL through a web server; ES modules cannot run by opening the HTML file directly.

| Setting               | Value           |
| --------------------- | --------------- |
| Framework             | Vite            |
| Root directory        | Repository root |
| Install               | `npm ci`        |
| Build                 | `npm run build` |
| Output                | `dist`          |
| Environment variables | None            |

The Git repository is `hamzaaftab325-eng/potato-factory-`; the production branch is `main`. Existing Vercel configuration and response headers are preserved. The known site URL is https://potato-factory.vercel.app/.

## Source guide

| File                       | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `index.html`               | Page content and six scroll chapters                  |
| `src/lib/page.js`          | Scroll, navigation, collection and controls           |
| `src/lib/journey.js`       | Camera presets and flavour definitions                |
| `src/factory/campus.js`    | Architecture, trucks, dock, forklift and drone tour   |
| `src/factory/batching.js`  | Rigid animated-assembly batching                      |
| `src/factory/machines.js`  | Preparation, cutting, frying and transfers            |
| `src/factory/details.js`   | Weighing, guarding and machine details                |
| `src/factory/shipping.js`  | Eight-bag cartons and pallet transfer                 |
| `src/factory/packaging.js` | Printed front and back bag materials                  |
| `src/factory/geometry.js`  | Food and bag geometry                                 |
| `src/factory/surfaces.js`  | Procedural surface textures                           |
| `src/factory/timing.js`    | Machine, case and logistics phases                    |
| `src/factory/audio.js`     | Synchronized original sound stems                     |
| `src/factory/scene.js`     | Rendering, camera, controls and animation integration |

## Revision status

The factory-campus upgrade and focused slice, fryer and vehicle refinements are implemented in source. The six scroll chapters, page layout, packing choreography and sound timing are preserved. No preview, production build, automated tests, visual QA or audio listening review was run for this revision, at the owner's request. Deployment and runtime behaviour are unverified.

This is an original portfolio interpretation with fictional packaging and delivery routes, rather than a manufacturing digital twin. Production rates, vehicle travel and handling choreography are compressed for the animation. The site does not process orders.

Mechanism references: [Vanmark's roller peeler](https://www.vanmark.com/en-us/Equipment/All-Equipment/Peeler-Scrubber-Washer-2920-2922), [Urschel's Model CC](https://www.urschel.com/cutting-machines/model-cc-slicer/), [Heat and Control's chip fryer](https://www.heatandcontrol.com/model/potato-chip-fryer), [integrated seasoning](https://www.heatandcontrol.com/products/on-machine-seasoning), [Ishida snack packaging](https://www.ishidaeurope.com/en/integrated-solutions/snacks-packaging/integrated-snack-packaging-systems/), [Isuzu's FVR proportions](https://isuzu-intl.com/f-series-model-mena/fvr-mena/), and [ASSA ABLOY docking equipment](https://www.assaabloyentrance.com/global/en/solutions/products/loading-dock-equipment). Manufacturer models, logos and audio were not copied.

Three.js is MIT licensed. Instrument Serif and DM Sans use the SIL Open Font License. License texts remain in `docs/licenses/`.
