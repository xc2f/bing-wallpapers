# World outlines

`world.json` contains the Natural Earth 1:110m admin-0 country outlines, with coordinates rounded to two decimal places and properties removed.

Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
License: public domain (https://www.naturalearthdata.com/about/terms-of-use/).

`lib/country-coordinates.json` uses Natural Earth's label points, supplemented with representative coordinates for small island regions absent from this scale. These locate country/region collections, not the individual photographed subjects. Map outlines are for browsing and do not express a position on boundaries.

## Satellite appearance

`earth-day.jpg`: Three.js example Earth texture, downloaded from https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg. The texture includes land, ocean and cloud imagery. It is a global image, not live satellite tiles. The globe is rendered locally with Three.js; no Google Earth API is used.


## High resolution surface

`earth-day-8k.jpg`: 8192 × 4096 Earth day map by Solar System Scope, licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Source: https://www.solarsystemscope.com/textures/ . Download mirror: https://media.huira.space/data/textures/solar_system/8k_earth_daymap.jpg . The 8K image is unchanged. `earth-day-4k.jpg` is a resized 4096 × 2048 derivative for smaller screens and GPUs. These cloud-free images replace the previous 2K texture for clearer terrain and coastlines.

## Surface relief, ocean reflections and clouds

`earth-normal.jpg` and `earth-specular.jpg` are the Earth normal and specular textures from the Three.js official examples: https://threejs.org/examples/textures/planets/earth_normal_2048.jpg and https://threejs.org/examples/textures/planets/earth_specular_2048.jpg . They add shading relief and ocean-only highlights; they do not alter terrain geometry.

`earth-clouds.webp` is the extracted alpha channel of `fair_clouds_4k.png` from https://github.com/turban/webgl-earth/blob/master/images/fair_clouds_4k.png (the public Earth visualization example). It is used as a cloud coverage mask for both a separate elevated cloud sphere and sun-projected cloud shadows. The mask is static source imagery with simulated drift, not live weather. Attribution: original Earth imagery NASA / Visible Earth; example by turban/webgl-earth.

`earth-day-preview.jpg`: 1024 × 512 compressed derivative of the Solar System Scope 8K day map (same CC BY 4.0 attribution above). Preloaded for the first frame; the 4K/8K surface and optional cloud/relief maps load after the globe is visible.

## Full-sky star background

`nasa-starmap-2k.webp` (2048 × 1024) and `nasa-starmap-4k.webp` (4096 × 2048): derivatives of NASA SVS **Deep Star Maps 2020**, celestial-coordinate plate carrée projection. Source: https://svs.gsfc.nasa.gov/4851/ ; original: https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/starmap_2020_4k.exr . Linear HDR RGB was clipped to the display range, converted to sRGB and compressed to WebP for web delivery. Loaded locally at low priority after the globe appears. The full sphere supports continuous slow movement without a photograph's crop boundaries.

Credit: NASA/Goddard Space Flight Center Scientific Visualization Studio. Gaia DR2: ESA/Gaia/DPAC. Media usage guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/ .
