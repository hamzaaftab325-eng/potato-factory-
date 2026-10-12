#!/usr/bin/env python3
"""Bake deterministic factory assets with Python. No Blender or network required.

Run from any directory: python3 tools/generate_factory_assets.py
Requires numpy and Pillow; generated assets are committed, so Vercel only needs Node.
Geometry uses metres before the established miniature scene's 0.33 food scale.
"""
from pathlib import Path
import base64
import json
import math
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/factory/generated"
OUT.mkdir(parents=True, exist_ok=True)
RNG = np.random.default_rng(1802026)
TAU = math.tau


def encode(values, dtype="<f4"):
    return base64.b64encode(np.asarray(values, dtype=dtype).tobytes()).decode("ascii")


def normals(positions, indices):
    p = np.asarray(positions, dtype=np.float64)
    n = np.zeros_like(p)
    for a, b, c in indices:
        face = np.cross(p[b] - p[a], p[c] - p[a])
        n[a] += face
        n[b] += face
        n[c] += face
    lengths = np.linalg.norm(n, axis=1)
    n[lengths > 1e-12] /= lengths[lengths > 1e-12, None]
    n[lengths <= 1e-12] = [0, 0, 1]
    return n


def chip(variant, segments=40, rings=8):
    positions, raw, uv, colour, indices = [], [], [], [], []
    phase = variant * 0.731
    blisters = [(RNG.uniform(-.1, .1), RNG.uniform(-.08, .08),
                 RNG.uniform(.004, .012), RNG.uniform(.0004, .002)) for _ in range(18)]
    stride = (rings + 1) * (segments + 1)
    for side in range(2):
        for ring in range(rings + 1):
            r = ring / rings
            for j in range(segments + 1):
                a = j / segments * TAU
                outline = 1 + .047 * math.sin(3*a+phase) + .021 * math.cos(7*a-phase)
                x = .157 * r * math.cos(a) * outline
                y = (.129 + .004*math.sin(phase)) * r * math.sin(a) * outline
                thickness = .0022 * (1 if side == 0 else -1)
                bend = (.013 + .004*math.sin(phase)) * (x/.157)**2
                bend -= (.009 + .004*math.cos(phase)) * (y/.133)**2
                bend += .01 * math.sin(3*a+phase) * r**5
                bend += .004 * math.sin(x*21+y*13+phase) * r
                for bx, by, radius, height in blisters:
                    bend += height * math.exp(-((x-bx)**2+(y-by)**2)/(radius*radius))
                positions.append([x, y, bend + thickness])
                raw.append([x, y, thickness + .0006*math.sin(x*19+y*11)])
                uv.append([x/.35+.5, y/.3+.5])
                rim = r**12
                mottled = .965 + .035*math.sin(x*143+phase)*math.cos(y*129)
                colour.append([mottled, mottled*(1-.1*rim), mottled*(1-.2*rim)])
        for ring in range(rings):
            for j in range(segments):
                a = side*stride+ring*(segments+1)+j
                c = a+segments+1
                indices.extend([[a,c,c+1],[a,c+1,a+1]] if side == 0 else
                               [[a,c+1,c],[a,a+1,c+1]])
    for j in range(segments):
        a = rings*(segments+1)+j
        b = a+stride
        indices.extend([[a,b,a+1],[a+1,b,b+1]])
    n = normals(positions, indices)
    rn = normals(raw, indices)
    # Weld coincident polar centres and UV seams for smooth specular highlights.
    for side in range(2):
        first = side*stride
        n[first:first+segments+1] = [0, 0, 1 if side == 0 else -1]
        rn[first:first+segments+1] = [0, 0, 1 if side == 0 else -1]
        for ring in range(1, rings+1):
            a = first+ring*(segments+1)
            for array in [n, rn]:
                avg = array[a]+array[a+segments]
                avg /= max(np.linalg.norm(avg), 1e-12)
                array[a] = array[a+segments] = avg
    return {"position": encode(positions), "normal": encode(n),
            "rawPosition": encode(raw), "rawNormal": encode(rn),
            "uv": encode(uv), "color": encode(colour), "index": encode(indices, "<u2")}


def smooth_noise(size, cells):
    grid = RNG.random((cells, cells))
    coord = np.arange(size)*cells/size
    lo = coord.astype(int)
    u = coord-lo
    u = u*u*(3-2*u)
    a = grid[lo[:,None],lo[None,:]]
    b = grid[lo[:,None],(lo[None,:]+1)%cells]
    c = grid[(lo[:,None]+1)%cells,lo[None,:]]
    d = grid[(lo[:,None]+1)%cells,(lo[None,:]+1)%cells]
    return (a*(1-u[None,:])+b*u[None,:])*(1-u[:,None]) + (c*(1-u[None,:])+d*u[None,:])*u[:,None]


