import ndarray from 'ndarray';
import fill from 'ndarray-fill';
import SimplexNoise from 'simplex-noise';
import Alea from 'alea';
import zoomableNoise from '../utils/zoomableNoise';
import { levels } from 'mapgen/levels';
import { BIOMES } from '../mapgen/biomes';


function makeHeightmap(options) {
  const { seed, size, level, position } = options;
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

self.addEventListener('message', event => {
  console.time('Making terrain map');
  let array: ndarray = makeHeightmap(event.data);

  (self as any).postMessage(array.data);
  console.timeEnd('Making terrain map');
});