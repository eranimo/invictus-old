import ndarray from 'ndarray';
import fill from 'ndarray-fill';
import SimplexNoise from 'simplex-noise';
import Alea from 'alea';
import ops from 'ndarray-ops';
import { find, clamp } from 'lodash';
import zoomableNoise from '../utils/zoomableNoise';
import { levels } from '../constants';
import { BIOMES } from '../mapgen/biomes';


function makeHeightmap(options) {
  const { seed, size, level, position } = options.heightmap;
  const heightmap = ndarray(new Uint8ClampedArray(size * size), [size, size]);

  const rng = new Alea(seed);
  const simplex = new SimplexNoise(rng);
  const noise = (nx, ny) => simplex.noise2D(nx, ny);
  const levelOptions = levels[level];

  fill(heightmap, (x, y) => {
    const nx = (x + position.x) / levelOptions.zoomLevel;
    const ny = (y + position.y) / levelOptions.zoomLevel;
    return zoomableNoise(noise)(levelOptions)(nx / size + 0.5, ny / size + 0.5) * 255;
  });
  return heightmap;
}

function makeRadiation(heightmap, options) {
  const { size, level, position } = options.heightmap;
  const radiation = ndarray(new Float32Array(size * size), [size, size]);
  const levelOptions = levels[level];

  fill(radiation, (x, y) => {
    const ty = (y + position.y) / levelOptions.zoomLevel;
    let altitudeRatio = ty / (size);
    if (altitudeRatio < 0.5) {
      altitudeRatio /= 0.5;
    } else {
      altitudeRatio = (1 - altitudeRatio) / 0.5;
    }
    const height = heightmap.get(x, y);
    const heightRatio = height / 255;
    let rad = ((0.65 * altitudeRatio) + (0.35 * heightRatio));
    return (clamp(rad * 1.1, 0, 0.99) * 65) - 30;
  });
  return radiation;
}

function makeRainfall(options) {
  const { seed, size, level, position } = options.heightmap;
  const rainfall = ndarray(new Float32Array(size * size), [size, size]);

  const levelOptions = levels[level];
  const rng = new Alea(seed * 2);
  const simplex = new SimplexNoise(rng);
  const noise = (nx, ny) => simplex.noise2D(nx, ny);

  fill(rainfall, (x, y) => {
    const nx = (x + position.x) / levelOptions.zoomLevel;
    const ny = (y + position.y) / levelOptions.zoomLevel;
    let ratio = ny / (size);
    if (ratio < 0.5) {
      ratio /= 0.5;
    } else {
      ratio = (1 - ratio) / 0.5;
    }
    const rain1 = zoomableNoise(noise)({
      ...levelOptions,
      high: 400,
      persistence: 0.1,
      maxAmp: 10,
      initFrequency: 35,
    })(nx / size + 0.5, ny / size + 0.5);
    const rain2 = zoomableNoise(noise)({
      ...levelOptions,
      high: 400,
      persistence: 0.3,
      maxAmp: 1,
      initFrequency: 4,
    })(nx / size + 0.5, ny / size + 0.5);
    const rain = rain2 - (rain1 / 1.5); //0.25 * rain2 + 0.75 * rain1;
    return clamp(rain * 7000, 0, 7000);
  });
  return rainfall;
}

/*
factors that go in to biomes:
- rainfall
- temperature
*/
function makeBiomes(heightmap, radiationMap, rainfallMap, options) {
  const { size, sealevel } = options.heightmap;
  const biomeMap = ndarray(new Uint8ClampedArray(size * size), [size, size]);
  fill(biomeMap, (x, y) => {
    const height = heightmap.get(x, y);
    const radiation = radiationMap.get(x, y);
    const rainfall = rainfallMap.get(x, y);
    const type = height < sealevel ? 'water' : 'land';
    const biome = find(BIOMES, (biome => {
      return biome.type === type && biome.test(radiation, rainfall, height, sealevel);
    }));
    if (!biome) {
      throw new Error(`Cannot find biome at (${x}, ${y}) with radiation: ${radiation} and rainfall ${rainfall} at height ${height}`);
    }
    return biome ? BIOMES.indexOf(biome) : 0;
  });
  return biomeMap;
}

self.addEventListener('message', event => {
  const data: any = {};
  console.log(`Made a new ${event.data.heightmap.level} heightmap`);
  const heightmap = makeHeightmap(event.data);
  const radiation = makeRadiation(heightmap, event.data);
  const rainfall = makeRainfall(event.data);
  const biomes = makeBiomes(heightmap, radiation, rainfall, event.data);
  data.heightmap = heightmap.data;
  data.radiation = radiation.data;
  data.rainfall = rainfall.data;
  data.biome = biomes.data;
  data.stats = {
    height: {
      min: ops.inf(heightmap),
      max: ops.sup(heightmap),
    },
    radiation: {
      min: ops.inf(radiation),
      max: ops.sup(radiation),
    },
    rainfall: {
      min: ops.inf(rainfall),
      max: ops.sup(rainfall),
    },
  };
  data.id = Math.round(Math.random() * 1000);
  (self as any).postMessage(data);
});