def save_gray(name, pixels):
    Image.fromarray(np.uint8(np.clip(pixels, 0, 1)*255)).save(OUT / name, optimize=True)


def surface_maps():
    size = 512
    y,x = np.mgrid[0:size,0:size]/size
    height = .45 + .05*smooth_noise(size,32) + .018*smooth_noise(size,96)
    for _ in range(160):
        cx,cy = RNG.random(2)
        radius = RNG.uniform(.003,.025)
        dx = np.minimum(abs(x-cx),1-abs(x-cx))
        dy = np.minimum(abs(y-cy),1-abs(y-cy))
        height += RNG.uniform(.02,.16)*np.exp(-(dx*dx+dy*dy)/(radius*radius))
    save_gray("chip-relief.png", height)
    save_gray("chip-roughness.png", .68-.22*height+.04*smooth_noise(size,48))
    dy,dx = np.gradient(height)
    vec = np.stack([-dx*12,-dy*12,np.ones_like(dx)],axis=-1)
    vec /= np.linalg.norm(vec,axis=-1)[...,None]
    Image.fromarray(np.uint8((vec*.5+.5)*255)).save(OUT / "chip-normal.png", optimize=True)
    grain = RNG.uniform(.62,.88,(size,1)) + .04*smooth_noise(size,64)
    save_gray("steel-roughness.png", grain)
    save_gray("rubber-roughness.png", .81+.10*smooth_noise(size,72))


def loader_chips(meshes):
    """Project the production meshes into small, resolution-independent loader assets."""
    target = ROOT / "public/loader"
    target.mkdir(parents=True, exist_ok=True)
    for variant, mesh in enumerate(meshes[:3]):
        positions = np.frombuffer(base64.b64decode(mesh["position"]), dtype="<f4").reshape(-1, 3)
        edge = positions[8 * 41:9 * 41]
        def projected(p):
            return (90 + (p[0] + p[2]*.3)*445, 65 + (-p[1]*.83 + p[2]*.65)*445)
        outline = "M" + " L".join(f"{x:.2f},{y:.2f}" for x,y in map(projected, edge)) + "Z"
        local = np.random.default_rng(1802026 + variant)
        blisters = "".join(f'<ellipse cx="{x:.2f}" cy="{y:.2f}" rx="{r:.2f}" ry="{r*.65:.2f}" fill="#b57828" opacity=".24"/>'
                           for x,y,r in zip(local.uniform(25,155,55),local.uniform(25,105,55),local.uniform(.4,1.5,55)))
        ridge = "M" + " L".join(f"{x:.2f},{y:.2f}" for x,y in map(projected,positions[::41][:9]))
        (target/f"chip-{variant}.svg").write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="180" height="130" viewBox="0 0 180 130"><defs><radialGradient id="gold" cx=".36" cy=".32" r=".72"><stop stop-color="#ffedb9"/><stop offset=".55" stop-color="#ecc569"/><stop offset=".86" stop-color="#d9a044"/><stop offset="1" stop-color="#ae6f28"/></radialGradient><clipPath id="slice"><path d="{outline}"/></clipPath></defs><path d="{outline}" fill="#9a6125" transform="translate(0 1.6)"/><path d="{outline}" fill="url(#gold)" stroke="#bd8334" stroke-width="1.1"/><g clip-path="url(#slice)">{blisters}<path d="{ridge}" fill="none" stroke="#fff1b4" stroke-width="1.2" opacity=".4"/></g></svg>''')


def main():
    meshes = [chip(i) for i in range(6)]
    data = {"version": 1, "seed": 1802026, "foodScale": .33,
            "rawThicknessMetres": .0044*.33, "chips": meshes,
            "chipsLow": [chip(i, 20, 4) for i in range(6)]}
    (OUT / "food-assets.js").write_text(
        "// Generated by tools/generate_factory_assets.py. Do not hand-edit.\n"
        + "export default " + json.dumps(data,separators=(",", ":")) + ";\n")
    surface_maps()
    loader_chips(meshes)
    print(f"Generated {len(meshes)} paired raw/cooked chip meshes and five surface maps.")


if __name__ == "__main__":
    main()
