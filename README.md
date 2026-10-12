# CRISP — Crafted for the crunch.

An original potato-chip brand and factory experience by Hamza Aftab. Built with Python-generated assets, JavaScript, Three.js and Vite. No Blender is required. Architecture, machines, food, packaging, vehicles, textures, animation and sound are created in code.

## The factory

The original landing-page structure is preserved: a factory overview, six scroll-led chapters beside a sticky 3D view, the single-pack flavour collection, and the craft and creator sections.

The scene now includes a fenced factory campus, receiving yard, security cabin and gate, production building with an architectural roof cutaway, washable partitions, structural columns, utilities, marked aisles, drains, warehouse racks, raised dispatch dock, truck apron and connecting road. Static geometry is combined by material; vehicle assemblies retain only the joints that need independent movement.

The process moves through metered receiving, filtered washing, eight abrasive peeling rollers, an enclosed centrifugal slicer, slice rinsing, continuous frying, draining and cooling, three flavour drums, elevated weighing, film forming, sealing, inspection and carton packing. Blue, teal and graphite frames contrast with stainless food-contact surfaces and three flavour colours. Procedural aggregate, paint, brushed metal, food skin, kraft paper and wood give the surfaces different responses to light.

The collection uses 180 g concept family bags. Printed front and back film, sealed edges, folds and rounded volume share the same artwork across the production line and product view. Eight bags fill each carton over a sixteen-second case cycle. Flaps close, tape advances and a second vacuum carriage transfers finished cartons to staging pallets.

Dispatch includes a cab-over rigid box truck with a sculpted cab, open window apertures, wheel-arch cutouts, steering pivots, treaded tyres, rear dual wheels, wipers, mirrors, glazing, lights, chassis rails, hinged rear doors and pallet loads. The receiving tipper carries a textured mound of potatoes with varied shapes and skin colours, a top-hinged tailgate and moving hydraulic rams. Potatoes fall onto the powered receiving elevator while its bed tips. The outbound truck arrives, stops in staging, unlocks and opens two rear doors outward to 270 degrees against the body, reverses, secures at the dock, connects the bridge and receives two forklift-carried pallets. After loading, the bridge retracts and the sectional dock door follows its overhead track closed. The restraint releases, the truck pulls clear to a separate stop, then the cargo leaves close and latch before road departure. The arrival and exit use separate road lanes and explicit tangent-continuous road arcs. Turning aprons are widened, posts sit outside the vehicle paths and the receiving driveway is clear of raised walkways. Wheel rotation follows signed travel distance; front wheels use separate inner and outer steering angles with eased steering movement. The receiving vehicle turns, reverses into position, unloads and leaves without changing heading abruptly. The checkpost stands across the road, away from the truck apron. Both trucks reset outside the factory perimeter.

Python generates six irregular chip shapes with paired raw and cooked surfaces, plus simplified meshes for distant views. Raw slices are approximately 1.45 mm thick at the scene food scale. The same slices curl and turn golden as they move through the oil. Chip slices spend sixteen presentation seconds in the fryer, with four-times-slower metering paddles. Soft moisture vapour rises towards the extraction hood, the chimney emits a light plume, small oil rings expand and restrained warm light sits under the hood. Chip slices have broad, thin oval faces, irregular edges, saddle curl, small blisters and toasted rims. Conveyor rotations keep their broad faces visible. The fryer is an open insulated tank: amber rippling oil is exposed above its submerged mesh, with small bubbles and a visible oil-level sight glass. Liquid surfaces retain local coordinates during geometry batching so their shader ripples move vertically.

## Animation and sound

Machine animation repeats every sixteen seconds. Logistics and the overview drone tour repeat every ninety-six seconds. Scroll position chooses the process camera, while the delivery chapter follows the truck as it moves. Reduced-motion preferences, pause controls, camera inspection and offscreen suspension remain available.

