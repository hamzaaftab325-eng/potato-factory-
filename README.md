# CRISP — Crafted for the crunch.

An original potato-chip brand and factory experience by Hamza Aftab. Built with JavaScript, Three.js and Vite. Architecture, machines, food, packaging, vehicles, textures, animation and sound are created in code.

## The factory

The original landing-page structure is preserved: a factory overview, six scroll-led chapters beside a sticky 3D view, the single-pack flavour collection, and the craft and creator sections.

The scene now includes a fenced factory campus, receiving yard, security cabin and gate, production building with an architectural roof cutaway, washable partitions, structural columns, utilities, marked aisles, drains, warehouse racks, raised dispatch dock, truck apron and connecting road. Static geometry is combined by material; vehicle assemblies retain only the joints that need independent movement.

The process moves through metered receiving, filtered washing, eight abrasive peeling rollers, an enclosed centrifugal slicer, slice rinsing, continuous frying, draining and cooling, three flavour drums, elevated weighing, film forming, sealing, inspection and carton packing. Blue, teal and graphite frames contrast with stainless food-contact surfaces and three flavour colours. Procedural aggregate, paint, brushed metal, food skin, kraft paper and wood give the surfaces different responses to light.

The collection uses 180 g concept family bags. Printed front and back film, sealed edges, folds and rounded volume share the same artwork across the production line and product view. Eight bags fill each carton over a sixteen-second case cycle. Flaps close, tape advances and a second vacuum carriage transfers finished cartons to staging pallets.

Dispatch includes a cab-over rigid box truck with a sculpted cab, open window apertures, wheel-arch cutouts, steering pivots, treaded tyres, rear dual wheels, wipers, mirrors, glazing, lights, chassis rails, hinged rear doors and pallet loads. The receiving tipper carries a textured mound of potatoes with varied shapes and skin colours, a top-hinged tailgate and moving hydraulic rams. Potatoes fall onto the powered receiving elevator while its bed tips. The outbound truck arrives, stops in staging, unlocks and opens two rear doors outward to 180 degrees, reverses, secures at the dock, connects the bridge and receives two forklift-carried pallets. The bridge retracts, each leaf closes and the handles latch before a departure interlock permits the truck to move. The arrival and exit use separate road lanes and explicit tangent-continuous road arcs. Turning aprons are widened, posts sit outside the vehicle paths and the receiving driveway is clear of raised walkways. Wheel rotation follows signed travel distance; front wheels use separate inner and outer steering angles with eased steering movement. The receiving vehicle turns, reverses into position, unloads and leaves without changing heading abruptly. The checkpost stands across the road, away from the truck apron. Both trucks reset outside the factory perimeter.

Chip slices spend sixteen seconds in the fryer, with four-times-slower metering paddles. Soft moisture vapour rises towards the extraction hood, the chimney emits a light plume, small oil rings expand and restrained warm light sits under the hood. Chip slices have broad, thin oval faces, irregular edges, saddle curl, small blisters and toasted rims. Conveyor rotations keep their broad faces visible. The fryer is an open insulated tank: amber rippling oil is exposed above its submerged mesh, with small bubbles and a visible oil-level sight glass. Liquid surfaces retain local coordinates during geometry batching so their shader ripples move vertically.

## Animation and sound

Machine animation repeats every sixteen seconds. Logistics and the overview drone tour repeat every ninety-six seconds. Scroll position chooses the process camera, while the delivery chapter follows the truck as it moves. Reduced-motion preferences, pause controls, camera inspection and offscreen suspension remain available.

Original procedural stereo sound includes water, slicing, frying, tumbling, packing, optional music and a separate ninety-six-second truck/dock/forklift stem. Audio uses the same elapsed-time clock as the scene. Each stem starts at its corresponding loop offset; source events align with sealing, loading, dock and door actions. Audio generation yields between stems so preparation does not happen in one uninterrupted block. Sound starts only after a visitor enables it.

The first-paint and WebGL fallback image is a code-built SVG campus illustration. The interactive view uses real 3D geometry. No remote models, video backgrounds, stock recordings or paid assets are required.

## Render detail

Desktop starts in 4K detail mode. The drawing buffer targets up to 3840 × 2160, preserving the canvas aspect ratio and respecting GPU texture limits. The 4K/HD control switches to a lighter mode when desired. This is a real-time render ceiling, not an exported 4K video or a guarantee for every screen. Mobile defaults to lighter rendering.

Multisampled HDR scene buffers, 4096-pixel desktop shadow maps, 1024-pixel procedural surface maps, texture anisotropy and half-resolution contact-shadow processing preserve crisp edges without repeating the full ambient-occlusion pass at 4K.

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

| File                           | Purpose                                               |
| ------------------------------ | ----------------------------------------------------- |
| `index.html`                   | Page content and six scroll chapters                  |
| `src/lib/page.js`              | Scroll, navigation, collection and controls           |
| `src/lib/journey.js`           | Camera presets and flavour definitions                |
| `src/factory/campus.js`        | Architecture, trucks, dock, forklift and drone tour   |
| `src/factory/vehicle-paths.js` | Explicit-radius truck route geometry                  |
| `src/factory/effects.js`       | Procedural steam, oil rings and warm fryer light      |
| `src/factory/batching.js`      | Rigid animated-assembly batching                      |
| `src/factory/machines.js`      | Preparation, cutting, frying and transfers            |
| `src/factory/details.js`       | Weighing, guarding and machine details                |
| `src/factory/shipping.js`      | Eight-bag cartons and pallet transfer                 |
| `src/factory/packaging.js`     | Printed front and back bag materials                  |
| `src/factory/geometry.js`      | Food and bag geometry                                 |
| `src/factory/surfaces.js`      | Procedural surface textures                           |
| `src/factory/timing.js`        | Machine, case and logistics phases                    |
| `src/factory/audio.js`         | Synchronized original sound stems                     |
| `src/factory/scene.js`         | Rendering, camera, controls and animation integration |

## Revision status

The factory-campus upgrade, slower frying, vapour effects, truck-clearance routes, outward doors, latching interlock and 4K detail mode are implemented in source. The six scroll chapters, page layout, packing choreography and machine sound timing are preserved. Truck/dock audio follows the longer logistics clock. Source test expectations reflect the new duration; tests were not run. No preview, production build, automated tests, visual QA or audio listening review was run for this revision, at the owner's request. Deployment and runtime behaviour are unverified.

This is an original portfolio interpretation with fictional packaging and delivery routes, rather than a manufacturing digital twin. Production rates, vehicle travel and handling choreography are compressed for the animation. The site does not process orders.

Mechanism references: [Vanmark's roller peeler](https://www.vanmark.com/en-us/Equipment/All-Equipment/Peeler-Scrubber-Washer-2920-2922), [Urschel's Model CC](https://www.urschel.com/cutting-machines/model-cc-slicer/), [Heat and Control's chip fryer](https://www.heatandcontrol.com/model/potato-chip-fryer), [integrated seasoning](https://www.heatandcontrol.com/products/on-machine-seasoning), [Ishida snack packaging](https://www.ishidaeurope.com/en/integrated-solutions/snacks-packaging/integrated-snack-packaging-systems/), [Isuzu's FVR proportions](https://isuzu-intl.com/f-series-model-mena/fvr-mena/), and [ASSA ABLOY docking equipment](https://www.assaabloyentrance.com/global/en/solutions/products/loading-dock-equipment). Manufacturer models, logos and audio were not copied.

Three.js is MIT licensed. Instrument Serif and DM Sans use the SIL Open Font License. License texts remain in `docs/licenses/`.
