import ndarray from 'ndarray';
import ops from 'ndarray-ops';
import SimplexNoise from 'simplex-noise';
import fill from 'ndarray-fill';
import Alea from 'alea';
import { levels } from 'mapgen/levels';
import zoomableNoise from '../utils/zoomableNoise';
import { BIOMES } from '../mapgen/biomes';
import { registerPromiseWorker } from 'utils/workerUtils';
import * as ACTIONS from './workerActions';


function makeWorldHeightmap(options) {
  const { seed, size } = options;
  const heightmap = ndarray(new Uint8ClampedArray(size * size), [size, size]);

  const rng = new Alea(seed);
  const simplex = new SimplexNoise(rng);
  const noise = (nx, ny) => simplex.noise2D(nx, ny);
  const levelOptions = {
    numIterations: 5,
    persistence: 0.6,
    initFrequency: 2,
  };

  fill(heightmap, (x, y) => {
    const nx = x;
    const ny = y;
    return zoomableNoise(noise)(levelOptions)(nx / size + 0.5, ny / size + 0.5) * 255;
  });
  return heightmap;
}

// world heightmap used to determine where to place rivers
let worldHeightMap: ndarray;
// larger zoomed in version of the world heightmap
let regionalHeightMap: ndarray;
// marks where river are in the regional map
let regionalRiverMap: ndarray;
let regionalBiomeMap

// stats
let heightMin: number;
let heightMax: number;

async function init(settings) {
  // generate world heightmap
  worldHeightMap = makeWorldHeightmap(settings);
  heightMin = ops.inf(worldHeightMap);
  heightMax = ops.sup(worldHeightMap);
  // determine costal cells

  // pick river source cells
  // run river algorithm on source cells


  return {
    worldHeightMap: worldHeightMap.data.slice(),
  };
}

function generateChunk(chunk) {

}

registerPromiseWorker(async message => {
  switch (message.type) {
    case ACTIONS.WORLD_INIT: {
      return await init(message.payload);
    };
    case ACTIONS.GENERATE_CHUNK: {
      return await generateChunk(message.payload);
    }
  }
});