Original procedural stereo sound includes water, slicing, frying, tumbling, packing, optional music and a separate ninety-six-second truck/dock/forklift stem. Audio uses the same elapsed-time clock as the scene. Each stem starts at its corresponding loop offset; source events align with sealing, loading, dock and door actions. Audio generation runs in a Web Worker, transferring completed sample buffers back to the main thread. A yielding fallback remains for restricted browsers. Camera-relative stereo positions, distance attenuation and filtering follow the active machinery. Sound starts only after a visitor enables it.

The first-paint and WebGL fallback image is a code-built SVG campus illustration. The interactive view uses real 3D geometry. No remote models, video backgrounds, stock recordings or paid assets are required.

## Render detail

2K is the single rendering mode on desktop and mobile, targeting a 2560 × 1440 drawing buffer even when the visible canvas is smaller. GPU limits and the canvas aspect ratio still apply. Adaptive scaling can reduce that target by at most twenty percent, preserving a much higher detail floor than the former native-pixel/55% policy. Desktop targets sixty frames per second using stable frame deadlines across monitor refresh rates. Sustained slow frames first reduce workload within the detail floor, then settle at thirty frames per second on slower devices. Mobile targets thirty. FXAA is bypassed when supersampling already smooths the edges. The quality switch remains removed, and an adaptive resize is redrawn before the browser paints the cleared canvas.

The loading screen renders the same sculpted pouch geometry, front/back printed materials and shared product pose used by “Pick your pack”. It presents one Golden Sea Salt packet with the production chip meshes, soft lighting and a restrained tilt. The previous SVG packet stack, falling-chip overlays and sealing jaws have been removed. The loader keeps animating while the factory assembles, with a gentle packet turn, floating chip accents and a breathing light halo. It renders at 2× or higher sampling for clearer artwork, then stops and disposes its resources after the reveal. Skip, Escape, reduced motion, timeout and failure exits remain available.

The previous desktop configuration forced UHD-sized buffers, multisampled HDR, 4096-pixel shadow maps and a second full-scene SSAO geometry pass. Mobile avoided much of that cost. The new renderer removes the SSAO and MSAA passes, halves bloom targets, updates tighter 2048/1024 shadow maps at 30/15 Hz, and stops bloom at the lowest budgets. HDR tone mapping, FXAA, metal reflections, Python-baked surface maps and printed bag artwork remain.

Spatial material batches let close-up cameras cull distant equipment. Food-flow and seasoning meshes use 210 vertices per chip at distant camera ranges and 738 for close views. Small hardware uses fewer bevel segments; continuous surfaces retain smooth normals. Conveyor contents and bounded effects skip updates when outside the view. The raw truck keeps its visible potato surface and replaces buried duplicate geometry with the existing filled bed. The QHD drawing-buffer ceiling uses about 44 percent of the pixels of a UHD frame; total GPU savings depend on the visible scene and device.

Camera controls provide zoom in, zoom out and reset. Inspection also supports wheel zoom, +/− and 0; page scrolling stays available outside inspection. Zoom eases smoothly while the animation is paused and respects camera limits. Changing between the factory and product view resets zoom.

Process accents include water jets and surface rings, peel strips in the waste drain, slicing/rinse motion, hood and cooling vapour, amber oil convection, flavour-coloured seasoning grains and packing photoeye signals. Effects use small instance/point batches. New details include enamel finish, pressure/temperature dial faces, cab roof fairings, tank straps, door seals/hinges, turn signals and reverse lamps.

## Development and Vercel

```sh
npm ci
npm run dev
```

Node.js 24 is required. Generated assets are checked in, so deployment does not need Python. To regenerate them locally:

```sh
python3 -m pip install -r tools/requirements.txt
npm run assets:generate
```

The deterministic Python generator creates raw/cooked food geometry at two detail levels and tileable normal/roughness maps. All assets and sounds are original code-generated content.

 Open the local Vite URL through a web server; ES modules cannot run by opening the HTML file directly.

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
| `src/factory/effects.js`       | Bounded wash, peel, vapour and packing accents        |
| `src/factory/render-budget.js` | Adaptive drawing-buffer budget and zoom limits        |
| `src/factory/batching.js`      | Rigid animated-assembly batching                      |
| `src/factory/machines.js`      | Preparation, cutting, frying and transfers            |
| `src/factory/details.js`       | Weighing, guarding and machine details                |
| `src/factory/shipping.js`      | Eight-bag cartons and pallet transfer                 |
| `src/factory/packaging.js`     | Printed front and back bag materials                  |
| `src/factory/geometry.js`      | Food and bag geometry                                 |
| `src/factory/surfaces.js`      | Procedural surface textures                           |
| `src/factory/timing.js`        | Machine, case and logistics phases                    |
| `src/factory/audio.js`         | Synchronized playback and spatial mixing              |
| `src/factory/audio-synthesis.js` | Pure procedural sound generation                     |
| `src/factory/audio-worker.js`  | Sound preparation away from the render thread         |
| `src/factory/industrial.js`    | Oil skid, service connections, drainage and inspection |
| `src/factory/food-material.js` | Continuous peeling and frying transformations         |
| `tools/generate_factory_assets.py` | Reproducible Python geometry and surface generator |
| `src/factory/scene.js`         | Rendering, camera, controls and animation integration |

## Revision status

This revision preserves the six scroll chapters, zoom, fixed 2K rendering, drone overview and ninety-six-second logistics cycle. It adds Python food meshes and surface maps, progressive peeling/cooking, linked rollers, horizontal-motion distribution trays, a plate heat-exchanger/filter/pump skid, drain returns and oil drips, radial weighing gates, a continuous film web, correctly sized formed bags and their gravity discharge, packet inspection, and corrected carton fill heights. Cargo doors fold outside the body and close only after the truck clears the dock. The tipper load empties down to the bed floor; forklift wheels roll with travel.

The focused source checks cover geometry, docking interlocks, sound timing, controls and adaptive rendering; the production build packages the worker and generated assets. Focused source checks and build validation were performed; target-desktop GPU frame rate and audio listening were not measured. 2K is a QHD drawing-buffer target; actual frame rate depends on the device.

This is an original portfolio interpretation with fictional packaging and delivery routes, rather than a manufacturing digital twin. Production rates, vehicle travel and handling choreography are compressed for the animation. The site does not process orders.

Mechanism references: [Vanmark's roller peeler](https://www.vanmark.com/en-us/Equipment/All-Equipment/Peeler-Scrubber-Washer-2920-2922), [Urschel's Model CC](https://www.urschel.com/cutting-machines/model-cc-slicer/), [Heat and Control's chip fryer](https://www.heatandcontrol.com/model/potato-chip-fryer), [integrated seasoning](https://www.heatandcontrol.com/products/on-machine-seasoning), [Ishida snack packaging](https://www.ishidaeurope.com/en/integrated-solutions/snacks-packaging/integrated-snack-packaging-systems/), [Isuzu's FVR proportions](https://isuzu-intl.com/f-series-model-mena/fvr-mena/), and [ASSA ABLOY docking equipment](https://www.assaabloyentrance.com/global/en/solutions/products/loading-dock-equipment). Manufacturer models, logos and audio were not copied.

Three.js is MIT licensed. Instrument Serif and DM Sans use the SIL Open Font License. License texts remain in `docs/licenses/`.


The final performance pass uses stable render deadlines, one composed render per frame even when adapting resolution, reduced shadow cadence on slower devices, dynamic conveyor instance buffers and asynchronous shader warmup before reveal. Unused SVG loader chips, their generator, the former poster, the unused relief export and unused material clones have been removed. The loader remains animated during assembly, with sharper supersampled packet artwork, a gentle turn, floating chips and restrained light motion. Focused tests cover monitor refresh cadences, stalls, quality limits, UI flows and loader lifecycle; frame rate on the owner's desktop GPU has not been measured.
